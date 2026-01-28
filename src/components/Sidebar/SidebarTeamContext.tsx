'use client';

/**
 * SidebarTeamContext - Indicador de equipe e temporada ativa
 * 
 * Exibe a equipe selecionada e temporada atual no topo da sidebar,
 * com dropdown para seleção rápida entre equipes.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
}

interface SidebarTeamContextProps {
  teamName: string | null;
  teamId?: string | null;
  seasonYear: number;
  isCollapsed: boolean;
  onChangeTeam: () => void;
  /** Lista de equipes disponíveis para seleção rápida */
  teams?: Team[];
  /** Callback quando uma equipe é selecionada no dropdown */
  onSelectTeam?: (teamId: string) => void;
  /** Callback para criar nova equipe */
  onCreateTeam?: () => void;
}

export function SidebarTeamContext({
  teamName,
  teamId,
  seasonYear,
  isCollapsed,
  onChangeTeam,
  teams = [],
  onSelectTeam,
  onCreateTeam,
}: SidebarTeamContextProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fechar com Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelectTeam = (id: string) => {
    onSelectTeam?.(id);
    setIsOpen(false);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={onChangeTeam}
        className="mx-2 my-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={teamName || 'Selecionar Equipe'}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 mx-auto" />
      </button>
    );
  }

  const hasMultipleTeams = teams.length > 1;
  const showDropdown = hasMultipleTeams && onSelectTeam;

  return (
    <div className="px-2 py-3 border-b border-gray-200 dark:border-gray-700" ref={dropdownRef}>
      <button
        onClick={() => showDropdown ? setIsOpen(!isOpen) : onChangeTeam()}
        className={cn(
          'w-full text-left rounded-lg p-2.5 transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {teamName || 'Selecionar Equipe'}
            </span>
          </div>
          <ChevronDown 
            className={cn(
              "w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 ml-4">
          Temporada {seasonYear}
        </div>
      </button>

      {/* Dropdown de seleção de equipes */}
      <AnimatePresence>
        {isOpen && showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            role="listbox"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    team.id === teamId && "bg-brand-50 dark:bg-brand-900/20"
                  )}
                  role="option"
                  aria-selected={team.id === teamId}
                >
                  <div className={cn(
                    "w-4 h-4 flex items-center justify-center",
                    team.id === teamId ? "text-brand-600" : "text-transparent"
                  )}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className={cn(
                    "truncate",
                    team.id === teamId 
                      ? "text-brand-700 dark:text-brand-400 font-medium" 
                      : "text-gray-700 dark:text-gray-300"
                  )}>
                    {team.name}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Botão para criar nova equipe */}
            {onCreateTeam && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onCreateTeam();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-600 dark:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar nova equipe</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
