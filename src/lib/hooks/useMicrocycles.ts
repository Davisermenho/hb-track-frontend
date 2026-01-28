/**
 * Hook: useMicrocycles
 * 
 * Gerencia estado de Training Microcycles (Planejamento semanal)
 * Base: TRAINNIG.MD + trainings.ts API
 * Data: 2026-01-04
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  trainingsService,
  TrainingMicrocycle,
  TrainingMicrocycleWithSessions,
  MicrocycleFilters,
  MicrocycleCreate,
  MicrocycleUpdate,
} from '@/lib/api/trainings';

// ============================================================================
// TYPES
// ============================================================================

interface UseMicrocyclesState {
  microcycles: TrainingMicrocycle[];
  isLoading: boolean;
  error: string | null;
}

interface UseMicrocyclesReturn extends UseMicrocyclesState {
  fetchMicrocycles: (filters: MicrocycleFilters) => Promise<void>;
  refetch: () => Promise<void>;
  createMicrocycle: (data: MicrocycleCreate) => Promise<TrainingMicrocycle | null>;
  updateMicrocycle: (id: string, data: MicrocycleUpdate) => Promise<TrainingMicrocycle | null>;
  deleteMicrocycle: (id: string, reason: string) => Promise<boolean>;
  currentFilters: MicrocycleFilters | null;
}

interface UseMicrocycleDetailState {
  microcycle: TrainingMicrocycleWithSessions | null;
  isLoading: boolean;
  error: string | null;
}

interface UseMicrocycleDetailReturn extends UseMicrocycleDetailState {
  fetchMicrocycle: () => Promise<void>;
  refetch: () => Promise<void>;
  updateMicrocycle: (data: MicrocycleUpdate) => Promise<TrainingMicrocycleWithSessions | null>;
  deleteMicrocycle: (reason: string) => Promise<boolean>;
}

// ============================================================================
// HOOK: useMicrocycles (Lista)
// ============================================================================

/**
 * Hook para listar microciclos (planejamento semanal)
 * 
 * @example
 * const { microcycles, isLoading, fetchMicrocycles } = useMicrocycles();
 * useEffect(() => {
 *   fetchMicrocycles({ team_id: 'uuid', cycle_id: 'cycle-uuid' });
 * }, []);
 */
