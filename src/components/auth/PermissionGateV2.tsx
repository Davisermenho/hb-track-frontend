'use client'

import { ReactNode } from 'react'
import { useSession } from '@/lib/hooks/useSession'
import { AuthContext } from '@/types/auth'

/**
 * PermissionGate - Controle de UI baseado em permissões
 * 
 * ARQUITETURA:
 * - Permissões vêm do mapa canônico (backend: app/core/permissions_map.py)
 * - AuthContext carrega permissões já resolvidas
 * - Este componente apenas LÊEEK permissões (zero regras)
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
 * <PermissionGate permission="can_create_team">
 *   <button>Criar Equipe</button>
 * </PermissionGate>
 * 
 * <PermissionGate anyOf={["can_view_reports", "can_generate_reports"]}>
 *   <Link href="/reports">Relatórios</Link>
 * </PermissionGate>
 * 
 * <PermissionGate allOf={["can_create_team", "can_create_athlete"]}>
 *   <button>Configurar Equipe</button>
 * </PermissionGate>
 * ```
 */

interface PermissionGateProps {
  children: ReactNode
  
  /** Permissão única requerida (ex: "can_create_team") */
  permission?: string
  
  /** Requer QUALQUER uma das permissões (OR) */
  anyOf?: string[]
  
  /** Requer TODAS as permissões (AND) */
  allOf?: string[]
  
  /** Elemento a renderizar se não tiver permissão (default: null) */
  fallback?: ReactNode
  
  /** Se true, renderiza children mesmo sem permissões (útil para debugging) */
  alwaysShow?: boolean
}

function hasPermission(context: AuthContext | null, permission: string): boolean {
  if (!context) return false
  return context.permissions[permission] === true
}

export function PermissionGate({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
  alwaysShow = false,
}: PermissionGateProps) {
  const { session } = useSession()
  const context = session?.user ? {
    ...session.user,
    permissions: session.user.permissions || {}
  } as unknown as AuthContext : null

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
  if (permission && !hasPermission(context, permission)) {
    return <>{fallback}</>
  }

  // Verificar "qualquer uma" (OR)
  if (anyOf && !anyOf.some(perm => hasPermission(context, perm))) {
    return <>{fallback}</>
  }

  // Verificar "todas" (AND)
  if (allOf && !allOf.every(perm => hasPermission(context, perm))) {
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
 * <PermissionGateInverse permission="can_manage_users">
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
  const { session } = useSession()
  const context = session?.user ? {
    ...session.user,
    permissions: session.user.permissions || {}
  } as unknown as AuthContext : null

  // Validar que pelo menos um critério foi fornecido
  if (!permission && !anyOf && !allOf) {
    console.warn('PermissionGateInverse: Nenhum critério de permissão fornecido')
    return null
  }

  // Inverter lógica: renderiza se NÃO tiver permissão
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(context, permission)
  } else if (anyOf) {
    hasAccess = anyOf.some(perm => hasPermission(context, perm))
  } else if (allOf) {
    hasAccess = allOf.every(perm => hasPermission(context, perm))
  }

  // Se tem acesso, não renderiza nada
  if (hasAccess) {
    return null
  }

  // Se não tem acesso, renderiza children
  return <>{children}</>
}
