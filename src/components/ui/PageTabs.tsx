'use client';

/**
 * PageTabs - Componente de tabs internas para páginas
 * 
 * Substitui rotas superficiais por tabs dentro de uma única página.
 * Suporta:
 * - Roteamento via query string (?tab=avaliacoes)
 * - Histórico do navegador
 * - Deep linking
 * - Animações suaves
 * 
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export interface TabDefinition {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  content: React.ReactNode;
}

interface PageTabsProps {
  tabs: TabDefinition[];
  defaultTab?: string;
  /** Se true, usa query string para persistir a tab selecionada */
  useQueryString?: boolean;
  /** Nome do parâmetro na query string (default: 'tab') */
  queryParam?: string;
  /** Callback quando a tab muda */
  onTabChange?: (tabId: string) => void;
  /** Estilo das tabs */
  variant?: 'default' | 'pills' | 'underline';
  /** Classe CSS adicional */
  className?: string;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function PageTabs({
  tabs,
  defaultTab,
  useQueryString = true,
  queryParam = 'tab',
  onTabChange,
  variant = 'default',
  className,
}: PageTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Obter tab da query string ou usar default
  const queryTab = searchParams.get(queryParam);
  const initialTab = queryTab || defaultTab || tabs[0]?.id;
  
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sincronizar com query string
  useEffect(() => {
    if (useQueryString && queryTab && queryTab !== activeTab) {
      const updateTab = () => setActiveTab(queryTab);
      updateTab();
    }
  }, [queryTab, useQueryString, activeTab]);

  // Handler de mudança de tab
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    
    // Atualizar query string
    if (useQueryString) {
      const params = new URLSearchParams(searchParams.toString());
      params.set(queryParam, tabId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
    
    onTabChange?.(tabId);
  }, [useQueryString, queryParam, searchParams, pathname, router, onTabChange]);

  // Encontrar tab ativa
  const activeTabDef = useMemo(() => 
    tabs.find(t => t.id === activeTab) || tabs[0],
    [tabs, activeTab]
  );

  // Classes de variante
  const getTabClasses = (isActive: boolean, isDisabled: boolean) => {
    const base = 'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200';
    const disabled = 'opacity-50 cursor-not-allowed';
    
    switch (variant) {
      case 'pills':
        return cn(
          base,
          'rounded-full',
          isActive
            ? 'bg-brand-500 text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
          isDisabled && disabled
        );
      
      case 'underline':
        return cn(
          base,
          'border-b-2 -mb-px',
          isActive
            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300',
          isDisabled && disabled
        );
      
      default: // default tabs
        return cn(
          base,
          'rounded-lg',
          isActive
            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
          isDisabled && disabled
        );
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div 
        className={cn(
          'flex gap-1',
          variant === 'underline' && 'border-b border-gray-200 dark:border-gray-700'
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={getTabClasses(isActive, !!tab.disabled)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  isActive
                    ? 'bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-brand-200'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={activeTab}
          >
            {activeTabDef?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// HOOK AUXILIAR
// =============================================================================

/**
 * Hook para usar tabs com estado controlado externamente
 */
export function usePageTabs(tabs: TabDefinition[], defaultTab?: string) {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || defaultTab || tabs[0]?.id);
  
  const activeTabDef = useMemo(() => 
    tabs.find(t => t.id === activeTab) || tabs[0],
    [tabs, activeTab]
  );

  return {
    activeTab,
    setActiveTab,
    activeTabDef,
    tabs,
  };
}

export default PageTabs;
