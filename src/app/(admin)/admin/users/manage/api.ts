/**
 * API Service for User Management
 *
 * Connects to backend endpoints to build the hierarchical tree structure:
 * HB Track → Dirigente → Organização → Temporadas/Coordenadores/Treinadores/Equipes/Atletas
 * 
 * V1.2: Estrutura normalizada de Person com tabelas separadas para:
 * - persons (dados básicos)
 * - person_contacts (telefone, email, whatsapp)
 * - person_addresses (endereços residenciais)
 * - person_documents (CPF, RG, CNH, passaporte)
 * - person_media (fotos, documentos digitalizados)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Import tipos de Person V1.2 do módulo centralizado
import type {
  Person,
  PersonCreate,
  PersonContact,
  PersonContactCreate,
  PersonAddress,
  PersonAddressCreate,
  PersonDocument,
  PersonDocumentCreate,
  ContactType,
  AddressType,
  DocumentType,
  Gender,
} from "../../../../../types/persons";

// Re-export Person types for backward compatibility
export type { Person, PersonContact, PersonAddress, PersonDocument };

/**
 * User - Usuário com acesso ao sistema
 * V1.2: User não tem full_name - isso está em Person (R1)
 */
export interface User {
  id: string;
  person_id: string | null;  // FK para Person (R1)
  email: string;
  status: "ativo" | "inativo" | "arquivado";
  is_superadmin: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

/**
 * Organization - Clubes/organizações esportivas
 * V1.2: Suporta múltiplos clubes desde V1.
 */
export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
}

/**
 * Season - Temporadas por equipe/competição
 * V1.2: Temporada é por equipe (team_id), não por organização.
 * Uma equipe pode ter múltiplas temporadas simultâneas (diferentes competições).
 */
export interface Season {
  id: string;
  team_id: string;           // V1.2: FK para teams (não organization_id)
  name: string;
  year: number;              // Ano de referência para cálculo de categoria
  competition_type: string;  // "oficial", "amistoso", "copa", etc.
  start_date: string;
  end_date: string;
  canceled_at: string | null;     // RF5.1: Cancelamento pré-início
  interrupted_at: string | null;  // RF5.2: Interrupção pós-início
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
}

/**
 * OrgMembership - Vínculos organizacionais (staff: dirigente/coordenador/treinador)
 * V1.2: SEM season_id, SEM status. Usa start_at/end_at para período.
 * RF1.1: Dirigente NÃO cria vínculo organizacional automático ao ser cadastrado.
 */
export interface OrgMembership {
  id: string;
  person_id: string;
  organization_id: string;
  role_id: number;           // 1=dirigente, 2=coordenador, 3=treinador
  start_at: string | null;   // Início do vínculo
  end_at: string | null;     // Fim do vínculo (null = ativo)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
}

/**
 * Team - Equipes esportivas
 * V1.2: SEM season_id (temporada é por competição, não por equipe)
 */
export interface Team {
  id: string;
  organization_id: string;
  category_id: number;       // FK para categories
  name: string;
  gender: "masculino" | "feminino" | "misto";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
}

/**
 * TeamRegistration - Vínculos de atletas com equipes
 * V1.2: Usa start_at/end_at. Atleta pode ter múltiplos vínculos ativos simultâneos.
 */
export interface TeamRegistration {
  id: string;
  team_id: string;
  athlete_id: string;        // FK para athletes (não person_id)
  start_at: string;          // Início do vínculo
  end_at: string | null;     // Fim do vínculo (null = ativo)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
}

// API helper function - Cookie HttpOnly enviado automaticamente via credentials: 'include'
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  console.log(`🔵 [API] ${options?.method || 'GET'} ${API_BASE_URL}${endpoint}`);
  if (options?.body) {
    console.log(`🔵 [API] Body:`, options.body);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include", // ✅ Cookie HttpOnly enviado automaticamente
    });

    console.log(`🔵 [API] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "API Error" }));
      console.error(`❌ [API] Erro:`, errorData);
      // Extrair mensagem de erro do formato do backend
      const errorMessage = errorData.detail?.message 
        || errorData.detail 
        || errorData.message 
        || `Erro ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`✅ [API] Sucesso:`, data);
    return data;
  } catch (error: any) {
    // Se for um erro de rede (fetch falhou)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error(`❌ [API] Erro de rede - Failed to fetch`);
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
    throw error;
  }
}

// ============================================================================
// Fetch functions for each entity type
// ============================================================================

/**
 * Fetch all roles (dirigente, coordenador, treinador, atleta)
 */
export async function fetchRoles(): Promise<Role[]> {
  return fetchAPI<Role[]>("/roles");
}

