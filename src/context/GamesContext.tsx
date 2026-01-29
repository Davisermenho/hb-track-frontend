/**
 * GamesContext - Contexto global para módulo de jogos
 * 
 * Gerencia:
 * - Equipe selecionada
 * - Estado global do módulo de jogos
 * - Filtros e navegação
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { useTeams } from '@/hooks/useTeams';
import { type Team } from '@/lib/api/teams';

// Tipos do módulo de jogos
export interface Match {
  id: string;
  team_id: string;
  opponent_id: string;
  opponent_name?: string;
  home_team_name?: string;
  away_team_name?: string;
  competition_id?: string;
  competition_name?: string;
  competition?: string;
  match_date?: string;
  date?: string;
  start_time?: string;
  location?: string;
  venue?: string;
  is_home?: boolean;
  home_score?: number;
  away_score?: number;
  score_home?: number;
  score_away?: number;
  status: 'Agendado' | 'Finalizado' | 'Cancelado';
  phase?: 'group' | 'semifinal' | 'final' | 'friendly';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MatchParticipant {
  id: string;
  match_id: string;
  athlete_id: string;
  athlete_name?: string;
  is_starting: boolean;
  position?: string;
  jersey_number?: number;
  notes?: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  athlete_id?: string;
  player_id?: string;
  player_name?: string;
  athlete_name?: string;
  minute?: number;
  event_type?: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'timeout' | 'other';
  type?: 'Gol' | 'Cartão Amarelo' | 'Cartão Vermelho' | 'Substituição' | 'Outro';
  description?: string;
}

export type GameTab = 'overview' | 'lineup' | 'events' | 'stats' | 'report';

export type GameViewMode = 'cards' | 'table';

export interface GameFilters {
  status?: 'Agendado' | 'Finalizado' | 'Cancelado';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: 'home' | 'away';
  competition?: string;
}

interface GamesContextType {
  // Equipes
  teams: Team[];
  teamsLoading: boolean;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  
  // Jogo selecionado
  selectedGameId: string | null;
  setSelectedGameId: (id: string | null) => void;
  selectedMatch: Match | null;
  setSelectedMatch: (match: Match | null) => void;
  
  // Tab ativa
  activeTab: GameTab;
  setActiveTab: (tab: GameTab) => void;
  
  // Filtros
  filters: GameFilters;
  setFilters: (filters: GameFilters) => void;
  clearFilters: () => void;
  
  // Modal de criação
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  
  // Modo de visualização
  viewMode: GameViewMode;
  setViewMode: (mode: GameViewMode) => void;
}

const defaultFilters: GameFilters = {};

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: ReactNode }) {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('hb_games_selected_team');
  });
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<GameTab>('overview');
  const [filters, setFiltersState] = useState<GameFilters>(defaultFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<GameViewMode>('cards');

  const selectedTeam = useMemo(() => {
    if (!teams.length) return null;
    const team = teams.find(t => t.id === selectedTeamId);
    return team || teams[0] || null;
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedTeam?.id) {
        localStorage.setItem('hb_games_selected_team', selectedTeam.id);
      } else {
        localStorage.removeItem('hb_games_selected_team');
      }
    }
  }, [selectedTeam?.id]);

  const setSelectedTeam = useCallback((team: Team | null) => {
    setSelectedTeamId(team?.id ?? null);
    // Limpar seleção de jogo ao trocar equipe
    setSelectedGameId(null);
    setActiveTab('overview');
  }, []);

  const setFilters = useCallback((newFilters: GameFilters) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  return (
    <GamesContext.Provider 
      value={{
        teams,
        teamsLoading,
        selectedTeam,
        setSelectedTeam,
        selectedGameId,
        setSelectedGameId,
        selectedMatch,
        setSelectedMatch,
        activeTab,
        setActiveTab,
        filters,
        setFilters,
        clearFilters,
        isCreateModalOpen,
        setIsCreateModalOpen,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export function useGamesContext() {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error('useGamesContext must be used within a GamesProvider');
  }
  return context;
}

// Hook helper para seleção de equipe
export function useGameTeamSelection() {
  const { teams, teamsLoading, selectedTeam, setSelectedTeam } = useGamesContext();
  return { teams, teamsLoading, selectedTeam, setSelectedTeam };
}

// Hook helper para navegação de jogo
export function useGameNavigation() {
  const { selectedGameId, setSelectedGameId, activeTab, setActiveTab } = useGamesContext();
  return { selectedGameId, setSelectedGameId, activeTab, setActiveTab };
}
