import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 보호된 경로 패턴 (인증 필요)
const PROTECTED_PATHS = ['/dashboard', '/settings', '/onboarding'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 보호된 경로만 세션 업데이트
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtectedPath) {
    return updateSession(request);
  }

  // 그 외 모든 경로는 그냥 통과
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/onboarding/:path*'],
};
