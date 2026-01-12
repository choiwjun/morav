import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upgradePlan, PlanType } from '@/lib/subscription';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { sendSubscriptionChangeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  requestedAt: string;
  approvedAt: string;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
  };
  receipt?: {
    url: string;
  };
  failure?: {
    code: string;
    message: string;
  };
}

/**
 * POST /api/payment/confirm
 * 토스페이먼츠 결제 승인 및 구독 생성
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
    const { paymentKey, orderId, amount } = body as TossPaymentConfirmRequest;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '필수 결제 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // orderId에서 플랜 정보 추출 (format: morav_{planId}_{timestamp}_{userId})
    const orderParts = orderId.split('_');
    if (orderParts.length < 4 || orderParts[0] !== 'morav') {
      return NextResponse.json(
        { success: false, error: '잘못된 주문 번호입니다.' },
        { status: 400 }
      );
    }

    const planId = orderParts[1] as PlanType;
    const validPlans: PlanType[] = ['free', 'light', 'standard', 'pro', 'unlimited'];
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 플랜입니다.' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error('TOSS_SECRET_KEY is not set');
      return NextResponse.json(
        { success: false, error: '결제 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    const confirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const paymentResult: TossPaymentResponse = await confirmResponse.json();

    if (!confirmResponse.ok || paymentResult.failure) {
      const errorMessage = paymentResult.failure?.message || '결제 승인에 실패했습니다.';
      console.error('Payment confirmation failed:', paymentResult);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // 결제 성공 - 구독 업그레이드
    const subscriptionResult = await upgradePlan(user.id, planId);

    if (!subscriptionResult.success) {
      // 결제는 성공했지만 구독 업그레이드 실패 - 환불 처리 필요
      console.error('Subscription upgrade failed after payment:', subscriptionResult.error);
      // TODO: 환불 처리 로직 추가
      return NextResponse.json(
        { success: false, error: '구독 활성화에 실패했습니다. 고객센터에 문의해주세요.' },
        { status: 500 }
      );
    }

    // 결제 내역 저장
    await supabase.from('payment_history').insert({
      user_id: user.id,
      payment_key: paymentResult.paymentKey,
      order_id: paymentResult.orderId,
      amount: paymentResult.totalAmount,
      plan: planId,
      status: 'completed',
      method: paymentResult.method,
      card_company: paymentResult.card?.company,
      card_number: paymentResult.card?.number,
      receipt_url: paymentResult.receipt?.url,
    });

    // 구독 변경 이메일 발송 (비동기)
    if (user.email) {
      const oldPlan = subscriptionResult.previousPlan || 'free';
      sendSubscriptionChangeEmail(user.id, user.email, oldPlan, planId).catch((err) =>
        console.error('Failed to send subscription change email:', err)
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentKey: paymentResult.paymentKey,
        orderId: paymentResult.orderId,
        amount: paymentResult.totalAmount,
        method: paymentResult.method,
        approvedAt: paymentResult.approvedAt,
        receiptUrl: paymentResult.receipt?.url,
      },
      subscription: {
        plan: subscriptionResult.subscription?.plan,
        monthlyLimit: subscriptionResult.subscription?.monthlyLimit || PLAN_LIMITS[planId],
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json(
      { success: false, error: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
