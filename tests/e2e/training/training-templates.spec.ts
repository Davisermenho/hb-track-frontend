/**
 * =============================================================================
 * TRAINING TEMPLATES - PERSISTENCE CONTRACTS E2E TESTS
 * =============================================================================
 *
 * 3 Test Cases cobrindo contratos reais de persistência:
 * - TC-B1: Criar template persiste após reload
 * - TC-B2: Editar template persiste mutação após reload
 * - TC-B3: Remover template não reaparece após reload
 *
 * PRINCÍPIOS:
 * - Regra 0: reload() é obrigatório (detector de mentira)
 * - Regra 1: Localizar por nome criado (não ordem implícita)
 * - Regra 2: 1 teste = 1 contrato, sem dependências
 *
 * EXECUÇÃO:
 * npx playwright test tests/e2e/training/training-templates.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth.helpers';
import { expectUrl, expectVisible, expectHidden } from './helpers/assertion.helpers';

// =============================================================================
// HELPERS LOCAIS (lógica de template-specific)
// =============================================================================

/**
 * Navega para página de configurações e aguarda estabilização
 */
async function navigateToConfiguracoes(page: any) {
  await page.goto('/training/configuracoes');
  await expectUrl(page, /\/training\/configuracoes/);
  await page.waitForLoadState('networkidle');
}

/**
 * Abre modal de criação via botão (contrato UI real)
 */
async function openCreateModal(page: any) {
  const createButton = page.getByRole('button', { name: /criar template/i });
  await expectVisible(createButton);
  await createButton.click();
  await expectVisible(page.getByTestId('create-template-modal'));
}

/**
 * Preenche e submete modal de criação
 */
async function fillAndSubmitCreateModal(page: any, name: string) {
  const modal = page.getByTestId('create-template-modal');
  await expectVisible(modal);

  // Preencher nome
  const nameInput = modal.getByTestId('template-name-input');
  await nameInput.fill(name);

  // Submit
  const submitButton = modal.getByTestId('submit-template-button');
  await submitButton.click();

  // Aguardar modal fechar
  await expectHidden(modal);
  await page.waitForLoadState('networkidle');
}

/**
 * Localiza row de template por nome (contrato: nome é único)
 */
async function findTemplateRowByName(page: any, name: string) {
  // Aguardar table ou empty state aparecer
  await page.locator('table, .text-center:has-text("Nenhum template")').first().waitFor({ timeout: 10000 });
  
  // Localizar tr que contenha o nome exato na célula de nome
  const row = page.locator('tr').filter({ hasText: name });
  return row;
}

/**
 * Abre modal de edição via menu dropdown do row (OPÇÃO OURO: aria-haspopup)
 */
async function openEditModalFromRow(page: any, templateName: string) {
  const row = await findTemplateRowByName(page, templateName);
  await expectVisible(row);

  // 1. Abrir menu (botão com aria-haspopup="true")
  const actionsButton = row.locator('button[aria-haspopup="true"]');
  await actionsButton.click();

  // 2. Contrato: menu existe (aguardar opção "Editar" aparecer)
  const editButton = page.getByRole('button', { name: /editar/i });
  await editButton.waitFor({ state: 'visible', timeout: 5000 });

  // 3. Contrato: ação "Editar" funciona
  await editButton.click();

  // Aguardar modal abrir
  await expectVisible(page.getByTestId('edit-template-modal'));
}

/**
 * Preenche e submete modal de edição
 */
async function fillAndSubmitEditModal(page: any, newName: string) {
  const modal = page.getByTestId('edit-template-modal');
  await expectVisible(modal);

  // Limpar e preencher novo nome
  const nameInput = modal.getByTestId('template-name-input');
  await nameInput.clear();
  await nameInput.fill(newName);

  // Submit
  const submitButton = modal.getByTestId('submit-template-button');
  await submitButton.click();

  // Aguardar modal fechar
  await expectHidden(modal);
  await page.waitForLoadState('networkidle');
}

/**
 * Remove template via menu dropdown do row (OPÇÃO OURO: escopo correto)
 */
