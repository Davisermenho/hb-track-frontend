'use client';

/**
 * useDynamicSidebarItems - Hook para gerar subitens dinâmicos na sidebar
 * 
 * Gera subitens baseados em dados reais:
 * - Lista de equipes do usuário
 * - Competições ativas
 * - Fases da competição
 * - Próximos jogos
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTeamSeasonOptional } from '@/context/TeamSeasonContext';
import {
  Users,
  Trophy,
  Gamepad2,
  Calendar,
  Target,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export interface DynamicSubitem {
  id: string;
  name: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  tooltip?: string;
}

export interface DynamicSection {
  id: string;
  items: DynamicSubitem[];
  isLoading: boolean;
}

interface UseDynamicSidebarItemsReturn {
  // Subitens por seção
  teamsSubitems: DynamicSection;
  competitionsSubitems: DynamicSection;
  gamesSubitems: DynamicSection;
  
  // Helper para obter subitens de qualquer seção
  getSubitems: (sectionId: string) => DynamicSubitem[];
}

// =============================================================================
// FUNÇÕES DE FETCH (MOCKS - substituir por API real)
// =============================================================================

interface TeamData {
  id: string;
  name: string;
  athletes_count: number;
}

interface CompetitionData {
  id: string;
  name: string;
  phase?: string;
  is_active: boolean;
}

interface UpcomingGame {
  id: string;
  opponent: string;
  date: string;
  competition_name?: string;
}

async function fetchUserTeams(): Promise<TeamData[]> {
  // TODO: Substituir por chamada real à API
  await new Promise(r => setTimeout(r, 150));
  return [
    { id: '1', name: 'Sub-15 Masculino', athletes_count: 18 },
    { id: '2', name: 'Sub-17 Masculino', athletes_count: 22 },
    { id: '3', name: 'Sub-20 Feminino', athletes_count: 16 },
  ];
}

async function fetchActiveCompetitions(teamId?: string): Promise<CompetitionData[]> {
  // TODO: Substituir por chamada real à API
  await new Promise(r => setTimeout(r, 150));
  return [
    { id: 'c1', name: 'Campeonato Estadual', phase: 'Quartas de Final', is_active: true },
    { id: 'c2', name: 'Copa Regional', phase: 'Grupos', is_active: true },
  ];
}

async function fetchUpcomingGames(teamId?: string): Promise<UpcomingGame[]> {
  // TODO: Substituir por chamada real à API
  await new Promise(r => setTimeout(r, 150));
  
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return [
    { 
      id: 'g1', 
      opponent: 'EC Vitória', 
      date: new Date(today.setDate(today.getDate() + 2)).toISOString(),
      competition_name: 'Campeonato Estadual'
    },
    { 
      id: 'g2', 
      opponent: 'Sport Club', 
      date: nextWeek.toISOString(),
      competition_name: 'Copa Regional'
    },
  ];
}

// =============================================================================
// HOOK
// =============================================================================

export function useDynamicSidebarItems(): UseDynamicSidebarItemsReturn {
  const context = useTeamSeasonOptional();
  const teamId = context?.selectedTeam?.id;

  // Buscar equipes do usuário
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['sidebar-dynamic', 'teams'],
    queryFn: fetchUserTeams,
    staleTime: 5 * 60 * 1000,
  });

  // Buscar competições ativas
  const { data: competitions, isLoading: competitionsLoading } = useQuery({
    queryKey: ['sidebar-dynamic', 'competitions', teamId],
    queryFn: () => fetchActiveCompetitions(teamId),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  // Buscar próximos jogos
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['sidebar-dynamic', 'games', teamId],
    queryFn: () => fetchUpcomingGames(teamId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
  });

  // Converter equipes em subitens
  const teamsSubitems: DynamicSection = useMemo(() => ({
    id: 'teams',
    isLoading: teamsLoading,
    items: (teams || []).map(team => ({
      id: team.id,
      name: team.name,
      href: `/teams/${team.id}`,
      icon: Users,
      badge: team.athletes_count,
      tooltip: `${team.athletes_count} atletas`,
    })),
  }), [teams, teamsLoading]);

  // Converter competições em subitens
  const competitionsSubitems: DynamicSection = useMemo(() => ({
    id: 'competitions',
    isLoading: competitionsLoading,
    items: (competitions || []).filter(c => c.is_active).map(comp => ({
      id: comp.id,
      name: comp.name,
      href: `/eventos/competicoes/${comp.id}`,
      icon: Trophy,
      badge: comp.phase,
      tooltip: comp.phase ? `Fase: ${comp.phase}` : undefined,
    })),
  }), [competitions, competitionsLoading]);

  // Converter próximos jogos em subitens
  const gamesSubitems: DynamicSection = useMemo(() => ({
    id: 'games',
    isLoading: gamesLoading,
    items: (games || []).slice(0, 3).map(game => {
      const gameDate = new Date(game.date);
      const dayName = gameDate.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayNum = gameDate.getDate();
      
      return {
        id: game.id,
        name: `vs ${game.opponent}`,
        href: `/games/${game.id}`,
        icon: Gamepad2,
        badge: `${dayName} ${dayNum}`,
        tooltip: game.competition_name,
      };
    }),
  }), [games, gamesLoading]);

  // Helper para obter subitens por ID
  const getSubitems = (sectionId: string): DynamicSubitem[] => {
    switch (sectionId) {
      case 'teams':
        return teamsSubitems.items;
      case 'competitions':
        return competitionsSubitems.items;
      case 'games':
        return gamesSubitems.items;
      default:
        return [];
    }
  };

  return {
    teamsSubitems,
    competitionsSubitems,
    gamesSubitems,
    getSubitems,
  };
}

export default useDynamicSidebarItems;
