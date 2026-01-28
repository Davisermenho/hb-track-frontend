'use client';

import React from 'react';
import { EyeOpenIcon, PersonIcon, ArchiveIcon, ExitIcon, DotsVerticalIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { Team } from '@/types/teams-v2';
import { RoleBadge, StatusBadge } from '@/components/ui/RoleBadge';

interface TeamCardProps {
  team: Team;
  onViewTeam: () => void;
  onManageMembers: () => void;
  onLeaveTeam: () => void;
  onArchiveTeam: () => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  menuPosition?: { top: number; left: number };
}

/**
 * TeamCard - Card de equipe para o Dashboard
 * 
 * Exibe informações da equipe em formato de card com:
 * - Nome e código da equipe
 * - Categoria e gênero
 * - Papel do usuário (badge)
 * - Última atividade
 * - Menu de ações
 */
export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onViewTeam,
  onManageMembers,
  onLeaveTeam,
  onArchiveTeam,
  isMenuOpen,
  onToggleMenu,
}) => {
  const isArchived = team.status === 'archived';
  
  // Mapear papel para o formato do RoleBadge
  const getRoleFromString = (role: string): 'owner' | 'admin' | 'treinador' | 'coordenador' | 'atleta' | 'membro' => {
    if (role.includes('Proprietário')) return 'owner';
    if (role.includes('Admin')) return 'admin';
    if (role.includes('Treinador')) return 'treinador';
    if (role.includes('Coordenador')) return 'coordenador';
    if (role.includes('Atleta')) return 'atleta';
    return 'membro';
  };

  return (
    <div 
      data-testid={`team-card-${team.id}`}
      className={`group relative bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 ${
        isArchived ? 'opacity-60' : ''
      }`}
    >
      {/* Barra superior colorida */}
      <div className="h-1 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300" />
      
      <div className="p-5 space-y-4">
        {/* Header: Nome e badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {team.name}
              </h3>
              {isArchived && (
                <StatusBadge status="inativo" size="sm" />
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              ID: {team.code}
            </p>
          </div>
          
          <RoleBadge role={getRoleFromString(team.role)} size="sm" />
        </div>

        {/* Metadados */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-semibold">
              {team.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-semibold">
              {team.gender}
            </span>
          </div>
        </div>

        {/* Última atividade */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ActivityLogIcon className="w-3.5 h-3.5" />
          <span>{team.lastActivity}</span>
          {team.activityTime.includes('Hoje') && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span className="text-slate-400">{team.activityTime}</span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onViewTeam}
            data-testid={`view-team-${team.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-black rounded hover:opacity-90 transition-all"
          >
            <EyeOpenIcon className="w-3.5 h-3.5" />
            Ver equipe
          </button>
          
          <button
            onClick={onManageMembers}
            data-testid={`manage-members-${team.id}`}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Gerenciar membros"
          >
            <PersonIcon className="w-3.5 h-3.5" />
          </button>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
              data-testid={`more-actions-${team.id}`}
              className={`flex items-center justify-center p-2 rounded transition-all ${
                isMenuOpen
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Mais ações"
            >
              <DotsVerticalIcon className="w-4 h-4" />
            </button>

            {/* Dropdown menu inline */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu();
                  }}
                />
                <div data-testid={`dropdown-menu-${team.id}`} className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveTeam();
                      }}
                      data-testid={`leave-team-${team.id}`}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
                    >
                      <ExitIcon className="w-3.5 h-3.5" />
                      Sair da equipe
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveTeam();
                      }}
                      data-testid={`archive-team-${team.id}`}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors flex items-center gap-2"
                    >
                      <ArchiveIcon className="w-3.5 h-3.5" />
                      {isArchived ? 'Desarquivar' : 'Arquivar'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TeamCardSkeleton - Loading state do TeamCard
 */
export const TeamCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
    <div className="h-1 bg-slate-200 dark:bg-slate-800 animate-pulse" />
    
    <div className="p-5 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>

      {/* Metadados skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-5 w-14 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
        <div className="h-5 w-14 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
      </div>

      {/* Última atividade skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
      </div>

      {/* Ações skeleton */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex-1 h-9 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-9 w-9 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
        <div className="h-9 w-9 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

export default TeamCard;
