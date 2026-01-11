'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { PLANS, calculatePlanPrice } from '@/lib/constants/plans';

export default function PlansPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('light');
  const [blogCount, setBlogCount] = useState<number>(1);

  const selectedPlanInfo = PLANS.find((p) => p.id === selectedPlan);

  const handleCheckout = () => {
    if (!selectedPlanInfo) return;

    const params = new URLSearchParams({
      plan: selectedPlan,
      blogs: blogCount.toString(),
    });
    router.push(`/payment/checkout?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-12">
      {/* 헤더 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">플랜 선택</h1>
        <p className="text-xl text-gray-600">
          사용량에 맞는 플랜을 선택하세요
        </p>
      </div>

      {/* 플랜 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            data-testid={`plan-card-${plan.id}`}
            className={`p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-2 border-blue-500 shadow-xl'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.badge && (
              <Badge variant="default" className="mb-4">
                {plan.badge}
              </Badge>
            )}

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h3>

            <div className="mb-4">
              <div className="text-4xl font-bold text-gray-900">
                {plan.price === 0
                  ? '무료'
                  : `₩${plan.price.toLocaleString()}`}
              </div>
              {plan.price > 0 && (
                <p className="text-gray-500 text-sm mt-1">/월</p>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span>월 {plan.posts} 발행</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span>최대 3개 블로그</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span>모든 기능 포함</span>
              </li>
            </ul>

            <Button
              variant={selectedPlan === plan.id ? 'default' : 'outline'}
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlan(plan.id);
              }}
            >
              {selectedPlan === plan.id ? '선택됨' : '선택하기'}
            </Button>
          </Card>
        ))}
      </div>

      {/* 블로그 수 선택 */}
      {selectedPlan !== 'free' && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">블로그 수 선택</h3>
            <div className="flex gap-4">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  onClick={() => setBlogCount(count)}
                  className={`
                    flex-1 p-4 border-2 rounded-lg text-center transition-all
                    ${
                      blogCount === count
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {count}개
                  </p>
                  <p className="text-sm text-gray-500">
                    ₩{calculatePlanPrice(selectedPlan, count).toLocaleString()}/월
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 결제 요약 */}
      <Card className="bg-gray-50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {selectedPlanInfo?.name}
              </h3>
              <p className="text-gray-500">
                {blogCount}개 블로그 · 월 {selectedPlanInfo?.posts}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">월 결제 금액</p>
              <p className="text-3xl font-bold text-gray-900">
                ₩{calculatePlanPrice(selectedPlan, blogCount).toLocaleString()}
              </p>
            </div>
          </div>

          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={selectedPlan === 'free'}
          >
            결제하기
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            7일 이내 100% 환불 보장 · 언제든지 취소 가능
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
