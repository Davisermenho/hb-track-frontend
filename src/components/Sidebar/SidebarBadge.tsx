'use client';

/**
 * SidebarBadge - Badge de contador dinâmico
 * 
 * Exibe contadores em itens da sidebar, como:
 * - Jogos hoje (2)
 * - Treinos pendentes (1)
 * - Mensagens não lidas (5)
 */

import { cn } from '@/lib/utils';

interface SidebarBadgeProps {
  count: number;
  variant?: 'default' | 'warning' | 'error' | 'success';
  max?: number;
}

export function SidebarBadge({ 
  count, 
  variant = 'default',
  max = 99 
}: SidebarBadgeProps) {
  if (count <= 0) return null;

  const colors = {
    default: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <span
      className={cn(
        'ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
        colors[variant]
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
