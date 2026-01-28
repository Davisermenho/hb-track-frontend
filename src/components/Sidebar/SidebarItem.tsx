'use client';

/**
 * SidebarItem - Item de navegação da sidebar
 * 
 * Componente reutilizável para itens de menu com:
 * - Ícone (com suporte a loading)
 * - Label
 * - Badge opcional (count ou label personalizado)
 * - Estado ativo
 * - Tooltip no modo colapsado
 * - Suporte a telemetria de navegação
 */

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarBadge } from './SidebarBadge';
import { SidebarTooltip } from './SidebarTooltip';
import { SidebarLoadingIcon } from './SidebarLoadingIcon';

interface SidebarItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  /** Badge numérico (ex: 3) */
  badge?: number;
  /** Badge com texto personalizado (ex: "2 hoje", "1 pendente") */
  badgeLabel?: string;
  badgeVariant?: 'default' | 'warning' | 'error' | 'success';
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  /** Exibe spinner no lugar do ícone durante loading */
  isLoading?: boolean;
  /** Callback para telemetria quando item é clicado */
  onNavigate?: (path: string) => void;
}

export function SidebarItem({
  name,
  href,
  icon: Icon,
  isActive,
  isCollapsed,
  badge,
  badgeLabel,
  badgeVariant = 'default',
  onClick,
  disabled = false,
  isLoading = false,
  onNavigate,
}: SidebarItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onNavigate) {
      onNavigate(href);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
        isActive
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
          : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
        isCollapsed && 'justify-center',
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      <SidebarLoadingIcon isLoading={isLoading} icon={Icon} className="flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{name}</span>
          {/* Badge com texto personalizado tem prioridade */}
          {badgeLabel ? (
            <span className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full',
              badgeVariant === 'warning' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              badgeVariant === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              badgeVariant === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              badgeVariant === 'default' && 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
            )}>
              {badgeLabel}
            </span>
          ) : badge !== undefined && badge > 0 && (
            <SidebarBadge count={badge} variant={badgeVariant} />
          )}
        </>
      )}
    </div>
  );

  const wrappedContent = isCollapsed ? (
    <SidebarTooltip content={name} enabled={isCollapsed}>
      {content}
    </SidebarTooltip>
  ) : (
    content
  );

  if (onClick || onNavigate) {
    return (
      <Link href={href} onClick={handleClick}>
        {wrappedContent}
      </Link>
    );
  }

  if (disabled) {
    return wrappedContent;
  }

  return (
    <Link href={href}>
      {wrappedContent}
    </Link>
  );
}
