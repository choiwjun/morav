'use client';

import { Lightbulb } from 'lucide-react';

export function WeeklyChart() {
  // 요일별 데이터 (실제로는 API에서 가져와야 함)
  const chartData = [
    { day: 'MON', value: 40, isToday: false },
    { day: 'TUE', value: 65, isToday: false },
    { day: 'WED', value: 50, isToday: false },
    { day: 'THU', value: 85, isToday: false },
    { day: 'FRI', value: 95, isToday: true },
    { day: 'SAT', value: 0, isToday: false, isFuture: true },
    { day: 'SUN', value: 0, isToday: false, isFuture: true },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#cdd6ea] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm sm:text-base font-bold text-[#0c111d]">최근 7일 유입 추이</h3>
        <p className="text-[10px] sm:text-xs text-[#4562a1]">매일 오전 9시에 업데이트됩니다.</p>
      </div>

      {/* Chart Bars */}
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

      {/* Insight Box */}
      <div className="p-2.5 sm:p-3 bg-primary/5 rounded-lg border border-primary/10">
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-white rounded shadow-sm flex-shrink-0">
            <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <p className="text-[9px] sm:text-[10px] font-medium leading-relaxed text-[#0c111d]">
            <span className="font-bold text-primary">인사이트:</span> 목요일 밤 10시 이후에 발행된 글들이
            평균보다 <span className="font-bold">2.4배</span> 높은 조회수를 기록 중
          </p>
        </div>
      </div>
    </div>
  );
}
