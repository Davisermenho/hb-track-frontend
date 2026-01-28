/**
 * API Client - Centralizado para chamadas client-side
 * 
 * Autenticação via cookies HttpOnly:
 * - O cookie hb_access_token é enviado automaticamente via credentials: 'include'
 * - Não precisamos (nem podemos) ler o token via JavaScript
 * - Mais seguro: token protegido contra XSS
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.append(key, String(value));
    });
  }

  // Headers padrão - sem Authorization (cookie é enviado automaticamente)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const init: RequestInit = {
    method,
    headers,
    credentials: 'include', // ✅ Cookie HttpOnly enviado automaticamente
  };

  if (options.data && method !== "GET") {
    init.body = JSON.stringify(options.data);
  }

  console.log(`[API] ${method} ${url.toString()}`);

  try {
    const res = await fetch(url.toString(), init);
    if (!res.ok) {
      // Try to parse error response
      let errorDetail = '';
      try {
        const errorData = await res.json();
        const message = errorData?.message;
        const detail = errorData?.detail;
        const serializedMessage =
          typeof message === 'string'
            ? message
            : message
            ? JSON.stringify(message)
            : undefined;
        const serializedDetail =
          typeof detail === 'string'
            ? detail
            : detail
            ? JSON.stringify(detail)
            : undefined;
        errorDetail = serializedMessage || serializedDetail || JSON.stringify(errorData);
      } catch {
        errorDetail = await res.text();
      }
      throw new Error(`API ${method} ${url.pathname} failed: ${res.status} ${errorDetail}`);
    }

    // DELETE sem corpo
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err) {
    // Captura erro de rede antes do fetch
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.error('[API] Network error - Backend may be offline or CORS issue', { url: url.toString(), method });
      throw new Error(`Failed to fetch: Não foi possível conectar ao backend em ${url.toString()}. Verifique se o servidor está rodando.`);
    }
    throw err;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, data?: any, options?: RequestOptions) => request<T>("POST", path, { ...options, data }),
  patch: <T>(path: string, data?: any, options?: RequestOptions) => request<T>("PATCH", path, { ...options, data }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};

export type { RequestOptions };
