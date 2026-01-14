'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  TrendingUp,
  Filter,
  X,
  Edit2,
  Save,
  RefreshCw,
  User,
  FileText,
  DollarSign,
  AlertCircle,
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

interface SubscriptionDetail {
  subscription: {
    id: string;
    userId: string;
    plan: string;
    status: string;
    usageCount: number;
    monthlyLimit: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    createdAt: string;
  } | null;
  payments: {
    id: string;
    amount: number;
    plan: string;
    status: string;
    method: string;
    createdAt: string;
  }[];
  stats: {
    posts: {
      total: number;
      published: number;
      failed: number;
    };
    blogs: number;
  };
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

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  light: 50,
  standard: 150,
  pro: 500,
  unlimited: 999999,
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  light: 'bg-blue-100 text-blue-700',
  standard: 'bg-green-100 text-green-700',
  pro: 'bg-purple-100 text-purple-700',
  unlimited: 'bg-orange-100 text-orange-700',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: '활성' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '취소됨' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: '만료' },
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
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.expired;
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

// 구독 상세 모달
function SubscriptionDetailModal({
  subscriptionId,
  onClose,
  onUpdate,
}: {
  subscriptionId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [detail, setDetail] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'payments'>('info');

  // 편집용 상태
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editUsageCount, setEditUsageCount] = useState(0);
  const [editMonthlyLimit, setEditMonthlyLimit] = useState(0);
  const [editPeriodEnd, setEditPeriodEnd] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setDetail(data);

        // 편집 초기값 설정
        setEditPlan(data.subscription.plan);
        setEditStatus(data.subscription.status);
        setEditUsageCount(data.subscription.usageCount);
        setEditMonthlyLimit(data.subscription.monthlyLimit);
        setEditPeriodEnd(data.subscription.currentPeriodEnd.split('T')[0]);
      } catch (error) {
        console.error('Fetch subscription detail error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [subscriptionId]);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);

    try {
      const updates: Record<string, unknown> = {};

      if (editPlan !== detail.subscription.plan) {
        updates.plan = editPlan;
      }
      if (editStatus !== detail.subscription.status) {
        updates.status = editStatus;
      }
      if (editUsageCount !== detail.subscription.usageCount) {
        updates.usageCount = editUsageCount;
      }
      if (editMonthlyLimit !== detail.subscription.monthlyLimit) {
        updates.monthlyLimit = editMonthlyLimit;
      }
      const newPeriodEnd = new Date(editPeriodEnd).toISOString();
      if (newPeriodEnd !== detail.subscription.currentPeriodEnd) {
        updates.periodEnd = newPeriodEnd;
      }

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Update failed');

      setIsEditing(false);
      onUpdate();

      // 새로고침
      const refreshResponse = await fetch(`/api/admin/subscriptions/${subscriptionId}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setDetail(data);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetUsage = async () => {
    if (!confirm('사용량을 0으로 리셋하시겠습니까?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usageCount: 0 }),
      });

      if (!response.ok) throw new Error('Reset failed');

      setEditUsageCount(0);
      onUpdate();

      // 새로고침
      const refreshResponse = await fetch(`/api/admin/subscriptions/${subscriptionId}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setDetail(data);
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('리셋 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendPeriod = async (days: number) => {
    if (!detail) return;
    if (!confirm(`구독 기간을 ${days}일 연장하시겠습니까?`)) return;

    setSaving(true);
    try {
      const currentEnd = new Date(detail.subscription.currentPeriodEnd);
      currentEnd.setDate(currentEnd.getDate() + days);

      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodEnd: currentEnd.toISOString() }),
      });

      if (!response.ok) throw new Error('Extend failed');

      setEditPeriodEnd(currentEnd.toISOString().split('T')[0]);
      onUpdate();

      // 새로고침
      const refreshResponse = await fetch(`/api/admin/subscriptions/${subscriptionId}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setDetail(data);
      }
    } catch (error) {
      console.error('Extend error:', error);
      alert('연장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('정말로 이 구독을 취소하시겠습니까?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Cancel failed');

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('취소 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanChange = (newPlan: string) => {
    setEditPlan(newPlan);
    setEditMonthlyLimit(PLAN_LIMITS[newPlan] || 10);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <p className="text-gray-500">구독 정보를 불러올 수 없습니다.</p>
          <Button onClick={onClose} className="mt-4">
            닫기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {detail.user?.name?.[0] || detail.user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {detail.user?.name || detail.user?.email || '알 수 없음'}
              </h2>
              <p className="text-sm text-gray-500">{detail.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" />
                수정
              </Button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'info'
                ? 'text-red-600 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              구독 정보
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'payments'
                ? 'text-red-600 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              결제 내역 ({detail.payments.length})
            </div>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* 사용자 통계 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <User className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{detail.stats.blogs}</p>
                  <p className="text-xs text-gray-500">연동 블로그</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <FileText className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{detail.stats.posts.total}</p>
                  <p className="text-xs text-gray-500">총 포스트</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{detail.stats.posts.published}</p>
                  <p className="text-xs text-gray-500">발행 완료</p>
                </div>
              </div>

              {/* 구독 정보 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">구독 정보</h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* 플랜 */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">플랜</label>
                    {isEditing ? (
                      <select
                        value={editPlan}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="free">무료</option>
                        <option value="light">라이트</option>
                        <option value="standard">스탠다드</option>
                        <option value="pro">프로</option>
                        <option value="unlimited">언리미티드</option>
                      </select>
                    ) : (
                      <PlanBadge plan={detail.subscription.plan} />
                    )}
                  </div>

                  {/* 상태 */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">상태</label>
                    {isEditing ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="active">활성</option>
                        <option value="cancelled">취소됨</option>
                        <option value="expired">만료</option>
                      </select>
                    ) : (
                      <StatusBadge status={detail.subscription.status} />
                    )}
                  </div>
                </div>

                {/* 사용량 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500">사용량</label>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetUsage}
                        disabled={saving}
                        className="text-xs h-6 px-2"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        리셋
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editUsageCount}
                        onChange={(e) => setEditUsageCount(parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        min={0}
                      />
                      <span className="text-gray-500">/</span>
                      <input
                        type="number"
                        value={editMonthlyLimit}
                        onChange={(e) => setEditMonthlyLimit(parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        min={1}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {detail.subscription.usageCount} /{' '}
                          {detail.subscription.monthlyLimit === 999999
                            ? '무제한'
                            : detail.subscription.monthlyLimit}
                        </span>
                        {detail.subscription.monthlyLimit !== 999999 && (
                          <span className="text-xs text-gray-500">
                            {Math.round(
                              (detail.subscription.usageCount / detail.subscription.monthlyLimit) *
                                100
                            )}
                            %
                          </span>
                        )}
                      </div>
                      {detail.subscription.monthlyLimit !== 999999 && (
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (detail.subscription.usageCount /
                                  detail.subscription.monthlyLimit) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 구독 기간 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500">구독 기간</label>
                    {!isEditing && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtendPeriod(7)}
                          disabled={saving}
                          className="text-xs h-6 px-2"
                        >
                          +7일
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtendPeriod(30)}
                          disabled={saving}
                          className="text-xs h-6 px-2"
                        >
                          +30일
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <span className="text-xs text-gray-400">시작일</span>
                        <p className="text-sm text-gray-700">
                          {new Date(detail.subscription.currentPeriodStart).toLocaleDateString(
                            'ko-KR'
                          )}
                        </p>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-gray-400">종료일</span>
                        <input
                          type="date"
                          value={editPeriodEnd}
                          onChange={(e) => setEditPeriodEnd(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {new Date(detail.subscription.currentPeriodStart).toLocaleDateString(
                          'ko-KR'
                        )}{' '}
                        ~{' '}
                        {new Date(detail.subscription.currentPeriodEnd).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 위험 영역 */}
              {!isEditing && detail.subscription.status === 'active' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-700">구독 취소</h4>
                      <p className="text-sm text-red-600 mt-1">
                        이 작업은 사용자의 구독을 즉시 취소합니다.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelSubscription}
                        disabled={saving}
                        className="mt-3 border-red-300 text-red-600 hover:bg-red-100"
                      >
                        구독 취소
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              {detail.payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">결제 내역이 없습니다.</div>
              ) : (
                detail.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          payment.status === 'completed'
                            ? 'bg-green-50'
                            : payment.status === 'failed'
                              ? 'bg-red-50'
                              : 'bg-gray-50'
                        }`}
                      >
                        <DollarSign
                          className={`w-5 h-5 ${
                            payment.status === 'completed'
                              ? 'text-green-600'
                              : payment.status === 'failed'
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {PLAN_NAMES[payment.plan] || payment.plan} 플랜
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {payment.amount.toLocaleString()}원
                      </p>
                      <p
                        className={`text-xs ${
                          payment.status === 'completed'
                            ? 'text-green-600'
                            : payment.status === 'failed'
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {payment.status === 'completed'
                          ? '결제 완료'
                          : payment.status === 'failed'
                            ? '결제 실패'
                            : payment.status === 'pending'
                              ? '대기 중'
                              : payment.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

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

  const handleRowClick = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
  };

  const handleModalClose = () => {
    setSelectedSubscriptionId(null);
  };

  const handleUpdate = () => {
    fetchSubscriptions(pagination.page, planFilter, statusFilter);
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
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(sub.id)}
                  >
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

      {/* 구독 상세 모달 */}
      {selectedSubscriptionId && (
        <SubscriptionDetailModal
          subscriptionId={selectedSubscriptionId}
          onClose={handleModalClose}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
