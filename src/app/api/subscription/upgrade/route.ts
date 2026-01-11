import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upgradePlan, PlanType } from '@/lib/subscription';
import { PLAN_NAMES } from '@/lib/constants/plans';

export const dynamic = 'force-dynamic';

interface UpgradeRequest {
  plan: PlanType;
}

const VALID_PLANS: PlanType[] = ['free', 'light', 'standard', 'pro', 'unlimited'];

/**
 * POST /api/subscription/upgrade
 * 플랜 업그레이드 (결제 후 호출)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { plan } = body as UpgradeRequest;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '플랜을 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 플랜입니다.' },
        { status: 400 }
      );
    }

    const result = await upgradePlan(user.id, plan);

    if (!result.success || !result.subscription) {
      return NextResponse.json(
        { success: false, error: result.error || '플랜 업그레이드에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${PLAN_NAMES[plan]} 플랜으로 업그레이드되었습니다.`,
      subscription: {
        id: result.subscription.id,
        plan: result.subscription.plan,
        planName: PLAN_NAMES[result.subscription.plan],
        status: result.subscription.status,
        monthlyLimit: result.subscription.monthlyLimit,
        usageCount: result.subscription.usageCount,
      },
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    return NextResponse.json(
      { success: false, error: '플랜 업그레이드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
