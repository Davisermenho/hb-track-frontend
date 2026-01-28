/**
 * useTeamPermissions Hook
 * 
 * Gerencia permissões do usuário em uma equipe específica.
 * Baseado nas regras R25/R26 do sistema HB Track.
 * 
 * **FASE 2 - Sincronização com Backend:**
 * - Busca permissões reais do Backend via GET /api/v1/auth/me
 * - Cache de 5 minutos (staleTime) com revalidação automática
 * - Fallback restritivo (role='membro') em caso de erro
 * - Timeout de 15s com retry específico
 * - Retorna flag isOffline para mostrar aviso ao usuário
 * 
 * Hierarquia de papéis:
 * - OWNER/Criador: Acesso total, pode deletar equipe
 * - ADMIN/Dirigente: Pode gerenciar membros e configurações
 * - COORDENADOR: Pode editar treinos e membros
 * - TREINADOR: Pode criar treinos, ver estatísticas
 * - MEMBRO/Atleta: Apenas visualização
 */

import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { teamsService } from '@/lib/api/teams';
import { apiClient } from '@/lib/api/client';
import { useEffect } from 'react';

// Step 8: Mapeamento explícito Backend → Frontend
const PERMISSION_MAP = {
  can_manage_teams: 'canManageTeam',
  can_manage_members: 'canManageMembers',
  can_create_training: 'canCreateTraining',
} as const;

export type TeamRole = 
  | 'owner' 
  | 'admin' 
  | 'dirigente' 
  | 'coordenador' 
  | 'treinador' 
  | 'membro' 
  | 'atleta';

export interface TeamPermissions {
  // Papel do usuário na equipe
  role: TeamRole;
  roleLabel: string;
  
  // Permissões específicas
  canManageTeam: boolean;      // Editar configurações da equipe
  canManageMembers: boolean;   // Adicionar/remover membros
  canChangeRoles: boolean;     // Alterar papéis de membros
  canCreateTraining: boolean;  // Criar treinos
  canEditTraining: boolean;    // Editar treinos
  canDeleteTraining: boolean;  // Deletar treinos
  canViewStats: boolean;       // Ver estatísticas
  canExportData: boolean;      // Exportar dados
  canDeleteTeam: boolean;      // Deletar a equipe
  canLeaveTeam: boolean;       // Sair da equipe
  
  // Estado
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  
  // Step 6 & 7: Fallback e notificação offline
  isOffline: boolean;          // True se usando fallback restritivo
  offlineMessage?: string;     // Mensagem de aviso para o usuário
}

// Mapeamento de roles para labels em português
const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Criador',
  admin: 'Administrador',
  dirigente: 'Dirigente',
  coordenador: 'Coordenador',
  treinador: 'Treinador',
  membro: 'Membro',
  atleta: 'Atleta',
};

// Hierarquia de permissões (maior número = mais permissões)
const ROLE_HIERARCHY: Record<TeamRole, number> = {
  atleta: 1,
  membro: 1,
  treinador: 2,
  coordenador: 3,
  dirigente: 4,
  admin: 4,
  owner: 5,
};

/**
 * Normaliza o código do papel para o formato padrão
 */
function normalizeRole(role: string | undefined | null): TeamRole {
  if (!role) return 'membro';
  
  const normalized = role.toLowerCase().trim();
  
  // Mapeamento de variações
  const roleMap: Record<string, TeamRole> = {
    'owner': 'owner',
    'criador': 'owner',
    'proprietário': 'owner',
    'admin': 'admin',
    'administrador': 'admin',
    'dirigente': 'dirigente',
    'coordenador': 'coordenador',
    'coordenadora': 'coordenador',
    'treinador': 'treinador',
    'treinadora': 'treinador',
    'coach': 'treinador',
    'técnico': 'treinador',
    'técnica': 'treinador',
    'membro': 'membro',
    'member': 'membro',
    'atleta': 'atleta',
    'athlete': 'atleta',
  };
  
  return roleMap[normalized] || 'membro';
}

/**
 * Verifica se o papel tem nível de permissão igual ou superior ao requerido
 */
