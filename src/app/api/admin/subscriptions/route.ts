import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const plan = searchParams.get('plan') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // 구독 목록 조회 (사용자 정보 포함)
    let query = supabase
      .from('subscriptions')
      .select(
        `
        id,
        user_id,
        plan,
        status,
        usage_count,
        monthly_limit,
        current_period_start,
        current_period_end,
        created_at,
        updated_at,
        users (
          email,
          name
        )
      `,
        { count: 'exact' }
      );

    // 플랜 필터
    if (plan) {
      query = query.eq('plan', plan as 'free' | 'light' | 'standard' | 'pro' | 'unlimited');
    }

    // 상태 필터
    if (status) {
      query = query.eq('status', status as 'active' | 'cancelled' | 'expired');
    }

    // 정렬 (최신순)
    query = query.order('created_at', { ascending: false });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: subscriptions, count, error } = await query;

    if (error) {
      console.error('Subscriptions query error:', error);
      return NextResponse.json({ error: '구독 목록 조회에 실패했습니다.' }, { status: 500 });
    }

    // 결제 내역 조회 (최근 것만)
    const { data: payments } = await supabase
      .from('payment_history')
      .select('user_id, amount, plan, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    // 데이터 가공
    const formattedSubscriptions = subscriptions?.map((sub) => {
      const user = sub.users as { email: string; name: string | null } | null;
      const recentPayment = payments?.find((p) => p.user_id === sub.user_id);

      return {
        id: sub.id,
        userId: sub.user_id,
        userEmail: user?.email || 'Unknown',
        userName: user?.name || null,
        plan: sub.plan,
        status: sub.status,
        usageCount: sub.usage_count,
        monthlyLimit: sub.monthly_limit,
        periodStart: sub.current_period_start,
        periodEnd: sub.current_period_end,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        lastPayment: recentPayment
          ? {
              amount: recentPayment.amount,
              plan: recentPayment.plan,
              status: recentPayment.status,
              createdAt: recentPayment.created_at,
            }
          : null,
      };
    });

    // 통계 요약
    const allSubscriptions = subscriptions || [];
    const summary = {
      total: count || 0,
      active: allSubscriptions.filter((s) => s.status === 'active').length,
      byPlan: {
        free: allSubscriptions.filter((s) => s.plan === 'free').length,
        light: allSubscriptions.filter((s) => s.plan === 'light').length,
        standard: allSubscriptions.filter((s) => s.plan === 'standard').length,
        pro: allSubscriptions.filter((s) => s.plan === 'pro').length,
        unlimited: allSubscriptions.filter((s) => s.plan === 'unlimited').length,
      },
    };

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      summary,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin subscriptions error:', error);
    return NextResponse.json(
      { error: '구독 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
