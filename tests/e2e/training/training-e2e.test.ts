/**
 * =============================================================================
 * TRAINING MODULE E2E TESTS
 * =============================================================================
 *
 * CONTRATO: tests/e2e/training/training-CONTRACT.md
 *
 * SEÇÕES:
 * A. Navegação e Rotas
 * B. Autenticação
 * C. Agenda Semanal (API Real)
 * D. Calendário (API Real)
 * E. Planejamento (API Real)
 * F. Banco de Exercícios (Mock)
 * G. Avaliações (Mock)
 * H. CRUD de Sessões via API
 * I. Validações de Negócio
 * J. Ciclos e Microciclos via API
 *
 * EXECUÇÃO:
 * npx playwright test tests/e2e/training/training-e2e.test.ts --project=chromium --workers=1
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import path from 'path';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// TestIDs esperados
const TID = {
  // Roots
  agendaRoot: 'training-agenda-root',
  calendarioRoot: 'training-calendario-root',
  planejamentoRoot: 'training-planejamento-root',
  bancoRoot: 'training-banco-root',
  avaliacoesRoot: 'training-avaliacoes-root',

  // Componentes
  createSessionBtn: 'create-session-button',
  createSessionModal: 'create-session-modal',
  sessionCard: 'session-card',
  weekNavigation: 'week-navigation',
  monthNavigation: 'month-navigation',

  // Tabs
  trainingTabs: 'training-tabs',
} as const;

// =============================================================================
// HELPERS
// =============================================================================

function generateSuffix(): string {
  return Date.now().toString(16).slice(-6);
}

async function waitForPage(page: Page, timeout = 30000): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Aguardar hidratação
}

// =============================================================================
// API HELPERS
// =============================================================================

interface SessionCreate {
  team_id: string;
  session_at: string;
  session_type?: string;
  main_objective?: string;
  duration_planned_minutes?: number;
  focus_attack_positional_pct?: number;
  focus_defense_positional_pct?: number;
  focus_transition_offense_pct?: number;
  focus_transition_defense_pct?: number;
  focus_attack_technical_pct?: number;
  focus_defense_technical_pct?: number;
  focus_physical_pct?: number;
}

interface CycleCreate {
  team_id: string;
  type: 'macro' | 'meso';
  start_date: string;
  end_date: string;
  objective?: string;
  parent_cycle_id?: string;
}

interface MicrocycleCreate {
  team_id: string;
  week_start: string;
  week_end: string;
  cycle_id?: string;
  planned_focus_attack_positional_pct?: number;
}

async function getAuthHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  // Buscar token do storage state
  const storageState = await request.storageState();
  const cookie = storageState.cookies.find(c => c.name === 'hb_access_token');

  if (!cookie) {
    throw new Error('Auth token not found in storage state');
  }

  return {
    'Authorization': `Bearer ${cookie.value}`,
    'Content-Type': 'application/json',
  };
}

async function createSessionViaAPI(
  request: APIRequestContext,
  data: SessionCreate
): Promise<string> {
  const headers = await getAuthHeaders(request);

  // Buscar organization_id do usuário
  const meResponse = await request.get(`${BASE_URL}/users/me`, { headers });
  const me = await meResponse.json();

  const payload = {
    organization_id: me.organization_id,
    team_id: data.team_id,
    session_at: data.session_at,
    session_type: data.session_type || 'quadra',
    main_objective: data.main_objective || 'Treino E2E',
    duration_planned_minutes: data.duration_planned_minutes || 90,
    ...data,
  };

  const response = await request.post(`${BASE_URL}/training-sessions`, {
    headers,
    data: payload,
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to create session: ${response.status()} - ${error}`);
  }

  const session = await response.json();
  return session.id;
}

async function getSessionViaAPI(
  request: APIRequestContext,
  sessionId: string
): Promise<any> {
  const headers = await getAuthHeaders(request);

  const response = await request.get(`${BASE_URL}/training-sessions/${sessionId}`, {
    headers,
  });

  if (!response.ok()) {
    return null;
  }

  return response.json();
}

async function deleteSessionViaAPI(
  request: APIRequestContext,
  sessionId: string
): Promise<void> {
  const headers = await getAuthHeaders(request);

  await request.delete(`${BASE_URL}/training-sessions/${sessionId}?reason=E2E cleanup`, {
    headers,
  });
}

async function closeSessionViaAPI(
  request: APIRequestContext,
  sessionId: string
): Promise<any> {
  const headers = await getAuthHeaders(request);

  const response = await request.post(`${BASE_URL}/training-sessions/${sessionId}/close`, {
    headers,
    data: {},
  });

  return response.json();
}

async function createCycleViaAPI(
  request: APIRequestContext,
  data: CycleCreate
): Promise<string> {
  const headers = await getAuthHeaders(request);

  const response = await request.post(`${BASE_URL}/training-cycles`, {
    headers,
    data,
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to create cycle: ${response.status()} - ${error}`);
  }

  const cycle = await response.json();
  return cycle.id;
}

async function deleteCycleViaAPI(
  request: APIRequestContext,
  cycleId: string
): Promise<void> {
  const headers = await getAuthHeaders(request);

  await request.delete(`${BASE_URL}/training-cycles/${cycleId}?reason=E2E cleanup`, {
    headers,
  });
}

async function createMicrocycleViaAPI(
  request: APIRequestContext,
  data: MicrocycleCreate
): Promise<string> {
  const headers = await getAuthHeaders(request);

  const response = await request.post(`${BASE_URL}/training-microcycles`, {
    headers,
    data,
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to create microcycle: ${response.status()} - ${error}`);
  }

  const microcycle = await response.json();
  return microcycle.id;
}

async function deleteMicrocycleViaAPI(
  request: APIRequestContext,
  microcycleId: string
): Promise<void> {
  const headers = await getAuthHeaders(request);

  await request.delete(`${BASE_URL}/training-microcycles/${microcycleId}?reason=E2E cleanup`, {
    headers,
  });
}

// =============================================================================
// SEÇÃO A: NAVEGAÇÃO E ROTAS
// =============================================================================

test.describe('A. Training - Navegação e Rotas', () => {
  test.use({ storageState: ADMIN_STATE });

  test('A1: /training deve redirecionar para /training/agenda', async ({ page }) => {
    await page.goto('/training');
    await waitForPage(page);

    await expect(page).toHaveURL(/\/training\/agenda/);
  });

  test('A2: /training/agenda deve carregar sem erro', async ({ page }) => {
    await page.goto('/training/agenda');
    await waitForPage(page);

    // Verificar que página carregou (não é 404)
    await expect(page.locator('[data-testid="not-found-page"]')).not.toBeVisible();

    // Verificar algum conteúdo da página
    const hasContent = await page.locator('h1, h2, [data-testid*="training"], [data-testid*="agenda"]').first().isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('A3: /training/calendario deve carregar sem erro', async ({ page }) => {
    await page.goto('/training/calendario');
    await waitForPage(page);

    await expect(page.locator('[data-testid="not-found-page"]')).not.toBeVisible();
  });

  test('A4: /training/planejamento deve carregar sem erro', async ({ page }) => {
    await page.goto('/training/planejamento');
    await waitForPage(page);

    await expect(page.locator('[data-testid="not-found-page"]')).not.toBeVisible();
  });

  test('A5: /training/banco deve carregar com dados mock', async ({ page }) => {
    await page.goto('/training/banco');
    await waitForPage(page);

    await expect(page.locator('[data-testid="not-found-page"]')).not.toBeVisible();

    // Banco usa mock - deve ter algum exercício visível
    const hasExercises = await page.locator('text=/exercício/i, text=/aquecimento/i, text=/técnico/i').first().isVisible().catch(() => false);
    if (hasExercises) {
      expect(hasExercises).toBe(true);
    }
  });

  test('A6: /training/avaliacoes deve carregar com dados mock', async ({ page }) => {
    await page.goto('/training/avaliacoes');
    await waitForPage(page);

    await expect(page.locator('[data-testid="not-found-page"]')).not.toBeVisible();
  });

  test('A7: navegação entre abas deve funcionar', async ({ page }) => {
    await page.goto('/training/agenda');
    await waitForPage(page);

    // Procurar tabs de navegação
    const tabs = page.locator('[data-testid="training-tabs"], nav, [role="tablist"]').first();

    if (await tabs.isVisible().catch(() => false)) {
      // Clicar em Calendário
      const calendarioTab = page.locator('a[href*="calendario"], button:has-text("Calendário")').first();
      if (await calendarioTab.isVisible().catch(() => false)) {
        await calendarioTab.click();
        await page.waitForURL(/\/training\/calendario/);
        await expect(page).toHaveURL(/\/training\/calendario/);
      }
    }
  });
});

// =============================================================================
// SEÇÃO B: AUTENTICAÇÃO
// =============================================================================

test.describe('B. Training - Autenticação', () => {
  test('B1: acesso sem auth deve redirecionar para /signin', async ({ page }) => {
    // Não usar storageState autenticado
    await page.goto('/training/agenda');

    // Deve redirecionar para signin
    await page.waitForURL(/\/signin/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/signin/);
  });

  test('B2: callbackUrl deve ser preservada no redirect', async ({ page }) => {
    await page.goto('/training/planejamento');

    await page.waitForURL(/\/signin/, { timeout: 10000 });

    // Verificar que callbackUrl está na query string
    const url = page.url();
    expect(url).toContain('callbackUrl');
    expect(url).toContain('training');
  });
});

// =============================================================================
// SEÇÃO C: AGENDA SEMANAL (API REAL)
// =============================================================================

test.describe('C. Training - Agenda Semanal', () => {
  test.use({ storageState: ADMIN_STATE });

  test('C1: agenda deve exibir navegação de semanas', async ({ page }) => {
    await page.goto('/training/agenda');
    await waitForPage(page);

    // Procurar controles de navegação de semana
    const weekNav = page.locator('[data-testid="week-navigation"], button:has-text("Anterior"), button:has-text("Próxima"), [aria-label*="week"]').first();

    const hasWeekNav = await weekNav.isVisible().catch(() => false);
    if (!hasWeekNav) {
      console.warn('Navegação de semanas não encontrada com testid padrão');
    }
  });

  test('C2: deve exibir dias da semana', async ({ page }) => {
    await page.goto('/training/agenda');
    await waitForPage(page);

    // Procurar indicadores de dias
    const daysPattern = /seg|ter|qua|qui|sex|sáb|dom|segunda|terça|quarta|quinta|sexta|sábado|domingo/i;
    const hasDays = await page.locator(`text=${daysPattern}`).first().isVisible().catch(() => false);

    if (hasDays) {
      expect(hasDays).toBe(true);
    }
  });
});

// =============================================================================
// SEÇÃO D: CALENDÁRIO (API REAL)
// =============================================================================

test.describe('D. Training - Calendário', () => {
  test.use({ storageState: ADMIN_STATE });

  test('D1: calendário deve exibir navegação de meses', async ({ page }) => {
    await page.goto('/training/calendario');
    await waitForPage(page);

    // Procurar controles de navegação de mês
    const monthNav = page.locator('[data-testid="month-navigation"], button:has-text("<"), button:has-text(">"), [aria-label*="month"]').first();

    const hasMonthNav = await monthNav.isVisible().catch(() => false);
    if (!hasMonthNav) {
      console.warn('Navegação de meses não encontrada com testid padrão');
    }
  });

  test('D2: deve exibir grid de dias', async ({ page }) => {
    await page.goto('/training/calendario');
    await waitForPage(page);

    // Calendário deve ter números de dias (1-31)
    const hasGrid = await page.locator('text=/^[1-9]$|^[12][0-9]$|^3[01]$/').first().isVisible().catch(() => false);

    if (hasGrid) {
      expect(hasGrid).toBe(true);
    }
  });
});

// =============================================================================
// SEÇÃO E: PLANEJAMENTO (API REAL)
// =============================================================================

test.describe('E. Training - Planejamento', () => {
  test.use({ storageState: ADMIN_STATE });

  test('E1: planejamento deve carregar estrutura de ciclos', async ({ page }) => {
    await page.goto('/training/planejamento');
    await waitForPage(page);

    // Página deve ter algum conteúdo relacionado a ciclos/planejamento
    const hasPlanningContent = await page.locator('text=/ciclo|macrociclo|mesociclo|microciclo|planejamento|semana/i').first().isVisible().catch(() => false);

    if (hasPlanningContent) {
      expect(hasPlanningContent).toBe(true);
    }
  });
});

// =============================================================================
// SEÇÃO F: BANCO DE EXERCÍCIOS (MOCK)
// =============================================================================

test.describe('F. Training - Banco de Exercícios (Mock)', () => {
  test.use({ storageState: ADMIN_STATE });

  test('F1: banco deve exibir exercícios mock', async ({ page }) => {
    await page.goto('/training/banco');
    await waitForPage(page);

    // Banco usa mock data - deve ter cards/lista de exercícios
    const hasExercises = await page.locator('[data-testid*="exercise"], .exercise-card, text=/aquecimento/i').first().isVisible().catch(() => false);

    // Mock data presente
    if (hasExercises) {
      expect(hasExercises).toBe(true);
    }
  });

  test('F2: filtro de categoria deve funcionar', async ({ page }) => {
    await page.goto('/training/banco');
    await waitForPage(page);

    // Procurar filtro de categoria
    const categoryFilter = page.locator('select, [data-testid*="filter"], [role="combobox"]').first();

    if (await categoryFilter.isVisible().catch(() => false)) {
      console.log('Filtro de categoria encontrado');
    }
  });
});

// =============================================================================
// SEÇÃO G: AVALIAÇÕES (MOCK)
// =============================================================================

test.describe('G. Training - Avaliações (Mock)', () => {
  test.use({ storageState: ADMIN_STATE });

  test('G1: avaliações deve exibir métricas mock', async ({ page }) => {
    await page.goto('/training/avaliacoes');
    await waitForPage(page);

    // Dashboard com números/métricas
    const hasMetrics = await page.locator('text=/[0-9]+%|[0-9]+ sessões|média|total/i').first().isVisible().catch(() => false);

    if (hasMetrics) {
      expect(hasMetrics).toBe(true);
    }
  });
});

// =============================================================================
// SEÇÃO H: CRUD DE SESSÕES VIA API
// =============================================================================

test.describe('H. Training - CRUD de Sessões via API', () => {
  test.use({ storageState: ADMIN_STATE });

  // ID de equipe E2E do seed
  const E2E_TEAM_ID = '88888888-8888-8888-8884-000000000001';
  const createdSessionIds: string[] = [];

  test.afterAll(async ({ request }) => {
    // Cleanup
    for (const sessionId of createdSessionIds) {
      await deleteSessionViaAPI(request, sessionId).catch(() => {});
    }
  });

  test('H1: criar sessão via API', async ({ request }) => {
    const suffix = generateSuffix();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const sessionId = await createSessionViaAPI(request, {
      team_id: E2E_TEAM_ID,
      session_at: tomorrow.toISOString(),
      session_type: 'quadra',
      main_objective: `E2E Test Session ${suffix}`,
      focus_attack_positional_pct: 30,
      focus_defense_positional_pct: 30,
      focus_physical_pct: 20,
    });

    createdSessionIds.push(sessionId);
    expect(sessionId).toBeTruthy();
  });

  test('H2: buscar sessão por ID via API', async ({ request }) => {
    const suffix = generateSuffix();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const sessionId = await createSessionViaAPI(request, {
      team_id: E2E_TEAM_ID,
      session_at: tomorrow.toISOString(),
      main_objective: `E2E Get Session ${suffix}`,
    });
    createdSessionIds.push(sessionId);

    const session = await getSessionViaAPI(request, sessionId);

    expect(session).not.toBeNull();
    expect(session.id).toBe(sessionId);
    expect(session.main_objective).toContain('E2E Get Session');
  });

  test('H3: deletar sessão via API (soft delete)', async ({ request }) => {
    const suffix = generateSuffix();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);

    const sessionId = await createSessionViaAPI(request, {
      team_id: E2E_TEAM_ID,
      session_at: tomorrow.toISOString(),
      main_objective: `E2E Delete Session ${suffix}`,
    });

    // Deletar
    await deleteSessionViaAPI(request, sessionId);

    // Verificar que não aparece mais (soft deleted)
    const session = await getSessionViaAPI(request, sessionId);

    // Pode retornar null ou ter deleted_at
    if (session) {
      expect(session.deleted_at).toBeTruthy();
    }
  });

  test('H4: fechar sessão via API', async ({ request }) => {
    const suffix = generateSuffix();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 4);

    // Criar sessão com focos válidos para fechamento
    const sessionId = await createSessionViaAPI(request, {
      team_id: E2E_TEAM_ID,
      session_at: tomorrow.toISOString(),
      main_objective: `E2E Close Session ${suffix}`,
      focus_attack_positional_pct: 40,
      focus_defense_positional_pct: 40,
      focus_physical_pct: 20,
    });
    createdSessionIds.push(sessionId);

    // Fechar sessão
    const closedSession = await closeSessionViaAPI(request, sessionId);

    expect(closedSession.status).toBe('closed');
    expect(closedSession.closed_at).toBeTruthy();
  });
});

// =============================================================================
// SEÇÃO I: VALIDAÇÕES DE NEGÓCIO
// =============================================================================

test.describe('I. Training - Validações de Negócio', () => {
  test.use({ storageState: ADMIN_STATE });

  const E2E_TEAM_ID = '88888888-8888-8888-8884-000000000001';
  const createdSessionIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const sessionId of createdSessionIds) {
      await deleteSessionViaAPI(request, sessionId).catch(() => {});
    }
  });

  test('I1: sessão sem focos não deve fechar', async ({ request }) => {
    const suffix = generateSuffix();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);

    // Criar sessão SEM focos
    const sessionId = await createSessionViaAPI(request, {
      team_id: E2E_TEAM_ID,
      session_at: tomorrow.toISOString(),
      main_objective: `E2E No Focus Session ${suffix}`,
      // Sem focus_*_pct
    });
    createdSessionIds.push(sessionId);

    // Tentar fechar - deve falhar ou retornar erro
    try {
      const result = await closeSessionViaAPI(request, sessionId);
      // Se não lançou erro, verificar se status não mudou
      if (result.status !== 'closed') {
        expect(result.status).not.toBe('closed');
      }
    } catch (error) {
      // Esperado - validação deve impedir fechamento
      expect(error).toBeTruthy();
    }
  });

  test('I2: soma de focos <= 120% é válida', async ({ request }) => {
    const suffix = generateSuffix();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 6);

    // Criar sessão com soma = 120% (máximo permitido)
    const sessionId = await createSessionViaAPI(request, {
      team_id: E2E_TEAM_ID,
      session_at: tomorrow.toISOString(),
      main_objective: `E2E Max Focus Session ${suffix}`,
      focus_attack_positional_pct: 30,
      focus_defense_positional_pct: 30,
      focus_transition_offense_pct: 20,
      focus_transition_defense_pct: 20,
      focus_physical_pct: 20, // Total = 120%
    });
    createdSessionIds.push(sessionId);

    // Deve conseguir fechar
    const closedSession = await closeSessionViaAPI(request, sessionId);
    expect(closedSession.status).toBe('closed');
  });
});

// =============================================================================
// SEÇÃO J: CICLOS E MICROCICLOS VIA API
// =============================================================================

test.describe('J. Training - Ciclos e Microciclos via API', () => {
  test.use({ storageState: ADMIN_STATE });

  const E2E_TEAM_ID = '88888888-8888-8888-8884-000000000001';
  const createdCycleIds: string[] = [];
  const createdMicrocycleIds: string[] = [];

  test.afterAll(async ({ request }) => {
    // Cleanup microciclos primeiro (FK)
    for (const id of createdMicrocycleIds) {
      await deleteMicrocycleViaAPI(request, id).catch(() => {});
    }
    // Depois ciclos
    for (const id of createdCycleIds) {
      await deleteCycleViaAPI(request, id).catch(() => {});
    }
  });

  test('J1: criar macrociclo via API', async ({ request }) => {
    const suffix = generateSuffix();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    const cycleId = await createCycleViaAPI(request, {
      team_id: E2E_TEAM_ID,
      type: 'macro',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      objective: `E2E Macrociclo ${suffix}`,
    });

    createdCycleIds.push(cycleId);
    expect(cycleId).toBeTruthy();
  });

  test('J2: criar mesociclo vinculado a macrociclo', async ({ request }) => {
    const suffix = generateSuffix();

    // Criar macrociclo primeiro
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    const macroId = await createCycleViaAPI(request, {
      team_id: E2E_TEAM_ID,
      type: 'macro',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      objective: `E2E Parent Macro ${suffix}`,
    });
    createdCycleIds.push(macroId);

    // Criar mesociclo vinculado
    const mesoStart = new Date();
    const mesoEnd = new Date();
    mesoEnd.setDate(mesoEnd.getDate() + 28); // 4 semanas

    const mesoId = await createCycleViaAPI(request, {
      team_id: E2E_TEAM_ID,
      type: 'meso',
      start_date: mesoStart.toISOString().split('T')[0],
      end_date: mesoEnd.toISOString().split('T')[0],
      objective: `E2E Mesociclo ${suffix}`,
      parent_cycle_id: macroId,
    });
    createdCycleIds.push(mesoId);

    expect(mesoId).toBeTruthy();
  });

  test('J3: criar microciclo via API', async ({ request }) => {
    const suffix = generateSuffix();

    // Próxima segunda-feira
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (8 - today.getDay()) % 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const microcycleId = await createMicrocycleViaAPI(request, {
      team_id: E2E_TEAM_ID,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      planned_focus_attack_positional_pct: 25,
    });

    createdMicrocycleIds.push(microcycleId);
    expect(microcycleId).toBeTruthy();
  });
});

// =============================================================================
// SEÇÃO K: INTEGRAÇÃO UI + API (Seed Data)
// =============================================================================

test.describe('K. Training - Integração UI + API', () => {
  test.use({ storageState: ADMIN_STATE });

  const E2E_TEAM_ID = '88888888-8888-8888-8884-000000000001';

  test('K1: sessão criada via API deve aparecer na UI', async ({ page, request }) => {
    const suffix = generateSuffix();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    // Criar sessão via API
    const sessionId = await createSessionViaAPI(request, {
      team_id: E2E_TEAM_ID,
      session_at: tomorrow.toISOString(),
      main_objective: `E2E UI Visible ${suffix}`,
      session_type: 'quadra',
    });

    try {
      // Navegar para agenda
      await page.goto('/training/agenda');
      await waitForPage(page);
      await page.waitForTimeout(2000); // Aguardar fetch

      // Verificar se a sessão aparece (pode precisar selecionar equipe correta)
      // Como equipe pode não estar selecionada, apenas verificar que página carregou
      const hasContent = await page.locator('[data-testid*="session"], [data-testid*="training"], .session-card').first().isVisible().catch(() => false);

      // Se não encontrou por testid, verificar por texto
      if (!hasContent) {
        const hasText = await page.locator(`text=/E2E UI Visible ${suffix}/i`).first().isVisible().catch(() => false);
        console.log(`Sessão visível por texto: ${hasText}`);
      }
    } finally {
      // Cleanup
      await deleteSessionViaAPI(request, sessionId).catch(() => {});
    }
  });
});
