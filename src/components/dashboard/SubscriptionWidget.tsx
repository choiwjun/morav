'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function SubscriptionWidget({
  subscription,
}: SubscriptionWidgetProps) {
  const isUnlimited = subscription.monthlyLimit === -1;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">현재 플랜</h3>
          <Badge variant="default" className="text-xs">
            {subscription.planName}
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {isUnlimited ? '∞' : subscription.usageCount}
            </span>
            {!isUnlimited && (
              <span className="text-gray-500">/ {subscription.monthlyLimit}건</span>
            )}
          </div>
          {!isUnlimited && (
            <Progress value={subscription.usagePercentage} className="h-2" />
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          {isUnlimited
            ? `갱신일: ${formatDate(subscription.periodEnd)}`
            : `이번 달 ${subscription.remainingPosts}건 남음 · ${formatDate(
                subscription.periodEnd
              )} 갱신`}
        </p>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/payment/plans">플랜 업그레이드</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
