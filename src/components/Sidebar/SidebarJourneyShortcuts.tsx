'use client';

/**
 * SidebarJourneyShortcuts - Atalhos de jornada na sidebar
 * 
 * Exibe atalhos dinâmicos baseados em:
 * - Contexto atual (ex: pós-jogo mostra avaliação)
 * - Rotas frequentes do usuário
 * - Jornadas principais (planejamento, preparação)
 * 
 * @version 1.0.0
 */

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJourneyShortcuts, type JourneyShortcut } from '@/hooks/useJourneyShortcuts';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarJourneyShortcutsProps {
  isCollapsed: boolean;
  className?: string;
  /** Máximo de atalhos a exibir */
  maxItems?: number;
  /** Se deve mostrar atalhos frequentes */
  showFrequent?: boolean;
}

export function SidebarJourneyShortcuts({ 
  isCollapsed,
  className,
  maxItems = 3,
  showFrequent = true,
}: SidebarJourneyShortcutsProps) {
  const { shortcuts, contextualShortcut, frequentRoutes } = useJourneyShortcuts();

  // Combinar atalhos fixos com frequentes
  const allShortcuts = [
    ...shortcuts.slice(0, maxItems),
    ...(showFrequent ? frequentRoutes.slice(0, 2) : []),
  ].slice(0, maxItems + 2);

  if (allShortcuts.length === 0) {
    return null;
  }

  // Modo colapsado
  if (isCollapsed) {
    return (
      <div className={cn('px-2 py-2', className)}>
        {contextualShortcut && (
          <SidebarTooltip content={contextualShortcut.name} enabled>
            <Link
              href={contextualShortcut.href}
              className={cn(
                'flex items-center justify-center p-2 rounded-lg',
                'bg-brand-50 dark:bg-brand-900/20',
                'text-brand-600 dark:text-brand-400',
                'hover:bg-brand-100 dark:hover:bg-brand-900/30',
                'transition-colors'
              )}
            >
              <contextualShortcut.icon className="w-4 h-4" />
            </Link>
          </SidebarTooltip>
        )}
      </div>
    );
  }

  return (
    <div className={cn('px-2 py-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 mb-2">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Acesso Rápido
        </span>
      </div>

      {/* Atalho contextual destacado */}
      <AnimatePresence>
        {contextualShortcut && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <Link
              href={contextualShortcut.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'bg-gradient-to-r from-brand-50 to-brand-100',
                'dark:from-brand-900/20 dark:to-brand-800/20',
                'text-brand-700 dark:text-brand-400',
                'hover:from-brand-100 hover:to-brand-200',
                'dark:hover:from-brand-900/30 dark:hover:to-brand-800/30',
                'transition-all duration-200',
                'border border-brand-200 dark:border-brand-800/50'
              )}
            >
              <contextualShortcut.icon className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {contextualShortcut.name}
                </p>
                {contextualShortcut.description && (
                  <p className="text-[10px] text-brand-600/70 dark:text-brand-400/70 truncate">
                    {contextualShortcut.description}
                  </p>
                )}
              </div>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atalhos fixos */}
      <div className="space-y-0.5">
        {shortcuts
          .filter(s => s.id !== contextualShortcut?.id)
          .slice(0, maxItems)
          .map((shortcut) => (
            <ShortcutItem key={shortcut.id} shortcut={shortcut} />
          ))}
      </div>

      {/* Rotas frequentes */}
      {showFrequent && frequentRoutes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="px-2 mb-1 text-[9px] text-gray-400 dark:text-gray-500 uppercase">
            Frequentes
          </p>
          {frequentRoutes.slice(0, 2).map((shortcut) => (
            <ShortcutItem key={shortcut.id} shortcut={shortcut} isFrequent />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTE
// =============================================================================

interface ShortcutItemProps {
  shortcut: JourneyShortcut;
  isFrequent?: boolean;
}

function ShortcutItem({ shortcut, isFrequent }: ShortcutItemProps) {
  const Icon = shortcut.icon;
  
  return (
    <Link
      href={shortcut.href}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
        'text-gray-600 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'hover:text-gray-900 dark:hover:text-gray-200',
        'transition-colors'
      )}
    >
      <Icon className={cn(
        'w-3.5 h-3.5 flex-shrink-0',
        isFrequent && 'text-amber-500'
      )} />
      <span className="truncate">{shortcut.name}</span>
    </Link>
  );
}

export default SidebarJourneyShortcuts;
