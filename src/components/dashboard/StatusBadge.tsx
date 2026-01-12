'use client';

import { CheckCircle, Clock, XCircle, RefreshCw, Calendar } from 'lucide-react';

export type PostStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'publishing'
  | 'published'
  | 'scheduled'
  | 'failed';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<
    PostStatus,
    { label: string; bgClass: string; textClass: string; icon: React.ReactNode }
  > = {
    published: {
      label: '성공',
      bgClass: 'bg-[#e7f6ed]',
      textClass: 'text-[#07883d]',
      icon: <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    },
    scheduled: {
      label: '예약됨',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-700',
      icon: <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    },
    pending: {
      label: '대기 중',
      bgClass: 'bg-gray-100',
      textClass: 'text-gray-600',
      icon: <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    },
    generating: {
      label: '분석 중',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
      icon: <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />,
    },
    generated: {
      label: '생성 완료',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-700',
      icon: <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    },
    publishing: {
      label: '발행 중',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
      icon: <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />,
    },
    failed: {
      label: '실패',
      bgClass: 'bg-red-100',
      textClass: 'text-red-600',
      icon: <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    },
  };

  const variant = variants[status as PostStatus] || {
    label: status,
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    icon: null,
  };

  return (
    <span
      className={`px-2 sm:px-3 py-0.5 sm:py-1 ${variant.bgClass} ${variant.textClass} text-[10px] sm:text-xs font-bold rounded-full flex items-center gap-0.5 sm:gap-1 whitespace-nowrap`}
    >
      {variant.icon}
      {variant.label}
    </span>
  );
}
