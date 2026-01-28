/**
 * Server Actions para autenticação
 *
 * Configurações para Neon Free Tier:
 * - Timeout maior (15s) para cold start
 * - Retry automático 1x em timeout/5xx
 * - Mensagens de erro apropriadas (nunca "usuário inválido" em 5xx)
 *
 * Referências RAG:
 * - Backend: POST /api/v1/auth/login
 * - R26: Roles disponíveis
 */

'use server'

import { cookies } from 'next/headers'
import { fetchApi, API_TIMEOUT } from '@/lib/utils/fetch'
import {
  LoginCredentials,
  LoginResponse,
  Session,
  User,
  JWTPayload,
} from '../../src/types/auth'
import { UserRole } from '../../src/types'
import { decodeJWT, getTimeUntilExpiration } from './jwt'

const SESSION_COOKIE = 'hb_session'
const ACCESS_TOKEN_COOKIE = 'hb_access_token'

// Erros que justificam retry (cold start do Neon)
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504]

/**
 * Verifica se deve retentar a requisição
 */
function shouldRetry(status: number): boolean {
  return RETRYABLE_STATUS_CODES.includes(status)
}

/**
 * Fetch com timeout para login
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
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
 * Server Action: Login
 * 
 * Implementa:
 * - Timeout de 15s (cold start do Neon pode demorar)
 * - Retry automático 1x em timeout ou 5xx
 * - Mensagens de erro corretas (não mostra "credencial inválida" em 5xx)
 */
export async function loginAction(
  credentials: LoginCredentials
): Promise<{ success: boolean; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const maxRetries = 1
  
  // OAuth2 expects form-urlencoded with 'username' field (not 'email')
  const formData = new URLSearchParams()
  formData.append('username', credentials.email)
  formData.append('password', credentials.password)

  let lastError: string = 'Erro ao conectar. Tente novamente.'
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `${API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        },
        API_TIMEOUT
      )

      // Sucesso
      if (res.ok) {
        const response: LoginResponse = await res.json()

        // Decodificar JWT para extrair user info
        const payload = decodeJWT(response.access_token)
        if (!payload) {
          return { success: false, error: 'Token inválido' }
        }

        // Criar sessão usando dados da resposta do backend
        const session: Session = {
          user: {
            id: response.user_id,
            email: response.email,
            name: response.full_name ?? response.email ?? '',
            role: response.role_code as UserRole,
            role_name: response.role_name,
            organization_id: response.organization_id,
            is_superadmin: response.is_superadmin || false,
            photo_url: response.photo_url,
            permissions: response.permissions || [],
          },
          accessToken: response.access_token,
          expiresAt: Date.now() + getTimeUntilExpiration(response.access_token),
        }

        // Salvar em cookie httpOnly
        const cookieStore = await cookies()
        cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: response.expires_in,
          path: '/',
        })
        cookieStore.set(ACCESS_TOKEN_COOKIE, response.access_token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: response.expires_in,
          path: '/',
        })

        return { success: true }
      }

      // Erro do servidor (5xx) - pode ser cold start
      if (shouldRetry(res.status) && attempt < maxRetries) {
        console.log(`[Login] Server error ${res.status}, retrying (attempt ${attempt + 1})...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }

      // Erro 5xx na última tentativa - mensagem genérica
      if (res.status >= 500) {
        lastError = 'Servidor temporariamente indisponível. Tente novamente em alguns segundos.'
        continue
      }

      // Erro 4xx - erro do cliente (credenciais, validação, etc)
      const error = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
      
      if (res.status === 401) {
        return { success: false, error: 'Email ou senha incorretos' }
      }
      
      if (res.status === 422) {
        return { success: false, error: 'Dados inválidos. Verifique email e senha.' }
      }

      const errorMessage = typeof error.detail === 'object' && error.detail !== null
        ? (error.detail as any).message || JSON.stringify(error.detail)
        : error.detail || 'Erro ao fazer login'
      
      return { success: false, error: errorMessage }

    } catch (error: any) {
      console.error(`[Login] Error (attempt ${attempt + 1}):`, error)
      
      // Timeout - pode ser cold start
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          console.log('[Login] Timeout, retrying...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        lastError = 'Conexão lenta. O servidor pode estar iniciando. Tente novamente.'
        continue
      }

      // Network error
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }

      lastError = 'Erro de conexão. Verifique sua internet e tente novamente.'
    }
  }

  return { success: false, error: lastError }
}

/**
 * Server Action: Logout
 * 
 * Deleta cookies de sessão com as mesmas opções usadas na criação
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  
  // Deletar cookie de sessão (httpOnly)
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expira imediatamente
  })
  
  // Deletar cookie de access token
  cookieStore.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expira imediatamente
  })
}

/**
 * Server Action: Obter sessão atual
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)

    if (!sessionCookie) return null

    const session: Session = JSON.parse(sessionCookie.value)

    // Verificar se sessão expirou
    if (Date.now() > session.expiresAt) {
      await logoutAction()
      return null
    }

    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

/**
 * Server Action: Obter usuário atual
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user || null
}

/**
 * Server Action: Verificar se usuário tem role específica
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

/**
 * Server Action: Verificar se usuário tem uma das roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser()
  return user ? roles.includes(user.role) : false
}
