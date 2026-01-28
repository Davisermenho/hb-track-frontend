/**
 * API Service para Ficha Única de Cadastro
 * 
 * Endpoints:
 * - POST /api/v1/unified-registration - Criar cadastro unificado
 * - GET /api/v1/lookup/positions - Listar posições
 * - GET /api/v1/lookup/categories - Listar categorias
 * - GET /api/v1/lookup/schooling-levels - Listar níveis de escolaridade
 * - POST /api/v1/persons/{id}/media - Upload de foto
 */

import { apiClient } from './client';
import type {
  UnifiedRegistrationPayload,
  UnifiedRegistrationResponse,
  OffensivePosition,
  DefensivePosition,
  Category,
  SchoolingLevel,
  Team,
  Organization,
} from '../../src/types/unified-registration';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================================================
// HELPERS - Padrão HttpOnly Cookies (2026-01-08)
// ============================================================================

/**
 * Headers padrão para requisições autenticadas.
 * O token é enviado automaticamente via cookie HttpOnly com credentials: 'include'
 */
const AUTH_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

// ============================================================================
// CADASTRO UNIFICADO
// ============================================================================

/**
 * Cria cadastro unificado (pessoa + papel + vínculo)
 */
export async function createUnifiedRegistration(
  payload: UnifiedRegistrationPayload
): Promise<UnifiedRegistrationResponse> {
  const response = await fetch(`${API_BASE}/unified-registration`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    credentials: 'include', // Cookie HttpOnly enviado automaticamente
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(error.detail || error.message || `Erro ${response.status}`);
  }
  
  return response.json();
}

/**
 * Upload de foto com remoção de fundo
 */
export async function uploadProfilePhoto(
  personId: number | string,
  file: File,
  removeBackground: boolean = true
): Promise<{ file_url: string; media_id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('remove_background', String(removeBackground));
  formData.append('media_type', 'profile_photo');
  
  // Não incluir Content-Type - o browser define automaticamente para multipart/form-data
  const response = await fetch(`${API_BASE}/persons/${personId}/media/upload`, {
    method: 'POST',
    credentials: 'include', // Cookie HttpOnly enviado automaticamente
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro no upload' }));
    throw new Error(error.detail || `Erro ${response.status}`);
  }
  
  return response.json();
}

// ============================================================================
// LOOKUP DATA
// ============================================================================

/**
 * Lista posições ofensivas
 */
export async function getOffensivePositions(): Promise<OffensivePosition[]> {
  const response = await fetch(`${API_BASE}/offensive-positions`, {
    method: 'GET',
    headers: AUTH_HEADERS,
    credentials: 'include',
  });
  
  if (!response.ok) {
    // Fallback para dados estáticos se API falhar
    return [
      { id: 1, name: 'Armadora Central' },
      { id: 2, name: 'Lateral Esquerda' },
      { id: 3, name: 'Lateral Direita' },
      { id: 4, name: 'Ponta Esquerda' },
      { id: 5, name: 'Ponta Direita' },
      { id: 6, name: 'Pivô' },
    ];
  }
  
  return response.json();
}

/**
 * Lista posições defensivas
 */
export async function getDefensivePositions(): Promise<DefensivePosition[]> {
  const response = await fetch(`${API_BASE}/defensive-positions`, {
    method: 'GET',
    headers: AUTH_HEADERS,
    credentials: 'include',
  });
  
  if (!response.ok) {
    // Fallback para dados estáticos se API falhar
    return [
      { id: 1, name: 'Defensora Base' },
      { id: 2, name: 'Defensora Avançada' },
      { id: 3, name: '1ª Defensora' },
      { id: 4, name: '2ª Defensora' },
      { id: 5, name: 'Goleira' },
    ];
  }
  
  return response.json();
}

/**
 * Lista categorias
 */
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'GET',
    headers: AUTH_HEADERS,
    credentials: 'include',
  });
  
  if (!response.ok) {
    // Fallback para dados estáticos se API falhar
    return [
      { id: 1, name: 'Mirim', max_age: 12 },
      { id: 2, name: 'Infantil', max_age: 14 },
      { id: 3, name: 'Cadete', max_age: 16 },
      { id: 4, name: 'Juvenil', max_age: 18 },
      { id: 5, name: 'Júnior', max_age: 21 },
      { id: 6, name: 'Adulto', max_age: 36 },
      { id: 7, name: 'Master', max_age: 60 },
    ];
  }
  
  return response.json();
}

/**
 * Lista níveis de escolaridade
 */
export async function getSchoolingLevels(): Promise<SchoolingLevel[]> {
  const response = await fetch(`${API_BASE}/schooling-levels`, {
    method: 'GET',
    headers: AUTH_HEADERS,
    credentials: 'include',
  });
  
  if (!response.ok) {
    // Fallback para dados estáticos se API falhar
    return [
      { id: 1, name: 'Ensino Fundamental Incompleto' },
      { id: 2, name: 'Ensino Fundamental Completo' },
      { id: 3, name: 'Ensino Médio Incompleto' },
      { id: 4, name: 'Ensino Médio Completo' },
      { id: 5, name: 'Ensino Superior Incompleto' },
      { id: 6, name: 'Ensino Superior Completo' },
    ];
  }
  
  return response.json();
}

/**
 * Lista equipes da organização
 */
export async function getTeamsByOrganization(organizationId: number | string): Promise<Team[]> {
  const response = await fetch(`${API_BASE}/teams?organization_id=${organizationId}`, {
    method: 'GET',
    headers: AUTH_HEADERS,
    credentials: 'include',
  });
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.items || data;
}

/**
 * Lista organizações disponíveis
 */
export async function getOrganizations(): Promise<Organization[]> {
  const response = await fetch(`${API_BASE}/organizations`, {
    method: 'GET',
    headers: AUTH_HEADERS,
    credentials: 'include',
  });
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.items || data;
}

// ============================================================================
// VALIDAÇÃO DE CEP (ViaCEP)
// ============================================================================

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Busca endereço por CEP usando API ViaCEP
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  // Remove caracteres não numéricos
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}
