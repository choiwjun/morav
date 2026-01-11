import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSubscription } from '@/lib/subscription';
import { PLAN_NAMES, PLAN_POSTS_DISPLAY } from '@/lib/constants/plans';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subscription
 * 사용자 구독 상세 정보 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const result = await getUserSubscription(user.id);

    if (!result.success || !result.subscription) {
      return NextResponse.json(
        { success: false, error: result.error || '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const subscription = result.subscription;

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planName: PLAN_NAMES[subscription.plan] || subscription.plan,
        status: subscription.status,
        monthlyLimit: subscription.monthlyLimit,
        usageCount: subscription.usageCount,
        remainingPosts: Math.max(0, subscription.monthlyLimit - subscription.usageCount),
        postsDisplay: PLAN_POSTS_DISPLAY[subscription.plan] || `${subscription.monthlyLimit}건`,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { success: false, error: '구독 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
