/**
 * 구독 관리 모듈
 */

import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/lib/constants/plans';

export type PlanType = 'free' | 'light' | 'standard' | 'pro' | 'unlimited';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  monthlyLimit: number;
  usageCount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionResult {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}

export interface UsageCheckResult {
  success: boolean;
  canPublish?: boolean;
  usageCount?: number;
  monthlyLimit?: number;
  remainingPosts?: number;
  error?: string;
}

/**
 * 구독 기간 계산 (현재 시간부터 30일)
 */
function calculatePeriodDates(): { start: string; end: string } {
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}

/**
 * 무료 체험 구독 생성
 */
export async function createFreeTrialSubscription(userId: string): Promise<CreateSubscriptionResult> {
  try {
    const supabase = await createClient();
    const { start, end } = calculatePeriodDates();

    // 기존 구독이 있는지 확인
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingSubscription) {
      return { success: false, error: '이미 구독이 존재합니다.' };
    }

    // 무료 체험 구독 생성
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'free',
        status: 'active',
        monthly_limit: PLAN_LIMITS.free,
        usage_count: 0,
        current_period_start: start,
        current_period_end: end,
      })
      .select()
      .single();

    if (error) {
      console.error('Create subscription error:', error);
      return { success: false, error: '구독 생성에 실패했습니다.' };
    }

    const subscription: Subscription = {
      id: data.id,
      userId: data.user_id,
      plan: data.plan,
      status: data.status,
      monthlyLimit: data.monthly_limit,
      usageCount: data.usage_count,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, subscription };
  } catch (error) {
    console.error('Create free trial subscription error:', error);
    return { success: false, error: '구독 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자 구독 조회
 */
export async function getUserSubscription(userId: string): Promise<CreateSubscriptionResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') {
      // 구독이 없음 - 무료 구독 자동 생성
      return createFreeTrialSubscription(userId);
    }

    if (error) {
      console.error('Get subscription error:', error);
      return { success: false, error: '구독 조회에 실패했습니다.' };
    }

    const subscription: Subscription = {
      id: data.id,
      userId: data.user_id,
      plan: data.plan,
      status: data.status,
      monthlyLimit: data.monthly_limit,
      usageCount: data.usage_count,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, subscription };
  } catch (error) {
    console.error('Get user subscription error:', error);
    return { success: false, error: '구독 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 발행 가능 여부 확인
 */
export async function checkUsageLimit(userId: string): Promise<UsageCheckResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status, monthly_limit, usage_count')
      .eq('user_id', userId)
      .single();

    // 구독이 없으면 무료 플랜 기준으로 확인
    if (error?.code === 'PGRST116') {
      return {
        success: true,
        canPublish: true,
        usageCount: 0,
        monthlyLimit: PLAN_LIMITS.free,
        remainingPosts: PLAN_LIMITS.free,
      };
    }

    if (error) {
      console.error('Check usage limit error:', error);
      return { success: false, error: '사용량 확인에 실패했습니다.' };
    }

    // 구독이 활성화 상태가 아니면 발행 불가
    if (data.status !== 'active') {
      return {
        success: true,
        canPublish: false,
        usageCount: data.usage_count,
        monthlyLimit: data.monthly_limit,
        remainingPosts: 0,
        error: '구독이 비활성화 상태입니다.',
      };
    }

    // 무제한 플랜은 항상 발행 가능
    if (data.plan === 'unlimited') {
      return {
        success: true,
        canPublish: true,
        usageCount: data.usage_count,
        monthlyLimit: data.monthly_limit,
        remainingPosts: 999999,
      };
    }

    const remainingPosts = Math.max(0, data.monthly_limit - data.usage_count);
    const canPublish = data.usage_count < data.monthly_limit;

    return {
      success: true,
      canPublish,
      usageCount: data.usage_count,
      monthlyLimit: data.monthly_limit,
      remainingPosts,
    };
  } catch (error) {
    console.error('Check usage limit error:', error);
    return { success: false, error: '사용량 확인 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용량 증가 (발행 시 호출)
 */
export async function incrementUsage(userId: string): Promise<{ success: boolean; newCount?: number; error?: string }> {
  try {
    const supabase = await createClient();

    // 현재 사용량 조회
    const { data: subscription, error: queryError } = await supabase
      .from('subscriptions')
      .select('id, usage_count, monthly_limit, plan, status')
      .eq('user_id', userId)
      .single();

    if (queryError?.code === 'PGRST116') {
      // 구독이 없으면 생성
      const createResult = await createFreeTrialSubscription(userId);
      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }
      // 새로 생성된 구독의 사용량 증가
      return incrementUsage(userId);
    }

    if (queryError) {
      console.error('Query subscription error:', queryError);
      return { success: false, error: '구독 조회에 실패했습니다.' };
    }

    // 무제한 플랜이 아닌 경우 한도 확인
    if (subscription.plan !== 'unlimited') {
      if (subscription.usage_count >= subscription.monthly_limit) {
        return { success: false, error: '월간 발행 한도에 도달했습니다.' };
      }
    }

    // 구독이 활성화 상태가 아니면 발행 불가
    if (subscription.status !== 'active') {
      return { success: false, error: '구독이 비활성화 상태입니다.' };
    }

    // 사용량 증가
    const newCount = subscription.usage_count + 1;
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        usage_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Update usage count error:', updateError);
      return { success: false, error: '사용량 업데이트에 실패했습니다.' };
    }

    return { success: true, newCount };
  } catch (error) {
    console.error('Increment usage error:', error);
    return { success: false, error: '사용량 증가 중 오류가 발생했습니다.' };
  }
}

/**
 * 월간 사용량 초기화 (Cron job용)
 */
export async function resetMonthlyUsage(): Promise<{
  success: boolean;
  resetCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let resetCount = 0;

  try {
    const supabase = await createClient();
    const now = new Date();

    // 현재 기간이 끝난 활성 구독 조회
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan, current_period_end')
      .eq('status', 'active')
      .lte('current_period_end', now.toISOString());

    if (queryError) {
      return { success: false, resetCount: 0, errors: [queryError.message] };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, resetCount: 0, errors: [] };
    }

    // 각 구독의 사용량 초기화 및 새 기간 설정
    for (const subscription of subscriptions) {
      try {
        const newPeriodStart = now.toISOString();
        const newPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            usage_count: 0,
            current_period_start: newPeriodStart,
            current_period_end: newPeriodEnd,
            updated_at: now.toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          errors.push(`Subscription ${subscription.id}: ${updateError.message}`);
        } else {
          resetCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Subscription ${subscription.id}: ${errorMsg}`);
      }
    }

    return { success: true, resetCount, errors };
  } catch (error) {
    console.error('Reset monthly usage error:', error);
    return {
      success: false,
      resetCount,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * 구독 플랜 업그레이드
 */
export async function upgradePlan(
  userId: string,
  newPlan: PlanType
): Promise<CreateSubscriptionResult> {
  try {
    const supabase = await createClient();

    const { data: subscription, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (queryError?.code === 'PGRST116') {
      // 구독이 없으면 새 플랜으로 생성
      const { start, end } = calculatePeriodDates();
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: newPlan,
          status: 'active',
          monthly_limit: PLAN_LIMITS[newPlan],
          usage_count: 0,
          current_period_start: start,
          current_period_end: end,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: '구독 생성에 실패했습니다.' };
      }

      return {
        success: true,
        subscription: {
          id: data.id,
          userId: data.user_id,
          plan: data.plan,
          status: data.status,
          monthlyLimit: data.monthly_limit,
          usageCount: data.usage_count,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    }

    if (queryError) {
      return { success: false, error: '구독 조회에 실패했습니다.' };
    }

    // 플랜 업그레이드
    const { data, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan: newPlan,
        monthly_limit: PLAN_LIMITS[newPlan],
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: '플랜 업그레이드에 실패했습니다.' };
    }

    return {
      success: true,
      subscription: {
        id: data.id,
        userId: data.user_id,
        plan: data.plan,
        status: data.status,
        monthlyLimit: data.monthly_limit,
        usageCount: data.usage_count,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error('Upgrade plan error:', error);
    return { success: false, error: '플랜 업그레이드 중 오류가 발생했습니다.' };
  }
}
