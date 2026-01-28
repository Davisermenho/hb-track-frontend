'use client'

/**
 * Analytics Dashboard Client - Training Module (Step 8)
 * 
 * Dashboard simplificado de analytics baseado no (protected)/analytics.
 * Usa componentes e tipos existentes do projeto.
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  Award,
  Heart,
  Zap,
  RefreshCw,
  FileText,
} from 'lucide-react'
import { useTeamSeasonOptional } from '@/context/TeamSeasonContext'

import {
  getTeamSummary,
  getWeeklyLoad,
  getDeviationAnalysis,
  getCurrentMonthRange,
  getWellnessRateBadge,
  type TeamSummaryResponse,
  type WeeklyLoadResponse,
  type DeviationAnalysisResponse,
} from '@/lib/api/analytics'

import WeeklyLoadChart from '@/components/analytics/WeeklyLoadChart'
import DeviationAlerts from '@/components/analytics/DeviationAlerts'
import WellnessResponseChart from '@/components/analytics/WellnessResponseChart'
import { ExportPDFModal } from '@/components/training/analytics/ExportPDFModal'

// ============================================================================
// TYPES
// ============================================================================

interface DateRange {
  start: string
  end: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AnalyticsClient() {
  // Context
  const teamSeasonContext = useTeamSeasonOptional()
  const activeTeam = teamSeasonContext?.selectedTeam
  
  // State
  const [dateRange, setDateRange] = useState<DateRange>(getCurrentMonthRange())
  const [weeksToShow, setWeeksToShow] = useState<number>(4)
  const [showExportModal, setShowExportModal] = useState(false)

  // Team ID do contexto
  const teamId = activeTeam?.id || ''

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Query 1: Team Summary
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery<TeamSummaryResponse>({
    queryKey: ['analytics', 'summary', teamId, dateRange],
    queryFn: () => getTeamSummary(teamId, dateRange.start, dateRange.end),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Query 2: Weekly Load
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    error: weeklyError,
    refetch: refetchWeekly,
  } = useQuery<WeeklyLoadResponse>({
    queryKey: ['analytics', 'weekly', teamId, weeksToShow],
    queryFn: () => getWeeklyLoad(teamId, weeksToShow),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  })

  // Query 3: Deviation Analysis
  const {
    data: deviationData,
    isLoading: deviationLoading,
    error: deviationError,
    refetch: refetchDeviation,
  } = useQuery<DeviationAnalysisResponse>({
    queryKey: ['analytics', 'deviation', teamId, dateRange],
    queryFn: () => getDeviationAnalysis(teamId, dateRange.start, dateRange.end),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  })

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefreshAll = () => {
    refetchSummary()
    refetchWeekly()
    refetchDeviation()
  }

  const handleDateRangeChange = (months: number) => {
    const now = new Date()
    const start = startOfMonth(subMonths(now, months - 1))
    const end = endOfMonth(now)
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    })
  }

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const isLoading = summaryLoading || weeklyLoading || deviationLoading
  const hasError = summaryError || weeklyError || deviationError

  // Empty state
  if (!activeTeam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Activity className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Selecione uma equipe
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Use o seletor no cabeçalho para escolher uma equipe e visualizar as métricas de treinamento.
            </p>
          </div>
        </div>
    )
  }

  const wellnessPreBadge = getWellnessRateBadge(
    summaryData?.metrics.wellness_response_rate_pre || null
  )
  const wellnessPostBadge = getWellnessRateBadge(
    summaryData?.metrics.wellness_response_rate_post || null
  )

  // Wellness chart data
  const wellnessChartData = useMemo(() => {
    if (!weeklyData || !summaryData) return []
    
    return weeklyData.data.map((week) => ({
      week_start: week.week_start,
      week_end: week.week_end,
      response_rate_pre: summaryData.metrics.wellness_response_rate_pre || 0,
      response_rate_post: summaryData.metrics.wellness_response_rate_post || 0,
    }))
  }, [weeklyData, summaryData])

  // Error state
  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Erro ao carregar analytics
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-500">
            {summaryError?.toString() || weeklyError?.toString() || deviationError?.toString()}
          </p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics da Equipe
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Análise de desempenho e carga de treino
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Export PDF Button */}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={!teamId || isLoading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </button>

          {/* Refresh button */}
          <button
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:bg-gray-400"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Sessions */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Sessões</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryData.metrics.total_sessions}
                </p>
              </div>
            </div>
          </div>

          {/* Avg RPE */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">RPE Médio</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryData.metrics.avg_rpe?.toFixed(1) || '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Assiduidade</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryData.metrics.attendance_rate?.toFixed(1) || '--'}%
                </p>
              </div>
            </div>
          </div>

          {/* Deviations */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Desvios</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryData.metrics.deviation_count || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Internal Load */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Carga Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryData.metrics.total_internal_load?.toFixed(0) || '--'}
                  <span className="ml-1 text-xs sm:text-sm font-normal text-gray-500">UA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Wellness Pre */}
          <div className={`rounded-lg border p-4 shadow-sm ${wellnessPreBadge.color}`}>
            <div className="flex items-center gap-3">
              <div className="text-xl sm:text-2xl">{wellnessPreBadge.icon}</div>
              <div>
                <p className="text-xs sm:text-sm">Wellness Pré</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {summaryData.metrics.wellness_response_rate_pre?.toFixed(1) || '--'}%
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold">{wellnessPreBadge.label}</p>
          </div>

          {/* Wellness Post */}
          <div className={`rounded-lg border p-4 shadow-sm ${wellnessPostBadge.color}`}>
            <div className="flex items-center gap-3">
              <div className="text-xl sm:text-2xl">{wellnessPostBadge.icon}</div>
              <div>
                <p className="text-xs sm:text-sm">Wellness Pós</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {summaryData.metrics.wellness_response_rate_post?.toFixed(1) || '--'}%
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold">{wellnessPostBadge.label}</p>
          </div>

          {/* Badges */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-950">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Badges</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryData.metrics.athletes_with_badges_count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Load Chart */}
      {weeklyData && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Carga Semanal
            </h2>
            <select
              value={weeksToShow}
              onChange={(e) => setWeeksToShow(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
            >
              <option value={4}>4 semanas</option>
              <option value={8}>8 semanas</option>
              <option value={12}>12 semanas</option>
            </select>
          </div>
          <WeeklyLoadChart data={weeklyData.data} />
        </div>
      )}

      {/* Grid: Deviations + Wellness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deviation Alerts */}
        {deviationData && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Alertas de Desvios
            </h2>
            <DeviationAlerts
              deviations={deviationData.deviations}
              thresholdMultiplier={deviationData.threshold_multiplier}
              maxDisplay={5}
            />
          </div>
        )}

        {/* Wellness Response Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Adesão Wellness
          </h2>
          <WellnessResponseChart data={wellnessChartData} />
        </div>
      </div>

      {/* Cache Info */}
      {summaryData && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              <strong>Cache híbrido:</strong> Dados calculados em{' '}
              {format(new Date(summaryData.calculated_at), "d 'de' MMMM, HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>
          <p className="mt-1">
            Estratégia: Weekly cache para mês corrente, Monthly cache para histórico
          </p>
        </div>
      )}

      {/* Export PDF Modal */}
      {activeTeam && (
        <ExportPDFModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          teamId={activeTeam.id}
          teamName={activeTeam.name}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
        />
      )}
      </div>
    </>
  )
}
