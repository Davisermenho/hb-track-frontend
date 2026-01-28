'use client';

/**
 * GamesHeader - Cabeçalho da página de jogos
 * 
 * Exibe:
 * - Breadcrumb de navegação
 * - Título (Jogos ou nome do jogo)
 * - Botão de voltar (quando em detalhe)
 * - Tabs de navegação (quando em detalhe)
 * - Botão de criar novo jogo
 */

import { ChevronLeft, Plus, Calendar } from 'lucide-react';
import { useGamesContext, GameTab } from '@/context/GamesContext';
import AppTabs, { TabItem } from '@/components/ui/AppTabs';

interface GamesHeaderProps {
  isDetailView: boolean;
  onBackToDashboard: () => void;
  onCreateGame: () => void;
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
}

const GAME_TABS: TabItem[] = [
  { id: 'overview', label: 'Resumo', icon: 'document' },
  { id: 'lineup', label: 'Escalação', icon: 'users' },
  { id: 'events', label: 'Eventos', icon: 'clock' },
  { id: 'stats', label: 'Estatísticas', icon: 'chart' },
  { id: 'report', label: 'Relatório', icon: 'clipboard' },
];

export default function GamesHeader({
  isDetailView,
  onBackToDashboard,
  onCreateGame,
  activeTab,
  onTabChange,
}: GamesHeaderProps) {
  const { selectedMatch } = useGamesContext();

  // Título dinâmico baseado no estado
  const getTitle = () => {
    if (isDetailView && selectedMatch) {
      const homeTeam = selectedMatch.home_team_name || 'Casa';
      const awayTeam = selectedMatch.away_team_name || 'Visitante';
      return `${homeTeam} vs ${awayTeam}`;
    }
    return 'Jogos';
  };

  // Subtítulo para detalhe (data do jogo)
  const getSubtitle = () => {
    if (isDetailView && selectedMatch?.match_date) {
      return new Date(selectedMatch.match_date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return 'Gerencie partidas e acompanhe estatísticas';
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Breadcrumb */}
      <nav className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Dashboard</span>
        <span>/</span>
        <span className={isDetailView ? '' : 'font-medium text-gray-900 dark:text-white'}>
          Jogos
        </span>
        {isDetailView && (
          <>
            <span>/</span>
            <span className="font-medium text-gray-900 dark:text-white">
              Detalhe
            </span>
          </>
        )}
      </nav>

      {/* Header principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isDetailView && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getTitle()}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getSubtitle()}
              </p>
            </div>
          </div>
        </div>

        {!isDetailView && (
          <button
            onClick={onCreateGame}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo Jogo
          </button>
        )}
      </div>

      {/* Tabs (apenas no detalhe) */}
      {isDetailView && (
        <div className="mt-4">
          <AppTabs
            tabs={GAME_TABS}
            activeTab={activeTab}
            onTabChange={(tabId) => onTabChange(tabId as GameTab)}
            variant="underline"
          />
        </div>
      )}
    </header>
  );
}
