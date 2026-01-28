/**
 * Assertion Helpers - Training Module E2E Tests
 * 
 * Helpers núcleo para asserções genéricas sem lógica de negócio.
 * 
 * PRINCÍPIOS:
 * - Genéricos e reutilizáveis
 * - Sem regras de negócio (ex: sem thresholds de wellness)
 * - Baixo acoplamento
 * - Alto sinal de qualidade
 * - Mensagens de erro claras
 */

import { expect, Page, Locator } from '@playwright/test';

/**
 * Aguarda elemento estar visível com timeout customizável.
 * 
 * USO:
 *   await expectVisible(page.locator('[data-testid="btn-save"]'));
 * 
 * @param locator - Locator do elemento
 * @param timeout - Timeout em ms (padrão: 5000)
 */
export async function expectVisible(
  locator: Locator,
  timeout: number = 5000
): Promise<void> {
  await expect(locator).toBeVisible({ timeout });
}

/**
 * Aguarda elemento estar oculto com timeout customizável.
 * 
 * @param locator - Locator do elemento
 * @param timeout - Timeout em ms (padrão: 5000)
 */
export async function expectHidden(
  locator: Locator,
  timeout: number = 5000
): Promise<void> {
  await expect(locator).toBeHidden({ timeout });
}

/**
 * Valida texto de elemento.
 * 
 * USO:
 *   await expectText(page.locator('h1'), 'Bem-vindo');
 * 
 * @param locator - Locator do elemento
 * @param expectedText - Texto esperado (exact match)
 */
export async function expectText(
  locator: Locator,
  expectedText: string
): Promise<void> {
  await expect(locator).toHaveText(expectedText);
}

/**
 * Valida texto contém substring.
 * 
 * USO:
 *   await expectContainsText(page.locator('.toast'), 'sucesso');
 * 
 * @param locator - Locator do elemento
 * @param substring - Substring esperada
 */
export async function expectContainsText(
  locator: Locator,
  substring: string
): Promise<void> {
  await expect(locator).toContainText(substring);
}

/**
 * Valida contagem de elementos.
 * 
 * USO:
 *   await expectCount(page.locator('[data-testid="template-card"]'), 4);
 * 
 * @param locator - Locator dos elementos
 * @param expectedCount - Contagem esperada
 */
export async function expectCount(
  locator: Locator,
  expectedCount: number
): Promise<void> {
  await expect(locator).toHaveCount(expectedCount);
}

/**
 * Valida URL atual.
 * 
 * USO:
 *   await expectUrl(page, '/training/agenda');
 * 
 * @param page - Playwright Page
 * @param expectedUrl - URL esperada (exact match)
 */
export async function expectUrl(
  page: Page,
  expectedUrl: string
): Promise<void> {
  await expect(page).toHaveURL(expectedUrl);
}

/**
 * Valida URL contém pathname.
 * 
 * USO:
 *   await expectUrlContains(page, '/training');
 * 
 * @param page - Playwright Page
 * @param pathname - Pathname esperado
 */
export async function expectUrlContains(
  page: Page,
  pathname: string
): Promise<void> {
  await expect(page).toHaveURL(new RegExp(pathname));
}

/**
 * Valida atributo de elemento.
 * 
 * USO:
 *   await expectAttribute(input, 'disabled', '');
 * 
 * @param locator - Locator do elemento
 * @param attribute - Nome do atributo
 * @param expectedValue - Valor esperado
 */
export async function expectAttribute(
  locator: Locator,
  attribute: string,
  expectedValue: string
): Promise<void> {
  await expect(locator).toHaveAttribute(attribute, expectedValue);
}

/**
 * Valida classe CSS de elemento.
 * 
 * USO:
 *   await expectClass(button, /bg-emerald-600/);
 * 
 * @param locator - Locator do elemento
 * @param className - Nome da classe (string ou regex)
 */
export async function expectClass(
  locator: Locator,
  className: string | RegExp
): Promise<void> {
  await expect(locator).toHaveClass(className);
}

/**
 * Aguarda network idle (útil após navegação).
 * 
 * USO:
 *   await expectNetworkIdle(page);
 * 
 * @param page - Playwright Page
 * @param timeout - Timeout em ms (padrão: 5000)
 */
export async function expectNetworkIdle(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Valida resposta de API.
 * 
 * USO:
 *   const response = await page.waitForResponse(r => r.url().includes('/api/templates'));
 *   await expectApiSuccess(response);
 * 
 * @param response - Response da API
 */
export async function expectApiSuccess(response: any): Promise<void> {
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
}

/**
 * Valida erro de API.
 * 
 * USO:
 *   const response = await page.waitForResponse(r => r.url().includes('/api/templates'));
 *   await expectApiError(response, 404);
 * 
 * @param response - Response da API
 * @param expectedStatus - Status code esperado (opcional)
 */
export async function expectApiError(
  response: any,
  expectedStatus?: number
): Promise<void> {
  expect(response.ok()).toBeFalsy();
  if (expectedStatus) {
    expect(response.status()).toBe(expectedStatus);
  }
}

/**
 * Aguarda elemento com data-testid.
 * 
 * USO:
 *   await expectTestId(page, 'btn-save');
 * 
 * @param page - Playwright Page
 * @param testId - Valor do data-testid
 * @param timeout - Timeout em ms (padrão: 5000)
 */
export async function expectTestId(
  page: Page,
  testId: string,
  timeout: number = 5000
): Promise<Locator> {
  const locator = page.locator(`[data-testid="${testId}"]`);
  await expect(locator).toBeVisible({ timeout });
  return locator;
}

/**
 * Valida localStorage value.
 * 
 * USO:
 *   await expectLocalStorage(page, 'selectedTeam', teamId);
 * 
 * @param page - Playwright Page
 * @param key - Chave do localStorage
 * @param expectedValue - Valor esperado (string)
 */
export async function expectLocalStorage(
  page: Page,
  key: string,
  expectedValue: string
): Promise<void> {
  const value = await page.evaluate((k) => localStorage.getItem(k), key);
  expect(value).toBe(expectedValue);
}

/**
 * Aguarda toast/notification aparecer.
 * 
 * USO:
 *   await expectToast(page, 'Template criado com sucesso');
 * 
 * @param page - Playwright Page
 * @param message - Mensagem esperada (substring)
 * @param timeout - Timeout em ms (padrão: 3000)
 */
export async function expectToast(
  page: Page,
  message: string,
  timeout: number = 3000
): Promise<void> {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: message });
  await expect(toast).toBeVisible({ timeout });
}
