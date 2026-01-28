'use client';

/**
 * AppEmptyState - Componente de estado vazio reutilizável
 * 
 * Segue o Design System HB Track Mini
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AppEmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: AppEmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'h-8 w-8',
      title: 'text-sm',
      description: 'text-xs',
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      <div className="mb-4 text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <h3 className={cn('font-medium text-gray-900 dark:text-white', sizes.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('mt-1 text-gray-500 dark:text-gray-400 max-w-sm', sizes.description)}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
