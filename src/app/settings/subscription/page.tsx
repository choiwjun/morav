'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
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
    // TODO: 구독 취소 API 구현
    toast.info('구독 취소 기능은 곧 제공될 예정입니다.');
    setShowCancelModal(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">구독 정보를 불러올 수 없습니다.</p>
            <Button variant="outline" onClick={loadSubscription}>
              다시 시도
            </Button>
          </CardContent>
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">구독 플랜</h1>

      {/* 현재 플랜 */}
      <Card className="p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Badge variant="default" className="mb-2">현재 플랜</Badge>
            <h2 className="text-3xl font-bold mb-2">{subscription.planName}</h2>
            <p className="text-gray-500">
              {currentPlanInfo && currentPlanInfo.price > 0
                ? `월 ₩${currentPlanInfo.price.toLocaleString()}`
                : '무료'}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">다음 결제일</p>
            <p className="font-semibold">{formatDate(subscription.periodEnd)}</p>
          </div>
        </div>

        {/* 플랜 상세 */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
          <div>
            <p className="text-sm text-gray-500 mb-1">월 발행 한도</p>
            <p className="text-xl font-bold">{subscription.monthlyLimit}건</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">연동 가능 블로그</p>
            <p className="text-xl font-bold">3개</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">모든 기능</p>
            <p className="text-xl font-bold">✓ 포함</p>
          </div>
        </div>

        {/* 사용 현황 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">이번 달 사용량</h3>
            <span className="text-sm text-gray-500">
              {subscription.usageCount} / {subscription.monthlyLimit}건
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            {subscription.remainingPosts}건 남음 · {formatDate(resetDate.toISOString())}에 초기화
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button variant="default" onClick={() => router.push('/payment/plans')}>
            플랜 변경
          </Button>
          <Button variant="outline" onClick={() => setShowBillingHistoryModal(true)}>
            결제 내역
          </Button>
          <Button variant="outline" onClick={() => setShowCancelModal(true)}>
            구독 취소
          </Button>
        </div>
      </Card>

      {/* 플랜 비교 */}
      <div>
        <h2 className="text-xl font-bold mb-4">다른 플랜 보기</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`p-4 ${
                subscription.plan === plan.id
                  ? 'border-2 border-blue-500'
                  : ''
              }`}
            >
              {plan.badge && (
                <Badge variant="default" className="mb-2">
                  {plan.badge}
                </Badge>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold">
                  {plan.price === 0
                    ? '무료'
                    : `₩${plan.price.toLocaleString()}`}
                </div>
                {plan.price > 0 && (
                  <p className="text-gray-500 text-sm">/월</p>
                )}
              </div>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span>월 {plan.posts} 발행</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span>최대 3개 블로그</span>
                </li>
              </ul>
              {subscription.plan === plan.id ? (
                <Button variant="outline" className="w-full" disabled>
                  현재 플랜
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/payment/plans')}
                >
                  변경하기
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* 결제 내역 모달 */}
      {showBillingHistoryModal && (
        <BillingHistoryModal
          isOpen={showBillingHistoryModal}
          onClose={() => setShowBillingHistoryModal(false)}
        />
      )}

      {/* 구독 취소 확인 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">구독 취소</h3>
            <p className="text-gray-600 mb-6">
              구독을 취소하시겠습니까? 현재 플랜의 혜택은 {formatDate(subscription.periodEnd)}까지 유지됩니다.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleCancelSubscription}>
                구독 취소
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
