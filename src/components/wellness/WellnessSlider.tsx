'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface WellnessSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  emojis?: { [key: number]: string };
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

// =============================================================================
// EMOJI PRESETS
// =============================================================================

const DEFAULT_EMOJIS = {
  0: '😴',
  2: '😕',
  5: '😐',
  8: '😊',
  10: '🤩'
};

export const WELLNESS_EMOJI_PRESETS = {
  sleep: {
    0: '😴',
    3: '🥱',
    5: '😐',
    7: '😌',
    10: '😴'
  },
  fatigue: {
    0: '💪',
    3: '😐',
    5: '😓',
    7: '😫',
    10: '🥵'
  },
  stress: {
    0: '😌',
    3: '🙂',
    5: '😐',
    7: '😰',
    10: '😱'
  },
  mood: {
    0: '😢',
    3: '😕',
    5: '😐',
    7: '😊',
    10: '😄'
  },
  soreness: {
    0: '💪',
    3: '😐',
    5: '😣',
    7: '😖',
    10: '🤕'
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

export function WellnessSlider({
  label,
  value,
  onChange,
  emojis = DEFAULT_EMOJIS,
  min = 0,
  max = 10,
  step = 1,
  disabled = false,
  className
}: WellnessSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  /**
   * Encontra o emoji mais próximo do valor atual
   */
  const getEmojiForValue = (val: number) => {
    const keys = Object.keys(emojis).map(Number).sort((a, b) => a - b);
    const closest = keys.reduce((prev, curr) => 
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );
    return emojis[closest] || '😐';
  };

  /**
   * Calcula porcentagem para gradiente
   */
  const percentage = ((value - min) / (max - min)) * 100;
  
  /**
   * Cor do gradiente baseada no valor
   */
  const getGradientColor = () => {
    if (value <= max * 0.3) return 'rgb(239 68 68)'; // red
    if (value <= max * 0.6) return 'rgb(251 146 60)'; // orange
    return 'rgb(34 197 94)'; // green
  };

  /**
   * Gera array de marcadores
   */
  const markers = Array.from(
    { length: Math.floor((max - min) / 2) + 1 }, 
    (_, i) => min + i * 2
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header com label e valor */}
      <div className="flex items-center justify-between">
        <label className={cn(
          'text-theme-sm font-medium',
          disabled 
            ? 'text-gray-400 dark:text-gray-600' 
            : 'text-gray-700 dark:text-gray-300'
        )}>
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={`Nível ${value}`}>
            {getEmojiForValue(value)}
          </span>
          <span className={cn(
            'text-lg font-semibold min-w-[2ch] text-right',
            disabled 
              ? 'text-gray-400' 
              : 'text-brand-500'
          )}>
            {value}
          </span>
        </div>
      </div>
      
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className={cn(
            'w-full h-2 rounded-lg appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isDragging && 'ring-2 ring-brand-500',
            // Custom thumb styling
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4',
            '[&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-brand-500',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4',
            '[&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-brand-500',
            '[&::-moz-range-thumb]:shadow-md',
            '[&::-moz-range-thumb]:cursor-pointer'
          )}
          style={{
            background: `linear-gradient(to right, 
              ${getGradientColor()} 0%, 
              ${getGradientColor()} ${percentage}%, 
              rgb(229 231 235) ${percentage}%, 
              rgb(229 231 235) 100%
            )`
          }}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        
        {/* Marcadores */}
        <div className="flex justify-between mt-1 px-1">
          {markers.map((marker, i) => (
            <span 
              key={i}
              className={cn(
                'text-xs',
                marker === value 
                  ? 'text-brand-600 dark:text-brand-400 font-semibold' 
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {marker}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
