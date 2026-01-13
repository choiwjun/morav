import { NextRequest, NextResponse } from 'next/server';
import { connectWordpress } from '@/lib/actions/blog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogUrl, username, applicationPassword } = body;

    if (!blogUrl || !username || !applicationPassword) {
      return NextResponse.json(
        { error: '블로그 URL, 사용자명, 애플리케이션 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const result = await connectWordpress({
      blogUrl,
      username,
      applicationPassword,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      blogName: result.blog?.blog_name,
    });
  } catch (error) {
    console.error('WordPress connect error:', error);
    return NextResponse.json(
      { error: '워드프레스 연결 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
