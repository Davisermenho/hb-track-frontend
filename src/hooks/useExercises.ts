/**
 * useExercises Hook
 * Step 20: Frontend de Exercícios
 * 
 * React Query hook para gerenciar:
 * - Lista de exercícios com filtros e paginação
 * - Cache de 5 minutos
 * - Mutations para favoritos
 * - Prefetch de próxima página
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import {
  getExercises,
  getExerciseById,
  getExerciseTags,
  addFavorite,
  removeFavorite,
  getFavorites,
  createExercise,
  updateExercise,
  deleteExercise,
  Exercise,
  ExerciseTag,
  ExerciseFilters,
  ExerciseListResponse,
  ExerciseFavorite,
  ExerciseInput,
} from '@/lib/api/exercises';
import { useToast } from '@/context/ToastContext';
import { useState, useCallback } from 'react';

// ==================== QUERY KEYS ====================

export const exerciseKeys = {
  all: ['exercises'] as const,
  lists: () => [...exerciseKeys.all, 'list'] as const,
  list: (filters?: ExerciseFilters, page?: number, perPage?: number) =>
    [...exerciseKeys.lists(), { filters, page, perPage }] as const,
  details: () => [...exerciseKeys.all, 'detail'] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
  tags: () => [...exerciseKeys.all, 'tags'] as const,
  favorites: () => [...exerciseKeys.all, 'favorites'] as const,
};

// ==================== HOOKS ====================

/**
 * Hook principal para lista de exercícios
 */
export function useExercises(
  filters?: ExerciseFilters,
  page: number = 1,
  perPage: number = 20
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: exerciseKeys.list(filters, page, perPage),
    queryFn: () => getExercises(filters, page, perPage),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
  });

  // Prefetch próxima página
  const prefetchNextPage = useCallback(() => {
    if (query.data) {
      const totalPages = Math.ceil(query.data.total / query.data.per_page);
      if (page < totalPages) {
        queryClient.prefetchQuery({
          queryKey: exerciseKeys.list(filters, page + 1, perPage),
          queryFn: () => getExercises(filters, page + 1, perPage),
          staleTime: 5 * 60 * 1000,
        });
      }
    }
  }, [queryClient, filters, page, perPage, query.data]);

  return {
    ...query,
    prefetchNextPage,
  };
}

/**
 * Hook para detalhes de um exercício
 */
export function useExercise(id: string | null) {
  return useQuery({
    queryKey: exerciseKeys.detail(id || ''),
    queryFn: () => getExerciseById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para tags hierárquicas
 */
export function useExerciseTags() {
  return useQuery({
    queryKey: exerciseKeys.tags(),
    queryFn: getExerciseTags,
    staleTime: 10 * 60 * 1000, // Tags mudam menos
  });
}

/**
 * Hook para favoritos do usuário
 */
export function useExerciseFavorites() {
  return useQuery({
    queryKey: exerciseKeys.favorites(),
    queryFn: getFavorites,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para mutations de favoritos
 */
export function useExerciseFavoritesMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onMutate: async (exerciseId) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: exerciseKeys.favorites() });

      // Snapshot do estado anterior
      const previousFavorites = queryClient.getQueryData<ExerciseFavorite[]>(
        exerciseKeys.favorites()
      );

      // Atualização otimista
      queryClient.setQueryData<ExerciseFavorite[]>(
        exerciseKeys.favorites(),
        (old) => [
          ...(old || []),
          {
            id: 'temp-' + exerciseId,
            user_id: 'current-user', // Será substituído pelo backend
            exercise_id: exerciseId,
            created_at: new Date().toISOString(),
          } as ExerciseFavorite,
        ]
      );

      return { previousFavorites };
    },
    onError: (err, exerciseId, context) => {
      // Rollback em caso de erro
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          exerciseKeys.favorites(),
          context.previousFavorites
        );
      }
      toast.error('Erro ao adicionar favorito');
    },
    onSuccess: () => {
      toast.success('Adicionado aos favoritos');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.favorites() });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onMutate: async (exerciseId) => {
      await queryClient.cancelQueries({ queryKey: exerciseKeys.favorites() });

      const previousFavorites = queryClient.getQueryData<ExerciseFavorite[]>(
        exerciseKeys.favorites()
      );

      // Atualização otimista
      queryClient.setQueryData<ExerciseFavorite[]>(
        exerciseKeys.favorites(),
        (old) => (old || []).filter((fav) => fav.exercise_id !== exerciseId)
      );

      return { previousFavorites };
    },
    onError: (err, exerciseId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          exerciseKeys.favorites(),
          context.previousFavorites
        );
      }
      toast.error('Erro ao remover favorito');
    },
    onSuccess: () => {
      toast.success('Removido dos favoritos');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.favorites() });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
  });

  const toggleFavorite = useCallback(
    (exerciseId: string, isFavorite: boolean) => {
      if (isFavorite) {
        removeMutation.mutate(exerciseId);
      } else {
        addMutation.mutate(exerciseId);
      }
    },
    [addMutation, removeMutation]
  );

  return {
    addFavorite: addMutation,
    removeFavorite: removeMutation,
    toggleFavorite,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}

/**
 * Hook para criar exercício (staff apenas)
 */
export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createExercise,
    onSuccess: (data) => {
      // Invalidar listas para incluir novo exercício
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      toast.success('Exercício criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao criar exercício');
    },
  });
}

/**
 * Hook para atualizar exercício (staff apenas)
 */
export function useUpdateExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExerciseInput> }) =>
      updateExercise(id, data),
    onSuccess: (data, variables) => {
      // Invalidar detail e listas
      queryClient.invalidateQueries({ queryKey: exerciseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      toast.success('Exercício atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao atualizar exercício');
    },
  });
}

/**
 * Hook para deletar exercício (staff apenas)
 */
export function useDeleteExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: (_, exerciseId) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: exerciseKeys.detail(exerciseId) });
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      toast.success('Exercício deletado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao deletar exercício');
    },
  });
}

/**
 * Hook completo com estado de filtros e paginação
 */
export function useExerciseFilters(initialFilters?: ExerciseFilters) {
  const [filters, setFilters] = useState<ExerciseFilters>(
    initialFilters || {
      tag_ids: [],
      tag_operator: 'AND',
      search: '',
      category: undefined,
      favorites_only: false,
    }
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const query = useExercises(filters, page, perPage);
  const tags = useExerciseTags();
  const favorites = useExerciseFavorites();
  const favoriteMutations = useExerciseFavoritesMutations();

  // Helpers
  const updateFilters = useCallback((newFilters: Partial<ExerciseFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset page on filter change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      tag_ids: [],
      tag_operator: 'AND',
      search: '',
      category: undefined,
      favorites_only: false,
    });
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const isFavorite = useCallback(
    (exerciseId: string) => {
      return favorites.data?.some((fav) => fav.exercise_id === exerciseId) || false;
    },
    [favorites.data]
  );

  return {
    // Data
    exercises: query.data?.exercises || [],
    totalCount: query.data?.total || 0,
    totalPages: query.data ? Math.ceil(query.data.total / query.data.per_page) : 1,
    tags: tags.data || [],
    favorites: favorites.data || [],

    // State
    filters,
    page,
    perPage,

    // Actions
    updateFilters,
    clearFilters,
    goToPage,
    setPerPage,
    isFavorite,
    toggleFavorite: favoriteMutations.toggleFavorite,
    prefetchNextPage: query.prefetchNextPage,

    // Loading states
    isLoading: query.isLoading || tags.isLoading,
    isFetching: query.isFetching,
    isError: query.isError || tags.isError,
    error: query.error || tags.error,
  };
}
