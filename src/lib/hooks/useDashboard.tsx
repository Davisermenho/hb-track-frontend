import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchWithCacheHeaders, 
  type CacheMetadata 
} from '@/lib/utils/cache-aware-fetch';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardTrainingSession {
  session_id: string;
  session_at: string;
  main_objective: string;
  team_name: string;
  attendance_rate: number;
  avg_internal_load: number;
  presentes: number;
  total_athletes: number;
}

export interface DashboardTrainingTrend {
  period_label: string;
  period_start: string;
  sessions_count: number;
  avg_attendance: number;
  avg_load: number;
}

export interface DashboardData {
  athletes: {
    total: number;
    ativas: number;
    lesionadas: number;
    dispensadas: number;
    dm: number;
  };
  training: {
    total_sessions: number;
    avg_attendance_rate: number;
    recent_sessions: DashboardTrainingSession[];
  };
  training_trends: DashboardTrainingTrend[];
  wellness: {
    avg_sleep_quality: number;
    avg_fatigue: number;
    avg_stress: number;
    avg_mood: number;
    avg_soreness: number;
    readiness_score: number;
    athletes_reported: number;
  } | null;
  medical: {
    active_cases: number;
    recovering: number;
    cleared_this_week: number;
    avg_days_out: number;
  } | null;
  next_training: {
    session_at: string;
    main_objective: string;
  } | null;
  next_match: {
    match_at: string;
    opponent_name: string;
    location: string;
    is_home: boolean;
  } | null;
}

interface UseDashboardOptions {
  teamId?: string;
  seasonId?: string;
}

// =============================================================================
// HOOK
// =============================================================================

export function useDashboard({ teamId, seasonId }: UseDashboardOptions = {}) {
  const queryClient = useQueryClient();
  const [cacheMetadata, setCacheMetadata] = useState<CacheMetadata | null>(null);

  const query = useQuery({
    queryKey: ['dashboard', teamId, seasonId],
    queryFn: async (): Promise<DashboardData> => {
      const params = new URLSearchParams();
      if (teamId) params.append('team_id', teamId);
      if (seasonId) params.append('season_id', seasonId);

      // Cookie HttpOnly enviado automaticamente via credentials: 'include'
      const { data, cache } = await fetchWithCacheHeaders<DashboardData>(
        `${API_BASE_URL}/dashboard/summary?${params.toString()}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setCacheMetadata(cache);
      return data;
    },
    staleTime: cacheMetadata?.ttl || 60_000, // Usa TTL do backend ou 60s
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const forceRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', teamId, seasonId] });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    forceRefresh,
    // Metadata de cache do backend
    cacheAge: cacheMetadata?.cacheAge,
    generatedAt: cacheMetadata?.generatedAt,
    cacheTtl: cacheMetadata?.ttl,
  };
}