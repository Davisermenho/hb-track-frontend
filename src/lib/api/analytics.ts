/**
 * Analytics API Client - Step 17
 * 
 * Endpoints para consumir analytics de treino com cache híbrido.
 * Backend: app/api/v1/routers/training_analytics.py
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsPeriod {
  start: string // ISO date YYYY-MM-DD
  end: string   // ISO date YYYY-MM-DD
}

export interface AnalyticsMetrics {
  // Contadores
  total_sessions: number
  
  // Focos de treino (médias percentuais)
  avg_focus_attack_positional_pct: number | null
  avg_focus_defense_positional_pct: number | null
  avg_focus_transition_offense_pct: number | null
  avg_focus_transition_defense_pct: number | null
  avg_focus_attack_technical_pct: number | null
  avg_focus_defense_technical_pct: number | null
  avg_focus_physical_pct: number | null
  
  // Carga de treino
  avg_rpe: number | null
  avg_internal_load: number | null
  total_internal_load: number | null
  
  // Assiduidade
  attendance_rate: number | null
  
  // Wellness (Step 16 - NOVO)
  wellness_response_rate_pre: number | null
  wellness_response_rate_post: number | null
  
  // Gamificação
  athletes_with_badges_count: number | null
  
  // Desvios (threshold dinâmico - Step 15 integration)
  deviation_count: number | null
  threshold_mean: number | null
  threshold_stddev: number | null
}

export interface TeamSummaryResponse {
  team_id: string
  period: AnalyticsPeriod
  metrics: AnalyticsMetrics
  calculated_at: string // ISO timestamp
}

export interface WeeklyLoadItem {
  week_start: string      // ISO date
  week_end: string        // ISO date
  microcycle_id: string   // UUID
  total_sessions: number
  total_internal_load: number
  avg_rpe: number
  attendance_rate: number
}

export interface WeeklyLoadResponse {
  team_id: string
  weeks: number
  data: WeeklyLoadItem[]
}

export interface DeviationItem {
  session_id: string
  session_at: string      // ISO date
  planned_rpe: number
  actual_rpe: number
  deviation: number
  exceeded_threshold: boolean
}

export interface DeviationAnalysisResponse {
  team_id: string
  threshold_multiplier: number  // Step 15: alert_threshold_multiplier do team
  period: AnalyticsPeriod
  total_sessions: number
  deviation_count: number
  deviations: DeviationItem[]
}

// ============================================================================
// API CLIENT
// ============================================================================

const BASE_URL = '/api/v1/analytics'

/**
 * GET /analytics/team/{teamId}/summary
 * 
 * Retorna métricas agregadas para uma equipe no período.
 * 
 * Estratégia de cache:
 * - Mês corrente: usa cache weekly (por microciclo)
 * - Meses anteriores: usa cache monthly
 * - Recalcula automaticamente se cache_dirty=true
 * 
 * @param teamId - UUID da equipe
 * @param startDate - Data inicial (default: início do mês corrente)
 * @param endDate - Data final (default: hoje)
 */
export async function getTeamSummary(
  teamId: string,
  startDate?: string,
  endDate?: string
): Promise<TeamSummaryResponse> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${BASE_URL}/team/${teamId}/summary${query}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch team summary: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * GET /analytics/team/{teamId}/weekly-load
 * 
 * Retorna carga semanal das últimas N semanas.
 * Ideal para gráficos de progressão.
 * 
 * @param teamId - UUID da equipe
 * @param weeks - Quantidade de semanas (1-52, default: 4)
 */
export async function getWeeklyLoad(
  teamId: string,
  weeks: number = 4
): Promise<WeeklyLoadResponse> {
  const response = await fetch(`${BASE_URL}/team/${teamId}/weekly-load?weeks=${weeks}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch weekly load: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * GET /analytics/team/{teamId}/deviation-analysis
 * 
 * Análise de desvios usando alert_threshold_multiplier da equipe (Step 15).
 * 
 * Cálculo: desvio = |RPE_real - RPE_planejado| × multiplier
 * Lista sessões onde desvio > multiplier
 * 
 * @param teamId - UUID da equipe
 * @param startDate - Data inicial (default: início do mês corrente)
 * @param endDate - Data final (default: hoje)
 */
export async function getDeviationAnalysis(
  teamId: string,
  startDate?: string,
  endDate?: string
): Promise<DeviationAnalysisResponse> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${BASE_URL}/team/${teamId}/deviation-analysis${query}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch deviation analysis: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formata período para display
 * @example formatPeriod({ start: '2024-01-01', end: '2024-01-31' }) → 'Jan 2024'
 */
export function formatPeriod(period: AnalyticsPeriod): string {
  const start = new Date(period.start)
  const end = new Date(period.end)
  
  const startMonth = start.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  const endMonth = end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  
  if (startMonth === endMonth) {
    return startMonth
  }
  
  return `${startMonth} - ${endMonth}`
}

/**
 * Calcula data de início e fim para mês corrente
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

/**
 * Calcula data de início para N meses atrás
 */
export function getMonthsAgoRange(months: number): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - months, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

/**
 * Formata semana para display
 * @example formatWeek('2024-01-22', '2024-01-28') → '22-28 Jan'
 */
export function formatWeek(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const month = startDate.toLocaleDateString('pt-BR', { month: 'short' })
  
  return `${startDay}-${endDay} ${month}`
}

/**
 * Obtém cor baseada no threshold
 * @param value - Valor a verificar
 * @param threshold - Threshold de referência
 * @returns Classe Tailwind de cor
 */
export function getThresholdColor(value: number, threshold: number): string {
  const ratio = value / threshold
  
  if (ratio <= 0.8) return 'text-green-600 dark:text-green-400'
  if (ratio <= 1.0) return 'text-yellow-600 dark:text-yellow-400'
  if (ratio <= 1.2) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * Obtém badge de status wellness response rate
 */
export function getWellnessRateBadge(rate: number | null): {
  color: string
  label: string
  icon: string
} {
  if (rate === null || rate === undefined) {
    return {
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      label: 'Sem dados',
      icon: '📊',
    }
  }
  
  if (rate >= 90) {
    return {
      color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
      label: 'Excelente',
      icon: '🏆',
    }
  }
  
  if (rate >= 70) {
    return {
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
      label: 'Bom',
      icon: '✅',
    }
  }
  
  return {
    color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    label: 'Atenção',
    icon: '⚠️',
  }
}
