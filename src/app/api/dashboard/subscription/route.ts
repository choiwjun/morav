import { NextResponse } from 'next/server';
import { getSubscriptionStatus } from '@/lib/actions/dashboard';

export async function GET() {
  try {
    const result = await getSubscriptionStatus();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
    });
  } catch (error) {
    console.error('Dashboard subscription API error:', error);
    return NextResponse.json(
      { error: '구독 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
