'use client';

/**
 * SidebarCollapsibleSection - Seção colapsável da sidebar
 * 
 * Variação do SidebarSection que permite expandir/colapsar
 * seu conteúdo, útil para seções administrativas ou secundárias.
 * O estado de colapso é persistido no localStorage.
 * 
 * @version 1.0.0
 */

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarCollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  isCollapsed: boolean;  // Estado da sidebar (não da seção)
  children: ReactNode;
  defaultExpanded?: boolean;
  storageKey?: string;
  badge?: ReactNode;
}

export function SidebarCollapsibleSection({
  title,
  icon: Icon,
  isCollapsed,
  children,
  defaultExpanded = true,
  storageKey,
  badge,
}: SidebarCollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (!storageKey || typeof window === 'undefined') {
      return defaultExpanded;
    }
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      return saved === 'true';
    }
    return defaultExpanded;
  });

  // Salvar estado no localStorage
  const handleToggle = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(newValue));
    }
  };

  // Se a sidebar está colapsada, mostra apenas um divisor
  if (isCollapsed) {
    return (
      <>
        <div className="h-px bg-gray-200 dark:bg-gray-700/50 mx-2 my-3" />
        {children}
      </>
    );
  }

  return (
    <div className="mt-1">
      {/* Header clicável */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg',
          'transition-colors group'
        )}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
            {title}
          </span>
          {badge && (
            <span className="ml-1">{badge}</span>
          )}
        </div>
        <ChevronDown 
          className={cn(
            'w-3 h-3 text-gray-400 dark:text-gray-500 transition-transform',
            !isExpanded && '-rotate-90'
          )} 
        />
      </button>

      {/* Conteúdo colapsável */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
