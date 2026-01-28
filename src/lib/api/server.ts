/**
 * API Client para Server Components e Server Actions
 * 
 * Este cliente é usado APENAS no servidor (SSR, Server Components, Server Actions).
 * Ele lê o cookie de autenticação via next/headers e passa para o backend.
 * 
 * Para chamadas client-side (browser), use o client.ts que usa credentials: 'include'.
 */

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const ACCESS_TOKEN_COOKIE = 'hb_access_token';

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
}

/**
 * Faz uma requisição autenticada do servidor para o backend.
 * Lê o cookie hb_access_token e passa no header Cookie.
 */
async function serverRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.append(key, String(value));
    });
  }

  // Obtém o token do cookie
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  // DEBUG: Log de cookies recebidos
  console.log(`[API Server] Cookies recebidos:`, cookieStore.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`));
  console.log(`[API Server] Access token encontrado:`, accessToken ? 'SIM' : 'NÃO');

  // Headers - passa o cookie manualmente para o backend
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Passa o cookie como header para que o backend possa ler
  if (accessToken) {
    headers["Cookie"] = `${ACCESS_TOKEN_COOKIE}=${accessToken}`;
    console.log(`[API Server] Cookie sendo enviado para backend:`, headers["Cookie"].substring(0, 50) + '...');
  } else {
    console.log(`[API Server] ⚠️ NENHUM TOKEN - Request será sem autenticação!`);
  }

  const init: RequestInit = {
    method,
    headers,
    // cache: 'no-store' para garantir que SSR sempre busque dados frescos
    cache: 'no-store',
  };

  if (options.data && method !== "GET") {
    init.body = JSON.stringify(options.data);
  }

  console.log(`[API Server] ${method} ${url.toString()}`);

  try {
    const res = await fetch(url.toString(), init);
    
    if (!res.ok) {
      let errorDetail = '';
      try {
        const errorData = await res.json();
        const message = errorData?.message;
        const detail = errorData?.detail;
        errorDetail = 
          (typeof message === 'string' ? message : message ? JSON.stringify(message) : '') ||
          (typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : '') ||
          JSON.stringify(errorData);
      } catch {
        errorDetail = await res.text();
      }
      throw new Error(`API ${method} ${url.pathname} failed: ${res.status} ${errorDetail}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.error('[API Server] Network error - Backend may be offline', { url: url.toString(), method });
      throw new Error(`Failed to fetch: Não foi possível conectar ao backend em ${url.toString()}.`);
    }
    throw err;
  }
}

/**
 * Cliente de API para uso em Server Components e Server Actions.
 * 
 * Exemplo de uso:
 * ```typescript
 * import { serverApiClient } from '@/lib/api/server';
 * 
 * // Em um Server Component
 * export default async function TeamPage({ params }) {
 *   const team = await serverApiClient.get<Team>(`/teams/${params.teamId}`);
 *   return <TeamDetails team={team} />;
 * }
 * ```
 */
export const serverApiClient = {
  get: <T>(path: string, options?: RequestOptions) => serverRequest<T>("GET", path, options),
  post: <T>(path: string, data?: any, options?: RequestOptions) => serverRequest<T>("POST", path, { ...options, data }),
  patch: <T>(path: string, data?: any, options?: RequestOptions) => serverRequest<T>("PATCH", path, { ...options, data }),
  delete: <T>(path: string, options?: RequestOptions) => serverRequest<T>("DELETE", path, options),
};

export type { RequestOptions };
