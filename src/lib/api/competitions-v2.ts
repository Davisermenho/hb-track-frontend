/**
 * Competitions V2 API Service
 * 
 * Serviço para comunicação com endpoints de competições V2 (com IA Gemini).
 * 
 * Endpoints implementados:
 * - POST   /competitions/v2                           → Criar competição V2
 * - POST   /competitions/v2/parse-pdf                 → Parse PDF com IA
 * - POST   /competitions/v2/{id}/import-from-ai       → Importar dados da IA
 * - GET    /competitions/v2/{id}/full                 → Competição com relações
 * 
 * - GET    /competitions/{id}/phases                  → Listar fases
 * - POST   /competitions/{id}/phases                  → Criar fase
 * - PATCH  /competitions/{id}/phases/{phase_id}       → Atualizar fase
 * - DELETE /competitions/{id}/phases/{phase_id}       → Remover fase
 * 
 * - GET    /competitions/{id}/opponent-teams          → Listar equipes adversárias
 * - POST   /competitions/{id}/opponent-teams          → Criar equipe adversária
 * - POST   /competitions/{id}/opponent-teams/bulk     → Criar em lote
 * - PATCH  /competitions/{id}/opponent-teams/{tid}    → Atualizar equipe
 * 
 * - GET    /competitions/{id}/matches                 → Listar jogos
 * - POST   /competitions/{id}/matches                 → Criar jogo
 * - POST   /competitions/{id}/matches/bulk            → Upsert jogos em lote
 * - PATCH  /competitions/{id}/matches/{mid}/result    → Atualizar resultado
 * 
 * - GET    /competitions/{id}/standings               → Classificação
 */

import { apiClient } from './client';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type CompetitionType = 
  | 'league'
  | 'cup' 
  | 'tournament'
  | 'friendly'
  | 'round_robin'
  | 'knockout'
  | 'groups_knockout';

export type PhaseType = 
  | 'group'
  | 'knockout'
  | 'round_robin'
  | 'semifinal'
  | 'final'
  | 'third_place'
  | 'qualifier';

export type MatchStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'finished'
  | 'postponed'
  | 'cancelled';

export type CompetitionStatus = 
  | 'draft'
  | 'published'
  | 'in_progress'
  | 'finished'
  | 'cancelled';

export type Modality = 
  | 'masculino'
  | 'feminino'
  | 'misto'
  | 'beach_handball';

// =============================================================================
// TYPES - Competition V2
// =============================================================================

