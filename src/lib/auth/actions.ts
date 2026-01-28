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
  AuthContext,
  Session,
  User,
  JWTPayload,
} from '../../types/auth'
import { UserRole } from '../../types'
import { decodeJWT, getTimeUntilExpiration } from './jwt'

const SESSION_COOKIE = 'hb_session'
const ACCESS_TOKEN_COOKIE = 'hb_access_token'
const REFRESH_TOKEN_COOKIE = 'hb_refresh_token'

/**
 * Server Action: Buscar sessão do cookie
 */
export async function getSessionAction(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)
    
    if (!sessionCookie?.value) {
      return null
    }

    const session: Session = JSON.parse(sessionCookie.value)
    
    // Verificar se ainda não expirou
    if (session.expiresAt > Date.now()) {
      return session
    }
    
    return null
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

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
          credentials: 'include', // Importante: receber cookies do backend
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
            name: response.full_name || response.email.split('@')[0],
            role: response.role_code as UserRole,
            role_name: response.role_name || null,
            organization_id: response.organization_id || '',
            photo_url: response.photo_url || null,
            is_superadmin: response.is_superadmin || false,
            permissions: response.permissions || {},
          },
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: Date.now() + getTimeUntilExpiration(response.access_token),
        }

        // Salvar em cookies
        const cookieStore = await cookies()

        // ✅ CRÍTICO: Setar o access token como HttpOnly cookie
        // O Set-Cookie do backend NÃO chega ao browser em Server Actions
        // Precisamos setar manualmente aqui para o middleware/SSR funcionar
        cookieStore.set(ACCESS_TOKEN_COOKIE, response.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: response.expires_in,
          path: '/',
        })

        // Cookie HttpOnly para servidor - sessão com dados do usuário
        cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: response.expires_in,
          path: '/',
        })

        // Refresh token para renovação automática
        cookieStore.set(REFRESH_TOKEN_COOKIE, response.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 dias
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
 * Chama endpoint do backend e deleta cookies de sessão
 */
export async function logoutAction(): Promise<void> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  // Chamar endpoint do backend para invalidar token (usando cookie)
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Enviar cookies para o backend
    })
  } catch (error) {
    console.error('Backend logout error:', error)
    // Continua mesmo se falhar no backend
  }
  
  // Deletar cookie de sessão (httpOnly)
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  
  // Deletar cookie de access token (setado pelo backend, mas podemos expirar aqui)
  cookieStore.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,  // Agora HttpOnly para consistência
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  // Deletar cookie de refresh token
  cookieStore.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,  // Agora HttpOnly para consistência
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/**
 * Server Action: Obter sessão atual
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)

    if (!sessionCookie?.value) return null

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

// ==========================================
// NOVOS ENDPOINTS - COMPLEMENTARES
// ==========================================

/**
 * Server Action: GET /auth/me
 * 
 * Busca dados atualizados do usuário no backend
 */
export async function getMeAction(): Promise<{ success: boolean; data?: User; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) {
    return { success: false, error: 'Não autenticado' }
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { success: false, error: 'Falha ao buscar dados do usuário' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return { success: false, error: 'Erro ao conectar com servidor' }
  }
}

/**
 * Server Action: GET /auth/permissions
 * 
 * Busca permissões atualizadas do usuário
 */
