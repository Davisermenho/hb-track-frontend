/**
 * Tipos Canônicos para Atletas
 * 
 * Baseado em: REGRAS_GERENCIAMENTO_ATLETAS.md
 * 
 * REGRAS IMPLEMENTADAS:
 * - R12: Estados operacionais (ativa, dispensada, arquivada)
 * - R13: Flags de restrição (injured, medical_restriction, suspended_until, load_restricted)
 * - R14/R15: Categorias globais e regra etária
 * - CANÔNICO: Gênero apenas 'male' ou 'female' para atletas (handebol não tem categoria mista)
 * - CANÔNICO: offensive_position_id nullable para goleiras (RD13)
 * - CANÔNICO: organization_id derivado automaticamente de team_registrations
 */

// ============================================================================
// ENUMS CANÔNICOS
// ============================================================================

/** Estado base único da atleta (R12) */
export type AthleteState = 'ativa' | 'dispensada' | 'arquivada';

/** Gênero válido para atletas - handebol não tem categoria mista */
export type AthleteGender = 'male' | 'female';

/** Gênero válido para equipes - 'misto' mantido temporariamente no banco mas não deve ser usado */
export type TeamGender = 'masculino' | 'feminino' | 'misto';

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

/**
 * Atleta completo conforme estrutura do banco
 * 
 * NOTA: O banco ainda tem campos duplicados (athlete_rg, athlete_cpf, etc)
 * que serão removidos na migration 012_canonical. Por ora, mantemos compatibilidade.
 */
export interface Athlete {
  id: string;
  person_id: string;
  organization_id: string | null; // DERIVADO: NULL se sem team_registration ativo
  team_id?: string | null;
  
  // Dados básicos (alguns duplicados do person - serão removidos)
  athlete_name: string;
  birth_date: string; // ISO date string
  athlete_nickname?: string | null;
  gender?: string | null;
  
  // Estado e Flags (R12, R13)
  state: AthleteState;
  injured: boolean;
  medical_restriction: boolean;
  suspended_until: string | null; // ISO date string
  load_restricted: boolean;
  
  // Documentos (duplicados - usar person_documents após migration)
  athlete_rg?: string | null;
  athlete_cpf?: string | null;
  
  // Contatos (duplicados - usar person_contacts após migration)
  athlete_phone?: string | null;
  athlete_email?: string | null;
  
  // Dados esportivos
  shirt_number?: number | null;
  main_defensive_position_id?: number | null; // OBRIGATÓRIO nas regras canônicas
  secondary_defensive_position_id?: number | null;
  main_offensive_position_id?: number | null; // NULL permitido para goleiras (RD13)
  secondary_offensive_position_id?: number | null;
  schooling_id?: number | null;
  
  // Responsável legal (menores de 18)
  guardian_name?: string | null;
  guardian_phone?: string | null;
  
  // Endereço (duplicados - usar person_addresses após migration)
  zip_code?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  address_state?: string | null;
  state_address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  
  // Foto
  athlete_photo_path?: string | null;
  
  // Metadados
  registered_at: string;
  athlete_age_at_registration?: number | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_reason?: string | null;
}

/**
 * Atleta com dados expandidos (joins do backend)
 */
export interface AthleteExpanded extends Athlete {
  // Person data
  person?: {
    id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    birth_date?: string | null;
    gender?: string | null;
  };
  
  // Posições
  main_defensive_position?: Position | null;
  secondary_defensive_position?: Position | null;
  main_offensive_position?: Position | null;
  secondary_offensive_position?: Position | null;
  
  // Escolaridade
  schooling?: SchoolingLevel | null;
  
  // Organização
  organization?: {
    id: string;
    name: string;
  } | null;
  
  // Team registrations ativos
  team_registrations?: TeamRegistration[];
  
  // Campos calculados
  age?: number;
  natural_category?: Category | null;
  is_eligible?: boolean;
}

// ============================================================================
// ENTIDADES RELACIONADAS
// ============================================================================

export interface Position {
  id: number;
  code: string;
  name: string;
  abbreviation: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  max_age: number;
  is_active: boolean;
}

export interface SchoolingLevel {
  id: number;
  code: string;
  name: string;
  order_index: number;
  is_active: boolean;
}

export interface TeamRegistration {
  id: string;
  athlete_id: string;
  team_id: string;
  start_at: string;
  end_at: string | null; // NULL = vínculo ativo
  registration_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Joins
  team?: Team;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  category_id: number;
  gender: TeamGender;
  is_our_team: boolean;
  active_from?: string | null;
  active_until?: string | null;
  
  // Joins
  category?: Category;
  organization?: {
    id: string;
    name: string;
  };
}

// ============================================================================
// TIPOS PARA FORMULÁRIOS
// ============================================================================

/**
 * Dados para criar atleta (POST)
 * Conforme RF1.1: Vínculo automático ao cadastrar atleta
 */
export interface AthleteCreateInput {
  // Person (criado automaticamente)
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: AthleteGender; // OBRIGATÓRIO - apenas male/female
  nationality?: string;
  
