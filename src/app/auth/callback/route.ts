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
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';

  // OAuth 에러가 있는 경우
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Open Redirect 방지: 허용된 경로만 리다이렉트
  const safeRedirectPath = isValidRedirectPath(next) ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Exchange code error:', exchangeError.message);
      return NextResponse.redirect(
        `${origin}/auth/login?error=exchange_error&message=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (data.session) {
      // 세션이 성공적으로 생성됨
      console.log('OAuth session created for user:', data.session.user.email);
      return NextResponse.redirect(`${origin}${safeRedirectPath}`);
    }
  }

  // code가 없는 경우
  console.error('No code provided in OAuth callback');
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
}
