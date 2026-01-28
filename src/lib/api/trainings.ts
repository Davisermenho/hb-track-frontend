/**
 * API Service para Módulo de Treinos
 * 
 * Integração com backend:
 * - Training Cycles (Macrociclos e Mesociclos)
 * - Training Microcycles (Planejamento semanal)
 * - Training Sessions (Sessões de treino)
 * 
 * Base: TRAINNIG.MD + Backend schemas
 * Data: 2026-01-04
 */

import { apiClient } from "./client";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CycleType = "macro" | "meso";
export type CycleStatus = "active" | "completed" | "cancelled";
export type SessionStatus = "draft" | "scheduled" | "in_progress" | "pending_review" | "readonly";
export type TrainingExecutionOutcome = "on_time" | "delayed" | "canceled" | "shortened" | "extended";

/**
 * Training Cycle (Macrociclo ou Mesociclo)
 */
export interface TrainingCycle {
  id: string;
  organization_id: string;
  team_id: string;
  type: CycleType;
  start_date: string; // ISO 8601 date
  end_date: string; // ISO 8601 date
  objective?: string;
  notes?: string;
  status: CycleStatus;
  parent_cycle_id?: string; // Apenas para mesociclos
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Training Cycle com microciclos relacionados (usado em detalhes)
 */
export interface TrainingCycleWithMicrocycles extends TrainingCycle {
  microcycles?: TrainingMicrocycle[];
  mesocycles_count?: number; // Se for macrociclo
  sessions_count?: number;
}

/**
 * Training Microcycle (Planejamento semanal)
 */
export interface TrainingMicrocycle {
  id: string;
  organization_id: string;
  team_id: string;
  week_start: string; // ISO 8601 date
  week_end: string; // ISO 8601 date
  cycle_id?: string; // FK para mesociclo
  
  // Focos planejados (0-100, soma ≤ 120)
  planned_focus_attack_positional_pct?: number;
  planned_focus_defense_positional_pct?: number;
  planned_focus_transition_offense_pct?: number;
  planned_focus_transition_defense_pct?: number;
  planned_focus_attack_technical_pct?: number;
  planned_focus_defense_technical_pct?: number;
  planned_focus_physical_pct?: number;
  
  planned_weekly_load?: number;
  microcycle_type?: string;
  notes?: string;
  
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Training Microcycle com sessões relacionadas
 */
export interface TrainingMicrocycleWithSessions extends TrainingMicrocycle {
  sessions?: TrainingSession[];
  sessions_count?: number;
  avg_attendance_pct?: number;
  total_load?: number;
}

/**
 * Training Session (Sessão de treino)
 */
export interface TrainingSession {
  id: string;
  organization_id: string;
  team_id: string;
  season_id?: string;
  session_at: string; // ISO 8601 datetime
  session_type: string;
  main_objective?: string;
  secondary_objective?: string;
  notes?: string;
  planned_load?: number;
  group_climate?: number;
  intensity_target?: number;
  duration_planned_minutes?: number;
  duration_actual_minutes?: number;
  location?: string; // Local do treino
  
  // Estado
  status: SessionStatus;
  started_at?: string;
  ended_at?: string;
  execution_outcome: TrainingExecutionOutcome;
  delay_minutes?: number;
  cancellation_reason?: string;
  post_review_completed_at?: string;
  post_review_completed_by_user_id?: string;
  post_review_deadline_at?: string;
  closed_at?: string;
  closed_by_user_id?: string;
  
  // Relacionamento com microciclo
  microcycle_id?: string;
  
  // Focos executados (0-100, soma ≤ 120)
  focus_attack_positional_pct?: number;
  focus_defense_positional_pct?: number;
  focus_transition_offense_pct?: number;
  focus_transition_defense_pct?: number;
  focus_attack_technical_pct?: number;
  focus_defense_technical_pct?: number;
  focus_physical_pct?: number;
  
  // Desvios
  planning_deviation_flag: boolean;
  deviation_justification?: string;

