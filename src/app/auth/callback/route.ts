import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 허용된 리다이렉트 경로 목록
const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/profile', '/settings', '/'];

function isValidRedirectPath(path: string): boolean {
  // 상대 경로만 허용하고, 외부 URL 및 프로토콜 차단
  if (!path.startsWith('/')) {
    return false;
  }

  // 프로토콜 또는 외부 URL 패턴 차단
  if (path.startsWith('//') || path.includes('://')) {
    return false;
  }

  // 허용된 경로로 시작하는지 확인
  return ALLOWED_REDIRECT_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`)
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Open Redirect 방지: 허용된 경로만 리다이렉트
  const safeRedirectPath = isValidRedirectPath(next) ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${safeRedirectPath}`);
    }
  }

  // 에러 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`);
}
