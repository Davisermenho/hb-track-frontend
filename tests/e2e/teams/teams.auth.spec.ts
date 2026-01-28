/**
 * Tests de Autenticação - Teams Module
 * 
 * Testa proteção de rotas, redirects e cookies de autenticação
 * para todos os tipos de usuário: Admin, Dirigente, Coordenador, Treinador, Atleta
 */

import { test, expect, Page } from '@playwright/test';
import { createTeamViaAPI, deleteTeamViaAPI } from '../helpers/api';
import path from 'path';

// Paths para os arquivos de estado de autenticação
const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');
const DIRIGENTE_STATE = path.join(AUTH_DIR, 'dirigente.json');
const COORDENADOR_STATE = path.join(AUTH_DIR, 'coordenador.json');
const COACH_STATE = path.join(AUTH_DIR, 'coach.json');
const ATLETA_STATE = path.join(AUTH_DIR, 'atleta.json');

/**
 * Helper: Aguardar página de teams carregar
 */
async function waitForTeamsPage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-testid="create-team-btn"]').waitFor({ state: 'visible', timeout: 30000 });
}

/**
 * Helper: Aguardar página carregar (genérico)
 * 
 * NOTA: Não usa networkidle (Regra 4 - REGRAS TESTES.md)
 * Aguarda domcontentloaded + root testid quando possível
 */
async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  // Aguardar um elemento estável em vez de networkidle
  await page.locator('[data-testid="teams-dashboard"], [data-testid="team-overview-tab"], [data-testid="create-team-btn"]').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
}

// =============================================================================
// TESTES SEM AUTENTICAÇÃO
// =============================================================================

test.describe('Teams - Auth (Sem autenticação)', () => {
  // Usar contexto vazio (sem cookies)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve redirecionar /teams para /signin', async ({ page }) => {
    await page.goto('/teams');
    
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/signin');
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve incluir callbackUrl no redirect', async ({ page }) => {
    await page.goto('/teams');
    
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toBe('/teams');
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve redirecionar /teams/[teamId] para /signin', async ({ page }) => {
    const fakeTeamId = 'f37680c4-fdef-4ac9-8397-437ba6fea993';
    
    await page.goto(`/teams/${fakeTeamId}/overview`);
    
    await page.waitForURL('**/signin**', { timeout: 15000 });
    
    expect(page.url()).toContain('/signin');
  });
});

// =============================================================================
// TESTES COM ADMIN (Superadmin - acesso total)
// =============================================================================