function hasMinimumRole(userRole: TeamRole, requiredRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Hook principal para gerenciar permissões de equipe
 * 
 * Step 5-7: Refatorado para buscar permissões do Backend com fallback
 * Step 9-11: Integrado com WebSocket para invalidação em tempo real
 */
export function useTeamPermissions(teamId: string | undefined): TeamPermissions {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Step 9: Integrar listener WebSocket para invalidar cache
  useEffect(() => {
    const handlePermissionsChanged = (event: CustomEvent) => {
      console.log('[useTeamPermissions] Permissões alteradas, invalidando cache:', event.detail);
      
      // Invalidar cache para forçar refetch imediato
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      
      // Step 11: Limpar aviso offline ao receber evento (conexão restaurada)
      queryClient.setQueryData(['user-permissions-offline'], false);
    };
    
    window.addEventListener('permissions-changed', handlePermissionsChanged as EventListener);
    
    return () => {
      window.removeEventListener('permissions-changed', handlePermissionsChanged as EventListener);
    };
  }, [queryClient]);
  
  // Step 5: Buscar permissões do Backend via /api/v1/auth/me
  const { data: backendPermissions, isLoading: permissionsLoading, isError } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      if (!user) return null;
      
      // Usar apiClient que já tem a URL base correta (http://localhost:8000/api/v1)
      // e envia cookies automaticamente via credentials: 'include'
      try {
        const data = await apiClient.get<{ permissions: Record<string, boolean> }>('/auth/me');
        return data.permissions;
      } catch (error) {
        console.error('[useTeamPermissions] Erro ao buscar permissões:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,   // Step 5a: 5 minutos fresh
    gcTime: 10 * 60 * 1000,     // Step 5a: 10 minutos em cache
    retry: (failureCount) => failureCount < 2,  // Step 6: Retry 2x
    retryDelay: () => 1000,     // Step 6: Delay de 1 segundo
  });
  
  // Buscar dados da equipe para obter o papel do usuário e verificar ownership
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team-permissions', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      try {
        const teamData = await teamsService.getById(teamId);
        return teamData;
      } catch {
        return null;
      }
    },
    enabled: !!teamId && !!user,
    staleTime: 5 * 60 * 1000,
  });
  
  const isLoading = authLoading || permissionsLoading || teamLoading;
  
  // Step 6: Fallback restritivo se erro ao buscar permissões
  const isOffline = isError || !backendPermissions;
  const offlineMessage = isOffline 
    ? "Problemas de conexão. Algumas funções podem estar limitadas."
    : undefined;
  
  // Determinar o papel do usuário
  const userRole = normalizeRole(user?.role);
  
  // Verificar se o usuário é o criador (owner) da equipe
  const isTeamCreator = !!(team && user && team.created_by_user_id === user.id);
  
  // Step 5 & 6: Usar permissões do Backend se disponível, senão fallback
  let canManageTeam: boolean;
  let canManageMembers: boolean;
  let canCreateTraining: boolean;
  
  if (backendPermissions && !isOffline) {
    // Usar permissões reais do Backend
    canManageTeam = backendPermissions.can_manage_teams ?? false;
    canManageMembers = backendPermissions.can_manage_members ?? false;
    canCreateTraining = backendPermissions.can_create_training ?? false;
  } else {
    // Step 6: Fallback restritivo (role='membro' permissions)
    canManageTeam = false;
    canManageMembers = false;
    canCreateTraining = false;
  }
  
  // Calcular permissões baseadas no papel (para permissões não sincronizadas)
  const isOwner = userRole === 'owner' || isTeamCreator;
  const isAdmin = hasMinimumRole(userRole, 'admin');
  const isCoordinator = hasMinimumRole(userRole, 'coordenador');
  const isCoach = hasMinimumRole(userRole, 'treinador');
  
  return {
    role: userRole,
    roleLabel: ROLE_LABELS[userRole],
    
    // Step 5: Permissões sincronizadas com Backend
    canManageTeam,
    canManageMembers,
    canCreateTraining,
    
    // Permissões locais (não sincronizadas ainda)
    canChangeRoles: isAdmin,
    canEditTraining: isCoach,
    canDeleteTraining: isCoordinator,
    canViewStats: true,
    canExportData: isCoordinator,
    canDeleteTeam: isOwner,
    canLeaveTeam: !isOwner,
    
    // Estado
    isLoading,
    isOwner,
    isAdmin,
    isCoach,
    
    // Step 6 & 7: Fallback e notificação
    isOffline,
    offlineMessage,
  };
}

/**
 * Componente wrapper para renderização condicional baseada em permissão
 */
interface RequireTeamPermissionProps {
  teamId: string;
  permission: keyof Omit<TeamPermissions, 'role' | 'roleLabel' | 'isLoading' | 'isOwner' | 'isAdmin' | 'isCoach'>;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireTeamPermission({
  teamId,
  permission,
  fallback = null,
  children,
}: RequireTeamPermissionProps) {
  const permissions = useTeamPermissions(teamId);
  
  if (permissions.isLoading) {
    return null;
  }
  
  if (!permissions[permission]) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export default useTeamPermissions;
