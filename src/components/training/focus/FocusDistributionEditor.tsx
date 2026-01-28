/**
 * FocusDistributionEditor - Componente consolidado para edição de distribuição de focos
 * 
 * Task 9 - Refatoração Training Session Flow
 * 
 * Este componente unifica a lógica de edição de focos presente em:
 * - CreateSessionModal
 * - EditSessionModal  
 * - CreateTemplateModal
 * - EditTemplateModal
 * 
 * Reduz ~300 linhas de código duplicado através de:
 * - Sliders integrados com validação em tempo real
 * - Suporte a mode: 'lenient' | 'strict' (from computeFocusSummary)
 * - Badge de status visual inline
 * - Justificativa condicional (quando total > 100%)
 * 
 * Props:
 * - values: Valores atuais dos 7 focos
 * - onChange: Callback quando valores mudam
 * - justification: Justificativa para total > 100%
 * - onJustificationChange: Callback para justificativa
 * - mode: 'lenient' (draft) | 'strict' (fechamento)
 * - disabled: Desabilita edição
 * - compact: Layout compacto
 * - showBadge: Mostra badge de validação (default: true)
 */

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { computeFocusSummary, type ApiFocusInput } from '@/lib/training/focus';
import { Icons } from '@/design-system/icons';

// Definição dos 7 campos de foco
const FOCUS_FIELDS = [
  { key: 'focus_attack_positional_pct', label: 'Ataque Posicionado', shortLabel: 'Atq. Pos.' },
  { key: 'focus_defense_positional_pct', label: 'Defesa Posicionada', shortLabel: 'Def. Pos.' },
  { key: 'focus_transition_offense_pct', label: 'Transição Ofensiva', shortLabel: 'Trans. Of.' },
  { key: 'focus_transition_defense_pct', label: 'Transição Defensiva', shortLabel: 'Trans. Def.' },
  { key: 'focus_attack_technical_pct', label: 'Técnica Ofensiva', shortLabel: 'Téc. Of.' },
  { key: 'focus_defense_technical_pct', label: 'Técnica Defensiva', shortLabel: 'Téc. Def.' },
  { key: 'focus_physical_pct', label: 'Condicionamento Físico', shortLabel: 'Cond. Fís.' },
] as const;

type FocusKey = typeof FOCUS_FIELDS[number]['key'];

export interface FocusDistributionEditorProps {
  values: ApiFocusInput;
  onChange: (key: FocusKey, value: number) => void;
  justification?: string;
  onJustificationChange?: (value: string) => void;
  mode?: 'lenient' | 'strict';
  disabled?: boolean;
  compact?: boolean;
  showBadge?: boolean;
  layout?: 'stack' | 'grid';
  className?: string;
  /** Callback para comunicar se pode publicar (>= 90% e <= 120%) */
  onCanPublishChange?: (canPublish: boolean) => void;
}

