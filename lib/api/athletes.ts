/**
 * Serviço de API - Athletes (Atletas)
 * Atualizado conforme nova estrutura do banco (2025-12-27)
 */

import { apiClient } from './client';

// R12: Estados são 'ativa' | 'dispensada' | 'arquivada'
// R13: lesão/afastamento são FLAGS (injured, medical_restriction, suspended_until, load_restricted)
export type AthleteState = 'ativa' | 'dispensada' | 'arquivada';

export interface Athlete {
  // Identificação (sistema)
  id: string;
  organization_id: string;
  created_by_membership_id: string;
  person_id: string;

  // Dados pessoais
  athlete_name: string;
  athlete_nickname?: string | null;
  birth_date: string;  // NOT NULL no banco
  gender?: 'masculino' | 'feminino' | null;  // Gênero do atleta

  // Timestamps
  registered_at: string;
  created_at: string;
  updated_at: string;

  // Campos calculados (automático via trigger)
  athlete_age_at_registration: number;
  category_id: number;

  // Número da camisa
  shirt_number?: number | null;

  // Posições (FK para tabelas auxiliares)
  main_defensive_position_id: number;  // NOT NULL no banco (após popular)
  secondary_defensive_position_id?: number | null;
  main_offensive_position_id?: number | null;  // Obrigatório exceto para goleiras
  secondary_offensive_position_id?: number | null;

  // Documentos
  athlete_rg: string;  // NOT NULL no banco (após popular)
  athlete_cpf: string;  // NOT NULL no banco (após popular)

  // Contatos
  athlete_phone: string;  // NOT NULL no banco (após popular)
  athlete_email?: string | null;

  // Responsável
  guardian_name?: string | null;
  guardian_phone?: string | null;

  // Escolaridade
  schooling_id?: number | null;

  // Endereço completo
  zip_code?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  address_state?: string | null;  // UF
  address_number?: string | null;
  address_complement?: string | null;

  // Status - R12: Estados são 'ativa' | 'dispensada' | 'arquivada'
  state: AthleteState;
  is_active: boolean;

  // Soft delete
  deleted_at?: string | null;
  deleted_reason?: string | null;

  // Campo legacy (deprecated - use main_defensive_position_id)
  position?: string | null;
}

export interface AthleteCreate {
  // Campos obrigatórios
  athlete_name: string;  // min 3, max 100
  birth_date: string;  // YYYY-MM-DD
  gender: 'masculino' | 'feminino';  // Obrigatório - handebol não tem categoria mista
  main_defensive_position_id: number;  // FK defensive_positions
  athlete_rg: string;  // UNIQUE - Obrigatório
  athlete_phone: string;  // normalizar formato - Obrigatório
  athlete_email: string;  // UNIQUE - Obrigatório conforme REGRAS Seção 11

  // RF1.1: team_id é OPCIONAL (atleta pode existir sem equipe)
  team_id?: string;  // UUID - Opcional

  // Campos opcionais
  athlete_cpf?: string;  // UNIQUE, validar dígitos - OPCIONAL conforme REGRAS
  athlete_nickname?: string;  // max 50
  shirt_number?: number;  // 1-99
  secondary_defensive_position_id?: number;
  main_offensive_position_id?: number;  // Obrigatório se não for goleira (id=5) - validado no backend
  secondary_offensive_position_id?: number;
  guardian_name?: string;  // max 100
  guardian_phone?: string;
  schooling_id?: number;
  zip_code?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  address_state?: string;  // 2 chars (UF)
  address_number?: string;
  address_complement?: string;
}

export interface AthleteUpdate {
  athlete_name?: string;
  athlete_nickname?: string;
  birth_date?: string;
  shirt_number?: number;
  main_defensive_position_id?: number;
  secondary_defensive_position_id?: number;
  main_offensive_position_id?: number;
  secondary_offensive_position_id?: number;
  athlete_rg?: string;
  athlete_cpf?: string;
  athlete_phone?: string;
  athlete_email?: string;
  guardian_name?: string;
  guardian_phone?: string;
  schooling_id?: number;
  zip_code?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  address_state?: string;
  address_number?: string;
  address_complement?: string;
}

export interface AthletePaginatedResponse {
  items: Athlete[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Estatísticas de atletas para dashboard (FASE 2)
 */
export interface AthleteStats {
  total: number;
  em_captacao: number;
  lesionadas: number;
  suspensas: number;
  ativas: number;
  dispensadas: number;
  arquivadas: number;
  com_restricao_medica: number;
  carga_restrita: number;
  por_categoria: Record<string, number>;
}

export const athletesService = {
  /**
   * Lista todas as atletas
   * 
   * V1.2 (Opção B - REGRAS.md):
   * - has_team: true = apenas COM equipe, false = apenas SEM equipe, undefined = todas
   */
  async list(params?: {
    state?: AthleteState;
    search?: string;
    team_id?: string;
    has_team?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AthletePaginatedResponse> {
    return apiClient.get<AthletePaginatedResponse>('/athletes', params);
  },

  /**
   * Retorna estatísticas de atletas para dashboard
   */
  async getStats(): Promise<AthleteStats> {
    return apiClient.get<AthleteStats>('/athletes/stats');
  },

  /**
   * Busca uma atleta por ID
   */
  async getById(id: string): Promise<Athlete> {
    return apiClient.get<Athlete>(`/athletes/${id}`);
  },

  /**
   * Cria uma nova atleta
   */
  async create(data: AthleteCreate): Promise<Athlete> {
    return apiClient.post<Athlete>('/athletes', data);
  },

  /**
   * Atualiza uma atleta
   */
  async update(id: string, data: AthleteUpdate): Promise<Athlete> {
    return apiClient.patch<Athlete>(`/athletes/${id}`, data);
  },

  /**
   * Altera o estado de uma atleta
   */
  async changeState(id: string, state: AthleteState, reason?: string): Promise<Athlete> {
    return apiClient.patch<Athlete>(`/athletes/${id}/state`, { state, reason });
  },

  /**
   * Exclui uma atleta (soft delete)
   */
  async delete(id: string, reason?: string): Promise<void> {
    const params = reason ? { reason } : {};
    return apiClient.delete<void>(`/athletes/${id}`, params);
  },
};
