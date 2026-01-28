/**
 * Helpers de API para testes E2E - INFRAESTRUTURA DETERMINÍSTICA
 * 
 * Funções para criar/manipular dados via API antes dos testes,
 * garantindo setup determinístico e rápido.
 * 
 * CONVENÇÕES:
 * - loginViaAPI() → retorna accessToken (string)
 * - create*ViaAPI() → retorna ID da entidade criada (string)
 * - get*ViaAPI() → retorna objeto completo ou null
 * - delete*ViaAPI() → retorna void
 * 
 * NOTA: Para chamadas cross-domain (API em :8000, frontend em :3000),
 * extraímos o token do storageState e passamos via Authorization header.
 */
import { APIRequestContext, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { SEED_MEMBERSHIP_TREINADOR_ID } from '../shared-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Lê o token de acesso do arquivo storageState
 */
export function getAccessTokenFromStorage(): string | null {
  try {
    const authFile = path.join(process.cwd(), 'playwright/.auth/user.json');
    if (!fs.existsSync(authFile)) return null;
    
    const data = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    const accessCookie = data.cookies?.find((c: any) => c.name === 'hb_access_token');
    return accessCookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Lê token de um arquivo de estado específico (para multi-role)
 */
export function getAccessTokenFromFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const accessCookie = data.cookies?.find((c: any) => c.name === 'hb_access_token');
    return accessCookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Cria headers com autenticação para chamadas à API
 */
function getAuthHeaders(token?: string): Record<string, string> {
  const accessToken = token || getAccessTokenFromStorage();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

/**
 * Login via API - retorna accessToken
 * 
 * @param email - Email do usuário
 * @param password - Senha do usuário
 * @returns accessToken (string)
 * 
 * @example
 * const token = await loginViaAPI('admin@test.com', 'password123');
 */
export async function loginViaAPI(
  email: string,
  password: string
): Promise<string> {
  // Criar context temporário para fazer a request
  const apiContext = await request.newContext({
    baseURL: API_BASE.replace('/api/v1', ''),
  });

  try {
    // O endpoint de login usa form-urlencoded (OAuth2)
    const response = await apiContext.post('/api/v1/auth/login', {
      form: {
        username: email,
        password: password,
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status()} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Login response missing access_token');
    }

    return data.access_token;
  } finally {
    await apiContext.dispose();
  }
}

// ============================================================================
// TEAMS
// ============================================================================

export interface CreateTeamInput {
  name?: string;
  category_id?: number;
  gender?: 'masculino' | 'feminino' | 'misto';
  description?: string;
  is_our_team?: boolean;
  season_id?: string;
  coach_membership_id?: string;
}

export interface Team {
  id: string;
  name: string;
  organization_id: string;
  category_id: number;
  gender: string;
  is_our_team: boolean;
  description?: string;
  created_at?: string;
}

/**
 * Cria um time via API - retorna ID
 * 
 * NOTA: Nome padrão usa prefixo "E2E-" para cleanup automático
 * Formato determinístico: E2E-Team-{hex6} (Regra 48)
 */
export async function createTeamViaAPI(
  request: APIRequestContext,
  data?: CreateTeamInput,
  token?: string
): Promise<string> {
  // Sufixo hex curto para unicidade (Regra 48)
  const suffix = Date.now().toString(16).slice(-6);
  
  const body: any = {
    name: data?.name ?? `E2E-Team-${suffix}`,
    category_id: data?.category_id ?? 1,
    gender: data?.gender ?? 'masculino',
    is_our_team: data?.is_our_team ?? true,
    description: data?.description,
    season_id: data?.season_id,
    // Backend exige coach_membership_id em TeamCreate schema
    // Usa SEED padrão se não fornecido explicitamente
    coach_membership_id: data?.coach_membership_id ?? SEED_MEMBERSHIP_TREINADOR_ID,
  };

  // IMPORTANTE: APIRequestContext do Playwright NÃO usa storageState automaticamente
  // Precisamos passar o token explicitamente via header Authorization
  const res = await request.post(`${API_BASE}/teams`, {
    data: body,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`createTeamViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const team = await res.json();
  return team.id;
}

/**
 * Obtém um time via API - retorna objeto ou null
 */
export async function getTeamViaAPI(
  request: APIRequestContext,
  teamId: string,
  token?: string
): Promise<Team | null> {
  const res = await request.get(`${API_BASE}/teams/${teamId}`, {
    headers: getAuthHeaders(token),
  });

  if (res.status() === 404) return null;

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`getTeamViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Atualiza um time via API
 */
export async function updateTeamViaAPI(
  request: APIRequestContext,
  teamId: string,
  data: Partial<CreateTeamInput>,
  token?: string
): Promise<Team> {
  const res = await request.patch(`${API_BASE}/teams/${teamId}`, {
    data,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`updateTeamViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Deleta um time via API
 */
export async function deleteTeamViaAPI(
  request: APIRequestContext,
  teamId: string,
  token?: string
): Promise<void> {
  const res = await request.delete(`${API_BASE}/teams/${teamId}`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok() && res.status() !== 404) {
    const errorText = await res.text();
    throw new Error(`deleteTeamViaAPI failed: ${res.status()} - ${errorText}`);
  }
}

/**
 * Lista times via API
 */
export async function listTeamsViaAPI(
  request: APIRequestContext,
  params?: { page?: number; limit?: number; search?: string },
  token?: string
): Promise<{ items: Team[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);

  const url = `${API_BASE}/teams${searchParams.toString() ? '?' + searchParams : ''}`;
  const res = await request.get(url, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`listTeamsViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? { items: data, total: data.length } : data;
}

// ============================================================================
// USERS
// ============================================================================

export interface CreateUserInput {
  email: string;
  password?: string;
  full_name?: string;
  role?: 'admin' | 'dirigente' | 'coordenador' | 'treinador' | 'atleta';
  is_active?: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
  is_super_admin?: boolean;
  created_at?: string;
}

/**
 * Cria um usuário via API - retorna ID
 * 
 * NOTA: Requer permissão de admin
 */
export async function createUserViaAPI(
  request: APIRequestContext,
  data: CreateUserInput,
  token?: string
): Promise<string> {
  const body = {
    email: data.email,
    password: data.password ?? 'TestPassword123!',
    full_name: data.full_name ?? `Test User ${Date.now()}`,
    role: data.role ?? 'treinador',
    is_active: data.is_active ?? true,
  };

  const res = await request.post(`${API_BASE}/users`, {
    data: body,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`createUserViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const user = await res.json();
  return user.id;
}

/**
 * Obtém um usuário via API
 */
export async function getUserViaAPI(
  request: APIRequestContext,
  userId: string,
  token?: string
): Promise<User | null> {
  const res = await request.get(`${API_BASE}/users/${userId}`, {
    headers: getAuthHeaders(token),
  });

  if (res.status() === 404) return null;

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`getUserViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Deleta um usuário via API
 */
export async function deleteUserViaAPI(
  request: APIRequestContext,
  userId: string,
  token?: string
): Promise<void> {
  const res = await request.delete(`${API_BASE}/users/${userId}`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok() && res.status() !== 404) {
    const errorText = await res.text();
    throw new Error(`deleteUserViaAPI failed: ${res.status()} - ${errorText}`);
  }
}

// ============================================================================
// ATHLETES
// ============================================================================

export interface CreateAthleteInput {
  full_name: string;
  birth_date?: string;
  gender?: 'masculino' | 'feminino';
  main_defensive_position_id?: number;
  main_offensive_position_id?: number;
}

export interface Athlete {
  id: string;
  full_name: string;
  birth_date?: string;
  gender?: string;
  state: 'ativa' | 'dispensada' | 'arquivada';
  created_at?: string;
}

/**
 * Cria um atleta via API - retorna ID
 */
export async function createAthleteViaAPI(
  request: APIRequestContext,
  data: CreateAthleteInput,
  token?: string
): Promise<string> {
  const body = {
    full_name: data.full_name,
    birth_date: data.birth_date ?? '2010-01-15',
    gender: data.gender ?? 'masculino',
    main_defensive_position_id: data.main_defensive_position_id ?? 1,
    main_offensive_position_id: data.main_offensive_position_id,
  };

  const res = await request.post(`${API_BASE}/athletes`, {
    data: body,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`createAthleteViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const athlete = await res.json();
  return athlete.id;
}

/**
 * Obtém um atleta via API
 */
export async function getAthleteViaAPI(
  request: APIRequestContext,
  athleteId: string,
  token?: string
): Promise<Athlete | null> {
  const res = await request.get(`${API_BASE}/athletes/${athleteId}`, {
    headers: getAuthHeaders(token),
  });

  if (res.status() === 404) return null;

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`getAthleteViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Deleta um atleta via API
 */
export async function deleteAthleteViaAPI(
  request: APIRequestContext,
  athleteId: string,
  reason?: string,
  token?: string
): Promise<void> {
  const res = await request.delete(`${API_BASE}/athletes/${athleteId}`, {
    data: reason ? { reason } : undefined,
    headers: getAuthHeaders(token),
  });

  if (!res.ok() && res.status() !== 404) {
    const errorText = await res.text();
    throw new Error(`deleteAthleteViaAPI failed: ${res.status()} - ${errorText}`);
  }
}

// ============================================================================
// TRAINING SESSIONS
// ============================================================================

export interface CreateSessionInput {
  team_id: string;
  organization_id?: string;
  session_at?: string;
  session_type?: string;
  main_objective?: string;
  duration_planned_minutes?: number;
  microcycle_id?: string;
}

export interface TrainingSession {
  id: string;
  team_id: string;
  session_at: string;
  status: 'draft' | 'in_progress' | 'closed' | 'readonly';
  session_type?: string;
  main_objective?: string;
  created_at?: string;
}

/**
 * Cria uma sessão de treino via API - retorna ID
 * 
 * NOTA: Se organization_id não for fornecido, busca automaticamente do team
 */
export async function createSessionViaAPI(
  request: APIRequestContext,
  data: CreateSessionInput,
  token?: string
): Promise<string> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  // Se organization_id não foi fornecido, buscar do team
  let organizationId = data.organization_id;
  if (!organizationId && data.team_id) {
    const team = await getTeamViaAPI(request, data.team_id, token);
    if (team) {
      organizationId = team.organization_id;
    }
  }

  const body = {
    team_id: data.team_id,
    organization_id: organizationId,
    session_at: data.session_at ?? tomorrow.toISOString(),
    session_type: data.session_type ?? 'quadra',  // Valores válidos: 'quadra', 'fisico', 'video', 'reuniao', 'teste'
    main_objective: data.main_objective ?? 'Treino E2E',
    duration_planned_minutes: data.duration_planned_minutes ?? 90,
    microcycle_id: data.microcycle_id,
  };

  // Usar rota scoped para garantir context correto e validações de permissão
  const res = await request.post(`${API_BASE}/teams/${data.team_id}/trainings`, {
    data: body,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`createSessionViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const session = await res.json();
  return session.id;
}

/**
 * Obtém uma sessão de treino via API
 */
export async function getSessionViaAPI(
  request: APIRequestContext,
  sessionId: string,
  token?: string
): Promise<TrainingSession | null> {
  const res = await request.get(`${API_BASE}/training-sessions/${sessionId}`, {
    headers: getAuthHeaders(token),
  });

  if (res.status() === 404) return null;

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`getSessionViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Deleta uma sessão de treino via API
 */
export async function deleteSessionViaAPI(
  request: APIRequestContext,
  sessionId: string,
  token?: string
): Promise<void> {
  // Soft delete requer query param "reason"
  const res = await request.delete(`${API_BASE}/training-sessions/${sessionId}?reason=E2E test cleanup`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok() && res.status() !== 404) {
    const errorText = await res.text();
    throw new Error(`deleteSessionViaAPI failed: ${res.status()} - ${errorText}`);
  }
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export interface InviteMemberInput {
  team_id: string;
  email: string;
  role?: string;
  full_name?: string;
  message?: string;
}

export interface TeamMember {
  id: string;
  person_id?: string;
  email?: string;
  full_name?: string;
  role: string;
  status?: string;
}

/**
 * Convida um membro para o time via API
 */
export async function inviteMemberViaAPI(
  request: APIRequestContext,
  data: InviteMemberInput,
  token?: string
): Promise<{ success: boolean; person_id?: string }> {
  const body = {
    team_id: data.team_id,
    email: data.email,
    role: data.role ?? 'membro',
    full_name: data.full_name,
    message: data.message,
  };

  const res = await request.post(`${API_BASE}/team-members/invite`, {
    data: body,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`inviteMemberViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Lista membros do time via API
 */
export async function listMembersViaAPI(
  request: APIRequestContext,
  teamId: string,
  token?: string
): Promise<TeamMember[]> {
  const res = await request.get(`${API_BASE}/teams/${teamId}/members`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`listMembersViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.items || [];
}

/**
 * Remove um membro do time via API
 */
export async function removeMemberViaAPI(
  request: APIRequestContext,
  teamId: string,
  memberId: string,
  token?: string
): Promise<void> {
  const res = await request.delete(`${API_BASE}/teams/${teamId}/members/${memberId}`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok() && res.status() !== 404) {
    const errorText = await res.text();
    throw new Error(`removeMemberViaAPI failed: ${res.status()} - ${errorText}`);
  }
}

/**
 * Atualiza o papel de um membro no time via API
 * 
 * CONTRATO (teams-CONTRACT.md):
 * - Endpoint: PATCH /teams/{teamId}/members/{memberId}
 * - Permissão: canChangeRoles (Owner, Admin/Dirigente)
 * - Payload: { role: string }
 * - Roles válidos: 'owner' | 'admin' | 'dirigente' | 'coordenador' | 'treinador' | 'membro' | 'atleta'
 */
export async function updateMemberRoleViaAPI(
  request: APIRequestContext,
  teamId: string,
  memberId: string,
  newRole: string,
  token?: string
): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
  const res = await request.patch(`${API_BASE}/teams/${teamId}/members/${memberId}`, {
    data: { role: newRole },
    headers: getAuthHeaders(token),
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok()) {
    return {
      success: false,
      error: data.detail?.message || data.detail || `Erro ${res.status()}`,
    };
  }

  return {
    success: true,
    member: data,
  };
}

// ============================================================================
// TEAM REGISTRATIONS (Atletas)
// ============================================================================

export interface TeamRegistration {
  id: string;
  team_id: string;
  person_id: string;
  number?: number;
  position?: string;
  season_id?: string;
  start_at?: string;
  end_at?: string | null;
  created_at?: string;
}

export interface CreateRegistrationInput {
  team_id: string;
  person_id: string;
  number?: number;
  position?: string;
  season_id?: string;
}

/**
 * Lista registrations (atletas) de um time via API
 * 
 * CONTRATO (teams-CONTRACT.md):
 * - Endpoint: GET /teams/{teamId}/registrations
 * - Params: active_only, page, limit
 */
export async function listRegistrationsViaAPI(
  request: APIRequestContext,
  teamId: string,
  options?: { activeOnly?: boolean; page?: number; limit?: number },
  token?: string
): Promise<{ items: TeamRegistration[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.activeOnly !== undefined) {
    params.append('active_only', String(options.activeOnly));
  }
  if (options?.page !== undefined) {
    params.append('page', String(options.page));
  }
  if (options?.limit !== undefined) {
    params.append('limit', String(options.limit));
  }
  
  const queryString = params.toString();
  const url = `${API_BASE}/teams/${teamId}/registrations${queryString ? `?${queryString}` : ''}`;
  
  const res = await request.get(url, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`listRegistrationsViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? { items: data, total: data.length } : data;
}

/**
 * Cria um registration (vincula atleta ao time) via API
 * 
 * CONTRATO (teams-CONTRACT.md):
 * - Endpoint: POST /team-registrations
 */
export async function createRegistrationViaAPI(
  request: APIRequestContext,
  input: CreateRegistrationInput,
  token?: string
): Promise<TeamRegistration> {
  const res = await request.post(`${API_BASE}/team-registrations`, {
    data: input,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`createRegistrationViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Encerra um registration (soft delete via end_at) via API
 * 
 * CONTRATO (teams-CONTRACT.md):
 * - Endpoint: PATCH /teams/{teamId}/registrations/{registrationId}
 * - Payload: { end_at: string }
 */
export async function endRegistrationViaAPI(
  request: APIRequestContext,
  teamId: string,
  registrationId: string,
  endAt?: string,
  token?: string
): Promise<{ success: boolean; registration?: TeamRegistration; error?: string }> {
  const res = await request.patch(`${API_BASE}/teams/${teamId}/registrations/${registrationId}`, {
    data: { end_at: endAt || new Date().toISOString() },
    headers: getAuthHeaders(token),
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok()) {
    return {
      success: false,
      error: data.detail?.message || data.detail || `Erro ${res.status()}`,
    };
  }

  return {
    success: true,
    registration: data,
  };
}

// ============================================================================
// TEAM INVITES (Sprint 1-3 - Rotas RESTful)
// ============================================================================

export interface TeamInvite {
  id: string;
  person_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  invited_at?: string;
  expires_at?: string;
  is_expired: boolean;
  hours_remaining?: number;
  initials: string;
}

export interface InviteActionResponse {
  success: boolean;
  message: string;
  code?: string;
  person_id?: string;
  email_sent: boolean;
}

/**
 * Lista convites pendentes de um time via API (Sprint 1)
 */
export async function listTeamInvitesViaAPI(
  request: APIRequestContext,
  teamId: string,
  token?: string
): Promise<{ items: TeamInvite[]; total: number }> {
  const res = await request.get(`${API_BASE}/teams/${teamId}/invites`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`listTeamInvitesViaAPI failed: ${res.status()} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Cria convite para membro via nova rota RESTful (Sprint 1)
 * Suporta invitee_kind para formulários específicos (Sprint 2)
 */
export async function createTeamInviteViaAPI(
  request: APIRequestContext,
  teamId: string,
  email: string,
  role?: string,
  inviteeKind?: string,
  token?: string
): Promise<InviteActionResponse> {
  const payload: any = { 
    email, 
    role: role ?? 'membro' 
  };
  
  // Adicionar invitee_kind se fornecido (para testar formulários específicos)
  if (inviteeKind) {
    payload.invitee_kind = inviteeKind;
  }
  
  const res = await request.post(`${API_BASE}/teams/${teamId}/invites`, {
    data: payload,
    headers: getAuthHeaders(token),
  });

  // Retornar resposta mesmo em caso de erro (para validar códigos)
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok()) {
    return {
      success: false,
      message: data.detail?.message || 'Erro ao criar convite',
      code: data.detail?.code,
      email_sent: false,
    };
  }

  return data;
}

/**
 * Reenvia convite via API (Sprint 1)
 */
export async function resendTeamInviteViaAPI(
  request: APIRequestContext,
  teamId: string,
  inviteId: string,
  token?: string
): Promise<InviteActionResponse> {
  const res = await request.post(`${API_BASE}/teams/${teamId}/invites/${inviteId}/resend`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok()) {
    return {
      success: false,
      message: data.detail?.message || 'Erro ao reenviar convite',
      code: data.detail?.code,
      email_sent: false,
    };
  }

  return data;
}

/**
 * Cancela convite via API (Sprint 1)
 */
export async function cancelTeamInviteViaAPI(
  request: APIRequestContext,
  teamId: string,
  inviteId: string,
  token?: string
): Promise<InviteActionResponse> {
  const res = await request.delete(`${API_BASE}/teams/${teamId}/invites/${inviteId}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok()) {
    return {
      success: false,
      message: data.detail?.message || 'Erro ao cancelar convite',
      code: data.detail?.code,
      email_sent: false,
    };
  }

  return data;
}

// ============================================================================
// WELCOME FLOW (Sprint 2)
// ============================================================================

export interface WelcomeVerifyResponse {
  valid: boolean;
  email?: string;
  full_name?: string;
  role?: string;
  invitee_kind?: string;
  team_name?: string;
  organization_name?: string;
  expires_at?: string;
}

/**
 * Verifica token de welcome via API (Sprint 2)
 */
export async function verifyWelcomeTokenViaAPI(
  request: APIRequestContext,
  token: string
): Promise<WelcomeVerifyResponse & { error?: { code: string; message: string } }> {
  const res = await request.get(`${API_BASE}/auth/welcome/verify?token=${token}`);

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok()) {
    return {
      valid: false,
      error: data.detail,
    };
  }

  return data;
}

/**
 * Completa cadastro de welcome via API (Sprint 2)
 * Suporta campos específicos por papel:
 * - Treinador: certifications, specialization
 * - Coordenador: area_of_expertise
 */
export async function completeWelcomeViaAPI(
  request: APIRequestContext,
  payload: {
    token: string;
    password: string;
    confirm_password: string;
    full_name: string;
    phone?: string;
    birth_date?: string;
    gender?: string;
    // Campos específicos de treinador
    certifications?: string;
    specialization?: string;
    // Campos específicos de coordenador
    area_of_expertise?: string;
  }
): Promise<{ success: boolean; user_id?: string; team_id?: string; error?: any }> {
  const res = await request.post(`${API_BASE}/auth/welcome/complete`, {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok()) {
    return {
      success: false,
      error: data.detail,
    };
  }

  return data;
}

// ============================================================================
// TEST HELPERS (E2E) - Requer E2E=1 no backend
// ============================================================================

export interface WelcomeTokenTestResponse {
  token: string;
  user_id: string;
  email: string;
  expires_at: string;
}

/**
 * Obtém token de welcome via endpoint de teste E2E
 * 
 * IMPORTANTE: Só funciona quando backend está com E2E=1
 * 
 * @param request - Playwright APIRequestContext
 * @param email - Email do usuário convidado (deve começar com e2e.)
 * @param token - Token de autenticação (admin/dirigente)
 * @returns Token de welcome ou null se não encontrado
 */
export async function getWelcomeTokenViaTestAPI(
  request: APIRequestContext,
  email: string,
  token?: string
): Promise<WelcomeTokenTestResponse | null> {
  const res = await request.get(`${API_BASE}/test/welcome-token?email=${encodeURIComponent(email)}`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorData = await res.json().catch(() => ({}));
    console.log(`[E2E] Failed to get welcome token: ${res.status()} - ${JSON.stringify(errorData)}`);
    return null;
  }

  return await res.json();
}

/**
 * Verifica se o módulo de testes E2E está habilitado no backend
 */
export async function isE2ETestModuleEnabled(
  request: APIRequestContext,
  token?: string
): Promise<boolean> {
  const res = await request.get(`${API_BASE}/test/health`, {
    headers: getAuthHeaders(token),
  });

  return res.ok();
}

// ============================================================================
// TRAINING CYCLES
// ============================================================================

export interface CreateCycleInput {
  team_id: string;
  name: string;
  type?: 'macro' | 'meso';
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface TrainingCycle {
  id: string;
  team_id: string;
  name: string;
  type: 'macro' | 'meso';
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed';
  created_at?: string;
}

/**
 * Cria um ciclo de treino via API - retorna ID
 */
export async function createCycleViaAPI(
  request: APIRequestContext,
  data: CreateCycleInput,
  token?: string
): Promise<string> {
  const body = {
    team_id: data.team_id,
    name: data.name,
    type: data.type ?? 'macro',
    start_date: data.start_date,
    end_date: data.end_date,
    notes: data.notes,
  };

  const res = await request.post(`${API_BASE}/training-cycles`, {
    data: body,
    headers: getAuthHeaders(token),
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`createCycleViaAPI failed: ${res.status()} - ${errorText}`);
  }

  const cycle = await res.json();
  return cycle.id;
}

/**
 * Deleta um ciclo de treino via API
 */
export async function deleteCycleViaAPI(
  request: APIRequestContext,
  cycleId: string,
  reason?: string,
  token?: string
): Promise<void> {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  const res = await request.delete(`${API_BASE}/training-cycles/${cycleId}${params}`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok() && res.status() !== 404) {
    const errorText = await res.text();
    throw new Error(`deleteCycleViaAPI failed: ${res.status()} - ${errorText}`);
  }
}

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Limpa entidades criadas durante os testes
 * Processa em batches para evitar sobrecarga
 */
export async function cleanupTestData(
  request: APIRequestContext,
  options: {
    teamIds?: string[];
    userIds?: string[];
    athleteIds?: string[];
    sessionIds?: string[];
    cycleIds?: string[];
  },
  token?: string
): Promise<void> {
  const batchSize = 5;

  // Cleanup teams
  if (options.teamIds?.length) {
    for (let i = 0; i < options.teamIds.length; i += batchSize) {
      const batch = options.teamIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(id => deleteTeamViaAPI(request, id, token).catch(() => {}))
      );
    }
  }

  // Cleanup users
  if (options.userIds?.length) {
    for (let i = 0; i < options.userIds.length; i += batchSize) {
      const batch = options.userIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(id => deleteUserViaAPI(request, id, token).catch(() => {}))
      );
    }
  }

  // Cleanup athletes
  if (options.athleteIds?.length) {
    for (let i = 0; i < options.athleteIds.length; i += batchSize) {
      const batch = options.athleteIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(id => deleteAthleteViaAPI(request, id, 'cleanup', token).catch(() => {}))
      );
    }
  }

  // Cleanup sessions
  if (options.sessionIds?.length) {
    for (let i = 0; i < options.sessionIds.length; i += batchSize) {
      const batch = options.sessionIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(id => deleteSessionViaAPI(request, id, token).catch(() => {}))
      );
    }
  }

  // Cleanup cycles
  if (options.cycleIds?.length) {
    for (let i = 0; i < options.cycleIds.length; i += batchSize) {
      const batch = options.cycleIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(id => deleteCycleViaAPI(request, id, 'cleanup', token).catch(() => {}))
      );
    }
  }
}

// ============================================================================
// LEGACY EXPORTS (compatibilidade com testes existentes)
// ============================================================================

// Aliases para manter compatibilidade com código existente
export const apiCreateTeam = async (
  request: APIRequestContext,
  payload?: CreateTeamInput
): Promise<Team> => {
  const id = await createTeamViaAPI(request, payload);
  return (await getTeamViaAPI(request, id))!;
};

export const apiGetTeam = getTeamViaAPI;
export const apiUpdateTeam = updateTeamViaAPI;
export const apiDeleteTeam = deleteTeamViaAPI;
export const apiListTeams = listTeamsViaAPI;

export const apiInviteMember = async (
  request: APIRequestContext,
  teamId: string,
  payload: { email: string; role?: string; full_name?: string }
) => inviteMemberViaAPI(request, { team_id: teamId, ...payload });

export const apiListMembers = listMembersViaAPI;
export const apiRemoveMember = removeMemberViaAPI;

// Training aliases (legacy)
export interface TeamPayload extends CreateTeamInput {}
export interface MemberInvitePayload {
  email: string;
  role?: string;
  full_name?: string;
}
export interface TrainingPayload extends CreateSessionInput {}
export interface Training extends TrainingSession {}

export const apiCreateTraining = async (
  request: APIRequestContext,
  payload: CreateSessionInput
): Promise<Training> => {
  const id = await createSessionViaAPI(request, payload);
  return (await getSessionViaAPI(request, id))!;
};

export const apiListTrainings = async (
  request: APIRequestContext,
  teamId: string
): Promise<Training[]> => {
  const res = await request.get(`${API_BASE}/training-sessions?team_id=${teamId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok()) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.items || [];
};
