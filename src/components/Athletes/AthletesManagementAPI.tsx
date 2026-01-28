"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { athletesService, type Athlete as ApiAthlete, type AthleteState } from "@/lib/api/athletes";
import { teamsService, type Team as ApiTeam } from "@/lib/api/teams";
import { categoriesService, type Category } from "@/lib/api/categories";
import { AdvancedFiltersButton, AdvancedFilters, type AdvancedFiltersType } from "@/components/Athletes";

// Tipo local simplificado para UI
interface Athlete {
  id: string;
  name: string;
  birth_date: string;
  phone?: string;
  email?: string;
  jersey_number?: string;
  category: string;
  sport_status: AthleteState;
  operational_status: string;
  team_id?: string;
  team_name?: string;
  has_history: boolean;
  position?: string;
  positions?: {
    offensive_primary?: string;
    offensive_secondary?: string;
    defensive_primary?: string;
    defensive_secondary?: string;
  };
}

interface Team {
  id: string;
  name: string;
}

interface AthletesFilters {
  team_ids?: string[];
  categories?: string[];
  offensive_positions?: string[];
  defensive_positions?: string[];
  sport_status?: AthleteState[];
  has_team?: boolean;  // V1.2: filtrar por vínculo com equipe
}

// Mapeamento da API para tipo local
const mapApiAthleteToLocal = (apiAthlete: ApiAthlete, teams: Team[]): Athlete => {
  const team = teams.find(t => t.id === apiAthlete.organization_id);

  // Calcular categoria baseada na data de nascimento
  const calculateCategory = (birthDate?: string | null): string => {
    if (!birthDate) return 'Sênior';
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();

    if (age < 14) return 'Sub-14';
    if (age < 16) return 'Sub-16';
    if (age < 18) return 'Sub-18';
    return 'Sênior';
  };

  return {
    id: apiAthlete.id,
    name: apiAthlete.athlete_name || '',
    birth_date: apiAthlete.birth_date || '',
    phone: apiAthlete.athlete_phone || '',
    email: apiAthlete.athlete_email || '',
    category: calculateCategory(apiAthlete.birth_date),
    sport_status: apiAthlete.state,
    operational_status: 'disponível', // Todos atletas ativos são disponíveis
    team_id: '', // TODO: buscar da team_registration
    team_name: team?.name || '',
    has_history: true,
    position: '',
    positions: {
      offensive_primary: '',
      offensive_secondary: '',
      defensive_primary: '',
      defensive_secondary: '',
    },
  };
};

// Constantes
const ITEMS_PER_PAGE = 20;
const OFFENSIVE_POSITIONS = ['Ponta Esquerda', 'Ponta Direita', 'Armador Central', 'Meia Esquerda', 'Meia Direita', 'Pivô'];
const DEFENSIVE_POSITIONS = ['Lateral Esquerda', 'Lateral Direita', 'Central Esquerda', 'Central Direita', 'Goleira', 'Defensor'];
const STATUS_OPTIONS: { value: AthleteState; label: string }[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'dispensada', label: 'Dispensada' },
  { value: 'arquivada', label: 'Arquivada' },
];

