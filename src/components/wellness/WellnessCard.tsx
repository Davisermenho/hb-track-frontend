'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WellnessCardProps {
  title: string;
  value: number;
  maxValue?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color?: string;
  emoji?: string;
  className?: string;
}

export function WellnessCard({
  title,
  value,
  maxValue = 10,
  icon,
  trend,
  trendValue,
  color = 'bg-brand-500',
  emoji,
  className,
}: WellnessCardProps) {
  const percentage = (value / maxValue) * 100;
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600 dark:text-success-400';
    if (trend === 'down') return 'text-error-600 dark:text-error-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getValueColor = () => {
    if (value >= 7) return 'text-success-600 dark:text-success-400';
    if (value >= 4) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800',
      'p-4 shadow-sm hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {title}
            </h3>
            {trend && trendValue !== undefined && (
              <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(trendValue).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        {emoji && (
          <span className="text-2xl">{emoji}</span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end justify-between mb-2">
        <div className={cn('text-3xl font-bold', getValueColor())}>
          {value.toFixed(1)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          / {maxValue}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}