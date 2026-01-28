/**
 * API Client: Prevention Effectiveness (Step 22)
 * 
 * Análise de eficácia preventiva - correlação alertas→sugestões→lesões
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface PreventionSummary {
  total_alerts: number;
  total_suggestions: number;
  suggestions_applied: number;
  suggestions_rejected: number;
  suggestions_pending: number;
  total_injuries: number;
  injury_reduction_rate: number;
  alerts_effectiveness_pct: number;
}

export interface ComparisonData {
  injury_rate_with_action: number;
  injury_rate_without_action: number;
  reduction_achieved: number;
  sample_size_with_action: number;
  sample_size_without_action: number;
}

export interface TimelineEvent {
  type: 'alert' | 'suggestion' | 'injury';
  date: string;
  // Alert fields
  alert_type?: string;
  severity?: string;
  message?: string;
  // Suggestion fields
  suggestion_type?: string;
  action?: string;
  status?: 'applied' | 'rejected' | 'pending';
  applied_at?: string | null;
  rejected_at?: string | null;
  // Injury fields
  reason?: string;
  athlete_id?: string;
  id: string;
}

export interface CategoryBreakdown {
  [category: string]: {
    total_alerts: number;
    suggestions_generated: number;
    suggestions_applied: number;
    injuries_after: number;
  };
}

export interface PreventionEffectivenessResponse {
  team_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: PreventionSummary;
  comparison: ComparisonData;
  timeline: TimelineEvent[];
  by_category: CategoryBreakdown;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Busca dados de eficácia preventiva
 * 
 * @param teamId - ID da equipe
 * @param startDate - Data início (YYYY-MM-DD)
 * @param endDate - Data fim (YYYY-MM-DD)
 * @param category - Filtro por categoria de alerta (opcional)
 * @returns Dados de eficácia preventiva
 * 
 * @example
 * ```ts
 * const data = await getPreventionEffectiveness(teamId, '2026-01-01', '2026-01-31');
 * console.log(data.summary.injury_reduction_rate); // 45.5%
 * ```
 */
export async function getPreventionEffectiveness(
  teamId: string,
  startDate?: string,
  endDate?: string,
  category?: string
): Promise<PreventionEffectivenessResponse> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (category) params.category = category;

  // teamId já é UUID em string format
  return apiClient.get(
    `/analytics/team/${teamId}/prevention-effectiveness`,
    { params }
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formata taxa de redução para exibição
 * 
 * @param rate - Taxa de redução (0-100)
 * @returns String formatada com % e sinal
 * 
 * @example
 * ```ts
 * formatReductionRate(45.5) // "+45.5%"
 * formatReductionRate(-5.2) // "-5.2%"
 * ```
 */
export function formatReductionRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

/**
 * Determina cor baseada em taxa de redução
 * 
 * @param rate - Taxa de redução
 * @returns Classe Tailwind de cor
 */
export function getReductionColor(rate: number): string {
  if (rate >= 50) return 'text-green-600 dark:text-green-400';
  if (rate >= 20) return 'text-blue-600 dark:text-blue-400';
  if (rate >= 0) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Determina cor baseada em tipo de evento
 * 
 * @param type - Tipo de evento (alert, suggestion, injury)
 * @returns Classe Tailwind de cor
 */
export function getEventColor(type: TimelineEvent['type']): string {
  switch (type) {
    case 'alert':
      return 'bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'suggestion':
      return 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'injury':
      return 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
}

/**
 * Formata categoria de alerta para português
 * 
 * @param category - Categoria em inglês
 * @returns Label em português
 */
export function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    'weekly_overload': 'Sobrecarga Semanal',
    'low_wellness_response': 'Baixa Resposta Wellness',
    'critical_wellness': 'Wellness Crítico',
    'recovery_insufficient': 'Recuperação Insuficiente',
  };
  return labels[category] || category;
}

/**
 * Calcula eficácia geral (% alertas que geraram ação)
 * 
 * @param summary - Dados summary
 * @returns Eficácia em % (0-100)
 */
export function calculateOverallEffectiveness(summary: PreventionSummary): number {
  if (summary.total_alerts === 0) return 0;
  return (summary.suggestions_applied / summary.total_alerts) * 100;
}
