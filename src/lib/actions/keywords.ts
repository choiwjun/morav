'use server';

import { createClient } from '@/lib/supabase/server';
import { collectNaverTrends } from '@/lib/keywords/naver';
import { collectGoogleTrends } from '@/lib/keywords/google';
import { TrendKeyword, StoredKeyword } from '@/lib/keywords/types';
import { VALID_CATEGORY_IDS } from '@/lib/constants/categories';

interface KeywordActionResult {
  success: boolean;
  error?: string;
}

interface KeywordListResult extends KeywordActionResult {
  keywords?: StoredKeyword[];
  total?: number;
}

interface CollectionResult extends KeywordActionResult {
  naverCount?: number;
  googleCount?: number;
  duplicatesSkipped?: number;
}

/**
 * 네이버 트렌드 키워드 수집 및 저장
 */
export async function collectAndStoreNaverKeywords(): Promise<CollectionResult> {
  try {
    const supabase = await createClient();

    // 네이버 트렌드 수집
    const result = await collectNaverTrends();

    if (!result.success || !result.keywords) {
      return { success: false, error: result.error || '네이버 키워드 수집에 실패했습니다.' };
    }

    // 키워드 저장 (중복 제외)
    const { stored, duplicatesSkipped } = await storeKeywords(supabase, result.keywords, 'naver');

    return {
      success: true,
      naverCount: stored,
      duplicatesSkipped,
    };
  } catch (error) {
    console.error('Collect Naver keywords error:', error);
    return { success: false, error: '네이버 키워드 수집 중 오류가 발생했습니다.' };
  }
}

/**
 * 구글 트렌드 키워드 수집 및 저장
 */
export async function collectAndStoreGoogleKeywords(): Promise<CollectionResult> {
  try {
    const supabase = await createClient();

    // 구글 트렌드 수집
    const result = await collectGoogleTrends();

    if (!result.success || !result.keywords) {
      return { success: false, error: result.error || '구글 키워드 수집에 실패했습니다.' };
    }

    // 키워드 저장 (중복 제외)
    const { stored, duplicatesSkipped } = await storeKeywords(supabase, result.keywords, 'google');

    return {
      success: true,
      googleCount: stored,
      duplicatesSkipped,
    };
  } catch (error) {
    console.error('Collect Google keywords error:', error);
    return { success: false, error: '구글 키워드 수집 중 오류가 발생했습니다.' };
  }
}

/**
 * 모든 소스에서 키워드 수집
 */
export async function collectAllKeywords(): Promise<CollectionResult> {
  try {
    const [naverResult, googleResult] = await Promise.all([
      collectAndStoreNaverKeywords(),
      collectAndStoreGoogleKeywords(),
    ]);

    const totalDuplicates =
      (naverResult.duplicatesSkipped || 0) + (googleResult.duplicatesSkipped || 0);

    // 둘 다 실패한 경우에만 에러 반환
    if (!naverResult.success && !googleResult.success) {
      return {
        success: false,
        error: '키워드 수집에 실패했습니다.',
      };
    }

    return {
      success: true,
      naverCount: naverResult.naverCount || 0,
      googleCount: googleResult.googleCount || 0,
      duplicatesSkipped: totalDuplicates,
    };
  } catch (error) {
    console.error('Collect all keywords error:', error);
    return { success: false, error: '키워드 수집 중 오류가 발생했습니다.' };
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

/**
 * 최근 수집된 키워드 목록 조회
 */
export async function getRecentKeywords(
  limit: number = 50,
  category?: string,
  source?: 'naver' | 'google'
): Promise<KeywordListResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // limit 검증
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // 쿼리 빌드
    let query = supabase
      .from('keywords')
      .select('id, keyword, category, source, trend_score, collected_at')
      .order('collected_at', { ascending: false })
      .limit(safeLimit);

    // 카테고리 필터
    if (category && VALID_CATEGORY_IDS.includes(category)) {
      query = query.eq('category', category);
    }

    // 소스 필터
    if (source && ['naver', 'google'].includes(source)) {
      query = query.eq('source', source);
    }

    const { data: keywords, error: queryError } = await query;

    if (queryError) {
      console.error('Get keywords error:', queryError);
      return { success: false, error: '키워드 목록 조회에 실패했습니다.' };
    }

    const formattedKeywords: StoredKeyword[] = (keywords || []).map((k) => ({
      id: k.id,
      keyword: k.keyword,
      category: k.category,
      source: k.source as 'naver' | 'google',
      trendScore: k.trend_score,
      collectedAt: k.collected_at,
    }));

    return {
      success: true,
      keywords: formattedKeywords,
      total: formattedKeywords.length,
    };
  } catch (error) {
    console.error('Get recent keywords error:', error);
    return { success: false, error: '키워드 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 카테고리별 키워드 통계 조회
 */
export async function getKeywordStatsByCategory(): Promise<{
  success: boolean;
  stats?: Record<string, number>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 최근 24시간 내 키워드만 조회
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: keywords, error: queryError } = await supabase
      .from('keywords')
      .select('category')
      .gte('collected_at', oneDayAgo);

    if (queryError) {
      console.error('Get keyword stats error:', queryError);
      return { success: false, error: '키워드 통계 조회에 실패했습니다.' };
    }

    // 카테고리별 카운트
    const stats: Record<string, number> = {};
    for (const k of keywords || []) {
      stats[k.category] = (stats[k.category] || 0) + 1;
    }

    return { success: true, stats };
  } catch (error) {
    console.error('Get keyword stats error:', error);
    return { success: false, error: '키워드 통계 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 오래된 키워드 삭제 (24시간 이상 된 키워드)
 */
export async function cleanupOldKeywords(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 24시간 전 시간 계산
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: deleted, error: deleteError } = await supabase
      .from('keywords')
      .delete()
      .lt('collected_at', oneDayAgo)
      .select('id');

    if (deleteError) {
      console.error('Cleanup keywords error:', deleteError);
      return { success: false, error: '오래된 키워드 삭제에 실패했습니다.' };
    }

    return {
      success: true,
      deletedCount: deleted?.length || 0,
    };
  } catch (error) {
    console.error('Cleanup keywords error:', error);
    return { success: false, error: '오래된 키워드 삭제 중 오류가 발생했습니다.' };
  }
}
