/**
 * StandingsTab - Tab de classificação da competição
 * 
 * Exibe tabela de classificação com pontuação, jogos, saldo de gols
 */

'use client';

import { useState } from 'react';
import { useCompetitionSeasons } from '@/hooks/useCompetitions';
import { 
  Table2,
  ChevronDown,
  Trophy
} from 'lucide-react';
import { StandingEntry, CompetitionSeason, Phase } from '@/lib/api/competitions';

interface StandingsTabProps {
  competitionId: string;
}

// Mock data for demonstration (with goal_difference)
const MOCK_STANDINGS: StandingEntry[] = [
  { team_id: '1', team_name: 'Time A', position: 1, played: 10, won: 8, drawn: 1, lost: 1, goals_for: 30, goals_against: 10, goal_difference: 20, points: 25 },
  { team_id: '2', team_name: 'Time B', position: 2, played: 10, won: 7, drawn: 2, lost: 1, goals_for: 25, goals_against: 12, goal_difference: 13, points: 23 },
  { team_id: '3', team_name: 'Time C', position: 3, played: 10, won: 6, drawn: 2, lost: 2, goals_for: 22, goals_against: 15, goal_difference: 7, points: 20 },
  { team_id: '4', team_name: 'Time D', position: 4, played: 10, won: 5, drawn: 3, lost: 2, goals_for: 18, goals_against: 14, goal_difference: 4, points: 18 },
  { team_id: '5', team_name: 'Time E', position: 5, played: 10, won: 4, drawn: 2, lost: 4, goals_for: 15, goals_against: 16, goal_difference: -1, points: 14 },
];

// Group type for local use
interface Group {
  id: string;
  name: string;
}

// Extended season type for UI
interface ExtendedSeason extends CompetitionSeason {
  year?: number;
  phases?: Array<Phase & { groups?: Group[] }>;
}

export default function StandingsTab({ competitionId }: StandingsTabProps) {
  const { data: seasonsData, isLoading } = useCompetitionSeasons(competitionId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Cast to extended type
  const seasons = seasonsData as ExtendedSeason[] | undefined;

  // Get standings based on selection
  // In real implementation, this would be fetched from the API
  const standings = MOCK_STANDINGS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Build selection options
  const selectedSeason = seasons?.find((s: ExtendedSeason) => s.id === selectedSeasonId);
  const phases = selectedSeason?.phases || [];
  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);
  const groups: Group[] = selectedPhase?.groups || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Season selector */}
        <div className="relative">
          <select
            value={selectedSeasonId || ''}
            onChange={(e) => {
              setSelectedSeasonId(e.target.value || null);
              setSelectedPhaseId(null);
              setSelectedGroupId(null);
            }}
            className="appearance-none pl-4 pr-10 py-2 rounded-lg border 
                     border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                     text-gray-900 dark:text-white text-sm
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     cursor-pointer min-w-[150px]"
          >
            <option value="">Temporada</option>
            {seasons?.map((season: ExtendedSeason) => (
              <option key={season.id} value={season.id}>
                {season.name || season.year || `Temporada ${season.season_id.slice(0, 8)}...`}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 
                                    text-gray-400 pointer-events-none" />
        </div>

        {/* Phase selector */}
        <div className="relative">
          <select
            value={selectedPhaseId || ''}
            onChange={(e) => {
              setSelectedPhaseId(e.target.value || null);
              setSelectedGroupId(null);
            }}
            disabled={!selectedSeasonId}
            className="appearance-none pl-4 pr-10 py-2 rounded-lg border 
                     border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                     text-gray-900 dark:text-white text-sm
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     cursor-pointer min-w-[150px] disabled:opacity-50"
          >
            <option value="">Fase</option>
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 
                                    text-gray-400 pointer-events-none" />
        </div>

        {/* Group selector */}
        <div className="relative">
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(e.target.value || null)}
            disabled={!selectedPhaseId}
            className="appearance-none pl-4 pr-10 py-2 rounded-lg border 
                     border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                     text-gray-900 dark:text-white text-sm
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     cursor-pointer min-w-[150px] disabled:opacity-50"
          >
            <option value="">Grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 
                                    text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Standings table */}
      {!selectedSeasonId ? (
        <div className="text-center py-12">
          <Table2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selecione uma temporada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Escolha uma temporada, fase e grupo para visualizar a classificação
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  J
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  V
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  E
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  D
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  GP
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  GC
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  SG
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 
                            dark:divide-gray-700">
              {standings.map((entry, index) => (
                <tr 
                  key={entry.team_id}
                  className={`${index < 3 ? 'bg-green-50/50 dark:bg-green-900/10' : ''}
                            hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {entry.position <= 3 && (
                        <Trophy className={`w-4 h-4 
                          ${entry.position === 1 ? 'text-yellow-500' : ''}
                          ${entry.position === 2 ? 'text-gray-400' : ''}
                          ${entry.position === 3 ? 'text-amber-600' : ''}`} 
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.position}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.team_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm 
                               text-gray-500 dark:text-gray-400">
                    {entry.played}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm 
                               text-green-600 dark:text-green-400 font-medium">
                    {entry.won}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm 
                               text-yellow-600 dark:text-yellow-400">
                    {entry.drawn}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm 
                               text-red-600 dark:text-red-400">
                    {entry.lost}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm 
                               text-gray-500 dark:text-gray-400">
                    {entry.goals_for}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm 
                               text-gray-500 dark:text-gray-400">
                    {entry.goals_against}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <span className={`${
                      (entry.goals_for - entry.goals_against) > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : (entry.goals_for - entry.goals_against) < 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {entry.goals_for - entry.goals_against > 0 ? '+' : ''}
                      {entry.goals_for - entry.goals_against}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {entry.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {selectedSeasonId && standings.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span><strong>J</strong> = Jogos</span>
          <span><strong>V</strong> = Vitórias</span>
          <span><strong>E</strong> = Empates</span>
          <span><strong>D</strong> = Derrotas</span>
          <span><strong>GP</strong> = Gols Pró</span>
          <span><strong>GC</strong> = Gols Contra</span>
          <span><strong>SG</strong> = Saldo de Gols</span>
          <span><strong>Pts</strong> = Pontos</span>
        </div>
      )}
    </div>
  );
}
