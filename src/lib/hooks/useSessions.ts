/**
 * Hook: useSessions
 *
 * Gerencia estado de Training Sessions (Sessões de Treino)
 * Refatorado para usar React Query com mutações otimísticas
 *
 * @see useSessionExercises.ts para padrão de referência
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  TrainingSessionsAPI,
  TrainingSession,
  SessionFilters,
  SessionUpdate,
  DeviationAnalysis,
  FocusValues,
  SessionClosureResponse,
} from '@/lib/api/trainings';
import { sessionKeys } from '@/lib/queryKeys/sessionKeys';

// ============================================================================
// TYPES
// ============================================================================

interface UseSessionsState {
  sessions: TrainingSession[];
  isLoading: boolean;
  error: string | null;
}

interface UseSessionsReturn extends UseSessionsState {
  fetchSessions: (filters?: SessionFilters) => Promise<void>;
  refetch: () => Promise<void>;
  updateSession: (id: string, data: SessionUpdate) => Promise<TrainingSession | null>;
  currentFilters: SessionFilters | null;
}

interface UseSessionDetailState {
  session: TrainingSession | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSessionDetailReturn extends UseSessionDetailState {
  fetchSession: () => Promise<void>;
  refetch: () => Promise<void>;
  updateSession: (data: SessionUpdate) => Promise<TrainingSession | null>;
  updateFocus: (focus: Partial<FocusValues>) => Promise<TrainingSession | null>;
  closeSession: () => Promise<SessionClosureResponse | null>;
}

interface UseSessionDeviationState {
  deviation: DeviationAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSessionDeviationReturn extends UseSessionDeviationState {
  fetchDeviation: () => Promise<void>;
  saveJustification: (justification: string) => Promise<boolean>;
}

// ============================================================================
// NEW HOOKS: React Query Native
// ============================================================================

/**
 * Hook para listar sessões com React Query
 *
 * Features:
 * - Cache automático compartilhado
 * - Polling de segurança (60s)
 * - Invalidação automática
 *
 * @example
 * const { data: sessions, isLoading, error } = useSessionsList({ team_id: 'uuid' });
 */
