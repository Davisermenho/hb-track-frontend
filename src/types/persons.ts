/**
 * Tipos para Pessoas (V1.2 - Estrutura Normalizada)
 * Reflete a estrutura do backend com tabelas separadas para:
 * - persons (dados básicos)
 * - person_contacts (telefone, email, whatsapp)
 * - person_addresses (endereços residenciais)
 * - person_documents (CPF, RG, CNH, passaporte)
 * - person_media (fotos, documentos digitalizados)
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ContactType = 'phone' | 'email' | 'whatsapp';
export type AddressType = 'residential' | 'commercial' | 'correspondence';
export type DocumentType = 'cpf' | 'rg' | 'cnh' | 'passport' | 'birth_certificate' | 'other';
export type MediaType = 'profile_photo' | 'document_scan' | 'medical_certificate' | 'other';
export type Gender = 'female' | 'male' | 'other' | 'not_informed';

// ============================================================================
// PERSON CONTACT
// ============================================================================

export interface PersonContact {
  id: string;
  person_id: string;
  contact_type: ContactType;
  contact_value: string;
  is_primary: boolean;
  is_verified: boolean;
  label?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonContactCreate {
  contact_type: ContactType;
  contact_value: string;
  is_primary?: boolean;
  label?: string;
  notes?: string;
}

export interface PersonContactUpdate {
  contact_type?: ContactType;
  contact_value?: string;
  is_primary?: boolean;
  is_verified?: boolean;
  label?: string;
  notes?: string;
}

// ============================================================================
// PERSON ADDRESS
// ============================================================================

export interface PersonAddress {
  id: string;
  person_id: string;
  address_type: AddressType;
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  is_primary: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonAddressCreate {
  address_type: AddressType;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface PersonAddressUpdate {
  address_type?: AddressType;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  is_primary?: boolean;
  notes?: string;
}

// ============================================================================
// PERSON DOCUMENT
// ============================================================================

export interface PersonDocument {
  id: string;
  person_id: string;
  document_type: DocumentType;
  document_number: string;
  issuing_authority?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  is_verified: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonDocumentCreate {
  document_type: DocumentType;
  document_number: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
}

export interface PersonDocumentUpdate {
  document_type?: DocumentType;
  document_number?: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  is_verified?: boolean;
  notes?: string;
}

// ============================================================================
// PERSON MEDIA
// ============================================================================

export interface PersonMedia {
  id: string;
  person_id: string;
  media_type: MediaType;
  file_url: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  description?: string | null;
  is_primary: boolean;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface PersonMediaCreate {
  media_type: MediaType;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  is_primary?: boolean;
}

export interface PersonMediaUpdate {
  media_type?: MediaType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  is_primary?: boolean;
}

// ============================================================================
// PERSON (PRINCIPAL)
// ============================================================================

export interface Person {
  id: string;
  organization_id: string;
  first_name: string;
  last_name?: string | null;
  full_name?: string | null;
  nickname?: string | null;
  birth_date?: string | null;
  gender: Gender;
  nationality: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  
  // Relacionamentos (quando carregados)
  contacts?: PersonContact[];
  addresses?: PersonAddress[];
  documents?: PersonDocument[];
  media?: PersonMedia[];
  
  // Propriedades calculadas (helper do backend)
  primary_phone?: string | null;
  primary_email?: string | null;
  cpf?: string | null;
}

export interface PersonCreate {
  first_name: string;
  last_name?: string;
  full_name?: string;
  nickname?: string;
  birth_date?: string;
  gender?: Gender;
  nationality?: string;
  notes?: string;
  
  // Criar relacionamentos junto com a pessoa
  contacts?: PersonContactCreate[];
  addresses?: PersonAddressCreate[];
  documents?: PersonDocumentCreate[];
}

export interface PersonUpdate {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  nickname?: string;
  birth_date?: string;
  gender?: Gender;
  nationality?: string;
  notes?: string;
  is_active?: boolean;
}

// ============================================================================
// RESPONSES PAGINADAS
// ============================================================================

export interface PersonListResponse {
  items: Person[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ============================================================================
// FILTROS E PARÂMETROS
// ============================================================================

export interface PersonFilters {
  search?: string;
  gender?: Gender;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

// ============================================================================
// HELPERS / UTILITIES
// ============================================================================

/**
 * Formata o nome completo da pessoa
 */
export function formatPersonName(person: Person): string {
  if (person.full_name) return person.full_name;
  return person.last_name 
    ? `${person.first_name} ${person.last_name}` 
    : person.first_name;
}

/**
 * Obtém o contato primário de um tipo específico
 */
export function getPrimaryContact(person: Person, type: ContactType): PersonContact | undefined {
  return person.contacts?.find(c => c.contact_type === type && c.is_primary);
}

/**
 * Obtém o telefone principal
 */
export function getPrimaryPhone(person: Person): string | null {
  const contact = person.contacts?.find(c => c.contact_type === 'phone' && c.is_primary);
  return contact?.contact_value || person.primary_phone || null;
}

/**
 * Obtém o email principal
 */
export function getPrimaryEmail(person: Person): string | null {
  const contact = person.contacts?.find(c => c.contact_type === 'email' && c.is_primary);
  return contact?.contact_value || person.primary_email || null;
}

/**
 * Obtém o CPF da pessoa
 */
export function getPersonCPF(person: Person): string | null {
  const doc = person.documents?.find(d => d.document_type === 'cpf');
  return doc?.document_number || person.cpf || null;
}

/**
 * Obtém o endereço principal
 */
export function getPrimaryAddress(person: Person): PersonAddress | undefined {
  return person.addresses?.find(a => a.is_primary);
}

/**
 * Formata endereço em uma linha
 */
export function formatAddress(address: PersonAddress): string {
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.number) parts.push(address.number);
  if (address.complement) parts.push(address.complement);
  if (address.neighborhood) parts.push(address.neighborhood);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zip_code) parts.push(`CEP: ${address.zip_code}`);
  return parts.join(', ');
}

/**
 * Labels para tipos de contato
 */
export const contactTypeLabels: Record<ContactType, string> = {
  phone: 'Telefone',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
};

/**
 * Labels para tipos de endereço
 */
export const addressTypeLabels: Record<AddressType, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  correspondence: 'Correspondência',
};

/**
 * Labels para tipos de documento
 */
export const documentTypeLabels: Record<DocumentType, string> = {
  cpf: 'CPF',
  rg: 'RG',
  cnh: 'CNH',
  passport: 'Passaporte',
  birth_certificate: 'Certidão de Nascimento',
  other: 'Outro',
};

/**
 * Labels para tipos de mídia
 */
export const mediaTypeLabels: Record<MediaType, string> = {
  profile_photo: 'Foto de Perfil',
  document_scan: 'Documento Digitalizado',
  medical_certificate: 'Atestado Médico',
  other: 'Outro',
};

/**
 * Labels para gênero
 */
export const genderLabels: Record<Gender, string> = {
  female: 'Feminino',
  male: 'Masculino',
  other: 'Outro',
  not_informed: 'Não informado',
};
