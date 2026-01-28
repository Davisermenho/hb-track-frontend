'use client';

/**
 * GameCard - Card de jogo para visualização no dashboard
 * 
 * Exibe informações resumidas de um jogo:
 * - Adversário
 * - Data e horário
 * - Local (Casa/Fora)
 * - Status com cor indicativa
 * - Placar (se finalizado)
 */

import { Calendar, MapPin, Clock } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import AppTag from '@/components/ui/AppTag';
import { Match } from '@/context/GamesContext';

interface GameCardProps {
  game: Match;
  onClick: () => void;
}

const STATUS_CONFIG = {
  'Agendado': { color: 'blue' as const, label: 'Agendado' },
  'Finalizado': { color: 'green' as const, label: 'Finalizado' },
  'Cancelado': { color: 'red' as const, label: 'Cancelado' },
};

export default function GameCard({ game, onClick }: GameCardProps) {
  const statusConfig = STATUS_CONFIG[game.status] || STATUS_CONFIG['Agendado'];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isHome = game.is_home ?? true;
  const opponentName = game.opponent_name || 'Adversário';
  const venueName = game.venue || (isHome ? 'Casa' : 'Fora');

  return (
    <AppCard
      onClick={onClick}
      className="cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-blue-500/30"
    >
      {/* Header do card */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar do adversário */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {opponentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {isHome ? 'vs ' : '@ '}{opponentName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isHome ? 'Casa' : 'Fora'}
            </p>
          </div>
        </div>
        
        <AppTag label={statusConfig.label} color={statusConfig.color} size="sm" />
      </div>

      {/* Placar (se finalizado) */}
      {game.status === 'Finalizado' && game.home_score !== undefined && game.away_score !== undefined && (
        <div className="mt-4 flex items-center justify-center gap-4 rounded-lg bg-gray-50 py-3 dark:bg-gray-700/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {game.home_score}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isHome ? 'Nós' : 'Eles'}
            </p>
          </div>
          <span className="text-gray-400">-</span>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {game.away_score}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isHome ? 'Eles' : 'Nós'}
            </p>
          </div>
        </div>
      )}

      {/* Informações do jogo */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>{game.match_date ? formatDate(game.match_date) : 'Data não definida'}</span>
        </div>
        
        {game.match_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{formatTime(game.match_date)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>{venueName}</span>
        </div>
      </div>

      {/* Footer com ação */}
      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
        <button 
          className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Ver detalhes →
        </button>
      </div>
    </AppCard>
  );
}
