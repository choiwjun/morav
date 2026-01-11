import { NextResponse } from 'next/server';
import { getRecentKeywords } from '@/lib/actions/keywords';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const category = searchParams.get('category') || undefined;
    const source = (searchParams.get('source') as 'naver' | 'google' | undefined) || undefined;
    const sortBy = searchParams.get('sortBy') || 'recent'; // 'recent' | 'trending'

    const result = await getRecentKeywords(limit, category, source);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // 정렬 처리
    let keywords = result.keywords || [];
    if (sortBy === 'trending') {
      keywords = [...keywords].sort((a, b) => b.trendScore - a.trendScore);
    } else {
      // 최신순은 이미 getRecentKeywords에서 처리됨
      keywords = [...keywords].sort(
        (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
      );
    }

    return NextResponse.json({
      success: true,
      keywords,
      total: result.total,
    });
  } catch (error) {
    console.error('Keywords API error:', error);
    return NextResponse.json(
      { error: '키워드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
