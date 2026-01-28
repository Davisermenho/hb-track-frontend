'use client';

/**
 * AppHighlight - Componente de texto destacado reutilizável
 * 
 * Segue o Design System HB Track Mini
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppHighlightProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export default function AppHighlight({
  children,
  variant = 'default',
  className,
}: AppHighlightProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span
      className={cn(
        'inline-block rounded px-2 py-0.5 text-sm font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
