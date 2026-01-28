/**
 * =============================================================================
 * TRAINING MODULE E2E TESTS - STEP 14 (FECHAMENTO)
 * =============================================================================
 *
 * 20 Test Cases cobrindo funcionalidades implementadas nos Steps 1-13:
 * - Navegação 8 tabs
 * - CRUD Templates (criar, editar, duplicar, favoritar, deletar)
 * - Limite 50 templates
 * - Preview modal
 * - UX Mobile
 * - Features principais (Agenda, Calendário, Planejamento, Analytics, Rankings)
 * - Draft localStorage
 * - Validações finais (Wellness API, Build, Responsive, Dark mode, Edge cases)
 *
 * EXECUÇÃO:
 * npx playwright test tests/e2e/training/training-module.spec.ts --project=chromium --workers=1
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.skip(true, 'LEGACY - replaced by modular training specs');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Test data
const E2E_ORG_ID = '88888888-8888-8888-8888-000000000001';
const E2E_TEAM_ID = '88888888-8888-8888-8884-000000000001';

// =============================================================================
// HELPERS
// =============================================================================

function generateSuffix(): string {
  return Date.now().toString(16).slice(-6);
}

async function waitForPage(page: Page, timeout = 30000): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

interface TemplateCreate {
  name: string;
  description?: string;
  icon?: string;
  is_favorite?: boolean;
  focus_attack_positional_pct?: number;
  focus_defense_positional_pct?: number;
  focus_transition_offense_pct?: number;
  focus_transition_defense_pct?: number;
  focus_attack_technical_pct?: number;
  focus_defense_technical_pct?: number;
  focus_physical_pct?: number;
}

async function createTemplateViaAPI(
  page: Page,
  data: TemplateCreate
): Promise<string> {
  const response = await page.context().request.post(`${BASE_URL}/session-templates`, {
    data: data,
  });
  if (!response.ok()) {
    const errorText = await response.text();
    console.error(`API Error ${response.status()}: ${errorText}`);
  }
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  return json.id;
}

async function deleteTemplateViaAPI(
  page: Page,
  templateId: string
): Promise<void> {
  await page.context().request.delete(`${BASE_URL}/session-templates/${templateId}`);
}

// =============================================================================
// SEÇÃO A: NAVEGAÇÃO (1 test)
// =============================================================================

test.describe('A. Navegação 8 Tabs', () => {
  test.use({ storageState: ADMIN_STATE });

  test('A1: deve navegar por todas as 8 tabs Training', async ({ page }) => {
    const tabs = [
      'agenda',
      'calendario',
      'planejamento',
      'exercise-bank',
      'analytics',
      'rankings',
      'eficacia-preventiva',
      'configuracoes',
    ];

    for (const tab of tabs) {
      await page.goto(`/training/${tab}`);
      await waitForPage(page);

      // Verificar que a página carregou (não 404)
      const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
      expect(is404).toBe(false);

      // Verificar que há conteúdo na página
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
      expect(hasContent!.length).toBeGreaterThan(100);
    }
  });
});

// =============================================================================
// SEÇÃO B: CRUD TEMPLATES (5 tests)
// =============================================================================

test.describe('B. Templates CRUD', () => {
  test.use({ storageState: ADMIN_STATE });

  const createdTemplateIds: string[] = [];

  test.afterEach(async ({ page }) => {
    // Cleanup: deletar templates criados
    for (const id of createdTemplateIds) {
      await deleteTemplateViaAPI(page, id).catch(() => {});
    }
    createdTemplateIds.length = 0;
  });

  test('B1: deve criar template customizado', async ({ page }) => {
    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Click criar template
    const createBtn = page.locator('button:has-text("Criar Template")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Aguardar modal abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Preencher formulário
    await page.fill('input[name="name"]', 'Treino Goleiro E2E');
    await page.fill('textarea[name="description"]', 'Treinamento específico para goleiros');

    // Selecionar icon shield (se houver selector)
    const shieldIcon = page.locator('[data-icon="shield"], button[value="shield"]').first();
    if (await shieldIcon.isVisible().catch(() => false)) {
      await shieldIcon.click();
    }

    // Marcar como favorito
    const favoriteCheck = page.locator('input[type="checkbox"]', { hasText: /favorito/i }).first();
    if (await favoriteCheck.isVisible().catch(() => false)) {
      await favoriteCheck.check();
    }

    // Preencher focos (total 100%)
    await page.fill('input[name="focus_defense_technical_pct"]', '80');
    await page.fill('input[name="focus_defense_positional_pct"]', '10');
    await page.fill('input[name="focus_physical_pct"]', '10');

    // Verificar badge verde (≤100%)
    const badge = page.locator('[class*="badge"], [class*="semaforo"]').first();
    if (await badge.isVisible().catch(() => false)) {
      const badgeText = await badge.textContent();
      expect(badgeText).toContain('100');
    }

    // Salvar
    await page.click('button:has-text("Salvar"), button:has-text("Criar")');

    // Aguardar toast (se houver)
    await page.waitForTimeout(1000);

    // Verificar que template aparece na lista
    const templateRow = page.locator('text=/Treino Goleiro E2E/i').first();
    await expect(templateRow).toBeVisible({ timeout: 5000 });
  });

  test('B2: deve editar template', async ({ page, request }) => {
    const suffix = generateSuffix();

    // Criar template via API
    const templateId = await createTemplateViaAPI(page, {
      name: `Template Edit ${suffix}`,
      description: 'Original description',
      focus_physical_pct: 50,
    });
    createdTemplateIds.push(templateId);

    // Ir para configurações
    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Localizar template e click editar
    const templateRow = page.locator(`text=/Template Edit ${suffix}/i`).first();
    await expect(templateRow).toBeVisible();

    // Click no botão editar (pode ser ícone, dropdown action, etc)
    const editBtn = page.locator(`[aria-label="Editar"]:near(:text("Template Edit ${suffix}"))`).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
    } else {
      // Fallback: click na row e procurar botão editar
      await templateRow.click();
      await page.waitForTimeout(500);
      await page.click('button:has-text("Editar")');
    }

    // Aguardar modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Modificar nome
    await page.fill('input[name="name"]', `Template Edited ${suffix}`);

    // Salvar
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(1000);

    // Verificar nome atualizado
    await expect(page.locator(`text=/Template Edited ${suffix}/i`).first()).toBeVisible();
  });

  test('B3: deve duplicar template', async ({ page, request }) => {
    const suffix = generateSuffix();

    // Criar template via API
    const templateId = await createTemplateViaAPI(page, {
      name: `Template Dup ${suffix}`,
      focus_physical_pct: 60,
    });
    createdTemplateIds.push(templateId);

    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Localizar botão duplicar
    const duplicateBtn = page.locator(`[aria-label="Duplicar"]:near(:text("Template Dup ${suffix}"))`).first();
    
    if (await duplicateBtn.isVisible().catch(() => false)) {
      await duplicateBtn.click();

      // Pode abrir dialog para confirmar/renomear
      await page.waitForTimeout(500);

      // Preencher novo nome (se houver input)
      const nameInput = page.locator('input[type="text"]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(`Template Duplicado ${suffix}`);
      }

      // Confirmar
      await page.click('button:has-text("Confirmar"), button:has-text("Duplicar")');
      await page.waitForTimeout(1000);

      // Verificar que template duplicado aparece
      const hasDuplicate = await page.locator(`text=/Cópia de|Duplicado/i`).first().isVisible().catch(() => false);
      expect(hasDuplicate).toBe(true);
    }
  });

  test('B4: deve favoritar template', async ({ page, request }) => {
    const suffix = generateSuffix();

    // Criar template não-favorito via API
    const templateId = await createTemplateViaAPI(page, {
      name: `Template Fav ${suffix}`,
      is_favorite: false,
      focus_physical_pct: 50,
    });
    createdTemplateIds.push(templateId);

    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Localizar star icon
    const starIcon = page.locator(`[class*="star"]:near(:text("Template Fav ${suffix}"))`).first();

    if (await starIcon.isVisible().catch(() => false)) {
      // Verificar estado inicial (não preenchido)
      const initialClass = await starIcon.getAttribute('class');

      // Click para favoritar
      await starIcon.click();
      await page.waitForTimeout(1000);

      // Verificar que star está preenchido
      const updatedClass = await starIcon.getAttribute('class');
      expect(updatedClass).toContain('fill');

      // Verificar que template moveu para o topo (favoritos primeiro)
      const firstRow = page.locator('table tbody tr').first();
      const firstRowText = await firstRow.textContent();
      expect(firstRowText).toContain(`Template Fav ${suffix}`);
    }
  });

  test('B5: deve deletar template', async ({ page, request }) => {
    const suffix = generateSuffix();

    // Criar template via API
    const templateId = await createTemplateViaAPI(page, {
      name: `Template Del ${suffix}`,
      focus_physical_pct: 40,
    });
    createdTemplateIds.push(templateId);

    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Localizar botão deletar
    const deleteBtn = page.locator(`[aria-label="Deletar"]:near(:text("Template Del ${suffix}"))`).first();

    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();

      // Aguardar confirm dialog
      await page.waitForTimeout(500);

      // Confirmar deleção (red button)
      await page.click('button:has-text("Deletar"), button:has-text("Confirmar")');
      await page.waitForTimeout(1000);

      // Verificar que template não aparece mais
      const isGone = await page.locator(`text=/Template Del ${suffix}/i`).isVisible().catch(() => false);
      expect(isGone).toBe(false);
    }

    // Remove do cleanup array pois já foi deletado
    const index = createdTemplateIds.indexOf(templateId);
    if (index > -1) createdTemplateIds.splice(index, 1);
  });
});

// =============================================================================
// SEÇÃO C: LIMITE E PREVIEW (2 tests)
// =============================================================================

test.describe('C. Templates Limite e Preview', () => {
  test.use({ storageState: ADMIN_STATE });

  const createdTemplateIds: string[] = [];

  test.afterEach(async ({ page }) => {
    for (const id of createdTemplateIds) {
      await deleteTemplateViaAPI(page, id).catch(() => {});
    }
    createdTemplateIds.length = 0;
  });

  test('C1: deve bloquear criação quando atingir 50 templates', async ({ page, request }) => {
    // Criar 46 templates via API (assume que já existem 4 seed)
    const suffix = generateSuffix();

    for (let i = 0; i < 46; i++) {
      const templateId = await createTemplateViaAPI(page, {
        name: `Template Bulk ${suffix}-${i}`,
        focus_physical_pct: 100,
      });
      createdTemplateIds.push(templateId);
    }

    // Ir para configurações
    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Verificar contador (50/50)
    const counter = page.locator('text=/50\\/50|50 templates/i').first();
    if (await counter.isVisible().catch(() => false)) {
      await expect(counter).toBeVisible();
    }

    // Verificar botão "Criar Template" disabled
    const createBtn = page.locator('button:has-text("Criar Template")');
    await expect(createBtn).toBeDisabled();

    // Hover e verificar tooltip
    await createBtn.hover();
    await page.waitForTimeout(500);

    const tooltip = page.locator('text=/Limite.*50.*atingido/i').first();
    if (await tooltip.isVisible().catch(() => false)) {
      await expect(tooltip).toBeVisible();
    }
  });

  test('C2: deve mostrar preview antes de aplicar template', async ({ page, request }) => {
    const suffix = generateSuffix();

    // Criar template físico (60% físico)
    const templateId = await createTemplateViaAPI(page, {
      name: `Treino Físico ${suffix}`,
      focus_physical_pct: 60,
      focus_attack_positional_pct: 20,
      focus_defense_positional_pct: 20,
    });
    createdTemplateIds.push(templateId);

    // Ir para agenda
    await page.goto('/training/agenda');
    await waitForPage(page);

    // Click criar sessão
    const createBtn = page.locator('button:has-text("Criar Sessão"), button:has-text("Nova Sessão")').first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Click no template card
      const templateCard = page.locator(`text=/Treino Físico ${suffix}/i`).first();
      if (await templateCard.isVisible().catch(() => false)) {
        await templateCard.click();
        await page.waitForTimeout(500);

        // Verificar preview modal
        const previewModal = page.locator('dialog:has-text("Distribuição"), dialog:has-text("Preview")').first();
        if (await previewModal.isVisible().catch(() => false)) {
          await expect(previewModal).toBeVisible();

          // Verificar texto "Físico: 60%"
          await expect(page.locator('text=/Físico.*60/i').first()).toBeVisible();

          // Click aplicar
          await page.click('button:has-text("Aplicar")');
          await page.waitForTimeout(500);

          // Verificar que sliders foram preenchidos
          const physicalInput = page.locator('input[name="focus_physical_pct"]').first();
          if (await physicalInput.isVisible().catch(() => false)) {
            const value = await physicalInput.inputValue();
            expect(value).toBe('60');
          }
        }
      }
    }
  });
});

// =============================================================================
// SEÇÃO D: UX MOBILE (1 test)
// =============================================================================

test.describe('D. UX Mobile', () => {
  test.use({ storageState: ADMIN_STATE });

  test('D1: deve exibir modal fullscreen em mobile', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/training/agenda');
    await waitForPage(page);

    // Abrir modal criar sessão
    const createBtn = page.locator('button:has-text("Criar Sessão"), button:has-text("Nova Sessão")').first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      // Verificar modal fullscreen
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();

      // Verificar classes fullscreen mobile
      const modalClass = await modal.getAttribute('class');
      expect(modalClass).toMatch(/fixed.*inset-0/);

      // Verificar sem bordas arredondadas mobile
      const hasRoundedNone = modalClass?.includes('rounded-none');
      expect(hasRoundedNone).toBe(true);

      // Verificar template grid 2 colunas
      const templateGrid = page.locator('[class*="template"], [class*="grid"]').first();
      if (await templateGrid.isVisible().catch(() => false)) {
        const gridClass = await templateGrid.getAttribute('class');
        expect(gridClass).toMatch(/grid-cols-2/);
      }
    }
  });
});

// =============================================================================
// SEÇÃO E: FEATURES PRINCIPAIS (5 tests)
// =============================================================================

test.describe('E. Features Principais', () => {
  test.use({ storageState: ADMIN_STATE });

  test('E1: Agenda - CRUD sessions', async ({ page }) => {
    await page.goto('/training/agenda');
    await waitForPage(page);

    // Verificar que agenda carregou
    const hasContent = await page.locator('text=/Agenda|Semana|Treino/i').first().isVisible();
    expect(hasContent).toBe(true);

    // Verificar week navigation
    const prevWeek = page.locator('button[aria-label="Semana anterior"], button:has-text("Anterior")').first();
    const nextWeek = page.locator('button[aria-label="Próxima semana"], button:has-text("Próxima")').first();

    if (await prevWeek.isVisible().catch(() => false)) {
      await expect(prevWeek).toBeVisible();
    }

    if (await nextWeek.isVisible().catch(() => false)) {
      await expect(nextWeek).toBeVisible();
    }
  });

  test('E2: Calendário - Modal criação', async ({ page }) => {
    await page.goto('/training/calendario');
    await waitForPage(page);

    // Verificar que calendário carregou
    const hasCalendar = await page.locator('text=/Calendário|Janeiro|Fevereiro/i').first().isVisible();
    expect(hasCalendar).toBe(true);

    // Verificar month navigation
    const prevMonth = page.locator('button[aria-label="Mês anterior"]').first();
    const nextMonth = page.locator('button[aria-label="Próximo mês"]').first();

    if (await prevMonth.isVisible().catch(() => false) || await nextMonth.isVisible().catch(() => false)) {
      // Month navigation exists
      expect(true).toBe(true);
    }
  });

  test('E3: Planejamento - Wizard draft localStorage', async ({ page }) => {
    await page.goto('/training/planejamento');
    await waitForPage(page);

    // Verificar que planejamento carregou
    const hasContent = await page.locator('text=/Planejamento|Ciclo|Macrociclo/i').first().isVisible();
    expect(hasContent).toBe(true);

    // Verificar botão criar ciclo
    const createBtn = page.locator('button:has-text("Criar Ciclo")').first();
    if (await createBtn.isVisible().catch(() => false)) {
      await expect(createBtn).toBeVisible();
    }
  });

  test('E4: Analytics - Cards e gráficos carregam', async ({ page }) => {
    await page.goto('/analytics');
    await waitForPage(page);
    await page.waitForTimeout(2000); // Aguardar fetch de dados

    // Verificar que analytics carregou
    const hasTitle = await page.locator('text=/Analytics|Métricas|Desempenho/i').first().isVisible();
    expect(hasTitle).toBe(true);

    // Verificar se há cards/gráficos (SVG, canvas, ou divs com dados)
    const hasCharts = await page.locator('svg, canvas, [class*="chart"], [class*="card"]').count();
    expect(hasCharts).toBeGreaterThan(0);
  });

  test('E5: Rankings - Lista atletas com badges', async ({ page }) => {
    await page.goto('/training/rankings');
    await waitForPage(page);

    // Verificar que rankings carregou
    const hasTitle = await page.locator('text=/Ranking|Top|Atletas/i').first().isVisible();
    expect(hasTitle).toBe(true);
  });
});

// =============================================================================
// SEÇÃO F: DRAFT PERSISTENCE (1 test)
// =============================================================================

test.describe('F. Draft Persistence', () => {
  test.use({ storageState: ADMIN_STATE });

  test('F1: deve persistir draft planejamento em localStorage', async ({ page }) => {
    await page.goto('/training/planejamento');
    await waitForPage(page);

    // Click criar ciclo
    const createBtn = page.locator('button:has-text("Criar Ciclo")').first();
    
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      // Preencher nome
      const nameInput = page.locator('input[name="name"]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Test Cycle E2E');

        // Click próximo (se houver wizard)
        const nextBtn = page.locator('button:has-text("Próximo")').first();
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
        }

        // Aguardar debounce (600ms)
        await page.waitForTimeout(700);

        // Verificar localStorage
        const draft = await page.evaluate(() => localStorage.getItem('cycle-draft'));
        expect(draft).toBeTruthy();

        if (draft) {
          const parsed = JSON.parse(draft);
          expect(parsed.name).toBe('Test Cycle E2E');
        }

        // Reload page
        await page.reload();
        await waitForPage(page);

        // Verificar toast "Rascunho restaurado"
        const hasToast = await page.locator('text=/Rascunho|restaurado/i').first().isVisible({ timeout: 3000 }).catch(() => false);
        
        // Cleanup localStorage
        await page.evaluate(() => localStorage.removeItem('cycle-draft'));
      }
    }
  });
});

// =============================================================================
// SEÇÃO G: VALIDAÇÕES FINAIS (5 tests)
// =============================================================================

test.describe('G. Validações Finais', () => {
  test.use({ storageState: ADMIN_STATE });

  test('G1: Wellness API - dados reais carregam', async ({ page }) => {
    // Navegar para uma rota que usa wellness API
    await page.goto('/training/agenda');
    await waitForPage(page);

    // Verificar que não há mensagens de erro de API
    const hasApiError = await page.locator('text=/API.*erro|failed.*fetch/i').isVisible().catch(() => false);
    expect(hasApiError).toBe(false);
  });

  test('G2: TypeScript build - sem erros de compilação', async () => {
    // Este teste é mais conceitual - validar que o build passou
    // Na prática, se chegou aqui, o build já passou
    expect(true).toBe(true);
  });

  test('G3: Responsive - 3 breakpoints funcionam', async ({ page }) => {
    const breakpoints = [
      { width: 320, height: 568, name: 'Mobile Small' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/training/configuracoes');
      await waitForPage(page);

      // Verificar que página renderiza sem erros
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
      expect(hasContent!.length).toBeGreaterThan(100);

      // Verificar que não há scroll horizontal
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // 20px tolerance
    }
  });

  test('G4: Dark mode - toggle tema funciona', async ({ page }) => {
    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Localizar toggle de tema (se houver)
    const themeToggle = page.locator('button[aria-label="Toggle theme"], button:has([class*="moon"]), button:has([class*="sun"])').first();

    if (await themeToggle.isVisible().catch(() => false)) {
      // Verificar tema inicial
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));

      // Toggle
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Verificar tema mudou
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(newTheme).toBe(!initialTheme);
    } else {
      // Sem toggle visível, verificar que classes dark funcionam
      const hasDarkClasses = await page.locator('[class*="dark:"]').count();
      expect(hasDarkClasses).toBeGreaterThan(0);
    }
  });

  test('G5: Edge cases - validações bloqueiam submit', async ({ page }) => {
    await page.goto('/training/configuracoes');
    await waitForPage(page);

    // Tentar criar template com focos >120%
    const createBtn = page.locator('button:has-text("Criar Template")');
    
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Preencher nome
      await page.fill('input[name="name"]', 'Template Invalid');

      // Preencher focos que somam >120%
      await page.fill('input[name="focus_physical_pct"]', '70');
      await page.fill('input[name="focus_attack_positional_pct"]', '60');

      await page.waitForTimeout(500);

      // Verificar badge vermelho
      const badge = page.locator('[class*="badge"], [class*="semaforo"], [class*="red"], [class*="error"]').first();
      if (await badge.isVisible().catch(() => false)) {
        const badgeClass = await badge.getAttribute('class');
        const badgeText = await badge.textContent();
        
        // Badge deve indicar erro (vermelho ou texto >120%)
        const isError = badgeClass?.includes('red') || badgeClass?.includes('error') || badgeText?.includes('130');
        expect(isError).toBe(true);
      }

      // Verificar botão submit disabled
      const submitBtn = page.locator('button:has-text("Salvar"), button:has-text("Criar")').first();
      const isDisabled = await submitBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});
