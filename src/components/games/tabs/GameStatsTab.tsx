'use client';

/**
 * GameStatsTab - Tab de estatísticas do jogo
 * 
 * Exibe:
 * - Estatísticas gerais (posse, finalizações, etc.)
 * - Estatísticas por jogador
 * - Gráficos de desempenho
 */

import { Match } from '@/context/GamesContext';
import AppCard from '@/components/ui/AppCard';
import AppEmptyState from '@/components/ui/AppEmptyState';
import AppTag from '@/components/ui/AppTag';
import { BarChart3, User, Trophy } from 'lucide-react';

interface GameStatsTabProps {
  game: Match;
}

// Mock de estatísticas
const MOCK_TEAM_STATS = {
  goals: 28,
  goalsConceded: 25,
  shots: 45,
  shotsOnTarget: 32,
  saves: 12,
  fouls: 8,
  yellowCards: 2,
  redCards: 0,
  timeouts: 3,
  possessionTime: 52,
  attackEfficiency: 62,
  defenseEfficiency: 78,
};

const MOCK_PLAYER_STATS = [
  { id: '1', name: 'Pedro Santos', goals: 8, assists: 3, saves: 0, fouls: 1 },
  { id: '2', name: 'Lucas Oliveira', goals: 5, assists: 6, saves: 0, fouls: 2 },
  { id: '3', name: 'Marcos Costa', goals: 6, assists: 2, saves: 0, fouls: 1 },
  { id: '4', name: 'Rafael Souza', goals: 4, assists: 4, saves: 0, fouls: 0 },
  { id: '5', name: 'Bruno Alves', goals: 3, assists: 2, saves: 0, fouls: 1 },
  { id: '6', name: 'João Silva', goals: 0, assists: 0, saves: 12, fouls: 0 },
  { id: '7', name: 'André Lima', goals: 2, assists: 1, saves: 0, fouls: 3 },
];

export default function GameStatsTab({ game }: GameStatsTabProps) {
  // Se o jogo ainda não foi realizado
  if (game.status === 'Agendado') {
    return (
      <div className="p-6">
        <AppEmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="Estatísticas indisponíveis"
          description="As estatísticas serão disponibilizadas após a realização do jogo"
        />
      </div>
    );
  }

  if (game.status === 'Cancelado') {
    return (
      <div className="p-6">
        <AppEmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="Jogo cancelado"
          description="Este jogo foi cancelado, não há estatísticas disponíveis"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Estatísticas do time */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card de estatísticas gerais */}
        <AppCard>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Estatísticas Gerais
          </h3>

          <div className="space-y-4">
            {/* Gols */}
            <StatBar 
              label="Gols"
              value={MOCK_TEAM_STATS.goals}
              max={Math.max(MOCK_TEAM_STATS.goals, MOCK_TEAM_STATS.goalsConceded)}
              color="green"
              suffix={`vs ${MOCK_TEAM_STATS.goalsConceded}`}
            />
            
            {/* Finalizações */}
            <StatBar
              label="Finalizações"
              value={MOCK_TEAM_STATS.shotsOnTarget}
              max={MOCK_TEAM_STATS.shots}
              color="blue"
              suffix={`de ${MOCK_TEAM_STATS.shots}`}
            />
            
            {/* Defesas */}
            <StatBar
              label="Defesas"
              value={MOCK_TEAM_STATS.saves}
              max={20}
              color="purple"
            />
            
            {/* Faltas */}
            <StatBar
              label="Faltas"
              value={MOCK_TEAM_STATS.fouls}
              max={15}
              color="yellow"
            />
          </div>
        </AppCard>

        {/* Card de eficiência */}
        <AppCard>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Índices de Eficiência
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Eficiência de ataque */}
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50">
              <div className="relative mx-auto h-24 w-24">
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${MOCK_TEAM_STATS.attackEfficiency * 2.51} 251`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {MOCK_TEAM_STATS.attackEfficiency}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                Eficiência Ofensiva
              </p>
            </div>

            {/* Eficiência defensiva */}
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50">
              <div className="relative mx-auto h-24 w-24">
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${MOCK_TEAM_STATS.defenseEfficiency * 2.51} 251`}
                    className="text-blue-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {MOCK_TEAM_STATS.defenseEfficiency}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                Eficiência Defensiva
              </p>
            </div>
          </div>

          {/* Cartões */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-4 rounded bg-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {MOCK_TEAM_STATS.yellowCards} amarelos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-4 rounded bg-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {MOCK_TEAM_STATS.redCards} vermelhos
              </span>
            </div>
          </div>
        </AppCard>
      </div>

      {/* Estatísticas por jogador */}
      <AppCard>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
          <User className="h-5 w-5 text-purple-500" />
          Estatísticas por Jogador
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Jogador
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Gols
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Assistências
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Defesas
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Faltas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {MOCK_PLAYER_STATS.sort((a, b) => b.goals - a.goals).map((player) => (
                <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium dark:bg-gray-700">
                        {player.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <AppTag 
                      label={String(player.goals)} 
                      color={player.goals > 0 ? 'green' : 'gray'} 
                      size="sm" 
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <AppTag 
                      label={String(player.assists)} 
                      color={player.assists > 0 ? 'blue' : 'gray'} 
                      size="sm" 
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <AppTag 
                      label={String(player.saves)} 
                      color={player.saves > 0 ? 'purple' : 'gray'} 
                      size="sm" 
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <AppTag 
                      label={String(player.fouls)} 
                      color={player.fouls > 2 ? 'red' : player.fouls > 0 ? 'yellow' : 'gray'} 
                      size="sm" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
}

// Componente auxiliar para barra de estatísticas
interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'red' | 'gray';
  suffix?: string;
}

function StatBar({ label, value, max, color, suffix }: StatBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {value} {suffix}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
