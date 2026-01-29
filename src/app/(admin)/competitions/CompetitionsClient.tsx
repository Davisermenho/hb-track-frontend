/**
 * CompetitionsClient - Componente cliente principal da rota /competitions
 * 
 * Responsável por:
 * - Sincronizar query params com contexto
 * - Renderizar Dashboard ou Detalhe baseado em competitionId
 * - Gerenciar navegação entre estados
 */

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useCompetitionsContext, CompetitionTab } from '@/context/CompetitionsContext';
import { useCompetition } from '@/hooks/useCompetitions';
import CompetitionsHeader from '@/components/competitions/CompetitionsHeader';
import CompetitionsDashboard from '@/components/competitions/CompetitionsDashboard';
import CompetitionDetail from '@/components/competitions/CompetitionDetail';
import AppSkeleton from '@/components/ui/AppSkeleton';

export default function CompetitionsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const { 
    selectedCompetitionId,
    setSelectedCompetitionId,
    setSelectedCompetition,
    setActiveTab, 
    setIsCreateModalOpen,
    activeTab,
  } = useCompetitionsContext();
  
  // Query params
  const competitionIdParam = searchParams.get('competitionId');
  const tabParam = searchParams.get('tab') as CompetitionTab | null;
  const isNewParam = searchParams.get('isNew') === 'true';

  // Buscar dados da competição quando selecionada
  const { data: competitionData, isLoading: isLoadingCompetition } = useCompetition(
    competitionIdParam
  );

  // Sincroniza URL params com contexto
  useEffect(() => {
    if (competitionIdParam) {
      setSelectedCompetitionId(competitionIdParam);
    } else {
      setSelectedCompetitionId(null);
    }

    if (tabParam && ['phases', 'standings', 'rules'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (competitionIdParam) {
      setActiveTab('phases');
    }

    if (isNewParam) {
      setIsCreateModalOpen(true);
    }

  }, [competitionIdParam, tabParam, isNewParam, setSelectedCompetitionId, setActiveTab, setIsCreateModalOpen]);

  // Atualiza competição no contexto quando carregada
  useEffect(() => {
    if (competitionData) {
      setSelectedCompetition(competitionData);
    }
  }, [competitionData, setSelectedCompetition]);

  // Navegação para dashboard (lista)
  const navigateToDashboard = useCallback(() => {
    router.push(pathname);
    setSelectedCompetitionId(null);
  }, [router, pathname, setSelectedCompetitionId]);

  // Navegação para detalhe da competição
  const navigateToCompetition = useCallback((competitionId: string, tab?: CompetitionTab) => {
    const params = new URLSearchParams();
    params.set('competitionId', competitionId);
    if (tab) params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  // Navegação para criar nova competição
  const navigateToCreate = useCallback(() => {
    const params = new URLSearchParams();
    params.set('isNew', 'true');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  // Mudança de tab
  const handleTabChange = useCallback((tab: CompetitionTab) => {
    if (selectedCompetitionId) {
      const params = new URLSearchParams();
      params.set('competitionId', selectedCompetitionId);
      params.set('tab', tab);
      router.push(`${pathname}?${params.toString()}`);
    }
    setActiveTab(tab);
  }, [router, pathname, selectedCompetitionId, setActiveTab]);

  // Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CompetitionsHeader 
        onBack={selectedCompetitionId ? navigateToDashboard : undefined}
        onCreateClick={navigateToCreate}
      />
      
      {selectedCompetitionId ? (
        isLoadingCompetition ? (
          <div className="p-6">
            <AppSkeleton />
          </div>
        ) : (
          <CompetitionDetail />
        )
      ) : (
        <CompetitionsDashboard 
          onSelectCompetition={navigateToCompetition}
          onCreateClick={navigateToCreate}
        />
      )}
    </div>
  );
}
