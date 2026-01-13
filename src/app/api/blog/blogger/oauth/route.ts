import { NextResponse } from 'next/server';
import { connectBlogger } from '@/lib/actions/blog';
import { getAppUrl } from '@/lib/utils/env';

export async function GET() {
  try {
    // 디버깅: 실제 redirect_uri 확인
    const appUrl = getAppUrl();
    const redirectUri = `${appUrl}/api/blog/blogger/callback`;
    console.log('=== Blogger OAuth Debug ===');
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('getAppUrl():', appUrl);
    console.log('redirect_uri:', redirectUri);
    console.log('===========================');

    const result = await connectBlogger();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch (error) {
    console.error('Blogger OAuth error:', error);
    return NextResponse.json({ error: '구글 블로거 연결 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
