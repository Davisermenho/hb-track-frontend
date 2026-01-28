/**
 * Competitions API Service
 * 
 * Serviço para comunicação com endpoints de competições.
 * 
 * Endpoints implementados:
 * - GET    /v1/competitions              → Listar competições
 * - POST   /v1/competitions              → Criar competição
 * - GET    /v1/competitions/{id}         → Buscar por ID
 * - PATCH  /v1/competitions/{id}         → Atualizar competição
 * - GET    /v1/competitions/{id}/seasons → Listar temporadas da competição
 * - POST   /v1/competitions/{id}/seasons → Vincular competição à temporada
 * - GET    /v1/competition_seasons/{id}  → Buscar vínculo por ID
 * - PATCH  /v1/competition_seasons/{id}  → Atualizar vínculo
 * - GET    /v1/competition_seasons       → Listar todos os vínculos
 */

import { apiClient } from './client';

// =============================================================================
// TYPES
// =============================================================================

export interface Competition {
  id: string;
  organization_id: string;
  name: string;
  kind?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionCreate {
  name: string;
  kind?: string;
}

export interface CompetitionUpdate {
  name?: string;
  kind?: string;
}

export interface CompetitionSeason {
  id: string;
  competition_id: string;
  season_id: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionSeasonCreate {
  season_id: string;
  name?: string;
}

export interface CompetitionSeasonUpdate {
  name?: string;
}

// Tipos para fases (FASE futura - backend ainda não implementado)
export type PhaseType = 'group' | 'knockout' | 'semifinal' | 'final' | 'friendly';
export type PhaseStatus = 'not_started' | 'in_progress' | 'finished';

export interface Phase {
  id: string;
  name: string;
  competition_season_id: string;
  type: PhaseType;
  status: PhaseStatus;
  order: number;
  matches_count?: number;
  completed_matches?: number;
  created_at: string;
  updated_at: string;
}

export interface PhaseCreate {
  name: string;
  competition_season_id: string;
  type: PhaseType;
  order?: number;
  teams?: string[];
}

export interface PhaseUpdate {
  name?: string;
  type?: PhaseType;
  status?: PhaseStatus;
  order?: number;
}

// Tabela de classificação
export interface StandingEntry {
  position: number;
  team_id: string;
  team_name: string;
  team_logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

// Regulamento
export interface Regulation {
  id: string;
  competition_id: string;
  file_url?: string;
  content?: string;
  updated_at: string;
  updated_by?: string;
}

// Respostas paginadas
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// Parâmetros de listagem
export interface CompetitionListParams {
  page?: number;
  limit?: number;
  name?: string;
  kind?: string;
  order_by?: 'created_at' | 'name' | 'updated_at';
  order_dir?: 'asc' | 'desc';
}

export interface CompetitionSeasonListParams {
  page?: number;
  limit?: number;
  season_id?: string;
}

// =============================================================================
// API SERVICE
// =============================================================================

export const competitionsService = {
  // =========================================================================
  // COMPETITIONS
  // =========================================================================
  
  /**
   * Lista competições com paginação e filtros
   */
  list: async (params?: CompetitionListParams): Promise<PaginatedResponse<Competition>> => {
    return apiClient.get<PaginatedResponse<Competition>>('/competitions', { params });
  },

  /**
   * Busca competição por ID
   */
  getById: async (id: string): Promise<Competition> => {
    return apiClient.get<Competition>(`/competitions/${id}`);
  },

  /**
   * Cria nova competição
   */
  create: async (data: CompetitionCreate): Promise<Competition> => {
    return apiClient.post<Competition>('/competitions', data);
  },

  /**
   * Atualiza competição existente
   */
  update: async (id: string, data: CompetitionUpdate): Promise<Competition> => {
    return apiClient.patch<Competition>(`/competitions/${id}`, data);
  },

  // =========================================================================
  // COMPETITION SEASONS (Vínculo competição-temporada)
  // =========================================================================
  
  /**
   * Lista temporadas vinculadas a uma competição
   */
  listSeasons: async (competitionId: string): Promise<CompetitionSeason[]> => {
    return apiClient.get<CompetitionSeason[]>(`/competitions/${competitionId}/seasons`);
  },

  /**
   * Vincula competição a uma temporada
   */
  createSeason: async (
    competitionId: string, 
    data: CompetitionSeasonCreate
  ): Promise<CompetitionSeason> => {
    return apiClient.post<CompetitionSeason>(`/competitions/${competitionId}/seasons`, data);
  },

  /**
   * Busca vínculo competição-temporada por ID
   */
  getSeasonById: async (competitionSeasonId: string): Promise<CompetitionSeason> => {
    return apiClient.get<CompetitionSeason>(`/competition_seasons/${competitionSeasonId}`);
  },

  /**
   * Atualiza vínculo competição-temporada
   */
  updateSeason: async (
    competitionSeasonId: string, 
    data: CompetitionSeasonUpdate
  ): Promise<CompetitionSeason> => {
    return apiClient.patch<CompetitionSeason>(`/competition_seasons/${competitionSeasonId}`, data);
  },

  /**
   * Lista todos os vínculos competição-temporada
   */
  listAllSeasons: async (params?: CompetitionSeasonListParams): Promise<PaginatedResponse<CompetitionSeason>> => {
    return apiClient.get<PaginatedResponse<CompetitionSeason>>('/competition_seasons', { params });
  },

  // =========================================================================
  // PHASES (Para implementação futura)
  // =========================================================================
  
  /**
   * Lista fases de uma temporada de competição
   * TODO: Implementar quando backend estiver pronto
   */
  listPhases: async (competitionSeasonId: string): Promise<Phase[]> => {
    // return apiClient.get<Phase[]>(`/competition_seasons/${competitionSeasonId}/phases`);
    console.warn('[competitionsService] listPhases not implemented yet');
    return [];
  },

  /**
   * Cria uma nova fase
   * TODO: Implementar quando backend estiver pronto
   */
  createPhase: async (data: PhaseCreate): Promise<Phase> => {
    // return apiClient.post<Phase>('/phases', data);
    throw new Error('createPhase not implemented yet');
  },

  /**
   * Atualiza uma fase
   * TODO: Implementar quando backend estiver pronto
   */
  updatePhase: async (phaseId: string, data: PhaseUpdate): Promise<Phase> => {
    // return apiClient.patch<Phase>(`/phases/${phaseId}`, data);
    throw new Error('updatePhase not implemented yet');
  },

  // =========================================================================
  // STANDINGS (Para implementação futura)
  // =========================================================================
  
  /**
   * Obtém tabela de classificação de uma fase
   * TODO: Implementar quando backend estiver pronto
   */
  getStandings: async (phaseId: string): Promise<StandingEntry[]> => {
    // return apiClient.get<StandingEntry[]>(`/phases/${phaseId}/standings`);
    console.warn('[competitionsService] getStandings not implemented yet');
    return [];
  },

  // =========================================================================
  // REGULATION (Para implementação futura)
  // =========================================================================
  
  /**
   * Obtém regulamento da competição
   * TODO: Implementar quando backend estiver pronto
   */
  getRegulation: async (competitionId: string): Promise<Regulation | null> => {
    // return apiClient.get<Regulation>(`/competitions/${competitionId}/regulation`);
    console.warn('[competitionsService] getRegulation not implemented yet');
    return null;
  },

  /**
   * Atualiza regulamento da competição
   * TODO: Implementar quando backend estiver pronto
   */
  updateRegulation: async (competitionId: string, data: FormData): Promise<Regulation> => {
    // return apiClient.put<Regulation>(`/competitions/${competitionId}/regulation`, data);
    throw new Error('updateRegulation not implemented yet');
  },
};

export default competitionsService;
