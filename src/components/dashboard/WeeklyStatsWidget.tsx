'use client';

import { FileText, Eye, CheckCircle } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
}

function StatItem({ icon, label, value, trend, trendUp = true }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#4562a1]">{label}</p>
        <p className="text-sm sm:text-base font-bold text-[#0c111d]">{value}</p>
      </div>
      <span className={`text-xs font-bold ${trendUp ? 'text-[#07883d]' : 'text-red-500'}`}>
        {trend}
      </span>
    </div>
  );
}

interface WeeklyStatsWidgetProps {
  publishCount: number;
  avgViews: number;
  successRate: number;
  publishTrend?: number;
  viewsTrend?: number;
  successTrend?: number;
}

export function WeeklyStatsWidget({
  publishCount,
  avgViews,
  successRate,
  publishTrend = 12,
  viewsTrend = 45,
  successTrend = 2.5,
}: WeeklyStatsWidgetProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#cdd6ea] p-4 sm:p-6 shadow-sm">
      <h3 className="text-sm sm:text-base font-bold text-[#0c111d] mb-4">이번 주 통계</h3>

      <div className="space-y-4">
        <StatItem
          icon={<FileText className="w-4 h-4 text-primary" />}
          label="발행 건수"
          value={`${publishCount}건`}
          trend={`+${publishTrend}%`}
          trendUp={publishTrend >= 0}
        />

        <StatItem
          icon={<Eye className="w-4 h-4 text-[#07883d]" />}
          label="평균 조회수"
          value={avgViews.toLocaleString()}
          trend={`+${viewsTrend}%`}
          trendUp={viewsTrend >= 0}
        />

        <StatItem
          icon={<CheckCircle className="w-4 h-4 text-purple-500" />}
          label="성공률"
          value={`${successRate}%`}
          trend={`+${successTrend}%`}
          trendUp={successTrend >= 0}
        />
      </div>
    </div>
  );
}
