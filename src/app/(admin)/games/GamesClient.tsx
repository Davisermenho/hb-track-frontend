'use client';

/**
 * GamesClient - Componente cliente principal da rota /games
 * 
 * Responsável por:
 * - Verificar se há equipe ativa (via useActiveTeam)
 * - Exibir TeamSelectModal se não houver equipe
 * - Renderizar Dashboard ou Detalhe baseado em query params
 * - Gerenciar navegação entre estados
 */

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useGamesContext, GameTab } from '@/context/GamesContext';
import TeamSelectModal from '@/components/teams-v2/TeamSelectModal';
import GamesHeader from '@/components/games/GamesHeader';
import GamesDashboard from '@/components/games/GamesDashboard';
import GameDetail from '@/components/games/GameDetail';
import AppSkeleton from '@/components/ui/AppSkeleton';

export default function GamesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const { 
    teams,
    selectedTeam,
    setSelectedTeam,
    teamsLoading,
    setSelectedGameId, 
    setActiveTab, 
    setIsCreateModalOpen,
    selectedGameId,
    activeTab
  } = useGamesContext();
  
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Query params
  const gameIdParam = searchParams.get('gameId');
  const tabParam = searchParams.get('tab') as GameTab | null;
  const isNewParam = searchParams.get('isNew') === 'true';

  // Sincroniza URL params com contexto
  useEffect(() => {
    if (gameIdParam) {
      setSelectedGameId(gameIdParam);
    } else {
      setSelectedGameId(null);
    }

    if (tabParam && ['overview', 'lineup', 'events', 'stats', 'report'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (gameIdParam) {
      setActiveTab('overview');
    }

    if (isNewParam) {
      setIsCreateModalOpen(true);
    }

    setIsInitialized(true);
  }, [gameIdParam, tabParam, isNewParam, setSelectedGameId, setActiveTab, setIsCreateModalOpen]);

  // Verifica se precisa mostrar modal de seleção de equipe
  useEffect(() => {
    if (!teamsLoading && !selectedTeam) {
      setShowTeamModal(true);
    } else {
      setShowTeamModal(false);
    }
  }, [selectedTeam, teamsLoading]);

  // Navegação para dashboard
  const navigateToDashboard = useCallback(() => {
    router.push(pathname);
    setSelectedGameId(null);
  }, [router, pathname, setSelectedGameId]);

  // Navegação para detalhe do jogo
  const navigateToGame = useCallback((gameId: string, tab?: GameTab) => {
    const params = new URLSearchParams();
    params.set('gameId', gameId);
    if (tab) params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  // Navegação para criar novo jogo
  const navigateToCreate = useCallback(() => {
    const params = new URLSearchParams();
    params.set('isNew', 'true');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  // Mudança de tab
  const handleTabChange = useCallback((tab: GameTab) => {
    if (selectedGameId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [selectedGameId, searchParams, router, pathname]);

  // Loading state
  if (teamsLoading || !isInitialized) {
    return (
      <div className="flex h-full flex-col gap-6 p-6">
        <AppSkeleton variant="header" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AppSkeleton variant="card" />
          <AppSkeleton variant="card" />
          <AppSkeleton variant="card" />
        </div>
      </div>
    );
  }

  // Modal de seleção de equipe
  if (showTeamModal) {
    return (
      <TeamSelectModal
        isOpen={true}
        teams={teams}
        isLoading={teamsLoading}
        onSelect={(team) => {
          setSelectedTeam(team);
          setShowTeamModal(false);
        }}
        onClose={() => {
          // Se não selecionou equipe, redireciona
          if (!selectedTeam) {
            router.push('/teams');
          }
          setShowTeamModal(false);
        }}
      />
    );
  }

  // Determina se está no detalhe ou dashboard
  const isDetailView = !!selectedGameId;

  return (
    <div className="flex h-full flex-col">
      <GamesHeader 
        isDetailView={isDetailView}
        onBackToDashboard={navigateToDashboard}
        onCreateGame={navigateToCreate}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="flex-1 overflow-auto p-6">
        {isDetailView ? (
          <GameDetail 
            gameId={selectedGameId}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        ) : (
          <GamesDashboard 
            onSelectGame={navigateToGame}
            onCreateGame={navigateToCreate}
          />
        )}
      </div>
    </div>
  );
}
