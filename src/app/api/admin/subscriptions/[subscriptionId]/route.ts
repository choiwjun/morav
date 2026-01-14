import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin';

// 구독 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { subscriptionId } = await params;
    const supabase = createAdminClient();

    // 구독 정보 조회
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users (
          id,
          email,
          name,
          avatar_url,
          created_at
        )
      `)
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: '구독 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const userId = subscription.user_id;

    // 결제 내역 조회
    const { data: payments } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 사용자의 포스트 통계
    const { data: posts, count: postCount } = await supabase
      .from('posts')
      .select('id, status', { count: 'exact' })
      .eq('user_id', userId);

    const postStats = {
      total: postCount || 0,
      published: posts?.filter((p) => p.status === 'published').length || 0,
      failed: posts?.filter((p) => p.status === 'failed').length || 0,
    };

    // 사용자의 블로그 수
    const { count: blogCount } = await supabase
      .from('blogs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const user = subscription.users as {
      id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
      created_at: string;
    } | null;

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        userId: subscription.user_id,
        plan: subscription.plan,
        status: subscription.status,
        usageCount: subscription.usage_count,
        monthlyLimit: subscription.monthly_limit,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
      },
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
            createdAt: user.created_at,
          }
        : null,
      payments: payments?.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        plan: payment.plan,
        status: payment.status,
        method: payment.method,
        createdAt: payment.created_at,
      })) || [],
      stats: {
        posts: postStats,
        blogs: blogCount || 0,
      },
    });
  } catch (error) {
    console.error('Admin subscription detail error:', error);
    return NextResponse.json({ error: '구독 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 구독 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { subscriptionId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // 기존 구독 확인
    const { data: existingSub, error: findError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan')
      .eq('id', subscriptionId)
      .single();

    if (findError || !existingSub) {
      return NextResponse.json({ error: '구독 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    // 플랜 변경
    if (body.plan !== undefined) {
      updates.plan = body.plan;
      // 플랜에 따른 월간 한도 설정
      const planLimits: Record<string, number> = {
        free: 10,
        light: 50,
        standard: 150,
        pro: 500,
        unlimited: 999999,
      };
      updates.monthly_limit = planLimits[body.plan] || 10;
    }

    // 상태 변경
    if (body.status !== undefined) {
      updates.status = body.status;
    }

    // 사용량 변경 (리셋 포함)
    if (body.usageCount !== undefined) {
      updates.usage_count = body.usageCount;
    }

    // 월간 한도 직접 변경 (커스텀)
    if (body.monthlyLimit !== undefined) {
      updates.monthly_limit = body.monthlyLimit;
    }

    // 구독 기간 변경
    if (body.periodStart !== undefined) {
      updates.current_period_start = body.periodStart;
    }
    if (body.periodEnd !== undefined) {
      updates.current_period_end = body.periodEnd;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Subscription update error:', updateError);
      return NextResponse.json({ error: '구독 정보 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updates,
      message: '구독 정보가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Admin subscription update error:', error);
    return NextResponse.json({ error: '구독 정보 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 구독 취소 (소프트 삭제)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { subscriptionId } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Subscription cancel error:', error);
      return NextResponse.json({ error: '구독 취소에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다.',
    });
  } catch (error) {
    console.error('Admin subscription delete error:', error);
    return NextResponse.json({ error: '구독 취소 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
