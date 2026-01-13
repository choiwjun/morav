import { NextResponse } from 'next/server';
import { connectBlogger } from '@/lib/actions/blog';

export async function POST() {
  try {
    const result = await connectBlogger();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ authUrl: result.url });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: '구글 블로그 연결 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
