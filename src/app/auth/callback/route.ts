import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

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
    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as CookieOptions)
              );
            } catch {
              // Server Component에서 호출된 경우 무시
            }
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Exchange code error:', exchangeError.message);
      // PKCE 관련 오류인 경우 더 친절한 메시지
      const errorMessage = exchangeError.message.includes('code verifier')
        ? '인증 세션이 만료되었습니다. 다시 로그인해주세요.'
        : exchangeError.message;
      return NextResponse.redirect(
        `${origin}/auth/login?error=exchange_error&message=${encodeURIComponent(errorMessage)}`
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
