'use client';

/**
 * AppSkeleton - Componente de skeleton/loading reutilizável
 * 
 * Segue o Design System HB Track Mini
 */

import { cn } from '@/lib/utils';

interface AppSkeletonProps {
  variant?: 'text' | 'card' | 'header' | 'avatar' | 'button';
  className?: string;
  width?: string | number;
  height?: string | number;
}

export default function AppSkeleton({
  variant = 'text',
  className,
  width,
  height,
}: AppSkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-xl',
    header: 'h-12 w-full rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );
}
