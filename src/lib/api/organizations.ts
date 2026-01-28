// Placeholder organizations API to unblock build; swap with real implementation when available.
export interface Organization {
  id: string;
  name: string;
  legal_name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface OrganizationCreate {
  name: string;
  legal_name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface OrganizationUpdate extends Partial<OrganizationCreate> {}

export interface OrganizationListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export const organizationsService = {
  async list(_params: OrganizationListParams = {}): Promise<PaginatedResponse<Organization>> {
    return { items: [], total: 0 };
  },
  async create(_payload: OrganizationCreate): Promise<Organization> {
    return { id: crypto.randomUUID(), ..._payload };
  },
  async update(id: string, payload: OrganizationUpdate): Promise<Organization> {
    return { id, ...payload, name: payload.name || 'Organização' };
  },
  async delete(_id: string): Promise<void> {
    return;
  },
};
