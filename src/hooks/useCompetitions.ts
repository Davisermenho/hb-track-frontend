/**
 * useCompetitions - React Query hooks para o módulo de Competições
 * 
 * Hooks disponíveis:
 * - useCompetitions: Lista competições com paginação e filtros
 * - useCompetition: Busca competição por ID
 * - useCompetitionSeasons: Lista temporadas de uma competição
 * - useCreateCompetition: Mutation para criar competição
 * - useUpdateCompetition: Mutation para atualizar competição
 * - useCreateCompetitionSeason: Mutation para vincular temporada
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  competitionsService,
  type Competition,
  type CompetitionCreate,
  type CompetitionUpdate,
  type CompetitionSeason,
  type CompetitionSeasonCreate,
  type CompetitionSeasonUpdate,
  type CompetitionListParams,
  type PaginatedResponse,
} from '@/lib/api/competitions';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const competitionKeys = {
  all: ['competitions'] as const,
  lists: () => [...competitionKeys.all, 'list'] as const,
  list: (params?: CompetitionListParams) => [...competitionKeys.lists(), params] as const,
  details: () => [...competitionKeys.all, 'detail'] as const,
  detail: (id: string) => [...competitionKeys.details(), id] as const,
  seasons: (competitionId: string) => [...competitionKeys.detail(competitionId), 'seasons'] as const,
};

export const competitionSeasonKeys = {
  all: ['competition_seasons'] as const,
  lists: () => [...competitionSeasonKeys.all, 'list'] as const,
  list: (params?: any) => [...competitionSeasonKeys.lists(), params] as const,
  detail: (id: string) => [...competitionSeasonKeys.all, 'detail', id] as const,
};

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Hook para listar competições
 */
export function useCompetitions(params?: CompetitionListParams) {
  return useQuery({
    queryKey: competitionKeys.list(params),
    queryFn: () => competitionsService.list(params),
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para buscar competição por ID
 */
export function useCompetition(id: string | null | undefined) {
  return useQuery({
    queryKey: competitionKeys.detail(id ?? ''),
    queryFn: () => competitionsService.getById(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para listar temporadas de uma competição
 */
export function useCompetitionSeasons(competitionId: string | null | undefined) {
  return useQuery({
    queryKey: competitionKeys.seasons(competitionId ?? ''),
    queryFn: () => competitionsService.listSeasons(competitionId!),
    enabled: !!competitionId,
    staleTime: 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para listar todos os vínculos competição-temporada
 */
export function useAllCompetitionSeasons(params?: any) {
  return useQuery({
    queryKey: competitionSeasonKeys.list(params),
    queryFn: () => competitionsService.listAllSeasons(params),
    staleTime: 30 * 1000,
  });
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Hook para criar competição
 */
export function useCreateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompetitionCreate) => competitionsService.create(data),
    onSuccess: (newCompetition) => {
      // Invalida a lista de competições
      queryClient.invalidateQueries({ queryKey: competitionKeys.lists() });
      
      // Adiciona a nova competição ao cache de detalhe
      queryClient.setQueryData(
        competitionKeys.detail(newCompetition.id), 
        newCompetition
      );
    },
  });
}

/**
 * Hook para atualizar competição
 */
export function useUpdateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompetitionUpdate }) => 
      competitionsService.update(id, data),
    onSuccess: (updatedCompetition) => {
      // Atualiza o cache de detalhe
      queryClient.setQueryData(
        competitionKeys.detail(updatedCompetition.id), 
        updatedCompetition
      );
      
      // Invalida a lista para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: competitionKeys.lists() });
    },
  });
}

/**
 * Hook para vincular competição a uma temporada
 */
export function useCreateCompetitionSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ competitionId, data }: { competitionId: string; data: CompetitionSeasonCreate }) =>
      competitionsService.createSeason(competitionId, data),
    onSuccess: (newSeason, { competitionId }) => {
      // Invalida a lista de temporadas da competição
      queryClient.invalidateQueries({ 
        queryKey: competitionKeys.seasons(competitionId) 
      });
      
      // Invalida a lista geral de competition_seasons
      queryClient.invalidateQueries({ 
        queryKey: competitionSeasonKeys.lists() 
      });
    },
  });
}

/**
 * Hook para atualizar vínculo competição-temporada
 */
export function useUpdateCompetitionSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompetitionSeasonUpdate }) =>
      competitionsService.updateSeason(id, data),
    onSuccess: (updatedSeason) => {
      // Atualiza o cache de detalhe
      queryClient.setQueryData(
        competitionSeasonKeys.detail(updatedSeason.id), 
        updatedSeason
      );
      
      // Invalida listas relacionadas
      queryClient.invalidateQueries({ 
        queryKey: competitionKeys.seasons(updatedSeason.competition_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: competitionSeasonKeys.lists() 
      });
    },
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook para obter competição do cache ou buscar
 */
export function useCompetitionData(id: string | null) {
  const queryClient = useQueryClient();
  
  // Tenta obter do cache primeiro
  const cached = id 
    ? queryClient.getQueryData<Competition>(competitionKeys.detail(id))
    : null;
  
  // Usa o hook normal como fallback
  const query = useCompetition(cached ? null : id);
  
  return {
    competition: cached ?? query.data ?? null,
    isLoading: !cached && query.isLoading,
    error: query.error,
  };
}

/**
 * Hook para prefetch de competição
 */
export function usePrefetchCompetition() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: competitionKeys.detail(id),
      queryFn: () => competitionsService.getById(id),
      staleTime: 60 * 1000,
    });
  };
}
