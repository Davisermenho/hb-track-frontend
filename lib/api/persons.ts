/**
 * Serviço de API - Persons (Pessoas)
 * API V1.2 - Estrutura Normalizada
 * 
 * Endpoints:
 * - /persons - CRUD de pessoas
 * - /persons/{id}/contacts - Contatos da pessoa
 * - /persons/{id}/addresses - Endereços da pessoa
 * - /persons/{id}/documents - Documentos da pessoa
 * - /persons/{id}/media - Mídias da pessoa
 */

import { apiClient } from './client';
import type {
  Person,
  PersonCreate,
  PersonUpdate,
  PersonListResponse,
  PersonFilters,
  PersonContact,
  PersonContactCreate,
  PersonContactUpdate,
  PersonAddress,
  PersonAddressCreate,
  PersonAddressUpdate,
  PersonDocument,
  PersonDocumentCreate,
  PersonDocumentUpdate,
  PersonMedia,
  PersonMediaCreate,
  PersonMediaUpdate,
} from '../../src/types/persons';

// ============================================================================
// PERSONS - CRUD Principal
// ============================================================================

export const personsService = {
  /**
   * Lista pessoas com paginação e filtros
   */
  async list(params?: PersonFilters): Promise<PersonListResponse> {
    return apiClient.get<PersonListResponse>('/persons', params);
  },

  /**
   * Busca uma pessoa por ID (com relacionamentos)
   */
  async getById(id: string): Promise<Person> {
    return apiClient.get<Person>(`/persons/${id}`);
  },

  /**
   * Cria uma nova pessoa (pode incluir contatos, endereços, documentos)
   */
  async create(data: PersonCreate): Promise<Person> {
    return apiClient.post<Person>('/persons', data);
  },

  /**
   * Atualiza dados básicos de uma pessoa
   */
  async update(id: string, data: PersonUpdate): Promise<Person> {
    return apiClient.patch<Person>(`/persons/${id}`, data);
  },

  /**
   * Exclui uma pessoa (soft delete)
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/persons/${id}`);
  },
};

// ============================================================================
// PERSON CONTACTS - Gerenciamento de Contatos
// ============================================================================

export const personContactsService = {
  /**
   * Lista todos os contatos de uma pessoa
   */
  async list(personId: string): Promise<PersonContact[]> {
    return apiClient.get<PersonContact[]>(`/persons/${personId}/contacts`);
  },

  /**
   * Busca um contato específico
   */
  async getById(personId: string, contactId: string): Promise<PersonContact> {
    return apiClient.get<PersonContact>(`/persons/${personId}/contacts/${contactId}`);
  },

  /**
   * Adiciona um novo contato à pessoa
   */
  async create(personId: string, data: PersonContactCreate): Promise<PersonContact> {
    return apiClient.post<PersonContact>(`/persons/${personId}/contacts`, data);
  },

  /**
   * Atualiza um contato existente
   */
  async update(personId: string, contactId: string, data: PersonContactUpdate): Promise<PersonContact> {
    return apiClient.patch<PersonContact>(`/persons/${personId}/contacts/${contactId}`, data);
  },

  /**
   * Remove um contato
   */
  async delete(personId: string, contactId: string): Promise<void> {
    return apiClient.delete<void>(`/persons/${personId}/contacts/${contactId}`);
  },

  /**
   * Define um contato como primário
   */
  async setPrimary(personId: string, contactId: string): Promise<PersonContact> {
    return apiClient.patch<PersonContact>(`/persons/${personId}/contacts/${contactId}`, {
      is_primary: true,
    });
  },
};

// ============================================================================
// PERSON ADDRESSES - Gerenciamento de Endereços
// ============================================================================

export const personAddressesService = {
  /**
   * Lista todos os endereços de uma pessoa
   */
  async list(personId: string): Promise<PersonAddress[]> {
    return apiClient.get<PersonAddress[]>(`/persons/${personId}/addresses`);
  },

  /**
   * Busca um endereço específico
   */
  async getById(personId: string, addressId: string): Promise<PersonAddress> {
    return apiClient.get<PersonAddress>(`/persons/${personId}/addresses/${addressId}`);
  },

  /**
   * Adiciona um novo endereço à pessoa
   */
  async create(personId: string, data: PersonAddressCreate): Promise<PersonAddress> {
    return apiClient.post<PersonAddress>(`/persons/${personId}/addresses`, data);
  },

  /**
   * Atualiza um endereço existente
   */
  async update(personId: string, addressId: string, data: PersonAddressUpdate): Promise<PersonAddress> {
    return apiClient.patch<PersonAddress>(`/persons/${personId}/addresses/${addressId}`, data);
  },

  /**
   * Remove um endereço
   */
  async delete(personId: string, addressId: string): Promise<void> {
    return apiClient.delete<void>(`/persons/${personId}/addresses/${addressId}`);
  },

  /**
   * Define um endereço como primário
   */
  async setPrimary(personId: string, addressId: string): Promise<PersonAddress> {
    return apiClient.patch<PersonAddress>(`/persons/${personId}/addresses/${addressId}`, {
      is_primary: true,
    });
  },
};

