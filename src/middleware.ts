import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { onboardingMiddleware } from '@/lib/middleware/onboarding';

// 보호된 경로 패턴
const PROTECTED_PATHS = ['/onboarding', '/dashboard', '/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 온보딩 경로 처리
  if (pathname.startsWith('/onboarding')) {
    return onboardingMiddleware(request);
  }

  // 기타 보호된 경로는 세션 업데이트
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtectedPath) {
    return updateSession(request);
  }

  // 그 외 경로는 통과
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