export function useMicrocycles(): UseMicrocyclesReturn {
  const [state, setState] = useState<UseMicrocyclesState>({
    microcycles: [],
    isLoading: false,
    error: null,
  });

  const [currentFilters, setCurrentFilters] = useState<MicrocycleFilters | null>(null);

  const fetchMicrocycles = useCallback(async (filters: MicrocycleFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setCurrentFilters(filters);

    try {
      const data = await trainingsService.getMicrocycles(filters);
      setState({
        microcycles: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar microciclos';
      setState({
        microcycles: [],
        isLoading: false,
        error: errorMessage,
      });
      console.error('Error fetching microcycles:', err);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (currentFilters) {
      await fetchMicrocycles(currentFilters);
    }
  }, [currentFilters, fetchMicrocycles]);

  const createMicrocycle = useCallback(async (data: MicrocycleCreate): Promise<TrainingMicrocycle | null> => {
    try {
      const newMicrocycle = await trainingsService.createMicrocycle(data);
      // Atualiza lista localmente
      setState(prev => ({
        ...prev,
        microcycles: [newMicrocycle, ...prev.microcycles],
      }));
      return newMicrocycle;
    } catch (err) {
      console.error('Error creating microcycle:', err);
      return null;
    }
  }, []);

  const updateMicrocycle = useCallback(async (id: string, data: MicrocycleUpdate): Promise<TrainingMicrocycle | null> => {
    try {
      const updated = await trainingsService.updateMicrocycle(id, data);
      // Atualiza lista localmente
      setState(prev => ({
        ...prev,
        microcycles: prev.microcycles.map(m => m.id === id ? updated : m),
      }));
      return updated;
    } catch (err) {
      console.error('Error updating microcycle:', err);
      return null;
    }
  }, []);

  const deleteMicrocycle = useCallback(async (id: string, reason: string): Promise<boolean> => {
    try {
      await trainingsService.deleteMicrocycle(id, reason);
      // Remove da lista localmente
      setState(prev => ({
        ...prev,
        microcycles: prev.microcycles.filter(m => m.id !== id),
      }));
      return true;
    } catch (err) {
      console.error('Error deleting microcycle:', err);
      return false;
    }
  }, []);

  return {
    microcycles: state.microcycles,
    isLoading: state.isLoading,
    error: state.error,
    fetchMicrocycles,
    refetch,
    createMicrocycle,
    updateMicrocycle,
    deleteMicrocycle,
    currentFilters,
  };
}

// ============================================================================
// HOOK: useMicrocycleDetail (Detalhe)
// ============================================================================

/**
 * Hook para detalhes de um microciclo específico (com sessões)
 * 
 * @param microcycleId - ID do microciclo
 * @param autoFetch - Se deve buscar automaticamente (default: true)
 * 
 * @example
 * const { microcycle, isLoading, updateMicrocycle } = useMicrocycleDetail('uuid');
 */
export function useMicrocycleDetail(
  microcycleId: string,
  autoFetch: boolean = true
): UseMicrocycleDetailReturn {
  const [state, setState] = useState<UseMicrocycleDetailState>({
    microcycle: null,
    isLoading: autoFetch,
    error: null,
  });

  const fetchMicrocycle = useCallback(async () => {
    if (!microcycleId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await trainingsService.getMicrocycle(microcycleId);
      setState({
        microcycle: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar microciclo';
      setState({
        microcycle: null,
        isLoading: false,
        error: errorMessage,
      });
      console.error('Error fetching microcycle:', err);
    }
  }, [microcycleId]);

  const refetch = useCallback(async () => {
    await fetchMicrocycle();
  }, [fetchMicrocycle]);

  const updateMicrocycle = useCallback(async (data: MicrocycleUpdate): Promise<TrainingMicrocycleWithSessions | null> => {
    try {
      const updated = await trainingsService.updateMicrocycle(microcycleId, data);
      // Atualiza estado local
      setState(prev => ({
        ...prev,
        microcycle: prev.microcycle ? { ...prev.microcycle, ...updated } : null,
      }));
      return updated as TrainingMicrocycleWithSessions;
    } catch (err) {
      console.error('Error updating microcycle:', err);
      return null;
    }
  }, [microcycleId]);

  const deleteMicrocycle = useCallback(async (reason: string): Promise<boolean> => {
    try {
      await trainingsService.deleteMicrocycle(microcycleId, reason);
      setState(prev => ({ ...prev, microcycle: null }));
      return true;
    } catch (err) {
      console.error('Error deleting microcycle:', err);
      return false;
    }
  }, [microcycleId]);

  // Auto-fetch ao montar (se habilitado)
  useEffect(() => {
    if (autoFetch && microcycleId) {
      const fetch = () => fetchMicrocycle();
      fetch();
    }
  }, [autoFetch, microcycleId, fetchMicrocycle]);

  return {
    microcycle: state.microcycle,
    isLoading: state.isLoading,
    error: state.error,
    fetchMicrocycle,
    refetch,
    updateMicrocycle,
    deleteMicrocycle,
  };
}

// ============================================================================
// HOOK: useCurrentMicrocycle (Semana Atual)
// ============================================================================

/**
 * Hook para buscar microciclo da semana atual de uma equipe
 * 
 * @param teamId - ID da equipe
 * 
 * @example
 * const { currentMicrocycle, isLoading } = useCurrentMicrocycle('team-uuid');
 */
export function useCurrentMicrocycle(teamId: string | undefined) {
  const [currentMicrocycle, setCurrentMicrocycle] = useState<TrainingMicrocycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentMicrocycle = useCallback(async () => {
    if (!teamId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await trainingsService.getCurrentMicrocycle(teamId);
      setCurrentMicrocycle(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar microciclo atual';
      setError(errorMessage);
      setCurrentMicrocycle(null);
      console.error('Error fetching current microcycle:', err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchCurrentMicrocycle();
  }, [fetchCurrentMicrocycle]);

  return {
    currentMicrocycle,
    isLoading,
    error,
    refetch: fetchCurrentMicrocycle,
  };
}

// ============================================================================
// HOOK: useMicrocycleSummary (Resumo Analítico)
// ============================================================================

/**
 * Hook para resumo analítico de um microciclo
 * 
 * @param microcycleId - ID do microciclo
 * 
 * @example
 * const { summary, isLoading } = useMicrocycleSummary('micro-uuid');
 */
export function useMicrocycleSummary(microcycleId: string | undefined) {
  const [summary, setSummary] = useState<TrainingMicrocycleWithSessions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!microcycleId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await trainingsService.getMicrocycleSummary(microcycleId);
      setSummary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar resumo';
      setError(errorMessage);
      console.error('Error fetching microcycle summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [microcycleId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary,
  };
}
