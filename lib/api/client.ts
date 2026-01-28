/**
 * Cliente API - Configuração base para comunicação com backend
 * 
 * Configurações para Neon Free Tier:
 * - Timeout de 15s para cold start
 * - Cache de dados estáticos (equipes, categorias, etc)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Timeout para requisições (15s para acomodar cold start)
const API_TIMEOUT = 15000;

// Cache TTL padrão: 5 minutos
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}

// Cache simples em memória
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new SimpleCache();

// Endpoints que devem ser cacheados (dados estáticos)
const CACHEABLE_ENDPOINTS = [
  '/teams',
  '/categories',
  '/positions',
  '/seasons',
];

function shouldCache(endpoint: string): boolean {
  return CACHEABLE_ENDPOINTS.some(e => endpoint.startsWith(e) && !endpoint.includes('?'));
}

// ============================================================================
// API Client - Padrão HttpOnly Cookies (2026-01-08)
// ============================================================================
// O token de autenticação é enviado automaticamente via cookie HttpOnly.
// Não é necessário (nem possível) ler o token via JavaScript.
// Todas as requisições usam credentials: 'include' para enviar cookies.
// ============================================================================

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Headers padrão para requisições.
   * O token é enviado automaticamente via cookie HttpOnly com credentials: 'include'
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: 'Erro na requisição',
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.detail = errorData.detail || errorData.message;
      } catch {
        error.detail = response.statusText;
      }

      throw error;
    }

    return response.json();
  }

  /**
   * Fetch com timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>, options?: { skipCache?: boolean }): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    // Verificar cache para endpoints estáticos
    const cacheKey = url.toString();
    if (!options?.skipCache && shouldCache(endpoint)) {
      const cached = cache.get<T>(cacheKey);
      if (cached) {
        console.log('[API Client] Cache hit:', endpoint);
        return cached;
      }
    }

    const headers = this.getAuthHeaders();

    try {
      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include', // Cookie HttpOnly enviado automaticamente
      });

      const data = await this.handleResponse<T>(response);

      // Cachear endpoints estáticos
      if (shouldCache(endpoint)) {
        cache.set(cacheKey, data);
        console.log('[API Client] Cached:', endpoint);
      }

      return data;
    } catch (error: any) {
      console.error('[API Client] Fetch error:', error);
      console.error('[API Client] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.substring(0, 500),
        type: typeof error,
        keys: error ? Object.keys(error) : []
      });
      
      // Timeout
      if (error.name === 'AbortError') {
        throw {
          message: 'Tempo limite excedido',
          status: 408,
          detail: 'O servidor demorou muito para responder. Tente novamente.'
        };
      }
      
      // Erro de rede (TypeError: Failed to fetch)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          message: 'Erro de conexão',
          status: 0,
          detail: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
        };
      }
      
      throw {
        message: 'Erro de conexão com servidor',
        status: error?.status || 0,
        detail: error?.message || error?.detail || 'Sem resposta do servidor'
      };
    }
  }

  /**
   * Invalida cache de endpoints específicos
   */
  invalidateCache(pattern?: string): void {
    cache.invalidate(pattern);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('[API Client] POST error:', error);
      throw {
        message: 'Erro ao enviar requisição',
        status: 0,
        detail: error.message || 'Sem resposta do servidor'
      };
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('[API Client] PUT error:', error);
      throw {
        message: 'Erro ao enviar requisição',
        status: 0,
        detail: error.message || 'Sem resposta do servidor'
      };
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('[API Client] PATCH error:', error);
      throw {
        message: 'Erro ao enviar requisição',
        status: 0,
        detail: error.message || 'Sem resposta do servidor'
      };
    }
  }

  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('[API Client] DELETE error:', error);
      throw {
        message: 'Erro ao deletar',
        status: 0,
        detail: error.message || 'Sem resposta do servidor'
      };
    }
  }

  /**
   * Upload de arquivo (multipart/form-data)
   * Usado para fotos de perfil, documentos digitalizados, etc.
   */
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
    try {
      const token = this.getAuthHeaders()['Authorization'];
      const formData = new FormData();
      formData.append('file', file);

      // Adicionar dados extras ao FormData se fornecidos
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = token;
      }
      // NÃO definir Content-Type - o browser define automaticamente com boundary

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('[API Client] Upload error:', error);
      throw {
        message: 'Erro ao fazer upload',
        status: 0,
        detail: error.message || 'Falha no upload do arquivo'
      };
    }
  }
}

export const apiClient = new ApiClient();
