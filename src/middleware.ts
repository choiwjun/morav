import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 세션 업데이트가 필요한 경로 패턴
const SESSION_PATHS = ['/dashboard', '/settings', '/onboarding', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 세션 관련 경로는 세션 업데이트 (auth/callback 포함)
  const needsSession = SESSION_PATHS.some((path) => pathname.startsWith(path));
  if (needsSession) {
    return updateSession(request);
  }

  // 그 외 모든 경로는 그냥 통과
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/auth/callback',
  ],
};
