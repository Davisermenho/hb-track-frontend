/**
 * Serviço de API - Organizations (Organizações)
 * Conforme REGRAS.md V1.2
 */

import { apiClient } from './client';

export interface Organization {
  id: string;
  name: string;
  legal_name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface OrganizationCreate {
  name: string;
  legal_name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface OrganizationUpdate {
  name?: string;
  legal_name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  is_active?: boolean;
}

export interface OrganizationPaginatedResponse {
  items: Organization[];
  page: number;
  limit: number;
  total: number;
}

export const organizationsService = {
  /**
   * Lista todas as organizações
   */
  async list(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<OrganizationPaginatedResponse> {
    return apiClient.get<OrganizationPaginatedResponse>('/organizations', params);
  },

  /**
   * Busca uma organização por ID
   */
  async getById(id: string): Promise<Organization> {
    return apiClient.get<Organization>(`/organizations/${id}`);
  },

  /**
   * Cria uma nova organização
   * RF1: Ao criar org, dirigente criador NÃO recebe org_membership automaticamente
   * RF1.1: Coordenadores e Treinadores recebem org_membership automático
   */
  async create(data: OrganizationCreate): Promise<Organization> {
    return apiClient.post<Organization>('/organizations', data);
  },

  /**
   * Atualiza uma organização
   */
  async update(id: string, data: OrganizationUpdate): Promise<Organization> {
    return apiClient.patch<Organization>(`/organizations/${id}`, data);
  },

  /**
   * Exclui uma organização (soft delete)
   */
  async delete(id: string, reason?: string): Promise<void> {
    const params = reason ? { reason } : {};
    return apiClient.delete<void>(`/organizations/${id}`, params);
  },

  /**
   * Upload do logo da organização
   */
  async uploadLogo(id: string, file: File): Promise<Organization> {
    return apiClient.uploadFile<Organization>(`/organizations/${id}/logo`, file);
  },
};
