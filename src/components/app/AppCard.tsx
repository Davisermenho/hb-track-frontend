'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Título do card (text-sm font-semibold) */
  title?: string;
  /** Meta informação (text-xs text-muted) */
  meta?: string;
  /** Ações no canto superior direito */
  actions?: React.ReactNode;
  /** Conteúdo do footer */
  footer?: React.ReactNode;
  /** Densidade: compact = p-3, default = p-4 (--app-space-lg) */
  density?: 'compact' | 'default';
}

/**
 * AppCard - Card canônico do HB Track Design System
 * 
 * Regras:
 * - Padding controlado (nunca mais p-6 perdido)
 * - Título sempre pequeno (text-sm)
 * - Meta discreta (text-xs)
 * - Altura previsível
 * 
 * @example
 * ```tsx
 * <AppCard
 *   title="Equipe Sub-16"
 *   meta="12 atletas"
 *   actions={<Button size="sm">Abrir</Button>}
 * >
 *   Conteúdo do card
 * </AppCard>
 * ```
 */
export function AppCard({
  title,
  meta,
  actions,
  footer,
  density = 'default',
  className,
  children,
  ...props
}: AppCardProps) {
  return (
    <div
      className={cn(
        'app-card',
        density === 'compact' && 'p-3',
        className
      )}
      {...props}
    >
      {(title || meta || actions) && (
        <div className="app-card-header">
          <div className="flex min-w-0 flex-col">
            {title && (
              <h3 className="app-card-title truncate">
                {title}
              </h3>
            )}
            {meta && (
              <span className="app-card-meta">
                {meta}
              </span>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className="app-card-body">
        {children}
      </div>

      {footer && (
        <div className="app-card-footer">
          {footer}
        </div>
      )}
    </div>
  );
}
