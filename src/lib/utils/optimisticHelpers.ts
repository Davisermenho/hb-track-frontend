/**
 * Helpers para operações otimísticas com React Query
 * 
 * Permite atualizações instantâneas na UI com rollback automático em caso de erro.
 * Usado no módulo Teams para melhorar UX em ações como:
 * - Remover membro
 * - Alterar papel
 * - Cancelar convite
 */

import { QueryClient, MutationOptions } from '@tanstack/react-query';

// ============================================================================
// TIPOS
// ============================================================================

export interface OptimisticContext<TData> {
  previousData: TData | undefined;
}

export interface OptimisticMutationConfig<TData, TVariables, TError = Error> {
  queryKey: readonly unknown[];
  updateFn: (oldData: TData, variables: TVariables) => TData;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccessMessage?: string;
  onErrorMessage?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Cria uma configuração de mutation otimística para React Query
 * 
 * @example
 * ```tsx
 * const removeMemberMutation = useMutation({
 *   ...createOptimisticMutation({
 *     queryKey: ['team-members', teamId],
 *     updateFn: (members, memberId) => members.filter(m => m.id !== memberId),
 *     mutationFn: (memberId) => teamsService.removeMember(memberId),
 *   }),
 * });
 * ```
 */
export function createOptimisticMutation<TData, TVariables, TError = Error>(
  config: OptimisticMutationConfig<TData, TVariables, TError>,
  queryClient: QueryClient
): Partial<MutationOptions<TData, TError, TVariables, OptimisticContext<TData>>> {
  return {
    mutationFn: config.mutationFn,
    
    // Executa ANTES da mutation
    onMutate: async (variables: TVariables) => {
      // Cancela qualquer query em andamento para evitar overwrites
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      
      // Snapshot do estado anterior
      const previousData = queryClient.getQueryData<TData>(config.queryKey);
      
      // Aplica atualização otimística
      if (previousData !== undefined) {
        queryClient.setQueryData<TData>(
          config.queryKey,
          config.updateFn(previousData, variables)
        );
      }
      
      // Retorna contexto para rollback
      return { previousData };
    },
    
    // Em caso de erro, faz rollback
    onError: (_error: TError, _variables: TVariables, context?: OptimisticContext<TData>) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData<TData>(config.queryKey, context.previousData);
      }
    },
    
    // Sempre invalida cache para sincronizar com servidor
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  };
}

/**
 * Helper para adicionar item a uma lista de forma otimística
 */
export function optimisticAdd<T extends { id: string | number }>(
  list: T[],
  newItem: T
): T[] {
  return [...list, newItem];
}

/**
 * Helper para remover item de uma lista de forma otimística
 */
export function optimisticRemove<T extends { id: string | number }>(
  list: T[],
  idToRemove: string | number
): T[] {
  return list.filter(item => item.id !== idToRemove);
}

/**
 * Helper para atualizar item em uma lista de forma otimística
 */
export function optimisticUpdate<T extends { id: string | number }>(
  list: T[],
  idToUpdate: string | number,
  updates: Partial<T>
): T[] {
  return list.map(item =>
    item.id === idToUpdate ? { ...item, ...updates } : item
  );
}

/**
 * Helper para mover item em uma lista (reordenação)
 */
export function optimisticReorder<T>(
  list: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

/**
 * Factory para criar query keys consistentes do módulo Teams
 * 
 * @example
 * ```tsx
 * // Lista de times do usuário
 * queryKey: teamQueryKeys.list()
 * 
 * // Detalhes de um time específico
 * queryKey: teamQueryKeys.detail(teamId)
 * 
 * // Membros de um time
 * queryKey: teamQueryKeys.members(teamId)
 * ```
 */
export const teamQueryKeys = {
  all: ['teams'] as const,
  
  // Lista de times do usuário
  list: () => [...teamQueryKeys.all, 'list'] as const,
  
  // Detalhes de um time específico
  detail: (teamId: string) => [...teamQueryKeys.all, 'detail', teamId] as const,
  
  // Membros de um time
  members: (teamId: string) => [...teamQueryKeys.all, 'members', teamId] as const,
  
  // Membros pendentes (convites)
  pendingMembers: (teamId: string) => [...teamQueryKeys.all, 'pending', teamId] as const,
  
  // Estatísticas do time
  stats: (teamId: string) => [...teamQueryKeys.all, 'stats', teamId] as const,
  
  // Treinos do time
  trainings: (teamId: string) => [...teamQueryKeys.all, 'trainings', teamId] as const,
  
  // Ciclos de treino
  cycles: (teamId: string) => [...teamQueryKeys.all, 'cycles', teamId] as const,
} as const;

// ============================================================================
// INVALIDATION HELPERS
// ============================================================================

/**
 * Invalida todos os caches relacionados a um time específico
 */
export function invalidateTeamCaches(queryClient: QueryClient, teamId: string) {
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(teamId) });
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.members(teamId) });
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.pendingMembers(teamId) });
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.stats(teamId) });
}

/**
 * Invalida apenas o cache de membros de um time
 */
export function invalidateTeamMembers(queryClient: QueryClient, teamId: string) {
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.members(teamId) });
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.pendingMembers(teamId) });
}

/**
 * Prefetch de dados do time (útil para navegação)
 */
export async function prefetchTeamData(
  queryClient: QueryClient,
  teamId: string,
  fetchFn: () => Promise<unknown>
) {
  await queryClient.prefetchQuery({
    queryKey: teamQueryKeys.detail(teamId),
    queryFn: fetchFn,
    staleTime: 60 * 1000, // 1 minuto
  });
}
