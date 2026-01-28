/**
 * Debug Avançado para Testes E2E - "Caixa Preta"
 * 
 * Registra apenas sinais determinísticos e anexa evidência no testInfo quando falhar.
 * Resolve edge-cases de Windows + Next.js dev/turbopack:
 * - Redirect loops
 * - Middleware não aplicado
 * - Timing de hidratação
 * - Case-insensitive filesystem
 * 
 * @see REGRAS_TESTES.md - Regra 29
 */

import type { Page, TestInfo, Response, Request, ConsoleMessage, Frame } from '@playwright/test';

// =============================================================================
// TIPOS
// =============================================================================

export interface DebugLog {
  timestamp: string;
  type: 'nav' | 'console' | 'pageerror' | 'reqfail' | 'doc' | 'doc-redir' | 'doc-err' | 'ws' | 'res';
  message: string;
  url?: string;
  status?: number;
  headers?: Record<string, string | undefined>;
  count?: number;
}

export interface ClientDiagnostics {
  now: string;
  href: string;
  pathname: string;
  referrer: string;
  historyLength: number;
  navigation: { type: string; redirectCount: number } | null;
  e2e: {
    hydratedAt: number | null;
    hydratedReady: boolean | null;
    e2ePathname: string | null;
  };
  hydratedDelayMs: number;
}

export interface DebugState {
  url: string;
  hbCookie: {
    name: string;
    domain: string;
    path: string;
    httpOnly: boolean;
  } | null;
  storage: {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  } | null;
}

type AttachDebugOptions = {
  /** Incluir responses 200/304 (pode poluir) */
  includeResponses?: boolean;
  /** Máximo de linhas no buffer */
  maxLines?: number;
  /** Padrões de URL para ignorar */
  ignoreUrlPatterns?: RegExp[];
  /** Incluir todos os console.log (não só error/warning) */
  logConsole?: boolean;
};

// =============================================================================
// CONSTANTES
// =============================================================================

const DEFAULT_IGNORES = [
  /\/_next\/static\//,
  /\/_next\/webpack-hmr/,
  /\/_next\/turbopack/,
  /\/favicon\.ico/,
  /\/__nextjs/,
  /sentry/i,
  /analytics/i,
  /hotjar/i,
  /google/i,
  /fonts\.googleapis/i,
  /fonts\.gstatic/i,
];

// =============================================================================
// HELPERS INTERNOS
// =============================================================================

function safeJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function timestamp(): string {
  return new Date().toISOString();
}

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

/**
 * Anexa listeners de debug a uma página para capturar timeline completa
 * 
 * @param page - Página do Playwright
 * @param testInfo - Info do teste para anexar relatórios
 * @param opts - Opções de configuração
 * 
 * @example
 * test.beforeEach(async ({ page }, testInfo) => {
 *   const dbg = attachDebug(page, testInfo);
 *   (testInfo as any)._dbg = dbg;
 * });
 * 
 * test.afterEach(async ({}, testInfo) => {
 *   const dbg = (testInfo as any)._dbg;
 *   if (testInfo.status !== testInfo.expectedStatus && dbg) {
 *     await dbg.flush('failure');
 *   }
 * });
 */
