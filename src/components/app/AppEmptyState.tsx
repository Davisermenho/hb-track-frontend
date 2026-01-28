'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ícone (Lucide ou similar) - deve ser passado como elemento */
  icon?: React.ReactNode;
  /** Título principal (text-sm font-medium) */
  title: string;
  /** Descrição opcional (text-xs text-muted) */
  description?: string;
  /** Ação (geralmente um Button) */
  action?: React.ReactNode;
  /** Alinhamento: center (padrão) ou left */
  align?: 'left' | 'center';
}

/**
 * AppEmptyState - Estado vazio canônico do HB Track Design System
 * 
 * Regras:
 * - Compacto (nunca ocupar tela inteira)
 * - Ícone pequeno
 * - 1 CTA no máximo
 * - Tipografia controlada
 * 
 * @example
 * ```tsx
 * <AppEmptyState
 *   icon={<Users className="h-5 w-5" />}
 *   title="Nenhuma equipe cadastrada"
 *   description="Crie sua primeira equipe para começar."
 *   action={<Button size="sm">Criar equipe</Button>}
 * />
 * ```
 */
export function AppEmptyState({
  icon,
  title,
  description,
  action,
  align = 'center',
  className,
  ...props
}: AppEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex w-full rounded-lg border border-dashed',
        'border-gray-200 dark:border-gray-700 bg-transparent',
        align === 'center' ? 'items-center justify-center' : 'items-start',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex max-w-md flex-col gap-2 px-4 py-6',
          align === 'center' ? 'items-center text-center' : 'items-start text-left'
        )}
      >
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}

        <h3 className="text-sm font-medium text-foreground">
          {title}
        </h3>

        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
