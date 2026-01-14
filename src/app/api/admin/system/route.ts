import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin';

export async function GET() {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // 병렬로 모든 데이터 조회
    const [
      keywordsTotalResult,
      keywords24hResult,
      keywordsCategoryResult,
      blogsResult,
      errorsResult,
    ] = await Promise.all([
      // 전체 키워드 수
      supabase.from('keywords').select('id', { count: 'exact', head: true }),
      // 24시간 내 키워드 (소스별)
      supabase.from('keywords').select('source').gte('collected_at', last24h),
      // 카테고리별 키워드
      supabase.from('keywords').select('category'),
      // 블로그 현황
      supabase.from('blogs').select('platform, is_active'),
      // 최근 실패 포스트 (최근 10개)
      supabase
        .from('posts')
        .select('id, title, error_message, created_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // 키워드 통계
    const keywords24h = keywords24hResult.data || [];
    const keywordsCategory = keywordsCategoryResult.data || [];

    // 카테고리별 집계
    const byCategory: Record<string, number> = {};
    keywordsCategory.forEach((k) => {
      if (k.category) {
        byCategory[k.category] = (byCategory[k.category] || 0) + 1;
      }
    });

    const keywordStats = {
      total: keywordsTotalResult.count || 0,
      last24h: keywords24h.length,
      byCategory,
      bySource: {
        naver: keywords24h.filter((k) => k.source === 'naver').length,
        google: keywords24h.filter((k) => k.source === 'google').length,
      },
    };

    // 블로그 통계
    const blogs = blogsResult.data || [];
    const blogStats = {
      total: blogs.length,
      active: blogs.filter((b) => b.is_active).length,
      byPlatform: {
        blogger: blogs.filter((b) => b.platform === 'blogger').length,
        wordpress: blogs.filter((b) => b.platform === 'wordpress').length,
      },
    };

    // 최근 에러
    const recentErrors = (errorsResult.data || []).map((post) => ({
      id: post.id,
      postTitle: post.title,
      message: post.error_message || '알 수 없는 오류',
      createdAt: post.created_at,
    }));

    return NextResponse.json({
      keywords: keywordStats,
      blogs: blogStats,
      recentErrors,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Admin system stats error:', error);
    return NextResponse.json(
      { error: '시스템 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
