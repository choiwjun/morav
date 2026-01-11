'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get('error') || '알 수 없는 오류가 발생했습니다.';

  const handleRetry = () => {
    router.push('/payment/plans');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardContent className="p-12 text-center">
          {/* 실패 아이콘 */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={48} className="text-red-600" />
            </div>
          </div>

          {/* 제목 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            결제에 실패했습니다
          </h1>

          {/* 에러 메시지 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>

          {/* 설명 */}
          <p className="text-gray-600 mb-8">
            결제가 완료되지 않았습니다. 다시 시도해주시거나 고객센터로 문의해주세요.
          </p>

          {/* 안내 사항 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">안내 사항</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• 카드 한도 초과 또는 잔액 부족일 수 있습니다</li>
              <li>• 카드 정보가 올바른지 확인해주세요</li>
              <li>• 문제가 지속되면 고객센터로 문의해주세요</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleGoToDashboard}
            >
              대시보드로 이동
            </Button>
            <Button
              variant="default"
              size="lg"
              className="flex-1"
              onClick={handleRetry}
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FailLoading() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<FailLoading />}>
      <FailContent />
    </Suspense>
  );
}
