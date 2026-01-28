/**
 * React Query Hooks for Session Exercises (Training Module - Step 21)
 * 
 * Provides optimistic updates, cache invalidation, and automatic refetching
 * for session exercises CRUD operations.
 * 
 * @module useSessionExercises
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/lib/api/session-exercises';

// ============================================================================
// Query Keys
// ============================================================================

export const sessionExercisesKeys = {
  all: ['session-exercises'] as const,
  lists: () => [...sessionExercisesKeys.all, 'list'] as const,
  list: (sessionId: string) => [...sessionExercisesKeys.lists(), sessionId] as const,
  detail: (exerciseId: string) => [...sessionExercisesKeys.all, 'detail', exerciseId] as const,
};

// ============================================================================
// Query Hook
// ============================================================================

/**
 * Fetch session exercises with automatic caching
 * 
 * Stale time: 3 minutes (exercises don't change frequently during session planning)
 * Cache time: 10 minutes
 * 
 * @param sessionId - Training session UUID
 * @param options - React Query options (enabled, onSuccess, etc)
 * @returns Query result with exercises list
 * 
 * @example
 * ```tsx
 * function SessionExercisesList({ sessionId }: Props) {
 *   const { data, isLoading, error } = useSessionExercises(sessionId);
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorState />;
 *   
 *   return (
 *     <div>
 *       <p>Total: {data.total_exercises} exercícios ({data.total_duration_minutes}min)</p>
 *       {data.exercises.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionExercises(
  sessionId: string,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: api.SessionExercisesListResponse) => void;
    onError?: (error: Error) => void;
  }
) {
  return useQuery({
    queryKey: sessionExercisesKeys.list(sessionId),
    queryFn: () => api.getSessionExercises(sessionId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    enabled: options?.enabled ?? true,
    ...options,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Add a single exercise to session
 * 
 * Features:
 * - Optimistic update (instant UI feedback)
 * - Rollback on error (snapshot restoration)
 * - Automatic cache invalidation
 * - Toast notifications
 * 
 * @example
 * ```tsx
 * function AddExerciseButton({ sessionId, exerciseId }: Props) {
 *   const addMutation = useAddSessionExercise();
 *   
 *   const handleAdd = () => {
 *     addMutation.mutate({
 *       sessionId,
 *       data: {
 *         exercise_id: exerciseId,
 *         order_index: 0,
 *         duration_minutes: 15
 *       }
 *     });
 *   };
 *   
 *   return (
 *     <button onClick={handleAdd} disabled={addMutation.isPending}>
 *       {addMutation.isPending ? 'Adicionando...' : 'Adicionar Exercício'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAddSessionExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: api.AddExerciseInput }) =>
      api.addSessionExercise(sessionId, data),

    onMutate: async ({ sessionId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionExercisesKeys.list(sessionId) });

      // Snapshot current value
      const previousData = queryClient.getQueryData<api.SessionExercisesListResponse>(
        sessionExercisesKeys.list(sessionId)
      );

      // Optimistic update (temporary ID for UI)
      if (previousData) {
        const optimisticExercise: api.SessionExercise = {
          id: `temp-${Date.now()}` as string,
          session_id: sessionId,
          exercise_id: data.exercise_id,
          order_index: data.order_index,
          duration_minutes: data.duration_minutes ?? null,
          notes: data.notes ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          exercise: {
            id: data.exercise_id,
            name: 'Carregando...',
            description: null,
            category: null,
            media_url: null,
            tag_ids: [],
          },
        };

        queryClient.setQueryData<api.SessionExercisesListResponse>(
          sessionExercisesKeys.list(sessionId),
          {
            exercises: [...previousData.exercises, optimisticExercise],
            total_exercises: previousData.total_exercises + 1,
            total_duration_minutes:
              previousData.total_duration_minutes + (data.duration_minutes ?? 0),
          }
        );
      }

      return { previousData };
    },

    onError: (error, { sessionId }, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          sessionExercisesKeys.list(sessionId),
          context.previousData
        );
      }

      toast.error('Erro ao adicionar exercício', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: (data, { sessionId }) => {
      toast.success('Exercício adicionado com sucesso');
    },

    onSettled: (data, error, { sessionId }) => {
      // Forçar refetch imediato para garantir sincronização com servidor
      queryClient.refetchQueries({ queryKey: sessionExercisesKeys.list(sessionId) });
    },
  });
}

/**
 * Bulk add multiple exercises to session
 * 
 * Optimized for drag-and-drop multiple exercises or template imports.
 * 
 * @example
 * ```tsx
 * function ImportTemplateButton({ sessionId, templateExercises }: Props) {
 *   const bulkAddMutation = useBulkAddSessionExercises();
 *   
 *   const handleImport = () => {
 *     bulkAddMutation.mutate({
 *       sessionId,
 *       data: {
 *         exercises: templateExercises.map((ex, idx) => ({
 *           exercise_id: ex.id,
 *           order_index: idx,
 *           duration_minutes: ex.default_duration
 *         }))
 *       }
 *     });
 *   };
 *   
 *   return <button onClick={handleImport}>Importar Template</button>;
 * }
 * ```
 */