// ============================================================================
// PERSON DOCUMENTS - Gerenciamento de Documentos
// ============================================================================

export const personDocumentsService = {
  /**
   * Lista todos os documentos de uma pessoa
   */
  async list(personId: string): Promise<PersonDocument[]> {
    return apiClient.get<PersonDocument[]>(`/persons/${personId}/documents`);
  },

  /**
   * Busca um documento específico
   */
  async getById(personId: string, documentId: string): Promise<PersonDocument> {
    return apiClient.get<PersonDocument>(`/persons/${personId}/documents/${documentId}`);
  },

  /**
   * Adiciona um novo documento à pessoa
   */
  async create(personId: string, data: PersonDocumentCreate): Promise<PersonDocument> {
    return apiClient.post<PersonDocument>(`/persons/${personId}/documents`, data);
  },

  /**
   * Atualiza um documento existente
   */
  async update(personId: string, documentId: string, data: PersonDocumentUpdate): Promise<PersonDocument> {
    return apiClient.patch<PersonDocument>(`/persons/${personId}/documents/${documentId}`, data);
  },

  /**
   * Remove um documento
   */
  async delete(personId: string, documentId: string): Promise<void> {
    return apiClient.delete<void>(`/persons/${personId}/documents/${documentId}`);
  },

  /**
   * Marca documento como verificado
   */
  async verify(personId: string, documentId: string): Promise<PersonDocument> {
    return apiClient.patch<PersonDocument>(`/persons/${personId}/documents/${documentId}`, {
      is_verified: true,
    });
  },
};

// ============================================================================
// PERSON MEDIA - Gerenciamento de Mídias
// ============================================================================

export const personMediaService = {
  /**
   * Lista todas as mídias de uma pessoa
   */
  async list(personId: string): Promise<PersonMedia[]> {
    return apiClient.get<PersonMedia[]>(`/persons/${personId}/media`);
  },

  /**
   * Busca uma mídia específica
   */
  async getById(personId: string, mediaId: string): Promise<PersonMedia> {
    return apiClient.get<PersonMedia>(`/persons/${personId}/media/${mediaId}`);
  },

  /**
   * Adiciona uma nova mídia à pessoa (via URL)
   */
  async create(personId: string, data: PersonMediaCreate): Promise<PersonMedia> {
    return apiClient.post<PersonMedia>(`/persons/${personId}/media`, data);
  },

  /**
   * Upload de foto de perfil (multipart/form-data)
   * Faz upload do arquivo e define como foto primária
   */
  async uploadProfilePhoto(personId: string, file: File): Promise<PersonMedia> {
    return apiClient.uploadFile<PersonMedia>(`/persons/${personId}/media/upload`, file, {
      media_type: 'profile_photo',
      is_primary: 'true',
    });
  },

  /**
   * Upload de mídia genérica (documento, certificado médico, etc.)
   */
  async uploadMedia(
    personId: string, 
    file: File, 
    mediaType: 'profile_photo' | 'document_scan' | 'medical_certificate' | 'other',
    isPrimary: boolean = false,
    description?: string
  ): Promise<PersonMedia> {
    const additionalData: Record<string, string> = {
      media_type: mediaType,
      is_primary: String(isPrimary),
    };
    if (description) {
      additionalData.description = description;
    }
    return apiClient.uploadFile<PersonMedia>(`/persons/${personId}/media/upload`, file, additionalData);
  },

  /**
   * Atualiza uma mídia existente
   */
  async update(personId: string, mediaId: string, data: PersonMediaUpdate): Promise<PersonMedia> {
    return apiClient.patch<PersonMedia>(`/persons/${personId}/media/${mediaId}`, data);
  },

  /**
   * Remove uma mídia
   */
  async delete(personId: string, mediaId: string): Promise<void> {
    return apiClient.delete<void>(`/persons/${personId}/media/${mediaId}`);
  },

  /**
   * Define uma mídia como primária (foto de perfil principal)
   */
  async setPrimary(personId: string, mediaId: string): Promise<PersonMedia> {
    return apiClient.patch<PersonMedia>(`/persons/${personId}/media/${mediaId}`, {
      is_primary: true,
    });
  },

  /**
   * Obtém a foto de perfil primária de uma pessoa
   */
  async getProfilePhoto(personId: string): Promise<PersonMedia | null> {
    try {
      const allMedia = await this.list(personId);
      return allMedia.find(m => m.media_type === 'profile_photo' && m.is_primary) || null;
    } catch {
      return null;
    }
  },
};

// ============================================================================
// EXPORT AGREGADO
// ============================================================================

export const personsApi = {
  persons: personsService,
  contacts: personContactsService,
  addresses: personAddressesService,
  documents: personDocumentsService,
  media: personMediaService,
};

export default personsApi;
