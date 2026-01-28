'use client';

/**
 * useRouteVisibility - Hook para ocultação inteligente de rotas sem dados
 * 
 * Verifica se há dados disponíveis antes de exibir itens na sidebar.
 * Integra com o contexto de equipe/temporada para filtrar corretamente.
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTeamSeasonOptional } from '@/context/TeamSeasonContext';

// =============================================================================
// TIPOS
// =============================================================================

interface RouteVisibility {
  /** Se a rota deve ser exibida na sidebar */
  visible: boolean;
  /** Quantidade de itens/dados disponíveis */
  count: number;
  /** Se está carregando os dados */
  isLoading: boolean;
  /** Mensagem de fallback quando não há dados */
  fallbackMessage?: string;
}

interface UseRouteVisibilityReturn {
  // Rotas principais
  games: RouteVisibility;
  competitions: RouteVisibility;
  training: RouteVisibility;
  athletes: RouteVisibility;
  statistics: RouteVisibility;
  
  // Helpers
  isAnyLoading: boolean;
  shouldShowSection: (section: 'planejamento' | 'desempenho' | 'organizacao') => boolean;
}

// =============================================================================
// FUNÇÕES DE VERIFICAÇÃO (MOCKS - substituir por API real)
// =============================================================================

async function checkGamesData(teamId?: string, seasonId?: string): Promise<{ count: number }> {
  // TODO: Substituir por chamada real à API
  // return api.get(`/games/count?team_id=${teamId}&season_id=${seasonId}`);
  
  // Mock - simular que há jogos
  await new Promise(r => setTimeout(r, 100));
  return { count: Math.floor(Math.random() * 10) + 1 };
}

async function checkCompetitionsData(teamId?: string, seasonId?: string): Promise<{ count: number }> {
  // TODO: Substituir por chamada real à API
  await new Promise(r => setTimeout(r, 100));
  return { count: Math.floor(Math.random() * 5) };
}

async function checkTrainingData(teamId?: string, seasonId?: string): Promise<{ count: number }> {
  // TODO: Substituir por chamada real à API
  await new Promise(r => setTimeout(r, 100));
  return { count: Math.floor(Math.random() * 20) + 5 };
}

async function checkAthletesData(teamId?: string): Promise<{ count: number }> {
  // TODO: Substituir por chamada real à API
  await new Promise(r => setTimeout(r, 100));
  return { count: Math.floor(Math.random() * 25) + 10 };
}

async function checkStatisticsData(teamId?: string, seasonId?: string): Promise<{ count: number }> {
  // TODO: Substituir por chamada real à API
  await new Promise(r => setTimeout(r, 100));
  // Estatísticas só aparecem se há jogos ou treinos
  const hasData = Math.random() > 0.3;
  return { count: hasData ? 1 : 0 };
}

// =============================================================================
// HOOK
// =============================================================================

export function useRouteVisibility(): UseRouteVisibilityReturn {
  const context = useTeamSeasonOptional();
  const teamId = context?.selectedTeam?.id;
  const seasonId = context?.selectedSeason?.id;

  // Verificar jogos
  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['route-visibility', 'games', teamId, seasonId],
    queryFn: () => checkGamesData(teamId, seasonId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Verificar competições
  const { data: competitionsData, isLoading: competitionsLoading } = useQuery({
    queryKey: ['route-visibility', 'competitions', teamId, seasonId],
    queryFn: () => checkCompetitionsData(teamId, seasonId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
  });

  // Verificar treinos
  const { data: trainingData, isLoading: trainingLoading } = useQuery({
    queryKey: ['route-visibility', 'training', teamId, seasonId],
    queryFn: () => checkTrainingData(teamId, seasonId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
  });

  // Verificar atletas
  const { data: athletesData, isLoading: athletesLoading } = useQuery({
    queryKey: ['route-visibility', 'athletes', teamId],
    queryFn: () => checkAthletesData(teamId),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  // Verificar estatísticas
  const { data: statisticsData, isLoading: statisticsLoading } = useQuery({
    queryKey: ['route-visibility', 'statistics', teamId, seasonId],
    queryFn: () => checkStatisticsData(teamId, seasonId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
  });

  // Construir objeto de visibilidade
  const games: RouteVisibility = useMemo(() => ({
    visible: (gamesData?.count || 0) > 0 || gamesLoading,
    count: gamesData?.count || 0,
    isLoading: gamesLoading,
    fallbackMessage: 'Nenhum jogo cadastrado para esta temporada',
  }), [gamesData, gamesLoading]);

  const competitions: RouteVisibility = useMemo(() => ({
    visible: (competitionsData?.count || 0) > 0 || competitionsLoading,
    count: competitionsData?.count || 0,
    isLoading: competitionsLoading,
    fallbackMessage: 'Nenhuma competição cadastrada',
  }), [competitionsData, competitionsLoading]);

  const training: RouteVisibility = useMemo(() => ({
    // Treinos sempre visíveis para permitir criar novos
    visible: true,
    count: trainingData?.count || 0,
    isLoading: trainingLoading,
  }), [trainingData, trainingLoading]);

  const athletes: RouteVisibility = useMemo(() => ({
    // Atletas sempre visíveis para permitir cadastro
    visible: true,
    count: athletesData?.count || 0,
    isLoading: athletesLoading,
  }), [athletesData, athletesLoading]);

  const statistics: RouteVisibility = useMemo(() => ({
    // Estatísticas só se houver dados
    visible: (statisticsData?.count || 0) > 0 || statisticsLoading,
    count: statisticsData?.count || 0,
    isLoading: statisticsLoading,
    fallbackMessage: 'Sem dados suficientes para estatísticas',
  }), [statisticsData, statisticsLoading]);

  // Verificar se deve mostrar uma seção inteira
  const shouldShowSection = (section: 'planejamento' | 'desempenho' | 'organizacao'): boolean => {
    switch (section) {
      case 'planejamento':
        return training.visible || games.visible || competitions.visible;
      case 'desempenho':
        return athletes.visible || statistics.visible;
      case 'organizacao':
        return true; // Sempre mostrar organização
      default:
        return true;
    }
  };

  const isAnyLoading = gamesLoading || competitionsLoading || trainingLoading || 
                       athletesLoading || statisticsLoading;

  return {
    games,
    competitions,
    training,
    athletes,
    statistics,
    isAnyLoading,
    shouldShowSection,
  };
}

export default useRouteVisibility;
