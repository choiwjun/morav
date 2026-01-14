/**
 * 블로그 발행 타입 정의
 */

export type BlogPlatform = 'blogger' | 'wordpress';

export interface PublishParams {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  visibility?: 'public' | 'private' | 'draft';
  scheduledAt?: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  platform: BlogPlatform;
  publishedAt?: string;
}

export interface BlogCredentials {
  accessToken: string;
  refreshToken?: string;
  blogId?: string;
  blogUrl?: string;
  username?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1초
  maxDelay: 30000, // 30초
};

/**
 * 지수 백오프 딜레이 계산
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
  // 지터 추가 (0-25% 랜덤)
  const jitter = delay * 0.25 * Math.random();
  return Math.floor(delay + jitter);
}

/**
 * 재시도 가능한 에러인지 확인
 */
export function isRetryableError(status: number): boolean {
  // 408: Request Timeout, 429: Too Many Requests, 5xx: Server Errors
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}
