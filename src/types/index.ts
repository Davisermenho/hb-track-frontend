/**
 * Tipos globais do HB Tracking Frontend
 *
 * Referências RAG:
 * - R26: Roles disponíveis (admin, coordenador, treinador, atleta)
 */

export type UserRole = 'admin' | 'dirigente' | 'coordenador' | 'treinador' | 'atleta'

export interface ApiError {
  detail: string
  status_code?: number
}

export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

// Persons V1.2 - Estrutura Normalizada
export * from './persons'

// Athletes V1.2 - Tipos Canônicos
export * from './athlete-canonical'

// Auth
export * from './auth'
