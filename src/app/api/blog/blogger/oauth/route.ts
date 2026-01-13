import { NextResponse } from 'next/server';
import { connectBlogger } from '@/lib/actions/blog';

export async function GET() {
  try {
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
