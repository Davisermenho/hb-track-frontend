/**
 * Training Sessions E2E - PASSO 4.1.1
 * 
 * SUB-PASSO 4.1.1: Persistência Básica (5 testes)
 * - TC-E1: Create session + reload (contrato persistência criação)
 * - TC-E2: Delete session + reload (contrato remoção definitiva)
 * - TC-E3: Edit session + reload (contrato persistência edição)
 * - TC-E4: Duplicate session + reload (contrato criação duplicada)
 * - TC-E5: Drag & drop move + reload (contrato persistência mudança de dia)
 * 
 * PRINCÍPIOS APLICADOS:
 * - Reload obrigatório (detector de mentira)
 * - Cada teste autônomo (cria próprios dados)
 * - Nenhum seletor por índice
 * - Helpers reutilizados
 * - OPÇÃO OURO (semantic selectors, scoped dialogs)
 */

import { test, expect, Page } from '@playwright/test';
import { setupAuth } from './helpers/auth.helpers';
import { 
  expectVisible, 
  expectUrl 
} from './helpers/assertion.helpers';

test.describe('Training Sessions - PASSO 4.1.1', () => {
  test.use({ storageState: setupAuth('coach') });

  const TEAM_NAME = 'E2E-Juvenil-Masculino-01';

  // =============================
  // TC-E1: Create Session + Reload
  // =============================
  test('TC-E1: criar sessão persiste após reload', async ({ page }) => {
    const sessionName = `E2E Session ${Date.now()}`;

    // 1. Navegar para Agenda
    await navigateToAgenda(page);
    await selectTeam(page, TEAM_NAME);
    await page.waitForLoadState('networkidle');

    // 2. Abrir modal de criação
    await openCreateSessionModal(page);

    // 3. Preencher e submeter
    await fillAndSubmitCreateSession(page, {
      date: getTodayDate(),
      time: '09:00',
      sessionType: 'quadra',
      mainObjective: sessionName,
      duration: 90,
    });

    // 4. Validar presença ANTES do reload
    const sessionCard = await findSessionCardByObjective(page, sessionName);
    await expectVisible(sessionCard);

    // 5. RELOAD (detector de mentira)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 6. Validar presença APÓS reload (backend persistiu)
    const sessionCardAfterReload = await findSessionCardByObjective(page, sessionName);
    await expectVisible(sessionCardAfterReload);
  });

  // =============================
  // TC-E2: Delete Session + Reload
  // =============================
  test('TC-E2: remover sessão não reaparece após reload', async ({ page }) => {
    const sessionName = `E2E Delete ${Date.now()}`;

    // 1. Navegar para Agenda
    await navigateToAgenda(page);
    await selectTeam(page, TEAM_NAME);

    // 2. Criar sessão (teste autônomo)
    await openCreateSessionModal(page);
    await fillAndSubmitCreateSession(page, {
      date: getTodayDate(),
      time: '10:00',
      sessionType: 'quadra',
      mainObjective: sessionName,
      duration: 90,
    });

    // 3. Validar presença
    const sessionCard = await findSessionCardByObjective(page, sessionName);
    await expectVisible(sessionCard);

    // 4. Deletar sessão
    await deleteSessionFromCard(page, sessionName);

    // 5. Validar ausência ANTES do reload
    expect(await page.locator('[data-testid^="session-card-"]').filter({ hasText: sessionName }).count()).toBe(0);

    // 6. RELOAD (detector de mentira)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 7. Validar ausência APÓS reload (backend removeu)
    expect(await page.locator('[data-testid^="session-card-"]').filter({ hasText: sessionName }).count()).toBe(0);
  });

  // =============================
  // TC-E3: Edit Session + Reload
  // =============================
  test('TC-E3: editar sessão persiste após reload', async ({ page }) => {
    const originalName = `E2E Edit ${Date.now()}`;
    const editedName = `E2E Edited ${Date.now()}`;

    await navigateToAgenda(page);
    await selectTeam(page, TEAM_NAME);

    await openCreateSessionModal(page);
    await fillAndSubmitCreateSession(page, {
      date: getTodayDate(),
      time: '11:00',
      sessionType: 'quadra',
      mainObjective: originalName,
      duration: 90,
    });

    const originalCard = await findSessionCardByObjective(page, originalName);
    await expectVisible(originalCard);

    await editSessionObjective(page, originalName, editedName);

    const editedCard = await findSessionCardByObjective(page, editedName);
    await expectVisible(editedCard);
    expect(await page.locator('[data-testid^="session-card-"]').filter({ hasText: originalName }).count()).toBe(0);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const editedAfterReload = await findSessionCardByObjective(page, editedName);
    await expectVisible(editedAfterReload);
    expect(await page.locator('[data-testid^="session-card-"]').filter({ hasText: originalName }).count()).toBe(0);
  });

  // =============================
  // TC-E4: Duplicate Session + Reload
  // =============================
  test('TC-E4: duplicar sessão cria nova instância após reload', async ({ page }) => {
    const baseName = `E2E Duplicate ${Date.now()}`;

    await navigateToAgenda(page);
    await selectTeam(page, TEAM_NAME);

    await openCreateSessionModal(page);
    await fillAndSubmitCreateSession(page, {
      date: getTodayDate(),
      time: '12:00',
      sessionType: 'quadra',
      mainObjective: baseName,
      duration: 90,
    });

    const initialCard = await findSessionCardByObjective(page, baseName);
    await expectVisible(initialCard);
    expect(await page.locator('[data-testid^="session-card-"]').filter({ hasText: baseName }).count()).toBe(1);

    await duplicateSessionFromCard(page, baseName);

    await page.waitForLoadState('networkidle');
    expect(await page.locator('[data-testid^="session-card-"]').filter({ hasText: baseName }).count()).toBe(2);

    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(await page.locator('[data-testid^="session-card-"]').filter({ hasText: baseName }).count()).toBe(2);
  });

  // =============================
  // TC-E5: Drag & Drop Move + Reload
  // =============================
  test('TC-E5: drag & drop move sessão de dia após reload', async ({ page }) => {
    const sessionName = `E2E Move ${Date.now()}`;
    const today = getTodayDate();
    const targetDate = getAdjacentDateWithinWeek();

    await navigateToAgenda(page);
    await selectTeam(page, TEAM_NAME);

    await openCreateSessionModal(page);
    await fillAndSubmitCreateSession(page, {
      date: today,
      time: '13:00',
      sessionType: 'quadra',
      mainObjective: sessionName,
      duration: 90,
    });

    const sourceDay = page.getByTestId(`weekly-day-${today}`);
    const targetDay = page.getByTestId(`weekly-day-${targetDate}`);
    await expectVisible(sourceDay);
    await expectVisible(targetDay);

    const sourceCard = sourceDay.locator('[data-testid^="session-card-"]').filter({ hasText: sessionName });
    await expectVisible(sourceCard);

    await sourceCard.dragTo(targetDay);
    await page.waitForLoadState('networkidle');

    const movedCard = targetDay.locator('[data-testid^="session-card-"]').filter({ hasText: sessionName });
    await expectVisible(movedCard);
    expect(await sourceDay.locator('[data-testid^="session-card-"]').filter({ hasText: sessionName }).count()).toBe(0);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const movedAfterReload = page.getByTestId(`weekly-day-${targetDate}`)
      .locator('[data-testid^="session-card-"]')
      .filter({ hasText: sessionName });
    await expectVisible(movedAfterReload);
    expect(await page.getByTestId(`weekly-day-${today}`).locator('[data-testid^="session-card-"]').filter({ hasText: sessionName }).count()).toBe(0);
  });
});

