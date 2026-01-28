/**
 * =============================================================================
 * SMOKE TESTS - TEAMS MODULE
 * =============================================================================
 *
 * PROPÓSITO: Validar os 5 fluxos mais críticos do módulo Teams.
 *
 * QUANDO EXECUTAR:
 * - Antes de QUALQUER deploy (local → staging → produção)
 * - Após mudanças críticas no código
 * - Como validação pós-deploy em staging/produção
 *
 * CRITÉRIO: TODOS os 5 testes DEVEM passar para liberar deploy.
 *
 * EXECUÇÃO:
 * npx playwright test tests/e2e/smoke-tests.spec.ts --project=chromium --workers=1 --retries=0
 */

import { test, expect } from '@playwright/test';
import { createTeamViaAPI, deleteTeamViaAPI } from './helpers/api';
import path from 'path';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');

test.describe('SMOKE TESTS - Teams Module', () => {
  test.use({ storageState: ADMIN_STATE });

  // ===========================================================================
  // TESTE CRÍTICO 1: Criar Equipe via UI
  // ===========================================================================
  test('CRÍTICO 1: Admin consegue criar equipe via UI', async ({ page, request }) => {
    await page.goto('/teams');

    // Aguardar dashboard carregar
    await page.locator('[data-testid="teams-dashboard"]').waitFor({ state: 'visible', timeout: 30000 });

    // Clicar em criar equipe
    await page.locator('[data-testid="create-team-btn"]').click();
    await expect(page.locator('[data-testid="create-team-modal"]')).toBeVisible();

    // Preencher formulário
    const teamName = `Smoke-Create-${Date.now().toString(16).slice(-6)}`;
    await page.locator('[data-testid="team-name-input"]').fill(teamName);
    await page.locator('[data-testid="team-category-select"]').selectOption('1');
    await page.locator('[data-testid="team-gender-select"]').selectOption('masculino');

    // Submeter
    await page.locator('[data-testid="create-team-submit"]').click();

    // Deve redirecionar para members com isNew=true
    await page.waitForURL(/\/teams\/[a-f0-9-]+\/members\?isNew=true/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/teams\/[a-f0-9-]+\/members/);

    // Cleanup: deletar equipe criada
    const url = page.url();
    const match = url.match(/\/teams\/([a-f0-9-]+)\/members/);
    if (match) {
      await deleteTeamViaAPI(request, match[1]).catch(() => {});
    }
  });

  // ===========================================================================
  // TESTE CRÍTICO 2: Equipe Criada Aparece na Lista
  // ===========================================================================
  test('CRÍTICO 2: Equipe criada aparece na lista', async ({ page, request }) => {
    const teamName = `Smoke-List-${Date.now().toString(16).slice(-6)}`;
    const teamId = await createTeamViaAPI(request, { name: teamName });

    try {
      await page.goto('/teams');
      await page.locator('[data-testid="teams-dashboard"]').waitFor({ state: 'visible', timeout: 30000 });

      // Equipe deve aparecer na lista
      const teamCard = page.locator(`[data-testid="team-card-${teamId}"]`);
      await expect(teamCard).toBeVisible({ timeout: 15000 });

      // Deve conter o nome
      await expect(teamCard).toContainText(teamName);
    } finally {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  // ===========================================================================
  // TESTE CRÍTICO 3: Convidar Membro
  // ===========================================================================
  test('CRÍTICO 3: Owner consegue convidar membro', async ({ page, request }) => {
    const teamName = `Smoke-Invite-${Date.now().toString(16).slice(-6)}`;
    const teamId = await createTeamViaAPI(request, { name: teamName });

    try {
      await page.goto(`/teams/${teamId}/members`);
      // Aguardar o conteúdo da aba carregar (não a aba de navegação)
      await page.locator('div[data-testid="team-members-tab"]').waitFor({ state: 'visible', timeout: 30000 });

      // Clicar em convidar
      await page.locator('[data-testid="invite-member-btn"]').click();
      await expect(page.locator('[data-testid="invite-member-modal"]')).toBeVisible();

      // Preencher email
      const testEmail = `smoke-${Date.now().toString(16).slice(-6)}@teste.com`;
      await page.locator('[data-testid="invite-email-input"]').fill(testEmail);

      // Aguardar botão estar habilitado
      const submitBtn = page.locator('[data-testid="invite-submit-btn"]');
      await expect(submitBtn).toBeEnabled({ timeout: 5000 });

      // Submeter
      await submitBtn.click();

      // Toast de sucesso deve aparecer
      await expect(page.locator('[data-testid="toast-success"], .sonner-success')).toBeVisible({ timeout: 10000 });
    } finally {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  // ===========================================================================
  // TESTE CRÍTICO 4: Atualizar Nome da Equipe
  // ===========================================================================
  test('CRÍTICO 4: Owner consegue atualizar nome da equipe', async ({ page, request }) => {
    const teamName = `Smoke-Update-${Date.now().toString(16).slice(-6)}`;
    const teamId = await createTeamViaAPI(request, { name: teamName });

    try {
      await page.goto(`/teams/${teamId}/settings`);
      await page.locator('[data-testid="teams-settings-root"]').waitFor({ state: 'visible', timeout: 30000 });

      // Atualizar nome
      const newName = `Smoke-Updated-${Date.now().toString(16).slice(-6)}`;
      const nameInput = page.locator('[data-testid="team-name-input"]');
      await nameInput.fill(newName);

      // Autosave é disparado no blur
      await nameInput.blur();

      // Toast de sucesso deve aparecer
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout: 10000 });

      // Reload e verificar persistência
      await page.reload();
      await page.locator('[data-testid="teams-settings-root"]').waitFor({ state: 'visible', timeout: 30000 });
      await expect(page.locator('[data-testid="team-name-input"]')).toHaveValue(newName);
    } finally {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  // ===========================================================================
  // TESTE CRÍTICO 5: Deletar Equipe
  // ===========================================================================
  test('CRÍTICO 5: Owner consegue deletar equipe', async ({ page, request }) => {
    const teamName = `Smoke-Delete-${Date.now().toString(16).slice(-6)}`;
    const teamId = await createTeamViaAPI(request, { name: teamName });

    await page.goto(`/teams/${teamId}/settings`);
    await page.locator('[data-testid="teams-settings-root"]').waitFor({ state: 'visible', timeout: 30000 });

    // Clicar em deletar
    await page.locator('[data-testid="delete-team-btn"]').click();

    // Modal de confirmação deve aparecer
    await expect(page.locator('[data-testid="confirm-delete-modal"]')).toBeVisible();

    // Digitar nome para confirmar
    await page.getByPlaceholder('Digite o nome da equipe').fill(teamName);

    // Confirmar deleção
    await page.locator('[data-testid="confirm-delete-btn"]').click();

    // Deve redirecionar para /teams
    await page.waitForURL('/teams', { timeout: 15000 });
    await expect(page).toHaveURL('/teams');

    // Verificar que equipe não aparece mais (ou aparece arquivada)
    const teamCard = page.locator(`[data-testid="team-card-${teamId}"]`);
    const isVisible = await teamCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      // Se visível, deve ter classe de arquivada (soft delete)
      await expect(teamCard).toHaveClass(/opacity-60/);
    }
    // Se não visível, está correto (filtrada da lista)
  });
});
