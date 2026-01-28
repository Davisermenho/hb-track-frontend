/**
 * TrainingContext - Contexto global para módulo de treinos
 * 
 * Gerencia:
 * - Equipe selecionada
 * - Estado global do módulo de treinos
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-selecionar primeira equipe quando carrega
  const handleSetSelectedTeam = useCallback((team: Team | null) => {
    setSelectedTeam(team);
    // Persiste no localStorage para manter entre reloads
    if (team) {
      localStorage.setItem('hb_training_selected_team', team.id);
    } else {
      localStorage.removeItem('hb_training_selected_team');
    }
  }, []);

  // Carregar equipe do localStorage quando teams estiver disponível
  useEffect(() => {
    if (typeof window === 'undefined' || teams.length === 0 || selectedTeam) return;

    const savedTeamId = localStorage.getItem('hb_training_selected_team');
    if (savedTeamId) {
      const team = teams.find(t => t.id === savedTeamId);
      if (team) {
        setSelectedTeam(team);
      }
    }
  }, [teams, selectedTeam]);

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
