'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  CreditCard,
  Zap,
  ArrowLeft,
  Globe,
  FileText,
  Shield,
  Sparkles
} from 'lucide-react';
import { PLANS, calculatePlanPrice } from '@/lib/constants/plans';
import { toast } from 'sonner';

export default function PlansPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('light');
  const [blogCount, setBlogCount] = useState<number>(1);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/dashboard/subscription');
      const data = await response.json();

      if (data.success && data.subscription) {
        setCurrentPlan(data.subscription.plan);
      }
    } catch (error) {
      console.error('Load subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanInfo = PLANS.find((p) => p.id === selectedPlan);
  const currentPlanInfo = PLANS.find((p) => p.id === currentPlan);

  const handleCheckout = () => {
    if (!selectedPlanInfo) return;

    if (selectedPlan === 'free') {
      toast.info('무료 플랜은 결제가 필요하지 않습니다.');
      return;
    }

    if (selectedPlan === currentPlan) {
      toast.info('이미 사용 중인 플랜입니다.');
      return;
    }

    const params = new URLSearchParams({
      plan: selectedPlan,
      blogs: blogCount.toString(),
    });
    router.push(`/payment/checkout?${params.toString()}`);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <FileText className="w-6 h-6" />;
      case 'light':
        return <Zap className="w-6 h-6" />;
      case 'standard':
        return <Globe className="w-6 h-6" />;
      case 'pro':
        return <Sparkles className="w-6 h-6" />;
      case 'unlimited':
        return <Shield className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: string, isSelected: boolean) => {
    if (isSelected) {
      return 'border-[#4562a1] bg-[#f0f4ff] shadow-lg';
    }
    switch (planId) {
      case 'free':
        return 'border-gray-200 hover:border-gray-300';
      case 'light':
        return 'border-green-200 hover:border-green-300';
      case 'standard':
        return 'border-blue-200 hover:border-blue-300';
      case 'pro':
        return 'border-purple-200 hover:border-purple-300';
      case 'unlimited':
        return 'border-orange-200 hover:border-orange-300';
      default:
        return 'border-[#cdd6ea] hover:border-[#4562a1]';
    }
  };

  const getPlanIconBg = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'bg-gray-100';
      case 'light':
        return 'bg-green-100';
      case 'standard':
        return 'bg-blue-100';
      case 'pro':
        return 'bg-purple-100';
      case 'unlimited':
        return 'bg-orange-100';
      default:
        return 'bg-[#f0f4ff]';
    }
  };

  const getPlanIconColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'text-gray-600';
      case 'light':
        return 'text-green-600';
      case 'standard':
        return 'text-blue-600';
      case 'pro':
        return 'text-purple-600';
      case 'unlimited':
        return 'text-orange-600';
      default:
        return 'text-[#4562a1]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafa] p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6 border-[#cdd6ea]">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafa]">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#e6ebf4]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
            >
              <ArrowLeft size={16} className="mr-1" />
              돌아가기
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-[#4562a1]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0c111d]">플랜 선택</h1>
              <p className="text-[#4562a1]">사용량에 맞는 플랜을 선택하세요</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 현재 플랜 표시 */}
        {currentPlanInfo && (
          <Card className="p-4 border-[#cdd6ea] shadow-sm bg-[#f0f4ff]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#4562a1]" />
              </div>
              <div>
                <p className="text-sm text-[#4562a1]">현재 사용 중인 플랜</p>
                <p className="font-semibold text-[#0c111d]">{currentPlanInfo.name}</p>
              </div>
              <Badge className="ml-auto bg-[#4562a1] text-white">현재 플랜</Badge>
            </div>
          </Card>
        )}

        {/* 플랜 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isCurrent = currentPlan === plan.id;

            return (
              <Card
                key={plan.id}
                data-testid={`plan-card-${plan.id}`}
                className={`relative p-5 cursor-pointer transition-all border-2 ${getPlanColor(plan.id, isSelected)}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {/* 뱃지 */}
                {plan.badge && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#4562a1] text-white whitespace-nowrap">
                    {plan.badge}
                  </Badge>
                )}

                {/* 현재 플랜 표시 */}
                {isCurrent && (
                  <Badge className="absolute -top-2 right-2 bg-green-500 text-white">
                    사용중
                  </Badge>
                )}

                {/* 아이콘 */}
                <div className={`w-12 h-12 rounded-xl ${getPlanIconBg(plan.id)} flex items-center justify-center mb-4 ${getPlanIconColor(plan.id)}`}>
                  {getPlanIcon(plan.id)}
                </div>

                {/* 플랜 이름 */}
                <h3 className="text-xl font-bold text-[#0c111d] mb-2">
                  {plan.name}
                </h3>

                {/* 가격 */}
                <div className="mb-4">
                  <div className="text-2xl font-bold text-[#0c111d]">
                    {plan.price === 0
                      ? '무료'
                      : `₩${plan.price.toLocaleString()}`}
                  </div>
                  {plan.price > 0 && (
                    <p className="text-sm text-[#4562a1]">/월 (1개 블로그)</p>
                  )}
                </div>

                {/* 기능 목록 */}
                <ul className="space-y-2 mb-5">
                  <li className="flex items-center gap-2 text-sm text-[#4562a1]">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span>월 {plan.posts} 발행</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#4562a1]">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span>최대 3개 블로그</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#4562a1]">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span>모든 기능 포함</span>
                  </li>
                </ul>

                {/* 선택 버튼 */}
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className={`w-full ${
                    isSelected
                      ? 'bg-[#4562a1] hover:bg-[#3a5289]'
                      : 'border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                >
                  {isSelected ? '선택됨' : '선택하기'}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* 블로그 수 선택 */}
        {selectedPlan !== 'free' && (
          <Card className="border-[#cdd6ea] shadow-sm">
            <div className="p-6 border-b border-[#e6ebf4]">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-[#4562a1]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#0c111d]">블로그 수 선택</h3>
                  <p className="text-sm text-[#4562a1]">운영할 블로그 개수를 선택하세요</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => setBlogCount(count)}
                    className={`
                      p-5 border-2 rounded-xl text-center transition-all
                      ${
                        blogCount === count
                          ? 'border-[#4562a1] bg-[#f0f4ff]'
                          : 'border-[#cdd6ea] hover:border-[#4562a1]'
                      }
                    `}
                  >
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                      blogCount === count ? 'bg-[#4562a1]' : 'bg-[#f0f4ff]'
                    }`}>
                      <Globe className={`w-6 h-6 ${blogCount === count ? 'text-white' : 'text-[#4562a1]'}`} />
                    </div>
                    <p className="text-2xl font-bold text-[#0c111d] mb-1">
                      {count}개
                    </p>
                    <p className="text-sm text-[#4562a1]">
                      월 ₩{calculatePlanPrice(selectedPlan, count).toLocaleString()}
                    </p>
                    {count > 1 && (
                      <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                        {count === 2 ? '24% 할인' : '32% 할인'}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 결제 요약 */}
        <Card className="border-[#cdd6ea] shadow-sm">
          <div className="p-6 border-b border-[#e6ebf4]">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-[#4562a1]" />
              <h3 className="text-lg font-semibold text-[#0c111d]">결제 요약</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#e6ebf4]">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${getPlanIconBg(selectedPlan)} flex items-center justify-center ${getPlanIconColor(selectedPlan)}`}>
                  {getPlanIcon(selectedPlan)}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#0c111d]">
                    {selectedPlanInfo?.name}
                  </h4>
                  <p className="text-[#4562a1]">
                    {blogCount}개 블로그 · 월 {selectedPlanInfo?.posts} 발행
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-[#4562a1] mb-1">월 결제 금액</p>
                <p className="text-3xl font-bold text-[#0c111d]">
                  ₩{calculatePlanPrice(selectedPlan, blogCount).toLocaleString()}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-[#4562a1] hover:bg-[#3a5289] h-14 text-lg"
              onClick={handleCheckout}
              disabled={selectedPlan === 'free' || selectedPlan === currentPlan}
            >
              {selectedPlan === currentPlan ? '현재 사용 중인 플랜입니다' : selectedPlan === 'free' ? '무료 플랜은 결제가 필요없습니다' : '결제하기'}
            </Button>

            <div className="flex items-center justify-center gap-6 mt-4">
              <p className="text-xs text-[#4562a1] flex items-center gap-1">
                <Shield size={12} />
                7일 이내 100% 환불 보장
              </p>
              <p className="text-xs text-[#4562a1] flex items-center gap-1">
                <CheckCircle size={12} />
                언제든지 취소 가능
              </p>
            </div>
          </div>
        </Card>

        {/* 안내 카드 */}
        <Card className="p-6 bg-[#f0f4ff] border-[#cdd6ea]">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-[#4562a1]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#0c111d] mb-1">플랜 업그레이드 안내</h4>
              <p className="text-sm text-[#4562a1]">
                플랜을 업그레이드하면 즉시 새로운 기능과 한도가 적용됩니다.
                기존 결제 금액은 일할 계산되어 다음 결제에서 차감됩니다.
                다운그레이드 시에는 현재 결제 주기가 끝난 후 적용됩니다.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
