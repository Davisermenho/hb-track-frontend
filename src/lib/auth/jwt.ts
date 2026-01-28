/**
 * Utilitários JWT
 *
 * Referências RAG:
 * - JWT_ALGORITHM: HS256
 * - JWT_EXPIRES_MINUTES: 30
 */

import { JWTPayload } from '../../types/auth'

/**
 * Decodifica JWT sem verificar assinatura (apenas parse do payload)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf-8')
    )

    return decoded as JWTPayload
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error)
    return null
  }
}

/**
 * Verifica se o token está expirado
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload) return true

  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Retorna tempo em ms até expiração do token
 */
export function getTimeUntilExpiration(token: string): number {
  const payload = decodeJWT(token)
  if (!payload) return 0

  const now = Math.floor(Date.now() / 1000)
  const remaining = payload.exp - now

  return remaining > 0 ? remaining * 1000 : 0
}
