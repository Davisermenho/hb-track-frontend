'use client';

/**
 * RankingsClient - Página de Rankings de Equipes
 *
 * Exibe ranking de equipes por taxa de resposta wellness mensal
 * Step 28.2: Feature restante - Rankings
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getWellnessRankings,
  formatResponseRate,
  getResponseRateColor,
  getRankIcon,
  getRateBadgeColor,
  formatMonthReference,
  type TeamRanking
} from '@/lib/api/rankings';
import { Icons } from '@/design-system/icons';

export function RankingsClient() {
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

  // Query rankings
  const { data, isLoading, error } = useQuery({
    queryKey: ['wellness-rankings', selectedMonth],
    queryFn: () => getWellnessRankings(selectedMonth),
    staleTime: 5 * 60 * 1000, // 5 minutos (dados calculados mensalmente)
  });

  const rankings = data?.rankings || [];
  const monthDisplay = selectedMonth
    ? formatMonthReference(selectedMonth)
    : 'Mês Anterior';

  return (
    <div className="p-6 space-y-6" data-tour="team-rankings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rankings de Equipes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comparação de taxa de resposta de wellness entre equipes
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Icons.UI.Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(e.target.value || undefined)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 sm:text-sm"
          >
            <option value="">Mês Anterior</option>
            {/* TODO: Popular com últimos 12 meses */}
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i - 1);
              const month = date.toISOString().slice(0, 7);
              return (
                <option key={month} value={month}>
                  {formatMonthReference(month)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Equipes Avaliadas
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {rankings.length}
            </dd>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Melhor Taxa Média
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">
              {rankings[0]?.avg_rate ? formatResponseRate(rankings[0].avg_rate) : '-'}
            </dd>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Atletas 90%+
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">
              {rankings.reduce((sum, r) => sum + r.athletes_90plus, 0)}
            </dd>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-12 text-center">
            <Icons.UI.Loading className="inline-block h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Carregando rankings...
            </p>
          </div>
        ) : error ? (
          <div className="px-4 py-12 text-center">
            <Icons.Status.Warning className="inline-block h-8 w-8 text-red-600" />
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Erro ao carregar rankings
            </p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Icons.UI.Trophy className="inline-block h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Nenhum ranking disponível para {monthDisplay}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Posição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Equipe
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taxa Pré-Treino
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taxa Pós-Treino
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Média
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Atletas 90%+
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rankings.map((ranking) => (
                  <tr key={ranking.team_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Rank */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">{getRankIcon(ranking.rank)}</span>
                    </td>

                    {/* Team Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Icons.UI.Users className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ranking.team_name}
                        </div>
                      </div>
                    </td>

                    {/* Pre Rate */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getResponseRateColor(ranking.response_rate_pre)}`}>
                        {formatResponseRate(ranking.response_rate_pre)}
                      </span>
                    </td>

                    {/* Post Rate */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getResponseRateColor(ranking.response_rate_post)}`}>
                        {formatResponseRate(ranking.response_rate_post)}
                      </span>
                    </td>

                    {/* Avg Rate (Badge) */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRateBadgeColor(ranking.avg_rate)}`}>
                        {formatResponseRate(ranking.avg_rate)}
                      </span>
                    </td>

                    {/* Athletes 90%+ */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                        <Icons.UI.Medal className="h-4 w-4 text-yellow-500 mr-1" />
                        {ranking.athletes_90plus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/training/top-performers/${ranking.team_id}?month=${selectedMonth || ''}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end gap-1"
                      >
                        <Icons.Actions.Eye className="h-4 w-4" />
                        Ver Detalhes
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icons.Status.Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Como funciona o ranking?
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Rankings calculados automaticamente todo dia 1º do mês</li>
                <li>Taxa média = (Pré-Treino + Pós-Treino) / 2</li>
                <li>Meta: 90% de taxa de resposta (excelente)</li>
                <li>Atletas 90%+ ganham badge de comprometimento</li>
                <li>Equipes com taxa &lt; 70% recebem alertas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