async function deleteTemplateFromRow(page: any, templateName: string) {
  const row = await findTemplateRowByName(page, templateName);
  await expectVisible(row);

  // 1. Abrir menu de ações da row (aria-haspopup="true")
  const actionsButton = row.locator('button[aria-haspopup="true"]');
  await actionsButton.click();

  // 2. Aguardar dropdown aparecer e clicar "Deletar" NO MENU
  // (escopo: não captura botão do modal com mesmo texto)
  await page.waitForSelector('text=/Editar|Duplicar|Deletar/i', { state: 'visible' });
  
  // Localizar botão "Deletar" que está visível (no dropdown aberto)
  const deleteButtons = page.getByRole('button', { name: /deletar/i });
  const deleteInMenu = deleteButtons.first(); // Primeiro é do menu, segundo seria do modal
  await deleteInMenu.click();

  // 3. Confirmar no AlertDialog (Radix UI: role="alertdialog")
  // Aguardar modal aparecer
  const dialog = page.locator('[role="alertdialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });

  // Clicar no botão de confirmação DENTRO DO DIALOG
  const confirmButton = dialog.getByRole('button', { name: /deletar|confirmar/i });
  await confirmButton.click();

  // 4. Sincronização: aguardar dialog desaparecer
  await dialog.waitFor({ state: 'detached', timeout: 5000 });
}

// =============================================================================
// TESTES - PERSISTENCE CONTRACTS
// =============================================================================

// =============================================================================
// TESTES - PERSISTENCE CONTRACTS
// =============================================================================

test.describe('Training Templates - Persistence Contracts', () => {
  const authState = setupAuth('coordenador');
  test.use({ storageState: authState });

  test('TC-B1: criar template persiste após reload', async ({ page }) => {
    const templateName = `E2E Create ${Date.now()}`;

    // 1. Navegar
    await navigateToConfiguracoes(page);

    // 2. Criar template
    await openCreateModal(page);
    await fillAndSubmitCreateModal(page, templateName);

    // 3. Validar presença (primeira vez)
    const row = await findTemplateRowByName(page, templateName);
    await expectVisible(row);

    // 4. RELOAD (detector de mentira)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 5. Validar presença (após reload) - CONTRATO REAL
    const rowAfterReload = await findTemplateRowByName(page, templateName);
    await expectVisible(rowAfterReload);

    // ✅ Se chegou aqui: backend salvou + frontend re-hidratou corretamente
  });

  test('TC-B2: editar template persiste mutação após reload', async ({ page }) => {
    const originalName = `E2E Edit Original ${Date.now()}`;
    const editedName = `E2E Edit Modified ${Date.now()}`;

    // 1. Navegar
    await navigateToConfiguracoes(page);

    // 2. Criar template (dentro do próprio teste - sem dependência)
    await openCreateModal(page);
    await fillAndSubmitCreateModal(page, originalName);

    // 3. Editar para novo nome
    await openEditModalFromRow(page, originalName);
    await fillAndSubmitEditModal(page, editedName);

    // 4. Validar mutação (primeira vez)
    const editedRow = await findTemplateRowByName(page, editedName);
    await expectVisible(editedRow);

    // Validar que nome antigo não existe mais
    const originalRowCount = await page.locator('tr').filter({ hasText: originalName }).count();
    expect(originalRowCount).toBe(0);

    // 5. RELOAD (detector de mentira)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 6. Validar mutação persistiu (após reload) - CONTRATO REAL
    const editedRowAfterReload = await findTemplateRowByName(page, editedName);
    await expectVisible(editedRowAfterReload);

    // Confirmar que nome antigo NÃO reapareceu
    const originalRowCountAfterReload = await page.locator('tr').filter({ hasText: originalName }).count();
    expect(originalRowCountAfterReload).toBe(0);

    // ✅ Se chegou aqui: mutação foi persistida, não apenas UI update
  });

  test('TC-B3: remover template não reaparece após reload', async ({ page }) => {
    const templateName = `E2E Delete ${Date.now()}`;

    // 1. Navegar
    await navigateToConfiguracoes(page);

    // 2. Criar template (dentro do próprio teste)
    await openCreateModal(page);
    await fillAndSubmitCreateModal(page, templateName);

    // 3. Validar presença
    const row = await findTemplateRowByName(page, templateName);
    await expectVisible(row);

    // 4. Remover
    await deleteTemplateFromRow(page, templateName);

    // 5. Validar ausência (primeira vez)
    const rowCountAfterDelete = await page.locator('tr').filter({ hasText: templateName }).count();
    expect(rowCountAfterDelete).toBe(0);

    // 6. RELOAD (detector de mentira)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 7. Validar ausência (após reload) - CONTRATO REAL
    const rowCountAfterReload = await page.locator('tr').filter({ hasText: templateName }).count();
    expect(rowCountAfterReload).toBe(0);

    // ✅ Se chegou aqui: remoção foi definitiva, não apenas soft delete UI
  });
});
