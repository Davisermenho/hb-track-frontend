/**
 * Session Query Keys Factory
 *
 * Centraliza todas as query keys do módulo Training Sessions
 * Padrão idêntico ao sessionExercisesKeys em useSessionExercises.ts
 *
 * @see useSessionExercises.ts para padrão de referência
 */

import type { SessionFilters } from '@/lib/api/trainings';

export const sessionKeys = {
  all: ['sessions'] as const,

  // Lista de sessões (com filtros opcionais)
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters?: SessionFilters) =>
    filters
      ? [...sessionKeys.lists(), filters] as const
      : [...sessionKeys.lists()] as const,

  // Lista por equipe (atalho comum)
  byTeam: (teamId: string) =>
    [...sessionKeys.lists(), { team_id: teamId }] as const,

  // Lista por microciclo
  byMicrocycle: (microcycleId: string) =>
    [...sessionKeys.lists(), { microcycle_id: microcycleId }] as const,

  // Detalhe de sessão específica
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (sessionId: string) =>
    [...sessionKeys.details(), sessionId] as const,

  // Análise de desvio
  deviations: () => [...sessionKeys.all, 'deviation'] as const,
  deviation: (sessionId: string) =>
    [...sessionKeys.deviations(), sessionId] as const,
} as const;

// Re-export para compatibilidade
export const sessionQueryKeys = sessionKeys;
