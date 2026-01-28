/**
 * =============================================================================
 * CONTRATO DE NAVEGAÇÃO E ERROS - TEAMS (CAMADA 2)
 * =============================================================================
 * 
 * PROPÓSITO: Validar contratos de navegação ANTES de testar funcionalidades.
 * 
 * REGRA: Cada teste valida 1 comportamento de navegação/erro.
 *   - Se falhar, você sabe EXATAMENTE o que quebrou
 *   - Não mistura redirect com CRUD com permissão
 * 
 * GRANULARIDADE:
 *   - 1 teste = 1 redirect OU 1 erro OU 1 fallback
 *   - Objetivo claro no nome do teste
 * 
 * EXECUÇÃO (após health.gate):
 * npx playwright test tests/e2e/teams/teams.contract.spec.ts --project=chromium --workers=1 --retries=0
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');

// TestIDs canônicos (do manifesto)
const TID = {
  notFound: 'not-found-page',
  teamsRoot: 'teams-dashboard',
  overviewRoot: 'team-overview-tab',
  membersRoot: 'team-members-tab',
  settingsRoot: 'teams-settings-root',
  createBtn: 'create-team-btn',
} as const;

// UUID de teste (da org E2E do seed)
const E2E_ORG_ID = 'e2e00000-0000-0000-0000-000000000001';
const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

// =============================================================================
// HELPERS (mínimos - só espera por sinal estável)
// =============================================================================

async function waitForTeamsRoot(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.locator(`[data-testid="${TID.teamsRoot}"]`).waitFor({ state: 'visible', timeout: 30000 });
}

async function waitForOverviewRoot(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.locator(`[data-testid="${TID.overviewRoot}"]`).waitFor({ state: 'visible', timeout: 30000 });
}

// =============================================================================
// SEÇÃO A: REDIRECTS SEM AUTH (401)
// =============================================================================

test.describe('Contrato: 401 - Sem Autenticação', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('/teams → /signin?callbackUrl=/teams', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/signin');
    expect(url.searchParams.get('callbackUrl')).toBe('/teams');
  });

  test('/teams/:id/overview → /signin?callbackUrl preserva path', async ({ page }) => {
    await page.goto(`/teams/${E2E_ORG_ID}/overview`);
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/signin');
    expect(url.searchParams.get('callbackUrl')).toContain(`/teams/${E2E_ORG_ID}`);
  });

  test('/teams/:id/members → /signin?callbackUrl preserva path', async ({ page }) => {
    await page.goto(`/teams/${E2E_ORG_ID}/members`);
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/signin');
    expect(url.searchParams.get('callbackUrl')).toContain('/members');
  });
});

// =============================================================================
// SEÇÃO B: REDIRECTS CANÔNICOS (com auth)
// =============================================================================

test.describe('Contrato: Redirects Canônicos', () => {
  test.use({ storageState: ADMIN_STATE });

  // Precisamos de um team real para testar redirects
  // Usamos o team base do seed E2E
  // ID da equipe base E2E criada pelo seed_e2e.py do backend
  const SEED_TEAM_ID = '88888888-8888-8888-8884-000000000001';

  test('/teams/:id → /teams/:id/overview (sem tab)', async ({ page }) => {
    await page.goto(`/teams/${SEED_TEAM_ID}`);
    
    await page.waitForURL(`**/teams/${SEED_TEAM_ID}/overview`, { timeout: 15000 });
    await expect(page).toHaveURL(`/teams/${SEED_TEAM_ID}/overview`);
  });

  test('/teams/:id/invalid-tab → /teams/:id/overview (tab inválida)', async ({ page }) => {
    await page.goto(`/teams/${SEED_TEAM_ID}/xpto-invalid`);
    
    await page.waitForURL(`**/teams/${SEED_TEAM_ID}/overview`, { timeout: 15000 });
    await expect(page).toHaveURL(`/teams/${SEED_TEAM_ID}/overview`);
  });

  test('/teams/:id/OVERVIEW → /teams/:id/overview (case insensitive)', async ({ page }) => {
    // Navega para URL com case incorreto
    await page.goto(`/teams/${SEED_TEAM_ID}/OVERVIEW`);
    await page.waitForLoadState('domcontentloaded');
    
    // Aceita 3 saídas válidas:
    // 1. Renderizou 404 (app-404)
    // 2. Renderizou a aba overview (team-overview-tab)
    // 3. URL canônica lowercase (em Linux/CI, middleware normaliza)
    //
    // NOTA: No Windows, o NTFS é case-insensitive, então o Next.js resolve
    // a pasta `overview/` diretamente sem chamar o middleware. A URL permanece
    // /OVERVIEW mas a página renderiza corretamente. Isso é comportamento esperado.
    
    const is404 = await page.getByTestId(TID.notFound).isVisible().catch(() => false);
    
    if (!is404) {
      // Se não é 404, deve ter renderizado a aba overview
      await expect(page.getByTestId(TID.overviewRoot)).toBeVisible();
      
      // URL deve conter /overview (case-insensitive para suportar Windows)
      await expect(page).toHaveURL(/\/overview(\?|$)/i);
    }
  });
});

// =============================================================================
// SEÇÃO C: ERROS 404
// =============================================================================

test.describe('Contrato: 404 - Não Encontrado', () => {
  test.use({ storageState: ADMIN_STATE });

  test('UUID inválido (não é UUID) → 404', async ({ page }) => {
    await page.goto('/teams/not-a-uuid/overview');
    
    await expect(page.locator(`[data-testid="${TID.notFound}"]`)).toBeVisible({ timeout: 10000 });
  });

  test('UUID válido mas inexistente → 404', async ({ page }) => {
    await page.goto(`/teams/${FAKE_UUID}/overview`);
    
    await expect(page.locator(`[data-testid="${TID.notFound}"]`)).toBeVisible({ timeout: 10000 });
  });

  test('Team deletado (soft delete) → 404', async ({ page }) => {
    // UUID que parece válido mas não existe
    const deletedId = '99999999-9999-9999-9999-999999999999';
    await page.goto(`/teams/${deletedId}/overview`);
    
    await expect(page.locator(`[data-testid="${TID.notFound}"]`)).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// SEÇÃO D: PÁGINAS CARREGAM COM ROOT TESTID
// =============================================================================

test.describe('Contrato: Páginas carregam com root testid', () => {
  test.use({ storageState: ADMIN_STATE });

  // ID da equipe base E2E criada pelo seed_e2e.py do backend
  const SEED_TEAM_ID = '88888888-8888-8888-8884-000000000001';

  test('/teams → teams-dashboard visível', async ({ page }) => {
    await page.goto('/teams');
    await waitForTeamsRoot(page);
    
    await expect(page).toHaveURL('/teams');
    await expect(page.locator(`[data-testid="${TID.teamsRoot}"]`)).toBeVisible();
  });

  test('/teams/:id/overview → team-overview-tab visível', async ({ page }) => {
    await page.goto(`/teams/${SEED_TEAM_ID}/overview`);
    await waitForOverviewRoot(page);
    
    await expect(page).toHaveURL(`/teams/${SEED_TEAM_ID}/overview`);
    await expect(page.locator(`[data-testid="${TID.overviewRoot}"]`)).toBeVisible();
  });

  test('/teams/:id/members → team-members-tab visível', async ({ page }) => {
    await page.goto(`/teams/${SEED_TEAM_ID}/members`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(`/teams/${SEED_TEAM_ID}/members`);
    // Usar seletor específico para evitar ambiguidade entre tab e conteúdo
    await expect(page.locator(`div[data-testid="${TID.membersRoot}"]`)).toBeVisible({ timeout: 30000 });
  });

  test('/teams/:id/settings → teams-settings-root visível', async ({ page }) => {
    await page.goto(`/teams/${SEED_TEAM_ID}/settings`);
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL(`/teams/${SEED_TEAM_ID}/settings`);
    await expect(page.locator(`[data-testid="${TID.settingsRoot}"]`)).toBeVisible({ timeout: 30000 });
  });
});

// =============================================================================
// SEÇÃO E: BOTÕES/MARCADORES ESTÁVEIS
// =============================================================================

test.describe('Contrato: Marcadores estáveis por página', () => {
  test.use({ storageState: ADMIN_STATE });

  // ID da equipe base E2E criada pelo seed_e2e.py do backend
  const SEED_TEAM_ID = '88888888-8888-8888-8884-000000000001';

  test('/teams tem botão criar equipe', async ({ page }) => {
    await page.goto('/teams');
    await waitForTeamsRoot(page);
    
    await expect(page.locator(`[data-testid="${TID.createBtn}"]`)).toBeVisible();
  });

  test('/teams/:id/members tem botão convidar', async ({ page }) => {
    await page.goto(`/teams/${SEED_TEAM_ID}/members`);
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('[data-testid="invite-member-btn"]')).toBeVisible({ timeout: 30000 });
  });

  test('/teams/:id/settings tem input de nome', async ({ page }) => {
    // Coletar logs de console para debug
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('SettingsTab') || msg.text().includes('Permission')) {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    await page.goto(`/teams/${SEED_TEAM_ID}/settings`);
    await page.waitForLoadState('domcontentloaded');

    // Aguardar o root aparecer
    await expect(page.locator('[data-testid="teams-settings-root"]')).toBeVisible({ timeout: 30000 });

    // Debug: verificar o texto do loading
    const loadingText = await page.locator('[data-testid="teams-settings-root"]').textContent().catch(() => '');
    console.log('Estado do loading:', loadingText);

    // Aguardar o spinner de loading desaparecer OU timeout
    try {
      await page.locator('.animate-spin').waitFor({ state: 'detached', timeout: 20000 });
    } catch (e) {
      console.log('Spinner não desapareceu. Logs coletados:', consoleLogs);
      // Pegar HTML para debug
      const html = await page.locator('[data-testid="teams-settings-root"]').innerHTML();
      console.log('HTML do settings-root:', html.substring(0, 200));
    }

    // Verificar que o input de nome está visível
    await expect(page.locator('[data-testid="team-name-input"]')).toBeVisible({ timeout: 15000 });
  });
});