/**
 * Fetch all organizations
 */
export async function fetchOrganizations(page = 1, limit = 100): Promise<{ items: Organization[]; total: number }> {
  return fetchAPI<{ items: Organization[]; total: number }>(`/organizations?page=${page}&limit=${limit}`);
}

/**
 * Fetch seasons for an organization
 */
export async function fetchSeasons(organizationId: string, page = 1, limit = 100): Promise<{ items: Season[]; total: number }> {
  return fetchAPI<{ items: Season[]; total: number }>(`/seasons?page=${page}&limit=${limit}`);
}

/**
 * Fetch teams for an organization
 * V1.2: Equipes pertencem à organização, não à temporada
 */
export async function fetchTeams(organizationId?: string, page = 1, limit = 100): Promise<{ items: Team[]; total: number }> {
  const query = organizationId ? `organization_id=${organizationId}&` : "";
  return fetchAPI<{ items: Team[]; total: number }>(`/teams?${query}page=${page}&limit=${limit}`);
}

/**
 * Fetch org_memberships for an organization (filtered by role)
 * V1.2: Vínculos staff (dirigente/coordenador/treinador) com organização
 * Endpoint: /organizations/{org_id}/memberships (não /org-memberships)
 */
export async function fetchOrgMemberships(
  organizationId: string,
  roleCode?: string,
  isActive = true,
  page = 1,
  limit = 100
): Promise<{ items: OrgMembership[]; total: number }> {
  const roleParam = roleCode ? `&role_code=${roleCode}` : "";
  const activeParam = `&is_active=${isActive}`;
  return fetchAPI<{ items: OrgMembership[]; total: number }>(
    `/organizations/${organizationId}/memberships?page=${page}&limit=${limit}${roleParam}${activeParam}`
  );
}

/**
 * Fetch team registrations for a team
 * V1.2: Vínculos atletas com equipe
 */
export async function fetchTeamRegistrations(teamId: string, page = 1, limit = 100): Promise<{ items: TeamRegistration[]; total: number }> {
  return fetchAPI<{ items: TeamRegistration[]; total: number }>(`/team-registrations?team_id=${teamId}&page=${page}&limit=${limit}`);
}

/**
 * Fetch users with person data
 */
export async function fetchUsers(page = 1, limit = 100): Promise<{ items: User[]; total: number }> {
  return fetchAPI<{ items: User[]; total: number }>(`/users?page=${page}&limit=${limit}`);
}

/**
 * Fetch persons
 */
export async function fetchPersons(page = 1, limit = 100): Promise<{ items: Person[]; total: number }> {
  return fetchAPI<{ items: Person[]; total: number }>(`/persons?page=${page}&limit=${limit}`);
}

/**
 * Fetch person by ID
 * V1.2: Retorna Person com relacionamentos (contacts, addresses, documents, media)
 */
