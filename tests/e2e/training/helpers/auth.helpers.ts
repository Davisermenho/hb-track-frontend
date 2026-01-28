/**
 * Auth Helpers - Training Module E2E Tests
 * 
 * Helpers núcleo para autenticação multi-role sem lógica de negócio.
 * 
 * PRINCÍPIOS:
 * - Genéricos e reutilizáveis
 * - Sem regras de negócio
 * - Baixo acoplamento
 * - Alto sinal de qualidade
 */

import { Page } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');

/**
 * Roles suportados no sistema
 */
export type UserRole = 'dirigente' | 'coordenador' | 'treinador' | 'coach' | 'atleta' | 'admin';

/**
 * Mapeamento role → auth state file
 */
const AUTH_STATE_FILES: Record<UserRole, string> = {
  admin: path.join(AUTH_DIR, 'admin.json'),
  dirigente: path.join(AUTH_DIR, 'dirigente.json'),
  coordenador: path.join(AUTH_DIR, 'coordenador.json'),
  treinador: path.join(AUTH_DIR, 'treinador.json'),
  coach: path.join(AUTH_DIR, 'coach.json'),
  atleta: path.join(AUTH_DIR, 'atleta.json'),
};

/**
 * Configura autenticação multi-role para teste.
 * 
 * USO:
 *   test.use({ storageState: setupAuth('coordenador') });
 * 
 * @param role - Role do usuário (dirigente, coordenador, treinador/coach, atleta, admin)
 * @returns Path para o arquivo de storage state
 */
export function setupAuth(role: UserRole): string {
  const stateFile = AUTH_STATE_FILES[role];
  if (!stateFile) {
    throw new Error(`Role "${role}" não tem auth state configurado`);
  }
  return stateFile;
}

/**
 * Verifica se usuário está autenticado.
 * 
 * @param page - Playwright Page
 * @returns true se autenticado, false caso contrário
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Verificar se existe cookie de sessão ou token JWT
  const cookies = await page.context().cookies();
  return cookies.some(c => c.name === 'session' || c.name === 'access_token');
}

/**
 * Faz logout (limpa storage state).
 * 
 * @param page - Playwright Page
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}

/**
 * Aguarda autenticação estar pronta (útil após login manual).
 * 
 * @param page - Playwright Page
 * @param timeout - Timeout em ms (padrão: 5000)
 */
export async function waitForAuthReady(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(500); // Settle time
}
