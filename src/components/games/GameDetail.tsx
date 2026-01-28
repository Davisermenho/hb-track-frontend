'use client';

/**
 * GameDetail - Componente de detalhe do jogo
 * 
 * Renderiza a visualização detalhada de um jogo com:
 * - Header com informações principais
 * - Sistema de tabs para diferentes seções
 * - Conteúdo da tab ativa
 */

import { useEffect, useState } from 'react';
import { useGamesContext, Match, GameTab } from '@/context/GamesContext';
import AppSkeleton from '@/components/ui/AppSkeleton';
import AppTag from '@/components/ui/AppTag';
import GameOverviewTab from './tabs/GameOverviewTab';
import GameLineupTab from './tabs/GameLineupTab';
import GameEventsTab from './tabs/GameEventsTab';
import GameStatsTab from './tabs/GameStatsTab';
import GameReportTab from './tabs/GameReportTab';
import EditGameDrawer from './modals/EditGameDrawer';
import CancelGameModal from './modals/CancelGameModal';
import { Pencil, XCircle, Calendar, MapPin, Clock } from 'lucide-react';

interface GameDetailProps {
  gameId: string;
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
}

// Mock data para desenvolvimento
const MOCK_GAME: Match = {
  id: '1',
  team_id: 'team-1',
  opponent_id: 'opp-1',
  opponent_name: 'Flamengo',
  status: 'Agendado',
  match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  venue: 'Ginásio Municipal',
  is_home: true,
  competition: 'Campeonato Estadual',
  notes: 'Jogo importante para classificação',
};

export default function GameDetail({ gameId, activeTab, onTabChange }: GameDetailProps) {
  const { setSelectedMatch, selectedTeam } = useGamesContext();
  
  const [game, setGame] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Carrega dados do jogo
  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Substituir por chamada real à API
        // const response = await fetch(`/api/matches/${gameId}`);
        // const data = await response.json();
        // setGame(data);
        
        // Mock
        await new Promise(resolve => setTimeout(resolve, 300));
        setGame({ ...MOCK_GAME, id: gameId });
      } catch (err) {
        setError('Erro ao carregar jogo');
        console.error('Erro ao buscar jogo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Atualiza contexto quando o jogo é carregado
  useEffect(() => {
    if (game) {
      setSelectedMatch(game);
    }
    return () => setSelectedMatch(null);
  }, [game, setSelectedMatch]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não definida';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Match['status']) => {
    const colors = {
      'Agendado': 'blue' as const,
      'Finalizado': 'green' as const,
      'Cancelado': 'red' as const,
    };
    return colors[status];
  };

  // Renderiza conteúdo da tab ativa
  const renderTabContent = () => {
    if (!game) return null;

    switch (activeTab) {
      case 'overview':
        return <GameOverviewTab game={game} />;
      case 'lineup':
        return <GameLineupTab game={game} />;
      case 'events':
        return <GameEventsTab game={game} />;
      case 'stats':
        return <GameStatsTab game={game} />;
      case 'report':
        return <GameReportTab game={game} />;
      default:
        return <GameOverviewTab game={game} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AppSkeleton variant="card" className="h-40" />
        <AppSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {error || 'Jogo não encontrado'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Verifique se o ID do jogo está correto
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de informações principais */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Info do jogo */}
          <div className="flex items-start gap-4">
            {/* Avatar do adversário */}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {game.opponent_name?.charAt(0) || '?'}
            </div>
            
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {game.is_home ? 'vs ' : '@ '}{game.opponent_name}
                </h2>
                <AppTag 
                  label={game.status} 
                  color={getStatusColor(game.status)} 
                />
              </div>
              
              {game.competition && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {game.competition}
                </p>
              )}
              
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(game.match_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(game.match_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{game.venue || (game.is_home ? 'Casa' : 'Fora')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Placar (se finalizado) */}
          {game.status === 'Finalizado' && game.home_score !== undefined && (
            <div className="flex items-center gap-6 rounded-xl bg-gray-50 px-6 py-4 dark:bg-gray-700/50">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {game.home_score}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.is_home ? selectedTeam?.name || 'Nós' : game.opponent_name}
                </p>
              </div>
              <span className="text-2xl text-gray-400">×</span>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {game.away_score}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.is_home ? game.opponent_name : selectedTeam?.name || 'Nós'}
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          {game.status !== 'Cancelado' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditDrawerOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              
              {game.status === 'Agendado' && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notas */}
        {game.notes && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Notas:</strong> {game.notes}
            </p>
          </div>
        )}
      </div>

      {/* Conteúdo da tab */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {renderTabContent()}
      </div>

      {/* Drawer de edição */}
      <EditGameDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        game={game}
        onSuccess={(updatedGame) => {
          setGame(updatedGame);
          setIsEditDrawerOpen(false);
        }}
      />

      {/* Modal de cancelamento */}
      <CancelGameModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        game={game}
        onSuccess={() => {
          setGame({ ...game, status: 'Cancelado' });
          setIsCancelModalOpen(false);
        }}
      />
    </div>
  );
}
