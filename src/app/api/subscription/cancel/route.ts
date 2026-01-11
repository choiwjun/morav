import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface CancelRequest {
  cancelReason?: string;
}

/**
 * POST /api/subscription/cancel
 * 구독 취소 (다음 결제 주기부터 적용)
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
    const { cancelReason: _cancelReason } = body as CancelRequest;

    // 현재 구독 조회
    const { data: subscription, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (queryError?.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (queryError) {
      console.error('Query subscription error:', queryError);
      return NextResponse.json(
        { success: false, error: '구독 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '이미 취소된 구독입니다.' },
        { status: 400 }
      );
    }

    if (subscription.plan === 'free') {
      return NextResponse.json(
        { success: false, error: '무료 플랜은 취소할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 구독 상태를 취소로 변경
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update subscription error:', updateError);
      return NextResponse.json(
        { success: false, error: '구독 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다. 현재 기간이 끝날 때까지 서비스를 이용할 수 있습니다.',
      subscription: {
        status: 'cancelled',
        currentPeriodEnd: subscription.current_period_end,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { success: false, error: '구독 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
