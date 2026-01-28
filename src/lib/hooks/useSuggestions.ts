/**
 * useSuggestions Hook
 *
 * Hook para gerenciar sugestões inteligentes de planejamento
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrainingSuggestionsAPI, type FocusSuggestion } from '@/lib/api/trainings'

/**
 * Hook para buscar sugestões para novo microciclo
 */
export function useTrainingSuggestions(teamId: string | undefined, microcycleType?: string) {
  return useQuery({
    queryKey: ['training-suggestions', teamId, microcycleType],
    queryFn: () => TrainingSuggestionsAPI.getSuggestions(teamId!, microcycleType),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutos (sugestões podem mudar conforme novos treinos)
  })
}

/**
 * Hook para aplicar uma sugestão
 */
export function useApplySuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ microcycleId, suggestion }: { microcycleId: string; suggestion: FocusSuggestion }) =>
      TrainingSuggestionsAPI.applySuggestion(microcycleId, suggestion),
    onSuccess: (_, variables) => {
      // Invalidar cache do microciclo
      queryClient.invalidateQueries({ queryKey: ['microcycle', variables.microcycleId] })
      queryClient.invalidateQueries({ queryKey: ['microcycles'] })
    },
  })
}
