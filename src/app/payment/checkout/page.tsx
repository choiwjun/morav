'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLANS, calculatePlanPrice, PLAN_NAMES } from '@/lib/constants/plans';
import { toast } from 'sonner';
import { TossPaymentWidget, requestPayment, TossPaymentWidgetRef } from '@/components/payment/TossPaymentWidget';
import { PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { createClient } from '@/lib/supabase/client';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerKey, setCustomerKey] = useState<string>('');
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetRef = useRef<TossPaymentWidgetRef>(null);

  const planId = searchParams.get('plan') || 'light';
  const blogCount = parseInt(searchParams.get('blogs') || '1', 10);

  const planInfo = PLANS.find((p) => p.id === planId);
  const amount = calculatePlanPrice(planId, blogCount);

  // 고객 키 생성 (사용자 ID 기반)
  useEffect(() => {
    const getCustomerKey = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 사용자 ID를 고객 키로 사용
          setCustomerKey(user.id);
        } else {
          // 로그인하지 않은 경우 임시 키 생성
          const tempKey = `temp_${Date.now()}`;
          setCustomerKey(tempKey);
        }
      } catch (error) {
        console.error('Get customer key error:', error);
        // 에러 발생 시 임시 키 사용
        setCustomerKey(`temp_${Date.now()}`);
      }
    };

    getCustomerKey();
  }, []);

  // 플랜 정보가 없으면 플랜 선택 페이지로 리다이렉트
  useEffect(() => {
    if (!planInfo || planId === 'free') {
      router.push('/payment/plans');
    }
  }, [planInfo, planId, router]);

  if (!planInfo || planId === 'free') {
    return null;
  }

  // planName을 handlePayment보다 먼저 정의
  const planName = PLAN_NAMES[planId] || planId;
  const description = `${blogCount}개 블로그 · 월 ${planInfo.posts}`;

  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast.error('약관에 동의해주세요.');
      return;
    }

    if (!widgetReady) {
      toast.error('결제 위젯이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const paymentWidget = widgetRef.current?.getWidget();
    if (!paymentWidget) {
      toast.error('결제 위젯을 불러올 수 없습니다.');
      return;
    }

    setLoading(true);

    try {
      // 주문 ID 생성 (format: morav_{planId}_{timestamp}_{userId})
      const orderId = `morav_${planId}_${Date.now()}_${customerKey}`;

      // 성공/실패 URL 생성
      const successUrl = `${window.location.origin}/payment/success?plan=${planId}&blogs=${blogCount}&orderId=${orderId}`;
      const failUrl = `${window.location.origin}/payment/fail?error=${encodeURIComponent('결제가 취소되었습니다.')}`;

      // 토스페이먼츠 결제 요청
      await requestPayment(
        paymentWidget,
        orderId,
        planName,
        successUrl,
        failUrl
      );

      // requestPayment는 리다이렉트를 처리하므로 여기까지 도달하지 않음
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '결제 중 오류가 발생했습니다.';
      toast.error(errorMessage);
      router.push(
        `/payment/fail?error=${encodeURIComponent(errorMessage)}`
      );
      setLoading(false);
    }
  };

  const handleWidgetReady = (_widget: PaymentWidgetInstance) => {
    setWidgetReady(true);
  };

  const handleWidgetError = (error: Error) => {
    console.error('Widget error:', error);
    toast.error('결제 위젯을 불러올 수 없습니다.');
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">결제하기</h1>

      {/* 주문 정보 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">주문 정보</h3>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">{planName}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <p className="font-bold text-gray-900">
              ₩{amount.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="font-semibold text-gray-900">총 결제 금액</p>
            <p className="text-2xl font-bold text-blue-600">
              ₩{amount.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 토스페이먼츠 위젯 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">결제 수단 선택</h3>
          {customerKey ? (
            <TossPaymentWidget
              ref={widgetRef}
              amount={amount}
              customerKey={customerKey}
              onReady={handleWidgetReady}
              onError={handleWidgetError}
            />
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">결제 위젯을 준비하는 중...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 약관 동의 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <p className="text-sm text-gray-700">
              <a
                href="/terms"
                className="text-blue-600 underline hover:text-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                이용약관
              </a>{' '}
              및{' '}
              <a
                href="/privacy"
                className="text-blue-600 underline hover:text-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                개인정보처리방침
              </a>
              에 동의합니다 (필수)
            </p>
          </label>
        </CardContent>
      </Card>

      {/* 결제 버튼 */}
      <Button
        variant="default"
        size="lg"
        className="w-full"
        disabled={!agreedToTerms || loading}
        onClick={handlePayment}
      >
        {loading ? '결제 중...' : `₩${amount.toLocaleString()} 결제하기`}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-4">
        안전한 결제를 위해 SSL 보안 연결을 사용합니다
      </p>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
        <div className="h-48 bg-gray-200 rounded mb-6"></div>
        <div className="h-32 bg-gray-200 rounded mb-6"></div>
        <div className="h-16 bg-gray-200 rounded mb-6"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