export function useBulkAddSessionExercises() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: api.BulkAddExercisesInput }) =>
      api.bulkAddSessionExercises(sessionId, data),

    onMutate: async ({ sessionId }) => {
      await queryClient.cancelQueries({ queryKey: sessionExercisesKeys.list(sessionId) });

      const previousData = queryClient.getQueryData<api.SessionExercisesListResponse>(
        sessionExercisesKeys.list(sessionId)
      );

      return { previousData };
    },

    onError: (error, { sessionId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          sessionExercisesKeys.list(sessionId),
          context.previousData
        );
      }

      toast.error('Erro ao adicionar exercícios', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: (data, { sessionId }) => {
      toast.success(`${data.length} exercícios adicionados com sucesso`);
    },

    onSettled: (data, error, { sessionId }) => {
      // Forçar refetch imediato para garantir sincronização com servidor
      queryClient.refetchQueries({ queryKey: sessionExercisesKeys.list(sessionId) });
    },
  });
}

/**
 * Update exercise metadata (duration, notes)
 * 
 * @example
 * ```tsx
 * function ExerciseDurationInput({ exercise }: Props) {
 *   const updateMutation = useUpdateSessionExercise();
 *   
 *   const handleUpdate = (minutes: number) => {
 *     updateMutation.mutate({
 *       exerciseId: exercise.id,
 *       sessionId: exercise.session_id,
 *       data: { duration_minutes: minutes }
 *     });
 *   };
 *   
 *   return <Input type="number" onChange={e => handleUpdate(+e.target.value)} />;
 * }
 * ```
 */
export function useUpdateSessionExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      exerciseId,
      sessionId,
      data,
    }: {
      exerciseId: string;
      sessionId: string;
      data: api.UpdateExerciseInput;
    }) => api.updateSessionExercise(exerciseId, data),

    onMutate: async ({ sessionId, exerciseId, data }) => {
      await queryClient.cancelQueries({ queryKey: sessionExercisesKeys.list(sessionId) });

      const previousData = queryClient.getQueryData<api.SessionExercisesListResponse>(
        sessionExercisesKeys.list(sessionId)
      );

      if (previousData) {
        const updatedExercises = previousData.exercises.map(ex =>
          ex.id === exerciseId
            ? {
                ...ex,
                ...data,
                updated_at: new Date().toISOString(),
              }
            : ex
        );

        queryClient.setQueryData<api.SessionExercisesListResponse>(
          sessionExercisesKeys.list(sessionId),
          {
            ...previousData,
            exercises: updatedExercises,
            total_duration_minutes: api.calculateTotalDuration(updatedExercises),
          }
        );
      }

      return { previousData };
    },

    onError: (error, { sessionId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          sessionExercisesKeys.list(sessionId),
          context.previousData
        );
      }

      toast.error('Erro ao atualizar exercício', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: () => {
      toast.success('Exercício atualizado');
    },

    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionExercisesKeys.list(sessionId) });
    },
  });
}

