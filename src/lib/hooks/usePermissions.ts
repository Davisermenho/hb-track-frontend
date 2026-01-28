/**
 * Hook para verificação de permissões
 * 
 * Baseado em:
 * - R24/R25: Permissões por papel e escopo implícito
 * - R41: Hierarquia formal
 * - RF1: Cadeia hierárquica de criação
 * - Seção 5.1: Matriz de permissões de edição
 * - Sistema de Permissões Granulares (SISTEMA_PERMISSOES.md)
 */

'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '../../types';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Permissões granulares do sistema
 * Vêm do backend no momento do login
 */
export type Permission =
  // Atletas
  | 'read_athlete'
  | 'edit_athlete'
  | 'delete_athlete'
  | 'view_athletes'
  | 'manage_athletes'
  // Treinos
  | 'read_training'
  | 'edit_training'
  | 'delete_training'
  // Jogos/Partidas
  | 'read_match'
  | 'edit_match'
  | 'delete_match'
  // Bem-estar
  | 'read_wellness'
  | 'edit_wellness'
  // Médico
  | 'read_medical'
  | 'edit_medical'
  // Admin
  | 'admin_memberships'
  | 'admin_organization'
  | 'admin_teams'
  | 'admin_seasons'
  | 'manage_users'
  | 'manage_teams'
  | 'manage_organization'
  // Relatórios
  | 'view_reports'
  | 'generate_reports'
  | 'view_dashboard';

type AthleteAction = 
  | 'view'
  | 'create'
  | 'edit_basic'      // Nome, telefone, endereço
  | 'edit_documents'  // RG, CPF, Email (com justificativa)
  | 'edit_birth_date' // Data de nascimento (bloqueada após vínculo)
  | 'edit_positions'  // Posições defensiva/ofensiva
  | 'edit_state'      // Estado (ativa/dispensada/arquivada)
  | 'edit_flags'      // Flags (injured, medical_restriction, etc)
  | 'delete'
  | 'import'          // Importação em massa
  | 'export';         // Exportação de relatórios

