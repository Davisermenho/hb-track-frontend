'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationTeamsTree } from '@/components/Athletes/OrganizationTeamsTree';
import { TeamAthletesList } from '@/components/Athletes/TeamAthletesList';
import { AthleteDetailSidebar } from '@/components/Athletes/AthleteDetailSidebar';
import { apiClient } from '@/lib/api/client';

/**
 * Página de Gerenciamento de Atletas - 3 Colunas
 *
 * Layout:
 * - Coluna 1: Tree View (Organização → Equipes → Relação de Atletas)
 * - Coluna 2: Lista de Atletas da equipe selecionada
 * - Coluna 3: Sidebar com ficha completa da atleta (visualização rápida)
 *
 * Melhorias UX:
 * - Persistência de contexto (última equipe selecionada)
 * - Estados vazios orientados à ação
 * - Proteção contra exclusão de atletas críticos
 * - Acessibilidade (teclado, aria-labels)
 *
 * Referências REGRAS.md:
 * - RF1.1: Atleta pode existir sem equipe (sem team_registration)
 * - R32: Atleta sem team_registration não opera mas aparece na lista
 * - R24/R25: Permissões por papel e escopo implícito
 */

const STORAGE_KEY = 'hb_athletes_last_team';

export default function AthletesPage() {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Carregar última equipe selecionada ao montar o componente
  useEffect(() => {
    const savedTeam = localStorage.getItem(STORAGE_KEY);
    if (savedTeam) {
      try {
        const { teamId, teamName } = JSON.parse(savedTeam);
        setSelectedTeamId(teamId);
        setSelectedTeamName(teamName);
      } catch (error) {
        console.error('Erro ao carregar equipe salva:', error);
      }
    }
  }, []);

  const handleTeamSelect = (teamId: string, teamName: string) => {
    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
    setSelectedAthleteId(null); // Limpar seleção de atleta ao trocar de equipe
    setIsSidebarOpen(false); // Fechar sidebar ao trocar de equipe

    // Salvar equipe selecionada no localStorage para persistência
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ teamId, teamName }));
    } catch (error) {
      console.error('Erro ao salvar equipe:', error);
    }
  };

  const handleAthleteSelect = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedAthleteId(null);
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    try {
      await apiClient.delete(`/athletes/${athleteId}`, {
        data: { reason: 'Exclusão solicitada via interface' },
      });

      // Fechar sidebar e limpar seleção
      setIsSidebarOpen(false);
      setSelectedAthleteId(null);

      // Forçar recarga da lista (o componente TeamAthletesList irá refetch)
      // Podemos usar um key trick ou state para forçar remount
      const currentTeam = selectedTeamId;
      setSelectedTeamId(null);
      setTimeout(() => {
        setSelectedTeamId(currentTeam);
      }, 50);

      alert('Atleta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar atleta:', error);
      alert('Erro ao excluir atleta. Tente novamente.');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Coluna 1: Tree View (Organização → Equipes) */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
        <div className="p-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Gerenciamento de Atletas
          </h1>
          <OrganizationTeamsTree
            onTeamSelect={handleTeamSelect}
            selectedTeamId={selectedTeamId}
          />
        </div>
      </div>

      {/* Coluna 2: Lista de Atletas */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <TeamAthletesList
          teamId={selectedTeamId}
          teamName={selectedTeamName}
          onAthleteSelect={handleAthleteSelect}
          selectedAthleteId={selectedAthleteId}
        />
      </div>

      {/* Coluna 3: Sidebar com Ficha da Atleta */}
      <AthleteDetailSidebar
        athleteId={selectedAthleteId}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onDelete={handleDeleteAthlete}
      />
    </div>
  );
}
