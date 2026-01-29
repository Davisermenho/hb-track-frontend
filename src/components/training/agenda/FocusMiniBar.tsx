/**
 * FocusMiniBar
 * 
 * Componente que exibe mini stack bar com 7 focos de treino.
 * Usado nos cards da agenda semanal.
 * 
 * Features:
 * - Visualização compacta dos 7 focos (ataque pos, defesa pos, transição of, transição def, técnico at, técnico def, físico)
 * - Total com validação (X/120)
 * - Cores diferenciadas para cada foco
 * - Tooltip acessível
 * - Estado de erro quando total > 120
 */

'use client';

import React, { useMemo } from 'react';
import { TrainingSession } from '@/lib/api/trainings';

export interface FocusBreakdown {
  attack_positional: number;
  defense_positional: number;
  transition_offense: number;
  transition_defense: number;
  attack_technical: number;
  defense_technical: number;
  physical: number;
}

export interface FocusMiniBarProps {
  session: TrainingSession;
  size?: 'sm' | 'md';
  showTotal?: boolean;
  className?: string;
}

// Configuração dos 7 focos com cores e labels
const FOCUS_CONFIG = [
  {
    key: 'focus_attack_positional_pct' as keyof TrainingSession,
    label: 'Ataque Posicional',
    color: 'bg-emerald-500',
    shortLabel: 'Atq Pos',
  },
  {
    key: 'focus_defense_positional_pct' as keyof TrainingSession,
    label: 'Defesa Posicional',
    color: 'bg-sky-500',
    shortLabel: 'Def Pos',
  },
  {
    key: 'focus_transition_offense_pct' as keyof TrainingSession,
    label: 'Transição Ofensiva',
    color: 'bg-indigo-500',
    shortLabel: 'Trans Ofens',
  },
  {
    key: 'focus_transition_defense_pct' as keyof TrainingSession,
    label: 'Transição Defensiva',
    color: 'bg-violet-500',
    shortLabel: 'Trans Def',
  },
  {
    key: 'focus_attack_technical_pct' as keyof TrainingSession,
    label: 'Ataque Técnico',
    color: 'bg-amber-500',
    shortLabel: 'Atq Téc',
  },
  {
    key: 'focus_defense_technical_pct' as keyof TrainingSession,
    label: 'Defesa Técnica',
    color: 'bg-rose-500',
    shortLabel: 'Def Téc',
  },
  {
    key: 'focus_physical_pct' as keyof TrainingSession,
    label: 'Físico',
    color: 'bg-lime-500',
    shortLabel: 'Físico',
  },
] as const;

function sumFocus(session: TrainingSession): number {
  return FOCUS_CONFIG.reduce((sum, focus) => {
    const value = Number(session[focus.key]) || 0;
    return sum + value;
  }, 0);
}

export function FocusMiniBar({ 
  session, 
  size = 'sm', 
  showTotal = true, 
  className = '' 
}: FocusMiniBarProps) {
  const total = sumFocus(session);
  const clampedTotal = Math.max(0, Math.min(120, total));
  const isOverLimit = total > 120;
  
  // Preparar segmentos com valores válidos
  const segments = FOCUS_CONFIG.map(focus => {
    const value = Number(session[focus.key]) || 0;
    return {
      ...focus,
      value: Math.max(0, value),
    };
  }).filter(segment => segment.value > 0);

  // Alturas conforme tamanho
  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
  };

  // Tamanhos de fonte
  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
  };

  if (total === 0) {
    return (
      <div className={`space-y-1 ${className}`}>
        {showTotal && (
          <div className={`flex items-center justify-between ${textSizes[size]} text-gray-600 dark:text-gray-400`}>
            <span>Foco</span>
            <span className="text-gray-500">0/120</span>
          </div>
        )}
        
        <div
          className={`w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 ${heights[size]}`}
          role="img"
          aria-label="Sem foco definido"
        >
          <div className="h-full w-full bg-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {showTotal && (
        <div className={`flex items-center justify-between ${textSizes[size]} text-gray-600 dark:text-gray-400`}>
          <span>Foco</span>
          <span className={isOverLimit ? 'text-rose-700 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}>
            {total}/120
          </span>
        </div>
      )}

      <div
        className={`w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 ${heights[size]}`}
        role="img"
        aria-label={`Distribuição de foco: ${total} pontos de 120`}
      >
        <div className="flex h-full w-full">
          {segments.map((segment) => {
            const percentage = total > 0 ? (segment.value / 120) * 100 : 0;
            
            return (
              <div
                key={segment.key}
                className={`h-full ${segment.color}`}
                style={{ width: `${percentage}%` }}
                title={`${segment.label}: ${segment.value}%`}
                aria-label={`${segment.label}: ${segment.value}%`}
              />
            );
          })}
          
          {/* Espaço restante até 120 */}
          {total < 120 && (
            <div 
              className="h-full bg-transparent" 
              style={{ width: `${((120 - total) / 120) * 100}%` }}
            />
          )}
        </div>
      </div>

      {isOverLimit && (
        <p className={`${textSizes[size]} text-rose-700 dark:text-rose-400`}>
          Total acima de 120. Ajuste os focos.
        </p>
      )}
    </div>
  );
}

/**
 * Hook para calcular dados de foco de uma sessão
 */
export function useFocusData(session: TrainingSession | null) {
  return useMemo(() => {
    if (!session) {
      return {
        total: 0,
        isValid: true,
        isEmpty: true,
        breakdown: {} as FocusBreakdown,
        primaryFocus: null,
        segments: [],
      };
    }

    const total = sumFocus(session);
    const isValid = total <= 120;
    const isEmpty = total === 0;
  
  const breakdown = FOCUS_CONFIG.reduce((acc, focus) => {
    const key = focus.key.replace('focus_', '').replace('_pct', '') as keyof FocusBreakdown;
    acc[key] = Number(session[focus.key]) || 0;
    return acc;
  }, {} as FocusBreakdown);

  const primaryFocus = FOCUS_CONFIG.reduce((max, focus) => {
    const value = Number(session[focus.key]) || 0;
    if (value > max.value) {
      return { label: focus.shortLabel, value };
    }
    return max;
  }, { label: '', value: 0 });

    return {
      total,
      isValid,
      isEmpty,
      breakdown,
      primaryFocus: primaryFocus.value > 0 ? primaryFocus : null,
      segments: FOCUS_CONFIG.map(focus => ({
        label: focus.label,
        shortLabel: focus.shortLabel,
        value: Number(session[focus.key]) || 0,
        color: focus.color,
      })).filter(s => s.value > 0),
    };
  }, [session]);
}
