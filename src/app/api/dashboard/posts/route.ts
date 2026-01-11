import { NextRequest, NextResponse } from 'next/server';
import { getRecentPosts } from '@/lib/actions/dashboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    // limit 유효성 검증
    if (isNaN(limit) || limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'limit은 1에서 20 사이의 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    const result = await getRecentPosts(limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      posts: result.recentPosts,
    });
  } catch (error) {
    console.error('Dashboard posts API error:', error);
    return NextResponse.json(
      { error: '포스트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
