'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  plan: string;
  status: string;
  usageCount: number;
  monthlyLimit: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  lastPayment: {
    amount: number;
    plan: string;
    status: string;
    createdAt: string;
  } | null;
}

interface Summary {
  total: number;
  active: number;
  byPlan: {
    free: number;
    light: number;
    standard: number;
    pro: number;
    unlimited: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PLAN_NAMES: Record<string, string> = {
  free: '무료',
  light: '라이트',
  standard: '스탠다드',
  pro: '프로',
  unlimited: '언리미티드',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  light: 'bg-blue-100 text-blue-700',
  standard: 'bg-green-100 text-green-700',
  pro: 'bg-purple-100 text-purple-700',
  unlimited: 'bg-orange-100 text-orange-700',
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}
    >
      {PLAN_NAMES[plan] || plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: '활성' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '취소됨' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: '만료' },
  };

  const config = statusConfig[status] || statusConfig.expired;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function SummaryCard({ summary }: { summary: Summary }) {
  const paidCount = summary.byPlan.light + summary.byPlan.standard + summary.byPlan.pro + summary.byPlan.unlimited;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 구독</p>
            <p className="text-xl font-bold text-gray-900">{summary.total}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">활성 구독</p>
            <p className="text-xl font-bold text-gray-900">{summary.active}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">유료 구독</p>
            <p className="text-xl font-bold text-gray-900">{paidCount}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">무료 사용자</p>
            <p className="text-xl font-bold text-gray-900">{summary.byPlan.free}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSubscriptions = useCallback(
    async (page: number, plan: string, status: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        if (plan) params.set('plan', plan);
        if (status) params.set('status', status);

        const response = await fetch(`/api/admin/subscriptions?${params}`);
        if (!response.ok) {
          throw new Error('구독 목록을 불러올 수 없습니다.');
        }

        const data = await response.json();
        setSubscriptions(data.subscriptions);
        setSummary(data.summary);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Fetch subscriptions error:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSubscriptions(pagination.page, planFilter, statusFilter);
  }, [pagination.page, planFilter, statusFilter, fetchSubscriptions]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (type: 'plan' | 'status', value: string) => {
    if (type === 'plan') {
      setPlanFilter(value);
    } else {
      setStatusFilter(value);
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-6 lg:p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">구독 관리</h1>
        <p className="text-sm text-gray-500 mt-1">구독 및 결제 현황 관리</p>
      </div>

      {/* 요약 카드 */}
      {summary && <SummaryCard summary={summary} />}

      {/* 필터 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">필터:</span>
        </div>
        <select
          value={planFilter}
          onChange={(e) => handleFilterChange('plan', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">모든 플랜</option>
          <option value="free">무료</option>
          <option value="light">라이트</option>
          <option value="standard">스탠다드</option>
          <option value="pro">프로</option>
          <option value="unlimited">언리미티드</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">모든 상태</option>
          <option value="active">활성</option>
          <option value="cancelled">취소됨</option>
          <option value="expired">만료</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  플랜
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  사용량
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  구독 기간
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  최근 결제
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="animate-pulse h-6 bg-gray-200 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    구독 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.userName || '이름 없음'}
                        </p>
                        <p className="text-sm text-gray-500">{sub.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={sub.plan} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{sub.usageCount}</span>
                        <span className="text-gray-500">
                          {' '}
                          / {sub.monthlyLimit === 999999 ? '무제한' : sub.monthlyLimit}
                        </span>
                      </div>
                      {sub.monthlyLimit !== 999999 && (
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min((sub.usageCount / sub.monthlyLimit) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(sub.periodStart).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {' ~ '}
                          {new Date(sub.periodEnd).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sub.lastPayment ? (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {sub.lastPayment.amount.toLocaleString()}원
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(sub.lastPayment.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
              건
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
