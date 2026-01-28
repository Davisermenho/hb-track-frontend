/**
 * StandingsTable - Tabela de classificação da competição
 * 
 * Features:
 * - Destaque para sua equipe
 * - Cores para zona de classificação
 * - Responsivo
 */

'use client';

import { cn } from '@/lib/utils';
import type { CompetitionStanding } from '@/lib/api/competitions-v2';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StandingsTableProps {
  standings: CompetitionStanding[];
  highlightPositions?: {
    qualified?: number[];      // Posições que classificam (verde)
    playoff?: number[];        // Posições de playoff (azul)
    relegated?: number[];      // Posições rebaixadas (vermelho)
  };
  className?: string;
}

export default function StandingsTable({ 
  standings, 
  highlightPositions,
  className 
}: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma classificação disponível
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          A tabela será calculada após os jogos
        </p>
      </div>
    );
  }

  const getPositionStyle = (position: number) => {
    if (highlightPositions?.qualified?.includes(position)) {
      return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500';
    }
    if (highlightPositions?.playoff?.includes(position)) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500';
    }
    if (highlightPositions?.relegated?.includes(position)) {
      return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500';
    }
    return '';
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
            <th className="py-3 px-2 w-10">#</th>
            <th className="py-3 px-2">Equipe</th>
            <th className="py-3 px-2 text-center w-10">J</th>
            <th className="py-3 px-2 text-center w-10">V</th>
            <th className="py-3 px-2 text-center w-10">E</th>
            <th className="py-3 px-2 text-center w-10">D</th>
            <th className="py-3 px-2 text-center w-14 hidden sm:table-cell">GP</th>
            <th className="py-3 px-2 text-center w-14 hidden sm:table-cell">GC</th>
            <th className="py-3 px-2 text-center w-14">SG</th>
            <th className="py-3 px-2 text-center w-14 font-semibold">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((entry) => (
            <tr
              key={entry.id}
              className={cn(
                'border-b border-gray-100 dark:border-gray-800 transition-colors',
                entry.is_our_team 
                  ? 'bg-amber-50 dark:bg-amber-900/20 font-medium' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                getPositionStyle(entry.position)
              )}
            >
              {/* Posição */}
              <td className="py-3 px-2">
                <span className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                  entry.position === 1 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                    : entry.position === 2
                    ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    : entry.position === 3
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400'
                )}>
                  {entry.position}
                </span>
              </td>
              
              {/* Equipe */}
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'truncate max-w-[150px] sm:max-w-none',
                    entry.is_our_team 
                      ? 'text-amber-700 dark:text-amber-400' 
                      : 'text-gray-900 dark:text-white'
                  )}>
                    {entry.team_name}
                  </span>
                  {entry.is_our_team && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 rounded">
                      VOCÊ
                    </span>
                  )}
                </div>
              </td>
              
              {/* Jogos */}
              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400">
                {entry.played}
              </td>
              
              {/* Vitórias */}
              <td className="py-3 px-2 text-center text-green-600 dark:text-green-400">
                {entry.won}
              </td>
              
              {/* Empates */}
              <td className="py-3 px-2 text-center text-gray-500 dark:text-gray-400">
                {entry.drawn}
              </td>
              
              {/* Derrotas */}
              <td className="py-3 px-2 text-center text-red-600 dark:text-red-400">
                {entry.lost}
              </td>
              
              {/* Gols Pró */}
              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                {entry.goals_for}
              </td>
              
              {/* Gols Contra */}
              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                {entry.goals_against}
              </td>
              
              {/* Saldo de Gols */}
              <td className="py-3 px-2 text-center">
                <span className={cn(
                  'inline-flex items-center gap-0.5',
                  entry.goal_difference > 0 
                    ? 'text-green-600 dark:text-green-400'
                    : entry.goal_difference < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500'
                )}>
                  {entry.goal_difference > 0 && '+'}
                  {entry.goal_difference}
                </span>
              </td>
              
              {/* Pontos */}
              <td className="py-3 px-2 text-center">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 
                             bg-gray-100 dark:bg-gray-800 rounded font-bold text-gray-900 dark:text-white">
                  {entry.points}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legenda */}
      {highlightPositions && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs">
          {highlightPositions.qualified && highlightPositions.qualified.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Classificado</span>
            </div>
          )}
          {highlightPositions.playoff && highlightPositions.playoff.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Playoff</span>
            </div>
          )}
          {highlightPositions.relegated && highlightPositions.relegated.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Rebaixamento</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Versão compacta para cards
interface MiniStandingsProps {
  standings: CompetitionStanding[];
  limit?: number;
}

export function MiniStandings({ standings, limit = 5 }: MiniStandingsProps) {
  const displayStandings = standings.slice(0, limit);
  const ourTeamIndex = standings.findIndex(s => s.is_our_team);
  const showOurTeam = ourTeamIndex >= limit;
  
  return (
    <div className="space-y-1">
      {displayStandings.map(entry => (
        <div
          key={entry.id}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded text-sm',
            entry.is_our_team && 'bg-amber-50 dark:bg-amber-900/20'
          )}
        >
          <span className="w-5 text-center font-medium text-gray-500 dark:text-gray-400">
            {entry.position}
          </span>
          <span className={cn(
            'flex-1 truncate',
            entry.is_our_team 
              ? 'text-amber-700 dark:text-amber-400 font-medium' 
              : 'text-gray-700 dark:text-gray-300'
          )}>
            {entry.team_name}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">
            {entry.points}
          </span>
        </div>
      ))}
      
      {showOurTeam && standings[ourTeamIndex] && (
        <>
          <div className="text-center text-xs text-gray-400 py-1">···</div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-50 dark:bg-amber-900/20 text-sm">
            <span className="w-5 text-center font-medium text-gray-500 dark:text-gray-400">
              {standings[ourTeamIndex].position}
            </span>
            <span className="flex-1 truncate text-amber-700 dark:text-amber-400 font-medium">
              {standings[ourTeamIndex].team_name}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {standings[ourTeamIndex].points}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