// ============================================
// HELPERS LOCAIS (Business Logic - Sessions)
// ============================================

/**
 * Navega para aba Agenda + estabilização
 */
async function navigateToAgenda(page: Page) {
  await page.goto('/training/agenda');
  await page.waitForLoadState('networkidle');
  await expectUrl(page, /\/training\/agenda$/);
}

/**
 * Abre modal de criação de sessão
 */
async function openCreateSessionModal(page: Page) {
  // Botão "Novo Treino" no header
  const createButton = page.getByRole('button', { name: /novo treino/i });
  await createButton.click();

  // Aguardar modal aparecer
  const modal = page.locator('[data-testid="create-session-modal"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Seleciona uma equipe no header antes de criar sessão.
 */
async function selectTeam(page: Page, teamName: string) {
  const selectorButton = page.getByTestId('training-team-selector');
  await expectVisible(selectorButton);

  const currentLabel = await selectorButton.textContent();
  if (currentLabel && currentLabel.toLowerCase().includes(teamName.toLowerCase())) {
    return;
  }

  await selectorButton.click();

  const dropdown = page.getByTestId('training-team-dropdown');
  await expectVisible(dropdown);

  const teamOption = dropdown.getByRole('button', { name: new RegExp(teamName, 'i') });
  await expectVisible(teamOption);
  await teamOption.click();

  await expect(selectorButton).toContainText(teamName);
  await page.waitForLoadState('networkidle');
}

/**
 * Preenche e submete formulário de criação
 */
async function fillAndSubmitCreateSession(
  page: Page, 
  data: {
    date: string;
    time: string;
    sessionType: string;
    mainObjective: string;
    duration: number;
  }
) {
  const modal = page.locator('[data-testid="create-session-modal"]');

  // Data
  const dateInput = modal.getByTestId('session-date-input');
  await dateInput.fill(data.date);

  // Hora
  const timeInput = modal.getByTestId('session-time-input');
  await timeInput.fill(data.time);

  // Tipo de treino
  const typeButton = modal.getByTestId(`session-type-${data.sessionType}`);
  await typeButton.click();

  // Objetivo principal
  const objectiveInput = modal.getByTestId('session-objective-input');
  await objectiveInput.fill(data.mainObjective);

  // Duração (se visível)
  const durationInput = modal.getByTestId('session-duration-input');
  await durationInput.fill(String(data.duration));

  // Submeter
  const submitButton = modal.getByTestId('submit-session');
  await submitButton.click();

  // Aguardar modal fechar
  await modal.waitFor({ state: 'detached', timeout: 10000 });
}

/**
 * Encontra card de sessão por objetivo (nome único)
 */
async function findSessionCardByObjective(page: Page, objective: string) {
  // Localizar card que contém o objetivo
  const card = page.locator('[data-testid^="session-card-"]').filter({ hasText: objective });
  return card;
}

/**
 * Deleta sessão via menu de ações
 */
async function deleteSessionFromCard(page: Page, objective: string) {
  const card = await findSessionCardByObjective(page, objective);
  await expectVisible(card);

  // 1. Abrir modal de sessão
  await card.click();
  const sessionModal = page.getByTestId('session-modal');
  await expectVisible(sessionModal);

  // 2. Iniciar deleção no modal
  const deleteButton = sessionModal.getByTestId('session-delete-button');
  await deleteButton.click();

  // 3. Confirmar no modal
  const confirmInModal = sessionModal.getByTestId('session-delete-confirm');
  await confirmInModal.click();

  // 4. Confirmar deleção permanente no AlertDialog
  const dialog = page.locator('[role="alertdialog"]');
  await dialog.waitFor({ state: 'visible' });
  const confirmButton = dialog.getByRole('button', { name: /deletar permanentemente/i });
  await confirmButton.click();

  // 5. Aguardar dialog fechar
  await dialog.waitFor({ state: 'detached' });
}

/**
 * Edita objetivo da sessão via modal de edição.
 */
async function editSessionObjective(page: Page, originalObjective: string, newObjective: string) {
  const card = await findSessionCardByObjective(page, originalObjective);
  await expectVisible(card);

  await card.click();
  const sessionModal = page.getByTestId('session-modal');
  await expectVisible(sessionModal);

  const editButton = sessionModal.getByTestId('session-edit-button');
  await editButton.click();

  const editModal = page.getByTestId('edit-session-modal');
  await expectVisible(editModal);

  const objectiveInput = editModal.getByTestId('edit-session-objective');
  await objectiveInput.fill(newObjective);

  const submitButton = editModal.getByTestId('edit-session-submit');
  await submitButton.click();

  await editModal.waitFor({ state: 'detached', timeout: 10000 });
}

/**
 * Duplica sessão via modal de detalhes.
 */
async function duplicateSessionFromCard(page: Page, objective: string) {
  const card = await findSessionCardByObjective(page, objective);
  await expectVisible(card);

  await card.click();
  const sessionModal = page.getByTestId('session-modal');
  await expectVisible(sessionModal);

  const duplicateButton = sessionModal.getByTestId('session-duplicate-button');
  await duplicateButton.click();

  await sessionModal.waitFor({ state: 'detached' });
}

/**
 * Retorna próxima segunda-feira no formato YYYY-MM-DD
 */
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna um dia adjacente dentro da semana atual para drag & drop.
 */
function getAdjacentDateWithinWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const offset = day === 0 ? -1 : 1;
  const target = new Date(today);
  target.setDate(today.getDate() + offset);
  return toDateInput(target);
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
