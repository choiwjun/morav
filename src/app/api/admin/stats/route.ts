import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin';

export async function GET() {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 관리자용 클라이언트 사용 (RLS 우회)
    const supabase = createAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    ).toISOString();

    // 병렬로 모든 통계 조회
    const [
      usersResult,
      todayUsersResult,
      weekUsersResult,
      subscriptionsResult,
      postsResult,
      todayPostsResult,
      blogsResult,
      keywordsResult,
    ] = await Promise.all([
      // 전체 사용자 수
      supabase.from('users').select('id', { count: 'exact', head: true }),
      // 오늘 가입자 수
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart),
      // 이번 주 가입자 수
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart),
      // 구독 현황 (플랜별)
      supabase.from('subscriptions').select('plan, status'),
      // 전체 포스트 통계
      supabase.from('posts').select('status'),
      // 오늘 발행 포스트
      supabase.from('posts').select('status').gte('created_at', todayStart),
      // 블로그 연동 현황
      supabase.from('blogs').select('platform, is_active'),
      // 키워드 수집 현황 (최근 24시간)
      supabase
        .from('keywords')
        .select('id', { count: 'exact', head: true })
        .gte('collected_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // 사용자 통계
    const userStats = {
      total: usersResult.count || 0,
      today: todayUsersResult.count || 0,
      thisWeek: weekUsersResult.count || 0,
    };

    // 구독 통계
    const subscriptions = subscriptionsResult.data || [];
    const subscriptionStats = {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === 'active').length,
      byPlan: {
        free: subscriptions.filter((s) => s.plan === 'free').length,
        light: subscriptions.filter((s) => s.plan === 'light').length,
        standard: subscriptions.filter((s) => s.plan === 'standard').length,
        pro: subscriptions.filter((s) => s.plan === 'pro').length,
        unlimited: subscriptions.filter((s) => s.plan === 'unlimited').length,
      },
    };

    // 포스트 통계
    const posts = postsResult.data || [];
    const todayPosts = todayPostsResult.data || [];
    const postStats = {
      total: posts.length,
      published: posts.filter((p) => p.status === 'published').length,
      failed: posts.filter((p) => p.status === 'failed').length,
      pending: posts.filter((p) =>
        ['pending', 'generating', 'generated', 'publishing', 'scheduled'].includes(p.status)
      ).length,
      today: {
        total: todayPosts.length,
        published: todayPosts.filter((p) => p.status === 'published').length,
        failed: todayPosts.filter((p) => p.status === 'failed').length,
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

    // 키워드 통계
    const keywordStats = {
      last24h: keywordsResult.count || 0,
    };

    return NextResponse.json({
      users: userStats,
      subscriptions: subscriptionStats,
      posts: postStats,
      blogs: blogStats,
      keywords: keywordStats,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: '통계 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
