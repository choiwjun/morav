'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';

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

interface SubscriptionWidgetProps {
  subscription: SubscriptionInfo;
}

export function SubscriptionWidget({
  subscription,
}: SubscriptionWidgetProps) {
  const isUnlimited = subscription.monthlyLimit === -1;
  const usagePercentage = subscription.usagePercentage;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#cdd6ea] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-bold text-[#0c111d]">현재 플랜</h3>
        <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm font-bold rounded-full flex items-center gap-1">
          <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          {subscription.planName}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-[#0c111d]">{subscription.usageCount}</span>
          {!isUnlimited && (
            <span className="text-sm sm:text-base text-[#4562a1]">/ {subscription.monthlyLimit}건</span>
          )}
          {isUnlimited && (
            <span className="text-sm sm:text-base text-[#4562a1]">건 사용</span>
          )}
        </div>

        {!isUnlimited && (
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 70 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-[#4562a1] mb-4">
        {isUnlimited ? '무제한 사용' : `${subscription.remainingPosts}건 남음`}
        {subscription.periodEnd && ` · ${subscription.periodEnd} 갱신`}
      </p>

      <Link
        href="/payment/plans"
        className="block w-full py-2 sm:py-2.5 text-center text-xs sm:text-sm font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
      >
        플랜 업그레이드
      </Link>
    </div>
  );
}