  // Athlete
  athlete_nickname?: string;
  shirt_number?: number;
  main_defensive_position_id: number; // OBRIGATÓRIO
  secondary_defensive_position_id?: number;
  main_offensive_position_id?: number | null; // NULL para goleiras
  secondary_offensive_position_id?: number;
  schooling_id?: number;
  
  // Documentos (irão para person_documents)
  athlete_rg?: string;
  athlete_cpf?: string;
  
  // Contatos (irão para person_contacts)
  athlete_phone?: string; // OBRIGATÓRIO nas regras canônicas
  athlete_email?: string; // OBRIGATÓRIO nas regras canônicas
  
  // Endereço (irão para person_addresses)
  zip_code?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state_address?: string;
  address_number?: string;
  address_complement?: string;
  
  // Responsável legal (opcional, recomendado para menores)
  guardian_name?: string;
  guardian_phone?: string;
  
  // Acesso ao sistema (R2: opcional)
  create_user?: boolean;
  user_email?: string;
  password?: string;
  
  // Vínculo com equipe (RF1.1: opcional)
  team_id?: string;
}

/**
 * Dados para atualizar atleta (PATCH)
 * Conforme Seção 5.1: Campos editáveis
 */
export interface AthleteUpdateInput {
  // Dados editáveis sem restrição
  athlete_nickname?: string;
  shirt_number?: number;
  guardian_name?: string;
  guardian_phone?: string;
  athlete_photo_path?: string;
  
  // Posições (editável por Coordenador/Treinador)
  main_defensive_position_id?: number;
  secondary_defensive_position_id?: number;
  main_offensive_position_id?: number | null;
  secondary_offensive_position_id?: number;
  schooling_id?: number;
  
  // Estado e flags (editável por Coordenador/Treinador)
  state?: AthleteState;
  injured?: boolean;
  medical_restriction?: boolean;
  suspended_until?: string | null;
  load_restricted?: boolean;
}

// ============================================================================
// TIPOS PARA FILTROS E LISTAGEM
// ============================================================================

export interface AthleteFilters {
  // Filtros básicos
  search?: string; // Busca em nome, apelido
  state?: AthleteState | AthleteState[];
  organization_id?: string | null; // NULL = atletas em captação
  
  // Filtros por equipe/categoria
  team_id?: string;
  category_id?: number;
  gender?: AthleteGender;
  
  // Filtros por posição
  defensive_position_id?: number;
  offensive_position_id?: number;
  
  // Filtros por flags
  injured?: boolean;
  medical_restriction?: boolean;
  has_suspension?: boolean;
  load_restricted?: boolean;
  
  // Filtros especiais
  without_team?: boolean; // Atletas sem team_registration ativo
  eligible_for_category?: number; // ID da categoria para validar R15
  
  // Paginação
  skip?: number;
  limit?: number;
  
  // Ordenação
  order_by?: 'name' | 'birth_date' | 'created_at' | 'state';
  order_dir?: 'asc' | 'desc';
}

export interface AthletesListResponse {
  items: AthleteExpanded[];
  total: number;
  skip: number;
  limit: number;
}

// ============================================================================
// TIPOS PARA DASHBOARD E ESTATÍSTICAS
// ============================================================================

export interface AthleteDashboardStats {
  total: number;
  by_state: {
    ativa: number;
    dispensada: number;
    arquivada: number;
  };
  in_captacao: number; // organization_id = NULL
  injured: number;
  with_medical_restriction: number;
  suspended: number;
  by_category: Record<string, number>;
  by_position: {
    defensive: Record<string, number>;
    offensive: Record<string, number>;
  };
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** ID da posição de goleira (defensive_positions.id = 5) */
export const GOALKEEPER_POSITION_ID = 5;

/** Estados que permitem operação */
export const OPERATIONAL_STATES: AthleteState[] = ['ativa'];

/** Estados para filtro de histórico */
export const ALL_STATES: AthleteState[] = ['ativa', 'dispensada', 'arquivada'];

/** Mapeamento de estados para display */
export const STATE_LABELS: Record<AthleteState, string> = {
  ativa: 'Ativa',
  dispensada: 'Dispensada',
  arquivada: 'Arquivada',
};

/** Cores dos estados para UI */
export const STATE_COLORS: Record<AthleteState, string> = {
  ativa: 'bg-green-100 text-green-800',
  dispensada: 'bg-yellow-100 text-yellow-800',
  arquivada: 'bg-gray-100 text-gray-600',
};

/** Mapeamento de flags para display */
export const FLAG_LABELS = {
  injured: 'Lesionada',
  medical_restriction: 'Restrição Médica',
  suspended_until: 'Suspensa',
  load_restricted: 'Carga Restrita',
};

/** Cores das flags para UI */
export const FLAG_COLORS = {
  injured: 'bg-red-100 text-red-800',
  medical_restriction: 'bg-orange-100 text-orange-800',
  suspended_until: 'bg-purple-100 text-purple-800',
  load_restricted: 'bg-blue-100 text-blue-800',
};
