'use client';

/**
 * TeamNavigationTabs - Navegação por tabs usando rotas Next.js
 * 
 * Usado em /teams/[teamId] para navegação entre:
 * - Visão Geral
 * - Membros
 * - Treinos
 * - Estatísticas
 * - Configurações
 * 
 * @version 1.0.0
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export interface NavigationTab {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  testId?: string; // data-testid customizado
}

// Mapeamento de rota para data-testid canônico (para testes E2E)
const ROUTE_TO_TESTID: Record<string, string> = {
  'overview': 'team-overview-tab',
  'members': 'team-members-tab',
  'trainings': 'team-trainings-tab',
  'stats': 'team-stats-tab',
  'settings': 'team-settings-tab',
};

interface TeamNavigationTabsProps {
  tabs: NavigationTab[];
  className?: string;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function TeamNavigationTabs({ tabs, className }: TeamNavigationTabsProps) {
  const pathname = usePathname();

  // Função para gerar data-testid baseado na rota
  const getTestId = (href: string, label: string): string => {
    // Extrair a última parte da rota (ex: /teams/123/trainings → trainings)
    const routePart = href.split('/').pop() || '';
    // Usar mapeamento canônico ou fallback para label
    return ROUTE_TO_TESTID[routePart] || `tab-${label.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
  };

  return (
    <nav
      className={cn(
        'border-b border-gray-200 dark:border-gray-800',
        className
      )}
      role="tablist"
    >
      <div className="flex gap-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          const testId = tab.testId || getTestId(tab.href, tab.label);

          if (tab.disabled) {
            return (
              <div
                key={tab.href}
                data-testid={testId}
                className="flex items-center gap-2 pb-3 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
                    {tab.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-testid={testId}
              className={cn(
                'flex items-center gap-2 pb-3 text-sm font-medium transition-all relative whitespace-nowrap',
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
              role="tab"
              aria-selected={isActive}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              
              {tab.badge && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  isActive
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                )}>
                  {tab.badge}
                </span>
              )}

              {/* Indicador de tab ativa */}
              {isActive && (
                <motion.div
                  layoutId="team-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