export function attachDebug(page: Page, testInfo: TestInfo, opts: AttachDebugOptions = {}) {
  const {
    includeResponses = false,
    maxLines = 700,
    ignoreUrlPatterns = DEFAULT_IGNORES,
    logConsole = false,
  } = opts;

  // Buffer de eventos
  const lines: string[] = [];
  const push = (s: string) => {
    lines.push(`[${timestamp()}] ${s}`);
    if (lines.length > maxLines) lines.shift();
  };

  // Contadores para detectar loops
  const navCounts = new Map<string, number>();
  let wsCount = 0;

  // Verificar se URL deve ser ignorada
  const shouldIgnore = (url: string) => ignoreUrlPatterns.some((re) => re.test(url));

  // -------------------------------------------------------------------------
  // LISTENER: Navegações (detecta loops)
  // -------------------------------------------------------------------------
  const onFrameNavigated = (frame: Frame) => {
    if (frame !== page.mainFrame()) return;
    const url = frame.url();
    const c = (navCounts.get(url) || 0) + 1;
    navCounts.set(url, c);
    
    const loopWarning = c >= 3 ? ` ⚠️ REPEATED ${c}x` : '';
    push(`[NAV] (${c}x) ${url}${loopWarning}`);
  };

  // -------------------------------------------------------------------------
  // LISTENER: Console (error/warning, ou todos se logConsole=true)
  // -------------------------------------------------------------------------
  const onConsole = (msg: ConsoleMessage) => {
    const type = msg.type();
    if (!logConsole && type !== 'error' && type !== 'warning') return;
    push(`[CONSOLE:${type.toUpperCase()}] ${msg.text()}`);
  };

  // -------------------------------------------------------------------------
  // LISTENER: Erros de página (exceções não tratadas)
  // -------------------------------------------------------------------------
  const onPageError = (err: Error) => {
    push(`[PAGEERROR] ${err?.stack || String(err)}`);
  };

  // -------------------------------------------------------------------------
  // LISTENER: Requests que falharam
  // -------------------------------------------------------------------------
  const onRequestFailed = (req: Request) => {
    const url = req.url();
    if (shouldIgnore(url)) return;
    push(`[REQFAIL] ${req.method()} ${req.resourceType()} ${url} | ${req.failure()?.errorText ?? 'unknown'}`);
  };

  // -------------------------------------------------------------------------
  // LISTENER: WebSocket (detecta excesso de conexões dev)
  // -------------------------------------------------------------------------
  const onRequest = (req: Request) => {
    const url = req.url();
    if (shouldIgnore(url)) return;

    if (req.resourceType() === 'websocket') {
      wsCount++;
      push(`[WS] open #${wsCount} ${url}`);
    }
  };

  // -------------------------------------------------------------------------
  // LISTENER: Responses (foco em documents e redirects)
  // -------------------------------------------------------------------------
  const onResponse = async (res: Response) => {
    const req = res.request();
    const url = res.url();
    if (shouldIgnore(url)) return;

    const status = res.status();
    const isDoc = req.resourceType() === 'document';

    if (isDoc) {
      const h = res.headers();
      const location = h['location'];
      
      // Headers do middleware (prova que middleware executou)
      const mw = {
        'x-e2e-mw': h['x-e2e-mw'],
        'x-e2e-path': h['x-e2e-path'],
        'x-middleware-rewrite': h['x-middleware-rewrite'],
        'x-middleware-next': h['x-middleware-next'],
        'x-middleware-redirect': h['x-middleware-redirect'],
      };

      // Filtrar headers undefined
      const mwFiltered = Object.fromEntries(
        Object.entries(mw).filter(([, v]) => v !== undefined)
      );
      const mwStr = Object.keys(mwFiltered).length > 0 ? ` | mw=${safeJson(mwFiltered)}` : '';

      if (status >= 300 && status < 400) {
        push(`[DOC-REDIR] ${status} ${url} -> ${location || '(no location)'}${mwStr}`);
      } else if (status >= 400) {
        push(`[DOC-ERR] ${status} ${url}${mwStr}`);
      } else {
        push(`[DOC] ${status} ${url}${mwStr}`);
      }
      return;
    }

    // Outros recursos: só se includeResponses ou se for erro
    if (includeResponses || status >= 400) {
      push(`[RES] ${status} ${req.resourceType()} ${url}`);
    }
  };

  // -------------------------------------------------------------------------
  // ANEXAR LISTENERS
  // -------------------------------------------------------------------------
  page.on('framenavigated', onFrameNavigated);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onRequestFailed);
  page.on('request', onRequest);
  page.on('response', onResponse);

  // -------------------------------------------------------------------------
  // FLUSH: Anexa tudo ao relatório
  // -------------------------------------------------------------------------
  async function flush(label = 'debug') {
    // Detectar loops: URLs navegadas muitas vezes
    const repeated = [...navCounts.entries()]
      .filter(([, c]) => c >= 3)
      .map(([url, count]) => ({ url, count }));

    // Diagnóstico client-side (pós-hidratação)
    const clientDiag = await page.evaluate(async () => {
      // Esperar 2 voltas no event loop para garantir efeitos
      const start = Date.now();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));

      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return {
        now: new Date().toISOString(),
        href: window.location.href,
        pathname: window.location.pathname,
        referrer: document.referrer,
        historyLength: history.length,
        navigation: nav ? { type: nav.type, redirectCount: nav.redirectCount } : null,
        e2e: {
          hydratedAt: (window as any).__E2E_HYDRATED_AT ?? null,
          hydratedReady: (window as any).__E2E_HYDRATED_READY ?? null,
          e2ePathname: (window as any).__E2E_PATHNAME ?? null,
        },
        hydratedDelayMs: Date.now() - start,
      };
    }).catch(() => null);

    // Estado do cookie e storage
    const debugState = await getDebugState(page);

    // 1) Timeline de eventos
    await testInfo.attach(`${label}-timeline.log`, {
      body: Buffer.from(lines.join('\n'), 'utf-8'),
      contentType: 'text/plain',
    });

    // 2) Diagnóstico client
    await testInfo.attach(`${label}-client.json`, {
      body: Buffer.from(
        safeJson({
          clientDiag,
          wsCount,
          repeated,
          loopDetected: repeated.length > 0,
        }),
        'utf-8',
      ),
      contentType: 'application/json',
    });

    // 3) Estado (cookies, storage)
    await testInfo.attach(`${label}-state.json`, {
      body: Buffer.from(safeJson(debugState), 'utf-8'),
      contentType: 'application/json',
    });
  }

  // -------------------------------------------------------------------------
  // DISPOSE: Remove listeners
  // -------------------------------------------------------------------------
  function dispose() {
    page.off('framenavigated', onFrameNavigated);
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('requestfailed', onRequestFailed);
    page.off('request', onRequest);
    page.off('response', onResponse);
  }

  // -------------------------------------------------------------------------
  // GETTERS
  // -------------------------------------------------------------------------
  function getLogs(): string[] {
    return [...lines];
  }

  function getNavigationHistory(): string[] {
    return [...navCounts.keys()];
  }

  function getNavCounts(): Map<string, number> {
    return new Map(navCounts);
  }

  function hasLoop(): boolean {
    return [...navCounts.values()].some(c => c >= 6);
  }

  return {
    flush,
    dispose,
    getLogs,
    getNavigationHistory,
    getNavCounts,
    hasLoop,
  };
}

