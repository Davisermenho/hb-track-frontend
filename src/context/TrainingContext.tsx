/**
 * TrainingContext - Contexto global para módulo de treinos
 * 
 * Gerencia:
 * - Equipe selecionada
 * - Estado global do módulo de treinos
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useTeams } from '@/hooks/useTeams';
import { type Team } from '@/lib/api/teams';

interface TrainingContextType {
  // Equipes
  teams: Team[];
  teamsLoading: boolean;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  
  // Filtros de busca
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('hb_training_selected_team');
  });
  const [searchTerm, setSearchTerm] = useState('');
  const selectedTeam = useMemo(() => {
    if (!teams.length) return null;
    const team = teams.find(t => t.id === selectedTeamId);
    return team || null;
  }, [teams, selectedTeamId]);

  // Auto-selecionar primeira equipe quando carrega
  const handleSetSelectedTeam = useCallback((team: Team | null) => {
    setSelectedTeamId(team?.id ?? null);
    // Persiste no localStorage para manter entre reloads
    if (team) {
      localStorage.setItem('hb_training_selected_team', team.id);
    } else {
      localStorage.removeItem('hb_training_selected_team');
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedTeam?.id) {
      localStorage.setItem('hb_training_selected_team', selectedTeam.id);
    }
  }, [selectedTeam?.id]);

  return (
    <TrainingContext.Provider 
      value={{
        teams,
        teamsLoading,
        selectedTeam,
        setSelectedTeam: handleSetSelectedTeam,
        searchTerm,
        setSearchTerm,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTrainingContext() {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTrainingContext must be used within a TrainingProvider');
  }
  return context;
}

// Hook helper para seleção de equipe
export function useTeamSelection() {
  const { teams, teamsLoading, selectedTeam, setSelectedTeam } = useTrainingContext();
  return { teams, teamsLoading, selectedTeam, setSelectedTeam };
}
