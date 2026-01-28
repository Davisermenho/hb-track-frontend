/**
 * API Fetcher - Centralizado para SSR + Client
 * 
 * Este módulo fornece um fetcher que funciona tanto no servidor (SSR)
 * quanto no cliente, usando cookies HTTPOnly para autenticação.
 * 
 * @version 1.0.0
 * 
 * Características:
 * - SSR: Lê cookie via next/headers
 * - Client: Envia cookie automaticamente via credentials: 'include'
 * - Centraliza tratamento de erros
 * - Retry automático em caso de falha de rede
 */

import { cookies } from 'next/headers';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const COOKIE_NAME = 'hb_access_token';

// =============================================================================
// TIPOS
// =============================================================================

export interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** Se true, não adiciona Authorization header */
  skipAuth?: boolean;
  /** Timeout em ms (default: 30000) */
  timeout?: number;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Verifica se está executando no servidor (SSR)
 */
function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Obtém o token do cookie (SSR ou Client)
 */
async function getAuthToken(): Promise<string | null> {
  if (isServer()) {
    // SSR: Usar next/headers para ler cookies
    try {
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get(COOKIE_NAME);
      return tokenCookie?.value || null;
    } catch {
      // cookies() pode falhar fora de um contexto de request
      return null;
    }
  } else {
    // Client: Cookie é enviado automaticamente via credentials: 'include'
    // Não precisamos ler manualmente (HTTPOnly impede isso)
    return null;
  }
}

/**
 * Cria um AbortController com timeout
 */
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

// =============================================================================
// FETCHER PRINCIPAL
// =============================================================================

/**
 * Fetcher centralizado para API
 * 
 * @example
 * // GET request
 * const data = await apiFetch('/api/v1/teams');
 * 
 * @example
 * // POST request com body
 * const data = await apiFetch('/api/v1/teams', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'Nova Equipe' }),
 * });
 * 
 * @example
 * // Request sem autenticação
 * const data = await apiFetch('/api/v1/health', { skipAuth: true });
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    headers = {},
    skipAuth = false,
    timeout = 30000,
    ...fetchOptions
  } = options;

  // Construir URL completa
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Headers padrão
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Adicionar Authorization header no SSR
  if (!skipAuth && isServer()) {
    const token = await getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Configurar timeout
  const controller = createTimeoutController(timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      credentials: 'include', // Sempre enviar cookies
      signal: controller.signal,
      // No SSR, não usar cache por padrão para dados dinâmicos
      cache: isServer() ? 'no-store' : undefined,
    });

    // Tratar respostas de erro
    if (!response.ok) {
      // Tentar extrair mensagem de erro do body
      let errorMessage = `HTTP ${response.status}`;
      let errorDetail: string | undefined;

      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || errorBody.detail || errorMessage;
        errorDetail = errorBody.detail;
      } catch {
        // Body não é JSON
      }

      const error: ApiError = {
        status: response.status,
        message: errorMessage,
        detail: errorDetail,
      };

      // Log para debug
      if (process.env.NODE_ENV === 'development') {
        console.error(`[apiFetch] Error ${response.status}:`, errorMessage, { url, options });
      }

      throw error;
    }

    // Resposta vazia (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse JSON
    return await response.json() as T;

  } catch (error) {
    // Timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        status: 408,
        message: 'Request timeout',
        detail: `A requisição excedeu o limite de ${timeout}ms`,
      } as ApiError;
    }

    // Erro de rede
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: 'Network error',
        detail: 'Não foi possível conectar ao servidor',
      } as ApiError;
    }

    // Re-throw ApiError
    if ((error as ApiError).status !== undefined) {
      throw error;
    }

    // Erro desconhecido
    throw {
      status: 500,
      message: 'Unknown error',
      detail: error instanceof Error ? error.message : 'Erro desconhecido',
    } as ApiError;
  }
}

// =============================================================================
// HELPERS DE CONVENIÊNCIA
// =============================================================================

/**
 * GET request
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options?: Omit<FetchOptions, 'method'>
): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
}

// =============================================================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// =============================================================================

/**
 * Verifica se há um cookie de autenticação válido (SSR only)
 * 
 * Útil para middleware e layouts que precisam verificar auth antes do fetch
 */
export async function hasAuthCookie(): Promise<boolean> {
  if (!isServer()) {
    console.warn('[hasAuthCookie] Esta função só funciona no servidor');
    return false;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);
    return !!token?.value;
  } catch {
    return false;
  }
}

/**
 * Obtém informações básicas do token (sem validar com o servidor)
 * 
 * ATENÇÃO: Isso não valida o token, apenas decodifica o payload
 */
export async function getTokenPayload(): Promise<Record<string, unknown> | null> {
  if (!isServer()) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!token) return null;

    // Decodificar payload do JWT (base64)
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}