// =============================================================================
// HELPER: Capturar estado debug (cookies, storage)
// =============================================================================

async function getDebugState(page: Page): Promise<DebugState> {
  const url = page.url();
  const cookies = await page.context().cookies();
  const hbCookie = cookies.find((c) => c.name === 'hb_access_token');

  const storage = await page.evaluate(() => ({
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage },
  })).catch(() => null);

  return {
    url,
    hbCookie: hbCookie
      ? {
          name: hbCookie.name,
          domain: hbCookie.domain,
          path: hbCookie.path,
          httpOnly: hbCookie.httpOnly,
        }
      : null,
    storage,
  };
}

// =============================================================================
// HELPERS LEGADOS (mantidos para compatibilidade)
// =============================================================================

/**
 * Gera identificador único para dados de teste
 * 
 * @param testTitle - Título do teste
 * @param maxLength - Tamanho máximo do sufixo
 * @returns String no formato "E2E-{sanitizedTitle}"
 */
export function generateTestId(testTitle: string, maxLength: number = 20): string {
  const sanitized = testTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength);

  return `E2E-${sanitized}`;
}

/**
 * Gera nome único para entidade de teste
 * 
 * @param prefix - Prefixo da entidade (ex: "Team", "Member")
 * @param testTitle - Título do teste
 * @returns Nome único
 */
export function generateEntityName(prefix: string, testTitle: string): string {
  const sanitized = testTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 15);

  const suffix = Date.now().toString(16).slice(-6);

  return `E2E-${prefix}-${sanitized}-${suffix}`;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type DebugHelper = ReturnType<typeof attachDebug>;
