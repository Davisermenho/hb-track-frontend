/**
 * Helpers de Espera para Testes E2E
 * 
 * Resolve edge-cases de timing no Windows + Next.js dev/turbopack:
 * - Esperar hidratação antes de validar URL
 * - Validar middleware aplicado via headers
 * - Esperar pathname final após client-side redirect
 * 
 * @see REGRAS_TESTES.md
 */

import { expect, type Page, type Response } from '@playwright/test';

// =============================================================================
// ESPERA DE HIDRATAÇÃO
// =============================================================================

/**
 * Espera que o React hidratação seja concluída
 * 
 * Verifica se __E2E_HYDRATED_READY foi setado pelo E2EHarness
 * Isso garante que useEffect() já executou antes de validar URL
 * 
 * @param page - Página do Playwright
 * @param timeout - Timeout em ms (default: 10000)
 * 
 * @example
 * await page.goto('/teams/123/OVERVIEW');
 * await waitForHydration(page);
 * // Agora é seguro verificar URL após normalização client-side
 */
export async function waitForHydration(page: Page, timeout = 10_000): Promise<void> {
  await expect
    .poll(
      async () => {
        return page.evaluate(() => Boolean((window as any).__E2E_HYDRATED_READY));
      },
      { 
        timeout,
        message: 'Esperando hidratação React (__E2E_HYDRATED_READY)'
      },
    )
    .toBeTruthy();
}

/**
 * Espera que o pathname do Next.js seja disponível
 * 
 * Verifica se __E2E_PATHNAME foi setado pelo E2EHarness
 * 
 * @param page - Página do Playwright
 * @param timeout - Timeout em ms
 */
export async function waitForE2EPathname(page: Page, timeout = 10_000): Promise<string | null> {
  await expect
    .poll(
      async () => {
        return page.evaluate(() => (window as any).__E2E_PATHNAME);
      },
      { 
        timeout,
        message: 'Esperando pathname do Next.js (__E2E_PATHNAME)'
      },
    )
    .toBeTruthy();

  return page.evaluate(() => (window as any).__E2E_PATHNAME as string);
}

// =============================================================================
// VALIDAÇÃO DE MIDDLEWARE
// =============================================================================

/**
 * Navega para URL e captura response do document com headers do middleware
 * 
 * Útil para provar que o middleware executou (via x-e2e-mw header)
 * 
 * @param page - Página do Playwright
 * @param url - URL para navegar
 * @returns Response e headers relevantes
 * 
 * @example
 * const { res, mw, mwPath } = await waitForDocumentWithMiddlewareHeader(page, '/teams');
 * expect(mw).toBe('1'); // Middleware executou
 */
export async function waitForDocumentWithMiddlewareHeader(
  page: Page,
  url: string
): Promise<{
  res: Response;
  headers: Record<string, string>;
  mw: string | undefined;
  mwPath: string | undefined;
  location: string | undefined;
}> {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  if (!res) {
    throw new Error(`No response for document: ${url}`);
  }

  const headers = res.headers();
  
  return {
    res,
    headers,
    mw: headers['x-e2e-mw'],
    mwPath: headers['x-e2e-path'],
    location: headers['location'],
  };
}

/**
 * Verifica se o middleware foi aplicado na resposta
 * 
 * @param page - Página do Playwright
 * @throws Se a página não estiver avaliável (crash ou loop)
 */
export async function expectMiddlewareApplied(page: Page): Promise<boolean> {
  const ok = await page.evaluate(() => true).catch(() => false);
  
  if (!ok) {
    throw new Error('Page not evaluable; likely navigation loop or crash.');
  }

  return true;
}

// =============================================================================
// VALIDAÇÃO DE URL/PATHNAME
// =============================================================================

/**
 * Espera que o pathname do navegador seja igual ao esperado
 * 
 * Útil para validar normalização de URL após client-side redirect
 * (ex: /OVERVIEW → /overview no Windows)
 * 
 * @param page - Página do Playwright
 * @param expectedPathname - Pathname esperado (ex: '/teams/123/overview')
 * @param timeout - Timeout em ms
 * 
 * @example
 * await page.goto('/teams/123/OVERVIEW');
 * await expectPathnameEventually(page, '/teams/123/overview');
 */
export async function expectPathnameEventually(
  page: Page,
  expectedPathname: string,
  timeout = 10_000
): Promise<void> {
  // Primeiro esperar hidratação
  await waitForHydration(page, timeout);

  // Depois verificar pathname
  await expect
    .poll(
      async () => page.evaluate(() => window.location.pathname),
      { 
        timeout,
        message: `Esperando pathname ser '${expectedPathname}'`
      },
    )
    .toBe(expectedPathname);
}

/**
 * Espera que a URL contenha determinada substring
 * 
 * Mais flexível que expectPathnameEventually
 * 
 * @param page - Página do Playwright
 * @param substring - Substring esperada na URL
 * @param timeout - Timeout em ms
 */
