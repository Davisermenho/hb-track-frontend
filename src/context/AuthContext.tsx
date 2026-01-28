"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User, Session, UserRole } from "../types";

/**
 * AuthContext - Gerenciamento de estado de autenticação
 * 
 * ARQUITETURA SSR-SAFE:
 * - Tokens são gerenciados via cookies HttpOnly (não acessíveis via JS)
 * - Este context é APENAS para estado de UI (nome, role, permissões)
 * - Autenticação real é feita via middleware.ts + cookies
 * - Server Actions fazem o fetch autenticado
 * 
 * Baseado em:
 * - R41: Hierarquia formal (superadmin > dirigente > coordenador > treinador > atleta)
 * - RF1: Cadeia hierárquica de criação
 * - R24/R25: Permissões por papel e escopo implícito
 */

// ============================================================================
// TIPOS
// ============================================================================

interface AuthContextType {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Ações
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Helpers de permissão
  hasRole: (role: UserRole | UserRole[]) => boolean;
  canManageAthletes: () => boolean;
  canCreateUsers: () => boolean;
  isAtLeast: (role: UserRole) => boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Hierarquia de roles (R41) - índice maior = mais permissões */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  atleta: 1,
  treinador: 2,
  coordenador: 3,
  dirigente: 4,
  admin: 4, // superadmin
};

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initRef = useRef(false);

  /**
   * Limpa sessão local (UI state apenas)
   * NOTA: Cookies HttpOnly são gerenciados via Server Actions
   */
  const clearLocalSession = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setUser(null);
  }, []);

  /**
   * Carrega sessão do servidor via Server Action
   * 
   * NOTA: Não lemos cookies diretamente (são HttpOnly)
   * Usamos server action que tem acesso aos cookies
   */
  const loadSession = useCallback(async (): Promise<Session | null> => {
    try {
      const { getSession } = await import('@/lib/auth/actions');
      const session = await getSession();
      
      if (session) {
        console.log('[Auth] Sessão carregada via Server Action:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          role_name: session.user.role_name,
          name: session.user.name,
          is_superadmin: session.user.is_superadmin,
        });
        return session;
      }
      
      return null;
    } catch (error) {
      console.error('[Auth] Erro ao carregar sessão:', error);
      return null;
    }
  }, []);

  /**
   * Agenda renovação automática de token
   */
  const scheduleTokenRefresh = useCallback((session: Session) => {
    // Limpar timer anterior
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Calcular tempo até expiração
    const timeUntilExpiration = session.expiresAt - Date.now();

    // Renovar 5 minutos antes de expirar (ou 80% do tempo de vida)
    const refreshTime = Math.max(timeUntilExpiration - (5 * 60 * 1000), timeUntilExpiration * 0.8);

    if (refreshTime > 0 && session.refreshToken) {
      console.log(`[Auth] Token refresh agendado para ${Math.round(refreshTime / 1000)}s`);

      refreshTimeoutRef.current = setTimeout(async () => {
        console.log('[Auth] Renovando token automaticamente...');

        try {
          const { refreshTokenAction } = await import('@/lib/auth/actions');
          const result = await refreshTokenAction(session.refreshToken);

          if (result.success) {
            console.log('[Auth] Token renovado com sucesso');
            const newSession = await loadSession();
            if (newSession) {
              setUser(newSession.user);
              scheduleTokenRefresh(newSession);
            }
          } else {
            console.error('[Auth] Falha ao renovar token:', result.error);
            clearLocalSession();
            // Preservar callbackUrl para retornar após login
            const callbackUrl = window.location.pathname + window.location.search;
            router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          }
        } catch (error) {
          console.error('[Auth] Erro ao renovar token:', error);
          clearLocalSession();
          // Preservar callbackUrl para retornar após login
          const callbackUrl = window.location.pathname + window.location.search;
          router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      }, refreshTime);
    }
  }, [loadSession, clearLocalSession, router]);

  /**
   * Inicializa auth state
   */
  useEffect(() => {
    // Evitar múltiplas inicializações em Strict Mode
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      try {
        const session = await loadSession();
        if (session) {
          setUser(session.user);
          scheduleTokenRefresh(session);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [loadSession, scheduleTokenRefresh]);

  /**
   * Login
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const { loginAction } = await import('@/lib/auth/actions');
      const result = await loginAction({ email, password });

      if (result.success) {
        console.log('[Auth] Login bem-sucedido, carregando sessão...');
        
        // Aguardar um pouco para o cookie ser setado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const session = await loadSession();
        if (session) {
          setUser(session.user);
          scheduleTokenRefresh(session);
          console.log('[Auth] Sessão carregada após login:', session.user);
        }
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    setIsLoading(true);
    
    try {
      const { logoutAction } = await import('@/lib/auth/actions');
      await logoutAction();
      clearLocalSession();
      
      // Force full page reload to clear any cached state
      window.location.href = '/signin';
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      clearLocalSession();
      window.location.href = '/signin';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh session
   */
  const refreshSession = async () => {
    const session = await loadSession();
    if (session) {
      setUser(session.user);
    } else {
      clearLocalSession();
    }
  };

  /**
   * Verifica se usuário tem uma ou mais roles
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  /**
   * Verifica se usuário pode gerenciar atletas (RF1)
   * Roles: admin, coordenador, treinador
   */
  const canManageAthletes = (): boolean => {
    return hasRole(['admin', 'coordenador', 'treinador']);
  };

  /**
   * Verifica se usuário pode criar outros usuários (RF1)
   * Roles: admin, coordenador, treinador
   */
  const canCreateUsers = (): boolean => {
    return hasRole(['admin', 'coordenador', 'treinador']);
  };

  /**
   * Verifica se usuário tem pelo menos o nível de uma role (R41)
   */
  const isAtLeast = (role: UserRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role];
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshSession,
        hasRole,
        canManageAthletes,
        canCreateUsers,
        isAtLeast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HIGHER-ORDER COMPONENT PARA PROTEÇÃO DE ROTAS
// ============================================================================

interface WithAuthOptions {
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requiredRoles, redirectTo = '/signin' } = options;

  return function AuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push(redirectTo);
        } else if (requiredRoles && !hasRole(requiredRoles)) {
          router.push('/unauthorized');
        }
      }
    }, [isLoading, isAuthenticated, router, hasRole]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
      return null;
    }

    return <Component {...props} />;
  };
}
