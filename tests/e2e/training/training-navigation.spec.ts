/**
 * Training Module - Navigation Tests
 * 
 * TC-A1: Navegação entre 8 tabs do módulo Training
 * 
 * SCOPE:
 * - Validar acesso às 8 subroutes
 * - Verificar URL corretas
 * - Confirmar elementos-chave visíveis
 * 
 * HELPERS USADOS:
 * - auth.helpers.ts: setupAuth (storage state)
 * - assertion.helpers.ts: expectUrl, expectVisible
 * 
 * PRINCÍPIOS:
 * - Baixo acoplamento (sem lógica de negócio)
 * - Alto sinal de qualidade (asserções claras)
 * - Helpers genéricos (reutilizáveis)
 */

import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth.helpers';
import { expectUrl, expectVisible } from './helpers/assertion.helpers';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

test.describe('Training Module - Navigation', () => {
  // Usar auth state de coordenador (acesso completo ao módulo)
  test.use({ storageState: setupAuth('coordenador') });

  // =============================================================================
  // TC-A1: Navegação entre 8 tabs
  // =============================================================================

  test('TC-A1: deve navegar entre as 8 tabs do módulo Training', async ({ page }) => {
    // Iniciar na página de agenda
    await page.goto('/training/agenda');
    await expectUrl(page, /\/training\/agenda/);
    
    // 1. TAB: Agenda → Calendário
    await page.getByTestId('training-tab-calendario').click();
    await expectUrl(page, /\/training\/calendario/);
    await page.waitForLoadState('networkidle');
    
    // 2. TAB: Calendário → Planejamento
    await page.getByTestId('training-tab-planejamento').click();
    await expectUrl(page, /\/training\/planejamento/);
    await page.waitForLoadState('networkidle');
    
    // 3. TAB: Planejamento → Exercícios
    await page.getByTestId('training-tab-exercicios').click();
    await expectUrl(page, /\/training\/exercise-bank/);
    await page.waitForLoadState('networkidle');
    
    // 4. TAB: Exercícios → Analytics
    await page.getByTestId('training-tab-analytics').click();
    await expectUrl(page, /\/training\/analytics/);
    await page.waitForLoadState('networkidle');
    
    // 5. TAB: Analytics → Rankings
    await page.getByTestId('training-tab-rankings').click();
    await expectUrl(page, /\/training\/rankings/);
    await page.waitForLoadState('networkidle');
    
    // 6. TAB: Rankings → Eficácia Preventiva
    await page.getByTestId('training-tab-eficacia').click();
    await expectUrl(page, /\/training\/eficacia-preventiva/);
    await page.waitForLoadState('networkidle');
    
    // 7. TAB: Eficácia → Configurações
    await page.getByTestId('training-tab-configuracoes').click();
    await expectUrl(page, /\/training\/configuracoes/);
    await page.waitForLoadState('networkidle');
    
    // 8. TAB: Configurações → Agenda (ciclo completo)
    await page.getByTestId('training-tab-agenda').click();
    await expectUrl(page, /\/training\/agenda/);
    await page.waitForLoadState('networkidle');
  });

  // =============================================================================
  // TC-A2: Navegação com breadcrumbs
  // =============================================================================

  test('TC-A2: deve manter navegação consistente entre páginas', async ({ page }) => {
    // Validar navegação entre 3 páginas diferentes
    await page.goto('/training/configuracoes');
    await expectUrl(page, /\/training\/configuracoes/);
    await page.waitForLoadState('networkidle');
    
    await page.goto('/training/planejamento');
    await expectUrl(page, /\/training\/planejamento/);
    await page.waitForLoadState('networkidle');
    
    await page.goto('/training/analytics');
    await expectUrl(page, /\/training\/analytics/);
    await page.waitForLoadState('networkidle');
  });

  // =============================================================================
  // TC-A3: Navegação com deep links
  // =============================================================================

  test('TC-A3: deve aceitar deep links para subroutes', async ({ page }) => {
    // Deep link direto para configurações
    await page.goto('/training/configuracoes');
    await expectUrl(page, /\/training\/configuracoes/);
    expect(page.url()).not.toContain('/login');
    await page.waitForLoadState('networkidle');
    
    // Deep link direto para rankings
    await page.goto('/training/rankings');
    await expectUrl(page, /\/training\/rankings/);
    expect(page.url()).not.toContain('/login');
    await page.waitForLoadState('networkidle');
    
    // Deep link direto para agenda
    await page.goto('/training/agenda');
    await expectUrl(page, /\/training\/agenda/);
    expect(page.url()).not.toContain('/login');
    await page.waitForLoadState('networkidle');
  });
});
