import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  person_id?: string;
  role?: string;
  is_active?: boolean;
  is_super_admin?: boolean;
  full_name?: string;
  phone?: string;
  needs_setup?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

interface ListParams {
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  role?: string;
}

export const usersService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>("/users", { params });
  },

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async create(payload: Partial<User>): Promise<User> {
    return apiClient.post<User>("/users", payload);
  },

  async update(id: string, payload: Partial<User>): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, payload);
  },

  async delete(id: string, reason?: string): Promise<void> {
    await apiClient.delete(`/users/${id}`, { data: reason ? { reason } : undefined });
  },

  async activate(id: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, { is_active: true });
  },

  async deactivate(id: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, { is_active: false });
  },
};

export type { ListParams as UserListParams };
