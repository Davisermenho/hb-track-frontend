'use client';

/**
 * SidebarSubmenu - Item com submenu expansível
 * 
 * Componente para itens que contêm subitens, como:
 * - Treinos (Agenda, Calendário, Planejamento, etc.)
 * - Jogos (Dashboard, Escalações, etc.)
 * - Estatísticas (Por Equipe, Por Atleta, etc.)
 * 
 * @version 4.1.0 - Suporte a badge string e tooltip para visibilidade de rotas
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarBadge } from './SidebarBadge';
import { SidebarTooltip } from './SidebarTooltip';

interface SubmenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  tooltip?: string;
}

interface SidebarSubmenuProps {
  name: string;
  icon: LucideIcon;
  items: SubmenuItem[];
  isCollapsed: boolean;
  badge?: number | string;
  badgeVariant?: 'default' | 'warning' | 'error' | 'success';
  tooltip?: string;
  defaultOpen?: boolean;
}

export function SidebarSubmenu({
  name,
  icon: Icon,
  items,
  isCollapsed,
  badge,
  badgeVariant = 'default',
  tooltip,
  defaultOpen = false,
}: SidebarSubmenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Verificar se algum item do submenu está ativo
  const isActive = items.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  // Abrir automaticamente se um item estiver ativo
  useEffect(() => {
    if (isActive && !isOpen) {
      setIsOpen(true);
    }
  }, [isActive]);

  const toggleButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      title={tooltip}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
        isActive || isOpen
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
          : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
        isCollapsed && 'justify-center',
        badge === '!' && 'opacity-70'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left">{name}</span>
          {badge !== undefined && (
            typeof badge === 'number' && badge > 0 ? (
              <SidebarBadge count={badge} variant={badgeVariant} />
            ) : badge === '!' ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            ) : null
          )}
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </>
      )}
    </button>
  );

  return (
    <div>
      {isCollapsed ? (
        <SidebarTooltip content={tooltip || name} enabled={isCollapsed}>
          {toggleButton}
        </SidebarTooltip>
      ) : (
        toggleButton
      )}

      {/* Submenu items */}
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-300 dark:border-gray-700">
              {items.map((item) => {
                const itemActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const ItemIcon = item.icon;

                return (
                  <Link key={item.href} href={item.href} title={item.tooltip}>
                    <div
                      className={cn(
                        'flex items-center gap-2.5 pl-3 pr-3 py-1.5 text-xs font-medium transition-all duration-200',
                        itemActive
                          ? 'text-brand-700 dark:text-brand-400'
                          : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                      )}
                    >
                      <ItemIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
