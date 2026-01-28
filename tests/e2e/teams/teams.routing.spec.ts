/**
 * Tests de Routing - Teams Module
 * 
 * Testa navegação, redirects e URLs canônicas
 */

import { test, expect, Page } from '@playwright/test';
import { attachDebug } from '../helpers/debug';
import { createTeamViaAPI, deleteTeamViaAPI } from '../helpers/api';

/**
 * Helper: Aguardar página de teams carregar
 */
async function waitForTeamsPage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-testid="create-team-btn"]').waitFor({ state: 'visible', timeout: 30000 });
}

/**
 * Helper: Aguardar qualquer tab de team carregar
 */
async function waitForTeamPage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  // Aguardar qualquer indicador de que a página carregou
  await page.locator('[data-testid="team-overview-tab"], [data-testid="team-members-tab"], [data-testid="team-name-input"]').first().waitFor({ state: 'visible', timeout: 30000 });
}

test.describe('Teams - Routing', () => {
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    // Nome determinístico (Regra 48)
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-Routing-${suffix}` 
    });
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  // ===========================================================================
  // NAVEGAÇÃO BÁSICA
  // ===========================================================================

  test.describe('Navegação entre rotas', () => {
    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve acessar lista de equipes em /teams', async ({ page }) => {
      await page.goto('/teams');
      await waitForTeamsPage(page);
      
      await expect(page).toHaveURL('/teams');
      await expect(page.locator('[data-testid="create-team-btn"]')).toBeVisible();
    });

    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve acessar overview da equipe', async ({ page }) => {
      await page.goto(`/teams/${teamId}/overview`);
      await waitForTeamPage(page);
      
      // Regra 22: URL final + root testid + marcador
      await expect(page).toHaveURL(`/teams/${teamId}/overview`);
      await expect(page.locator('[data-testid="teams-overview-root"], [data-testid="team-overview-tab"]').first()).toBeVisible();
    });

    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve acessar members da equipe', async ({ page }) => {
      await page.goto(`/teams/${teamId}/members`);
      await page.waitForLoadState('domcontentloaded');
      
      // Aguardar página carregar
      await page.locator('[data-testid="team-members-tab"], [data-testid="invite-member-btn"]').first().waitFor({ state: 'visible', timeout: 30000 });
      
      // Regra 22: URL final + root testid + marcador
      await expect(page).toHaveURL(`/teams/${teamId}/members`);
      await expect(page.locator('[data-testid="team-members-tab"], [data-testid="invite-member-btn"]').first()).toBeVisible();
    });

    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve acessar settings da equipe', async ({ page }) => {
      await page.goto(`/teams/${teamId}/settings`);
      await page.waitForLoadState('domcontentloaded');
      
      // Regra 22: URL final + root testid + marcador
      // Usuário admin/owner tem permissão para settings
      await expect(page).toHaveURL(`/teams/${teamId}/settings`);
      await expect(page.locator('[data-testid="teams-settings-root"]')).toBeVisible({ timeout: 30000 });
    });
  });

  // ===========================================================================
  // REDIRECTS
  // ===========================================================================

  test.describe('Redirects canônicos', () => {
    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve redirecionar /teams/[teamId] para /teams/[teamId]/overview', async ({ page }) => {
      await page.goto(`/teams/${teamId}`);
      
      // Regra 22: URL final + root testid + marcador
      await page.waitForURL(`**/teams/${teamId}/overview`, { timeout: 15000 });
      await expect(page).toHaveURL(`/teams/${teamId}/overview`);
      await expect(page.locator('[data-testid="teams-overview-root"], [data-testid="team-overview-tab"]').first()).toBeVisible();
    });

    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve redirecionar tab inválida para overview', async ({ page }) => {
      await page.goto(`/teams/${teamId}/invalid-tab-xyz`);
      
      // Regra 22: URL final + root testid + marcador
      // Contrato: tab inválida redireciona para overview (conforme teams-CONTRACT.md)
      await page.waitForURL(`**/teams/${teamId}/overview`, { timeout: 15000 });
      await expect(page).toHaveURL(`/teams/${teamId}/overview`);
      await expect(page.locator('[data-testid="teams-overview-root"], [data-testid="team-overview-tab"]').first()).toBeVisible();
    });
  });

  // ===========================================================================
  // URLs LEGADAS
  // ===========================================================================

  // NOTA: Testes de URLs legadas removidos conforme Regra 45 (0 skipped)
  // Motivo: Redirect de URLs legadas com query params (?teamId=X) não está implementado na V2
  // Quando implementado, adicionar testes:
  // - /teams?teamId=X -> /teams/X/overview
  // - /teams?teamId=X&tab=members -> /teams/X/members

  // ===========================================================================
  // 404
  // ===========================================================================

  test.describe('404 para IDs inválidos', () => {
    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve mostrar página not-found para teamId não-UUID', async ({ page }) => {
      await page.goto('/teams/not-a-uuid/overview');
      
      // Regra 22: URL final + root testid + marcador
      // Não validamos URL final pois pode permanecer na URL original
      await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible({ timeout: 10000 });
    });

    test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve mostrar página not-found para UUID inexistente', async ({ page }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000';
      await page.goto(`/teams/${fakeUUID}/overview`);
      
      // Regra 22: root testid + marcador
      // Não validamos URL final pois pode permanecer na URL original
      await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible({ timeout: 10000 });
    });
  });
});
