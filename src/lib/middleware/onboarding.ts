import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// 온보딩 경로 패턴
const ONBOARDING_PATHS = ['/onboarding'];

/**
 * 온보딩 미들웨어
 * - 인증되지 않은 사용자를 /auth/login으로 리다이렉트
 * - 인증된 사용자는 온보딩 페이지 접근 허용
 */
export async function onboardingMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 온보딩 경로가 아니면 통과
  const isOnboardingPath = ONBOARDING_PATHS.some((path) => pathname.startsWith(path));
  if (!isOnboardingPath) {
    return NextResponse.next();
  }

  // Supabase 클라이언트 생성
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  // 사용자 인증 상태 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 인증된 사용자는 통과
  return NextResponse.next();
}
