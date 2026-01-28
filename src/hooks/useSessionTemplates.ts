/**
 * useSessionTemplates Hook
 *
 * React Query hook para gerenciar templates de foco de sessão:
 * - Lista de templates com cache
 * - Suporte a loading/error states
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { TrainingSessionsAPI, SessionTemplate, SessionTemplateListResponse } from '@/lib/api/trainings';

// ==================== QUERY KEYS ====================

export const sessionTemplateKeys = {
  all: ['session-templates'] as const,
  lists: () => [...sessionTemplateKeys.all, 'list'] as const,
  list: (activeOnly?: boolean) => [...sessionTemplateKeys.lists(), { activeOnly }] as const,
};

// ==================== HOOKS ====================

/**
 * Hook para buscar templates de foco de sessão
 */
export function useSessionTemplates(activeOnly: boolean = true): UseQueryResult<SessionTemplateListResponse, Error> {
  return useQuery({
    queryKey: sessionTemplateKeys.list(activeOnly),
    queryFn: () => TrainingSessionsAPI.getSessionTemplates(activeOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}