  // Indicadores operacionais (agenda)
  exercises_count?: number;
  attendance_present_count?: number;
  attendance_total_count?: number;
  
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AthleteWithoutPresence {
  athlete_id: string;
  athlete_name: string;
  team_registration_id: string;
}

export interface SessionClosureFieldErrors {
  execution_outcome?: string;
  delay_minutes?: string;
  duration_actual_minutes?: string;
  cancellation_reason?: string;
  deviation_justification?: string;
  presence?: string;
}

export interface SessionClosureValidationResult {
  can_close: boolean;
  error_code?: string;
  field_errors: SessionClosureFieldErrors;
  athletes_without_presence: AthleteWithoutPresence[];
}

export interface SessionClosureResponse {
  success: boolean;
  session?: TrainingSession;
  validation?: SessionClosureValidationResult;
  message: string;
}

/**
 * Valores de foco (para sliders)
 */
export interface FocusValues {
  attack_positional_pct: number;
  defense_positional_pct: number;
  transition_offense_pct: number;
  transition_defense_pct: number;
  attack_technical_pct: number;
  defense_technical_pct: number;
  physical_pct: number;
}

/**
 * Análise de desvio entre planejado e executado
 */
export interface DeviationAnalysis {
  training_session_id: string;
  microcycle_id?: string;
  
  // Desvios por foco (diferença em pontos percentuais)
  deviation_attack_positional_pct?: number;
  deviation_defense_positional_pct?: number;
  deviation_transition_offense_pct?: number;
  deviation_transition_defense_pct?: number;
  deviation_attack_technical_pct?: number;
  deviation_defense_technical_pct?: number;
  deviation_physical_pct?: number;
  
  // Desvio total e flag
  total_deviation_pct: number;
  is_significant_deviation: boolean;
  
  // Mensagens
  deviation_message: string;
  suggestions: string[];
}

// ============================================================================
// REQUEST PAYLOADS
// ============================================================================

export interface CycleCreate {
  team_id: string;
  type: CycleType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  objective?: string;
  notes?: string;
  status?: CycleStatus;
  parent_cycle_id?: string; // Obrigatório se type='meso'
}

export interface CycleUpdate {
  objective?: string;
  notes?: string;
  status?: CycleStatus;
}

export interface MicrocycleCreate {
  team_id: string;
  week_start: string; // YYYY-MM-DD
  week_end: string; // YYYY-MM-DD
  cycle_id?: string;
  
  planned_focus_attack_positional_pct?: number;
  planned_focus_defense_positional_pct?: number;
  planned_focus_transition_offense_pct?: number;
  planned_focus_transition_defense_pct?: number;
  planned_focus_attack_technical_pct?: number;
  planned_focus_defense_technical_pct?: number;
  planned_focus_physical_pct?: number;
  
  planned_weekly_load?: number;
  microcycle_type?: string;
  notes?: string;
}

export interface MicrocycleUpdate {
  planned_focus_attack_positional_pct?: number;
  planned_focus_defense_positional_pct?: number;
  planned_focus_transition_offense_pct?: number;
  planned_focus_transition_defense_pct?: number;
  planned_focus_attack_technical_pct?: number;
  planned_focus_defense_technical_pct?: number;
  planned_focus_physical_pct?: number;
  
  planned_weekly_load?: number;
  microcycle_type?: string;
  notes?: string;
}

export interface SessionCreate {
  organization_id: string;
  team_id: string; // Obrigatório (removido opcional)
  session_at: string; // ISO 8601 datetime
  session_type?: string;
  main_objective?: string;
  secondary_objective?: string;
  notes?: string;
  planned_load?: number;
  group_climate?: number;
  intensity_target?: number;
  highlight?: string;
  next_corrections?: string;
  microcycle_id?: string;
  duration_planned_minutes?: number;
  location?: string;

  focus_attack_positional_pct?: number;
  focus_defense_positional_pct?: number;
  focus_transition_offense_pct?: number;
  focus_transition_defense_pct?: number;
  focus_attack_technical_pct?: number;
  focus_defense_technical_pct?: number;
  focus_physical_pct?: number;