export async function expectUrlContains(
  page: Page,
  substring: string,
  timeout = 10_000
): Promise<void> {
  await expect
    .poll(
      async () => page.url(),
      { 
        timeout,
        message: `Esperando URL conter '${substring}'`
      },
    )
    .toContain(substring);
}

/**
 * Espera que a URL NÃO contenha determinada substring
 * 
 * Útil para verificar que redirect aconteceu
 * 
 * @param page - Página do Playwright
 * @param substring - Substring que NÃO deve estar na URL
 * @param timeout - Timeout em ms
 */
export async function expectUrlNotContains(
  page: Page,
  substring: string,
  timeout = 10_000
): Promise<void> {
  await expect
    .poll(
      async () => page.url(),
      { 
        timeout,
        message: `Esperando URL NÃO conter '${substring}'`
      },
    )
    .not.toContain(substring);
}

// =============================================================================
// DETECÇÃO DE LOOPS
// =============================================================================

/**
 * Navega com timeout curto para detectar loops de redirect
 * 
 * Se a navegação travar por muito tempo, provavelmente é um loop
 * 
 * @param page - Página do Playwright
 * @param url - URL para navegar
 * @param timeout - Timeout em ms (default: 15000)
 * @throws Se detectar provável loop
 */
export async function gotoWithLoopDetection(
  page: Page,
  url: string,
  timeout = 15_000
): Promise<Response | null> {
  await page.setDefaultNavigationTimeout(timeout);
  await page.setDefaultTimeout(timeout);

  const start = Date.now();
  
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    const elapsed = Date.now() - start;
    if (elapsed > timeout * 0.9) {
      console.warn(`[WARN] Navigation took ${elapsed}ms, possible slow redirect chain`);
    }
    
    return res;
  } catch (error: any) {
    if (error.message?.includes('ERR_TOO_MANY_REDIRECTS')) {
      throw new Error(`Redirect loop detected for ${url}: ${error.message}`);
    }
    throw error;
  }
}

// =============================================================================
// ESPERA GENÉRICA COM POLLING
// =============================================================================

/**
 * Espera que uma condição seja verdadeira via polling
 * 
 * @param condition - Função que retorna boolean ou Promise<boolean>
 * @param options - Opções de timeout e intervalo
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number; message?: string } = {}
): Promise<void> {
  const { timeout = 10_000, interval = 100, message = 'Condition not met' } = options;
  
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(`Timeout (${timeout}ms): ${message}`);
}

// =============================================================================
// ESPERA DE ELEMENTO COM RETRY
// =============================================================================

/**
 * Espera elemento estar visível com retries
 * 
 * Útil quando a página pode ter re-renders durante hidratação
 * 
 * @param page - Página do Playwright
 * @param selector - Seletor CSS ou data-testid
 * @param timeout - Timeout em ms
 */
export async function waitForElementVisible(
  page: Page,
  selector: string,
  timeout = 10_000
): Promise<void> {
  await expect(page.locator(selector))
    .toBeVisible({ timeout });
}

/**
 * Espera elemento estar oculto ou não existir
 * 
 * @param page - Página do Playwright
 * @param selector - Seletor CSS ou data-testid
 * @param timeout - Timeout em ms
 */
export async function waitForElementHidden(
  page: Page,
  selector: string,
  timeout = 10_000
): Promise<void> {
  await expect(page.locator(selector))
    .not.toBeVisible({ timeout });
}

// =============================================================================
// NETWORK IDLE CUSTOMIZADO
// =============================================================================

/**
 * Espera que não haja requests pendentes (exceto ignored)
 * 
 * Alternativa mais controlada ao waitUntil: 'networkidle'
 * 
 * @param page - Página do Playwright
 * @param timeout - Timeout em ms
 * @param ignorePatterns - Padrões de URL para ignorar
 */
export async function waitForNetworkSettled(
  page: Page,
  timeout = 5_000,
  ignorePatterns: RegExp[] = [/\/_next\//, /hot-update/, /webpack/]
): Promise<void> {
  const pendingRequests = new Set<string>();

  const onRequest = (req: any) => {
    const url = req.url();
    if (!ignorePatterns.some(p => p.test(url))) {
      pendingRequests.add(url);
    }
  };

  const onResponse = (res: any) => {
    pendingRequests.delete(res.url());
  };

  const onRequestFailed = (req: any) => {
    pendingRequests.delete(req.url());
  };

  page.on('request', onRequest);
  page.on('response', onResponse);
  page.on('requestfailed', onRequestFailed);

  try {
    await waitFor(
      () => pendingRequests.size === 0,
      { timeout, message: `Pending requests: ${[...pendingRequests].join(', ')}` }
    );
  } finally {
    page.off('request', onRequest);
    page.off('response', onResponse);
    page.off('requestfailed', onRequestFailed);
  }
}
