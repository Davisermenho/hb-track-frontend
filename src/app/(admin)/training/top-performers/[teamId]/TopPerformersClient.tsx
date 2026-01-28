'use client';

/**
 * TopPerformersClient - Página Top 5 Atletas
 * 
 * Exibe os top 5 atletas com melhor taxa de resposta wellness
 * Step 28.2: Feature restante - Top Performers
 */

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTeamAthletes90Plus, formatResponseRate, getResponseRateColor, formatMonthReference, type Athlete90Plus } from '@/lib/api/rankings';
import { Icons } from '@/design-system/icons';
import Link from 'next/link';

export function TopPerformersClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const teamId = parseInt(params.teamId as string, 10);
  const month = searchParams.get('month') || getPreviousMonth();

  // Query top performers
  const { data, isLoading, error } = useQuery({
    queryKey: ['team-athletes-90plus', teamId, month],
    queryFn: () => getTeamAthletes90Plus(teamId, month),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !isNaN(teamId) && month.length > 0,
  });

  const athletes = data?.athletes || [];
  const top5 = athletes.slice(0, 5);

  return (
    <div className="space-y-6" data-tour="top-athletes">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/training/rankings"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icons.Navigation.ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Top Performers
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atletas com melhor taxa de resposta de wellness em {formatMonthReference(month)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Icons.UI.Medal className="h-6 w-6 text-yellow-500" />
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {top5.length}
          </span>
        </div>
      </div>

      {/* Top 5 Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="mt-2 h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
            <Icons.Status.Warning className="inline-block h-12 w-12 text-red-600" />
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              Erro ao carregar top performers
            </p>
          </div>
        ) : top5.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
            <Icons.UI.Trophy className="inline-block h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Nenhum atleta com taxa &gt;= 90% neste mês
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Incentive a equipe a manter comprometimento com wellness!
            </p>
          </div>
        ) : (
          top5.map((athlete, index) => (
            <AthleteCard
              key={athlete.athlete_id}
              athlete={athlete}
              rank={index + 1}
            />
          ))
        )}
      </div>

      {/* All Athletes 90%+ */}
      {athletes.length > 5 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Outros Atletas com 90%+ ({athletes.length - 5})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Atleta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Taxa de Resposta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Badge
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {athletes.slice(5).map((athlete) => (
                  <tr key={athlete.athlete_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Icons.UI.User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {athlete.athlete_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getResponseRateColor(athlete.response_rate)}`}>
                        {formatResponseRate(athlete.response_rate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {athlete.badge_earned && (
                        <Icons.UI.Medal className="inline-block h-5 w-5 text-yellow-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icons.Status.CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Parabéns aos atletas comprometidos!
            </h3>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>
                Atletas com taxa de resposta &gt;= 90% demonstram excelente comprometimento 
                e recebem badges automáticos. Continue incentivando a equipe!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AthleteCardProps {
  athlete: Athlete90Plus;
  rank: number;
}

function AthleteCard({ athlete, rank }: AthleteCardProps) {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-400 to-blue-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border-2 border-transparent hover:border-blue-500 transition-all">
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-3xl shadow-lg`}>
          {getRankEmoji(rank)}
        </div>

        {/* Athlete Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {athlete.athlete_name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-2xl font-bold ${getResponseRateColor(athlete.response_rate)}`}>
              {formatResponseRate(athlete.response_rate)}
            </span>
            {athlete.badge_earned && (
              <Icons.UI.Medal className="h-5 w-5 text-yellow-500" />
            )}
          </div>
        </div>

        {/* Rank Number */}
        <div className="text-right">
          <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">
            {rank}º
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div
              style={{ width: `${athlete.response_rate}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                athlete.response_rate >= 95 ? 'bg-green-500' : 'bg-blue-500'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getPreviousMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}
