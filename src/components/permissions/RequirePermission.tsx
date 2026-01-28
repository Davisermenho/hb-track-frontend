/**
 * Componente RequirePermission
 * Renderiza children apenas se o usuário tiver a(s) permissão(ões) necessária(s)
 * 
 * @example
 * <RequirePermission permission="edit_athlete">
 *   <EditButton />
 * </RequirePermission>
 * 
 * @example
 * // Com fallback
 * <RequirePermission permission="admin_organization" fallback={<AccessDenied />}>
 *   <SettingsPanel />
 * </RequirePermission>
 * 
 * @example
 * // Múltiplas permissões (pelo menos uma)
 * <RequirePermission permission={['edit_athlete', 'admin_teams']}>
 *   <ManagementPanel />
 * </RequirePermission>
 * 
 * @example
 * // Exige TODAS as permissões
 * <RequirePermission permission={['admin_teams', 'admin_seasons']} requireAll>
 *   <AdvancedConfig />
 * </RequirePermission>
 */

'use client';

import React from 'react';
import { usePermissions, type Permission } from '@/lib/hooks/usePermissions';

interface RequirePermissionProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequirePermission({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (Array.isArray(permission)) {
    hasAccess = requireAll
      ? hasAllPermissions(...permission)
      : hasAnyPermission(...permission);
  } else {
    hasAccess = hasPermission(permission);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}