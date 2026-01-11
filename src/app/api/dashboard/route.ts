import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/actions/dashboard';

export async function GET() {
  try {
    const result = await getDashboardData();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
      recentPosts: result.recentPosts,
      subscription: result.subscription,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: '대시보드 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
