/**
 * Helper para debug de redirects no Playwright
 * 
 * Usa Request.redirectedFrom() para reconstruir a cadeia de redirects
 * de forma confiável, independente de headers Location.
 */
import type { Page, TestInfo, Request, Response } from '@playwright/test';

async function buildRedirectChain(finalRequest: Request | null): Promise<string> {
  if (!finalRequest) return 'Sem request final (navegação interrompida antes de obter response).';

  const chain: string[] = [];
  let r: Request | null = finalRequest;

  // Caminha para trás (redirectedFrom) e depois inverte para ordem correta
  while (r) {
    const resp = await r.response();
    const status = resp ? resp.status() : 'no-response';
    const location = resp?.headers()?.['location'] ?? '';
    chain.push(`${status} ${r.url()}${location ? `  ->  location: ${location}` : ''}`);
    r = r.redirectedFrom();
  }

  return chain.reverse().join('\n');
}

/**
 * Navega para uma URL e anexa a cadeia de redirects ao report do teste.
 * 
 * Uso:
 * ```ts
 * import { gotoWithRedirectTrace } from '../helpers/redirectDebug';
 * 
 * test('exemplo', async ({ page }, testInfo) => {
 *   await gotoWithRedirectTrace(page, testInfo, '/teams');
 *   await expect(page).toHaveURL(/\/signin\?callbackUrl=/);
 * });
 * ```
 */
export async function gotoWithRedirectTrace(
  page: Page,
  testInfo: TestInfo,
  url: string
): Promise<Response | null> {
  try {
    const response = await page.goto(url);
    const finalReq = response?.request() ?? null;

    await testInfo.attach('redirect-chain', {
      body: await buildRedirectChain(finalReq),
      contentType: 'text/plain',
    });

    await testInfo.attach('final-url', {
      body: page.url(),
      contentType: 'text/plain',
    });

    return response;
  } catch (e) {
    // Se a navegação foi interrompida por outra navegação, ainda dá para logar URL final
    await testInfo.attach('final-url-on-error', {
      body: page.url(),
      contentType: 'text/plain',
    });
    throw e;
  }
}
