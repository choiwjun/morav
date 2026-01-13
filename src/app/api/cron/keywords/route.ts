import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { collectNaverTrends } from '@/lib/keywords/naver';
import { collectGoogleTrends } from '@/lib/keywords/google';
import { TrendKeyword } from '@/lib/keywords/types';

// Vercel Cron job을 위한 설정
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 최대 60초

/**
 * Cron job: 매시간 키워드 수집
 * Vercel Cron에서 호출되거나 수동으로 호출 가능
 */
export async function GET(request: NextRequest) {
  try {
    // Cron secret 검증 (Vercel Cron 또는 수동 호출 시 인증)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET이 설정된 경우 검증
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const results = {
      naver: { success: false, count: 0, duplicatesSkipped: 0, error: '' },
      google: { success: false, count: 0, duplicatesSkipped: 0, error: '' },
      cleanup: { success: false, deletedCount: 0 },
    };

    // 디버그 정보
    const debug = {
      hasNaverClientId: !!process.env.NAVER_CLIENT_ID,
      hasNaverClientSecret: !!process.env.NAVER_CLIENT_SECRET,
      hasSerpApiKey: !!process.env.SERPAPI_KEY,
    };

    const supabase = await createClient();

    // 1. 네이버 트렌드 수집
    try {
      const naverResult = await collectNaverTrends();
      if (naverResult.success && naverResult.keywords) {
        const { stored, duplicatesSkipped } = await storeKeywords(
          supabase,
          naverResult.keywords,
          'naver'
        );
        results.naver = {
          success: true,
          count: stored,
          duplicatesSkipped,
          error: '',
        };
      } else {
        results.naver.error = naverResult.error || 'Failed to collect';
      }
    } catch (error) {
      results.naver.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 2. 구글 트렌드 수집
    try {
      const googleResult = await collectGoogleTrends();
      if (googleResult.success && googleResult.keywords) {
        const { stored, duplicatesSkipped } = await storeKeywords(
          supabase,
          googleResult.keywords,
          'google'
        );
        results.google = {
          success: true,
          count: stored,
          duplicatesSkipped,
          error: '',
        };
      } else {
        results.google.error = googleResult.error || 'Failed to collect';
      }
    } catch (error) {
      results.google.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 3. 오래된 키워드 정리 (24시간 이상)
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: deleted } = await supabase
        .from('keywords')
        .delete()
        .lt('collected_at', oneDayAgo)
        .select('id');

      results.cleanup = {
        success: true,
        deletedCount: deleted?.length || 0,
      };
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: results.naver.success || results.google.success,
      message: 'Keyword collection completed',
      results,
      debug,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '키워드 수집 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * 키워드 저장 (1시간 이내 중복 제외)
 */
async function storeKeywords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  keywords: TrendKeyword[],
  source: 'naver' | 'google'
): Promise<{ stored: number; duplicatesSkipped: number }> {
  let stored = 0;
  let duplicatesSkipped = 0;

  // 1시간 전 시간 계산
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  for (const keyword of keywords) {
    try {
      // 1시간 이내 동일 키워드+소스 존재 여부 확인
      const { data: existing } = await supabase
        .from('keywords')
        .select('id')
        .eq('keyword', keyword.keyword)
        .eq('source', source)
        .gte('collected_at', oneHourAgo)
        .limit(1);

      if (existing && existing.length > 0) {
        duplicatesSkipped++;
        continue;
      }

      // 키워드 저장
      const { error: insertError } = await supabase.from('keywords').insert({
        keyword: keyword.keyword,
        category: keyword.category || 'other',
        source,
        trend_score: keyword.trendScore || 0,
        collected_at: new Date().toISOString(),
      });

      if (!insertError) {
        stored++;
      } else {
        // unique constraint 위반 시 중복으로 처리
        if (insertError.code === '23505') {
          duplicatesSkipped++;
        } else {
          console.error('Insert keyword error:', insertError);
        }
      }
    } catch (error) {
      console.error('Store keyword error:', error);
    }
  }

  return { stored, duplicatesSkipped };
}
