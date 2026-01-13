'use client';

import { BarChart3 } from 'lucide-react';

interface WeeklyChartProps {
  data?: { day: string; value: number; isToday: boolean; isFuture?: boolean }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  // 데이터가 없으면 빈 상태 표시
  const hasData = data && data.some(item => item.value > 0);

  // 요일 라벨
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // 일요일은 6, 월요일은 0

  // 기본 데이터 (모두 0)
  const chartData = data || days.map((day, index) => ({
    day,
    value: 0,
    isToday: index === todayIndex,
    isFuture: index > todayIndex,
  }));

  return (
    <div className="bg-white rounded-xl border border-[#cdd6ea] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm sm:text-base font-bold text-[#0c111d]">최근 7일 유입 추이</h3>
        <p className="text-[10px] sm:text-xs text-[#4562a1]">블로그 연동 후 데이터가 수집됩니다.</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-xs text-gray-400">아직 수집된 데이터가 없습니다</p>
        </div>
      ) : (
        <div className="flex items-end justify-between h-24 sm:h-32 gap-1">
          {chartData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full bg-gray-100 rounded-t relative group ${
                  item.isFuture ? 'opacity-30' : ''
                }`}
                style={{ height: item.isFuture ? '16px' : `${Math.max(item.value * 1.2, 16)}px` }}
              >
                {!item.isFuture && (
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      item.isToday
                        ? 'bg-primary'
                        : 'bg-primary/40 group-hover:bg-primary'
                    }`}
                    style={{ height: `${item.value}%` }}
                  />
                )}
              </div>
              <span className={`text-[8px] sm:text-[9px] font-bold ${
                item.isToday
                  ? 'text-primary'
                  : 'text-[#4562a1]'
              }`}>
                {item.isToday ? 'TODAY' : item.day}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