  // Justificativa para distribuição acima de 100%
  deviation_justification?: string;
}

export interface SessionUpdate {
  session_at?: string;
  session_type?: string;
  main_objective?: string;
  secondary_objective?: string;
  notes?: string;
  planned_load?: number;
  intensity_target?: number;
  duration_planned_minutes?: number;
  duration_actual_minutes?: number;
  location?: string;
  microcycle_id?: string;
  execution_outcome?: TrainingExecutionOutcome;
  delay_minutes?: number;
  cancellation_reason?: string;

  focus_attack_positional_pct?: number;
  focus_defense_positional_pct?: number;
  focus_transition_offense_pct?: number;
  focus_transition_defense_pct?: number;
  focus_attack_technical_pct?: number;
  focus_defense_technical_pct?: number;
  focus_physical_pct?: number;

  deviation_justification?: string;
}

// ============================================================================
// FILTERS & PARAMS
// ============================================================================

export interface CycleFilters {
  team_id?: string;
  type?: CycleType;
  status?: CycleStatus;
  include_deleted?: boolean;
}

export interface MicrocycleFilters {
  team_id?: string;
  cycle_id?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  include_deleted?: boolean;
}

export interface SessionFilters {
  team_id?: string;
  season_id?: string;
  status?: SessionStatus;
  microcycle_id?: string;
  start_date?: string;
  end_date?: string;
  has_deviation?: boolean;
  include_deleted?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// API SERVICE
// ============================================================================

export const trainingsService = {
  // ==========================================================================
  // TRAINING CYCLES
  // ==========================================================================

  /**
   * Lista ciclos de treinamento (macrociclos e mesociclos)
   */
  async getCycles(filters: CycleFilters): Promise<TrainingCycle[]> {
    const params: Record<string, any> = {
      team_id: filters.team_id,
    };
    
    if (filters.type) params.cycle_type = filters.type;
    if (filters.status) params.status = filters.status;
    if (filters.include_deleted) params.include_deleted = filters.include_deleted;
    
    return apiClient.get<TrainingCycle[]>("/training-cycles", { params });
  },

  /**
   * Busca ciclo por ID (com microciclos relacionados)
   */
  async getCycle(id: string): Promise<TrainingCycleWithMicrocycles> {
    return apiClient.get<TrainingCycleWithMicrocycles>(`/training-cycles/${id}`);
  },

  /**
   * Cria novo ciclo (macrociclo ou mesociclo)
   */
  async createCycle(data: CycleCreate): Promise<TrainingCycle> {
    return apiClient.post<TrainingCycle>("/training-cycles", data);
  },

  /**
   * Atualiza ciclo existente
   */
  async updateCycle(id: string, data: CycleUpdate): Promise<TrainingCycle> {
    return apiClient.patch<TrainingCycle>(`/training-cycles/${id}`, data);
  },

  /**
   * Soft delete de ciclo
   */
  async deleteCycle(id: string, reason: string): Promise<void> {
    await apiClient.delete(`/training-cycles/${id}`, { 
      params: { reason } 
    });
  },

  /**
   * Busca ciclos ativos de uma equipe
   */
  async getActiveCycles(teamId: string): Promise<TrainingCycle[]> {
    return apiClient.get<TrainingCycle[]>(`/training-cycles/teams/${teamId}/active`);
  },

  // ==========================================================================
  // TRAINING MICROCYCLES
  // ==========================================================================

  /**
   * Lista microciclos (planejamento semanal)
   */
  async getMicrocycles(filters: MicrocycleFilters): Promise<TrainingMicrocycle[]> {
    const params: Record<string, any> = {
      team_id: filters.team_id,
    };
    
    if (filters.cycle_id) params.cycle_id = filters.cycle_id;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.include_deleted) params.include_deleted = filters.include_deleted;
    
    return apiClient.get<TrainingMicrocycle[]>("/training-microcycles", { params });
  },

  /**
   * Busca microciclo por ID (com sessões relacionadas)
   */
  async getMicrocycle(id: string): Promise<TrainingMicrocycleWithSessions> {
    return apiClient.get<TrainingMicrocycleWithSessions>(`/training-microcycles/${id}`);
  },

  /**
   * Cria novo microciclo
   */
  async createMicrocycle(data: MicrocycleCreate): Promise<TrainingMicrocycle> {
    return apiClient.post<TrainingMicrocycle>("/training-microcycles", data);
  },

