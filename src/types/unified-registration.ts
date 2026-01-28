/**
 * Tipos para Ficha Única de Cadastro
 * 
 * Sistema progressivo e profissional para cadastro de:
 * - Atletas
 * - Treinadores
 * - Coordenadores
 * - Dirigentes
 * 
 * CANÔNICO (31/12/2025): Estrutura normalizada com persons como entidade raiz
 */

// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================

export type RegistrationType = 'atleta' | 'treinador' | 'coordenador' | 'dirigente';

export type Gender = 'masculino' | 'feminino';

export type ContactType = 'telefone' | 'email' | 'whatsapp';

export type DocumentType = 'rg' | 'cpf';

export type AddressType = 'residencial_1' | 'residencial_2' | 'comercial';

/** Hierarquia de permissões para criação (R41/RF1) */
export const ROLE_CREATION_PERMISSIONS: Record<string, RegistrationType[]> = {
  superadmin: ['atleta', 'treinador', 'coordenador', 'dirigente'],
  dirigente: ['atleta', 'treinador', 'coordenador'],
  coordenador: ['atleta', 'treinador'],
  treinador: ['atleta'],
  atleta: [],
};

// ============================================================================
// SEÇÃO: NÚCLEO OBRIGATÓRIO (persons)
// ============================================================================

export interface CorePersonData {
  /** Nome completo (obrigatório) */
  full_name: string;
  /** Data de nascimento (obrigatório) */
  birth_date: string;
  /** Gênero (obrigatório): masculino | feminino */
  gender?: Gender;
  /** Email (opcional, mas se preenchido = cria user com login) */
  email?: string;
}

// ============================================================================
// SEÇÃO: DOCUMENTOS (person_documents)
// ============================================================================

export interface DocumentData {
  /** RG (obrigatório para atletas) */
  rg?: string;
  /** Órgão emissor do RG */
  rg_issuing_authority?: string;
  /** CPF (opcional) */
  cpf?: string;
}

// ============================================================================
// SEÇÃO: CONTATOS (person_contacts)
// ============================================================================

export interface ContactData {
  /** Telefone principal (obrigatório para atletas) */
  phone?: string;
  /** WhatsApp (opcional) */
  whatsapp?: string;
}

// ============================================================================
// SEÇÃO: ENDEREÇO (person_addresses)
// ============================================================================

export interface AddressData {
  /** CEP */
  zip_code?: string;
  /** Logradouro */
  street?: string;
  /** Número */
  number?: string;
  /** Complemento */
  complement?: string;
  /** Bairro */
  neighborhood?: string;
  /** Cidade */
  city?: string;
  /** Estado (UF) */
  state?: string;
}

// ============================================================================
// SEÇÃO: DADOS DE ATLETA (athletes)
// ============================================================================

export interface AthleteData {
  /** Posição defensiva principal (obrigatório) */
  main_defensive_position_id?: number;
  /** Posição defensiva secundária */
  secondary_defensive_position_id?: number;
  /** Posição ofensiva principal (obrigatório exceto goleiras) */
  main_offensive_position_id?: number;
  /** Posição ofensiva secundária */
  secondary_offensive_position_id?: number;
  /** Número da camisa (1-99) */
  shirt_number?: number;
  /** Nome do responsável (pai/mãe) */
  guardian_name?: string;
  /** Telefone do responsável */
  guardian_phone?: string;
  /** Nível de escolaridade */
  schooling_level_id?: number;
}

// ============================================================================
// SEÇÃO: FOTO (person_media)
// ============================================================================

export interface PhotoData {
  /** Arquivo da foto */
  file?: File;
  /** URL de preview (temporário, antes do upload) */
  previewUrl?: string;
}

// ============================================================================
// SEÇÃO: VÍNCULO ORGANIZACIONAL
// ============================================================================

export interface OrganizationBindingData {
  /** Selecionar organização existente */
  existing_organization_id?: number;
  /** OU criar nova organização */
  create_organization?: {
    name: string;
    legal_name?: string;
    document?: string;
  };
}

// ============================================================================
// SEÇÃO: VÍNCULO COM EQUIPE (team_registration)
// ============================================================================

export interface TeamBindingData {
  /** Selecionar equipe existente */
  existing_team_id?: number;
  /** OU criar nova equipe */
  create_team?: {
    name: string;
    category_id: number;
    gender: Gender;
  };
}