interface PermissionContext {
  athleteHasActiveRegistration?: boolean;
  isOwnProfile?: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePermissions() {
  const { user, hasRole, isAtLeast } = useAuth();

  /**
   * Verifica se usuário pode executar ação em atletas
   * Conforme Matriz de Permissões (Seção 5.1)
   */
  const canDoAthleteAction = (
    action: AthleteAction,
    context: PermissionContext = {}
  ): boolean => {
    if (!user) return false;

    const { athleteHasActiveRegistration, isOwnProfile } = context;

    switch (action) {
      // VIEW: Todos podem ver (com escopo)
      case 'view':
        return true;

      // CREATE: admin, coordenador, treinador (RF1)
      case 'create':
        return hasRole(['admin', 'coordenador', 'treinador']);

      // EDIT_BASIC: admin, coordenador, treinador
      case 'edit_basic':
        return hasRole(['admin', 'coordenador', 'treinador']);

      // EDIT_DOCUMENTS: admin, coordenador, treinador (com justificativa)
      case 'edit_documents':
        return hasRole(['admin', 'coordenador', 'treinador']);

      // EDIT_BIRTH_DATE: 
      // - Sem vínculo: admin, coordenador, treinador
      // - Com vínculo: APENAS admin (exceção especial)
      case 'edit_birth_date':
        if (athleteHasActiveRegistration) {
          return hasRole(['admin']); // Apenas dirigente/admin
        }
        return hasRole(['admin', 'coordenador', 'treinador']);

      // EDIT_POSITIONS: admin, coordenador, treinador
      case 'edit_positions':
        return hasRole(['admin', 'coordenador', 'treinador']);

      // EDIT_STATE: admin, coordenador, treinador
      case 'edit_state':
        return hasRole(['admin', 'coordenador', 'treinador']);

      // EDIT_FLAGS: admin, coordenador, treinador
      case 'edit_flags':
        return hasRole(['admin', 'coordenador', 'treinador']);

      // DELETE: admin, coordenador (soft delete)
      case 'delete':
        return hasRole(['admin', 'coordenador']);

      // IMPORT: admin, coordenador
      case 'import':
        return hasRole(['admin', 'coordenador']);

      // EXPORT: admin, coordenador
      case 'export':
        return hasRole(['admin', 'coordenador']);

      default:
        return false;
    }
  };

  /**
   * Verifica se edição de campo específico requer justificativa
   */
  const requiresJustification = (field: string): boolean => {
    const fieldsRequiringJustification = [
      'athlete_rg',
      'athlete_cpf',
      'athlete_email',
      'user_email',
      'birth_date',
    ];
    return fieldsRequiringJustification.includes(field);
  };

  /**
   * Obtém campos editáveis baseado no papel
   */
  const getEditableFields = (
    context: PermissionContext = {}
  ): string[] => {
    if (!user) return [];

    const baseFields = ['athlete_photo_path']; // Todos podem editar foto própria

    if (hasRole(['admin', 'coordenador', 'treinador'])) {
      const fields = [
        ...baseFields,
        'athlete_nickname',
        'shirt_number',
        'guardian_name',
        'guardian_phone',
        'main_defensive_position_id',
        'secondary_defensive_position_id',
        'main_offensive_position_id',
        'secondary_offensive_position_id',
        'schooling_id',
        'state',
        'injured',
        'medical_restriction',
        'suspended_until',
        'load_restricted',
        // Campos com justificativa
        'athlete_rg',
        'athlete_cpf',
        'athlete_email',
        // Endereço
        'zip_code',
        'street',
        'address_number',
        'address_complement',
        'neighborhood',
        'city',
        'state_address',
      ];

      // Data de nascimento só editável sem vínculo ativo
      if (!context.athleteHasActiveRegistration || hasRole(['admin'])) {
        fields.push('birth_date');
      }

      return fields;
    }

    return baseFields;
  };

  /**
   * Verifica se pode acessar página/seção específica
   */
  const canAccessPage = (page: string): boolean => {
    if (!user) return false;

    const pagePermissions: Record<string, UserRole[]> = {
      // Dashboard
      '/dashboard': ['admin', 'coordenador', 'treinador', 'atleta'],
      
      // Atletas
      '/athletes': ['admin', 'coordenador', 'treinador'],
      '/athletes/new': ['admin', 'coordenador', 'treinador'],
      '/athletes/import': ['admin', 'coordenador'],
      
      // Equipes
      '/teams': ['admin', 'coordenador', 'treinador'],
      '/teams/new': ['admin', 'coordenador'],
      
      // Temporadas
      '/seasons': ['admin', 'coordenador'],
      '/seasons/new': ['admin', 'coordenador'],
      
      // Relatórios
      '/reports': ['admin', 'coordenador'],
      
      // Configurações
      '/settings': ['admin'],
      
      // Perfil (próprio)
      '/profile': ['admin', 'coordenador', 'treinador', 'atleta'],
    };

    const allowedRoles = pagePermissions[page];
    if (!allowedRoles) return true; // Página não mapeada = acesso livre

    return allowedRoles.includes(user.role);
  };

  /**
   * Filtra itens de navegação baseado em permissões
   */
  const filterNavItems = <T extends { roles?: UserRole[] }>(items: T[]): T[] => {
    if (!user) return [];
    return items.filter(item => !item.roles || item.roles.includes(user.role));
  };

  // ============================================================================
  // PERMISSÕES GRANULARES (do backend)
  // ============================================================================
  
  const permissionsMap = user?.permissions || {};
  const isSuperadmin = user?.is_superadmin || false;

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (permission: Permission): boolean => {
    // Superadmin sempre tem todas as permissões
    if (isSuperadmin) return true;
    
    return permissionsMap[permission] === true;
  };

  /**
   * Verifica se o usuário tem PELO MENOS UMA das permissões fornecidas
   */
  const hasAnyPermission = (...requiredPermissions: Permission[]): boolean => {
    // Superadmin sempre tem todas as permissões
    if (isSuperadmin) return true;
    
    return requiredPermissions.some(perm => permissionsMap[perm] === true);
  };

  /**
   * Verifica se o usuário tem TODAS as permissões fornecidas
   */
  const hasAllPermissions = (...requiredPermissions: Permission[]): boolean => {
    // Superadmin sempre tem todas as permissões
    if (isSuperadmin) return true;
    
    return requiredPermissions.every(perm => permissionsMap[perm] === true);
  };

  return {
    // Estado
    user,
    role: user?.role,
    
    // Verificações básicas
    hasRole,
    isAtLeast,
    
    // Permissões granulares
    permissions: permissionsMap,
    isSuperadmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Verificações específicas de atletas
    canDoAthleteAction,
    requiresJustification,
    getEditableFields,
    
    // Verificações de navegação
    canAccessPage,
    filterNavItems,
    
    // Helpers rápidos
    isAdmin: user?.role === 'admin',
    isCoordinator: user?.role === 'coordenador',
    isTrainer: user?.role === 'treinador',
    isAthlete: user?.role === 'atleta',
    canManageAthletes: hasRole(['admin', 'coordenador', 'treinador']),
    canManageTeams: hasRole(['admin', 'coordenador']),
    canViewReports: hasRole(['admin', 'coordenador']),
    userRole: user?.role,
  };
}

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

// O componente RequirePermission está em @/components/permissions/RequirePermission
// Importe de lá para uso com JSX
