'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
} from 'lucide-react';

interface AdminStats {
  users: {
    total: number;
    today: number;
    thisWeek: number;
  };
  subscriptions: {
    total: number;
    active: number;
    byPlan: {
      free: number;
      light: number;
      standard: number;
      pro: number;
      unlimited: number;
    };
  };
  posts: {
    total: number;
    published: number;
    failed: number;
    pending: number;
    today: {
      total: number;
      published: number;
      failed: number;
    };
  };
  blogs: {
    total: number;
    active: number;
    byPlatform: {
      blogger: number;
      wordpress: number;
    };
  };
  keywords: {
    last24h: number;
  };
  generatedAt: string;
}

function MetricCard({
  title,
  value,
  icon,
  description,
  color = 'blue',
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
}

function PlanDistribution({ byPlan }: { byPlan: AdminStats['subscriptions']['byPlan'] }) {
  const plans = [
    { key: 'free', name: '무료', color: 'bg-gray-400' },
    { key: 'light', name: '라이트', color: 'bg-blue-400' },
    { key: 'standard', name: '스탠다드', color: 'bg-green-400' },
    { key: 'pro', name: '프로', color: 'bg-purple-400' },
    { key: 'unlimited', name: '언리미티드', color: 'bg-orange-400' },
  ] as const;

  const total = Object.values(byPlan).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">플랜별 분포</h3>
      <div className="space-y-3">
        {plans.map((plan) => {
          const count = byPlan[plan.key];
          const percentage = ((count / total) * 100).toFixed(1);
          return (
            <div key={plan.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{plan.name}</span>
                <span className="text-gray-900 font-medium">
                  {count}명 ({percentage}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${plan.color} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlogPlatformStats({ byPlatform }: { byPlatform: AdminStats['blogs']['byPlatform'] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">플랫폼별 블로그</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{byPlatform.blogger}</p>
          <p className="text-sm text-gray-600">구글 블로거</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{byPlatform.wordpress}</p>
          <p className="text-sm text-gray-600">워드프레스</p>
        </div>
      </div>
    </div>
  );
}

function TodayStats({ today }: { today: AdminStats['posts']['today'] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘 발행 현황</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{today.total}</p>
          <p className="text-xs text-gray-500">전체</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{today.published}</p>
          <p className="text-xs text-gray-500">성공</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{today.failed}</p>
          <p className="text-xs text-gray-500">실패</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('통계 조회에 실패했습니다.');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || '데이터를 불러올 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          마지막 업데이트: {new Date(stats.generatedAt).toLocaleString('ko-KR')}
        </p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="전체 사용자"
          value={stats.users.total}
          icon={<Users size={24} />}
          description={`오늘 +${stats.users.today} / 이번주 +${stats.users.thisWeek}`}
          color="blue"
        />
        <MetricCard
          title="활성 구독"
          value={stats.subscriptions.active}
          icon={<CreditCard size={24} />}
          description={`전체 ${stats.subscriptions.total}건`}
          color="green"
        />
        <MetricCard
          title="발행 성공"
          value={stats.posts.published}
          icon={<CheckCircle size={24} />}
          description={`전체 ${stats.posts.total}건`}
          color="green"
        />
        <MetricCard
          title="발행 실패"
          value={stats.posts.failed}
          icon={<XCircle size={24} />}
          description={`대기 중 ${stats.posts.pending}건`}
          color="red"
        />
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PlanDistribution byPlan={stats.subscriptions.byPlan} />
        <TodayStats today={stats.posts.today} />
      </div>

      {/* 시스템 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="연동 블로그"
          value={stats.blogs.active}
          icon={<Globe size={24} />}
          description={`전체 ${stats.blogs.total}개`}
          color="purple"
        />
        <MetricCard
          title="대기 중 포스트"
          value={stats.posts.pending}
          icon={<Clock size={24} />}
          color="orange"
        />
        <MetricCard
          title="24시간 키워드"
          value={stats.keywords.last24h}
          icon={<TrendingUp size={24} />}
          description="최근 수집"
          color="blue"
        />
      </div>

      {/* 플랫폼별 블로그 */}
      <div className="mt-6">
        <BlogPlatformStats byPlatform={stats.blogs.byPlatform} />
      </div>
    </div>
  );
}