export async function getPermissionsAction(): Promise<{ success: boolean; permissions?: string[]; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) {
    return { success: false, error: 'Não autenticado' }
  }

  try {
    const response = await fetch(`${API_URL}/auth/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { success: false, error: 'Falha ao buscar permissões' }
    }

    const data = await response.json()
    return { success: true, permissions: data.permissions }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return { success: false, error: 'Erro ao conectar com servidor' }
  }
}

/**
 * Server Action: GET /auth/context
 * 
 * Busca contexto completo do usuário (org, role, season).
 * 
 * CONTRATO FIXO - Sempre retorna todos os campos (null se não aplicável).
 */
export async function getContextAction(): Promise<{ 
  success: boolean
  context?: AuthContext
  error?: string 
}> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) {
    return { success: false, error: 'Não autenticado' }
  }

  try {
    const response = await fetch(`${API_URL}/auth/context`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { success: false, error: 'Falha ao buscar contexto' }
    }

    const context: AuthContext = await response.json()
    return { success: true, context }
  } catch (error) {
    console.error('Error fetching context:', error)
    return { success: false, error: 'Erro ao conectar com servidor' }
  }
}

/**
 * Server Action: POST /auth/set-password
 * 
 * Define senha no primeiro acesso (via token)
 * Após sucesso, backend seta cookies HttpOnly automaticamente
 */
export async function setPasswordAction(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string; redirect_to?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!

  try {
    const response = await fetch(`${API_URL}/auth/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Importante: permite que o backend sete cookies HttpOnly
      body: JSON.stringify({
        token,
        password: newPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.detail?.message || data.detail || 'Falha ao definir senha' }
    }

    // Backend já setou os cookies HttpOnly - usuário está autenticado
    return { 
      success: true, 
      message: data.message || 'Senha definida com sucesso',
      redirect_to: data.redirect_to || '/inicio'
    }
  } catch (error) {
    console.error('Error setting password:', error)
    return { success: false, error: 'Erro ao conectar com servidor' }
  }
}

/**
 * Server Action: POST /auth/change-password
 * 
 * Altera senha do usuário autenticado
 */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) {
    return { success: false, error: 'Não autenticado' }
  }

  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.detail || 'Falha ao alterar senha' }
    }

    return { success: true, message: data.message || 'Senha alterada com sucesso' }
  } catch (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Erro ao conectar com servidor' }
  }
}

/**
 * Server Action: POST /auth/refresh
 *
 * Renova access token usando refresh token
 */
export async function refreshTokenAction(
  refreshToken: string
): Promise<{ success: boolean; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
      credentials: 'include', // Receber cookies do backend
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }))
      return {
        success: false,
        error: typeof error.detail === 'object'
          ? error.detail.message || 'Falha ao renovar token'
          : error.detail || 'Falha ao renovar token'
      }
    }

    const data = await response.json()

    // Atualizar session com novos dados
    const session = await getSession()
    if (session) {
      session.accessToken = data.access_token
      session.refreshToken = data.refresh_token
      session.expiresAt = Date.now() + (data.expires_in * 1000)

      const cookieStore = await cookies()

      // ✅ CRÍTICO: Setar o novo access token
      cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.expires_in,
        path: '/',
      })

      // Cookie HttpOnly para servidor - sessão atualizada
      cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.expires_in,
        path: '/',
      })

      // Refresh token HttpOnly
      cookieStore.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 dias
        path: '/',
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return { success: false, error: 'Erro ao conectar com servidor' }
  }
}

/**
 * Server Action: POST /auth/initial-setup
 *
 * Setup inicial para dirigente (criar organização + temporada)
 */
export async function initialSetupAction(data: {
  org_name: string
  org_type: string
  org_address?: string
  org_phone?: string
  season_name: string
  season_start_date: string
  season_end_date: string
}): Promise<{ 
  success: boolean
  data?: {
    organization: {
      id: number
      name: string
      type: string
    }
    season: {
      id: number
      name: string
      start_date: string
      end_date: string
    }
    message: string
  }
  error?: string 
}> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) {
    return { success: false, error: 'Não autenticado' }
  }

  try {
    const response = await fetch(`${API_URL}/auth/initial-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()

    if (!response.ok) {
      return { success: false, error: responseData.detail || 'Falha no setup inicial' }
    }

    // Atualizar sessão após definir senha
    const session = await getSession()
    if (session) {
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      })
    }

    return { success: true, data: responseData }
  } catch (error) {
    console.error('Error in initial setup:', error)
    return { success: false, error: 'Erro ao conectar com servidor' }
  }
}