export function FocusDistributionEditor({
  values,
  onChange,
  justification = '',
  onJustificationChange,
  mode = 'lenient',
  disabled = false,
  compact = false,
  showBadge = true,
  layout = 'stack',
  className,
  onCanPublishChange,
}: FocusDistributionEditorProps) {
  // Computar validação em tempo real
  const focusSummary = useMemo(
    () => computeFocusSummary(values, { mode, justification }),
    [values, mode, justification]
  );

  const {
    totalFocusRounded,
    status,
    message,
    color,
    requiresJustification,
    missingJustification,
    canSubmit,
    isEmpty,
  } = focusSummary;

  // Notificar componente pai sobre mudança em canPublish
  React.useEffect(() => {
    onCanPublishChange?.(canSubmit);
  }, [canSubmit, onCanPublishChange]);

  const statusLabel = useMemo(() => {
    if (status === 'error') return 'Distribuição bloqueada';
    if (requiresJustification && missingJustification) return 'Justificativa necessária';
    if (requiresJustification) return 'Distribuição válida com justificativa';
    if (isEmpty) return 'Distribuição pendente';
    return 'Distribuição válida';
  }, [status, requiresJustification, missingJustification, isEmpty]);

  const StatusIcon =
    status === 'error'
      ? Icons.Status.Error
      : status === 'warning'
      ? Icons.Status.Warning
      : Icons.Status.Success;

  const sliderContainerClass = cn(
    layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3',
    layout !== 'grid' && compact && 'space-y-2.5'
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sliders */}
      <div className={sliderContainerClass}>
        {FOCUS_FIELDS.map((focus) => {
          const value = values[focus.key] ?? 0;

          return (
            <div
              key={focus.key}
              className={cn(
                'flex items-center gap-3',
                compact && 'gap-2'
              )}
            >
              {/* Label */}
              <span
                className={cn(
                  'text-slate-600 dark:text-slate-400 truncate',
                  compact 
                    ? 'text-xs w-24 min-w-[96px]' 
                    : 'text-sm w-32 sm:w-40 min-w-[128px]'
                )}
                title={focus.label}
              >
                {compact ? focus.shortLabel : focus.label}
              </span>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={value}
                onChange={(e) => onChange(focus.key, parseInt(e.target.value, 10))}
                disabled={disabled}
                aria-label={`${focus.label}: ${value}%`}
                className={cn(
                  'flex-1 appearance-none cursor-pointer rounded-full',
                  'bg-slate-100 dark:bg-slate-800',
                  compact ? 'h-1.5' : 'h-2 sm:h-3',
                  'accent-emerald-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-1'
                )}
                style={{
                  background: disabled
                    ? undefined
                    : `linear-gradient(to right,
                        rgb(16 185 129) 0%,
                        rgb(16 185 129) ${value}%,
                        rgb(226 232 240) ${value}%,
                        rgb(226 232 240) 100%)`,
                }}
              />

              {/* Value */}
              <span
                className={cn(
                  'font-semibold text-slate-700 dark:text-slate-300 text-right tabular-nums',
                  compact ? 'text-xs w-8 min-w-[32px]' : 'text-sm w-10 min-w-[40px]'
                )}
              >
                {value}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Badge de validação */}
      {showBadge && (
        <div
          className={cn(
            'flex items-start gap-2 px-3 py-2.5 rounded-lg border',
            color === 'green' && 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
            color === 'yellow' && 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
            color === 'red' && 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          )}
        >
          <StatusIcon
            className={cn(
              'w-4 h-4 flex-shrink-0 mt-0.5',
              color === 'green' && 'text-emerald-600 dark:text-emerald-500',
              color === 'yellow' && 'text-yellow-600 dark:text-yellow-500',
              color === 'red' && 'text-red-600 dark:text-red-500'
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span
                className={cn(
                  'text-sm font-medium',
                  color === 'green' && 'text-emerald-800 dark:text-emerald-300',
                  color === 'yellow' && 'text-yellow-800 dark:text-yellow-300',
                  color === 'red' && 'text-red-800 dark:text-red-300'
                )}
              >
                {statusLabel}
              </span>
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  color === 'green' && 'text-emerald-700 dark:text-emerald-400',
                  color === 'yellow' && 'text-yellow-700 dark:text-yellow-400',
                  color === 'red' && 'text-red-700 dark:text-red-400'
                )}
              >
                {totalFocusRounded}/120
              </span>
            </div>
            <p
              className={cn(
                'text-xs leading-relaxed',
                color === 'green' && 'text-emerald-700 dark:text-emerald-400',
                color === 'yellow' && 'text-yellow-700 dark:text-yellow-400',
                color === 'red' && 'text-red-700 dark:text-red-400'
              )}
            >
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Campo de justificativa (condicional) */}
      {requiresJustification && onJustificationChange && (
        <div className="space-y-2">
          <label 
            htmlFor="focus-justification"
            className={cn(
              'block text-sm font-medium',
              missingJustification 
                ? 'text-red-700 dark:text-red-400' 
                : 'text-slate-700 dark:text-slate-300'
            )}
          >
            Justificativa {missingJustification && <span className="text-red-600">*</span>}
          </label>
          <textarea
            id="focus-justification"
            value={justification}
            onChange={(e) => onJustificationChange(e.target.value)}
            disabled={disabled}
            placeholder="Explique por que o total ultrapassa 100% (ex: treino intensivo com múltiplas fases simultâneas)"
            rows={3}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-lg border',
              'bg-white dark:bg-slate-900',
              'placeholder:text-slate-400 dark:placeholder:text-slate-600',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              missingJustification
                ? 'border-red-300 dark:border-red-700 focus:ring-red-500/50'
                : 'border-slate-300 dark:border-slate-700'
            )}
          />
          {missingJustification && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <Icons.Status.Warning className="w-3 h-3" />
              Justificativa obrigatória para total acima de 100%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Versão compacta apenas para preview (sem edição)
 */
export function FocusDistributionPreview({
  values,
  className,
}: {
  values: ApiFocusInput;
  className?: string;
}) {
  // Pega os 3 maiores valores para mostrar
  const topFocuses = FOCUS_FIELDS
    .map((f) => ({ ...f, value: values[f.key] ?? 0 }))
    .filter((f) => f.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const totalWithFocus = FOCUS_FIELDS.filter((f) => (values[f.key] ?? 0) > 0).length;

  if (topFocuses.length === 0) {
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">
        Nenhum foco configurado
      </span>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {topFocuses.map((focus) => (
        <span
          key={focus.key}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          title={`${focus.label}: ${focus.value}%`}
        >
          {focus.shortLabel} {focus.value}%
        </span>
      ))}
      {totalWithFocus > 3 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          +{totalWithFocus - 3}
        </span>
      )}
    </div>
  );
}
