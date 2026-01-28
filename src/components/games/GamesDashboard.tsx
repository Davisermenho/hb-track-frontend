'use client';

/**
 * GamesDashboard - Dashboard principal de jogos
 * 
 * Exibe:
 * - Estatísticas resumidas (próximo jogo, total de jogos, vitórias)
 * - Barra de filtros
 * - Lista de jogos em cards ou tabela
 * - Estado vazio quando não há jogos
 */

import { useEffect, useState, useMemo } from 'react';
import { Calendar, Trophy, BarChart3, Plus } from 'lucide-react';
import { useGamesContext, Match } from '@/context/GamesContext';
import GamesFilterBar from './GamesFilterBar';
import GameCard from './GameCard';
import AppCard from '@/components/ui/AppCard';
import AppTable from '@/components/ui/AppTable';
import AppEmptyState from '@/components/ui/AppEmptyState';
import AppSkeleton from '@/components/ui/AppSkeleton';
import AppTag from '@/components/ui/AppTag';
import CreateGameModal from './modals/CreateGameModal';

interface GamesDashboardProps {
  onSelectGame: (gameId: string) => void;
  onCreateGame: () => void;
}

// Dados mock para desenvolvimento
const MOCK_GAMES: Match[] = [
  {
    id: '1',
    team_id: 'team-1',
    opponent_id: 'opp-1',
    opponent_name: 'Flamengo',
    status: 'Agendado',
    match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Ginásio Municipal',
    is_home: true,
  },
  {
    id: '2',
    team_id: 'team-1',
    opponent_id: 'opp-2',
    opponent_name: 'Vasco',
    status: 'Finalizado',
    match_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Arena Carioca',
    is_home: false,
    home_score: 28,
    away_score: 25,
  },
  {
    id: '3',
    team_id: 'team-1',
    opponent_id: 'opp-3',
    opponent_name: 'Botafogo',
    status: 'Finalizado',
    match_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Ginásio Municipal',
    is_home: true,
    home_score: 32,
    away_score: 30,
  },
  {
    id: '4',
    team_id: 'team-1',
    opponent_id: 'opp-4',
    opponent_name: 'Fluminense',
    status: 'Cancelado',
    match_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Maracanãzinho',
    is_home: false,
  },
];

