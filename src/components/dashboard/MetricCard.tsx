import { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  suffix?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  percentage?: number;
  className?: string;
}

export function MetricCard({
  icon,
  title,
  value,
  suffix,
  trend,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`bg-white p-3 sm:p-4 lg:p-5 rounded-xl border border-[#cdd6ea] flex flex-col gap-2 sm:gap-3 shadow-sm ${className}`}>
      <div className="flex justify-between items-start">
        <p className="text-[10px] sm:text-xs font-semibold text-[#4562a1]">{title}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0c111d]">{value}</p>
        {suffix && <p className="text-xs sm:text-sm text-[#4562a1] font-medium">{suffix}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${
          trend.direction === 'up' ? 'text-[#07883d]' : 'text-red-500'
        }`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3 h-3 sm:w-3.5 sm:h-3.5"
          >
            {trend.direction === 'up' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
            )}
          </svg>
          <span className="truncate">{trend.label || `${trend.direction === 'up' ? '+' : '-'}${trend.value}%`}</span>
        </div>
      )}
    </div>
  );
}
