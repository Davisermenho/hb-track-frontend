/**
 * Serviço de API - Users (Usuários/Treinadores)
 */

import { apiClient } from './client';

export interface User {
  id: string;
  person_id: string;
  organization_id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_superadmin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPaginatedResponse {
  items: User[];
  page: number;
  limit: number;
  total: number;
}

export const usersService = {
  /**
   * Lista usuários (pode filtrar por role)
   */
  async list(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UserPaginatedResponse> {
    return apiClient.get<UserPaginatedResponse>('/users', params);
  },

  /**
   * Busca um usuário por ID
   */
  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },
};
