import { NextRequest, NextResponse } from 'next/server';
import { getUsersNeedingAutoGenerate, autoGenerateForUser } from '@/lib/auto-generate';

// Vercel Cron job을 위한 설정
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 최대 5분 (콘텐츠 생성에 시간이 걸림)

interface GenerationResult {
  userId: string;
  success: boolean;
  generatedCount: number;
  errors: string[];
}

/**
 * Cron job: 자동 콘텐츠 생성
 * 매일 특정 시간에 실행되어 사용자별 스케줄에 맞게 콘텐츠 자동 생성
 *
 * 실행 주기: 매 6시간 (0 0,6,12,18 * * *)
 * - 00:00, 06:00, 12:00, 18:00 UTC
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
    const results: GenerationResult[] = [];
    let totalGenerated = 0;
    let totalFailed = 0;

    // 자동 생성이 필요한 사용자 목록 조회
    const users = await getUsersNeedingAutoGenerate();

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need auto-generation',
        totalGenerated: 0,
        totalFailed: 0,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // 각 사용자에 대해 콘텐츠 생성
    for (const user of users) {
      try {
        const result = await autoGenerateForUser(user);

        results.push({
          userId: user.userId,
          success: result.success,
          generatedCount: result.generatedCount,
          errors: result.errors,
        });

        if (result.success) {
          totalGenerated += result.generatedCount;
        } else {
          totalFailed++;
        }

        // Rate limiting - 사용자 간 1초 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          userId: user.userId,
          success: false,
          generatedCount: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
        totalFailed++;
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: totalGenerated > 0 || totalFailed === 0,
      message: 'Auto-generation completed',
      summary: {
        totalUsers: users.length,
        totalGenerated,
        totalFailed,
      },
      results: results.length <= 10 ? results : undefined, // 10개 이상이면 생략
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Auto-generate cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '자동 생성 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