  /**
   * Atualiza microciclo existente
   */
  async updateMicrocycle(id: string, data: MicrocycleUpdate): Promise<TrainingMicrocycle> {
    return apiClient.patch<TrainingMicrocycle>(`/training-microcycles/${id}`, data);
  },

  /**
   * Soft delete de microciclo
   */
  async deleteMicrocycle(id: string, reason: string): Promise<void> {
    await apiClient.delete(`/training-microcycles/${id}`, { 
      params: { reason } 
    });
  },

  /**
   * Busca microciclo atual de uma equipe (semana corrente)
   */
  async getCurrentMicrocycle(teamId: string): Promise<TrainingMicrocycle | null> {
    try {
      return await apiClient.get<TrainingMicrocycle>(`/training-microcycles/teams/${teamId}/current`);
    } catch (error) {
      // Retorna null se não houver microciclo para a semana atual
      return null;
    }
  },

  /**
   * Busca resumo analítico de um microciclo
   */
  async getMicrocycleSummary(id: string): Promise<TrainingMicrocycleWithSessions> {
    return apiClient.get<TrainingMicrocycleWithSessions>(`/training-microcycles/${id}/summary`);
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converte objeto com prefixo focus_ para FocusValues
 */
export function convertToFocusValues(obj: Record<string, any>): FocusValues {
  return {
    attack_positional_pct: obj.focus_attack_positional_pct || obj.attack_positional_pct || 0,
    defense_positional_pct: obj.focus_defense_positional_pct || obj.defense_positional_pct || 0,
    transition_offense_pct: obj.focus_transition_offense_pct || obj.transition_offense_pct || 0,
    transition_defense_pct: obj.focus_transition_defense_pct || obj.transition_defense_pct || 0,
    attack_technical_pct: obj.focus_attack_technical_pct || obj.attack_technical_pct || 0,
    defense_technical_pct: obj.focus_defense_technical_pct || obj.defense_technical_pct || 0,
    physical_pct: obj.focus_physical_pct || obj.physical_pct || 0,
  };
}

/**
 * Calcula soma total dos focos
 */
export function calculateFocusTotal(focus: Partial<FocusValues> | Record<string, any>): number {
  const normalized = 'focus_attack_positional_pct' in focus ? convertToFocusValues(focus) : focus as Partial<FocusValues>;
  return (
    (normalized.attack_positional_pct || 0) +
    (normalized.defense_positional_pct || 0) +
    (normalized.transition_offense_pct || 0) +
    (normalized.transition_defense_pct || 0) +
    (normalized.attack_technical_pct || 0) +
    (normalized.defense_technical_pct || 0) +
    (normalized.physical_pct || 0)
  );
}

/**
 * Valida se soma dos focos está dentro do limite (≤ 120)
 */
export function validateFocusTotal(focus: Partial<FocusValues> | Record<string, any>): boolean {
  return calculateFocusTotal(focus) <= 120;
}

// ============================================================================
// STEP 14: SISTEMA DE VALIDAÇÃO SEMÁFORO
// ============================================================================

/**
 * Status de validação do semáforo (Verde, Amarelo, Vermelho)
 */
export type FocusValidationStatus = 'valid' | 'warning' | 'error';

/**
 * Resultado da validação semáforo de distribuição de focos
 */
export interface FocusValidationResult {
  status: FocusValidationStatus;
  total: number;
  color: 'green' | 'yellow' | 'red';
  message: string;
  canSubmit: boolean;
  requiresJustification: boolean;
  icon: 'check-circle' | 'alert-circle' | 'x-circle';
}

/**
 * Template de treino customizado do banco (Step 30)
 */
export interface SessionTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  icon: 'target' | 'activity' | 'bar-chart' | 'shield' | 'zap' | 'flame';
  focus_attack_positional_pct: number;
  focus_defense_positional_pct: number;
  focus_transition_offense_pct: number;
  focus_transition_defense_pct: number;
  focus_attack_technical_pct: number;
  focus_defense_technical_pct: number;
  focus_physical_pct: number;
  is_favorite: boolean;
  is_active: boolean;
  created_by_membership_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionTemplateCreate {
  name: string;
  description?: string | null;
  icon?: 'target' | 'activity' | 'bar-chart' | 'shield' | 'zap' | 'flame';
  focus_attack_positional_pct: number;
  focus_defense_positional_pct: number;
  focus_transition_offense_pct: number;
  focus_transition_defense_pct: number;
  focus_attack_technical_pct: number;
  focus_defense_technical_pct: number;
  focus_physical_pct: number;
  is_favorite?: boolean;
}

export interface SessionTemplateUpdate {
  name?: string;
  description?: string | null;
  icon?: 'target' | 'activity' | 'bar-chart' | 'shield' | 'zap' | 'flame';
  focus_attack_positional_pct?: number;
  focus_defense_positional_pct?: number;
  focus_transition_offense_pct?: number;
  focus_transition_defense_pct?: number;
  focus_attack_technical_pct?: number;
  focus_defense_technical_pct?: number;
  focus_physical_pct?: number;
  is_favorite?: boolean;
  is_active?: boolean;
}

export interface SessionTemplateListResponse {
  templates: SessionTemplate[];
  total: number;
  limit: number;
}

/**
 * Valida distribuição de focos com sistema semáforo
 * 
 * Regras:
 * - Verde (≤100%): Válido, pode submeter
 * - Amarelo (101-120%): Aviso, requer justificativa
 * - Vermelho (>120%): Erro, bloqueia submit
 * 
 * @param focus - Valores dos 7 focos
 * @returns Resultado da validação com status, cor, ícone e mensagem
 */
export function getFocusStatus(focus: Partial<FocusValues> | Record<string, any>): FocusValidationResult {
  const total = calculateFocusTotal(focus);

  // Verde: ≤100% - Distribuição ideal
  if (total <= 100) {
    return {
      status: 'valid',
      total,
      color: 'green',
      message: `Distribuição válida (${total.toFixed(1)}%)`,
      canSubmit: true,
      requiresJustification: false,
      icon: 'check-circle',
    };
  }

  // Amarelo: 101-120% - Requer justificativa
  if (total <= 120) {
    return {
      status: 'warning',
      total,
      color: 'yellow',
      message: `Distribuição acima de 100% (${total.toFixed(1)}%). Justificativa obrigatória.`,
      canSubmit: true,
      requiresJustification: true,
      icon: 'alert-circle',
    };
  }

  // Vermelho: >120% - Bloqueia submit
  return {
    status: 'error',
    total,
    color: 'red',
    message: `Distribuição excede 120% (${total.toFixed(1)}%). Reduza os valores.`,
    canSubmit: false,
    requiresJustification: false,
    icon: 'x-circle',
  };
}

/**
 * Valida justificativa de desvio (Step 14)
 * 
 * Regras:
 * - Mínimo 50 caracteres
 * - Máximo 500 caracteres
 * - Remove espaços em branco das extremidades
 * 
 * @param text - Texto da justificativa
 * @returns true se válida, false caso contrário
 */
export function validateJustification(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 50 && trimmed.length <= 500;
}

/**
 * Formata data para formato do backend (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calcula duração de um ciclo em dias
 */
export function calculateCycleDuration(cycle: TrainingCycle): number {
  const start = new Date(cycle.start_date);
  const end = new Date(cycle.end_date);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// COPY WEEK FUNCTIONALITY
// ============================================================================

export interface CopyWeekParams {
  team_id: string;
  source_week_start: string; // YYYY-MM-DD
  target_week_start: string; // YYYY-MM-DD
}

export interface CopyWeekResult {
  sessions_copied: number;
  message: string;
}

/**
 * Copia todas as sessões de uma semana para outra
 */
export async function copyWeek(params: CopyWeekParams): Promise<CopyWeekResult> {
  return apiClient.post<CopyWeekResult>('/training-sessions/copy-week', params);
}

// ============================================================================
// TRAINING SUGGESTIONS API
// ============================================================================

export interface SuggestionEvidence {
  avg_deviation: number
  direction: 'above' | 'below'
  consistency: number
  occurrences: number
  total_analyzed: number
}

export interface FocusSuggestion {
  focus_field: string
  focus_label: string
  suggested_adjustment: number
  reason: string
  evidence: SuggestionEvidence
  type: 'focus_adjustment'
  confidence: 'high' | 'medium' | 'low'
}

export interface SuggestionContext {
  period_analyzed: string
  microcycle_type?: string
}

export interface TrainingSuggestionsResponse {
  has_suggestions: boolean
  microcycles_analyzed: number
  suggestions?: FocusSuggestion[]
  context?: SuggestionContext
  reason?: string
  message?: string
}

export const TrainingSuggestionsAPI = {
  /**
   * Busca sugestões para novo microciclo
   */
  getSuggestions: async (
    teamId: string,
    microcycleType?: string
  ): Promise<TrainingSuggestionsResponse> => {
    const params = new URLSearchParams({ team_id: teamId })
    if (microcycleType) {
      params.append('microcycle_type', microcycleType)
    }

    return apiClient.get<TrainingSuggestionsResponse>(`/training-suggestions?${params}`)
  },

  /**
   * Aplica uma sugestão a um microciclo
   */
  applySuggestion: async (
    microcycleId: string,
    suggestion: FocusSuggestion
  ): Promise<TrainingMicrocycle> => {
    return apiClient.post<TrainingMicrocycle>('/training-suggestions/apply', {
      microcycle_id: microcycleId,
      suggestion,
    })
  },
}

// ============================================================================
// TRAINING SESSIONS API (Para componentes que precisam do formato específico)
// ============================================================================

export const TrainingSessionsAPI = {
  /**
   * Lista sessões de treino com paginação
   */
  listSessions: async (filters: SessionFilters = {}): Promise<{
    items: TrainingSession[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const queryParams: Record<string, any> = {
      page: filters.page || 1,
      limit: filters.limit || 50,
    };
    
    if (filters.team_id) queryParams.team_id = filters.team_id;
    if (filters.season_id) queryParams.season_id = filters.season_id;
    if (filters.status) queryParams.status = filters.status;
    if (filters.microcycle_id) queryParams.microcycle_id = filters.microcycle_id;
    if (filters.start_date) queryParams.start_date = filters.start_date;
    if (filters.end_date) queryParams.end_date = filters.end_date;
    if (filters.has_deviation !== undefined) queryParams.has_deviation = filters.has_deviation;
    if (filters.include_deleted) queryParams.include_deleted = filters.include_deleted;

    const response = await apiClient.get<{
      items: TrainingSession[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>('/training-sessions', { params: queryParams });
    
    return {
      items: response.items || [],
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 50,
    };
  },

  /**
   * Busca sessão por ID
   */
  getSession: async (id: string): Promise<TrainingSession> => {
    return apiClient.get<TrainingSession>(`/training-sessions/${id}`);
  },

  /**
   * Cria nova sessão
   */
  createSession: async (data: SessionCreate): Promise<TrainingSession> => {
    return apiClient.post<TrainingSession>('/training-sessions', data);
  },

  /**
   * Atualiza sessão
   */
  updateSession: async (id: string, data: SessionUpdate): Promise<TrainingSession> => {
    return apiClient.patch<TrainingSession>(`/training-sessions/${id}`, data);
  },

  /**
   * Atualiza apenas os focos de uma sessão (auto-save)
   */
  updateSessionFocus: async (
    id: string,
    focus: Partial<FocusValues>
  ): Promise<TrainingSession> => {
    const data: Partial<SessionUpdate> = {};
    
    if (focus.attack_positional_pct !== undefined) 
      data.focus_attack_positional_pct = focus.attack_positional_pct;
    if (focus.defense_positional_pct !== undefined) 
      data.focus_defense_positional_pct = focus.defense_positional_pct;
    if (focus.transition_offense_pct !== undefined) 
      data.focus_transition_offense_pct = focus.transition_offense_pct;
    if (focus.transition_defense_pct !== undefined) 
      data.focus_transition_defense_pct = focus.transition_defense_pct;
    if (focus.attack_technical_pct !== undefined) 
      data.focus_attack_technical_pct = focus.attack_technical_pct;
    if (focus.defense_technical_pct !== undefined) 
      data.focus_defense_technical_pct = focus.defense_technical_pct;
    if (focus.physical_pct !== undefined) 
      data.focus_physical_pct = focus.physical_pct;
    
    return TrainingSessionsAPI.updateSession(id, data);
  },

  /**
   * Deleta sessão (soft delete)
   * @param id - ID da sessão
   * @param reason - Motivo da exclusão (mínimo 5 caracteres, obrigatório pelo backend)
   */
  deleteSession: async (id: string, reason: string): Promise<void> => {
    await apiClient.delete(`/training-sessions/${id}`, {
      params: { reason }
    });
  },

  /**
   * Publica sessão completa (draft -> scheduled)
   */
  publishSession: async (id: string): Promise<TrainingSession> => {
    return apiClient.post<TrainingSession>(`/training-sessions/${id}/publish`, {});
  },

  /**
   * Finaliza revisão operacional (pending_review -> readonly)
   */
  closeSession: async (id: string): Promise<SessionClosureResponse> => {
    return apiClient.post<SessionClosureResponse>(`/training-sessions/${id}/close`, {});
  },

  /**
   * Busca análise de desvio planejado vs executado
   */
  getSessionDeviation: async (id: string): Promise<DeviationAnalysis> => {
    return apiClient.get<DeviationAnalysis>(`/training-sessions/${id}/deviation`);
  },

  /**
   * Salva justificativa de desvio
   */
  saveDeviationJustification: async (
    id: string,
    justification: string
  ): Promise<TrainingSession> => {
    return TrainingSessionsAPI.updateSession(id, { deviation_justification: justification });
  },

  // ========================================================================
  // SESSION TEMPLATES (Step 30)
  // ========================================================================

  /**
   * Lista templates de treino da organização (máx 50)
   * Ordenação: favoritos primeiro, depois alfabética
   */
  getSessionTemplates: async (activeOnly: boolean = true): Promise<SessionTemplateListResponse> => {
    return apiClient.get<SessionTemplateListResponse>('/session-templates', {
      params: { active_only: activeOnly },
    });
  },

  /**
   * Busca template específico por ID
   */
  getSessionTemplate: async (id: string): Promise<SessionTemplate> => {
    return apiClient.get<SessionTemplate>(`/session-templates/${id}`);
  },

  /**
   * Cria novo template customizado (limite 50 por org)
   */
  createSessionTemplate: async (data: SessionTemplateCreate): Promise<SessionTemplate> => {
    return apiClient.post<SessionTemplate>('/session-templates', data);
  },

  /**
   * Atualiza template existente (permite editar templates usados)
   */
  updateSessionTemplate: async (id: string, data: SessionTemplateUpdate): Promise<SessionTemplate> => {
    return apiClient.patch<SessionTemplate>(`/session-templates/${id}`, data);
  },

  /**
   * Toggle favorito do template (⭐)
   */
  toggleTemplateFavorite: async (id: string): Promise<SessionTemplate> => {
    return apiClient.patch<SessionTemplate>(`/session-templates/${id}/favorite`, {});
  },

  /**
   * Deleta template permanentemente (hard delete, libera espaço no limite 50)
   */
  deleteSessionTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/session-templates/${id}`);
  },

  /**
   * Duplica template com novo nome
   */
  duplicateSessionTemplate: async (id: string, newName: string): Promise<SessionTemplate> => {
    const template = await TrainingSessionsAPI.getSessionTemplate(id);
    const payload: SessionTemplateCreate = {
      name: newName,
      description: template.description,
      icon: template.icon,
      focus_attack_positional_pct: template.focus_attack_positional_pct,
      focus_defense_positional_pct: template.focus_defense_positional_pct,
      focus_transition_offense_pct: template.focus_transition_offense_pct,
      focus_transition_defense_pct: template.focus_transition_defense_pct,
      focus_attack_technical_pct: template.focus_attack_technical_pct,
      focus_defense_technical_pct: template.focus_defense_technical_pct,
      focus_physical_pct: template.focus_physical_pct,
      is_favorite: false, // Duplicatas não são favoritas por padrão
    };
    return TrainingSessionsAPI.createSessionTemplate(payload);
  },
};
