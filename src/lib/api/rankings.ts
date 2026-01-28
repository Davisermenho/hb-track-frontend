/**
 * Rankings API Layer
 * 
 * Endpoints para rankings de equipes por taxa de resposta wellness
 * Step 28.2: Implementação de features restantes
 */

import { apiClient } from './client';

// ========================================
// Interfaces
// ========================================

export interface TeamRanking {
  team_id: number;
  team_name: string;
  response_rate_pre: number;
  response_rate_post: number;
  avg_rate: number;
  rank: number;
  athletes_90plus: number;
  calculated_at: string;
}

export interface RankingsResponse {
  rankings: TeamRanking[];
  month: string;
  total: number;
}

export interface Athlete90Plus {
  athlete_id: number;
  athlete_name: string;
  response_rate: number;
  badge_earned: boolean;
}

export interface Athletes90PlusResponse {
  athletes: Athlete90Plus[];
  team_id: number;
  team_name: string;
  month: string;
  total: number;
}

// ========================================
// API Functions
// ========================================

/**
 * Buscar rankings de equipes por taxa de resposta wellness
 * 
 * @param month - Mês de referência (YYYY-MM) ou undefined para mês anterior
 * @param limit - Limite de resultados (padrão: 50)
 * @returns Lista de rankings ordenada por avg_rate DESC
 */
export async function getWellnessRankings(
  month?: string,
  limit = 50
): Promise<RankingsResponse> {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  params.append('limit', String(limit));

  const rankings = await apiClient.get<TeamRanking[]>(
    `/analytics/wellness-rankings?${params.toString()}`
  );

  return {
    rankings,
    month: month || 'previous',
    total: rankings.length,
  };
}

/**
 * Buscar atletas com taxa de resposta >= 90% em uma equipe
 * 
 * @param teamId - ID da equipe
 * @param month - Mês de referência (YYYY-MM)
 * @returns Lista de atletas 90%+ ordenada por response_rate DESC
 */
export async function getTeamAthletes90Plus(
  teamId: number,
  month: string
): Promise<Athletes90PlusResponse> {
  const athletes = await apiClient.get<Athlete90Plus[]>(
    `/analytics/wellness-rankings/${teamId}/athletes-90plus`,
    { params: { month } }
  );

  // Buscar nome da equipe (assumindo que vem no header ou contexto)
  // TODO: Se necessário, fazer query adicional para buscar nome do team
  const teamName = 'Equipe'; // Placeholder

  return {
    athletes,
    team_id: teamId,
    team_name: teamName,
    month,
    total: athletes.length,
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Formatar taxa de resposta para display
 * 
 * @param rate - Taxa de resposta (0-100)
 * @returns String formatada com % e cor semântica
 */
export function formatResponseRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Obter cor baseada na taxa de resposta
 * 
 * @param rate - Taxa de resposta (0-100)
 * @returns Classe Tailwind para cor
 */
export function getResponseRateColor(rate: number): string {
  if (rate >= 90) return 'text-green-600 dark:text-green-400';
  if (rate >= 80) return 'text-blue-600 dark:text-blue-400';
  if (rate >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (rate >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Obter ícone baseado no rank
 * 
 * @param rank - Posição no ranking (1, 2, 3, ...)
 * @returns Emoji de medalha ou posição
 */
export function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}º`;
}

/**
 * Obter badge color baseado na taxa
 * 
 * @param rate - Taxa de resposta (0-100)
 * @returns Classe Tailwind para badge
 */
export function getRateBadgeColor(rate: number): string {
  if (rate >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (rate >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (rate >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (rate >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

/**
 * Formatar mês de referência para display
 * 
 * @param month - Mês no formato YYYY-MM
 * @returns String formatada "Janeiro de 2026"
 */
export function formatMonthReference(month: string): string {
  try {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  } catch {
    return month;
  }
}

/**
 * Calcular variação percentual entre dois rankings
 * 
 * @param current - Rank atual
 * @param previous - Rank anterior
 * @returns Objeto com variação e direção
 */
export function calculateRankChange(
  current: number,
  previous: number
): { change: number; direction: 'up' | 'down' | 'same' } {
  const change = previous - current; // Positivo = subiu no ranking
  
  if (change > 0) return { change, direction: 'up' };
  if (change < 0) return { change: Math.abs(change), direction: 'down' };
  return { change: 0, direction: 'same' };
}
