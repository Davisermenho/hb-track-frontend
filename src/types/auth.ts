/**
 * Tipos de autenticação
 *
 * Referências RAG:
 * - R26: Roles (admin, coordenador, treinador, atleta)
 * - Backend: POST /api/v1/auth/login
 */

import { UserRole } from './index'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string  // JWT refresh token (validade 7 dias)
  token_type: string
  expires_in: number
  user_id: string
  full_name: string | null  // Nome completo da pessoa (campo full_name do banco)
  email: string
  role_code: string
  role_name: string | null
  is_superadmin: boolean
  organization_id: string
  photo_url: string | null
  permissions: Record<string, boolean>
  needs_setup: boolean
}

export interface JWTPayload {
  sub: string              // user_id (UUID)
  person_id: string
  email?: string           // email do usuário
  full_name?: string       // nome completo da pessoa
  role_code: string        // código da role (dirigente, coordenador, etc)
  role_name?: string       // nome do papel (ex: Dirigente, Treinador)
  is_superadmin: boolean
  organization_id: string
  membership_id: string | null
  exp: number              // timestamp de expiração
  iat?: number             // timestamp de emissão (opcional)
}

export interface User {
  id: string
  email: string
  name: string // Nome mapeado de full_name do backend
  full_name?: string | null // Nome completo da pessoa
  phone?: string | null // Telefone
  role: UserRole
  role_name?: string | null // Nome do papel (ex: Dirigente, Treinador)
  organization_id: string
  photo_url?: string | null // URL da foto de perfil
  gender?: string | null // Gênero da pessoa (masculino/feminino)
  is_superadmin?: boolean
  needs_setup?: boolean
  permissions: Record<string, boolean>
}

export interface Session {
  user: User
  accessToken: string
  refreshToken: string  // JWT refresh token (7 dias)
  expiresAt: number     // timestamp em ms (do access token)
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
}
// Password Reset Types
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
  confirm_password: string
}

export interface ResetPasswordResponse {
  message: string
  email: string
}

/**
 * Contexto completo do usuário - CONTRATO FIXO
 * 
 * VERSÃO: 1.0
 * 
 * ⚠️ CONTRATO CONGELADO:
 * - NÃO renomear campos (quebra frontend)
 * - NÃO mudar tipos (quebra validação)
 * - Adicionar campos novos = OK (com default)
 * - Backend versiona mudanças breaking (v1 → v2)
 * 
 * Sempre retorna todos os campos (null se não aplicável).
 * Este é o contrato padrão retornado após login.
 * 
 * ARQUITETURA CANÔNICA:
 * - permissions: Mapa canônico (ROLE_PERMISSIONS) resolvido no backend
 * - system_state: Estado do sistema (temporada, onboarding) separado de permissões
 * - ExecutionContext é a fonte da verdade
 * - Frontend lê como read-only capabilities
 * 
 * Backend: GET /api/v1/auth/context
 */
export interface AuthContext {
  user_id: string
  person_id: string | null
  role_code: string
  is_superadmin: boolean
  organization_id: string | null
  organization_name: string | null
  membership_id: string | null
  current_season_id: string | null
  current_season_name: string | null
  team_registrations: TeamRegistrationContext[]
  
  /** Permissões resolvidas do mapa canônico (read-only capabilities) */
  permissions: Record<string, boolean>
  
  /** Estado do sistema (temporada ativa, onboarding, etc) - separado de permissões */
  system_state: {
    has_active_season: boolean
    season_id: string | null
    season_name: string | null
    organization_configured: boolean
    has_teams: boolean
  }
}

export interface TeamRegistrationContext {
  team_id: string
  organization_id: string
  start_at: string
  end_at: string | null
  is_active: boolean
}
