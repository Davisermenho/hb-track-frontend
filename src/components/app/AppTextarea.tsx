'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label do campo (text-xs font-medium) */
  label?: string;
  /** Texto de ajuda (text-xs text-muted) */
  helperText?: string;
  /** Mensagem de erro (text-xs text-destructive) */
  error?: string;
  /** Ocupar largura total (default: true) */
  fullWidth?: boolean;
}

/**
 * AppTextarea - Textarea canônico do HB Track Design System
 * 
 * Regras:
 * - Texto text-sm
 * - Label text-xs
 * - Mensagens text-xs
 * - Altura mínima controlada
 * 
 * @example
 * ```tsx
 * <AppTextarea
 *   label="Observações"
 *   placeholder="Adicione notas sobre o treino..."
 *   rows={3}
 * />
 * ```
 */
export const AppTextarea = React.forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ label, helperText, error, fullWidth = true, className, id, ...props }, ref) => {
    const textareaId = id ?? React.useId();

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'min-h-[80px] rounded-md border px-3 py-2 text-sm',
            'border-input bg-background text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y',
            error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
            className
          )}
          {...props}
        />

        {error ? (
          <span className="text-xs text-destructive">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-muted-foreground">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

AppTextarea.displayName = 'AppTextarea';
