import { apiClient } from "./client";

export interface Season {
  id: string;
  team_id: string;
  name: string;
  year: number;
  status?: string;
  competition_type?: string;
  start_date: string;
  end_date: string;
  canceled_at?: string | null;
  interrupted_at?: string | null;
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
  team_id?: string;
  year?: number;
  active?: boolean;
}

export const seasonsService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<Season>> {
    return apiClient.get<PaginatedResponse<Season>>("/seasons", { params });
  },

  async getById(id: string): Promise<Season> {
    return apiClient.get<Season>(`/seasons/${id}`);
  },

  async create(payload: Partial<Season>): Promise<Season> {
    return apiClient.post<Season>("/seasons", payload);
  },

  async update(id: string, payload: Partial<Season>): Promise<Season> {
    return apiClient.patch<Season>(`/seasons/${id}`, payload);
  },

  async delete(id: string, reason?: string): Promise<void> {
    await apiClient.delete(`/seasons/${id}`, { data: reason ? { reason } : undefined });
  },

  async cancel(id: string): Promise<Season> {
    return apiClient.patch<Season>(`/seasons/${id}/cancel`);
  },

  async interrupt(id: string): Promise<Season> {
    return apiClient.patch<Season>(`/seasons/${id}/interrupt`);
  },
};

export type { ListParams as SeasonListParams };
