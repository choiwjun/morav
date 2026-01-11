'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

interface TossPaymentWidgetProps {
  amount: number;
  customerKey: string;
  onReady?: (widget: PaymentWidgetInstance) => void;
  onError?: (error: Error) => void;
}

export interface TossPaymentWidgetRef {
  getWidget: () => PaymentWidgetInstance | null;
}

export const TossPaymentWidget = forwardRef<
  TossPaymentWidgetRef,
  TossPaymentWidgetProps
>(function TossPaymentWidget({ amount, customerKey, onReady, onError }, ref) {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    getWidget: () => paymentWidgetRef.current,
  }));

  useEffect(() => {
    const initWidget = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

        if (!clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
        }

        // 위젯 로드
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

        // 결제 수단 렌더링
        await paymentWidget.renderPaymentMethods('#payment-widget', {
          value: amount,
          currency: 'KRW',
        });

        // 이용약관 렌더링 (선택사항)
        await paymentWidget.renderAgreement('#agreement', {
          variantKey: 'AGREEMENT',
        });

        paymentWidgetRef.current = paymentWidget;
        setIsLoading(false);
        onReady?.(paymentWidget);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '결제 위젯을 불러오는 중 오류가 발생했습니다.';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    initWidget();

    // 클린업
    return () => {
      if (paymentWidgetRef.current) {
        // 위젯 인스턴스 정리 (필요한 경우)
        paymentWidgetRef.current = null;
      }
    };
  }, [amount, customerKey, onReady, onError]);

  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <p className="text-red-700 text-sm">{error}</p>
        <p className="text-red-600 text-xs mt-2">
          결제 위젯을 불러올 수 없습니다. 관리자에게 문의해주세요.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">결제 위젯을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div id="payment-widget" className="mb-4"></div>
      <div id="agreement"></div>
    </div>
  );
});

/**
 * 결제 요청 함수
 */
export async function requestPayment(
  paymentWidget: PaymentWidgetInstance,
  orderId: string,
  orderName: string,
  successUrl: string,
  failUrl: string
): Promise<void> {
  try {
    await paymentWidget.requestPayment({
      orderId,
      orderName,
      successUrl,
      failUrl,
    });
  } catch (error) {
    throw error;
  }
}
