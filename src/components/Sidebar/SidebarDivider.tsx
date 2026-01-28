'use client';

/**
 * SidebarDivider - Separador visual entre seções da sidebar
 * 
 * Usado para separar visualmente grupos de itens na sidebar.
 * Pode incluir margem extra e estilo diferenciado.
 * 
 * @version 1.0.0
 */

import { cn } from '@/lib/utils';

interface SidebarDividerProps {
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export function SidebarDivider({ 
  className, 
  spacing = 'md' 
}: SidebarDividerProps) {
  const spacingClasses = {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
  };

  return (
    <div 
      className={cn(
        'h-px bg-gray-200 dark:bg-gray-700/50 mx-3',
        spacingClasses[spacing],
        className
      )} 
    />
  );
}
