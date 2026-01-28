'use client';

/**
 * SidebarLoadingIcon - Componente de ícone com estado de loading
 * 
 * Exibe um spinner animado durante carregamento, substituindo
 * temporariamente o ícone original do item de menu.
 */

import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarLoadingIconProps {
  /** Se está em estado de loading */
  isLoading: boolean;
  /** Ícone original a ser exibido quando não está carregando */
  icon: LucideIcon;
  /** Classes CSS adicionais */
  className?: string;
}

export function SidebarLoadingIcon({ 
  isLoading, 
  icon: Icon,
  className 
}: SidebarLoadingIconProps) {
  if (isLoading) {
    return (
      <Loader2 
        className={cn("w-4 h-4 animate-spin text-brand-500", className)} 
      />
    );
  }
  
  return <Icon className={cn("w-4 h-4", className)} />;
}
