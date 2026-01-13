import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
    const period = searchParams.get('period') || 'week';

    // 현재 날짜 기준 계산
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 이번 주 시작 (월요일)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    // 지난 주 시작/끝
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    // 이번 달 시작
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 지난 달 시작/끝
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 전체 포스트 조회
    const { data: allPosts, error: postsError } = await supabase
      .from('posts')
      .select('id, status, created_at, blog_id, keyword_id')
      .eq('user_id', user.id);

    if (postsError) {
      console.error('Get posts error:', postsError);
      return NextResponse.json(
        { success: false, error: '데이터 조회에 실패했습니다.' },
        { status: 400 }
      );
    }

    const posts = allPosts || [];

    // 기본 통계 계산
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === 'published').length;
    const failedPosts = posts.filter((p) => p.status === 'failed').length;
    const successRate = totalPosts > 0 ? (publishedPosts / totalPosts) * 100 : 0;

    // 주간 통계
    const thisWeekPosts = posts.filter(
      (p) => new Date(p.created_at) >= thisWeekStart
    ).length;
    const lastWeekPosts = posts.filter(
      (p) =>
        new Date(p.created_at) >= lastWeekStart &&
        new Date(p.created_at) <= lastWeekEnd
    ).length;
    const weeklyGrowth =
      lastWeekPosts > 0
        ? ((thisWeekPosts - lastWeekPosts) / lastWeekPosts) * 100
        : thisWeekPosts > 0
        ? 100
        : 0;

    // 월간 통계
    const thisMonthPosts = posts.filter(
      (p) => new Date(p.created_at) >= thisMonthStart
    ).length;
    const lastMonthPosts = posts.filter(
      (p) =>
        new Date(p.created_at) >= lastMonthStart &&
        new Date(p.created_at) <= lastMonthEnd
    ).length;
    const monthlyGrowth =
      lastMonthPosts > 0
        ? ((thisMonthPosts - lastMonthPosts) / lastMonthPosts) * 100
        : thisMonthPosts > 0
        ? 100
        : 0;

    // 키워드별 통계 (keyword_id 기반)
    const keywordCounts: Record<string, number> = {};
    posts.forEach((post) => {
      if (post.keyword_id) {
        keywordCounts[post.keyword_id] = (keywordCounts[post.keyword_id] || 0) + 1;
      }
    });

    // 키워드 정보 조회
    const keywordIds = Object.keys(keywordCounts);
    let topKeywords: { keyword: string; count: number }[] = [];

    if (keywordIds.length > 0) {
      const { data: keywordsData } = await supabase
        .from('keywords')
        .select('id, keyword')
        .in('id', keywordIds);

      if (keywordsData) {
        topKeywords = keywordsData
          .map((k) => ({
            keyword: k.keyword,
            count: keywordCounts[k.id] || 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }
    }

    // 블로그별 통계
    const blogCounts: Record<string, number> = {};
    posts.forEach((post) => {
      if (post.blog_id) {
        blogCounts[post.blog_id] = (blogCounts[post.blog_id] || 0) + 1;
      }
    });

    // 블로그 정보 조회
    const blogIds = Object.keys(blogCounts);
    let topBlogs: { name: string; platform: string; count: number }[] = [];

    if (blogIds.length > 0) {
      const { data: blogsData } = await supabase
        .from('blogs')
        .select('id, blog_name, platform')
        .in('id', blogIds);

      if (blogsData) {
        topBlogs = blogsData
          .map((b) => ({
            name: b.blog_name,
            platform: b.platform,
            count: blogCounts[b.id] || 0,
          }))
          .sort((a, b) => b.count - a.count);
      }
    }

    // 일별 통계 (최근 7일)
    const dailyStats: { date: string; count: number; success: number; failed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayPosts = posts.filter((p) => {
        const postDate = new Date(p.created_at).toISOString().split('T')[0];
        return postDate === dateStr;
      });

      dailyStats.push({
        date: dateStr,
        count: dayPosts.length,
        success: dayPosts.filter((p) => p.status === 'published').length,
        failed: dayPosts.filter((p) => p.status === 'failed').length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        failedPosts,
        successRate,
        thisWeekPosts,
        lastWeekPosts,
        weeklyGrowth,
        thisMonthPosts,
        lastMonthPosts,
        monthlyGrowth,
        topKeywords,
        topBlogs,
        dailyStats,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: '분석 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
