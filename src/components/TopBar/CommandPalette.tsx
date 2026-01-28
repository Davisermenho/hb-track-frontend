'use client';

/**
 * CommandPalette - Busca global com atalho Ctrl+K
 * 
 * Funcionalidades:
 * - Busca por atletas, equipes, treinos, jogos
 * - Seções: Fixados, Recentes, Atalhos, Resultados
 * - Navegação por teclado
 * - Ações rápidas contextuais
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  X,
  Pin,
  Clock,
  Zap,
  ArrowRight,
  CornerDownLeft,
  ChevronUp,
  ChevronDown,
  Star,
  Users,
  Dumbbell,
  Gamepad2,
  Trophy,
  Home,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecentItems, type RecentItem } from '@/hooks/useRecentItems';
import { usePinnedItems, type PinnedItem } from '@/hooks/usePinnedItems';
import { useContextualShortcuts, type ContextualShortcut } from '@/hooks/useContextualShortcuts';

// =============================================================================
// TIPOS
// =============================================================================

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  path: string;
  type: 'athlete' | 'team' | 'training' | 'game' | 'page' | 'action';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type GroupedItem = {
  group: 'pinned' | 'recent' | 'shortcuts' | 'results';
  item: SearchResult;
};

// =============================================================================
// MOCK DE BUSCA (substituir por API real)
// =============================================================================

const MOCK_SEARCH_DATA: SearchResult[] = [
  { id: 'a1', title: 'João Silva', subtitle: 'Atleta - Sub-18', icon: Users, path: '/admin/athletes/1', type: 'athlete' },
  { id: 'a2', title: 'Maria Santos', subtitle: 'Atleta - Sub-16', icon: Users, path: '/admin/athletes/2', type: 'athlete' },
  { id: 't1', title: 'Equipe Sub-18', subtitle: '25 atletas', icon: Users, path: '/teams/1', type: 'team' },
  { id: 't2', title: 'Equipe Adulto', subtitle: '22 atletas', icon: Users, path: '/teams/2', type: 'team' },
  { id: 'tr1', title: 'Treino Tático', subtitle: 'Hoje, 15:00', icon: Dumbbell, path: '/training/1', type: 'training' },
  { id: 'g1', title: 'HB Track vs Adversário', subtitle: 'Sábado, 14:00', icon: Gamepad2, path: '/games/1', type: 'game' },
  { id: 'p1', title: 'Dashboard', subtitle: 'Página inicial', icon: Home, path: '/dashboard', type: 'page' },
  { id: 'p2', title: 'Estatísticas', subtitle: 'Análise de dados', icon: Trophy, path: '/statistics', type: 'page' },
];

function searchItems(query: string): SearchResult[] {
  if (!query.trim()) return [];
  
  const q = query.toLowerCase();
  return MOCK_SEARCH_DATA.filter(item => 
    item.title.toLowerCase().includes(q) ||
    item.subtitle?.toLowerCase().includes(q)
  );
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { recentItems } = useRecentItems();
  const { pinnedItems, isPinned, togglePin } = usePinnedItems();
  const { shortcuts } = useContextualShortcuts();

  // Resultados da busca
  const searchResults = useMemo(() => searchItems(query), [query]);

  // Agrupar todos os itens
  const allItems = useMemo((): GroupedItem[] => {
    const items: GroupedItem[] = [];

    // Fixados (sempre primeiro)
    if (pinnedItems.length > 0 && !query) {
      pinnedItems.forEach(item => {
        items.push({
          group: 'pinned',
          item: {
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            icon: item.icon,
            path: item.path,
            type: item.type as SearchResult['type'],
          },
        });
      });
    }

    // Recentes (quando não há busca)
    if (recentItems.length > 0 && !query) {
      recentItems.slice(0, 5).forEach(item => {
        // Não duplicar fixados
        if (!isPinned(item.path)) {
          items.push({
            group: 'recent',
            item: {
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
              icon: item.icon,
              path: item.path,
              type: item.type as SearchResult['type'],
            },
          });
        }
      });
    }

    // Atalhos contextuais (quando não há busca)
    if (!query) {
      shortcuts.slice(0, 4).forEach(shortcut => {
        items.push({
          group: 'shortcuts',
          item: {
            id: shortcut.id,
            title: shortcut.title,
            subtitle: shortcut.description,
            icon: shortcut.icon,
            path: shortcut.action,
            type: shortcut.type === 'action' ? 'action' : 'page',
          },
        });
      });
    }

    // Resultados da busca
    if (query) {
      searchResults.forEach(result => {
        items.push({
          group: 'results',
          item: result,
        });
      });
    }

    return items;
  }, [pinnedItems, recentItems, shortcuts, searchResults, query, isPinned]);

  // Resetar ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Resetar seleção quando itens mudam
  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems.length]);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex].item);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [allItems, selectedIndex, onClose]);

  // Selecionar item
  const handleSelect = useCallback((item: SearchResult) => {
    router.push(item.path);
    onClose();
  }, [router, onClose]);

  // Fixar/desfixar item
  const handleTogglePin = useCallback((item: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin({
      path: item.path,
      title: item.title,
      subtitle: item.subtitle,
      icon: item.icon,
      type: item.type as PinnedItem['type'],
    });
  }, [togglePin]);

  // Scroll para item selecionado
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Agrupar por seção para renderização
  const groupedSections = useMemo(() => {
    const sections: { key: string; title: string; icon: LucideIcon; items: GroupedItem[] }[] = [];
    
    const pinned = allItems.filter(i => i.group === 'pinned');
    const recent = allItems.filter(i => i.group === 'recent');
    const shortcutsItems = allItems.filter(i => i.group === 'shortcuts');
    const results = allItems.filter(i => i.group === 'results');

    if (pinned.length > 0) {
      sections.push({ key: 'pinned', title: 'Fixados', icon: Pin, items: pinned });
    }
    if (recent.length > 0) {
      sections.push({ key: 'recent', title: 'Recentes', icon: Clock, items: recent });
    }
    if (shortcutsItems.length > 0) {
      sections.push({ key: 'shortcuts', title: 'Atalhos', icon: Zap, items: shortcutsItems });
    }
    if (results.length > 0) {
      sections.push({ key: 'results', title: 'Resultados', icon: Search, items: results });
    }

    return sections;
  }, [allItems]);

  // Calcular índice global para cada item
  const getGlobalIndex = (sectionIndex: number, itemIndex: number): number => {
    let index = 0;
    for (let i = 0; i < sectionIndex; i++) {
      index += groupedSections[i].items.length;
    }
    return index + itemIndex;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header com Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar atleta, treino, equipe..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
            />
            <div className="flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 rounded">
                <Command className="w-3 h-3" />K
              </kbd>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
            {groupedSections.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {query ? 'Nenhum resultado encontrado' : 'Comece a digitar para buscar'}
                </p>
              </div>
            ) : (
              groupedSections.map((section, sectionIdx) => (
                <div key={section.key} className="py-2">
                  {/* Título da Seção */}
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <section.icon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </span>
                  </div>
                  
                  {/* Itens */}
                  {section.items.map((grouped, itemIdx) => {
                    const globalIdx = getGlobalIndex(sectionIdx, itemIdx);
                    const isSelected = globalIdx === selectedIndex;
                    const itemIsPinned = isPinned(grouped.item.path);
                    const Icon = grouped.item.icon;

                    return (
                      <div
                        key={grouped.item.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect(grouped.item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelect(grouped.item);
                          }
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer',
                          isSelected 
                            ? 'bg-brand-50 dark:bg-brand-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          isSelected 
                            ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            isSelected 
                              ? 'text-brand-700 dark:text-brand-300' 
                              : 'text-gray-900 dark:text-white'
                          )}>
                            {grouped.item.title}
                          </p>
                          {grouped.item.subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {grouped.item.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Botão de Fixar */}
                        <button
                          onClick={(e) => handleTogglePin(grouped.item, e)}
                          className={cn(
                            'p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100',
                            isSelected && 'opacity-100',
                            itemIsPinned 
                              ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20' 
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          )}
                          title={itemIsPinned ? 'Desfixar' : 'Fixar'}
                        >
                          {itemIsPinned ? (
                            <Star className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Indicador de Enter */}
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-brand-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer com Dicas */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ChevronUp className="w-3 h-3" />
                <ChevronDown className="w-3 h-3" />
                navegar
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" />
                selecionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">esc</kbd>
                fechar
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// =============================================================================
// BOTÃO DE BUSCA (para usar na TopBar)
// =============================================================================

interface SearchButtonProps {
  onClick: () => void;
  className?: string;
}

export function SearchButton({ onClick, className }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400',
        'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
        'rounded-lg transition-colors',
        className
      )}
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Buscar...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-700 rounded">
        <Command className="w-2.5 h-2.5" />K
      </kbd>
    </button>
  );
}

export default CommandPalette;