export function useSessionsList(
  filters?: SessionFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  return useQuery({
    queryKey: sessionKeys.list(filters),
    queryFn: async () => {
      const response = await TrainingSessionsAPI.listSessions(filters || {});
      return response.items;
    },
    staleTime: 60 * 1000, // 60 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: options?.refetchInterval ?? 60 * 1000, // Polling 60s
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para detalhe de sessão específica
 *
 * Compartilha cache com lista - atualizações refletem em todos os componentes
 *
 * @example
 * const { data: session, isLoading } = useSessionDetailQuery('uuid');
 */
export function useSessionDetailQuery(
  sessionId: string,
  options?: {
    enabled?: boolean;
  }
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => TrainingSessionsAPI.getSession(sessionId),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: (options?.enabled ?? true) && !!sessionId,

    // Tenta usar dados da lista como placeholder
    placeholderData: () => {
      const listsData = queryClient.getQueriesData<TrainingSession[]>({
        queryKey: sessionKeys.lists(),
      });

      for (const [, sessions] of listsData) {
        const found = sessions?.find((s) => s.id === sessionId);
        if (found) return found;
      }
      return undefined;
    },
  });
}

/**
 * Mutation para atualizar sessão com optimistic update
 *
 * Pattern idêntico ao useUpdateSessionExercise
 *
 * @example
 * const updateMutation = useUpdateSession();
 * updateMutation.mutate({ sessionId: 'uuid', data: { main_objective: 'Novo objetivo' } });
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: SessionUpdate }) =>
      TrainingSessionsAPI.updateSession(sessionId, data),

    onMutate: async ({ sessionId, data }) => {
      // 1. Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: sessionKeys.all });

      // 2. Snapshot do detalhe
      const previousDetail = queryClient.getQueryData<TrainingSession>(
        sessionKeys.detail(sessionId)
      );

      // 3. Snapshot de todas as listas
      const previousLists = queryClient.getQueriesData<TrainingSession[]>({
        queryKey: sessionKeys.lists(),
      });

      // 4. Optimistic update no detalhe
      if (previousDetail) {
        queryClient.setQueryData<TrainingSession>(sessionKeys.detail(sessionId), {
          ...previousDetail,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      // 5. Optimistic update em todas as listas
      previousLists.forEach(([queryKey]) => {
        queryClient.setQueryData<TrainingSession[]>(queryKey, (old) => {
          if (!old) return old;
          return old.map((session) =>
            session.id === sessionId
              ? { ...session, ...data, updated_at: new Date().toISOString() }
              : session
          );
        });
      });

      return { previousDetail, previousLists };
    },

    onError: (error, { sessionId }, context) => {
      // Rollback detalhe
      if (context?.previousDetail) {
        queryClient.setQueryData(sessionKeys.detail(sessionId), context.previousDetail);
      }

      // Rollback listas
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      toast.error('Erro ao atualizar sessão', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: (updatedSession, { sessionId }) => {
      // Atualiza com dado real do servidor
      queryClient.setQueryData(sessionKeys.detail(sessionId), updatedSession);

      toast.success('Sessão atualizada');
    },

    onSettled: (data, error, { sessionId }) => {
      // Invalida para garantir sincronização
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

/**
 * Mutation especializada para atualizar focos
 * Auto-save friendly com debounce na UI (sem toast para não poluir)
 *
 * @example
 * const updateFocusMutation = useUpdateSessionFocus();
 * updateFocusMutation.mutate({ sessionId: 'uuid', focus: { physical_pct: 35 } });
 */
export function useUpdateSessionFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, focus }: { sessionId: string; focus: Partial<FocusValues> }) =>
      TrainingSessionsAPI.updateSessionFocus(sessionId, focus),

    onMutate: async ({ sessionId, focus }) => {
      await queryClient.cancelQueries({ queryKey: sessionKeys.detail(sessionId) });

      const previousSession = queryClient.getQueryData<TrainingSession>(
        sessionKeys.detail(sessionId)
      );

      if (previousSession) {
        const updatedSession: TrainingSession = {
          ...previousSession,
          focus_attack_positional_pct:
            focus.attack_positional_pct ?? previousSession.focus_attack_positional_pct,
          focus_defense_positional_pct:
            focus.defense_positional_pct ?? previousSession.focus_defense_positional_pct,
          focus_transition_offense_pct:
            focus.transition_offense_pct ?? previousSession.focus_transition_offense_pct,
          focus_transition_defense_pct:
            focus.transition_defense_pct ?? previousSession.focus_transition_defense_pct,
          focus_attack_technical_pct:
            focus.attack_technical_pct ?? previousSession.focus_attack_technical_pct,
          focus_defense_technical_pct:
            focus.defense_technical_pct ?? previousSession.focus_defense_technical_pct,
          focus_physical_pct: focus.physical_pct ?? previousSession.focus_physical_pct,
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<TrainingSession>(
          sessionKeys.detail(sessionId),
          updatedSession
        );
      }

      return { previousSession };
    },

    onError: (error, { sessionId }, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(sessionKeys.detail(sessionId), context.previousSession);
      }
      // Sem toast para auto-save - silencioso
      console.error('Error updating focus:', error);
    },

    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}

/**
 * Mutation para publicar sessão (draft -> scheduled)
 *
 * @example
 * const publishMutation = usePublishSession();
 * publishMutation.mutate('session-uuid');
 */
