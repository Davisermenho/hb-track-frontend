/**
 * Auth Setup - Gera storageState para diferentes roles
 * 
 * Este arquivo é executado ANTES dos testes para criar sessões
 * de autenticação que podem ser reutilizadas.
 * 
 * Estados gerados:
 * - playwright/.auth/admin.json      → Usuário admin/superadmin
 * - playwright/.auth/dirigente.json  → Usuário dirigente
 * - playwright/.auth/coordenador.json → Usuário coordenador
 * - playwright/.auth/coach.json      → Usuário treinador
 * - playwright/.auth/atleta.json     → Usuário atleta
 * - playwright/.auth/user.json       → Usuário padrão (compatibilidade)
 * 
 * CONFIGURAÇÃO:
 * Defina as variáveis no .env.test ou .env.local
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Paths para os arquivos de estado
const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');
const DIRIGENTE_STATE = path.join(AUTH_DIR, 'dirigente.json');
const COORDENADOR_STATE = path.join(AUTH_DIR, 'coordenador.json');
const COACH_STATE = path.join(AUTH_DIR, 'coach.json');
const ATLETA_STATE = path.join(AUTH_DIR, 'atleta.json');
const MEMBRO_STATE = path.join(AUTH_DIR, 'membro.json');
const USER_STATE = path.join(AUTH_DIR, 'user.json');

// Garantir que o diretório existe
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

/**
 * Helper para fazer login e salvar estado - versão simplificada
 */
async function performLogin(
  page: any,
  email: string,
  password: string,
  statePath: string,
  roleName: string
): Promise<void> {
  console.log(`🔐 [${roleName}] Iniciando login para: ${email}`);

  // Navegar para página de login
  await page.goto('/signin');
  await page.waitForLoadState('domcontentloaded');

  // Encontrar campos pelo placeholder
  const emailInput = page.locator('input[placeholder="Email"]');
  const passwordInput = page.locator('input[placeholder="Senha"]');

  // Verificar se os campos existem
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  // Preencher credenciais
  await emailInput.fill(email);
  await passwordInput.fill(password);
  console.log(`✅ [${roleName}] Credenciais preenchidas`);

  // Aguardar botão estar disponível e habilitado
  const submitButton = page.locator('button:has-text("Conectar")');
  await expect(submitButton).toBeVisible();
  
  // Pequeno delay para validação do form
  await page.waitForTimeout(300);
  
  // Clicar no botão
  await submitButton.click();
  console.log(`🖱️ [${roleName}] Botão clicado`);

  // Aguardar redirecionamento (60s para evitar timeouts em ambientes lentos)
  try {
    await page.waitForURL('**/inicio', { timeout: 60000 });
    console.log(`✅ [${roleName}] Redirecionado para /inicio`);
  } catch (e) {
    // Verificar se há mensagem de erro na página
    const errorText = await page.locator('.text-error-700, .text-error-600, .text-red-500, [role="alert"]').textContent().catch(() => null);
    if (errorText) {
      throw new Error(`[${roleName}] Login falhou: ${errorText.trim()}`);
    }
    throw new Error(`[${roleName}] Login falhou: Timeout aguardando redirect para /inicio`);
  }

  // Validar cookie
  const cookies = await page.context().cookies();
  const accessToken = cookies.find((c: any) => c.name === 'hb_access_token');
  
  if (!accessToken) {
    throw new Error(`[${roleName}] Cookie hb_access_token não encontrado`);
  }
  console.log(`✅ [${roleName}] Cookie hb_access_token presente`);

  // Salvar estado
  await page.context().storageState({ path: statePath });
  console.log(`✅ [${roleName}] Estado salvo em: ${statePath}`);
}

// ============================================================================
// SETUP: Admin User
// ============================================================================

setup('Leia tests_log p/ solucionar -> autenticar admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️ TEST_ADMIN_EMAIL/PASSWORD não configurados. Pulando setup.');
    fs.writeFileSync(ADMIN_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await performLogin(page, email, password, ADMIN_STATE, 'ADMIN');
  // Delay para evitar rate limiting (5 logins/min)
  await page.waitForTimeout(3000);
});

// ============================================================================
// SETUP: Dirigente User (usa admin que já é dirigente)
// ============================================================================

setup('Leia tests_log p/ solucionar -> autenticar dirigente', async ({ page }) => {
  // Dirigente foi removido - admin já é dirigente, então copiamos o storage state
  console.log('⚠️ [DIRIGENTE] Usando storage state de admin (admin já é dirigente)');
  fs.copyFileSync(ADMIN_STATE, DIRIGENTE_STATE);
  console.log('✅ [DIRIGENTE] Estado copiado de admin.json');
});

// ============================================================================
// SETUP: Coordenador User
// ============================================================================

setup('Leia tests_log p/ solucionar -> autenticar coordenador', async ({ page }) => {
  const email = process.env.TEST_COORDENADOR_EMAIL;
  const password = process.env.TEST_COORDENADOR_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️ TEST_COORDENADOR_EMAIL/PASSWORD não configurados. Pulando setup.');
    fs.writeFileSync(COORDENADOR_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await performLogin(page, email, password, COORDENADOR_STATE, 'COORDENADOR');
  // Delay para evitar rate limiting (5 logins/min)
  await page.waitForTimeout(3000);
});

// ============================================================================
// SETUP: Coach User (Treinador)
// ============================================================================

setup('Leia tests_log p/ solucionar -> autenticar coach', async ({ page }) => {
  const email = process.env.TEST_COACH_EMAIL;
  const password = process.env.TEST_COACH_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️ TEST_COACH_EMAIL/PASSWORD não configurados. Pulando setup.');
    fs.writeFileSync(COACH_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await performLogin(page, email, password, COACH_STATE, 'COACH');
  // Delay para evitar rate limiting (5 logins/min)
  await page.waitForTimeout(3000);
});

// ============================================================================
// SETUP: Atleta User
// ============================================================================

setup('Leia tests_log p/ solucionar -> autenticar atleta', async ({ page }) => {
  const email = 'e2e.atleta@teste.com';
  const password = 'Admin@123';

  await performLogin(page, email, password, ATLETA_STATE, 'ATLETA');
  // Delay para evitar rate limiting (5 logins/min)
  await page.waitForTimeout(3000);
});

// ============================================================================
// NOTA: Membro não tem teste de login aqui
// Membros só conseguem fazer login após cadastro via fluxo de convite (welcome).
// O teste de membro está em teams.welcome.spec.ts
// ============================================================================

// ============================================================================
// SETUP: Default User (compatibilidade com testes existentes)
// ============================================================================

setup('Leia tests_log p/ solucionar -> autenticar usuário padrão', async ({ page }) => {
  // Copia o estado do admin para user.json (compatibilidade)
  // Evita fazer login duplicado com mesmo usuário
  if (fs.existsSync(ADMIN_STATE)) {
    fs.copyFileSync(ADMIN_STATE, USER_STATE);
    console.log(`✅ [USER] Estado copiado de admin.json para user.json`);
  } else {
    throw new Error('❌ admin.json não existe. Execute autenticar admin primeiro.');
  }
});
