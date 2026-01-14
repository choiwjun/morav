'use client';

import { useEffect, useState } from 'react';
import {
  Globe,
  TrendingUp,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemStats {
  keywords: {
    total: number;
    last24h: number;
    byCategory: Record<string, number>;
    bySource: {
      naver: number;
      google: number;
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
  recentErrors: Array<{
    id: string;
    message: string;
    createdAt: string;
    postTitle: string;
  }>;
}

function StatCard({
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
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

export default function AdminSystemPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/system');
      if (!response.ok) {
        throw new Error('시스템 정보를 불러올 수 없습니다.');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Fetch system stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 현황</h1>
          <p className="text-sm text-gray-500 mt-1">키워드 수집 및 블로그 연동 상태</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {stats && (
        <>
          {/* 키워드 통계 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">키워드 수집 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="전체 키워드"
                value={stats.keywords.total}
                icon={<Database size={24} />}
                color="blue"
              />
              <StatCard
                title="24시간 수집"
                value={stats.keywords.last24h}
                icon={<TrendingUp size={24} />}
                color="green"
              />
              <StatCard
                title="네이버"
                value={stats.keywords.bySource.naver}
                icon={<TrendingUp size={24} />}
                color="green"
              />
              <StatCard
                title="구글"
                value={stats.keywords.bySource.google}
                icon={<TrendingUp size={24} />}
                color="blue"
              />
            </div>
          </div>

          {/* 카테고리별 키워드 */}
          {Object.keys(stats.keywords.byCategory).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 키워드</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(stats.keywords.byCategory).map(([category, count]) => (
                    <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">{category}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 블로그 연동 현황 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">블로그 연동 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="전체 블로그"
                value={stats.blogs.total}
                icon={<Globe size={24} />}
                color="purple"
              />
              <StatCard
                title="활성 블로그"
                value={stats.blogs.active}
                icon={<CheckCircle size={24} />}
                color="green"
              />
              <StatCard
                title="구글 블로거"
                value={stats.blogs.byPlatform.blogger}
                icon={<Globe size={24} />}
                color="blue"
              />
              <StatCard
                title="워드프레스"
                value={stats.blogs.byPlatform.wordpress}
                icon={<Globe size={24} />}
                color="purple"
              />
            </div>
          </div>

          {/* 최근 에러 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 발행 실패</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {stats.recentErrors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>최근 발행 실패가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {stats.recentErrors.map((error) => (
                    <div key={error.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{error.postTitle}</p>
                          <p className="text-sm text-red-600 mt-1">{error.message}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(error.createdAt).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
