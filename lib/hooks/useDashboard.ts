/**
 * Hook para o Dashboard com cache otimizado
 *
 * Princípios de performance:
 * 1. staleTime: 60s (dados são considerados "frescos" por 1 minuto)
 * 2. keepPreviousData: true (mostra dados antigos enquanto busca novos)
 * 3. refetchOnWindowFocus: true (atualiza quando volta para a aba)
 * 4. retry: 2 (tenta novamente em caso de erro)
 *
 * O backend já faz cache de 120s, então o frontend pode ser mais agressivo.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

// =============================================================================
// TIPOS
// =============================================================================

export interface DashboardAthleteStats {
  total: number;
  ativas: number;
  lesionadas: number;
  dispensadas: number;
  dm: number;
}

export interface DashboardTrainingSession {
  session_id: string;
  session_at: string;
  main_objective?: string;
  team_name?: string;
  presentes: number;
  total_athletes: number;
  attendance_rate: number;
  avg_internal_load?: number;
}

export interface DashboardTrainingStats {
  total_sessions: number;
  avg_attendance_rate: number;
  avg_internal_load: number;
  recent_sessions: DashboardTrainingSession[];
}

export interface DashboardTrainingTrend {
  period_start: string;
  period_label: string;
  sessions_count: number;
  avg_attendance: number;
  avg_load: number;
}

export interface DashboardMatchStats {
  total_matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  recent_matches: any[];
  next_match?: {
    match_id: string;
    match_at: string;
    opponent_name?: string;
    location?: string;
    is_home: boolean;
  };
}

export interface DashboardWellnessStats {
  avg_sleep_quality: number;
  avg_fatigue: number;
  avg_stress: number;
  avg_mood: number;
  avg_soreness: number;
  readiness_score: number;
  athletes_reported: number;
  athletes_at_risk: number;
}

export interface DashboardMedicalStats {
  active_cases: number;
  recovering: number;
  cleared_this_week: number;
  avg_days_out: number;
}

export interface DashboardAlert {
  alert_id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  created_at: string;
  athlete_id?: string;
  athlete_name?: string;
}

export interface DashboardNextTraining {
  session_id?: string;
  session_at?: string;
  main_objective?: string;
  team_name?: string;
}

export interface DashboardSummary {
  team_id?: string;
  team_name?: string;
  season_id?: string;
  season_name?: string;
  generated_at: string;
  cache_ttl_seconds: number;

  athletes: DashboardAthleteStats;
  training: DashboardTrainingStats;
  training_trends: DashboardTrainingTrend[];
  matches: DashboardMatchStats;
  wellness: DashboardWellnessStats;
  medical: DashboardMedicalStats;
  alerts: DashboardAlert[];

  next_training?: DashboardNextTraining;
  next_match?: DashboardMatchStats['next_match'];
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Tempos de cache
const STALE_TIME = 60 * 1000; // 60 segundos
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

// =============================================================================
// FUNÇÕES DE FETCH
// =============================================================================

async function fetchDashboardSummary(
  teamId?: string,
  seasonId?: string,
  skipCache = false
): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (teamId) params.append('team_id', teamId);
  if (seasonId) params.append('season_id', seasonId);
  if (skipCache) params.append('skip_cache', 'true');

  const url = `${API_BASE_URL}/dashboard/summary${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Dashboard fetch failed: ${response.status}`);
  }

  return response.json();
}

async function invalidateDashboardCache(teamId?: string): Promise<void> {
  const params = new URLSearchParams();
  if (teamId) params.append('team_id', teamId);

  const url = `${API_BASE_URL}/dashboard/invalidate-cache${params.toString() ? '?' + params.toString() : ''}`;

  await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

interface UseDashboardOptions {
  teamId?: string;
  seasonId?: string;
  enabled?: boolean;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { teamId, seasonId, enabled = true } = options;
  const queryClient = useQueryClient();

  const queryKey = ['dashboard', teamId || 'all', seasonId || 'current'];

  const query = useQuery<DashboardSummary>({
    queryKey,
    queryFn: () => fetchDashboardSummary(teamId, seasonId),
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Mantém dados anteriores enquanto busca novos
    placeholderData: (previousData: DashboardSummary | undefined) => previousData,
  });

  // Função para forçar refresh
  const forceRefresh = async () => {
    await fetchDashboardSummary(teamId, seasonId, true);
    queryClient.invalidateQueries({ queryKey });
  };

  // Função para invalidar cache no backend
  const invalidateBackendCache = async () => {
    await invalidateDashboardCache(teamId);
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    ...query,
    forceRefresh,
    invalidateBackendCache,
  };
}

// =============================================================================
// HOOKS ESPECIALIZADOS
// =============================================================================

/**
 * Hook para estatísticas de atletas apenas
 */
export function useDashboardAthletes(teamId?: string) {
  const { data, isLoading, error } = useDashboard({ teamId });
  return {
    athletes: data?.athletes,
    isLoading,
    error,
  };
}

/**
 * Hook para estatísticas de treino apenas
 */
export function useDashboardTraining(teamId?: string) {
  const { data, isLoading, error } = useDashboard({ teamId });
  return {
    training: data?.training,
    trends: data?.training_trends,
    nextTraining: data?.next_training,
    isLoading,
    error,
  };
}

/**
 * Hook para wellness apenas
 */
export function useDashboardWellness(teamId?: string) {
  const { data, isLoading, error } = useDashboard({ teamId });
  return {
    wellness: data?.wellness,
    isLoading,
    error,
  };
}

/**
 * Hook para alertas apenas
 */
export function useDashboardAlerts(teamId?: string) {
  const { data, isLoading, error } = useDashboard({ teamId });
  return {
    alerts: data?.alerts || [],
    isLoading,
    error,
  };
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default useDashboard;
