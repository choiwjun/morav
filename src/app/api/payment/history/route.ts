import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_NAMES } from '@/lib/constants/plans';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payment/history
 * 결제 내역 조회
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') as 'completed' | 'cancelled' | 'failed' | null;

    // 페이지네이션 계산
    const offset = (page - 1) * limit;

    // 쿼리 빌드
    let query = supabase
      .from('payment_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Query payment history error:', error);
      return NextResponse.json(
        { success: false, error: '결제 내역 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    const formattedPayments = (payments || []).map((payment) => ({
      id: payment.id,
      paymentKey: payment.payment_key,
      orderId: payment.order_id,
      amount: payment.amount,
      plan: payment.plan,
      planName: PLAN_NAMES[payment.plan] || payment.plan,
      status: payment.status,
      statusText: getStatusText(payment.status),
      method: payment.method,
      cardCompany: payment.card_company,
      cardNumber: payment.card_number,
      receiptUrl: payment.receipt_url,
      cancelledAt: payment.cancelled_at,
      cancelReason: payment.cancel_reason,
      createdAt: payment.created_at,
    }));

    return NextResponse.json({
      success: true,
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return NextResponse.json(
      { success: false, error: '결제 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return '결제완료';
    case 'cancelled':
      return '취소됨';
    case 'failed':
      return '실패';
    default:
      return status;
  }
}