export async function fetchPersonById(personId: string): Promise<Person> {
  return fetchAPI<Person>(`/persons/${personId}`);
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new dirigente (person + user)
 * 
 * RF1.1: Dirigente cadastrado cria person + user.
 * NÃO cria vínculo organizacional automático.
 * Vínculo ocorre ao fundar ou solicitar vínculo com organização.
 * 
 * V1.2: Estrutura normalizada - contacts, addresses, documents são tabelas separadas
 * Campos obrigatórios: first_name, email
 * Campos opcionais: last_name, cpf, birth_date, gender, phone, endereço
 */
export async function createDirigente(data: {
  full_name: string;      // Será parseado em first_name + last_name
  email: string;
  cpf?: string;           // Opcional - será criado em person_documents
  birth_date?: string;    // Opcional
  gender?: string;        // Opcional (valores: female, male, other, not_informed)
  phone?: string;         // Opcional - será criado em person_contacts
  createUser?: boolean;   // Se true, cria usuário e envia email
  // Campos opcionais de endereço - serão criados em person_addresses
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}): Promise<{ person: Person; user?: User }> {
  // Parsear full_name em first_name e last_name
  const nameParts = data.full_name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;
  
  // Limpar CPF - remover pontuação (se fornecido)
  const cleanCpf = data.cpf ? data.cpf.replace(/[^\d]/g, "") : null;
  
  // Converter data de nascimento de DD/MM/YYYY para YYYY-MM-DD se necessário
  let birthDate: string | null = null;
  if (data.birth_date) {
    birthDate = data.birth_date;
    if (birthDate.includes("/")) {
      const parts = birthDate.split("/");
      if (parts.length === 3) {
        birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }

  // Mapear gênero antigo para novo enum
  let gender: Gender = 'not_informed';
  if (data.gender) {
    const genderMap: Record<string, Gender> = {
      'masculino': 'male',
      'feminino': 'female',
      'male': 'male',
      'female': 'female',
      'other': 'other',
    };
    gender = genderMap[data.gender.toLowerCase()] || 'not_informed';
  }

  // V1.2: Estrutura normalizada - montar payload com sub-entidades
  const personPayload: PersonCreate = {
    first_name: firstName,
    last_name: lastName,
    full_name: data.full_name.trim(),
    birth_date: birthDate || undefined,
    gender,
    contacts: [],
    addresses: [],
    documents: [],
  };
  
  // Adicionar contato email (obrigatório)
  personPayload.contacts!.push({
    contact_type: 'email',
    contact_value: data.email,
    is_primary: true,
  });

  // Adicionar contato telefone (se presente)
  if (data.phone) {
    personPayload.contacts!.push({
      contact_type: 'phone',
      contact_value: data.phone,
      is_primary: true,
    });
  }

  // Adicionar documento CPF (se presente)
  if (cleanCpf) {
    personPayload.documents!.push({
      document_type: 'cpf',
      document_number: cleanCpf,
    });
  }

  // Adicionar endereço (se qualquer campo de endereço presente)
  if (data.street || data.city || data.zip_code) {
    personPayload.addresses!.push({
      address_type: 'residential',
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code?.replace(/[^\d]/g, ""),
      is_primary: true,
    });
  }

  const person = await fetchAPI<Person>("/persons", {
    method: "POST",
    body: JSON.stringify(personPayload),
  });

  let user: User | undefined = undefined;

  // Step 2: Create user and send email (only if createUser is true)
  if (data.createUser) {
    // Criar usuário com senha provisória
    user = await fetchAPI<User>("/users", {
      method: "POST",
      body: JSON.stringify({
        person_id: person.id,
        email: data.email,
        role: "dirigente", // V1.2: Papel do usuário
        send_welcome_email: true, // Backend envia email de boas-vindas com link de senha
      }),
    });
  }

  // RF1.1: Dirigente NÃO cria vínculo organizacional automático ao ser cadastrado.
  // Vínculo com organização ocorre quando dirigente FUNDAR nova organização
  // ou SOLICITAR vínculo com organização existente.

  return { person, user };
}

/**
 * Create a new organization
 * V1.2: Organizações não têm 'code', apenas 'name'
 */
export async function createOrganization(data: {
  name: string;
}): Promise<Organization> {
  return fetchAPI<Organization>("/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Create a new season
 */
export async function createSeason(data: {
  organization_id: string;
  name: string;
  start_date: string;
  end_date: string;
}): Promise<Season> {
  return fetchAPI<Season>("/seasons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Create a new team
 * V1.2: Equipe pertence à organização, não à temporada
 */
export async function createTeam(data: {
  organization_id: string;
  category_id: number;
  name: string;
  gender: "masculino" | "feminino" | "misto";
}): Promise<Team> {
  return fetchAPI<Team>("/teams", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Create org_membership (coordinator, trainer)
 * V1.2: Vínculo staff com organização. SEM season_id, SEM status.
 * RF1.1: Coordenador/Treinador cria vínculo automático com org do criador.
 * Endpoint: POST /organizations/{org_id}/memberships
 */
export async function createOrgMembership(data: {
  person_id: string;
  organization_id: string;
  role_code: string;  // "dirigente", "coordenador", "treinador"
}): Promise<OrgMembership> {
  return fetchAPI<OrgMembership>(`/organizations/${data.organization_id}/memberships`, {
    method: "POST",
    body: JSON.stringify({
      person_id: data.person_id,
      role_code: data.role_code,
      start_date: new Date().toISOString().split("T")[0],
    }),
  });
}

/**
 * Create team registration (add athlete to team)
 * V1.2: Vínculo atleta com equipe. Usa athlete_id (não person_id).
 * R16: Atleta pode ter múltiplos vínculos ativos simultâneos.
 */
export async function createTeamRegistration(data: {
  team_id: string;
  athlete_id: string;  // FK para athletes
}): Promise<TeamRegistration> {
  return fetchAPI<TeamRegistration>("/team-registrations", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      start_at: new Date().toISOString(),
    }),
  });
}

/**
 * Update entity (generic)
 */
export async function updateEntity<T>(endpoint: string, id: string, data: Partial<T>): Promise<T> {
  return fetchAPI<T>(`${endpoint}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Soft delete entity (generic)
 */
export async function deleteEntity(endpoint: string, id: string, reason: string): Promise<void> {
  return fetchAPI<void>(`${endpoint}/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}
