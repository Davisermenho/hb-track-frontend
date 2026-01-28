import { apiClient } from "./client";

export interface Team {
  id: string;
  name: string;
  organization_id: string;
  organization_name?: string;
  category_id: number;
  gender: TeamGender;
  is_our_team: boolean;
  season_id?: string;
  description?: string | null;
  coach_membership_id?: string | null;
  created_by_user_id?: string | null; // Quem criou a equipe (owner)
  is_active?: boolean;
  active_from?: string | null;
  active_until?: string | null;
  alert_threshold_multiplier?: number; // Step 15: Multiplicador threshold (1.0-3.0)
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_reason?: string | null;
}

export type TeamGender = "feminino" | "masculino" | "misto";

export interface TeamCreate {
  name: string;
  organization_id?: string; // Opcional - backend extrai do token de autenticação
  category_id: number;
  season_id?: string;
  gender: TeamGender;
  is_our_team?: boolean;
  description?: string;
  coach_membership_id?: string;
  active_from?: string | null;
  active_until?: string | null;
}

export interface TeamUpdate {
  name?: string;
  category_id?: number;
  season_id?: string;
  gender?: TeamGender;
  is_our_team?: boolean;
  description?: string;
  coach_membership_id?: string;
  active_from?: string | null;
  active_until?: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

interface ListParams {
  page?: number;
  limit?: number;
  season_id?: string;
}

export interface TeamStaffMember {
  id: string;
  person_id: string;
  full_name: string;
  role: string;
  start_at: string | null;
  end_at: string | null;
  status?: string;
  resend_count?: number;
  can_resend_invite?: boolean;
}

export interface TeamStaffResponse {
  items: TeamStaffMember[];
  total: number;
}

export interface TeamRegistration {
  id: string;
  athlete_id: string;
  season_id: string;
  category_id: number;
  team_id: string;
  organization_id: string;
  role: string | null;
  start_at: string;
  end_at: string | null;
  created_at: string;
  // Campos adicionais via join (se disponíveis)
  athlete?: {
    id: string;
    athlete_name?: string;
    athlete_nickname?: string;
    shirt_number?: number;
    state?: string;
  };
}

export interface TeamRegistrationsResponse {
  items: TeamRegistration[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamInvite {
  id: string;
  person_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  invited_at?: string;
  expires_at?: string;
  is_expired: boolean;        // Sprint 3: indica se token expirou
  hours_remaining?: number;   // Sprint 3: horas restantes
  initials: string;
}

export interface TeamInviteListResponse {
  items: TeamInvite[];
  total: number;
}

export interface TeamInviteActionResponse {
  success: boolean;
  message: string;
  code?: string;              // Sprint 3: código de erro/sucesso
  person_id?: string;
  email_sent: boolean;
}

// Sprint 3: Interface para erros padronizados
export interface InviteErrorDetail {
  code: string;
  message: string;
}

export const teamsService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<Team>> {
    const response = await apiClient.get<PaginatedResponse<Team>>("/teams", { params });
    return {
      items: response.items || [],
      total: response.total || 0,
      page: response.page,
      limit: response.limit,
    };
  },

  async create(payload: Partial<Team>): Promise<Team> {
    return apiClient.post<Team>("/teams", payload as TeamCreate);
  },

  async update(id: string, payload: Partial<Team>): Promise<Team> {
    return apiClient.patch<Team>(`/teams/${id}`, payload as TeamUpdate);
  },

  async delete(id: string, reason?: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`, { data: reason ? { reason } : undefined });
  },

  async getById(id: string): Promise<Team> {
    return apiClient.get<Team>(`/teams/${id}`);
  },

  async getStaff(teamId: string, activeOnly: boolean = true): Promise<TeamStaffResponse> {
    return apiClient.get<TeamStaffResponse>(`/teams/${teamId}/staff`, {
      params: { active_only: activeOnly },
    });
  },

  /**
   * Lista convites pendentes da equipe (novas rotas RESTful)
   */
  async getTeamInvites(teamId: string): Promise<TeamInviteListResponse> {
    return apiClient.get<TeamInviteListResponse>(`/teams/${teamId}/invites`);
  },

  /**
   * @deprecated Use getTeamInvites(teamId) ao invés
   */
  async getPendingMembers(teamId?: string): Promise<{ items: any[]; total: number }> {
    // Fallback para rota legada se teamId não for informado
    if (!teamId) {
      return apiClient.get('/team-members/pending');
    }
    // Usar nova rota RESTful
    return apiClient.get<TeamInviteListResponse>(`/teams/${teamId}/invites`);
  },

  async getAthletes(
    teamId: string,
    params: { active_only?: boolean; page?: number; limit?: number } = {}
  ): Promise<TeamRegistrationsResponse> {
    const limit = Math.min(params.limit ?? 50, 100);
    return apiClient.get<TeamRegistrationsResponse>(`/teams/${teamId}/registrations`, {
      params: {
        active_only: params.active_only ?? true,
        page: params.page ?? 1,
        limit,
      },
    });
  },

  async removeAthlete(teamId: string, registrationId: string, endAt: string): Promise<TeamRegistration> {
    return apiClient.patch<TeamRegistration>(`/teams/${teamId}/registrations/${registrationId}`, {
      end_at: endAt,
    });
  },

  // Buscar atletas disponíveis para adicionar à equipe (não membros atuais)
  async getAvailableAthletes(params: { 
    page?: number; 
    limit?: number; 
    search?: string;
    gender?: string;
    category_id?: number;
    excludeTeamId?: string;
    teamCategoryId?: number; // Para filtrar apenas categorias iguais ou inferiores
  } = {}): Promise<PaginatedResponse<any>> {
    const queryParams: any = {
      skip: ((params.page ?? 1) - 1) * (params.limit ?? 50),
      limit: params.limit ?? 50,
    };
    
    if (params.search) queryParams.search = params.search;
    if (params.gender && params.gender !== 'todos') queryParams.gender = params.gender;
    if (params.category_id) queryParams.category_id = params.category_id;
    if (params.teamCategoryId) queryParams.team_category_id = params.teamCategoryId;
    
    return apiClient.get<PaginatedResponse<any>>("/persons", {
      params: queryParams,
    });
  },

  // Adicionar atleta à equipe
  async addAthleteToTeam(teamId: string, personId: string, data: {
    number?: number;
    position?: string;
    season_id?: string;
  } = {}): Promise<TeamRegistration> {
    return apiClient.post<TeamRegistration>(`/team-registrations`, {
      team_id: teamId,
      person_id: personId,
      ...data,
    });
  },

  /**
   * Envia convite para novo membro (nova rota RESTful)
   */
  async createTeamInvite(teamId: string, data: {
    email: string;
    role?: string;
  }): Promise<TeamInviteActionResponse> {
    return apiClient.post<TeamInviteActionResponse>(`/teams/${teamId}/invites`, {
      email: data.email,
      role: data.role || 'membro',
    });
  },

  /**
   * @deprecated Use createTeamInvite(teamId, data) ao invés
   */
  async inviteMember(data: {
    email: string;
    role?: string;
    team_id?: string;
    message?: string;
  }): Promise<{
    success: boolean;
    message: string;
    person_id?: string;
    email_sent: boolean;
  }> {
    // Se team_id for informado, usar nova rota RESTful
    if (data.team_id) {
      return apiClient.post<TeamInviteActionResponse>(`/teams/${data.team_id}/invites`, {
        email: data.email,
        role: data.role || 'membro',
      });
    }
    // Fallback para rota legada
    return apiClient.post('/team-members/invite', {
      email: data.email,
      role: data.role || 'membro',
      team_id: data.team_id,
      message: data.message,
    });
  },

  // Atualizar papel de um membro
  async updateMemberRole(teamId: string, memberId: string, newRole: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.patch(`/teams/${teamId}/members/${memberId}/role`, {
      role: newRole,
    });
  },

  // Remover membro da equipe
  async removeMember(teamId: string, memberId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.delete(`/teams/${teamId}/members/${memberId}`);
  },

  /**
   * Remove membro do staff (comissão técnica).
   * Step 35: Endpoint universal para remover dirigente/coordenador/treinador.
   * 
   * Comportamento:
   * - Se treinador: encerra vínculo, remove referência do team, notifica via WebSocket
   * - Se outro: soft delete
   * 
   * @returns {team_without_coach: boolean} - true se equipe ficou sem treinador
   */
  async removeStaffMember(teamId: string, membershipId: string): Promise<{
    success: boolean;
    team_without_coach: boolean;
    message: string;
  }> {
    return apiClient.delete(`/teams/${teamId}/staff/${membershipId}`);
  },

  /**
   * Reatribui/Adiciona treinador à equipe.
   * Step 18: Endpoint existente.
   * 
   * Substitui coach antigo (se existir) por novo, enviando notificações.
   * 
   * @param newCoachMembershipId - UUID do novo org_membership_id do treinador
   */
  async assignCoach(teamId: string, newCoachMembershipId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.patch(`/teams/${teamId}/coach`, {
      new_coach_membership_id: newCoachMembershipId,
    });
  },

  /**
   * Lista coaches disponíveis (org_memberships com role_id=3).
   * Step 38: Para modal "Adicionar Treinador".
   * 
   * @param activeOnly - Apenas coaches ativos (end_at IS NULL)
   */
  async getAvailableCoaches(params: { active_only?: boolean } = {}): Promise<{
    items: Array<{
      id: string; // org_membership_id
      person_id: string;
      full_name: string;
      email?: string;
      role: string;
    }>;
    total: number;
  }> {
    return apiClient.get('/org-memberships', {
      params: {
        role_id: 3, // treinador
        active_only: params.active_only ?? true,
      },
    });
  },

  /**
   * Cancela convite pendente (nova rota RESTful)
   */
  async cancelInvite(teamId: string, inviteId: string): Promise<TeamInviteActionResponse> {
    return apiClient.delete<TeamInviteActionResponse>(`/teams/${teamId}/invites/${inviteId}`);
  },

  /**
   * Reenvia convite expirado (nova rota RESTful)
   */
  async resendInvite(teamId: string, inviteId: string): Promise<TeamInviteActionResponse> {
    return apiClient.post<TeamInviteActionResponse>(`/teams/${teamId}/invites/${inviteId}/resend`);
  },
};