/**
 * Reorder exercises (drag-and-drop)
 * 
 * @example
 * ```tsx
 * function DragDropList({ sessionId, exercises }: Props) {
 *   const reorderMutation = useReorderSessionExercises();
 *   
 *   const handleDrop = (sourceIdx: number, destIdx: number) => {
 *     const reorderedData = api.recomputeOrderAfterDrag(exercises, sourceIdx, destIdx);
 *     
 *     reorderMutation.mutate({
 *       sessionId,
 *       data: { exercises: reorderedData }
 *     });
 *   };
 *   
 *   return <DndProvider><DraggableList onDrop={handleDrop} /></DndProvider>;
 * }
 * ```
 */
export function useReorderSessionExercises() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: api.ReorderExercisesInput }) =>
      api.reorderSessionExercises(sessionId, data),

    onMutate: async ({ sessionId, data }) => {
      await queryClient.cancelQueries({ queryKey: sessionExercisesKeys.list(sessionId) });

      const previousData = queryClient.getQueryData<api.SessionExercisesListResponse>(
        sessionExercisesKeys.list(sessionId)
      );

      if (previousData) {
        // Create map for O(1) lookup
        const orderMap = new Map(data.exercises.map(ex => [ex.id, ex.order_index]));

        const reorderedExercises = [...previousData.exercises].sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? a.order_index;
          const orderB = orderMap.get(b.id) ?? b.order_index;
          return orderA - orderB;
        });

        queryClient.setQueryData<api.SessionExercisesListResponse>(
          sessionExercisesKeys.list(sessionId),
          {
            ...previousData,
            exercises: reorderedExercises,
          }
        );
      }

      return { previousData };
    },

    onError: (error, { sessionId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          sessionExercisesKeys.list(sessionId),
          context.previousData
        );
      }

      toast.error('Erro ao reordenar exercícios', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: (data) => {
      toast.success(`${data.updated_count} exercícios reordenados`);
    },

    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionExercisesKeys.list(sessionId) });
    },
  });
}

/**
 * Remove exercise from session
 * 
 * @example
 * ```tsx
 * function RemoveExerciseButton({ exercise }: Props) {
 *   const removeMutation = useRemoveSessionExercise();
 *   
 *   const handleRemove = () => {
 *     if (confirm('Remover exercício?')) {
 *       removeMutation.mutate({
 *         exerciseId: exercise.id,
 *         sessionId: exercise.session_id
 *       });
 *     }
 *   };
 *   
 *   return <button onClick={handleRemove}>Remover</button>;
 * }
 * ```
 */
export function useRemoveSessionExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, sessionId }: { exerciseId: string; sessionId: string }) =>
      api.removeSessionExercise(exerciseId),

    onMutate: async ({ sessionId, exerciseId }) => {
      await queryClient.cancelQueries({ queryKey: sessionExercisesKeys.list(sessionId) });

      const previousData = queryClient.getQueryData<api.SessionExercisesListResponse>(
        sessionExercisesKeys.list(sessionId)
      );

      if (previousData) {
        const filteredExercises = previousData.exercises.filter(ex => ex.id !== exerciseId);

        queryClient.setQueryData<api.SessionExercisesListResponse>(
          sessionExercisesKeys.list(sessionId),
          {
            exercises: filteredExercises,
            total_exercises: filteredExercises.length,
            total_duration_minutes: api.calculateTotalDuration(filteredExercises),
          }
        );
      }

      return { previousData };
    },

    onError: (error, { sessionId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          sessionExercisesKeys.list(sessionId),
          context.previousData
        );
      }

      toast.error('Erro ao remover exercício', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },

    onSuccess: () => {
      toast.success('Exercício removido');
    },

    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionExercisesKeys.list(sessionId) });
    },
  });
}
