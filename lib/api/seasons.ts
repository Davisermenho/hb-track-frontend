/**
 * Serviço de API - Seasons (Temporadas)
 */

import { apiClient } from './client';

export interface Season {
  id: string;
  organization_id: string;
  year: number;
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  status: 'planejada' | 'ativa' | 'interrompida' | 'cancelada' | 'encerrada';
  created_at: string;
  updated_at: string;
}

export interface SeasonCreate {
  year: number;
  name?: string;
  start_date?: string;
  end_date?: string;
}

export interface SeasonUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
}

export interface SeasonPaginatedResponse {
  items: Season[];
  page: number;
  limit: number;
  total: number;
}

export const seasonsService = {
  /**
   * Lista todas as temporadas
   */
  async list(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<SeasonPaginatedResponse> {
    return apiClient.get<SeasonPaginatedResponse>('/seasons', params);
  },

  /**
   * Busca uma temporada por ID
   */
  async getById(id: string): Promise<Season> {
    return apiClient.get<Season>(`/seasons/${id}`);
  },

  /**
   * Cria uma nova temporada
   */
  async create(data: SeasonCreate): Promise<Season> {
    return apiClient.post<Season>('/seasons', data);
  },

  /**
   * Atualiza uma temporada
   */
  async update(id: string, data: SeasonUpdate): Promise<Season> {
    return apiClient.patch<Season>(`/seasons/${id}`, data);
  },

  /**
   * Obtém a temporada ativa
   */
  async getActive(): Promise<Season | null> {
    try {
      const response = await apiClient.get<SeasonPaginatedResponse>('/seasons', { status: 'ativa' });
      return response.items.length > 0 ? response.items[0] : null;
    } catch {
      return null;
    }
  },
};