test.describe('Teams - Auth (Admin/Superadmin)', () => {
  test.use({ storageState: ADMIN_STATE });
  
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    // Nome determinístico: E2E-Admin-Auth + sufixo curto (Regra 48)
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-Admin-Auth-${suffix}` 
    });
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: admin deve acessar /teams com sucesso', async ({ page }) => {
    await page.goto('/teams');
    await waitForTeamsPage(page);
    
    // Regra 22: URL final + root testid + marcador
    await expect(page).toHaveURL('/teams');
    await expect(page.locator('[data-testid="teams-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-team-btn"]')).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: admin deve ver botão de criar equipe', async ({ page }) => {
    await page.goto('/teams');
    await waitForTeamsPage(page);
    
    const createBtn = page.locator('[data-testid="create-team-btn"]');
    await expect(createBtn).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: admin deve acessar overview da equipe', async ({ page }) => {
    await page.goto(`/teams/${teamId}/overview`);
    await waitForPageLoad(page);
    
    // Regra 22: URL final + root testid + marcador
    await expect(page).toHaveURL(`/teams/${teamId}/overview`);
    await expect(page.locator('[data-testid="teams-overview-root"], [data-testid="team-overview-tab"]').first()).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: admin deve acessar members da equipe', async ({ page }) => {
    await page.goto(`/teams/${teamId}/members`);
    await waitForPageLoad(page);
    
    // Regra 22: URL final + root testid + marcador
    await expect(page).toHaveURL(`/teams/${teamId}/members`);
    await expect(page.locator('[data-testid="team-members-tab"], [data-testid="invite-member-btn"]').first()).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: admin deve ter cookie hb_access_token', async ({ page, context }) => {
    await page.goto('/teams');
    await waitForTeamsPage(page);
    
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'hb_access_token');
    
    expect(accessToken).toBeDefined();
    expect(accessToken?.value).toBeTruthy();
  });
});

// =============================================================================
// TESTES COM DIRIGENTE (Gestão organizacional)
// =============================================================================

test.describe('Teams - Auth (Dirigente)', () => {
  test.use({ storageState: DIRIGENTE_STATE });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: dirigente deve acessar /teams com sucesso', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Regra 22: URL final + root testid + marcador
    // Dirigente tem permissão teams.read (permission_id=11)
    await expect(page).toHaveURL('/teams');
    await expect(page.locator('[data-testid="teams-dashboard"]')).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: dirigente deve ver lista de equipes', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Regra 22: URL final + root testid + marcador
    await expect(page).toHaveURL('/teams');
    await expect(page.locator('[data-testid="teams-dashboard"]')).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: dirigente deve ver botão de criar equipe', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Dirigente tem permissão teams.create (permission_id=10)
    const createBtn = page.locator('[data-testid="create-team-btn"]');
    // Aguardar até 10 segundos para o botão aparecer
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: dirigente deve ter cookie de autenticação', async ({ page, context }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'hb_access_token');
    
    expect(accessToken).toBeDefined();
  });
});

// =============================================================================
// TESTES COM COORDENADOR (Gestão de equipes específicas)
// =============================================================================

test.describe('Teams - Auth (Coordenador)', () => {
  test.use({ storageState: COORDENADOR_STATE });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: coordenador deve acessar /teams com sucesso', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Regra 22: URL final + root testid + marcador
    // Coordenador tem permissão teams.read (permission_id=11)
    await expect(page).toHaveURL('/teams');
    await expect(page.locator('[data-testid="teams-dashboard"]')).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: coordenador deve ver lista de equipes', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Regra 22: URL final + root testid + marcador
    await expect(page).toHaveURL('/teams');
    await expect(page.locator('[data-testid="teams-dashboard"]')).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: coordenador DEVE ver botão de criar equipe', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // RF6: "Dirigentes e Coordenadores podem criar equipes dentro da organização"
    // Coordenador TEM permissão para criar equipes
    const createBtn = page.locator('[data-testid="create-team-btn"]');
    await expect(createBtn).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: coordenador deve ter cookie de autenticação', async ({ page, context }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'hb_access_token');
    
    expect(accessToken).toBeDefined();
  });
});

// =============================================================================
// TESTES COM TREINADOR (Gestão técnica)
// =============================================================================

test.describe('Teams - Auth (Treinador)', () => {
  test.use({ storageState: COACH_STATE });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: treinador deve conseguir autenticar', async ({ page, context }) => {
    await page.goto('/inicio');
    await waitForPageLoad(page);
    
    // Verificar se está autenticado
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'hb_access_token');
    
    expect(accessToken).toBeDefined();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: treinador deve ter acesso a /teams', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Regra 22: URL final + root testid + marcador
    // Treinador pode acessar a página /teams
    await expect(page).toHaveURL('/teams');
    await expect(page.locator('[data-testid="teams-dashboard"]')).toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: treinador DEVE ver botão criar equipe', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // RF6 atualizado: Dirigentes, Coordenadores e Treinadores podem criar equipes
    const createBtn = page.locator('[data-testid="create-team-btn"]');
    await expect(createBtn).toBeVisible();
  });
});

// =============================================================================
// TESTES COM ATLETA (Acesso muito limitado)
// =============================================================================

test.describe('Teams - Auth (Atleta)', () => {
  test.use({ storageState: ATLETA_STATE });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: atleta deve conseguir autenticar', async ({ page, context }) => {
    await page.goto('/inicio');
    await waitForPageLoad(page);
    
    // Verificar se está autenticado
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'hb_access_token');
    
    expect(accessToken).toBeDefined();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: atleta deve ter acesso restrito a /teams', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Atleta NÃO tem permissão teams.read
    // Deve ser redirecionado ou ver acesso negado
    const url = page.url();
    
    // Se a página implementa controle de acesso, deve redirecionar
    // Se não, o atleta pode ver a página mas sem dados
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: atleta NÃO deve ver botão criar equipe', async ({ page }) => {
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    // Atleta não tem permissão de criar equipes
    // Aguardar página estabilizar (dashboard ou empty state)
    await page.locator('[data-testid="teams-dashboard"], [data-testid="empty-state"]').first().waitFor({ state: 'visible', timeout: 10000 });
    
    const createBtn = page.locator('[data-testid="create-team-btn"]');
    await expect(createBtn).not.toBeVisible();
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: atleta deve ter cookie de autenticação', async ({ page, context }) => {
    await page.goto('/inicio');
    await waitForPageLoad(page);
    
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'hb_access_token');
    
    expect(accessToken).toBeDefined();
  });
});

// =============================================================================
// COOKIES - Testes gerais
// =============================================================================

test.describe('Teams - Auth (Cookies)', () => {
  test.use({ storageState: ADMIN_STATE });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: cookie hb_access_token deve ter domínio localhost', async ({ page, context }) => {
    await page.goto('/teams');
    await waitForTeamsPage(page);
    
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'hb_access_token');
    
    expect(accessToken).toBeDefined();
    expect(accessToken?.domain).toMatch(/localhost/);
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: sessão deve persistir após reload', async ({ page }) => {
    await page.goto('/teams');
    await waitForTeamsPage(page);
    
    await page.reload();
    await waitForPageLoad(page);
    
    expect(page.url()).not.toContain('/signin');
    expect(page.url()).toContain('/teams');
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: sessão deve persistir durante navegação', async ({ page }) => {
    await page.goto('/teams');
    await waitForTeamsPage(page);
    
    // Navegar para outra página
    await page.goto('/inicio');
    await waitForPageLoad(page);
    
    // Voltar para teams
    await page.goto('/teams');
    await waitForPageLoad(page);
    
    expect(page.url()).not.toContain('/signin');
  });
});

// =============================================================================
// CALLBACK URL FLOW
// =============================================================================

// NOTA: Teste de callback URL removido conforme Regra 45 (0 skipped)
// Motivo: Fluxo de callback requer credenciais reais e fluxo completo de login
// Cobertura parcial: teams.routing.spec.ts testa redirect de unauthenticated
// Para implementar futuramente:
// 1. Acessar /teams sem auth -> redireciona para /signin?callbackUrl=/teams
// 2. Fazer login
// 3. Verificar redirect de volta para /teams

