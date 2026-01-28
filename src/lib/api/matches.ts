/**
 * Matches API Service
 * 
 * Serviço para gerenciar partidas/jogos da equipe.
 * Endpoints: GET /teams/{id}/matches
 */

import { apiClient } from "./client";

/**
 * Interface representando uma partida/jogo
 */
export interface Match {
  id: string;
  match_date: string; // ISO 8601 date (YYYY-MM-DD)
  match_time?: string; // HH:MM:SS time format (nullable)
  opponent_name?: string; // Nome do adversário (nullable)
  location?: string; // Local/venue (nullable)
  match_type: 'group' | 'semifinal' | 'final' | 'friendly';
  status: 'scheduled' | 'in_progress' | 'finished' | 'cancelled';
  is_home?: boolean; // true se jogo em casa
}

/**
 * Parâmetros de filtro para listagem de partidas
 */
export interface MatchFilters {
  status?: 'scheduled' | 'in_progress' | 'finished' | 'cancelled';
  page?: number;
  size?: number;
}

/**
 * Response paginada da API de partidas
 */
export interface MatchesResponse {
  items: Match[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * Serviço de partidas/jogos
 */
export const matchesService = {
  /**
   * Busca partidas de uma equipe
   * 
   * @param teamId - UUID da equipe
   * @param filters - Filtros opcionais (status, page, size)
   * @returns Response paginada com lista de partidas
   * 
   * @example
   * ```typescript
   * // Buscar próximos jogos agendados
   * const response = await matchesService.getTeamMatches(teamId, {
   *   status: 'scheduled',
   *   page: 1,
   *   size: 10
   * });
   * ```
   */
  async getTeamMatches(
    teamId: string,
    filters: MatchFilters = {}
  ): Promise<MatchesResponse> {
    try {
      const params = {
        status: filters.status || 'scheduled',
        page: filters.page || 1,
        size: filters.size || 10,
      };

      const response = await apiClient.get<MatchesResponse>(
        `/teams/${teamId}/matches`,
        { params }
      );

      // apiClient já retorna os dados diretamente
      return response;
    } catch (error) {
      console.error('Error fetching team matches:', error);
      throw error;
    }
  },
};
