import { apiClient } from "./client";

export interface Person {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  social_name?: string;
  birth_date?: string;
  gender?: string;
  nationality?: string;
  notes?: string;
  primary_email?: string;
  primary_phone?: string;
  addresses?: any[];
  contacts?: Array<{
    contact_type: string;
    contact_value: string;
    is_primary?: boolean;
  }>;
  documents?: Array<{
    document_type: string;
    document_number: string;
  }>;
  media?: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface PersonListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const personsService = {
  async list(params: PersonListParams = {}): Promise<PaginatedResponse<Person>> {
    return apiClient.get<PaginatedResponse<Person>>("/persons", { params });
  },

  async getById(id: string): Promise<Person> {
    return apiClient.get<Person>(`/persons/${id}`);
  },

  async create(payload: Partial<Person>): Promise<Person> {
    return apiClient.post<Person>("/persons", payload);
  },

  async update(id: string, payload: Partial<Person>): Promise<Person> {
    return apiClient.patch<Person>(`/persons/${id}`, payload);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/persons/${id}`);
  },
};
