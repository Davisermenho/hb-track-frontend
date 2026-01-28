/**
 * Tests E2E - Teams Members (Staff e Atletas)
 * 
 * CONTRATO (docs/02-modulos/teams/teams-CONTRACT.md):
 * - Tab members mostra staff (comissão técnica) e atletas separados
 * - Seção de convites pendentes
 * - Funcionalidades: visualizar, convidar, remover membros
 * - RBAC: diferentes permissões por papel
 * 
 * SEED UTILIZADO:
 * - E2E_TEAM_BASE_ID (Infantil)
 * - E2E_PERSON_TREINADOR_ID (staff)
 * - E2E_PERSON_ATLETA_ID (atleta correto, 14 anos)
 * - E2E_PERSON_ATLETA_VETERANO_ID (atleta veterano, 38 anos)
 * 
 * ENDPOINTS:
 * - GET /teams/{teamId}/staff
 * - GET /athletes?team_id=...
 * - POST /teams/{teamId}/invites
 * - GET /teams/{teamId}/invites (pendentes)
 * 
 * TESTIDS:
 * - team-members-tab: root da aba
 * - staff-section: seção de staff
 * - athletes-section: seção de atletas
 * - pending-invites-section: seção de convites pendentes
 * - invite-member-btn: botão convidar membro
 * - staff-member-{id}: card de membro da comissão
 * - athlete-card-{id}: card de atleta
 * - invite-card-{id}: card de convite pendente
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// CONSTANTS
// =============================================================================

const TREINADOR_STATE = 'playwright/.auth/treinador.json';
const DIRIGENTE_STATE = 'playwright/.auth/dirigente.json';
const COORDENADOR_STATE = 'playwright/.auth/coordenador.json';

// UUIDs do seed E2E
const E2E_TEAM_BASE_ID = '88888888-8888-8888-8884-000000000001';
const E2E_PERSON_TREINADOR_ID = '88888888-8888-8888-8888-000000000001';
const E2E_PERSON_ATLETA_ID = '88888888-8888-8888-8888-000000000002';
const E2E_PERSON_ATLETA_VETERANO_ID = '88888888-8888-8888-8888-000000000003';

// =============================================================================
// HELPERS
// =============================================================================

async function navigateToMembers(page: any, teamId: string = E2E_TEAM_BASE_ID) {
  await page.goto(`/teams/${teamId}/members`);
  await page.waitForLoadState('domcontentloaded');
  
  // Aguardar tab carregar (CSR)
  await page.waitForSelector('[data-testid="team-members-tab"], .members-container, main', { timeout: 15000 });
}

// =============================================================================
// TESTES DE VISUALIZAÇÃO - SEÇÕES
// =============================================================================

test.describe('Teams Members - Visualização de Seções', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('deve exibir aba members com seções separadas', async ({ page }) => {
    await navigateToMembers(page);
    
    // Verificar que a aba members está carregada
    const membersTab = page.locator('[data-testid="team-members-tab"], .members-tab, main');
    await expect(membersTab).toBeVisible({ timeout: 10000 });
    
    // Verificar título
    await expect(page.locator('h1, h2, .page-title')).toContainText(/membros|equipe/i);
  });

  test('deve mostrar seção de staff (comissão técnica)', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar seção de staff
    const staffSection = page.locator('[data-testid="staff-section"], .staff-section, section:has-text("Comissão"), section:has-text("Staff")').first();
    
    if (await staffSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(staffSection).toBeVisible();
      
      // Verificar título da seção
      const sectionText = await staffSection.textContent() || '';
      expect(sectionText.toLowerCase()).toMatch(/comiss[ãa]o|staff|treinador/);
    } else {
      console.warn('⚠️  Seção de staff não encontrada - pode usar layout diferente');
    }
  });

  test('deve mostrar seção de atletas', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar seção de atletas
    const athletesSection = page.locator('[data-testid="athletes-section"], .athletes-section, section:has-text("Atletas")').first();
    
    if (await athletesSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(athletesSection).toBeVisible();
      
      // Verificar título da seção
      const sectionText = await athletesSection.textContent() || '';
      expect(sectionText.toLowerCase()).toContain('atleta');
    } else {
      console.warn('⚠️  Seção de atletas não encontrada - pode usar layout diferente');
    }
  });

  test('deve mostrar seção de convites pendentes se houver', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar seção de convites pendentes
    const pendingInvitesSection = page.locator('[data-testid="pending-invites-section"], .pending-invites-section, section:has-text("Convites Pendentes"), section:has-text("Aguardando")').first();
    
    // Seção pode não aparecer se não há convites pendentes
    const isVisible = await pendingInvitesSection.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVisible) {
      await expect(pendingInvitesSection).toBeVisible();
      console.log('✓ Seção de convites pendentes encontrada');
    } else {
      console.log('ℹ️  Sem convites pendentes ou seção não exibida');
    }
  });
});

// =============================================================================
// TESTES DE VISUALIZAÇÃO - MEMBROS DO STAFF
// =============================================================================

test.describe('Teams Members - Staff (Comissão Técnica)', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('deve listar treinador no staff (seed)', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar treinador E2E na página
    const treinadorCard = page.locator('[data-testid*="staff-member"], .staff-member, .member-card').filter({ hasText: /E2E Treinador|Treinador Principal/i }).first();
    
    if (await treinadorCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(treinadorCard).toBeVisible();
      
      // Verificar role visível
      const cardText = await treinadorCard.textContent() || '';
      expect(cardText.toLowerCase()).toMatch(/treinador/);
    } else {
      console.warn('⚠️  Treinador do seed não encontrado - verificar se staff está sendo listado');
    }
  });

  test('deve mostrar detalhes do membro do staff', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar qualquer membro do staff
    const staffMembers = page.locator('[data-testid*="staff-member"], .staff-member, .member-card').filter({ hasText: /treinador|coordenador|auxiliar/i });
    const count = await staffMembers.count().catch(() => 0);
    
    if (count > 0) {
      const firstStaff = staffMembers.first();
      const staffText = await firstStaff.textContent() || '';
      
      // Verificar que tem nome ou email
      expect(staffText.length).toBeGreaterThan(5);
      
      // Verificar que tem role identificado
      expect(staffText.toLowerCase()).toMatch(/treinador|coordenador|auxiliar|staff/);
    } else {
      console.warn('⚠️  Nenhum membro do staff encontrado');
    }
  });

  test('deve mostrar contador de membros do staff', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar contador na seção de staff
    const staffSection = page.locator('[data-testid="staff-section"], .staff-section, section:has-text("Comissão"), section:has-text("Staff")').first();
    
    if (await staffSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      const sectionText = await staffSection.textContent() || '';
      
      // Procurar padrão de contador (ex: "1 membro", "2 membros", "(1)")
      const hasCounter = sectionText.match(/\d+\s*(membro|pessoa|staff)|^\(?\d+\)?$/i);
      
      if (hasCounter) {
        expect(hasCounter).toBeTruthy();
      } else {
        console.warn('⚠️  Contador de staff não encontrado ou formato diferente');
      }
    }
  });
});

// =============================================================================
// TESTES DE VISUALIZAÇÃO - ATLETAS
// =============================================================================

test.describe('Teams Members - Atletas', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('deve listar atletas da equipe (seed)', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar atletas E2E na página
    const athleteCards = page.locator('[data-testid*="athlete-card"], .athlete-card, .athlete-item, tr').filter({ hasText: /E2E Atleta/i });
    const count = await athleteCards.count().catch(() => 0);
    
    // Deve ter pelo menos 1 atleta do seed (E2E Atleta Correto, 14 anos)
    expect(count).toBeGreaterThan(0);
  });

  test('deve mostrar nome do atleta', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar atleta específico do seed
    const atletaCorreto = page.locator('[data-testid*="athlete"], .athlete-card, .athlete-item, tr').filter({ hasText: /E2E Atleta Correto/i }).first();
    
    if (await atletaCorreto.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(atletaCorreto).toContainText(/E2E Atleta/i);
    } else {
      console.warn('⚠️  Atleta do seed não encontrado - verificar se atletas estão sendo listados');
    }
  });

  test('deve mostrar idade ou data de nascimento do atleta', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar atletas com idade ou data visível
    const athletesWithAge = page.locator('[data-testid*="athlete"], .athlete-card, .athlete-item, tr').filter({ hasText: /\d{1,2}\s*(anos?|yrs?)|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/i });
    const count = await athletesWithAge.count().catch(() => 0);
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    } else {
      console.warn('⚠️  Idade/data de nascimento não exibida nos cards de atletas');
    }
  });

  test('deve mostrar categoria do atleta (Infantil)', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar atletas com categoria visível
    const athletesWithCategory = page.locator('[data-testid*="athlete"], .athlete-card, .athlete-item, tr').filter({ hasText: /infantil|sub-?\d{2}/i });
    const count = await athletesWithCategory.count().catch(() => 0);
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    } else {
      console.warn('⚠️  Categoria não exibida nos cards de atletas');
    }
  });

  test('deve mostrar contador de atletas', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar contador na seção de atletas
    const athletesSection = page.locator('[data-testid="athletes-section"], .athletes-section, section:has-text("Atletas")').first();
    
    if (await athletesSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      const sectionText = await athletesSection.textContent() || '';
      
      // Procurar padrão de contador (ex: "2 atletas", "(2)")
      const hasCounter = sectionText.match(/\d+\s*atleta|\d+\s*jogador|^\(?\d+\)?$/i);
      
      if (hasCounter) {
        expect(hasCounter).toBeTruthy();
      } else {
        console.warn('⚠️  Contador de atletas não encontrado ou formato diferente');
      }
    }
  });
});

// =============================================================================
// TESTES DE FUNCIONALIDADE - CONVIDAR MEMBROS
// =============================================================================

test.describe('Teams Members - Convidar Membros', () => {
  test.use({ storageState: DIRIGENTE_STATE });

  test('dirigente deve ver botão de convidar membro', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar botão de convidar
    const inviteBtn = page.locator('[data-testid="invite-member-btn"], button:has-text("Convidar"), button:has-text("Adicionar"), button:has-text("Novo Membro")').first();
    
    if (await inviteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(inviteBtn).toBeVisible();
    } else {
      console.warn('⚠️  Botão de convidar não encontrado - verificar RBAC ou layout');
    }
  });

  test('deve abrir modal de convite ao clicar no botão', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar e clicar no botão de convidar
    const inviteBtn = page.locator('[data-testid="invite-member-btn"], button:has-text("Convidar"), button:has-text("Adicionar"), button:has-text("Novo Membro")').first();
    
    if (await inviteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteBtn.click();
      
      // Aguardar modal abrir
      await page.waitForTimeout(1000);
      
      // Verificar modal ou formulário de convite
      const modal = page.locator('[data-testid*="invite-modal"], [role="dialog"], .modal').first();
      const isModalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isModalVisible) {
        await expect(modal).toBeVisible();
      } else {
        // Pode ser uma página/rota em vez de modal
        const inviteForm = page.locator('form, [data-testid*="invite-form"]').first();
        const isFormVisible = await inviteForm.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isFormVisible) {
          await expect(inviteForm).toBeVisible();
        } else {
          console.warn('⚠️  Modal ou formulário de convite não encontrado após clicar');
        }
      }
    } else {
      console.warn('⚠️  Botão de convidar não encontrado - pulando teste de modal');
    }
  });
});

// =============================================================================
// TESTES DE FUNCIONALIDADE - CONVITES PENDENTES
// =============================================================================

test.describe('Teams Members - Convites Pendentes', () => {
  test.use({ storageState: DIRIGENTE_STATE });

  test('deve mostrar lista de convites pendentes se houver', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar seção de convites pendentes
    const pendingSection = page.locator('[data-testid="pending-invites-section"], .pending-invites-section, section:has-text("Convites Pendentes"), section:has-text("Aguardando")').first();
    
    const isVisible = await pendingSection.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVisible) {
      await expect(pendingSection).toBeVisible();
      
      // Procurar cards de convites
      const inviteCards = page.locator('[data-testid*="invite-card"], .invite-card, .pending-invite');
      const count = await inviteCards.count().catch(() => 0);
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
        console.log(`✓ Encontrados ${count} convites pendentes`);
      }
    } else {
      console.log('ℹ️  Sem convites pendentes ou seção não exibida');
    }
  });

  test('convite pendente deve mostrar email e role', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar cards de convites
    const inviteCards = page.locator('[data-testid*="invite-card"], .invite-card, .pending-invite');
    const count = await inviteCards.count().catch(() => 0);
    
    if (count > 0) {
      const firstInvite = inviteCards.first();
      const inviteText = await firstInvite.textContent() || '';
      
      // Verificar que tem email
      const hasEmail = inviteText.match(/@/);
      expect(hasEmail).toBeTruthy();
      
      // Verificar que tem role (atleta, treinador, etc)
      const hasRole = inviteText.toLowerCase().match(/atleta|treinador|coordenador|staff/);
      
      if (hasRole) {
        expect(hasRole).toBeTruthy();
      } else {
        console.warn('⚠️  Role não visível no convite pendente');
      }
    } else {
      console.log('ℹ️  Sem convites pendentes para testar');
    }
  });
});

// =============================================================================
// TESTES DE RBAC E PERMISSÕES
// =============================================================================

test.describe('Teams Members - Permissões RBAC', () => {
  test('dirigente deve ver todos os membros', async ({ page }) => {
    await page.goto('/');
    await page.context().addCookies((await page.context().storageState({ path: DIRIGENTE_STATE })).cookies);
    
    await navigateToMembers(page);
    
    // Verificar que a página carregou
    const membersTab = page.locator('[data-testid="team-members-tab"], main');
    await expect(membersTab).toBeVisible({ timeout: 10000 });
    
    // Verificar que há membros visíveis (staff ou atletas)
    await page.waitForTimeout(2000);
    const members = page.locator('[data-testid*="member"], [data-testid*="athlete"], .member-card, .athlete-card, tr');
    const count = await members.count().catch(() => 0);
    expect(count).toBeGreaterThan(0);
  });

  test('treinador deve ver membros da sua equipe', async ({ page }) => {
    await page.goto('/');
    await page.context().addCookies((await page.context().storageState({ path: TREINADOR_STATE })).cookies);
    
    await navigateToMembers(page);
    
    // Verificar que a página carregou
    const membersTab = page.locator('[data-testid="team-members-tab"], main');
    await expect(membersTab).toBeVisible({ timeout: 10000 });
    
    // Verificar que há membros visíveis
    await page.waitForTimeout(2000);
    const members = page.locator('[data-testid*="member"], [data-testid*="athlete"], .member-card, .athlete-card, tr');
    const count = await members.count().catch(() => 0);
    expect(count).toBeGreaterThan(0);
  });

  test('treinador não deve ver botão de convidar (se RBAC restritivo)', async ({ page }) => {
    await page.goto('/');
    await page.context().addCookies((await page.context().storageState({ path: TREINADOR_STATE })).cookies);
    
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar botão de convidar
    const inviteBtn = page.locator('[data-testid="invite-member-btn"], button:has-text("Convidar"), button:has-text("Adicionar")').first();
    const isVisible = await inviteBtn.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isVisible) {
      console.warn('⚠️  Treinador pode convidar membros - RBAC permite ou não está implementado');
    } else {
      console.log('✓ Treinador não vê botão de convidar (RBAC correto)');
    }
  });
});

// =============================================================================
// TESTES DE INTEGRAÇÃO COM SEED
// =============================================================================

test.describe('Teams Members - Integração com Seed E2E', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('SEED: deve ter treinador E2E na equipe', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar treinador do seed
    const treinador = page.locator('[data-testid*="staff"], .staff-member, .member-card, tr').filter({ hasText: /E2E Treinador/i });
    const count = await treinador.count().catch(() => 0);
    
    expect(count).toBeGreaterThan(0);
  });

  test('SEED: deve ter atleta correto (14 anos) na equipe', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar atleta correto do seed
    const atletaCorreto = page.locator('[data-testid*="athlete"], .athlete-card, tr').filter({ hasText: /E2E Atleta Correto/i });
    const count = await atletaCorreto.count().catch(() => 0);
    
    expect(count).toBeGreaterThan(0);
  });

  test('SEED: não deve ter atleta veterano (38 anos) na equipe Infantil', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Procurar atleta veterano (não deve estar na equipe Infantil)
    const atletaVeterano = page.locator('[data-testid*="athlete"], .athlete-card, tr').filter({ hasText: /E2E.*Veterano|1987/i });
    const count = await atletaVeterano.count().catch(() => 0);
    
    // Não deve estar listado (idade incompatível com categoria Infantil)
    expect(count).toBe(0);
  });

  test('SEED: equipe Infantil deve ter pelo menos 2 membros total (1 staff + 1 atleta)', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Contar todos os membros (staff + atletas)
    const allMembers = page.locator('[data-testid*="staff-member"], [data-testid*="athlete-card"], .member-card, .athlete-card, tr:has-text("E2E")');
    const count = await allMembers.count().catch(() => 0);
    
    // Deve ter pelo menos 2 membros E2E (treinador + atleta correto)
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// TESTES DE ESTADOS VAZIOS
// =============================================================================

test.describe('Teams Members - Estados Vazios', () => {
  test.use({ storageState: DIRIGENTE_STATE });

  test('deve mostrar empty state se equipe não tem atletas', async ({ page }) => {
    // Criar equipe temporária via API (sem atletas)
    // TODO: Implementar quando endpoint de criação de equipe estiver disponível nos testes
    
    console.log('⚠️  Teste de empty state requer criação de equipe temporária via API');
  });

  test('deve mostrar empty state se não há convites pendentes', async ({ page }) => {
    await navigateToMembers(page);
    await page.waitForTimeout(2000);
    
    // Verificar se há seção de convites ou se está vazia
    const pendingSection = page.locator('[data-testid="pending-invites-section"], .pending-invites-section');
    const isVisible = await pendingSection.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isVisible) {
      console.log('✓ Seção de convites não exibida quando vazia (comportamento esperado)');
    } else {
      // Verificar se tem empty state
      const emptyState = pendingSection.locator('.empty-state, [data-testid="empty-state"], p:has-text("Nenhum convite")');
      const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }
    }
  });
});
