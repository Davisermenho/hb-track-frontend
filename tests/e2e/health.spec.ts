/**
 * Teste de Saúde - Health Check
 * 
 * Conforme REGRAS TESTES.md - Regra 33:
 * "Um teste simples que verifica: app subiu, /signin carrega, 
 * API responde. Se falhar, pare cedo."
 * 
 * Este arquivo DEVE rodar ANTES de todos os outros testes.
 * Se falhar aqui, não faz sentido continuar a suíte.
 * 
 * IMPORTANTE: Este spec NÃO faz login.
 * - Login é feito APENAS no auth.setup.ts (gera storageState)
 * - Testes de sessão (logout/login) ficam em teams.auth.spec.ts
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

test.describe('Health Check - Infraestrutura', () => {
  // Sem autenticação para estes testes
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: backend API deve estar respondendo', async ({ request }) => {
    // Tentar endpoint de health ou qualquer endpoint público
    const response = await request.get(`${API_BASE}/health`, {
      timeout: 10000,
    }).catch(() => null);

    // Se /health não existe, tentar /docs (Swagger)
    if (!response || !response.ok()) {
      const docsResponse = await request.get(`${API_BASE.replace('/api/v1', '')}/docs`, {
        timeout: 10000,
      });
      expect(docsResponse.ok(), 'Backend não está respondendo').toBeTruthy();
    } else {
      expect(response.ok()).toBeTruthy();
    }
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: frontend deve carregar página de login', async ({ page }) => {
    const response = await page.goto('/signin', { timeout: 30000 });
    
    // Verificar que a página carregou
    expect(response?.ok() || response?.status() === 304).toBeTruthy();
    
    // Verificar URL final
    await expect(page).toHaveURL(/signin/);
    
    // Verificar que o formulário de login está presente
    const emailInput = page.locator('input[placeholder="Email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    const passwordInput = page.locator('input[placeholder="Senha"]');
    await expect(passwordInput).toBeVisible();
    
    const submitButton = page.locator('button:has-text("Conectar")');
    await expect(submitButton).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: frontend deve carregar página inicial', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    
    // Pode redirecionar para /signin ou mostrar landing
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que não está em erro
    const url = page.url();
    expect(url).not.toContain('error');
    expect(url).not.toContain('500');
  });
});

test.describe('Health Check - Rotas Protegidas', () => {
  // Sem autenticação
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: rota /teams sem auth deve redirecionar para /signin', async ({ page }) => {
    await page.goto('/teams');
    
    // Deve redirecionar para signin
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/signin');
    
    // Deve ter callbackUrl
    expect(url.searchParams.has('callbackUrl')).toBeTruthy();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: rota /inicio sem auth deve redirecionar para /signin', async ({ page }) => {
    await page.goto('/inicio');
    
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    expect(page.url()).toContain('/signin');
  });
});

