'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
 * AppInput - Input canônico do HB Track Design System
 * 
 * Regras:
 * - Altura fixa h-9 (igual ao Button)
 * - Texto text-sm
 * - Label text-xs
 * - Mensagens text-xs
 * 
 * Input maior que botão = erro de layout.
 * 
 * @example
 * ```tsx
 * <AppInput
 *   label="Nome da equipe"
 *   placeholder="Ex: Sub-16 Feminino"
 *   error={errors.name?.message}
 * />
 * ```
 */
export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, helperText, error, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-9 rounded-md border px-3 text-sm',
            'border-input bg-background text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed',
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

AppInput.displayName = 'AppInput';
