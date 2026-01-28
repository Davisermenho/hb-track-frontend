/**
 * Training Planning E2E - PASSO 4.1.2
 *
 * TC-E3: Planejamento carrega com equipe selecionada
 * TC-F1: Rascunho do ciclo persiste no localStorage
 */

import { test, expect, Page } from '@playwright/test';
import { setupAuth } from './helpers/auth.helpers';
import { expectHidden, expectUrlContains, expectVisible } from './helpers/assertion.helpers';

const TEAM_NAME = 'E2E-Juvenil-Masculino-01';

test.describe('Training Planning - PASSO 4.1.2', () => {
  test.use({ storageState: setupAuth('coordenador') });

  test('TC-E3: planejamento carrega com equipe selecionada', async ({ page }) => {
    await navigateToPlanning(page);
    await selectTeam(page, TEAM_NAME);

    const noTeamState = page.locator('text=/Selecione uma equipe/i');
    await expectHidden(noTeamState);

    const emptyOrCycles = page
      .locator('text=/Nenhum ciclo criado/i')
      .or(page.locator('text=/Macrociclo|Mesociclo/i'));
    await expectVisible(emptyOrCycles);
  });

  test('TC-F1: rascunho do ciclo persiste no localStorage', async ({ page }) => {
    const cycleName = `E2E Cycle ${Date.now()}`;

    await navigateToPlanning(page);
    await selectTeam(page, TEAM_NAME);

    const createButton = page.getByRole('button', { name: /novo ciclo/i });
    await expectVisible(createButton);
    await createButton.click();

    const wizard = page.getByTestId('create-cycle-wizard');
    await expectVisible(wizard);

    await wizard.getByTestId('cycle-type-macro').click();
    await wizard.getByTestId('cycle-next').click();

    await wizard.getByTestId('cycle-name-input').fill(cycleName);
    await wizard.getByTestId('cycle-objective-input').fill('Objetivo E2E');
    await wizard.getByTestId('cycle-next').click();

    const { startDate, endDate } = getDateRange(0, 30);
    await wizard.getByTestId('cycle-start-date').fill(startDate);
    await wizard.getByTestId('cycle-end-date').fill(endDate);

    await page.waitForTimeout(700);

    const draft = await page.evaluate(() => localStorage.getItem('cycle-draft'));
    expect(draft).toBeTruthy();
    if (draft) {
      const parsed = JSON.parse(draft);
      expect(parsed.name).toBe(cycleName);
    }

    await page.evaluate(() => localStorage.removeItem('cycle-draft'));
  });
});

async function navigateToPlanning(page: Page) {
  await page.goto('/training/planejamento');
  await expectUrlContains(page, '/training/planejamento');
  await page.waitForLoadState('networkidle');
}

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

function getDateRange(startOffsetDays: number, durationDays: number): {
  startDate: string;
  endDate: string;
} {
  const start = new Date();
  start.setDate(start.getDate() + startOffsetDays);
  const end = new Date(start);
  end.setDate(start.getDate() + durationDays);
  return {
    startDate: toDateInput(start),
    endDate: toDateInput(end),
  };
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
