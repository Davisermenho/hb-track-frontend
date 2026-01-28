/**
 * Hook para permissões específicas de atleta
 * 
 * FASE 6.1: Permissões Contextuais
 * 
 * Baseado em:
 * - REGRAS_GERENCIAMENTO_ATLETAS.md: Seção 5.1 Matriz de Permissões
 * - R24/R25: Permissões por papel e escopo implícito
 * - R41: Hierarquia formal
 * - RF1: Cadeia hierárquica de criação
 */

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Athlete, AthleteExpanded } from '../../types/athlete-canonical';
import type { UserRole } from '../../types';

// ============================================================================
// TIPOS
// ============================================================================

export interface AthletePermissions {
  // Visualização
  canView: boolean;
  
  // Edição de dados básicos
  canEditBasicInfo: boolean;          // Nome, apelido, telefone, endereço
  canEditDocuments: boolean;          // RG, CPF (requer justificativa)
  canEditEmail: boolean;              // Email (requer justificativa)
  canEditBirthDate: boolean;          // Data de nascimento (bloqueada com vínculo)
  canEditPositions: boolean;          // Posições defensiva/ofensiva
  canEditShirtNumber: boolean;        // Número da camisa
  canEditGuardian: boolean;           // Dados do responsável
  canEditPhoto: boolean;              // Foto de perfil
  
  // Gerenciamento de estado/flags
  canChangeState: boolean;            // Estado (ativa/dispensada/arquivada)
  canEditFlags: boolean;              // Flags (injured, medical_restriction, etc)
  canSetInjured: boolean;             // Flag de lesão
  canSetMedicalRestriction: boolean;  // Flag de restrição médica
  canSetSuspension: boolean;          // Suspensão até data
  canSetLoadRestricted: boolean;      // Flag de carga restrita
  
  // Vínculos
  canAddTeamRegistration: boolean;    // Adicionar vínculo com equipe
  canEndTeamRegistration: boolean;    // Encerrar vínculo com equipe
  
  // Ações especiais
  canDelete: boolean;                 // Soft delete
  canExportPDF: boolean;              // Exportar ficha PDF
  canViewHistory: boolean;            // Ver timeline de histórico
  
  // Helpers de justificativa
  birthDateRequiresJustification: boolean;
  documentsRequireJustification: boolean;
  emailRequiresJustification: boolean;
  
  // Mensagens de bloqueio
  birthDateBlockedReason?: string;
  documentsBlockedReason?: string;
}

export interface AthletePermissionContext {
  athlete?: Partial<AthleteExpanded> | null;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Roles que podem gerenciar atletas conforme RF1 */
const MANAGER_ROLES: UserRole[] = ['admin', 'coordenador', 'treinador'];

/** Roles que podem fazer soft delete */
const DELETE_ROLES: UserRole[] = ['admin', 'coordenador'];

/** Roles que podem alterar data de nascimento com vínculo ativo */
const BIRTH_DATE_OVERRIDE_ROLES: UserRole[] = ['admin'];

// ============================================================================
// HOOK
// ============================================================================

export function useAthletePermissions(context: AthletePermissionContext = {}): AthletePermissions {
  const { user, hasRole } = useAuth();
  const { athlete } = context;
  
  return useMemo(() => {
    // Verificar se atleta está em captação (sem vínculo ativo)
    const isInCaptacao = !athlete?.organization_id;
    
    // Verificar se atleta tem team_registration ativo
    const hasActiveRegistration = athlete?.team_registrations?.some(
      (r: any) => !r.end_at
    ) ?? false;
    
    // Verificar se usuário está autenticado
    const isAuthenticated = !!user;
    
    // Verificar se é manager (pode gerenciar atletas)
    const isManager = hasRole(MANAGER_ROLES);
    
    // Verificar se é admin/dirigente
    const isAdmin = hasRole(['admin']);
    
    // Verificar se pode deletar
    const canDeleteAthlete = hasRole(DELETE_ROLES);
    
    // Data de nascimento só pode ser editada:
    // 1. Se atleta está em captação (sem vínculo), qualquer manager pode
    // 2. Se atleta tem vínculo ativo, APENAS admin pode (exceção especial)
    const canEditBirthDateValue = isManager && (!hasActiveRegistration || isAdmin);
    const birthDateRequiresJustificationValue = hasActiveRegistration;
    const birthDateBlockedReasonValue = hasActiveRegistration && !isAdmin
      ? 'Data de nascimento bloqueada: atleta com vínculo ativo. Apenas Dirigente pode alterar.'
      : undefined;
    
    // Documentos e email requerem justificativa para alteração
    const documentsRequireJustificationValue = true; // Sempre requer
    const emailRequiresJustificationValue = true; // Sempre requer
    
    return {
      // Visualização - todos autenticados podem ver
      canView: isAuthenticated,
      
      // Edição de dados básicos - managers podem editar
      canEditBasicInfo: isManager,
      canEditDocuments: isManager,
      canEditEmail: isManager,
      canEditBirthDate: canEditBirthDateValue,
      canEditPositions: isManager,
      canEditShirtNumber: isManager,
      canEditGuardian: isManager,
      canEditPhoto: isAuthenticated, // Atleta pode editar própria foto
      
      // Gerenciamento de estado/flags - managers podem
      canChangeState: isManager,
      canEditFlags: isManager,
      canSetInjured: isManager,
      canSetMedicalRestriction: isManager,
      canSetSuspension: isManager,
      canSetLoadRestricted: isManager,
      
      // Vínculos - managers podem
      canAddTeamRegistration: isManager,
      canEndTeamRegistration: isManager,
      
      // Ações especiais
      canDelete: canDeleteAthlete,
      canExportPDF: isAuthenticated,
      canViewHistory: isManager,
      
      // Helpers de justificativa
      birthDateRequiresJustification: birthDateRequiresJustificationValue,
      documentsRequireJustification: documentsRequireJustificationValue,
      emailRequiresJustification: emailRequiresJustificationValue,
      
      // Mensagens de bloqueio
      birthDateBlockedReason: birthDateBlockedReasonValue,
      documentsBlockedReason: undefined,
    };
  }, [user, hasRole, athlete]);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna tooltip explicativo para campo bloqueado
 */
export function getFieldBlockedTooltip(
  fieldName: string,
  permissions: AthletePermissions
): string | null {
  switch (fieldName) {
    case 'birth_date':
      return permissions.birthDateBlockedReason || null;
    case 'athlete_rg':
    case 'athlete_cpf':
      return permissions.documentsBlockedReason || null;
    default:
      return null;
  }
}

/**
 * Retorna se campo requer modal de justificativa
 */
export function fieldRequiresJustification(
  fieldName: string,
  permissions: AthletePermissions
): boolean {
  switch (fieldName) {
    case 'birth_date':
      return permissions.birthDateRequiresJustification;
    case 'athlete_rg':
    case 'athlete_cpf':
      return permissions.documentsRequireJustification;
    case 'athlete_email':
      return permissions.emailRequiresJustification;
    default:
      return false;
  }
}
