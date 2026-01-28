/**
 * Slider Component
 * 
 * Slider acessível 0-10 com:
 * - ARIA completo
 * - Keyboard navigation
 * - Escala de cores progressiva (verde → amarelo → vermelho)
 * - Warning badge para valores críticos (>8)
 * - Labels visuais nos extremos
 */

'use client';

import React, { useId } from 'react';
import { AlertTriangle } from 'lucide-react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  icon?: React.ReactNode;
  minLabel?: string;
  maxLabel?: string;
  description?: string;
  showWarning?: boolean; // Mostrar warning se valor > 8
  warningThreshold?: number;
  reversed?: boolean; // Se true, cores invertidas (10=verde, 0=vermelho)
  disabled?: boolean;
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  icon,
  minLabel = 'Mínimo',
  maxLabel = 'Máximo',
  description,
  showWarning = false,
  warningThreshold = 8,
  reversed = false,
  disabled = false,
}: SliderProps) {
  const id = useId();
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Calcula cor baseado no valor
  const getColor = () => {
    if (reversed) {
      // Invertido: 10=verde, 0=vermelho (ex: readiness, mood)
      if (value >= 7) return 'emerald'; // Bom
      if (value >= 4) return 'amber'; // Médio
      return 'red'; // Ruim
    } else {
      // Normal: 0=verde, 10=vermelho (ex: fatigue, stress)
      if (value <= 3) return 'emerald'; // Bom
      if (value <= 6) return 'amber'; // Médio
      return 'red'; // Ruim
    }
  };
  
  const color = getColor();
  const isWarning = showWarning && value >= warningThreshold;
  
  return (
    <div className="space-y-2">
      {/* Label e Value */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {icon && <span className="w-5 h-5 text-slate-500">{icon}</span>}
          <span>{label}</span>
        </label>
        
        <div className="flex items-center gap-2">
          <span
            className={`
              text-lg font-bold
              ${color === 'emerald' && 'text-emerald-600 dark:text-emerald-400'}
              ${color === 'amber' && 'text-amber-600 dark:text-amber-400'}
              ${color === 'red' && 'text-red-600 dark:text-red-400'}
            `}
          >
            {value}
          </span>
          
          {isWarning && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-full"
              role="alert"
            >
              <AlertTriangle className="w-3 h-3" />
              Atenção
            </span>
          )}
        </div>
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      
      {/* Slider Track */}
      <div className="relative pt-1">
        {/* Track Background */}
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          {/* Filled Track */}
          <div
            className={`
              h-full rounded-full transition-all duration-300
              ${color === 'emerald' && 'bg-emerald-500 dark:bg-emerald-400'}
              ${color === 'amber' && 'bg-amber-500 dark:bg-amber-400'}
              ${color === 'red' && 'bg-red-500 dark:bg-red-400'}
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Slider Input */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
          aria-describedby={description ? `${id}-description` : undefined}
        />
        
        {/* Thumb Indicator */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-lg
            transition-all duration-300 pointer-events-none
            ${color === 'emerald' && 'bg-emerald-500 dark:bg-emerald-400'}
            ${color === 'amber' && 'bg-amber-500 dark:bg-amber-400'}
            ${color === 'red' && 'bg-red-500 dark:bg-red-400'}
            ${disabled && 'opacity-50'}
          `}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
      
      {/* Min/Max Labels */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

/**
 * Slider Grid - Layout para múltiplos sliders
 */
interface SliderGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
}

export function SliderGrid({ children, columns = 1 }: SliderGridProps) {
  return (
    <div
      className={`
        grid gap-6
        ${columns === 2 && 'md:grid-cols-2'}
      `}
    >
      {children}
    </div>
  );
}