export interface CompetitionV2 {
  id: string;
  team_id: string;
  name: string;
  season: string;
  organization?: string;
  modality: Modality;
  competition_type: CompetitionType;
  format_details?: Record<string, any>;
  tiebreaker_criteria?: string[];
  points_per_win: number;
  points_per_draw: number;
  points_per_loss: number;
  status: CompetitionStatus;
  current_phase_id?: string;
  regulation_file_url?: string;
  regulation_notes?: string;
  ai_parsed?: boolean;
  ai_confidence_score?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CompetitionV2Create {
  team_id: string;
  name: string;
  season: string;
  organization?: string;
  modality?: Modality;
  competition_type: CompetitionType;
  format_details?: Record<string, any>;
  tiebreaker_criteria?: string[];
  points_per_win?: number;
  points_per_draw?: number;
  points_per_loss?: number;
  status?: CompetitionStatus;
  regulation_file_url?: string;
  regulation_notes?: string;
}

export interface CompetitionV2Update {
  name?: string;
  season?: string;
  organization?: string;
  modality?: Modality;
  competition_type?: CompetitionType;
  format_details?: Record<string, any>;
  tiebreaker_criteria?: string[];
  points_per_win?: number;
  points_per_draw?: number;
  points_per_loss?: number;
  status?: CompetitionStatus;
  current_phase_id?: string;
  regulation_file_url?: string;
  regulation_notes?: string;
}

// =============================================================================
// TYPES - Phase
// =============================================================================

export interface CompetitionPhase {
  id: string;
  competition_id: string;
  name: string;
  phase_type: PhaseType;
  phase_order: number;
  group_name?: string;
  config?: Record<string, any>;
  status: CompetitionStatus;
  created_at: string;
  updated_at: string;
}

export interface CompetitionPhaseCreate {
  name: string;
  phase_type: PhaseType;
  phase_order?: number;
  group_name?: string;
  config?: Record<string, any>;
}

export interface CompetitionPhaseUpdate {
  name?: string;
  phase_type?: PhaseType;
  phase_order?: number;
  group_name?: string;
  config?: Record<string, any>;
  status?: CompetitionStatus;
}

// =============================================================================
// TYPES - Opponent Team
// =============================================================================

export interface CompetitionOpponentTeam {
  id: string;
  competition_id: string;
  name: string;
  abbreviation?: string;
  city?: string;
  logo_url?: string;
  external_reference_id?: string;
  stats?: OpponentTeamStats;
  created_at: string;
  updated_at: string;
}

export interface OpponentTeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface CompetitionOpponentTeamCreate {
  name: string;
  abbreviation?: string;
  city?: string;
  logo_url?: string;
  external_reference_id?: string;
}

export interface CompetitionOpponentTeamUpdate {
  name?: string;
  abbreviation?: string;
  city?: string;
  logo_url?: string;
}

// =============================================================================
// TYPES - Match
// =============================================================================

export interface CompetitionMatch {
  id: string;
  competition_id: string;
  phase_id?: string;
  our_team_id: string;
  opponent_team_id: string;
  opponent_team?: CompetitionOpponentTeam;
  match_date?: string;
  match_time?: string;
  venue?: string;
  is_home_game: boolean;
  our_score?: number;
  opponent_score?: number;
  status: MatchStatus;
  match_number?: number;
  round_number?: number;
  external_reference_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionMatchCreate {
  phase_id?: string;
  opponent_team_id: string;
  match_date?: string;
  match_time?: string;
  venue?: string;
  is_home_game?: boolean;
  match_number?: number;
  round_number?: number;
  external_reference_id?: string;
  notes?: string;
}

export interface CompetitionMatchUpdate {
  phase_id?: string;
  opponent_team_id?: string;
  match_date?: string;
  match_time?: string;
  venue?: string;
  is_home_game?: boolean;
  match_number?: number;
  round_number?: number;
  notes?: string;
  status?: MatchStatus;
}

export interface CompetitionMatchResultUpdate {
  our_score: number;
  opponent_score: number;
  status?: MatchStatus;
}

// =============================================================================
// TYPES - Standing
// =============================================================================

export interface CompetitionStanding {
  id: string;
  competition_id: string;
  phase_id?: string;
  team_id: string;
  team_name: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  is_our_team: boolean;
  updated_at: string;
}

// =============================================================================
// TYPES - AI Integration
// =============================================================================

export interface AIExtractedTeam {
  name: string;
  abbreviation?: string;
  city?: string;
  is_our_team: boolean;
  confidence: number;
}

export interface AIExtractedMatch {
  home_team: string;
  away_team: string;
  date?: string;
  time?: string;
  venue?: string;
  round_number?: number;
  match_number?: number;
  home_score?: number;
  away_score?: number;
  external_reference_id?: string;
  confidence: number;
}

export interface AIExtractedPhase {
  name: string;
  phase_type: PhaseType;
  group_name?: string;
  teams: string[];
  matches: AIExtractedMatch[];
  confidence: number;
}

export interface AIExtractedCompetition {
  name: string;
  season: string;
  organization?: string;
  modality?: Modality;
  competition_type: CompetitionType;
  format_details?: Record<string, any>;
  tiebreaker_criteria?: string[];
  teams: AIExtractedTeam[];
  phases: AIExtractedPhase[];
  confidence_scores: {
    overall: number;
    name: number;
    teams: number;
    matches: number;
    dates: number;
  };
  warnings: string[];
  suggestions: string[];
}

export interface AIParseRequest {
  pdf_base64: string;
  our_team_name: string;
  hints?: string;
}

export interface AIParseResponse {
  success: boolean;
  data?: AIExtractedCompetition;
  error?: string;
  processing_time_ms: number;
}

export interface AIImportRequest {
  extracted_data: AIExtractedCompetition;
  create_phases: boolean;
  create_teams: boolean;
  create_matches: boolean;
}

// =============================================================================
// TYPES - Responses
// =============================================================================

export interface CompetitionV2WithRelations extends CompetitionV2 {
  phases: CompetitionPhase[];
  opponent_teams: CompetitionOpponentTeam[];
  matches: CompetitionMatch[];
  standings?: CompetitionStanding[];
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// =============================================================================
// TYPES - Params
// =============================================================================

export interface CompetitionV2ListParams {
  page?: number;
  limit?: number;
  team_id?: string;
  season?: string;
  status?: CompetitionStatus;
  modality?: Modality;
}

export interface CompetitionMatchListParams {
  phase_id?: string;
  status?: MatchStatus;
  opponent_team_id?: string;
  from_date?: string;
  to_date?: string;
}

// =============================================================================
// API SERVICE
// =============================================================================

export const competitionsV2Service = {
  // =========================================================================
  // COMPETITION V2
  // =========================================================================
  
  /**
   * Cria nova competição V2
   */
  create: async (data: CompetitionV2Create): Promise<CompetitionV2> => {
    return apiClient.post<CompetitionV2>('/competitions/v2', data);
  },

  /**
   * Busca competição com todas as relações
   */
  getFullById: async (id: string): Promise<CompetitionV2WithRelations> => {
    return apiClient.get<CompetitionV2WithRelations>(`/competitions/v2/${id}/full`);
  },

  /**
   * Atualiza competição V2
   */
  update: async (id: string, data: CompetitionV2Update): Promise<CompetitionV2> => {
    return apiClient.patch<CompetitionV2>(`/competitions/v2/${id}`, data);
  },

  // =========================================================================
  // AI - GEMINI INTEGRATION
  // =========================================================================
  
  /**
   * Envia PDF para parsing com IA Gemini
   * 
   * @param pdfBase64 - PDF em base64
   * @param ourTeamName - Nome da nossa equipe (para identificação)
   * @param hints - Dicas opcionais para a IA
   * @returns Dados extraídos da competição
   */
  parsePdfWithAI: async (
    pdfBase64: string,
    ourTeamName: string,
    hints?: string
  ): Promise<AIParseResponse> => {
    const request: AIParseRequest = {
      pdf_base64: pdfBase64,
      our_team_name: ourTeamName,
      hints,
    };
    return apiClient.post<AIParseResponse>('/competitions/v2/parse-pdf', request);
  },

  /**
   * Importa dados extraídos pela IA para uma competição existente
   */
  importFromAI: async (
    competitionId: string,
    extractedData: AIExtractedCompetition,
    options?: {
      createPhases?: boolean;
      createTeams?: boolean;
      createMatches?: boolean;
    }
  ): Promise<CompetitionV2WithRelations> => {
    const request: AIImportRequest = {
      extracted_data: extractedData,
      create_phases: options?.createPhases ?? true,
      create_teams: options?.createTeams ?? true,
      create_matches: options?.createMatches ?? true,
    };
    return apiClient.post<CompetitionV2WithRelations>(
      `/competitions/v2/${competitionId}/import-from-ai`,
      request
    );
  },

  // =========================================================================
  // PHASES
  // =========================================================================
  
  /**
   * Lista fases de uma competição
   */
  listPhases: async (competitionId: string): Promise<CompetitionPhase[]> => {
    return apiClient.get<CompetitionPhase[]>(`/competitions/${competitionId}/phases`);
  },

  /**
   * Cria nova fase
   */
  createPhase: async (
    competitionId: string,
    data: CompetitionPhaseCreate
  ): Promise<CompetitionPhase> => {
    return apiClient.post<CompetitionPhase>(`/competitions/${competitionId}/phases`, data);
  },

  /**
   * Atualiza fase
   */
  updatePhase: async (
    competitionId: string,
    phaseId: string,
    data: CompetitionPhaseUpdate
  ): Promise<CompetitionPhase> => {
    return apiClient.patch<CompetitionPhase>(
      `/competitions/${competitionId}/phases/${phaseId}`,
      data
    );
  },

  /**
   * Remove fase
   */
  deletePhase: async (competitionId: string, phaseId: string): Promise<void> => {
    return apiClient.delete(`/competitions/${competitionId}/phases/${phaseId}`);
  },

  // =========================================================================
  // OPPONENT TEAMS
  // =========================================================================
  
  /**
   * Lista equipes adversárias de uma competição
   */
  listOpponentTeams: async (competitionId: string): Promise<CompetitionOpponentTeam[]> => {
    return apiClient.get<CompetitionOpponentTeam[]>(
      `/competitions/${competitionId}/opponent-teams`
    );
  },

  /**
   * Cria equipe adversária
   */
  createOpponentTeam: async (
    competitionId: string,
    data: CompetitionOpponentTeamCreate
  ): Promise<CompetitionOpponentTeam> => {
    return apiClient.post<CompetitionOpponentTeam>(
      `/competitions/${competitionId}/opponent-teams`,
      data
    );
  },

  /**
   * Cria múltiplas equipes adversárias em lote
   */
  bulkCreateOpponentTeams: async (
    competitionId: string,
    teams: CompetitionOpponentTeamCreate[]
  ): Promise<CompetitionOpponentTeam[]> => {
    return apiClient.post<CompetitionOpponentTeam[]>(
      `/competitions/${competitionId}/opponent-teams/bulk`,
      { teams }
    );
  },

  /**
   * Atualiza equipe adversária
   */
  updateOpponentTeam: async (
    competitionId: string,
    teamId: string,
    data: CompetitionOpponentTeamUpdate
  ): Promise<CompetitionOpponentTeam> => {
    return apiClient.patch<CompetitionOpponentTeam>(
      `/competitions/${competitionId}/opponent-teams/${teamId}`,
      data
    );
  },

  // =========================================================================
  // MATCHES
  // =========================================================================
  
  /**
   * Lista jogos de uma competição
   */
  listMatches: async (
    competitionId: string,
    params?: CompetitionMatchListParams
  ): Promise<CompetitionMatch[]> => {
    return apiClient.get<CompetitionMatch[]>(
      `/competitions/${competitionId}/matches`,
      { params }
    );
  },

  /**
   * Cria jogo
   */
  createMatch: async (
    competitionId: string,
    data: CompetitionMatchCreate
  ): Promise<CompetitionMatch> => {
    return apiClient.post<CompetitionMatch>(
      `/competitions/${competitionId}/matches`,
      data
    );
  },

  /**
   * Cria múltiplos jogos em lote (upsert via external_reference_id)
   */
  bulkCreateMatches: async (
    competitionId: string,
    matches: CompetitionMatchCreate[]
  ): Promise<{ created: number; updated: number; matches: CompetitionMatch[] }> => {
    return apiClient.post<{ created: number; updated: number; matches: CompetitionMatch[] }>(
      `/competitions/${competitionId}/matches/bulk`,
      { matches }
    );
  },

  /**
   * Atualiza resultado de um jogo
   */
  updateMatchResult: async (
    competitionId: string,
    matchId: string,
    result: CompetitionMatchResultUpdate
  ): Promise<CompetitionMatch> => {
    return apiClient.patch<CompetitionMatch>(
      `/competitions/${competitionId}/matches/${matchId}/result`,
      result
    );
  },

  // =========================================================================
  // STANDINGS
  // =========================================================================
  
  /**
   * Obtém classificação de uma competição
   */
  getStandings: async (
    competitionId: string,
    phaseId?: string
  ): Promise<CompetitionStanding[]> => {
    return apiClient.get<CompetitionStanding[]>(
      `/competitions/${competitionId}/standings`,
      { params: phaseId ? { phase_id: phaseId } : undefined }
    );
  },

  // =========================================================================
  // HELPERS
  // =========================================================================
  
  /**
   * Converte arquivo PDF para base64
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo "data:application/pdf;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

export default competitionsV2Service;
