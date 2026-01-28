'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  PlusIcon, MixerHorizontalIcon, DotsVerticalIcon, ArchiveIcon, EyeOpenIcon,
  PersonIcon, ExitIcon, ChevronDownIcon, Cross2Icon, ReloadIcon,
  CheckCircledIcon, CrossCircledIcon, MagnifyingGlassIcon, ViewGridIcon,
  ListBulletIcon, LightningBoltIcon, EnvelopeClosedIcon
} from '@radix-ui/react-icons';
import Image from 'next/image';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Team } from '@/types/teams-v2';
import { teamsService } from '@/lib/api/teams';
import { mapApiTeamsToV2 } from '@/lib/adapters/teams-v2-adapter';
import CreateTeamModal from './CreateTeamModal';
import { TeamCard, TeamCardSkeleton } from './TeamCard';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface DashboardProps {
  onSelectTeam: (team: Team, initialTab?: 'MEMBERS', isNew?: boolean) => void;
}

type ViewMode = 'grid' | 'list';

/**
 * Dashboard - Página principal de equipes
 * 
 * Cenários:
 * 1. Loading: Skeleton loaders
 * 2. Sem equipes: Empty state instrutivo
 * 3. Com equipes: Grid/Lista de TeamCards
 */
const Dashboard: React.FC<DashboardProps> = ({ onSelectTeam }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Verificar permissão para criar equipe (RF6: Dirigentes, Coordenadores e Treinadores)
  // Nota: superadmin tem role_code='dirigente' + is_superadmin=true
  const canCreateTeam = user?.role === 'dirigente' || user?.role === 'coordenador' || user?.role === 'treinador';
  
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('teams-view-mode') as ViewMode) || 'grid';
    }
    return 'grid';
  });
  const [roleFilter, setRoleFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('teams-role-filter') || 'Todas';
    }
    return 'Todas';
  });
  const [leaveTeamModal, setLeaveTeamModal] = useState<string | null>(null);
  const [archiveTeamModal, setArchiveTeamModal] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 5;
  
  // Refs
  const filterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Query: Carregar equipes
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['teams', currentPage, itemsPerPage],
    queryFn: async () => {
      const response = await teamsService.list({ page: currentPage, limit: itemsPerPage });
      const mappedTeams = mapApiTeamsToV2(response.items);
      return {
        teams: mappedTeams,
        total: response.total,
        totalPages: Math.ceil(response.total / itemsPerPage)
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const teams = data?.teams || [];
  const totalTeams = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Mutation: Sair da equipe
  const leaveTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      // TODO: Implementar endpoint /teams/{id}/leave
      await teamsService.delete(teamId, 'Usuário saiu da equipe');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Você saiu da equipe com sucesso.');
      setLeaveTeamModal(null);
    },
    onError: () => {
      toast.error('Não foi possível sair da equipe. Tente novamente.');
    },
  });

  // Mutation: Arquivar equipe
  const archiveTeamMutation = useMutation({
    mutationFn: async ({ teamId, isArchived }: { teamId: string; isArchived: boolean }) => {
      if (isArchived) {
        await teamsService.update(teamId, {});
      } else {
        await teamsService.delete(teamId, 'Arquivada pelo usuário');
      }
    },
    onSuccess: (_, { isArchived }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(isArchived ? 'Equipe desarquivada com sucesso.' : 'Equipe arquivada com sucesso.');
      setArchiveTeamModal(null);
    },
    onError: () => {
      toast.error('Não foi possível realizar esta ação. Tente novamente.');
    },
  });

  // Prefetch próxima página
  useEffect(() => {
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['teams', currentPage + 1, itemsPerPage],
        queryFn: async () => {
          const response = await teamsService.list({ page: currentPage + 1, limit: itemsPerPage });
          return {
            teams: mapApiTeamsToV2(response.items),
            total: response.total,
            totalPages: Math.ceil(response.total / itemsPerPage)
          };
        },
      });
    }
  }, [currentPage, totalPages, queryClient, itemsPerPage]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeDropdown) setActiveDropdown(null);
      if (filterDropdownOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown, filterDropdownOpen]);

  // Persistir preferências
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teams-role-filter', roleFilter);
      localStorage.setItem('teams-view-mode', viewMode);
    }
  }, [roleFilter, viewMode]);

  // Filtrar equipes
  const filteredTeams = teams.filter(team => {
    if (searchQuery && !team.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (roleFilter === 'Todas') return true;
    if (roleFilter === 'Admin') return team.role.includes('Admin');
    if (roleFilter === 'Coordenador(a)') return team.role.includes('Coordenador');
    if (roleFilter === 'Treinador(a)') return team.role.includes('Treinador');
    if (roleFilter === 'Membro') return !team.role.includes('Admin') && !team.role.includes('Coordenador') && !team.role.includes('Treinador');
    return true;
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K para focar busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape para fechar modais
      if (e.key === 'Escape') {
        if (leaveTeamModal && !leaveTeamMutation.isPending) setLeaveTeamModal(null);
        if (archiveTeamModal && !archiveTeamMutation.isPending) setArchiveTeamModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leaveTeamModal, archiveTeamModal, leaveTeamMutation.isPending, archiveTeamMutation.isPending]);

  // Handlers
  const handleTeamCreated = useCallback((newTeam: Team) => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    toast.success('Equipe criada com sucesso! Redirecionando...');
    setTimeout(() => {
      onSelectTeam(newTeam, 'MEMBERS', true);
    }, 500);
  }, [queryClient, toast, onSelectTeam]);

  // =========================================================================
  // RENDER: Loading State
  // =========================================================================
  if (isLoading) {
    return (
      <div data-testid="teams-skeleton" className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
            <div className="h-10 w-80 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
            <div className="h-10 w-32 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
            <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Grid de skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Error State
  // =========================================================================
  if (isError) {
    return (
      <div data-testid="teams-dashboard" className="flex items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <CrossCircledIcon className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Erro ao carregar equipes
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(error as Error)?.message || 'Não foi possível carregar suas equipes. Tente novamente.'}
            </p>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['teams'] })}
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-all"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Empty State (Cenário 2)
  // =========================================================================
  if (!isLoading && teams.length === 0) {
    return (
      <div data-testid="empty-state" className="flex items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="max-w-lg text-center space-y-8">
          {/* Ilustração */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
              <PersonIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
            {/* Decoração */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center rotate-12">
              <LightningBoltIcon className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* Texto principal */}
          <div className="space-y-3">
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
              Você ainda não participa de nenhuma equipe
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Crie uma agora ou aguarde um convite de um administrador para começar a gerenciar 
              treinos, atletas e análises táticas.
            </p>
          </div>

          {/* CTA Principal */}
          <button
            onClick={() => setIsModalOpen(true)}
            data-testid="create-first-team-btn"
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-sm px-8 py-4 rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Criar minha primeira equipe
          </button>

          {/* Dica sobre convites */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <EnvelopeClosedIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Aguardando um convite?
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Você receberá uma notificação quando um administrador adicioná-lo a uma equipe. 
                  Verifique também sua caixa de e-mail.
                </p>
              </div>
            </div>
          </div>

          {/* Passos */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Como funciona:</p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full font-medium text-slate-600 dark:text-slate-300">
                <span className="w-5 h-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-black rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                Crie uma equipe
              </span>
              <ChevronDownIcon className="w-4 h-4 text-slate-300 dark:text-slate-700 rotate-[-90deg]" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full font-medium text-slate-600 dark:text-slate-300">
                <span className="w-5 h-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-black rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                Convide membros
              </span>
              <ChevronDownIcon className="w-4 h-4 text-slate-300 dark:text-slate-700 rotate-[-90deg]" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full font-medium text-slate-600 dark:text-slate-300">
                <span className="w-5 h-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-black rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                Comece um treino
              </span>
            </div>
          </div>
        </div>

        {/* Modal */}
        <CreateTeamModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleTeamCreated}
          onError={(message) => toast.error(message)}
        />
      </div>
    );
  }

  // =========================================================================
  // RENDER: Com Equipes
  // =========================================================================
  return (
    <div data-testid="teams-dashboard" className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div>
            <h1 className="app-title font-heading tracking-tight text-slate-900 dark:text-white">
              Minhas Equipes
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm mt-1">
              Gerencie suas equipes, treinos e atletas em um só lugar.
            </p>
          </div>
          
          {/* Busca */}
          <div className="relative w-full max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar equipe... (Ctrl+K)"
              className="pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-400 dark:focus:border-slate-600 outline-none transition-all w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-2">
            {totalTeams} {totalTeams === 1 ? 'equipe' : 'equipes'}
          </p>

          {/* Toggle de visualização */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Visualização em grid"
            >
              <ViewGridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Visualização em lista"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Filtro */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilterDropdownOpen(!filterDropdownOpen);
              }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <MixerHorizontalIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                {roleFilter === 'Todas' ? 'Todas as funções' : roleFilter}
              </span>
              <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {filterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in duration-200">
                  <div className="py-1">
                    {['Todas', 'Admin', 'Coordenador(a)', 'Treinador(a)', 'Membro'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setRoleFilter(option);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold transition-all flex items-center justify-between ${
                          roleFilter === option
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <span>{option === 'Todas' ? 'Todas as funções' : option}</span>
                        {roleFilter === option && (
                          <CheckCircledIcon className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Criar equipe - RF6: apenas Dirigentes e Coordenadores */}
          {canCreateTeam && (
            <button
              onClick={() => setIsModalOpen(true)}
              data-testid="create-team-btn"
              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Criar equipe
            </button>
          )}
        </div>
      </div>

      {/* Grid/Lista de equipes */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
          <MagnifyingGlassIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma equipe encontrada com o filtro atual.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('Todas');
            }}
            className="mt-4 text-xs font-semibold text-slate-900 dark:text-white hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onViewTeam={() => onSelectTeam(team)}
              onManageMembers={() => onSelectTeam(team, 'MEMBERS')}
              onLeaveTeam={() => setLeaveTeamModal(team.id)}
              onArchiveTeam={() => setArchiveTeamModal(team.id)}
              isMenuOpen={activeDropdown === team.id}
              onToggleMenu={() => setActiveDropdown(activeDropdown === team.id ? null : team.id)}
            />
          ))}
        </div>
      ) : (
        /* Lista compacta */
        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{team.name}</p>
                    <p className="text-xs text-slate-500">{team.category} • {team.gender}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{team.role}</span>
                  <button
                    onClick={() => onSelectTeam(team)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Abrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalTeams > itemsPerPage && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-500">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal: Criar equipe */}
      <CreateTeamModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTeamCreated}
        onError={(message) => toast.error(message)}
      />

      {/* Modal: Sair da equipe */}
      {leaveTeamModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !leaveTeamMutation.isPending && setLeaveTeamModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0f0f0f] shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Sair da equipe</h2>
              <button 
                onClick={() => !leaveTeamMutation.isPending && setLeaveTeamModal(null)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded transition-colors" 
                disabled={leaveTeamMutation.isPending}
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tem certeza que deseja sair desta equipe? Você perderá acesso aos treinos e dados da equipe.
              </p>
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button 
                onClick={() => setLeaveTeamModal(null)} 
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                disabled={leaveTeamMutation.isPending}
              >
                Cancelar
              </button>
              <button 
                onClick={() => leaveTeamMutation.mutate(leaveTeamModal)}
                disabled={leaveTeamMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {leaveTeamMutation.isPending && <ReloadIcon className="w-3.5 h-3.5 animate-spin" />}
                {leaveTeamMutation.isPending ? 'Saindo...' : 'Sair da equipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Arquivar equipe */}
      {archiveTeamModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !archiveTeamMutation.isPending && setArchiveTeamModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0f0f0f] shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            {(() => {
              const team = teams.find(t => t.id === archiveTeamModal);
              const isArchived = team?.status === 'archived';
              return (
                <>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">
                      {isArchived ? 'Desarquivar equipe' : 'Arquivar equipe'}
                    </h2>
                    <button 
                      onClick={() => !archiveTeamMutation.isPending && setArchiveTeamModal(null)} 
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded transition-colors" 
                      disabled={archiveTeamMutation.isPending}
                    >
                      <Cross2Icon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isArchived
                        ? 'Deseja reativar esta equipe? Ela voltará a aparecer na sua lista principal.'
                        : 'Deseja arquivar esta equipe? Ela será ocultada da lista principal mas poderá ser acessada via filtros.'}
                    </p>
                  </div>
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button 
                      onClick={() => setArchiveTeamModal(null)} 
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                      disabled={archiveTeamMutation.isPending}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => archiveTeamMutation.mutate({ teamId: archiveTeamModal, isArchived: !!isArchived })}
                      disabled={archiveTeamMutation.isPending}
                      className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {archiveTeamMutation.isPending && <ReloadIcon className="w-3.5 h-3.5 animate-spin" />}
                      {archiveTeamMutation.isPending 
                        ? (isArchived ? 'Desarquivando...' : 'Arquivando...') 
                        : (isArchived ? 'Desarquivar' : 'Arquivar')}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
