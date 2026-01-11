import { NextRequest, NextResponse } from 'next/server';
import { publishScheduledPosts } from '@/lib/blog';

// Vercel Cron job을 위한 설정
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 최대 60초

/**
 * Cron job: 예약된 포스트 자동 발행
 * 매 10분마다 실행되도록 vercel.json에 설정
 */
export async function GET(request: NextRequest) {
  try {
    // Cron secret 검증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    // 예약된 포스트 발행
    const result = await publishScheduledPosts();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: result.success,
      message: 'Scheduled post publishing completed',
      published: result.published,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Publish cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '발행 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
