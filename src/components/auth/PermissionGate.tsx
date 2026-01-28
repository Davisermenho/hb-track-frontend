'use client'

import { ReactNode } from 'react'
import { usePermissions, type Permission } from '@/lib/hooks/usePermissions'

/**
 * PermissionGate - Controle de UI baseado em permissões
 * 
 * ⚠️ IMPORTANTE: Este componente NÃO protege segurança!
 * 
 * Propósito:
 * - Melhorar UX escondendo elementos que o usuário não pode acessar
 * - Evitar requisições desnecessárias ao backend
 * - Reduzir confusão do usuário (não mostrar botões que retornariam 403)
 * 
 * Segurança:
 * - A proteção REAL está no backend (403/401)
 * - Backend SEMPRE valida permissões antes de executar ações
 * - Este componente é apenas cosmético/UX
 * 
 * Uso:
 * ```tsx
 * <PermissionGate permission="manage_users">
 *   <button>Criar Usuário</button>
 * </PermissionGate>
 * 
 * <PermissionGate anyOf={["view_reports", "generate_reports"]}>
 *   <Link href="/reports">Relatórios</Link>
 * </PermissionGate>
 * 
 * <PermissionGate allOf={["manage_teams", "manage_athletes"]}>
 *   <button>Configurar Equipe</button>
 * </PermissionGate>
 * ```
 */

interface PermissionGateProps {
  children: ReactNode
  
  /** Permissão única requerida */
  permission?: Permission
  
  /** Requer QUALQUER uma das permissões (OR) */
  anyOf?: Permission[]
  
  /** Requer TODAS as permissões (AND) */
  allOf?: Permission[]
  
  /** Elemento a renderizar se não tiver permissão (default: null) */
  fallback?: ReactNode
  
  /** Se true, renderiza children mesmo sem permissões (útil para debugging) */
  alwaysShow?: boolean
}

export function PermissionGate({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
  alwaysShow = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // Debug mode: sempre mostra
  if (alwaysShow) {
    return <>{children}</>
  }

  // Validar que pelo menos um critério foi fornecido
  if (!permission && !anyOf && !allOf) {
    console.warn('PermissionGate: Nenhum critério de permissão fornecido')
    return <>{children}</>
  }

  // Verificar permissão única
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Verificar "qualquer uma" (OR)
  if (anyOf && !hasAnyPermission(...anyOf)) {
    return <>{fallback}</>
  }

  // Verificar "todas" (AND)
  if (allOf && !hasAllPermissions(...allOf)) {
    return <>{fallback}</>
  }

  // Usuário tem permissão: renderiza children
  return <>{children}</>
}

/**
 * PermissionGateInverse - Renderiza apenas se NÃO tiver permissão
 * 
 * Útil para mostrar mensagens de "upgrade" ou "entre em contato com admin"
 * 
 * Uso:
 * ```tsx
 * <PermissionGateInverse permission="manage_users">
 *   <div>Você não tem permissão para gerenciar usuários</div>
 * </PermissionGateInverse>
 * ```
 */
export function PermissionGateInverse({
  children,
  permission,
  anyOf,
  allOf,
}: Omit<PermissionGateProps, 'fallback' | 'alwaysShow'>) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // Validar que pelo menos um critério foi fornecido
  if (!permission && !anyOf && !allOf) {
    console.warn('PermissionGateInverse: Nenhum critério de permissão fornecido')
    return null
  }

  // Inverter lógica: renderiza se NÃO tiver permissão
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (anyOf) {
    hasAccess = hasAnyPermission(...anyOf)
  } else if (allOf) {
    hasAccess = hasAllPermissions(...allOf)
  }

  // Se tem acesso, não renderiza nada
  if (hasAccess) {
    return null
  }

  // Se não tem acesso, renderiza children
  return <>{children}</>
}
