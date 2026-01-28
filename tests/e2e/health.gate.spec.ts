/**
 * =============================================================================
 * HEALTH GATE - SMOKE TEST (CAMADA 1)
 * =============================================================================
 * 
 * PROPÓSITO: Validar que a infraestrutura está UP antes de rodar qualquer spec.
 * 
 * REGRA: Se falhar aqui, PARAR TUDO. Não faz sentido testar CRUD/RBAC se:
 *   - Backend não responde
 *   - Frontend não carrega
 *   - Auth não funciona
 * 
 * GRANULARIDADE: 1 teste = 1 verificação de infra
 * 
 * EXECUÇÃO (sempre primeiro):
 * npx playwright test tests/e2e/health.gate.spec.ts --project=chromium --workers=1 --retries=0
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

test.describe('GATE: Infraestrutura', () => {
  // Sem autenticação - testando infra pura
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Backend responde em /health ou /docs', async ({ request }) => {
    // Tentar /health primeiro
    const healthRes = await request.get(`${API_BASE}/health`, { timeout: 10000 }).catch(() => null);
    
    if (healthRes?.ok()) {
      expect(healthRes.ok()).toBe(true);
      return;
    }
    
    // Fallback: /docs (Swagger sempre disponível)
    const docsRes = await request.get(`${API_BASE.replace('/api/v1', '')}/docs`, { timeout: 10000 });
    expect(docsRes.ok(), 'Backend não está respondendo').toBe(true);
  });

  test('Frontend carrega /signin sem erro', async ({ page }) => {
    const response = await page.goto('/signin', { timeout: 30000 });
    
    // Página carregou (200 ou 304)
    expect(response?.ok() || response?.status() === 304).toBe(true);
    
    // URL correta
    await expect(page).toHaveURL(/signin/);
    
    // Formulário visível (marcador estável)
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible({ timeout: 10000 });
  });

  test('Rota protegida /teams redireciona para /signin?callbackUrl', async ({ page }) => {
    await page.goto('/teams');
    
    // Aguardar redirect
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    const url = new URL(page.url());
    
    // Validações
    expect(url.pathname).toBe('/signin');
    expect(url.searchParams.has('callbackUrl')).toBe(true);
  });
});
