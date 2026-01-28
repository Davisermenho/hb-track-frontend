'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cross2Icon, MagnifyingGlassIcon, PersonIcon, ChevronRightIcon, ReloadIcon } from '@radix-ui/react-icons';
import type { Team } from '@/lib/api/teams';

interface TeamSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (team: Team) => void;
  teams: Team[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

/**
 * TeamSelectModal - Modal para seleção de equipe
 * 
 * Usado quando o usuário precisa escolher uma equipe para continuar.
 * Exibe lista de equipes com busca e seleção.
 */
const TeamSelectModal: React.FC<TeamSelectModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  teams,
  isLoading = false,
  title = 'Selecione uma Equipe',
  description = 'Escolha a equipe para continuar'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Filtrar equipes pela busca
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.gender?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Eventos de teclado
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click fora do modal
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar equipe..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        {/* Team List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ReloadIcon className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Carregando equipes...
              </p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <PersonIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Nenhuma equipe encontrada' : 'Você não possui equipes'}
              </p>
              {searchQuery && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Tente buscar por outro termo
                </p>
              )}
            </div>
          ) : (
            <div className="py-2">
              {filteredTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => onSelect(team)}
                  className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {team.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {team.gender && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <PersonIcon className="w-3 h-3" />
                          {team.gender}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRightIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {teams.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {filteredTeams.length} de {teams.length} equipe{teams.length !== 1 ? 's' : ''}
              {searchQuery && ' encontrada' + (filteredTeams.length !== 1 ? 's' : '')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSelectModal;