// ============================================================================
// SEÇÃO: ACESSO AO SISTEMA (users)
// ============================================================================

export interface SystemAccessData {
  /** Se true, cria user com login */
  create_access: boolean;
  /** Email para login (usa email do núcleo se não informado) */
  login_email?: string;
  /** Enviar email de boas-vindas com link para criar senha */
  send_welcome_email: boolean;
}

// ============================================================================
// FORMULÁRIO COMPLETO
// ============================================================================

export interface UnifiedRegistrationFormData {
  /** Tipo de cadastro selecionado */
  registration_type?: RegistrationType;
  
  /** Se deve criar usuário no sistema */
  create_user: boolean;
  
  /** Núcleo obrigatório (sempre visível) */
  core: CorePersonData;
  
  /** Documentos */
  documents: DocumentData;
  
  /** Contatos */
  contacts: ContactData;
  
  /** Endereço */
  address: AddressData;
  
  /** Dados específicos de atleta */
  athlete?: AthleteData;
  
  /** Foto de perfil */
  photo?: PhotoData;
  
  /** Vínculo organizacional */
  organization?: OrganizationBindingData;
  
  /** Vínculo com equipe */
  team?: TeamBindingData;
}

// ============================================================================
// PAYLOAD PARA API
// ============================================================================

export interface UnifiedRegistrationPayload {
  /** Tipo de cadastro */
  registration_type?: RegistrationType;
  
  /** Se deve criar usuário no sistema */
  create_user: boolean;
  
  /** Dados pessoais (núcleo) */
  core: {
    full_name: string;
    birth_date: string;
    gender: Gender;
    email?: string;
  };
  
  /** Documentos */
  documents?: {
    rg?: string;
    cpf?: string;
  };
  
  /** Contatos */
  contacts?: {
    phone?: string;
    whatsapp?: string;
  };
  
  /** Endereço */
  address?: {
    zip_code?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  
  /** Dados de atleta (apenas se registration_type = 'atleta') */
  athlete?: {
    main_defensive_position_id: number;
    secondary_defensive_position_id?: number;
    main_offensive_position_id?: number;
    secondary_offensive_position_id?: number;
    shirt_number?: number;
    guardian_name?: string;
    guardian_phone?: string;
    schooling_level_id?: number;
  };
  
  /** Vínculo organizacional */
  organization?: {
    existing_organization_id?: number;
    create_organization?: {
      name: string;
      legal_name?: string;
      document?: string;
    };
  };
  
  /** Vínculo com equipe */
  team?: {
    existing_team_id?: number;
    create_team?: {
      name: string;
      category_id: number;
      gender: Gender;
    };
  };
}

// ============================================================================
// RESPOSTA DA API
// ============================================================================

export interface UnifiedRegistrationResponse {
  success: boolean;
  person_id: number;
  entity_type: 'athlete' | 'membership';
  entity_id: number;
  user_id?: number;
  team_id?: number;
  organization_id?: number;
  message?: string;
}

// ============================================================================
// DADOS DE LOOKUP (para dropdowns)
// ============================================================================

export interface OffensivePosition {
  id: number;
  name: string;
}

export interface DefensivePosition {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  max_age: number;
}

export interface SchoolingLevel {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  name: string;
  category_id: number;
  gender: Gender;
  organization_id: number;
}

export interface Organization {
  id: number;
  name: string;
  city?: string;
  state?: string;
}

// ============================================================================
// ESTADO INICIAL DO FORMULÁRIO
// ============================================================================

export const INITIAL_FORM_STATE: UnifiedRegistrationFormData = {
  registration_type: undefined,
  create_user: false,
  core: {
    full_name: '',
    birth_date: '',
    gender: 'feminino',
    email: '',
  },
  documents: {
    rg: '',
    cpf: '',
  },
  contacts: {
    phone: '',
    whatsapp: '',
  },
  address: {
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  },
  athlete: {
    main_defensive_position_id: undefined,
    main_offensive_position_id: undefined,
  },
  photo: {},
  organization: {},
  team: {},
};

// ============================================================================
// VALIDAÇÃO
// ============================================================================

export interface ValidationErrors {
  [key: string]: string;
}

export interface SectionValidation {
  isValid: boolean;
  errors: ValidationErrors;
}
