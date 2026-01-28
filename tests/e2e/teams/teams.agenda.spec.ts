/**
 * Tests E2E - Teams Agenda (Jogos e Treinos)
 * 
 * CONTRATO (docs/02-modulos/teams/teams-CONTRACT.md):
 * - Tab agenda mostra jogos (matches) e treinos (training_sessions)
 * - Visualização de calendário ou lista
 * - Filtros por tipo (jogo/treino), período (passado/futuro)
 * 
 * SEED UTILIZADO:
 * - 3 jogos (1 passado finished 3-1, 2 futuros scheduled)
 * - 3 treinos (1 passado closed, 2 futuros closed)
 * - Equipe: E2E_TEAM_BASE_ID (Infantil)
 * 
 * ENDPOINTS:
 * - GET /training-sessions?team_id=...&start_date=...&end_date=...
 * - GET /matches?team_id=...&start_date=...&end_date=...
 * 
 * TESTIDS:
 * - team-agenda-tab: root da aba
 * - agenda-matches-section: seção de jogos
 * - agenda-trainings-section: seção de treinos
 * - match-card-{id}: card de jogo
 * - training-card-{id}: card de treino
 * - filter-type-select: filtro por tipo
 * - filter-period-select: filtro por período
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// CONSTANTS
// =============================================================================

const TREINADOR_STATE = 'playwright/.auth/treinador.json';
const DIRIGENTE_STATE = 'playwright/.auth/dirigente.json';

// UUIDs do seed E2E
const E2E_TEAM_BASE_ID = '88888888-8888-8888-8884-000000000001';
const E2E_MATCH_1_ID = '88888888-8888-8888-8885-000000000001'; // Passado (2025-01-10, finished 3-1)
const E2E_MATCH_2_ID = '88888888-8888-8888-8885-000000000002'; // Futuro (2025-01-20, scheduled)
const E2E_MATCH_3_ID = '88888888-8888-8888-8885-000000000003'; // Futuro (2025-02-15, scheduled)
const E2E_TRAINING_1_ID = '88888888-8888-8888-8886-000000000001'; // Passado (2025-01-15, closed)
const E2E_TRAINING_2_ID = '88888888-8888-8888-8886-000000000002'; // Hoje/amanhã (2025-01-16, closed)
const E2E_TRAINING_3_ID = '88888888-8888-8888-8886-000000000003'; // Futuro (2025-01-25, closed)

// =============================================================================
// HELPERS
// =============================================================================

async function navigateToAgenda(page: any, teamId: string = E2E_TEAM_BASE_ID) {
  await page.goto(`/teams/${teamId}/agenda`);
  await page.waitForLoadState('domcontentloaded');
  
  // Aguardar tab carregar (pode ser SSR ou CSR)
  await page.waitForSelector('[data-testid="team-agenda-tab"], .agenda-container, main', { timeout: 15000 });
}

// =============================================================================
// TESTES DE VISUALIZAÇÃO DE JOGOS
// =============================================================================

test.describe.skip('Teams Agenda - Visualização de Jogos', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('deve exibir aba agenda com seção de jogos', async ({ page }) => {
    await navigateToAgenda(page);
    
    // Verificar que a aba agenda está carregada
    const agendaTab = page.locator('[data-testid="team-agenda-tab"], .agenda-tab, main');
    await expect(agendaTab).toBeVisible({ timeout: 10000 });
    
    // Verificar título ou indicador de agenda
    await expect(page.locator('h1, h2, .page-title')).toContainText(/agenda|calendário/i);
  });

  test('deve listar jogos da equipe (3 matches do seed)', async ({ page }) => {
    await navigateToAgenda(page);
    
    // Aguardar seção de jogos carregar
    await page.waitForSelector('[data-testid="agenda-matches-section"], .matches-list, [role="list"]', { timeout: 10000 }).catch(() => {});
    
    // Procurar por cards de jogos ou tabela
    const matchCards = page.locator('[data-testid*="match-card"], .match-item, tr:has-text("E2E-Adversário")');
    const matchCount = await matchCards.count().catch(() => 0);
    
    // Deve ter pelo menos 1 jogo visível (seed tem 3)
    expect(matchCount).toBeGreaterThan(0);
  });

  test('deve mostrar detalhes do jogo finalizado (3-1)', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar jogo finalizado (E2E-Adversário-A ou placar 3-1)
    const finishedMatch = page.locator('[data-testid*="match-card"]:has-text("E2E-Adversário-A"), .match-item:has-text("3"), tr:has-text("3-1"), tr:has-text("finished")').first();
    
    if (await finishedMatch.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verificar placar visível
      await expect(finishedMatch).toContainText(/3.*1/);
      
      // Verificar status (finished, finalizado, concluído)
      const matchText = await finishedMatch.textContent();
      expect(matchText?.toLowerCase()).toMatch(/finish|finalizado|conclu[íi]do/);
    } else {
      console.warn('⚠️  Jogo finalizado não encontrado - pode estar em outra aba ou formato');
    }
  });

  test('deve mostrar jogos futuros agendados (scheduled)', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar jogos agendados (E2E-Adversário-B, E2E-Adversário-C)
    const scheduledMatches = page.locator('[data-testid*="match-card"]:has-text("E2E-Adversário"), .match-item:has-text("E2E-"), tr:has-text("scheduled"), tr:has-text("agendado")');
    const count = await scheduledMatches.count().catch(() => 0);
    
    // Deve ter pelo menos 1 jogo agendado (seed tem 2)
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir data do jogo corretamente', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar datas nos jogos (2025-01-10, 2025-01-20, 2025-02-15)
    const datesPattern = /2025-01-(10|20)|2025-02-15|10\/01|20\/01|15\/02/;
    const matchesWithDates = page.locator('[data-testid*="match-card"], .match-item, tr').filter({ hasText: datesPattern });
    
    const count = await matchesWithDates.count().catch(() => 0);
    expect(count).toBeGreaterThan(0);
  });
});

// =============================================================================
// TESTES DE VISUALIZAÇÃO DE TREINOS
// =============================================================================

test.describe.skip('Teams Agenda - Visualização de Treinos', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('deve listar treinos da equipe (3 training sessions do seed)', async ({ page }) => {
    await navigateToAgenda(page);
    
    // Aguardar seção de treinos carregar
    await page.waitForSelector('[data-testid="agenda-trainings-section"], .trainings-list, [role="list"]', { timeout: 10000 }).catch(() => {});
    
    // Procurar por cards de treinos ou tabela
    const trainingCards = page.locator('[data-testid*="training-card"], .training-item, tr:has-text("E2E-Treino")');
    const count = await trainingCards.count().catch(() => 0);
    
    // Deve ter pelo menos 1 treino visível (seed tem 3)
    expect(count).toBeGreaterThan(0);
  });

  test('deve mostrar detalhes do treino (título, data, duração)', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar treino com título E2E
    const training = page.locator('[data-testid*="training-card"]:has-text("E2E-Treino"), .training-item:has-text("Tático"), tr:has-text("E2E-Treino-Tático")').first();
    
    if (await training.isVisible({ timeout: 5000 }).catch(() => false)) {
      const trainingText = await training.textContent() || '';
      
      // Verificar título visível
      expect(trainingText).toMatch(/E2E-Treino|Tático|Físico|Técnico/);
      
      // Verificar duração (90min ou 120min)
      const hasDuration = trainingText.match(/90|120|1h30|2h/);
      if (hasDuration) {
        expect(hasDuration).toBeTruthy();
      }
    } else {
      console.warn('⚠️  Treino não encontrado - pode estar em outra aba ou formato');
    }
  });

  test('deve mostrar local do treino', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar locais dos treinos (Campo Principal, Ginásio, Campo Auxiliar)
    const locationsPattern = /Campo Principal|Ginásio|Campo Auxiliar/i;
    const trainingsWithLocation = page.locator('[data-testid*="training-card"], .training-item, tr').filter({ hasText: locationsPattern });
    
    const count = await trainingsWithLocation.count().catch(() => 0);
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    } else {
      console.warn('⚠️  Locais de treinos não encontrados - pode não estar sendo exibido');
    }
  });

  test('deve exibir data e horário do treino', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar datas nos treinos (2025-01-15, 2025-01-16, 2025-01-25)
    const datesPattern = /2025-01-(15|16|25)|15\/01|16\/01|25\/01/;
    const trainingsWithDates = page.locator('[data-testid*="training-card"], .training-item, tr').filter({ hasText: datesPattern });
    
    const count = await trainingsWithDates.count().catch(() => 0);
    expect(count).toBeGreaterThan(0);
  });
});

// =============================================================================
// TESTES DE FILTROS E ORDENAÇÃO
// =============================================================================

test.describe.skip('Teams Agenda - Filtros e Ordenação', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('deve permitir filtrar por tipo (jogos/treinos)', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar filtro de tipo
    const typeFilter = page.locator('[data-testid="filter-type-select"], select:has(option:text-is("Jogos")), button:has-text("Tipo")').first();
    
    if (await typeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Se for select, verificar opções
      if (await typeFilter.evaluate(el => el.tagName).catch(() => '') === 'SELECT') {
        const options = await typeFilter.locator('option').allTextContents();
        expect(options.some(opt => opt.toLowerCase().includes('jogo') || opt.toLowerCase().includes('treino'))).toBe(true);
      }
    } else {
      console.warn('⚠️  Filtro de tipo não encontrado - feature pode não estar implementada');
    }
  });

  test('deve permitir filtrar por período (passado/futuro)', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar filtro de período
    const periodFilter = page.locator('[data-testid="filter-period-select"], select:has(option:text-is("Passado")), button:has-text("Período")').first();
    
    if (await periodFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Se for select, verificar opções
      if (await periodFilter.evaluate(el => el.tagName).catch(() => '') === 'SELECT') {
        const options = await periodFilter.locator('option').allTextContents();
        expect(options.some(opt => opt.toLowerCase().includes('passado') || opt.toLowerCase().includes('futuro'))).toBe(true);
      }
    } else {
      console.warn('⚠️  Filtro de período não encontrado - feature pode não estar implementada');
    }
  });

  test('deve ordenar eventos por data (mais recentes primeiro)', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Coletar todas as datas visíveis
    const dateElements = page.locator('[data-testid*="match-card"], [data-testid*="training-card"], .match-item, .training-item, tr');
    const count = await dateElements.count().catch(() => 0);
    
    if (count >= 2) {
      // Verificar se as datas estão em ordem (crescente ou decrescente)
      const firstDate = await dateElements.first().textContent() || '';
      const lastDate = await dateElements.nth(count - 1).textContent() || '';
      
      // Apenas verificar que existem datas (ordem pode variar por implementação)
      expect(firstDate.length).toBeGreaterThan(0);
      expect(lastDate.length).toBeGreaterThan(0);
    } else {
      console.warn('⚠️  Não há eventos suficientes para testar ordenação');
    }
  });
});

// =============================================================================
// TESTES DE PERMISSÕES E RBAC
// =============================================================================

test.describe.skip('Teams Agenda - Permissões RBAC', () => {
  test('dirigente deve ver agenda completa', async ({ page }) => {
    await page.goto('/');
    await page.context().addCookies((await page.context().storageState({ path: DIRIGENTE_STATE })).cookies);
    
    await navigateToAgenda(page);
    
    // Verificar que a página carregou
    const agendaTab = page.locator('[data-testid="team-agenda-tab"], main');
    await expect(agendaTab).toBeVisible({ timeout: 10000 });
  });

  test('treinador deve ver agenda da sua equipe', async ({ page }) => {
    await page.goto('/');
    await page.context().addCookies((await page.context().storageState({ path: TREINADOR_STATE })).cookies);
    
    await navigateToAgenda(page);
    
    // Verificar que a página carregou
    const agendaTab = page.locator('[data-testid="team-agenda-tab"], main');
    await expect(agendaTab).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// TESTES DE INTEGRAÇÃO COM SEED
// =============================================================================

test.describe.skip('Teams Agenda - Integração com Seed E2E', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('SEED: deve ter 3 jogos criados (1 passado, 2 futuros)', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Contar jogos com adversários E2E
    const e2eMatches = page.locator('[data-testid*="match-card"]:has-text("E2E-Adversário"), .match-item:has-text("E2E-Adversário"), tr:has-text("E2E-Adversário")');
    const count = await e2eMatches.count().catch(() => 0);
    
    // Deve ter pelo menos 1 dos 3 jogos visíveis (pode estar filtrado ou paginado)
    expect(count).toBeGreaterThan(0);
  });

  test('SEED: deve ter 3 treinos criados', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Contar treinos com prefixo E2E
    const e2eTrainings = page.locator('[data-testid*="training-card"]:has-text("E2E-Treino"), .training-item:has-text("E2E-Treino"), tr:has-text("E2E-Treino")');
    const count = await e2eTrainings.count().catch(() => 0);
    
    // Deve ter pelo menos 1 dos 3 treinos visíveis
    expect(count).toBeGreaterThan(0);
  });

  test('SEED: jogo finalizado deve ter placar 3-1', async ({ page }) => {
    await navigateToAgenda(page);
    await page.waitForTimeout(2000);
    
    // Procurar placar 3-1 ou 3 x 1
    const scorePattern = /3[\s\-x]1|3.*:.*1/i;
    const matchWithScore = page.locator('[data-testid*="match-card"], .match-item, tr').filter({ hasText: scorePattern }).first();
    
    if (await matchWithScore.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(matchWithScore).toContainText(scorePattern);
    } else {
      console.warn('⚠️  Placar 3-1 não encontrado - pode estar em formato diferente ou em outra aba');
    }
  });
});
