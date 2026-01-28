import { apiClient } from "./client";
import type { Athlete, AthleteState } from "@/types/athlete-canonical";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  state?: AthleteState | AthleteState[];
  organization_id?: string;
  team_id?: string;
  category_id?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
  has_team?: boolean;
}

export const athletesService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<Athlete>> {
    const normalizedState = Array.isArray(params.state) ? params.state.join(",") : params.state;
    const response = await apiClient.get<PaginatedResponse<Athlete>>("/athletes", {
      params: { ...params, state: normalizedState },
    });
    return {
      items: response.items || [],
      total: response.total || 0,
      page: response.page,
      limit: response.limit,
    };
  },

  async create(payload: any): Promise<Athlete> {
    return apiClient.post<Athlete>("/athletes", payload);
  },

  async update(id: string, payload: any): Promise<Athlete> {
    return apiClient.patch<Athlete>(`/athletes/${id}`, payload);
  },

  async delete(id: string, reason: string): Promise<void> {
    await apiClient.delete(`/athletes/${id}`, { data: { reason } });
  },

  async changeState(id: string, state: AthleteState, reason?: string): Promise<Athlete> {
    return apiClient.patch<Athlete>(`/athletes/${id}`, {
      state,
      ...(reason && { admin_note: reason }),
    });
  },
};

export type { Athlete, AthleteState, ListParams as AthleteListParams };
export type AthleteCreate = Partial<Athlete>;