export default function AthletesManagement() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<AthletesFilters>({});
  const [advancedFilters, setAdvancedFilters] = useState<Partial<AdvancedFiltersType>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  // Form state para criação/edição
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    birth_date: '',
    position: '',
    team_id: '',
    phone: '',
    email: '',
    offensive_position_primary: '',
    offensive_position_secondary: '',
    defensive_position_primary: '',
    defensive_position_secondary: '',
  });
  
  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset página ao buscar
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Carregar dados iniciais e quando filtro has_team mudar (V1.2)
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[Athletes] Iniciando carregamento de dados...', { has_team: filters.has_team });

        // Cookie HttpOnly enviado automaticamente via credentials: 'include'

        const [athletesResponse, teamsResponse, categoriesResponse] = await Promise.all([
          athletesService.list({ 
            limit: 100,
            has_team: filters.has_team  // V1.2: filtrar por vínculo com equipe
          }),
          teamsService.list({ limit: 100 }),
          categoriesService.list(),
        ]);

        console.log('[Athletes] Dados recebidos:', {
          athletes: athletesResponse.items.length,
          teams: teamsResponse.items.length,
          categories: categoriesResponse.length
        });

        const teamsList = teamsResponse.items.map(t => ({ id: t.id, name: t.name }));
        setTeams(teamsList);
        setCategories(categoriesResponse);

        const mappedAthletes = athletesResponse.items.map(a => mapApiAthleteToLocal(a, teamsList));
        console.log('[Athletes] Atletas mapeados:', mappedAthletes.length);
        console.log('[Athletes] Primeira atleta mapeada:', mappedAthletes[0]);
        console.log('[Athletes] Dados originais da API:', athletesResponse.items[0]);

        setAthletes(mappedAthletes);
      } catch (err: any) {
        console.error('[Athletes] Erro ao carregar dados:', err);
        console.error('[Athletes] Detalhes do erro:', {
          message: err?.message,
          detail: err?.detail,
          status: err?.status,
          statusCode: err?.statusCode
        });
        
        // Tratar erros de autenticação
        if (err?.status === 401 || err?.detail?.includes('autenticação') || err?.detail?.includes('Token')) {
          setError('Sessão expirada. Faça login novamente.');
        } else if (err?.status === 0 || err?.message?.includes('conexão')) {
          setError('Erro de conexão com o servidor. Verifique se o backend está rodando.');
        } else {
          setError(err?.detail || err?.message || 'Erro ao carregar atletas');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [filters.has_team]);  // V1.2: recarregar quando filtro has_team mudar

  // Filtrar atletas
  const filteredAthletes = useMemo(() => {
    console.log('[Athletes] Filtrando atletas:', {
      total: athletes.length,
      filters,
      advancedFilters,
      searchTerm
    });

    const filtered = athletes.filter((athlete) => {
      // Não mostrar atletas dispensadas por padrão
      if (athlete.sport_status === "dispensada" &&
          (!filters.sport_status || !filters.sport_status.includes("dispensada"))) {
        return false;
      }

      // Filtro por busca de nome
      if (searchTerm && !athlete.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por equipe
      if (filters.team_ids && filters.team_ids.length > 0 && athlete.team_id &&
          !filters.team_ids.includes(athlete.team_id)) {
        return false;
      }

      // Filtro por categoria
      if (filters.categories && filters.categories.length > 0 &&
          !filters.categories.includes(athlete.category)) {
        return false;
      }

      // Filtro por posição ofensiva
      if (filters.offensive_positions && filters.offensive_positions.length > 0) {
        const hasOffensiveMatch = filters.offensive_positions.some(pos =>
          athlete.positions?.offensive_primary === pos ||
          athlete.positions?.offensive_secondary === pos
        );
        if (!hasOffensiveMatch) {
          return false;
        }
      }

      // Filtro por posição defensiva
      if (filters.defensive_positions && filters.defensive_positions.length > 0) {
        const hasDefensiveMatch = filters.defensive_positions.some(pos =>
          athlete.positions?.defensive_primary === pos ||
          athlete.positions?.defensive_secondary === pos
        );
        if (!hasDefensiveMatch) {
          return false;
        }
      }

      // Filtro por status esportivo
      if (filters.sport_status && filters.sport_status.length > 0 &&
          !filters.sport_status.includes(athlete.sport_status)) {
        return false;
      }

      // ==========================================
      // FILTROS AVANÇADOS (FASE 5.1)
      // ==========================================
      
      // Filtro por idade
      if (advancedFilters.ageMin || advancedFilters.ageMax) {
        if (athlete.birth_date) {
          const birthDate = new Date(athlete.birth_date);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          
          if (advancedFilters.ageMin && age < advancedFilters.ageMin) {
            return false;
          }
          if (advancedFilters.ageMax && age > advancedFilters.ageMax) {
            return false;
          }
        }
      }
      
      // Filtro por dominância (lateralidade)
      if (advancedFilters.dominance && advancedFilters.dominance.length > 0) {
        // TODO: Quando o campo dominance estiver disponível no model
        // if (!advancedFilters.dominance.includes(athlete.dominance)) {
        //   return false;
        // }
      }
      
      // Filtro por estados (R12)
      if (advancedFilters.states && advancedFilters.states.length > 0) {
        const mappedState = athlete.sport_status;
        if (!advancedFilters.states.includes(mappedState as 'ativa' | 'dispensada' | 'arquivada')) {
          return false;
        }
      }
      
      // Filtro por elegibilidade (apenas atletas aptas para jogo)
      if (advancedFilters.eligibleOnly) {
        // Só mostrar atletas que podem jogar hoje
        if (athlete.sport_status !== 'ativa') {
          return false;
        }
      }

      return true;
    });

    console.log('[Athletes] Resultado da filtragem:', {
      total: filtered.length,
      atletas: filtered.map(a => ({ id: a.id, name: a.name, sport_status: a.sport_status }))
    });
    return filtered;
  }, [athletes, filters, advancedFilters, searchTerm]);

  // Paginação - atletas da página atual
  const paginatedAthletes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAthletes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAthletes, currentPage]);

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredAthletes.length / ITEMS_PER_PAGE);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleViewDetails = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setViewModalOpen(true);
  };

  const handleEdit = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setFormData({
      full_name: athlete.name,
      nickname: '',
      birth_date: athlete.birth_date,
      position: athlete.position || '',
      phone: athlete.phone || '',
      email: athlete.email || '',
      team_id: athlete.team_id || '',
      offensive_position_primary: athlete.positions?.offensive_primary || '',
      offensive_position_secondary: athlete.positions?.offensive_secondary || '',
      defensive_position_primary: athlete.positions?.defensive_primary || '',
      defensive_position_secondary: athlete.positions?.defensive_secondary || '',
    });
    setEditModalOpen(true);
  };

  const handleArchive = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setArchiveModalOpen(true);
  };

  const handleDelete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setDeleteModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      full_name: '',
      nickname: '',
      birth_date: '',
      position: '',
      phone: '',
      email: '',
      team_id: teams[0]?.id || '',
      offensive_position_primary: '',
      offensive_position_secondary: '',
      defensive_position_primary: '',
      defensive_position_secondary: '',
    });
    setCreateModalOpen(true);
  };

  const confirmCreate = async () => {
    if (!formData.full_name) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' });
      return;
    }

    try {
      // TODO: Adicionar campos obrigatórios ao formulário
      // Por enquanto usamos valores placeholder para campos obrigatórios
      const newAthlete = await athletesService.create({
        athlete_name: formData.full_name,
        birth_date: formData.birth_date || new Date().toISOString().split('T')[0],
        main_defensive_position_id: 1, // TODO: Campo obrigatório - adicionar ao form
        athlete_rg: '000000000', // TODO: Campo obrigatório - adicionar ao form
        athlete_cpf: '00000000000', // TODO: Campo obrigatório - adicionar ao form
        athlete_phone: formData.phone || '(00) 00000-0000', // TODO: Campo obrigatório
        athlete_nickname: formData.nickname || undefined,
        athlete_email: formData.email || undefined,
        team_id: formData.team_id || undefined,
      });

      setAthletes(prev => [...prev, mapApiAthleteToLocal(newAthlete, teams)]);
      setMessage({ type: 'success', text: 'Atleta cadastrada com sucesso!' });
      setCreateModalOpen(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Erro ao cadastrar atleta' });
    }
  };

  const confirmEdit = async () => {
    if (!selectedAthlete) return;

    try {
      const updated = await athletesService.update(selectedAthlete.id, {
        athlete_name: formData.full_name || undefined,
        athlete_nickname: formData.nickname || undefined,
        athlete_phone: formData.phone || undefined,
        athlete_email: formData.email || undefined,
      });

      setAthletes(prev => prev.map(a => 
        a.id === updated.id ? mapApiAthleteToLocal(updated, teams) : a
      ));
      setMessage({ type: 'success', text: 'Atleta atualizada com sucesso!' });
      setEditModalOpen(false);
      setSelectedAthlete(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Erro ao atualizar atleta' });
    }
  };

  const confirmArchive = async () => {
    if (!selectedAthlete) return;

    try {
      await athletesService.changeState(selectedAthlete.id, 'dispensada');
      setAthletes(prev => prev.map(a =>
        a.id === selectedAthlete.id ? { ...a, sport_status: 'dispensada' as AthleteState } : a
      ));
      setMessage({ type: 'success', text: 'Atleta dispensada com sucesso!' });
      setArchiveModalOpen(false);
      setSelectedAthlete(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Erro ao dispensar atleta' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedAthlete) return;

    try {
      await athletesService.delete(selectedAthlete.id, 'Exclusão manual');
      setAthletes(prev => prev.filter(a => a.id !== selectedAthlete.id));
      setMessage({ type: 'success', text: 'Atleta excluída com sucesso!' });
      setDeleteModalOpen(false);
      setSelectedAthlete(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Erro ao excluir atleta' });
    }
  };

  const getStatusBadge = (status: AthleteState) => {
    const styles: Record<AthleteState, string> = {
      ativa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      dispensada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      arquivada: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando atletas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mensagem */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Bloco de Lista de Atletas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Cabeçalho com busca e botão de adicionar */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Buscar atleta por nome..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Buscar
            </button>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
          
          {/* Botão Filtros Avançados (FASE 5.1) */}
          <AdvancedFiltersButton
            filterCount={
              (advancedFilters.ageMin || advancedFilters.ageMax ? 1 : 0) +
              (advancedFilters.heightMin || advancedFilters.heightMax ? 1 : 0) +
              (advancedFilters.weightMin || advancedFilters.weightMax ? 1 : 0) +
              (advancedFilters.dominance?.length || 0) +
              (advancedFilters.states?.length || 0) +
              (advancedFilters.eligibleOnly ? 1 : 0)
            }
            hasActiveFilters={
              !!(advancedFilters.ageMin || advancedFilters.ageMax || 
                 advancedFilters.heightMin || advancedFilters.heightMax ||
                 advancedFilters.dominance?.length ||
                 advancedFilters.states?.length ||
                 advancedFilters.eligibleOnly)
            }
            onClick={() => setShowAdvancedFilters(true)}
          />
          
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchInput('');
              setFilters({});
              setAdvancedFilters({});
              window.location.reload();
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="/admin/cadastro"
              className="flex items-center gap-2 px-4 py-2 text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Cadastro
            </a>
          </div>
        </div>

        {/* Chips de Filtro Rápido (FASE 2) */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Filtros rápidos:</span>
          
          {/* Chip: Todas */}
          <button
            onClick={() => setFilters({})}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              !filters.sport_status && filters.has_team === undefined
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas ({athletes.length})
          </button>
          
          {/* Chip: Ativas */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, sport_status: ['ativa'], has_team: undefined }))}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.sport_status?.includes('ativa')
                ? 'bg-green-500 text-white'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
            }`}
          >
            ✅ Ativas ({athletes.filter(a => a.sport_status === 'ativa').length})
          </button>
          
          {/* Chip: Em Captação (sem equipe) */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, has_team: false, sport_status: undefined }))}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.has_team === false
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
            }`}
          >
            🎯 Captação
          </button>
          
          {/* Chip: Arquivadas */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, sport_status: ['arquivada'], has_team: undefined }))}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.sport_status?.includes('arquivada')
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Arquivadas ({athletes.filter(a => a.sport_status === 'arquivada').length})
          </button>
          
          {/* Chip: Dispensadas */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, sport_status: ['dispensada'], has_team: undefined }))}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.sport_status?.includes('dispensada')
                ? 'bg-red-500 text-white'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            }`}
          >
            🚫 Dispensadas ({athletes.filter(a => a.sport_status === 'dispensada').length})
          </button>
        </div>

        {/* Painel de Filtros - aparece quando showFilters=true */}
        {showFilters && (
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* 1. Filtro por Equipes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Equipes
                </label>
                <select
                  value={filters.team_ids?.[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters(prev => ({
                      ...prev,
                      team_ids: value ? [value] : undefined
                    }));
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Filtro por Categorias */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categorias
                </label>
                <select
                  value={filters.categories?.[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters(prev => ({
                      ...prev,
                      categories: value ? [value] : undefined
                    }));
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Filtro por Posições Ofensivas */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pos. Ofensiva
                </label>
                <select
                  value={filters.offensive_positions?.[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters(prev => ({
                      ...prev,
                      offensive_positions: value ? [value] : undefined
                    }));
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  {OFFENSIVE_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* 4. Filtro por Posições Defensivas */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pos. Defensiva
                </label>
                <select
                  value={filters.defensive_positions?.[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters(prev => ({
                      ...prev,
                      defensive_positions: value ? [value] : undefined
                    }));
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  {DEFENSIVE_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* 5. Filtro por Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.sport_status?.[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value as AthleteState | '';
                    setFilters(prev => ({
                      ...prev,
                      sport_status: value ? [value] : undefined
                    }));
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 6. Filtro por Vínculo com Equipe (V1.2 - Opção B) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vínculo
                </label>
                <select
                  value={filters.has_team === undefined ? '' : filters.has_team ? 'true' : 'false'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters(prev => ({
                      ...prev,
                      has_team: value === '' ? undefined : value === 'true'
                    }));
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  <option value="true">Com equipe</option>
                  <option value="false">Sem equipe</option>
                </select>
              </div>
            </div>

            {/* Botão para limpar filtros */}
            {(filters.team_ids || filters.categories || filters.offensive_positions || filters.defensive_positions || filters.sport_status || filters.has_team !== undefined) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setFilters({})}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabela de Atletas */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data Nasc.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedAthletes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma atleta encontrada
                  </td>
                </tr>
              ) : (
                paginatedAthletes.map((athlete) => (
                  <tr 
                    key={athlete.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => router.push(`/admin/athletes/${athlete.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {athlete.name}
                      </div>
                      {athlete.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {athlete.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {athlete.positions?.offensive_primary || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(athlete.sport_status)}`}>
                        {athlete.sport_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/athletes/${athlete.id}`)}
                        className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-brand-500"
                        title="Ver detalhes"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/athletes/${athlete.id}/edit`)}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Editar
                      </button>
                      {athlete.sport_status !== 'dispensada' && (
                        <button
                          onClick={() => handleArchive(athlete)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Dispensar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(athlete)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredAthletes.length)} de {filteredAthletes.length} atletas
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              
              {/* Números de página */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-brand-500 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      {viewModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalhes da Atleta
            </h3>
            <div className="space-y-3">
              <p><strong>Nome:</strong> {selectedAthlete.name}</p>
              <p><strong>Email:</strong> {selectedAthlete.email || '-'}</p>
              <p><strong>Telefone:</strong> {selectedAthlete.phone || '-'}</p>
              <p><strong>Data Nascimento:</strong> {selectedAthlete.birth_date ? new Date(selectedAthlete.birth_date).toLocaleDateString('pt-BR') : '-'}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedAthlete.sport_status)}`}>{selectedAthlete.sport_status}</span></p>
              <p><strong>Posição Ofensiva:</strong> {selectedAthlete.positions?.offensive_primary || '-'}</p>
              <p><strong>Posição Defensiva:</strong> {selectedAthlete.positions?.defensive_primary || '-'}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {createModalOpen ? 'Nova Atleta' : 'Editar Atleta'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {createModalOpen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipe *</label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Selecione uma equipe</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Posição Ofensiva Principal</label>
                  <input
                    type="text"
                    value={formData.offensive_position_primary}
                    onChange={(e) => setFormData({ ...formData, offensive_position_primary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: Pivô"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Posição Defensiva Principal</label>
                  <input
                    type="text"
                    value={formData.defensive_position_primary}
                    onChange={(e) => setFormData({ ...formData, defensive_position_primary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 1ª Defensora"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={createModalOpen ? confirmCreate : confirmEdit}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                {createModalOpen ? 'Cadastrar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Arquivamento */}
      {archiveModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setArchiveModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dispensar Atleta</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja dispensar <strong>{selectedAthlete.name}</strong>?
              A atleta será marcada como dispensada e não aparecerá nas listas ativas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setArchiveModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmArchive}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Dispensar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Deleção */}
      {deleteModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Excluir Atleta</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir <strong>{selectedAthlete.name}</strong>?
              Esta é uma exclusão lógica (soft delete) e os dados serão preservados para histórico.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Filtros Avançados (FASE 5.1) */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        currentFilters={advancedFilters}
        onApply={(newFilters) => {
          setAdvancedFilters(newFilters);
          setShowAdvancedFilters(false);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
