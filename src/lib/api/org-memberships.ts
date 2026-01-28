// Placeholder org-memberships API to unblock build; replace with real backend wiring.
import { apiClient } from './client';

export type OrgMembershipRole = 'dirigente' | 'coordenador' | 'treinador';

export interface OrgMembership {
  id: string;
  person_id: string;
  full_name: string;
  email: string;
  role: string;
  person?: {
    id: string;
    full_name: string;
  };
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  organization_id?: string;
  is_active?: boolean;
  joined_at?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface OrgMembershipsListParams {
  page?: number;
  limit?: number;
  organization_id?: string;
  role?: OrgMembershipRole;
  role_id?: number;
  is_active?: boolean;
  active_only?: boolean;
  search?: string;
}

export interface StaffCreatePayload {
  person: Record<string, unknown>;
  user: Record<string, unknown>;
  contacts?: Record<string, unknown>[];
  organization_id?: string;
}

export const orgMembershipsService = {
  /**
   * Lista org_memberships com filtros
   * @param params Filtros: role_id (3=treinador), active_only, page, limit
   */
  async list(params: OrgMembershipsListParams = {}): Promise<PaginatedResponse<OrgMembership>> {
    const queryParams = new URLSearchParams();
    
    if (params.role_id !== undefined) queryParams.append('role_id', String(params.role_id));
    if (params.active_only !== undefined) queryParams.append('active_only', String(params.active_only));
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    
    return await apiClient.get<PaginatedResponse<OrgMembership>>(`/org-memberships?${queryParams.toString()}`);
  },

  async listByOrganization(
    organizationId: string,
    params: Omit<OrgMembershipsListParams, "organization_id"> = {},
  ): Promise<PaginatedResponse<OrgMembership>> {
    return this.list({ ...params, organization_id: organizationId });
  },
  async deactivate(_id: string): Promise<void> {
    return;
  },
};

export const staffService = {
  async createDirigente(
    _person: StaffCreatePayload['person'],
    _user: StaffCreatePayload['user'],
    _organizationId?: string,
    _contacts?: StaffCreatePayload['contacts'],
  ): Promise<void> {
    return;
  },
  async createCoordenador(
    _person: StaffCreatePayload['person'],
    _user: StaffCreatePayload['user'],
    _organizationId: string,
    _contacts?: StaffCreatePayload['contacts'],
  ): Promise<void> {
    return;
  },
  async createTreinador(
    _person: StaffCreatePayload['person'],
    _user: StaffCreatePayload['user'],
    _organizationId: string,
    _contacts?: StaffCreatePayload['contacts'],
  ): Promise<void> {
    return;
  },
};
