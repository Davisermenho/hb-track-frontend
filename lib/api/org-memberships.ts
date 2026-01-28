/**
 * Serviço de API - Organization Memberships (Membros de Organização)
 * Conforme REGRAS.md V1.2
 * 
 * Roles: dirigente, coordenador, treinador
 * RF1: Dirigente NÃO recebe org_membership automaticamente ao criar org
 * RF1.1: Coordenador e Treinador recebem org_membership automaticamente
 */

import { apiClient } from './client';

export type OrgMembershipRole = 'dirigente' | 'coordenador' | 'treinador';

export interface OrgMembership {
  id: string;
  organization_id: string;
  user_id: string;
  person_id?: string;
  role: OrgMembershipRole;
  is_active: boolean;
  joined_at: string;
  left_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Dados expandidos (quando incluídos)
  user?: {
    id: string;
    email: string;
    name: string;
  };
  person?: {
    id: string;
    full_name: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface OrgMembershipCreate {
  organization_id: string;
  user_id: string;
  person_id?: string;
  role: OrgMembershipRole;
}

export interface OrgMembershipUpdate {
  role?: OrgMembershipRole;
  is_active?: boolean;
  left_at?: string;
}

export interface OrgMembershipPaginatedResponse {
  items: OrgMembership[];
  page: number;
  limit: number;
  total: number;
}

export const orgMembershipsService = {
  /**
   * Lista todos os membros de organização
   * Backend endpoint: GET /memberships (não /org-memberships)
   */
  async list(params?: {
    organization_id?: string;
    user_id?: string;
    role?: OrgMembershipRole;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<OrgMembershipPaginatedResponse> {
    // Se tiver organization_id, usar endpoint específico
    if (params?.organization_id) {
      return this.listByOrganization(params.organization_id, params);
    }
    return apiClient.get<OrgMembershipPaginatedResponse>('/memberships', params);
  },

  /**
   * Busca um membership por ID
   * Backend endpoint: GET /memberships/{id}
   */
  async getById(id: string): Promise<OrgMembership> {
    return apiClient.get<OrgMembership>(`/memberships/${id}`);
  },

  /**
   * Lista membros de uma organização específica
   * Backend endpoint: GET /organizations/{org_id}/memberships
   */
  async listByOrganization(organizationId: string, params?: {
    role?: OrgMembershipRole;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<OrgMembershipPaginatedResponse> {
    // Converter role para role_code para o backend
    const queryParams = {
      ...params,
      role_code: params?.role,
    };
    delete (queryParams as Record<string, unknown>).role;
    
    return apiClient.get<OrgMembershipPaginatedResponse>(
      `/organizations/${organizationId}/memberships`,
      queryParams
    );
  },

  /**
   * Cria um novo membership
   * Backend endpoint: POST /organizations/{org_id}/memberships
   */
  async create(data: OrgMembershipCreate): Promise<OrgMembership> {
    return apiClient.post<OrgMembership>(
      `/organizations/${data.organization_id}/memberships`, 
      {
        person_id: data.person_id,
        role_code: data.role,
        start_date: new Date().toISOString().split('T')[0],
      }
    );
  },

  /**
   * Atualiza um membership
   * Backend endpoint: PATCH /memberships/{id}
   */
  async update(id: string, data: OrgMembershipUpdate): Promise<OrgMembership> {
    return apiClient.patch<OrgMembership>(`/memberships/${id}`, data);
  },

  /**
   * Desativa um membership (end_at = now)
   * Backend endpoint: PATCH /memberships/{id}
   */
  async deactivate(id: string): Promise<OrgMembership> {
    return apiClient.patch<OrgMembership>(`/memberships/${id}`, {
      is_active: false
    });
  },

  /**
   * Encerra um membership (soft delete via end_at)
   * Backend endpoint: POST /memberships/{id}/end
   */
  async delete(id: string, reason?: string): Promise<void> {
    const params = reason ? { reason } : {};
    return apiClient.post<void>(`/memberships/${id}/end`, params);
  },
};

/**
 * Serviço para criação de staff (Dirigente, Coordenador, Treinador)
 * Combina: Person + User + OrgMembership (opcional para Dirigente)
 */
export interface StaffCreatePayload {
  // Dados da pessoa
  person: {
    full_name: string;
    social_name?: string;
    birth_date?: string;
    gender?: string;
    nationality?: string;
  };
  
  // Dados do usuário
  user: {
    email: string;
    password: string;
    role: 'dirigente' | 'coordenador' | 'treinador';
  };
  
  // Membership (obrigatório para coordenador/treinador, opcional para dirigente)
  membership?: {
    organization_id: string;
  };
  
  // Contatos opcionais
  contacts?: Array<{
    contact_type: string;
    contact_value: string;
    is_primary?: boolean;
  }>;
}

export interface StaffCreateResponse {
  person: {
    id: string;
    full_name: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
  membership?: {
    id: string;
    organization_id: string;
    role: string;
  };
}

export const staffService = {
  /**
   * Cria um novo staff (Dirigente, Coordenador ou Treinador)
   * O backend aplica RF1/RF1.1 automaticamente:
   * - Dirigente: NÃO cria org_membership automaticamente
   * - Coordenador/Treinador: CRIA org_membership automaticamente
   */
  async create(data: StaffCreatePayload): Promise<StaffCreateResponse> {
    return apiClient.post<StaffCreateResponse>('/staff', data);
  },

  /**
   * Cria um Dirigente
   */
  async createDirigente(
    personData: StaffCreatePayload['person'],
    userData: Omit<StaffCreatePayload['user'], 'role'>,
    organizationId?: string,
    contacts?: StaffCreatePayload['contacts']
  ): Promise<StaffCreateResponse> {
    return this.create({
      person: personData,
      user: { ...userData, role: 'dirigente' },
      membership: organizationId ? { organization_id: organizationId } : undefined,
      contacts
    });
  },

  /**
   * Cria um Coordenador (org_membership automático via RF1.1)
   */
  async createCoordenador(
    personData: StaffCreatePayload['person'],
    userData: Omit<StaffCreatePayload['user'], 'role'>,
    organizationId: string,
    contacts?: StaffCreatePayload['contacts']
  ): Promise<StaffCreateResponse> {
    return this.create({
      person: personData,
      user: { ...userData, role: 'coordenador' },
      membership: { organization_id: organizationId },
      contacts
    });
  },

  /**
   * Cria um Treinador (org_membership automático via RF1.1)
   */
  async createTreinador(
    personData: StaffCreatePayload['person'],
    userData: Omit<StaffCreatePayload['user'], 'role'>,
    organizationId: string,
    contacts?: StaffCreatePayload['contacts']
  ): Promise<StaffCreateResponse> {
    return this.create({
      person: personData,
      user: { ...userData, role: 'treinador' },
      membership: { organization_id: organizationId },
      contacts
    });
  },
};