export function usePublishSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => TrainingSessionsAPI.publishSession(sessionId),

    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: sessionKeys.all });

      const previousSession = queryClient.getQueryData<TrainingSession>(
        sessionKeys.detail(sessionId)
      );

      // Optimistic: muda status para scheduled
      if (previousSession) {
        queryClient.setQueryData<TrainingSession>(sessionKeys.detail(sessionId), {
          ...previousSession,
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        });
      }

      return { previousSession };
    },

    onError: (error, sessionId, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(sessionKeys.detail(sessionId), context.previousSession);
      }

      toast.error('Erro ao publicar sessão', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: (publishedSession, sessionId) => {
      queryClient.setQueryData(sessionKeys.detail(sessionId), publishedSession);
      toast.success('Sessão publicada com sucesso');
    },

    onSettled: (data, error, sessionId) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

/**
 * Mutation para fechar sessão (pending_review -> readonly)
 *
 * @example
 * const closeMutation = useCloseSession();
 * const result = await closeMutation.mutateAsync('session-uuid');
 */
export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => TrainingSessionsAPI.closeSession(sessionId),

    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: sessionKeys.all });

      const previousSession = queryClient.getQueryData<TrainingSession>(
        sessionKeys.detail(sessionId)
      );

      // Optimistic: muda status para readonly
      if (previousSession) {
        queryClient.setQueryData<TrainingSession>(sessionKeys.detail(sessionId), {
          ...previousSession,
          status: 'readonly',
          closed_at: new Date().toISOString(),
        });
      }

      return { previousSession };
    },

    onError: (error, sessionId, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(sessionKeys.detail(sessionId), context.previousSession);
      }

      toast.error('Erro ao fechar sessão', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: (result, sessionId) => {
      if (result.success && result.session) {
        queryClient.setQueryData(sessionKeys.detail(sessionId), result.session);
        toast.success('Sessão fechada com sucesso');
      } else if (result.validation) {
        // Validação falhou - mostra erros
        toast.error('Não foi possível fechar a sessão', {
          description: result.message,
        });
      }
    },

    onSettled: (data, error, sessionId) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

/**
 * Mutation para deletar sessão (soft delete)
 *
 * @example
 * const deleteMutation = useDeleteSession();
 * await deleteMutation.mutateAsync({ sessionId: 'uuid', reason: 'Cancelamento' });
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) =>
      TrainingSessionsAPI.deleteSession(sessionId, reason),

    onMutate: async ({ sessionId }) => {
      // 1. Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: sessionKeys.all });

      // 2. Snapshot de todas as listas para rollback
      const previousLists = queryClient.getQueriesData<TrainingSession[]>({
        queryKey: sessionKeys.lists(),
      });

      // 3. Snapshot do detalhe se existir
      const previousDetail = queryClient.getQueryData<TrainingSession>(
        sessionKeys.detail(sessionId)
      );

      // 4. Optimistic removal de todas as listas
      previousLists.forEach(([queryKey]) => {
        queryClient.setQueryData<TrainingSession[]>(queryKey, (old) =>
          old?.filter((s) => s.id !== sessionId)
        );
      });

      // 5. Remove do cache de detalhe
      queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });

      return { previousLists, previousDetail };
    },

    onError: (error, { sessionId }, context) => {
      // Rollback listas
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      // Rollback detalhe
      if (context?.previousDetail) {
        queryClient.setQueryData(sessionKeys.detail(sessionId), context.previousDetail);
      }

      toast.error('Erro ao excluir sessão', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: () => {
      toast.success('Sessão excluída com sucesso');
    },

    onSettled: () => {
      // Invalida para garantir sincronização
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

/**
 * Mutation para criar nova sessão
 *
 * @example
 * const createMutation = useCreateSessionMutation();
 * const newSession = await createMutation.mutateAsync({ team_id: 'uuid', ... });
 */
export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof TrainingSessionsAPI.createSession>[0]) =>
      TrainingSessionsAPI.createSession(data),

    onSuccess: (newSession) => {
      toast.success('Sessão criada com sucesso');
    },

    onError: (error) => {
      toast.error('Erro ao criar sessão', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

/**
 * Hook para análise de desvio com React Query
 *
 * @example
 * const { data: deviation, isLoading } = useSessionDeviationQuery('uuid');
 */
export function useSessionDeviationQuery(
  sessionId: string,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: sessionKeys.deviation(sessionId),
    queryFn: () => TrainingSessionsAPI.getSessionDeviation(sessionId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: (options?.enabled ?? true) && !!sessionId,
  });
}

/**
 * Mutation para salvar justificativa de desvio
 *
 * @example
 * const saveJustificationMutation = useSaveDeviationJustification();
 * await saveJustificationMutation.mutateAsync({ sessionId: 'uuid', justification: 'texto' });
 */
export function useSaveDeviationJustification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, justification }: { sessionId: string; justification: string }) =>
      TrainingSessionsAPI.saveDeviationJustification(sessionId, justification),

    onSuccess: (updatedSession, { sessionId }) => {
      queryClient.setQueryData(sessionKeys.detail(sessionId), updatedSession);
      toast.success('Justificativa salva');
    },

    onError: (error) => {
      toast.error('Erro ao salvar justificativa', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.deviation(sessionId) });
    },
  });
}

// ============================================================================
// LEGACY HOOKS (Deprecated - Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use useSessionsList instead
 *
 * Hook legado para listar sessões de treinamento
 * Mantido para backward compatibility
 */
