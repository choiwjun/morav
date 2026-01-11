'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { PLAN_NAMES, calculatePlanPrice } from '@/lib/constants/plans';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = searchParams.get('plan') || 'light';
  const blogCount = parseInt(searchParams.get('blogs') || '1', 10);
  const orderId = searchParams.get('orderId') || '';

  const planName = PLAN_NAMES[planId] || planId;
  const amount = calculatePlanPrice(planId, blogCount);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardContent className="p-12 text-center">
          {/* 성공 아이콘 */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>

          {/* 제목 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            결제가 완료되었습니다
          </h1>

          {/* 설명 */}
          <p className="text-gray-600 mb-8">
            구독이 활성화되었습니다. 이제 모든 기능을 사용하실 수 있습니다.
          </p>

          {/* 주문 정보 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-4">주문 정보</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">플랜</span>
                <span className="font-medium text-gray-900">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">블로그 수</span>
                <span className="font-medium text-gray-900">{blogCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제 금액</span>
                <span className="font-medium text-gray-900">
                  ₩{amount.toLocaleString()}
                </span>
              </div>
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">주문 번호</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {orderId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 다음 단계 */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">다음 단계</h3>
            <ul className="text-left space-y-2 text-gray-600">
              <li>• 대시보드에서 구독 정보를 확인할 수 있습니다</li>
              <li>• 키워드 탐색을 시작하여 콘텐츠를 생성하세요</li>
              <li>• 발행 스케줄을 설정하여 자동 발행을 시작하세요</li>
            </ul>
          </div>

          {/* 버튼 */}
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={handleGoToDashboard}
          >
            대시보드로 이동
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            결제 영수증은 이메일로 발송되었습니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessLoading() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<SuccessLoading />}>
      <SuccessContent />
    </Suspense>
  );
}
