'use server';

import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, PLAN_NAMES } from '@/lib/constants/plans';

interface TodayStats {
  totalPosts: number;
  publishedPosts: number;
  failedPosts: number;
  pendingPosts: number;
  connectedBlogs: number;
  totalBlogs: number;
}

interface RecentPost {
  id: string;
  title: string;
  content: string;
  status: string;
  blogName: string;
  blogPlatform: string;
  keyword: string | null;
  publishedUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface SubscriptionInfo {
  plan: string;
  planName: string;
  status: string;
  usageCount: number;
  monthlyLimit: number;
  usagePercentage: number;
  remainingPosts: number;
  periodEnd: string;
  isLimitReached: boolean;
}

interface DashboardResult {
  success: boolean;
  stats?: TodayStats;
  recentPosts?: RecentPost[];
  subscription?: SubscriptionInfo;
  error?: string;
}

/**
 * 오늘의 발행 통계 조회
 */
export async function getTodayStats(): Promise<DashboardResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 오늘 날짜 범위 계산 (사용자 timezone 고려)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 오늘의 포스트 통계 조회
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (postsError) {
      console.error('Get today stats error:', postsError);
      return { success: false, error: '통계 조회에 실패했습니다.' };
    }

    // 블로그 수 조회
    const { data: blogs, error: blogsError } = await supabase
      .from('blogs')
      .select('id, is_active')
      .eq('user_id', user.id);

    if (blogsError) {
      console.error('Get blogs count error:', blogsError);
    }

    const allBlogs = blogs || [];
    const connectedBlogs = allBlogs.filter((b) => b.is_active).length;
    const totalBlogs = allBlogs.length;

    const allPosts = posts || [];
    const stats: TodayStats = {
      totalPosts: allPosts.length,
      publishedPosts: allPosts.filter((p) => p.status === 'published').length,
      failedPosts: allPosts.filter((p) => p.status === 'failed').length,
      pendingPosts: allPosts.filter((p) =>
        ['pending', 'generating', 'generated', 'publishing'].includes(p.status)
      ).length,
      connectedBlogs,
      totalBlogs,
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Get today stats error:', error);
    return { success: false, error: '통계 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 최근 포스트 목록 조회
 */
export async function getRecentPosts(limit: number = 5): Promise<DashboardResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // limit 검증 (최대 20개)
    const safeLimit = Math.min(Math.max(1, limit), 20);

    // 최근 포스트 조회 (블로그 및 키워드 정보 포함)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(
        `
        id,
        title,
        content,
        status,
        published_url,
        published_at,
        created_at,
        blogs!inner (
          blog_name,
          platform
        ),
        keywords (
          keyword
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (postsError) {
      console.error('Get recent posts error:', postsError);
      return { success: false, error: '포스트 목록 조회에 실패했습니다.' };
    }

    const recentPosts: RecentPost[] = (posts || []).map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content?.substring(0, 150) || '',
      status: post.status,
      blogName: (post.blogs as { blog_name: string; platform: string }).blog_name,
      blogPlatform: (post.blogs as { blog_name: string; platform: string }).platform,
      keyword: (post.keywords as { keyword: string } | null)?.keyword || null,
      publishedUrl: post.published_url,
      publishedAt: post.published_at,
      createdAt: post.created_at,
    }));

    return { success: true, recentPosts };
  } catch (error) {
    console.error('Get recent posts error:', error);
    return { success: false, error: '포스트 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 구독 상태 조회
 */
export async function getSubscriptionStatus(): Promise<DashboardResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 구독 정보 조회
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 구독이 없으면 무료 플랜 기본값 반환
    if (subError?.code === 'PGRST116' || !subscription) {
      const defaultSubscription: SubscriptionInfo = {
        plan: 'free',
        planName: PLAN_NAMES.free,
        status: 'active',
        usageCount: 0,
        monthlyLimit: PLAN_LIMITS.free,
        usagePercentage: 0,
        remainingPosts: PLAN_LIMITS.free,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isLimitReached: false,
      };

      return { success: true, subscription: defaultSubscription };
    }

    if (subError) {
      console.error('Get subscription error:', subError);
      return { success: false, error: '구독 정보 조회에 실패했습니다.' };
    }

    const monthlyLimit = subscription.monthly_limit;
    const usageCount = subscription.usage_count;
    const remainingPosts = Math.max(0, monthlyLimit - usageCount);
    const usagePercentage =
      monthlyLimit > 0 ? Math.min(100, Math.round((usageCount / monthlyLimit) * 100)) : 0;

    const subscriptionInfo: SubscriptionInfo = {
      plan: subscription.plan,
      planName: PLAN_NAMES[subscription.plan] || subscription.plan,
      status: subscription.status,
      usageCount,
      monthlyLimit,
      usagePercentage,
      remainingPosts,
      periodEnd: subscription.current_period_end,
      isLimitReached: usageCount >= monthlyLimit && subscription.plan !== 'unlimited',
    };

    return { success: true, subscription: subscriptionInfo };
  } catch (error) {
    console.error('Get subscription status error:', error);
    return { success: false, error: '구독 정보 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 대시보드 전체 데이터 조회 (통합)
 */
export async function getDashboardData(): Promise<DashboardResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 병렬로 모든 데이터 조회
    const [statsResult, postsResult, subscriptionResult] = await Promise.all([
      getTodayStats(),
      getRecentPosts(5),
      getSubscriptionStatus(),
    ]);

    // 에러 확인
    if (!statsResult.success) {
      return statsResult;
    }
    if (!postsResult.success) {
      return postsResult;
    }
    if (!subscriptionResult.success) {
      return subscriptionResult;
    }

    return {
      success: true,
      stats: statsResult.stats,
      recentPosts: postsResult.recentPosts,
      subscription: subscriptionResult.subscription,
    };
  } catch (error) {
    console.error('Get dashboard data error:', error);
    return { success: false, error: '대시보드 데이터 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 연결된 블로그 수 조회
 */
export async function getConnectedBlogsCount(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { count, error: countError } = await supabase
      .from('blogs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (countError) {
      console.error('Get blogs count error:', countError);
      return { success: false, error: '블로그 수 조회에 실패했습니다.' };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Get connected blogs count error:', error);
    return { success: false, error: '블로그 수 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 월간 통계 조회
 */
export async function getMonthlyStats(): Promise<{
  success: boolean;
  totalPosts?: number;
  publishedPosts?: number;
  averagePerDay?: number;
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

    // 이번 달 시작일
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    if (postsError) {
      console.error('Get monthly stats error:', postsError);
      return { success: false, error: '월간 통계 조회에 실패했습니다.' };
    }

    const allPosts = posts || [];
    const publishedPosts = allPosts.filter((p) => p.status === 'published').length;
    const daysPassed = Math.max(1, now.getDate());
    const averagePerDay = Math.round((publishedPosts / daysPassed) * 10) / 10;

    return {
      success: true,
      totalPosts: allPosts.length,
      publishedPosts,
      averagePerDay,
    };
  } catch (error) {
    console.error('Get monthly stats error:', error);
    return { success: false, error: '월간 통계 조회 중 오류가 발생했습니다.' };
  }
}
