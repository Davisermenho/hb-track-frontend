/**
 * Serviço de API - Team Registrations (Registro de Atletas em Times)
 * Conforme REGRAS.md V1.2
 * 
 * R15: Atleta só pode ser registrada em time de categoria compatível com idade
 * R12: Atleta ativa pode pertencer a apenas um time por temporada
 */

import { apiClient } from './client';

export type RegistrationStatus = 'active' | 'inactive' | 'transferred' | 'released';

export interface TeamRegistration {
  id: string;
  team_id: string;
  athlete_id: string;
  shirt_number?: number;
  registration_date: string;
  departure_date?: string;
  status: RegistrationStatus;
  created_by_membership_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Dados expandidos (quando incluídos)
  team?: {
    id: string;
    name: string;
    category_id: number;
    gender: string;
  };
  athlete?: {
    id: string;
    athlete_name: string;
    birth_date: string;
    category_id: number;
  };
}

export interface TeamRegistrationCreate {
  team_id: string;
  athlete_id: string;
  shirt_number?: number;
  registration_date?: string;  // Default: hoje
  notes?: string;
}

export interface TeamRegistrationUpdate {
  shirt_number?: number;
  status?: RegistrationStatus;
  departure_date?: string;
  notes?: string;
}

export interface TeamRegistrationPaginatedResponse {
  items: TeamRegistration[];
  page: number;
  limit: number;
  total: number;
}

export const teamRegistrationsService = {
  /**
   * Lista todos os registros de atletas em times
   */
  async list(params?: {
    team_id?: string;
    athlete_id?: string;
    status?: RegistrationStatus;
    page?: number;
    limit?: number;
  }): Promise<TeamRegistrationPaginatedResponse> {
    return apiClient.get<TeamRegistrationPaginatedResponse>('/team-registrations', params);
  },

  /**
   * Busca um registro por ID
   */
  async getById(id: string): Promise<TeamRegistration> {
    return apiClient.get<TeamRegistration>(`/team-registrations/${id}`);
  },

  /**
   * Lista atletas de um time específico
   */
  async listByTeam(teamId: string, params?: {
    status?: RegistrationStatus;
    page?: number;
    limit?: number;
  }): Promise<TeamRegistrationPaginatedResponse> {
    return apiClient.get<TeamRegistrationPaginatedResponse>(
      `/teams/${teamId}/registrations`,
      params
    );
  },

  /**
   * Lista times de uma atleta específica
   */
  async listByAthlete(athleteId: string, params?: {
    status?: RegistrationStatus;
    page?: number;
    limit?: number;
  }): Promise<TeamRegistrationPaginatedResponse> {
    return apiClient.get<TeamRegistrationPaginatedResponse>(
      `/athletes/${athleteId}/registrations`,
      params
    );
  },

  /**
   * Cria um novo registro
   * Backend valida R15 (categoria compatível) e R12 (um time por temporada)
   */
  async create(data: TeamRegistrationCreate): Promise<TeamRegistration> {
    return apiClient.post<TeamRegistration>('/team-registrations', data);
  },

  /**
   * Atualiza um registro
   */
  async update(id: string, data: TeamRegistrationUpdate): Promise<TeamRegistration> {
    return apiClient.patch<TeamRegistration>(`/team-registrations/${id}`, data);
  },

  /**
   * Transfere atleta para outro time
   * Automaticamente: desativa registro atual e cria novo
   */
  async transfer(
    currentRegistrationId: string,
    newTeamId: string,
    shirtNumber?: number
  ): Promise<TeamRegistration> {
    return apiClient.post<TeamRegistration>(`/team-registrations/${currentRegistrationId}/transfer`, {
      new_team_id: newTeamId,
      shirt_number: shirtNumber
    });
  },

  /**
   * Libera atleta do time (R13: muda status para 'released')
   */
  async release(id: string, reason?: string): Promise<TeamRegistration> {
    return apiClient.patch<TeamRegistration>(`/team-registrations/${id}`, {
      status: 'released',
      departure_date: new Date().toISOString().split('T')[0],
      notes: reason
    });
  },

  /**
   * Exclui um registro (soft delete)
   */
  async delete(id: string, reason?: string): Promise<void> {
    const params = reason ? { reason } : {};
    return apiClient.delete<void>(`/team-registrations/${id}`, params);
  },
};
