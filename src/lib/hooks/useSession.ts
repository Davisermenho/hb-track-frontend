/**
 * Hook useSession - Acesso reativo à sessão do usuário
 * 
 * Fornece acesso fácil aos dados da sessão, incluindo permissões.
 * 
 * @example
 * const { session, user, permissions, isAuthenticated } = useSession()
 */

'use client';

import { useAuth } from '@/context/AuthContext';

export function useSession() {
  const auth = useAuth();

  return {
    session: auth.user ? {
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
    } : null,
    user: auth.user,
    permissions: auth.user?.permissions || [],
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isSuperadmin: auth.user?.is_superadmin || false,
  };
}