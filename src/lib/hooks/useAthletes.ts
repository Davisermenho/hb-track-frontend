/**
 * Hook para gerenciamento de atletas
 * 
 * Baseado em: REGRAS_GERENCIAMENTO_ATLETAS.md
 * Usa a API client existente (fetch nativo com cache)
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type {
  Athlete,
  AthleteExpanded,
  AthleteFilters,
  AthletesListResponse,
  AthleteCreateInput,
  AthleteUpdateInput,
  AthleteDashboardStats,
} from '../../types/athlete-canonical';

// ============================================================================
// TIPOS DO HOOK
// ============================================================================

interface UseAthletesState {
  athletes: AthleteExpanded[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface UseAthletesReturn extends UseAthletesState {
  // Ações
  fetchAthletes: (filters?: AthleteFilters) => Promise<void>;
  refetch: () => Promise<void>;
  
  // Filtros atuais
  currentFilters: AthleteFilters;
  setFilters: (filters: AthleteFilters) => void;
}

interface UseAthleteReturn {
  athlete: AthleteExpanded | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAthleteStatsReturn {
  stats: AthleteDashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK: useAthletes (lista)
// ============================================================================

export function useAthletes(initialFilters: AthleteFilters = {}): UseAthletesReturn {
  const [state, setState] = useState<UseAthletesState>({
    athletes: [],
    total: 0,
    isLoading: true,
    error: null,
  });
  
  const [currentFilters, setFilters] = useState<AthleteFilters>(initialFilters);

  const fetchAthletes = useCallback(async (filters: AthleteFilters = currentFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiClient.get<AthletesListResponse>('/athletes', {
        params: {
          skip: filters.skip || 0,
          limit: filters.limit || 20,
          search: filters.search,
          state: Array.isArray(filters.state) ? filters.state.join(',') : filters.state,
          organization_id: filters.organization_id,
          team_id: filters.team_id,
          category_id: filters.category_id,
          order_by: filters.order_by || 'name',
          order_dir: filters.order_dir || 'asc',
        },
      });
      
      setState({
        athletes: response.items || [],
        total: response.total || 0,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[useAthletes] Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao carregar atletas',
      }));
    }
  }, [currentFilters]);

  // Carrega ao montar ou quando filtros mudam
  useEffect(() => {
    fetchAthletes(currentFilters);
  }, [currentFilters, fetchAthletes]);

  const refetch = useCallback(() => fetchAthletes(currentFilters), [fetchAthletes, currentFilters]);

  return {
    ...state,
    fetchAthletes,
    refetch,
    currentFilters,
    setFilters,
  };
}

// ============================================================================
// HOOK: useAthlete (individual)
// ============================================================================

export function useAthlete(athleteId: string | null): UseAthleteReturn {
  const [athlete, setAthlete] = useState<AthleteExpanded | null>(null);
  const [isLoading, setIsLoading] = useState(!!athleteId);
  const [error, setError] = useState<string | null>(null);

  const fetchAthlete = useCallback(async () => {
    if (!athleteId) {
      setAthlete(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<AthleteExpanded>(`/athletes/${athleteId}`);
      setAthlete(data);
    } catch (err: any) {
      console.error('[useAthlete] Error:', err);
      setError(err.message || 'Erro ao carregar atleta');
      setAthlete(null);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    fetchAthlete();
  }, [fetchAthlete]);

  return {
    athlete,
    isLoading,
    error,
    refetch: fetchAthlete,
  };
}

// ============================================================================
// HOOK: useAthleteStats (dashboard)
// ============================================================================

export function useAthleteStats(organizationId?: string): UseAthleteStatsReturn {
  const [stats, setStats] = useState<AthleteDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = organizationId ? { organization_id: organizationId } : {};
      const data = await apiClient.get<AthleteDashboardStats>('/athletes/stats', { params });
      setStats(data);
    } catch (err: any) {
      console.error('[useAthleteStats] Error:', err);
      setError(err.message || 'Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// ============================================================================
// HOOK: useAthleteMutations (criar, atualizar, deletar)
// ============================================================================

interface UseAthleteMutationsReturn {
  createAthlete: (data: AthleteCreateInput) => Promise<Athlete>;
  updateAthlete: (id: string, data: AthleteUpdateInput) => Promise<Athlete>;
  deleteAthlete: (id: string, reason: string) => Promise<void>;
  changeState: (id: string, newState: 'ativa' | 'dispensada' | 'arquivada', reason?: string) => Promise<Athlete>;
  setFlag: (id: string, flag: 'injured' | 'medical_restriction' | 'load_restricted', value: boolean) => Promise<Athlete>;
  setSuspension: (id: string, until: string | null) => Promise<Athlete>;
  isLoading: boolean;
  error: string | null;
}

export function useAthleteMutations(): UseAthleteMutationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any): never => {
    const message = err.message || 'Operação falhou';
    setError(message);
    throw new Error(message);
  };

  const createAthlete = async (data: AthleteCreateInput): Promise<Athlete> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.post<Athlete>('/athletes', data);
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAthlete = async (id: string, data: AthleteUpdateInput): Promise<Athlete> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.patch<Athlete>(`/athletes/${id}`, data);
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAthlete = async (id: string, reason: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/athletes/${id}`, { data: { reason } });
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const changeState = async (
    id: string,
    newState: 'ativa' | 'dispensada' | 'arquivada',
    reason?: string
  ): Promise<Athlete> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.patch<Athlete>(`/athletes/${id}`, {
        state: newState,
        ...(reason && { admin_note: reason }),
      });
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const setFlag = async (
    id: string,
    flag: 'injured' | 'medical_restriction' | 'load_restricted',
    value: boolean
  ): Promise<Athlete> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.patch<Athlete>(`/athletes/${id}`, {
        [flag]: value,
      });
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const setSuspension = async (id: string, until: string | null): Promise<Athlete> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.patch<Athlete>(`/athletes/${id}`, {
        suspended_until: until,
      });
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createAthlete,
    updateAthlete,
    deleteAthlete,
    changeState,
    setFlag,
    setSuspension,
    isLoading,
    error,
  };
}

// ============================================================================
// HOOK: useCaptacaoCount (badge dinâmico da sidebar)
// ============================================================================

export function useCaptacaoCount(): { count: number; isLoading: boolean } {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await apiClient.get<{ count: number }>('/athletes/count', {
          params: { organization_id: 'null' }, // Atletas sem organização = em captação
        });
        setCount(response.count || 0);
      } catch {
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
    
    // Atualiza a cada 1 minuto
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return { count, isLoading };
}
