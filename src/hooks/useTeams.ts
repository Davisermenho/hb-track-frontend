/**
 * useTeams Hook
 *
 * Busca times reais da API (`/api/v1/teams`) usando o apiClient.
 */

import { useQuery } from '@tanstack/react-query'
import { teamsService, type Team } from '@/lib/api/teams'

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const resp = await teamsService.list()
      // Exibe apenas equipes próprias (não mostrar adversários)
      return (resp.items || []).filter((team: Team) => team.is_our_team !== false)
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useTeamDetail(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: async () => {
      if (!teamId) return null
      return teamsService.getById(teamId)
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  })
}