export default function GamesDashboard({ onSelectGame, onCreateGame }: GamesDashboardProps) {
  const { 
    selectedTeam,
    filters, 
    viewMode, 
    isCreateModalOpen, 
    setIsCreateModalOpen 
  } = useGamesContext();
  
  const [games, setGames] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega jogos
  useEffect(() => {
    const fetchGames = async () => {
      if (!selectedTeam?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Substituir por chamada real à API
        // const response = await fetch(`/api/teams/${activeTeam.id}/matches`);
        // const data = await response.json();
        // setGames(data);
        
        // Usando dados mock por enquanto
        await new Promise(resolve => setTimeout(resolve, 500));
        setGames(MOCK_GAMES);
      } catch (err) {
        setError('Erro ao carregar jogos');
        console.error('Erro ao buscar jogos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [selectedTeam?.id]);

  // Filtra jogos baseado nos filtros ativos
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      // Filtro de status
      if (filters.status && game.status !== filters.status) {
        return false;
      }
      
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const opponentName = game.opponent_name?.toLowerCase() || '';
        if (!opponentName.includes(searchLower)) {
          return false;
        }
      }
      
      // Filtro de data início
      if (filters.dateFrom && game.match_date) {
        if (new Date(game.match_date) < new Date(filters.dateFrom)) {
          return false;
        }
      }
      
      // Filtro de data fim
      if (filters.dateTo && game.match_date) {
        if (new Date(game.match_date) > new Date(filters.dateTo)) {
          return false;
        }
      }
      
      // Filtro de local
      if (filters.location) {
        if (filters.location === 'home' && !game.is_home) return false;
        if (filters.location === 'away' && game.is_home) return false;
      }
      
      return true;
    });
  }, [games, filters]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const completed = games.filter(g => g.status === 'Finalizado');
    const wins = completed.filter(g => {
      if (g.is_home) {
        return (g.home_score || 0) > (g.away_score || 0);
      }
      return (g.away_score || 0) > (g.home_score || 0);
    });
    
    const nextGame = games
      .filter(g => g.status === 'Agendado' && g.match_date)
      .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())[0];
    
    return {
      total: games.length,
      completed: completed.length,
      wins: wins.length,
      nextGame,
      winRate: completed.length > 0 ? Math.round((wins.length / completed.length) * 100) : 0,
    };
  }, [games]);

  // Colunas para visualização em tabela
  const tableColumns = [
    {
      key: 'opponent',
      header: 'Adversário',
      render: (game: Match) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium dark:bg-gray-700">
            {game.opponent_name?.charAt(0) || '?'}
          </div>
          <span className="font-medium">{game.opponent_name}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      render: (game: Match) => (
        <span>
          {game.match_date 
            ? new Date(game.match_date).toLocaleDateString('pt-BR')
            : '-'
          }
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Local',
      render: (game: Match) => (
        <AppTag 
          label={game.is_home ? 'Casa' : 'Fora'} 
          color={game.is_home ? 'blue' : 'gray'} 
          size="sm" 
        />
      ),
    },
    {
      key: 'score',
      header: 'Placar',
      render: (game: Match) => (
        <span className="font-mono">
          {game.status === 'Finalizado' 
            ? `${game.home_score} - ${game.away_score}`
            : '-'
          }
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (game: Match) => {
        const colors = {
          'Agendado': 'blue' as const,
          'Finalizado': 'green' as const,
          'Cancelado': 'red' as const,
        };
        return <AppTag label={game.status} color={colors[game.status]} size="sm" />;
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <AppSkeleton key={i} variant="card" />
          ))}
        </div>
        {/* Filter skeleton */}
        <AppSkeleton variant="card" className="h-16" />
        {/* Content skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <AppSkeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Próximo jogo */}
        <AppCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Próximo Jogo</p>
              {stats.nextGame ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    vs {stats.nextGame.opponent_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(stats.nextGame.match_date!).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-lg font-semibold text-gray-500">
                  Nenhum agendado
                </p>
              )}
            </div>
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </AppCard>

        {/* Total de jogos */}
        <AppCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Jogos</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {stats.completed} finalizados
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </AppCard>

        {/* Vitórias */}
        <AppCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vitórias</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.wins}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {stats.winRate}% de aproveitamento
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </AppCard>

        {/* Ação rápida */}
        <AppCard 
          className="cursor-pointer transition-all hover:ring-2 hover:ring-blue-500"
          onClick={onCreateGame}
        >
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">Agendar Jogo</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Criar novo jogo</p>
            </div>
          </div>
        </AppCard>
      </div>

      {/* Barra de filtros */}
      <GamesFilterBar />

      {/* Lista de jogos */}
      {filteredGames.length === 0 ? (
        <AppEmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="Nenhum jogo encontrado"
          description={
            games.length === 0
              ? "Você ainda não tem jogos cadastrados. Comece agendando seu primeiro jogo!"
              : "Nenhum jogo corresponde aos filtros selecionados."
          }
          action={
            games.length === 0
              ? {
                  label: "Agendar primeiro jogo",
                  onClick: onCreateGame,
                }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => onSelectGame(game.id)}
            />
          ))}
        </div>
      ) : (
        <AppTable
          columns={tableColumns}
          data={filteredGames}
          onRowClick={(game) => onSelectGame(game.id)}
          rowKey="id"
        />
      )}

      {/* Modal de criar jogo */}
      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newGame) => {
          setGames([...games, newGame]);
          setIsCreateModalOpen(false);
          onSelectGame(newGame.id);
        }}
      />
    </div>
  );
}
