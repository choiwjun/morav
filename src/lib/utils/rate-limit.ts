/**
 * 간단한 메모리 기반 Rate Limiter
 * 프로덕션에서는 Redis 등의 외부 저장소 사용 권장
 */

interface RateLimitRecord {
  count: number;
  firstRequest: number;
}

// 메모리 저장소 (프로세스 재시작 시 초기화됨)
const rateLimitStore = new Map<string, RateLimitRecord>();

// 오래된 레코드 정리를 위한 마지막 정리 시간
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // 1분마다 정리

interface RateLimitConfig {
  windowMs: number;    // 시간 윈도우 (밀리초)
  maxRequests: number; // 윈도우 내 최대 요청 수
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * 기본 Rate Limit 설정
 */
export const RATE_LIMITS = {
  // 로그인 시도: 5회/15분
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  // 회원가입: 3회/시간
  signup: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  },
  // 비밀번호 재설정: 3회/시간
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  },
  // API 일반: 100회/분
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  // 콘텐츠 생성: 10회/시간
  generate: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
} as const;

/**
 * Rate Limit 체크
 * @param key 고유 식별자 (예: IP + 엔드포인트)
 * @param config Rate Limit 설정
 * @returns Rate Limit 결과
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();

  // 주기적으로 오래된 레코드 정리
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldRecords();
    lastCleanup = now;
  }

  const record = rateLimitStore.get(key);

  // 첫 요청이거나 윈도우가 지난 경우
  if (!record || now - record.firstRequest > config.windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
    });

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // 윈도우 내에서 요청 수 체크
  if (record.count >= config.maxRequests) {
    const resetAt = record.firstRequest + config.windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);

    return {
      success: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  // 요청 수 증가
  record.count++;
  rateLimitStore.set(key, record);

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.firstRequest + config.windowMs,
  };
}

/**
 * IP 주소 추출
 */
export function getClientIp(request: Request): string {
  // Vercel/Cloudflare 등의 프록시 헤더 확인
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  return 'unknown';
}

/**
 * Rate Limit 키 생성
 */
export function createRateLimitKey(ip: string, action: string): string {
  return `${action}:${ip}`;
}

/**
 * 오래된 레코드 정리
 */
function cleanupOldRecords(): void {
  const now = Date.now();
  const maxWindowMs = Math.max(...Object.values(RATE_LIMITS).map((r) => r.windowMs));

  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.firstRequest > maxWindowMs) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate Limit 응답 헤더 생성
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
