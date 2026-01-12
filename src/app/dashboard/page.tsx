import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/actions/dashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';
import { SubscriptionWidget } from '@/components/dashboard/SubscriptionWidget';
import { WeeklyStatsWidget } from '@/components/dashboard/WeeklyStatsWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { TrendingKeywordsWidget } from '@/components/dashboard/TrendingKeywordsWidget';
import { FileText, CheckCircle, XCircle, TrendingUp, Zap, Bell, Settings } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const result = await getDashboardData();

  if (!result.success || !result.stats || !result.recentPosts || !result.subscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            {result.error || '대시보드 데이터를 불러올 수 없습니다.'}
          </p>
        </div>
      </div>
    );
  }

  const { stats, recentPosts, subscription } = result;

  // 사용자 이름 추출 (이메일에서 @ 앞부분 또는 메타데이터에서)
  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';

  // 성공률 계산
  const successRate = stats.totalPosts > 0
    ? Math.round((stats.publishedPosts / stats.totalPosts) * 100)
    : 100;

  return (
    <div className="bg-[#f9fafa] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-[#f9fafa]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-0.5 mb-3 sm:mb-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c111d]">
            안녕하세요, {userName}님 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#4562a1]">
            오늘도 블로그 자동화가 원활하게 진행 중입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-[#4562a1] hover:bg-white hover:text-[#0c111d] rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <Link
            href="/settings"
            className="p-2 text-[#4562a1] hover:bg-white hover:text-[#0c111d] rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard/posts/new"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Start</span>
            <span className="sm:hidden">발행</span>
          </Link>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Stats Grid - 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <MetricCard
            icon={<FileText className="w-5 h-5" />}
            title="오늘 발행"
            value={stats.totalPosts}
            suffix="건"
            trend={{
              value: 12,
              direction: 'up',
            }}
          />
          <MetricCard
            icon={<CheckCircle className="w-5 h-5 text-[#07883d]" />}
            title="발행 성공"
            value={stats.publishedPosts}
            suffix="건"
          />
          <MetricCard
            icon={<XCircle className="w-5 h-5 text-red-500" />}
            title="발행 실패"
            value={stats.failedPosts}
            suffix="건"
            trend={stats.failedPosts > 0 ? {
              value: 50,
              direction: 'down',
            } : undefined}
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            title="성공률"
            value={successRate}
            suffix="%"
          />
        </div>

        {/* Main Content Area - 2 column layout on large screens */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left Column: Recent Posts, Weekly Chart & Trending Keywords */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <RecentPostsList posts={recentPosts} />
            <WeeklyChart />
            <TrendingKeywordsWidget keywords={[]} />
          </div>

          {/* Right Column: Widgets */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4 sm:space-y-6 order-1 lg:order-2">
            <SubscriptionWidget subscription={subscription} />
            <WeeklyStatsWidget
              publishCount={stats.publishedPosts}
              avgViews={1234}
              successRate={successRate}
            />
            <QuickActionsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
