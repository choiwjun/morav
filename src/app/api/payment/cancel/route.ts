import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface CancelPaymentRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}

/**
 * POST /api/payment/cancel
 * 토스페이먼츠 결제 취소(환불)
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
    const { paymentKey, cancelReason, cancelAmount } = body as CancelPaymentRequest;

    if (!paymentKey || !cancelReason) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error('TOSS_SECRET_KEY is not set');
      return NextResponse.json(
        { success: false, error: '결제 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 토스페이먼츠 결제 취소 API 호출
    const cancelBody: { cancelReason: string; cancelAmount?: number } = {
      cancelReason,
    };

    if (cancelAmount) {
      cancelBody.cancelAmount = cancelAmount;
    }

    const cancelResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cancelBody),
      }
    );

    const cancelResult = await cancelResponse.json();

    if (!cancelResponse.ok) {
      const errorMessage = cancelResult.message || '결제 취소에 실패했습니다.';
      console.error('Payment cancel failed:', cancelResult);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // 결제 내역 업데이트
    await supabase
      .from('payment_history')
      .update({
        status: 'cancelled',
        cancelled_at: cancelResult.cancels?.[0]?.canceledAt || new Date().toISOString(),
        cancel_reason: cancelReason,
      })
      .eq('payment_key', paymentKey);

    // 구독 상태를 취소로 변경
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update subscription status:', updateError);
      // 환불은 성공했지만 구독 상태 업데이트 실패
    }

    return NextResponse.json({
      success: true,
      message: '결제가 취소되었습니다.',
      cancellation: {
        paymentKey: cancelResult.paymentKey,
        cancelAmount: cancelResult.cancels?.[0]?.cancelAmount,
        canceledAt: cancelResult.cancels?.[0]?.canceledAt,
      },
    });
  } catch (error) {
    console.error('Payment cancel error:', error);
    return NextResponse.json(
      { success: false, error: '결제 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
