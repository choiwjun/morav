'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CreditCard, CheckCircle, Calendar, TrendingUp, FileText, Zap, AlertTriangle } from 'lucide-react';
import { PLANS } from '@/lib/constants/plans';
import { toast } from 'sonner';
import { BillingHistoryModal } from '@/components/settings/BillingHistoryModal';

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

interface SubscriptionResponse {
  success: boolean;
  subscription?: SubscriptionInfo;
  error?: string;
}

/**
 * 날짜 포맷팅 (예: "2026-02-01")
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBillingHistoryModal, setShowBillingHistoryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/dashboard/subscription');
      const data: SubscriptionResponse = await response.json();

      if (!data.success || !data.subscription) {
        toast.error(data.error || '구독 정보를 불러올 수 없습니다.');
        return;
      }

      setSubscription(data.subscription);
    } catch (error) {
      console.error('Load subscription error:', error);
      toast.error('구독 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || subscription.plan === 'free') {
      toast.error('무료 플랜은 취소할 수 없습니다.');
      setShowCancelModal(false);
      return;
    }

    setCancelLoading(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: cancelReason || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || '구독 취소에 실패했습니다.');
        return;
      }

      toast.success(data.message || '구독이 취소되었습니다.');
      setShowCancelModal(false);
      setCancelReason('');
      loadSubscription(); // 구독 정보 새로고침
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('구독 취소 중 오류가 발생했습니다.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-[#cdd6ea]">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-24 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <Card className="border-[#cdd6ea] shadow-sm">
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f4ff] flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-[#4562a1]" />
            </div>
            <p className="text-[#4562a1] mb-4">구독 정보를 불러올 수 없습니다.</p>
            <Button variant="outline" onClick={loadSubscription} className="border-[#cdd6ea]">
              다시 시도
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentPlanInfo = PLANS.find((p) => p.id === subscription.plan);
  const usagePercentage = subscription.monthlyLimit > 0
    ? Math.min(100, Math.round((subscription.usageCount / subscription.monthlyLimit) * 100))
    : 0;

  // 다음 초기화일 계산 (매월 1일)
  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);
  resetDate.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#4562a1]" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">현재 플랜</p>
              <p className="text-xl font-bold text-[#0c111d]">{subscription.planName}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">사용량</p>
              <p className="text-xl font-bold text-[#0c111d]">{subscription.usageCount}/{subscription.monthlyLimit}건</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">남은 발행</p>
              <p className="text-xl font-bold text-[#0c111d]">{subscription.remainingPosts}건</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 현재 플랜 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4]">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-[#4562a1]" />
            <h2 className="text-lg font-semibold text-[#0c111d]">구독 플랜</h2>
          </div>
        </div>

        <div className="p-6">
          {/* 플랜 정보 */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6 pb-6 border-b border-[#e6ebf4]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-[#4562a1] text-white">현재 플랜</Badge>
                {subscription.status === 'active' && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">활성화</Badge>
                )}
              </div>
              <h3 className="text-3xl font-bold text-[#0c111d] mb-2">{subscription.planName}</h3>
              <p className="text-[#4562a1]">
                {currentPlanInfo && currentPlanInfo.price > 0
                  ? `월 ₩${currentPlanInfo.price.toLocaleString()}`
                  : '무료'}
              </p>
            </div>

            <div className="text-left lg:text-right">
              <div className="flex items-center gap-2 text-[#4562a1] mb-1">
                <Calendar size={16} />
                <span className="text-sm">다음 결제일</span>
              </div>
              <p className="text-xl font-bold text-[#0c111d]">{formatDate(subscription.periodEnd)}</p>
            </div>
          </div>

          {/* 플랜 상세 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-[#e6ebf4]">
            <div className="p-4 bg-[#f9fafa] rounded-lg">
              <p className="text-sm text-[#4562a1] mb-1">월 발행 한도</p>
              <p className="text-2xl font-bold text-[#0c111d]">{subscription.monthlyLimit}건</p>
            </div>
            <div className="p-4 bg-[#f9fafa] rounded-lg">
              <p className="text-sm text-[#4562a1] mb-1">연동 가능 블로그</p>
              <p className="text-2xl font-bold text-[#0c111d]">3개</p>
            </div>
            <div className="p-4 bg-[#f9fafa] rounded-lg">
              <p className="text-sm text-[#4562a1] mb-1">모든 기능</p>
              <p className="text-2xl font-bold text-green-600">
                <CheckCircle className="inline w-6 h-6" /> 포함
              </p>
            </div>
          </div>

          {/* 사용 현황 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-[#0c111d]">이번 달 사용량</h4>
              <span className="text-sm text-[#4562a1]">
                {subscription.usageCount} / {subscription.monthlyLimit}건
              </span>
            </div>
            <Progress
              value={usagePercentage}
              className="h-3"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[#4562a1]">
                {subscription.remainingPosts}건 남음
              </p>
              <p className="text-xs text-[#4562a1]">
                {formatDate(resetDate.toISOString())}에 초기화
              </p>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => router.push('/payment/plans')}
              className="bg-[#4562a1] hover:bg-[#3a5289]"
            >
              <Zap size={16} className="mr-2" />
              플랜 업그레이드
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBillingHistoryModal(true)}
              className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
            >
              결제 내역
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              구독 취소
            </Button>
          </div>
        </div>
      </Card>

      {/* 다른 플랜 보기 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4]">
          <h2 className="text-lg font-semibold text-[#0c111d]">다른 플랜 보기</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-all ${
                  subscription.plan === plan.id
                    ? 'border-[#4562a1] bg-[#f0f4ff]'
                    : 'border-[#cdd6ea] hover:border-[#4562a1] hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <Badge className="mb-2 bg-[#4562a1] text-white">
                    {plan.badge}
                  </Badge>
                )}
                <h3 className="text-xl font-bold text-[#0c111d] mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-[#0c111d]">
                    {plan.price === 0
                      ? '무료'
                      : `₩${plan.price.toLocaleString()}`}
                  </div>
                  {plan.price > 0 && (
                    <p className="text-sm text-[#4562a1]">/월</p>
                  )}
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-[#4562a1]">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span>월 {plan.posts} 발행</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#4562a1]">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span>최대 3개 블로그</span>
                  </li>
                </ul>
                {subscription.plan === plan.id ? (
                  <Button
                    variant="outline"
                    className="w-full border-[#4562a1] text-[#4562a1]"
                    disabled
                  >
                    현재 플랜
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
                    onClick={() => router.push('/payment/plans')}
                  >
                    변경하기
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 결제 내역 모달 */}
      {showBillingHistoryModal && (
        <BillingHistoryModal
          isOpen={showBillingHistoryModal}
          onClose={() => setShowBillingHistoryModal(false)}
        />
      )}

      {/* 구독 취소 확인 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-[#cdd6ea] shadow-xl">
            <div className="p-6 border-b border-[#e6ebf4] bg-red-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-red-600">구독 취소</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[#0c111d]">
                정말 구독을 취소하시겠습니까?
              </p>

              <div className="p-4 bg-[#f9fafa] rounded-lg space-y-2">
                <p className="text-sm text-[#4562a1]">
                  구독 취소 시:
                </p>
                <ul className="text-sm text-[#4562a1] space-y-1 list-disc list-inside">
                  <li>현재 플랜의 혜택은 <strong>{formatDate(subscription.periodEnd)}</strong>까지 유지됩니다</li>
                  <li>이후 무료 플랜으로 자동 전환됩니다</li>
                  <li>언제든지 다시 구독할 수 있습니다</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  취소 사유 (선택)
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4562a1] focus:border-[#4562a1]"
                >
                  <option value="">선택해주세요</option>
                  <option value="too_expensive">가격이 비쌉니다</option>
                  <option value="not_using">서비스를 자주 사용하지 않습니다</option>
                  <option value="missing_features">필요한 기능이 없습니다</option>
                  <option value="switching_service">다른 서비스로 전환합니다</option>
                  <option value="temporary">일시적으로 중단합니다</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#e6ebf4]">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  disabled={cancelLoading}
                  className="border-[#cdd6ea]"
                >
                  돌아가기
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {cancelLoading ? '처리 중...' : '구독 취소'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
