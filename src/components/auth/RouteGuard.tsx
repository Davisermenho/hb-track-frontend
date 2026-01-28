"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/types';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * RouteGuard - Componente para proteger rotas com autenticação e autorização
 *
 * Features:
 * - Verifica autenticação antes de renderizar
 * - Valida roles/permissões específicas
 * - Mostra loading state durante verificação
 * - Redireciona para página apropriada se não autorizado
 *
 * @example
 * ```tsx
 * <RouteGuard requiredRoles={['admin', 'coordenador']}>
 *   <AdminContent />
 * </RouteGuard>
 * ```
 */
export function RouteGuard({
  children,
  requiredRoles,
  redirectTo = '/signin',
  fallback,
}: RouteGuardProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Aguardar carregamento inicial
    if (isLoading) return;

    // Redirecionar se não autenticado
    if (!isAuthenticated) {
      console.warn('[RouteGuard] Usuário não autenticado, redirecionando para', redirectTo);
      router.push(redirectTo);
      return;
    }

    // Validar roles se especificadas
    if (requiredRoles && requiredRoles.length > 0) {
      const hasPermission = hasRole(requiredRoles);

      if (!hasPermission) {
        console.warn(
          '[RouteGuard] Usuário sem permissão:',
          `Role atual: ${user?.role}`,
          `Roles necessárias: ${requiredRoles.join(', ')}`
        );
        router.push('/?error=forbidden');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, hasRole, router, redirectTo]);

  // Loading state
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated || !user) {
    return null;
  }

  // Sem permissão para roles específicas
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return null;
  }

  // Autorizado - renderizar conteúdo
  return <>{children}</>;
}

/**
 * LoadingSpinner - Componente de loading reutilizável
 */
export function LoadingSpinner({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </div>
    </div>
  );
}
