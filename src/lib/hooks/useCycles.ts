/**
 * Hook: useCycles
 * 
 * Gerencia estado de Training Cycles (Macrociclos e Mesociclos)
 * Base: TRAINNIG.MD + trainings.ts API
 * Data: 2026-01-04
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  trainingsService,
  TrainingCycle,
  TrainingCycleWithMicrocycles,
  CycleFilters,
  CycleType,
  CycleStatus,
} from '@/lib/api/trainings';

// ============================================================================
// TYPES
// ============================================================================

interface UseCyclesState {
  cycles: TrainingCycle[];
  isLoading: boolean;
  error: string | null;
}

interface UseCyclesReturn extends UseCyclesState {
  fetchCycles: (filters: CycleFilters) => Promise<void>;
  refetch: () => Promise<void>;
  createCycle: (data: any) => Promise<TrainingCycle | null>;
  updateCycle: (id: string, data: any) => Promise<TrainingCycle | null>;
  deleteCycle: (id: string, reason: string) => Promise<boolean>;
  currentFilters: CycleFilters | null;
}

interface UseCycleDetailState {
  cycle: TrainingCycleWithMicrocycles | null;
  isLoading: boolean;
  error: string | null;
}

interface UseCycleDetailReturn extends UseCycleDetailState {
  fetchCycle: () => Promise<void>;
  refetch: () => Promise<void>;
  updateCycle: (data: any) => Promise<TrainingCycleWithMicrocycles | null>;
  deleteCycle: (reason: string) => Promise<boolean>;
}

// ============================================================================
// HOOK: useCycles (Lista)
// ============================================================================

/**
 * Hook para listar ciclos de treinamento
 * 
 * @example
 * const { cycles, isLoading, fetchCycles } = useCycles();
 * useEffect(() => {
 *   fetchCycles({ team_id: 'uuid', type: 'macro' });
 * }, []);
 */
export function useCycles(): UseCyclesReturn {
  const [state, setState] = useState<UseCyclesState>({
    cycles: [],
    isLoading: false,
    error: null,
  });

  const [currentFilters, setCurrentFilters] = useState<CycleFilters | null>(null);

  const fetchCycles = useCallback(async (filters: CycleFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setCurrentFilters(filters);

    try {
      const data = await trainingsService.getCycles(filters);
      setState({
        cycles: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ciclos';
      setState({
        cycles: [],
        isLoading: false,
        error: errorMessage,
      });
      console.error('Error fetching cycles:', err);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (currentFilters) {
      await fetchCycles(currentFilters);
    }
  }, [currentFilters, fetchCycles]);

  const createCycle = useCallback(async (data: any): Promise<TrainingCycle | null> => {
    try {
      const newCycle = await trainingsService.createCycle(data);
      // Atualiza lista localmente
      setState(prev => ({
        ...prev,
        cycles: [newCycle, ...prev.cycles],
      }));
      return newCycle;
    } catch (err) {
      console.error('Error creating cycle:', err);
      return null;
    }
  }, []);

  const updateCycle = useCallback(async (id: string, data: any): Promise<TrainingCycle | null> => {
    try {
      const updatedCycle = await trainingsService.updateCycle(id, data);
      // Atualiza lista localmente
      setState(prev => ({
        ...prev,
        cycles: prev.cycles.map(c => c.id === id ? updatedCycle : c),
      }));
      return updatedCycle;
    } catch (err) {
      console.error('Error updating cycle:', err);
      return null;
    }
  }, []);

  const deleteCycle = useCallback(async (id: string, reason: string): Promise<boolean> => {
    try {
      await trainingsService.deleteCycle(id, reason);
      // Remove da lista localmente
      setState(prev => ({
        ...prev,
        cycles: prev.cycles.filter(c => c.id !== id),
      }));
      return true;
    } catch (err) {
      console.error('Error deleting cycle:', err);
      return false;
    }
  }, []);

  return {
    cycles: state.cycles,
    isLoading: state.isLoading,
    error: state.error,
    fetchCycles,
    refetch,
    createCycle,
    updateCycle,
    deleteCycle,
    currentFilters,
  };
}

// ============================================================================
// HOOK: useCycleDetail (Detalhe)
// ============================================================================

/**
 * Hook para detalhes de um ciclo específico
 * 
 * @param cycleId - ID do ciclo
 * @param autoFetch - Se deve buscar automaticamente (default: true)
 * 
 * @example
 * const { cycle, isLoading, updateCycle } = useCycleDetail('uuid');
 */
export function useCycleDetail(
  cycleId: string,
  autoFetch: boolean = true
): UseCycleDetailReturn {
  const [state, setState] = useState<UseCycleDetailState>({
    cycle: null,
    isLoading: autoFetch,
    error: null,
  });

  const fetchCycle = useCallback(async () => {
    if (!cycleId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await trainingsService.getCycle(cycleId);
      setState({
        cycle: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ciclo';
      setState({
        cycle: null,
        isLoading: false,
        error: errorMessage,
      });
      console.error('Error fetching cycle:', err);
    }
  }, [cycleId]);

  const refetch = useCallback(async () => {
    await fetchCycle();
  }, [fetchCycle]);

  const updateCycle = useCallback(async (data: any): Promise<TrainingCycleWithMicrocycles | null> => {
    try {
      const updated = await trainingsService.updateCycle(cycleId, data);
      // Atualiza estado local com dados atualizados
      setState(prev => ({
        ...prev,
        cycle: prev.cycle ? { ...prev.cycle, ...updated } : null,
      }));
      return updated as TrainingCycleWithMicrocycles;
    } catch (err) {
      console.error('Error updating cycle:', err);
      return null;
    }
  }, [cycleId]);

  const deleteCycle = useCallback(async (reason: string): Promise<boolean> => {
    try {
      await trainingsService.deleteCycle(cycleId, reason);
      setState(prev => ({ ...prev, cycle: null }));
      return true;
    } catch (err) {
      console.error('Error deleting cycle:', err);
      return false;
    }
  }, [cycleId]);

  // Auto-fetch ao montar (se habilitado)
  useEffect(() => {
    if (autoFetch && cycleId) {
      const fetch = () => fetchCycle();
      fetch();
    }
  }, [autoFetch, cycleId, fetchCycle]);

  return {
    cycle: state.cycle,
    isLoading: state.isLoading,
    error: state.error,
    fetchCycle,
    refetch,
    updateCycle,
    deleteCycle,
  };
}

// ============================================================================
// HOOK: useActiveCycles (Ciclos Ativos)
// ============================================================================

/**
 * Hook para buscar ciclos ativos de uma equipe
 * 
 * @param teamId - ID da equipe
 * 
 * @example
 * const { activeCycles, isLoading } = useActiveCycles('team-uuid');
 */
export function useActiveCycles(teamId: string | undefined) {
  const [activeCycles, setActiveCycles] = useState<TrainingCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCycles = useCallback(async () => {
    if (!teamId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await trainingsService.getActiveCycles(teamId);
      setActiveCycles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ciclos ativos';
      setError(errorMessage);
      console.error('Error fetching active cycles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchActiveCycles();
  }, [fetchActiveCycles]);

  return {
    activeCycles,
    isLoading,
    error,
    refetch: fetchActiveCycles,
  };
}
