'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderRangeProps {
  id?: string;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const SliderRange = React.forwardRef<HTMLInputElement, SliderRangeProps>(
  ({ id, value = [0], onValueChange, min = 0, max = 100, step = 1, disabled, className }, ref) => {
    const currentValue = value[0] ?? 0;
    const percentage = ((currentValue - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="absolute h-full bg-brand-500 dark:bg-brand-400"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
        />
        <div
          className={cn(
            'absolute h-5 w-5 rounded-full border-2 border-brand-500 bg-white dark:bg-gray-900 shadow transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
            disabled && 'opacity-50'
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    );
  }
);

SliderRange.displayName = 'SliderRange';

export { SliderRange };
