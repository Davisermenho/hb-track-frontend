/**
 * Hook useAuth para componentes client-side
 *
 * Configurações para Neon Free Tier:
 * - Pré-aquecimento após login (chama /me para estabilizar sessão)
 *
 * Referências RAG:
 * - R26: Roles disponíveis
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthState, LoginCredentials } from '@/types/auth'
import { UserRole } from '@/types'
import { loginAction, logoutAction, getCurrentUser } from '@/lib/auth/actions'

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  })

  const loadSession = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      setAuthState({
        isAuthenticated: !!user,
        user,
        isLoading: false,
      })
    } catch (error) {
      console.error('Load session error:', error)
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      })
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession()
  }, [loadSession])

  async function warmupAfterLogin() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      await loadSession()
    } catch (error) {
      console.error('[Warmup] Error:', error)
    }
  }

  async function login(credentials: LoginCredentials): Promise<{
    success: boolean
    error?: string
  }> {
    const result = await loginAction(credentials)

    if (result.success) {
      await warmupAfterLogin()
      router.push('/')
    }

    return result
  }

  async function logout() {
    await logoutAction()
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    })
    // Logout intencional - não precisa de callbackUrl
    router.push('/signin')
  }

  function hasRole(role: UserRole): boolean {
    return authState.user?.role === role
  }

  function hasAnyRole(roles: UserRole[]): boolean {
    return authState.user ? roles.includes(authState.user.role) : false
  }

  return {
    ...authState,
    login,
    logout,
    hasRole,
    hasAnyRole,
    refresh: loadSession,
  }
}
