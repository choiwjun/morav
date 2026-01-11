import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  suffix?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  percentage?: number;
}

export function MetricCard({
  icon,
  title,
  value,
  suffix,
  trend,
  percentage,
}: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
        {trend && (
          <Badge
            variant={trend.direction === 'up' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </Badge>
        )}
      </div>

      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{value}</span>
        {suffix && <span className="text-gray-500">{suffix}</span>}
      </div>

      {percentage !== undefined && (
        <div className="mt-3">
          <Progress value={percentage} className="h-2" />
        </div>
      )}
    </Card>
  );
}
