/**
 * Utilitários de fetch para comunicação com backend
 *
 * Configurações para Neon Free Tier:
 * - Timeout maior (15s) para cold start
 * - Retry automático para timeout/5xx
 * - Mensagens de erro apropriadas
 *
 * Referências RAG:
 * - Backend: https://hbtrack.onrender.com/api/v1
 */

import { ApiError } from '../../types'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

// Timeout para requisições (15s para acomodar cold start do Neon)
export const API_TIMEOUT = 15000

// Erros que justificam retry automático
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504]

export class ApiException extends Error {
  statusCode: number
  detail: string
  isServerError: boolean

  constructor(statusCode: number, detail: string) {
    super(detail)
    this.statusCode = statusCode
    this.detail = detail
    this.name = 'ApiException'
    this.isServerError = statusCode >= 500
  }
}

/**
 * Verifica se o erro é retryable (cold start, timeout, 5xx)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiException) {
    return RETRYABLE_STATUS_CODES.includes(error.statusCode)
  }
  // Timeout ou network error
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('timeout') || 
           msg.includes('network') || 
           msg.includes('aborted') ||
           msg.includes('failed to fetch')
  }
  return false
}

/**
 * Fetch com timeout configurável
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fetch API com timeout e tratamento de erro melhorado
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const timeout = options?.timeout ?? API_TIMEOUT

  try {
    const response = await fetchWithTimeout(
      url,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      },
      timeout
    )

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: 'Unknown error',
      }))
      // Handle detail as object or string
      const errorMessage = typeof error.detail === 'object' && error.detail !== null
        ? (error.detail as any).message || JSON.stringify(error.detail)
        : error.detail || 'Erro desconhecido'
      throw new ApiException(response.status, errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiException) {
      throw error
    }
    // Timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiException(408, 'Tempo limite excedido. Tente novamente.')
    }
    throw new ApiException(500, 'Erro de conexão com servidor')
  }
}

/**
 * Fetch com retry automático para operações críticas (ex: login)
 * Retenta apenas em timeout ou erros 5xx (cold start do Neon)
 */
export async function fetchWithRetry<T>(
  endpoint: string,
  options?: RequestInit & { timeout?: number; maxRetries?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 1
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchApi<T>(endpoint, options)
    } catch (error) {
      lastError = error
      
      // Só retenta se for erro retryable E não for a última tentativa
      if (isRetryableError(error) && attempt < maxRetries) {
        // Aguarda um pouco antes de retentar (backoff simples)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      
      throw error
    }
  }

  throw lastError
}