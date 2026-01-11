import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/actions/dashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { SubscriptionWidget } from '@/components/dashboard/SubscriptionWidget';
import { FileText, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

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

  // 성공률 계산
  const successRate =
    stats.totalPosts > 0
      ? Math.round((stats.publishedPosts / stats.totalPosts) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-500">발행 현황을 한눈에 확인하세요</p>
      </div>

      {/* 오늘의 발행 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={<FileText className="text-blue-500" size={24} />}
          title="오늘 발행"
          value={stats.totalPosts}
          suffix="건"
        />
        <MetricCard
          icon={<CheckCircle className="text-green-500" size={24} />}
          title="발행 성공"
          value={stats.publishedPosts}
          suffix="건"
          percentage={successRate}
        />
        <MetricCard
          icon={<XCircle className="text-red-500" size={24} />}
          title="발행 실패"
          value={stats.failedPosts}
          suffix="건"
        />
        <MetricCard
          icon={<TrendingUp className="text-purple-500" size={24} />}
          title="성공률"
          value={successRate}
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 발행 목록 */}
        <div className="lg:col-span-2">
          <RecentPostsList posts={recentPosts} />
        </div>

        {/* 우측 위젯 */}
        <div className="lg:col-span-1">
          <SubscriptionWidget subscription={subscription} />
        </div>
      </div>
    </div>
  );
}
