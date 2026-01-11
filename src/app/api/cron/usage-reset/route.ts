import { NextRequest, NextResponse } from 'next/server';
import { resetMonthlyUsage } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/usage-reset
 * 월간 사용량 초기화 (Cron job)
 *
 * 매일 실행되어 현재 기간이 끝난 구독의 사용량을 초기화합니다.
 * Vercel Cron 또는 외부 Cron 서비스에서 호출됩니다.
 */
export async function POST(request: NextRequest) {
  try {
    // Cron 인증 확인 (Vercel Cron 또는 CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Vercel Cron의 경우 'Bearer CRON_SECRET' 형식
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const result = await resetMonthlyUsage();

    if (!result.success) {
      console.error('Usage reset failed:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: '사용량 초기화에 실패했습니다.',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    console.log(`Usage reset completed: ${result.resetCount} subscriptions reset`);

    return NextResponse.json({
      success: true,
      resetCount: result.resetCount,
      errors: result.errors,
      message: `${result.resetCount}개의 구독 사용량이 초기화되었습니다.`,
    });
  } catch (error) {
    console.error('Usage reset cron error:', error);
    return NextResponse.json(
      { success: false, error: '사용량 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/usage-reset
 * 수동 실행 또는 상태 확인용
 */
export async function GET(request: NextRequest) {
  // POST와 동일한 인증 확인
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: '인증에 실패했습니다.' },
      { status: 401 }
    );
  }

  // GET 요청도 실행
  return POST(request);
}
