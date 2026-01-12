import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  createRateLimitKey,
  createRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate Limiting 체크
    const clientIp = getClientIp(request);
    const rateLimitKey = createRateLimitKey(clientIp, 'login');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.login);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 로그인 실패 시에도 일반적인 에러 메시지 반환 (User Enumeration 방지)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        {
          status: 401,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: data.user,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch {
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
