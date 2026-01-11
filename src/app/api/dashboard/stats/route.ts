import { NextResponse } from 'next/server';
import { getTodayStats, getMonthlyStats } from '@/lib/actions/dashboard';

export async function GET() {
  try {
    const [todayResult, monthlyResult] = await Promise.all([
      getTodayStats(),
      getMonthlyStats(),
    ]);

    if (!todayResult.success) {
      return NextResponse.json({ error: todayResult.error }, { status: 400 });
    }

    if (!monthlyResult.success) {
      return NextResponse.json({ error: monthlyResult.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      today: todayResult.stats,
      monthly: {
        totalPosts: monthlyResult.totalPosts,
        publishedPosts: monthlyResult.publishedPosts,
        averagePerDay: monthlyResult.averagePerDay,
      },
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
