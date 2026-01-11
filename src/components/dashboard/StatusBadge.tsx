'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, Loader } from 'lucide-react';

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
    { label: string; className: string; icon: React.ReactNode }
  > = {
    published: {
      label: '발행 완료',
      className: 'bg-green-50 text-green-700 border-green-200',
      icon: <CheckCircle size={14} />,
    },
    scheduled: {
      label: '예약 대기',
      className: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: <Clock size={14} />,
    },
    pending: {
      label: '대기 중',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: <Clock size={14} />,
    },
    generating: {
      label: '생성 중',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Loader size={14} className="animate-spin" />,
    },
    generated: {
      label: '생성 완료',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <CheckCircle size={14} />,
    },
    publishing: {
      label: '발행 중',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Loader size={14} className="animate-spin" />,
    },
    failed: {
      label: '발행 실패',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: <XCircle size={14} />,
    },
  };

  const variant = variants[status as PostStatus] || {
    label: status,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: null,
  };

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1.5 ${variant.className}`}
    >
      {variant.icon}
      {variant.label}
    </Badge>
  );
}
