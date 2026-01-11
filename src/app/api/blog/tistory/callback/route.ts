import { NextRequest, NextResponse } from 'next/server';
import { handleTistoryCallback } from '@/lib/actions/blog';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    const errorUrl = new URL('/onboarding/connect-blog', request.url);
    errorUrl.searchParams.set('error', '티스토리 인증이 거부되었습니다.');
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    const errorUrl = new URL('/onboarding/connect-blog', request.url);
    errorUrl.searchParams.set('error', '인증 코드가 없습니다.');
    return NextResponse.redirect(errorUrl);
  }

  const result = await handleTistoryCallback(code);

  if (!result.success) {
    const errorUrl = new URL('/onboarding/connect-blog', request.url);
    errorUrl.searchParams.set('error', result.error || '티스토리 연결에 실패했습니다.');
    return NextResponse.redirect(errorUrl);
  }

  // Redirect to success page
  const successUrl = new URL('/onboarding/connect-blog', request.url);
  successUrl.searchParams.set('success', 'tistory');
  return NextResponse.redirect(successUrl);
}
