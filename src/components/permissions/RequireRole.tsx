/**
 * Componente RequireRole
 * Renderiza children apenas se o usuário tiver uma das roles permitidas
 * 
 * GATE DE AUTORIZAÇÃO POR PAPEL (ROLE)
 * 
 * @example
 * <RequireRole allowedRoles={['admin', 'dirigente']}>
 *   <AdminPanel />
 * </RequireRole>
 */

'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequireRole({
  allowedRoles,
  fallback = null,
  children,
}: RequireRoleProps) {
  const { user, isLoading } = useAuth();

  // Aguardar carregamento
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  // Não autenticado
  if (!user) {
    return <>{fallback}</>;
  }

  // Verificar se role está na lista permitida
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
