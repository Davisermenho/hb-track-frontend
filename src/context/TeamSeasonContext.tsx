'use client';

/**
 * TeamSeasonContext - Contexto global de Equipe e Temporada
 * 
 * Gerencia:
 * - Equipe ativa selecionada
 * - Temporada ativa
 * - Persistência em localStorage
 * - Atualização dinâmica em toda a aplicação
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { teamsService } from '@/lib/api/teams';

// =============================================================================
// TIPOS
// =============================================================================

export interface Team {
  id: string;
  name: string;
  logo_url?: string | null;
  category?: string;
  gender?: 'masculino' | 'feminino' | 'misto';
}

export interface Season {
  id: string;
  year: number;
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

interface TeamSeasonContextType {
  // Estado
  selectedTeam: Team | null;
  selectedSeason: Season | null;
  teams: Team[];
  seasons: Season[];
  isLoading: boolean;
  
  // Ações
  selectTeam: (teamId: string) => void;
  selectSeason: (seasonId: string) => void;
  
  // Helpers
  currentSeasonYear: number;
  hasTeams: boolean;
  hasSeasons: boolean;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const STORAGE_KEYS = {
  TEAM: 'hbtrack-selected-team-id',
  SEASON: 'hbtrack-selected-season-id',
};

// =============================================================================
// CONTEXT
// =============================================================================

const TeamSeasonContext = createContext<TeamSeasonContextType | null>(null);

export function useTeamSeason() {
  const context = useContext(TeamSeasonContext);
  if (!context) {
    throw new Error('useTeamSeason must be used within TeamSeasonProvider');
  }
  return context;
}

// Hook opcional que não lança erro se usado fora do provider
export function useTeamSeasonOptional() {
  return useContext(TeamSeasonContext);
}

// =============================================================================
// PROVIDER
// =============================================================================

interface TeamSeasonProviderProps {
  children: React.ReactNode;
}

// Busca real de equipes via API
async function fetchTeams(): Promise<Team[]> {
  const response = await teamsService.list({ page: 1, limit: 100 });
  return response.items.map(team => ({
    id: team.id,
    name: team.name,
    logo_url: null,
    category: team.category_id?.toString(),
    gender: team.gender as 'masculino' | 'feminino' | 'misto'
  }));
}

// Mock de busca de temporadas - substituir por API real
async function fetchSeasons(): Promise<Season[]> {
  // TODO: Substituir por chamada real à API
  // return api.get('/seasons').then(res => res.data);
  
  const currentYear = new Date().getFullYear();
  return [
    { id: '2026', year: 2026, name: 'Temporada 2026', is_active: true },
    { id: '2025', year: 2025, name: 'Temporada 2025', is_active: false },
    { id: '2024', year: 2024, name: 'Temporada 2024', is_active: false },
  ];
}

export function TeamSeasonProvider({ children }: TeamSeasonProviderProps) {
  const queryClient = useQueryClient();
  
  // Estado local para IDs selecionados
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.TEAM);
    }
    return null;
  });
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.SEASON);
    }
    return null;
  });

  // Buscar equipes
  const { 
    data: teams = [], 
    isLoading: teamsLoading 
  } = useQuery<Team[]>({
    queryKey: ['teams-context'],
    queryFn: fetchTeams,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar temporadas
  const { 
    data: seasons = [], 
    isLoading: seasonsLoading 
  } = useQuery<Season[]>({
    queryKey: ['seasons-context'],
    queryFn: fetchSeasons,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Derivar equipe selecionada
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId || teams.length === 0) {
      // Se não há seleção, usar a primeira equipe
      return teams[0] || null;
    }
    return teams.find(t => t.id === selectedTeamId) || teams[0] || null;
  }, [selectedTeamId, teams]);

  // Derivar temporada selecionada
  const selectedSeason = useMemo(() => {
    if (!selectedSeasonId || seasons.length === 0) {
      // Se não há seleção, usar a temporada ativa ou a primeira
      const activeSeason = seasons.find(s => s.is_active);
      return activeSeason || seasons[0] || null;
    }
    return seasons.find(s => s.id === selectedSeasonId) || seasons[0] || null;
  }, [selectedSeasonId, seasons]);

  // Selecionar equipe
  const selectTeam = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TEAM, teamId);
    }
    
    // Invalidar queries que dependem da equipe
    queryClient.invalidateQueries({ queryKey: ['games'] });
    queryClient.invalidateQueries({ queryKey: ['training'] });
    queryClient.invalidateQueries({ queryKey: ['athletes'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
  }, [queryClient]);

  // Selecionar temporada
  const selectSeason = useCallback((seasonId: string) => {
    setSelectedSeasonId(seasonId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SEASON, seasonId);
    }
    
    // Invalidar queries que dependem da temporada
    queryClient.invalidateQueries({ queryKey: ['games'] });
    queryClient.invalidateQueries({ queryKey: ['training'] });
    queryClient.invalidateQueries({ queryKey: ['competitions'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
  }, [queryClient]);

  // Auto-selecionar primeira equipe se não houver seleção
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      const firstTeam = teams[0];
      setSelectedTeamId(firstTeam.id);
      localStorage.setItem(STORAGE_KEYS.TEAM, firstTeam.id);
    }
  }, [teams, selectedTeamId]);

  // Auto-selecionar temporada ativa se não houver seleção
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      const activeSeason = seasons.find(s => s.is_active) || seasons[0];
      setSelectedSeasonId(activeSeason.id);
      localStorage.setItem(STORAGE_KEYS.SEASON, activeSeason.id);
    }
  }, [seasons, selectedSeasonId]);

  const value: TeamSeasonContextType = useMemo(() => ({
    selectedTeam,
    selectedSeason,
    teams,
    seasons,
    isLoading: teamsLoading || seasonsLoading,
    selectTeam,
    selectSeason,
    currentSeasonYear: selectedSeason?.year || new Date().getFullYear(),
    hasTeams: teams.length > 0,
    hasSeasons: seasons.length > 0,
  }), [
    selectedTeam,
    selectedSeason,
    teams,
    seasons,
    teamsLoading,
    seasonsLoading,
    selectTeam,
    selectSeason,
  ]);

  return (
    <TeamSeasonContext.Provider value={value}>
      {children}
    </TeamSeasonContext.Provider>
  );
}

export default TeamSeasonContext;
