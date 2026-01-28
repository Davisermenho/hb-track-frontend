'use client';

/**
 * PreventionDashboardClient - Dashboard de Eficácia Preventiva (Step 22)
 *
 * Exibe correlação alertas→sugestões→lesões com gráficos e timeline
 * Movido de (protected) para (admin) para manter consistência do layout
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/design-system/icons';
import { PreventionTimeline } from '@/components/prevention/PreventionTimeline';
import {
  getPreventionEffectiveness,
  formatReductionRate,
  getReductionColor,
  formatCategory
} from '@/lib/api/prevention-effectiveness';
import { useTeamSeasonOptional } from '@/context/TeamSeasonContext';
import { format, subDays } from 'date-fns';

export default function PreventionDashboardClient() {
  const context = useTeamSeasonOptional();
  const selectedTeam = context?.selectedTeam;

  // Filtros
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [category, setCategory] = useState<string>('');

  // Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['prevention-effectiveness', selectedTeam?.id, dateRange, category],
    queryFn: () => getPreventionEffectiveness(
      selectedTeam!.id,
      dateRange.start,
      dateRange.end,
      category || undefined
    ),
    enabled: !!selectedTeam,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (!selectedTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Icons.Status.Info className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Selecione uma equipe
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Escolha uma equipe no menu superior para visualizar dados de eficácia preventiva
          </p>
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Icons.UI.Loading className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Icons.Status.Error className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
          </p>
        </div>
    );
  }

  if (!data) return null;

  const { summary, comparison, timeline, by_category } = data;

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Icons.Medical className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Eficácia Preventiva
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Correlação entre alertas, sugestões e lesões
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">Todas categorias</option>
              <option value="weekly_overload">Sobrecarga Semanal</option>
              <option value="low_wellness_response">Baixa Resposta Wellness</option>
              <option value="critical_wellness">Wellness Crítico</option>
            </select>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Alertas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Icons.Status.Warning className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {summary.total_alerts}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Alertas Gerados
            </p>
          </div>

          {/* Sugestões Aplicadas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Icons.Status.Success className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {summary.suggestions_applied}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Sugestões Aplicadas
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.alerts_effectiveness_pct.toFixed(1)}% dos alertas
            </p>
          </div>

          {/* Total Lesões */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Icons.Medical className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {summary.total_injuries}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Lesões Registradas
            </p>
          </div>

          {/* Taxa de Redução */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Icons.UI.TrendUp className="h-5 w-5 text-blue-500" />
              <span className={`text-3xl font-bold ${getReductionColor(summary.injury_reduction_rate)}`}>
                {formatReductionRate(summary.injury_reduction_rate)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Redução de Lesões
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.injury_reduction_rate >= 50 ? 'Altamente eficaz' :
               summary.injury_reduction_rate >= 20 ? 'Eficaz' :
               summary.injury_reduction_rate >= 0 ? 'Moderado' : 'Sem efeito'}
            </p>
          </div>
        </div>

        {/* Comparação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Comparação: Com vs Sem Ação Preventiva
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taxa de Lesões COM Ação</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {comparison.injury_rate_with_action.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.sample_size_with_action} sugestões aplicadas
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taxa de Lesões SEM Ação</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {comparison.injury_rate_without_action.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.sample_size_without_action} sugestões recusadas
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Redução Alcançada</p>
              <p className={`text-2xl font-bold ${getReductionColor(comparison.reduction_achieved)}`}>
                {formatReductionRate(comparison.reduction_achieved)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Diferença entre taxas
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Timeline de Eventos
          </h2>
          <PreventionTimeline events={timeline} />
        </div>

        {/* Breakdown por Categoria */}
        {Object.keys(by_category).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Por Categoria de Alerta
            </h2>
            <div className="space-y-3">
              {Object.entries(by_category).map(([cat, stats]) => (
                <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatCategory(cat)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.total_alerts} alertas • {stats.suggestions_applied} aplicadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {stats.suggestions_generated}
                    </p>
                    <p className="text-xs text-gray-500">sugestões</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
