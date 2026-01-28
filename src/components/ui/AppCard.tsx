'use client';

/**
 * AppCard - Componente de card reutilizável
 * 
 * Segue o Design System HB Track Mini
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function AppCard({
  children,
  className,
  onClick,
  padding = 'md',
  variant = 'default',
}: AppCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-md',
    outlined: 'border-2 border-gray-200 dark:border-gray-700 bg-transparent',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        paddingClasses[padding],
        variantClasses[variant],
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