export function useSessions(): UseSessionsReturn {
  const [currentFilters, setCurrentFilters] = useState<SessionFilters | null>(null);
  const query = useSessionsList(currentFilters ?? undefined, {
    enabled: !!currentFilters,
    refetchInterval: 60 * 1000,
  });
  const updateMutation = useUpdateSession();

  const fetchSessions = useCallback(async (filters: SessionFilters = {}) => {
    setCurrentFilters(filters);
  }, []);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const updateSession = useCallback(
    async (id: string, data: SessionUpdate): Promise<TrainingSession | null> => {
      try {
        const result = await updateMutation.mutateAsync({ sessionId: id, data });
        return result;
      } catch (err) {
        return null;
      }
    },
    [updateMutation]
  );

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    fetchSessions,
    refetch,
    updateSession,
    currentFilters,
  };
}

/**
 * @deprecated Use useSessionDetailQuery + useUpdateSession instead
 *
 * Hook legado para detalhes de uma sessão específica
 * Mantido para backward compatibility
 */
export function useSessionDetail(
  sessionId: string,
  autoFetch: boolean = true
): UseSessionDetailReturn {
  const query = useSessionDetailQuery(sessionId, { enabled: autoFetch && !!sessionId });
  const updateMutation = useUpdateSession();
  const updateFocusMutation = useUpdateSessionFocus();
  const closeMutation = useCloseSession();

  const fetchSession = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const updateSession = useCallback(
    async (data: SessionUpdate): Promise<TrainingSession | null> => {
      try {
        const result = await updateMutation.mutateAsync({ sessionId, data });
        return result;
      } catch (err) {
        return null;
      }
    },
    [sessionId, updateMutation]
  );

  const updateFocus = useCallback(
    async (focus: Partial<FocusValues>): Promise<TrainingSession | null> => {
      try {
        const result = await updateFocusMutation.mutateAsync({ sessionId, focus });
        return result;
      } catch (err) {
        return null;
      }
    },
    [sessionId, updateFocusMutation]
  );

  const closeSession = useCallback(async (): Promise<SessionClosureResponse | null> => {
    try {
      const result = await closeMutation.mutateAsync(sessionId);
      return result;
    } catch (err) {
      return null;
    }
  }, [sessionId, closeMutation]);

  return {
    session: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    fetchSession,
    refetch,
    updateSession,
    updateFocus,
    closeSession,
  };
}

/**
 * @deprecated Use useSessionDeviationQuery + useSaveDeviationJustification instead
 *
 * Hook legado para análise de desvio planejado vs executado
 * Mantido para backward compatibility
 */
export function useSessionDeviation(
  sessionId: string,
  autoFetch: boolean = false
): UseSessionDeviationReturn {
  const query = useSessionDeviationQuery(sessionId, { enabled: autoFetch && !!sessionId });
  const saveMutation = useSaveDeviationJustification();

  const fetchDeviation = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const saveJustification = useCallback(
    async (justification: string): Promise<boolean> => {
      try {
        await saveMutation.mutateAsync({ sessionId, justification });
        return true;
      } catch (err) {
        return false;
      }
    },
    [sessionId, saveMutation]
  );

  return {
    deviation: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    fetchDeviation,
    saveJustification,
  };
}

/**
 * @deprecated Use useSessionsList with team_id filter instead
 *
 * Hook helper legado para buscar sessões de uma equipe específica
 */
export function useSessionsByTeam(
  teamId: string | undefined,
  additionalFilters: Omit<SessionFilters, 'team_id'> = {}
) {
  const filters = teamId ? { team_id: teamId, ...additionalFilters } : undefined;
  const query = useSessionsList(filters, { enabled: !!teamId });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => query.refetch(),
  };
}

/**
 * @deprecated Use useSessionsList with microcycle_id filter instead
 *
 * Hook helper legado para buscar sessões de um microciclo específico
 */
export function useSessionsByMicrocycle(microcycleId: string | undefined) {
  const filters = microcycleId ? { microcycle_id: microcycleId } : undefined;
  const query = useSessionsList(filters, { enabled: !!microcycleId });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => query.refetch(),
  };
}

/**
 * @deprecated Use useCreateSessionMutation instead
 *
 * Hook legado para criar nova sessão de treino
 */
export function useCreateSession() {
  const createMutation = useCreateSessionMutation();

  return {
    createSession: async (data: any): Promise<TrainingSession | null> => {
      try {
        const result = await createMutation.mutateAsync(data);
        return result;
      } catch (err) {
        return null;
      }
    },
    isCreating: createMutation.isPending,
    error: createMutation.error?.message ?? null,
  };
}
