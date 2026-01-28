/**
 * Serviço de API - Teams (Equipes)
 * Conforme REGRAS.md V1.2
 * 
 * RDB16: Teams requerem category_id e gender
 */

import { apiClient } from './client';

export type TeamGender = 'F' | 'M';

export interface Team {
  id: string;
  organization_id: string;
  season_id: string;
  category_id: number;
  name: string;
  gender: TeamGender;
  description?: string;
  is_active: boolean;
  active_from?: string;
  active_until?: string;
  coach_membership_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Dados expandidos (quando incluídos)
  organization?: {
    id: string;
    name: string;
  };
  category?: {
    id: number;
    name: string;
    min_age: number;
    max_age: number;
  };
  coach?: {
    id: string;
    user_id: string;
    person_id: string;
    name: string;
  };
}

export interface TeamCreate {
  organization_id?: string;  // Opcional se usuário tem apenas uma org
  season_id: string;
  category_id: number;
  name: string;
  gender: TeamGender;
  description?: string;
  active_from?: string;
  active_until?: string;
  coach_membership_id?: string;
}

export interface TeamUpdate {
  name?: string;
  description?: string;
  gender?: TeamGender;
  category_id?: number;
  is_active?: boolean;
  active_from?: string;
  active_until?: string;
  coach_membership_id?: string;
}

export interface TeamPaginatedResponse {
  items: Team[];
  page: number;
  limit: number;
  total: number;
}

export const teamsService = {
  /**
   * Lista todas as equipes
   */
  async list(params?: {
    organization_id?: string;
    season_id?: string;
    category_id?: number;
    gender?: TeamGender;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<TeamPaginatedResponse> {
    return apiClient.get<TeamPaginatedResponse>('/teams', params);
  },

  /**
   * Lista equipes de uma organização
   */
  async listByOrganization(organizationId: string, params?: {
    season_id?: string;
    category_id?: number;
    gender?: TeamGender;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<TeamPaginatedResponse> {
    return apiClient.get<TeamPaginatedResponse>(
      `/organizations/${organizationId}/teams`,
      params
    );
  },

  /**
   * Busca uma equipe por ID
   */
  async getById(id: string): Promise<Team> {
    return apiClient.get<Team>(`/teams/${id}`);
  },

  /**
   * Cria uma nova equipe
   * RDB16: Requer category_id e gender
   */
  async create(data: TeamCreate): Promise<Team> {
    return apiClient.post<Team>('/teams', data);
  },

  /**
   * Atualiza uma equipe
   */
  async update(id: string, data: TeamUpdate): Promise<Team> {
    return apiClient.patch<Team>(`/teams/${id}`, data);
  },

  /**
   * Ativa/Desativa uma equipe
   */
  async setActive(id: string, isActive: boolean): Promise<Team> {
    return apiClient.patch<Team>(`/teams/${id}`, { is_active: isActive });
  },

  /**
   * Exclui uma equipe (soft delete)
   */
  async delete(id: string, reason?: string): Promise<void> {
    const params = reason ? { reason } : {};
    return apiClient.delete<void>(`/teams/${id}`, params);
  },
};
