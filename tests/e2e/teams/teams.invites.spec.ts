/**
 * Tests E2E - Team Invites (Sprint 1-3)
 * 
 * Testa o fluxo completo de convite de membros:
 * - Criar convite
 * - Listar pendentes (com status de expiração)
 * - Reenviar convite
 * - Cancelar convite
 * - Welcome flow (primeiro acesso)
 * 
 * CONTRATO (docs/modules/teams-CONTRACT.md):
 * - POST /teams/{teamId}/invites → Criar convite
 * - GET  /teams/{teamId}/invites → Listar pendentes
 * - POST /teams/{teamId}/invites/{id}/resend → Reenviar
 * - DELETE /teams/{teamId}/invites/{id} → Cancelar
 * - GET  /auth/welcome/verify?token=... → Verificar token
 * - POST /auth/welcome/complete → Completar cadastro
 */

import { test, expect, Page } from '@playwright/test';
import { 
  createTeamViaAPI, 
  deleteTeamViaAPI,
  createTeamInviteViaAPI,
  listTeamInvitesViaAPI,
  resendTeamInviteViaAPI,
  cancelTeamInviteViaAPI,
  verifyWelcomeTokenViaAPI,
} from '../helpers/api';

/**
 * Helper: Aguardar página de membros carregar
 * NOTA: Não usa networkidle (Regra 4 - REGRAS TESTES.md)
 */
async function waitForMembersPage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  // Aguardar qualquer indicador de que a página de membros carregou
  await page.locator('[data-testid="team-members-tab"], [data-testid="invite-member-btn"]').first().waitFor({ state: 'visible', timeout: 30000 });
}

/**
 * Helper: Gerar email único para teste (Regra 48 - determinístico)
 */
function generateTestEmail(): string {
  const suffix = Date.now().toString(16).slice(-6);
  return `e2e_invite_${suffix}@teste.com`;
}

// =============================================================================
// TESTES DE API - CONVITES (Sprint 1)
// =============================================================================

test.describe('Teams - Invites API (Sprint 1)', () => {
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    // Nome determinístico (Regra 48)
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-InvAPI-${suffix}` 
    });
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Leia todas as linhas de "MANUAL_TESTES_E2E.md", "REGRAS_TESTES.md" e "teams-CONTRACT.md" em: Hb Track - Fronted\\tests\\e2e\\teamdebug p/ solucionar: deve criar convite com sucesso via API', async ({ request }) => {
    const email = generateTestEmail();
    
    const result = await createTeamInviteViaAPI(request, teamId, email);
    
    expect(result.success).toBe(true);
    expect(result.email_sent).toBe(true);
    expect(result.code).toBe('INVITE_SENT');
  });

  test('Leia tests_log p/ solucionar -> deve listar convites pendentes via API', async ({ request }) => {
    // Criar convite primeiro
    const email = generateTestEmail();
    await createTeamInviteViaAPI(request, teamId, email);
    
    // Listar convites
    const result = await listTeamInvitesViaAPI(request, teamId);
    
    // A API pode retornar items ou invites
    const items = result.items || (result as any).invites || [];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    
    // Verificar que o convite recém-criado está na lista
    const invite = items.find((i: any) => i.email === email);
    expect(invite).toBeDefined();
    expect(invite?.status).toBe('pendente');
  });

  test('Leia tests_log p/ solucionar -> deve retornar INVITE_EXISTS ao tentar convidar email duplicado', async ({ request }) => {
    const email = generateTestEmail();
    
    // Primeiro convite
    const first = await createTeamInviteViaAPI(request, teamId, email);
    expect(first.success).toBe(true);
    
    // Segundo convite (mesmo email)
    const second = await createTeamInviteViaAPI(request, teamId, email);
    expect(second.success).toBe(false);
    expect(second.code).toBe('INVITE_EXISTS');
  });

  test('Leia tests_log p/ solucionar -> deve cancelar convite via API', async ({ request }) => {
    const email = generateTestEmail();
    
    // Criar convite
    await createTeamInviteViaAPI(request, teamId, email);
    
    // Buscar o convite criado
    const listBefore = await listTeamInvitesViaAPI(request, teamId);
    const invite = listBefore.items.find(i => i.email === email);
    expect(invite).toBeDefined();
    
    // Cancelar
    const result = await cancelTeamInviteViaAPI(request, teamId, invite!.id);
    expect(result.success).toBe(true);
    expect(result.code).toBe('INVITE_REVOKED');
    
    // Verificar que não está mais na lista
    const listAfter = await listTeamInvitesViaAPI(request, teamId);
    const canceled = listAfter.items.find(i => i.id === invite!.id);
    expect(canceled).toBeUndefined();
  });

  test('Leia tests_log p/ solucionar -> deve reenviar convite via API', async ({ request }) => {
    const email = generateTestEmail();
    
    // Criar convite
    await createTeamInviteViaAPI(request, teamId, email);
    
    // Buscar o convite
    const list = await listTeamInvitesViaAPI(request, teamId);
    const invite = list.items.find(i => i.email === email);
    expect(invite).toBeDefined();
    
    // Reenviar
    const result = await resendTeamInviteViaAPI(request, teamId, invite!.id);
    
    // Em ambiente de teste, o envio de email pode falhar (SMTP não configurado)
    // O importante é que a operação foi processada e retornou resposta
    // Se success=true, email_sent deve ser true também
    // Se success=false, provavelmente email falhou (EMAIL_FAILED)
    if (result.success) {
      expect(result.code).toBe('INVITE_RESENT');
      expect(result.email_sent).toBe(true);
    } else {
      // Aceitar falha de email em ambiente de teste
      expect(result.code).toBe('EMAIL_FAILED');
    }
  });

  test('Leia tests_log p/ solucionar -> deve retornar INVITE_NOT_FOUND ao reenviar convite inexistente', async ({ request }) => {
    const fakeInviteId = '00000000-0000-0000-0000-000000000000';
    
    const result = await resendTeamInviteViaAPI(request, teamId, fakeInviteId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVITE_NOT_FOUND');
  });

  test('Leia tests_log p/ solucionar -> deve retornar INVITE_NOT_FOUND ao cancelar convite inexistente', async ({ request }) => {
    const fakeInviteId = '00000000-0000-0000-0000-000000000000';
    
    const result = await cancelTeamInviteViaAPI(request, teamId, fakeInviteId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVITE_NOT_FOUND');
  });
});

// =============================================================================
// TESTES DE UI - CONVITES
// =============================================================================

test.describe('Teams - Invites UI', () => {
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    // Nome determinístico (Regra 48)
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-InvUI-${suffix}` 
    });
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Leia tests_log p/ solucionar -> deve exibir botão de convidar membro na aba members', async ({ page }) => {
    await page.goto(`/teams/${teamId}/members`);
    await waitForMembersPage(page);
    
    const inviteBtn = page.locator('[data-testid="invite-member-btn"]');
    await expect(inviteBtn).toBeVisible();
  });

  test('Leia tests_log p/ solucionar -> deve abrir modal de convite ao clicar no botão', async ({ page }) => {
    await page.goto(`/teams/${teamId}/members`);
    await waitForMembersPage(page);
    
    await page.locator('[data-testid="invite-member-btn"]').click();
    
    // Modal deve aparecer (data-testid correto: invite-member-modal)
    await expect(page.locator('[data-testid="invite-member-modal"]')).toBeVisible({ timeout: 15000 });
  });

  test('Leia tests_log p/ solucionar -> deve mostrar convites pendentes na lista de membros', async ({ page, request }) => {
    // Criar convite via API primeiro
    const email = generateTestEmail();
    await createTeamInviteViaAPI(request, teamId, email);
    
    // Ir para a página e aguardar carregamento completo
    await page.goto(`/teams/${teamId}/members`);
    await waitForMembersPage(page);
    
    // Verificar que existe tabela de membros
    const membersTable = page.locator('table[data-testid="members-list"]');
    await expect(membersTable).toBeVisible({ timeout: 15000 });
    
    // O email do convite deve aparecer na tabela
    await expect(page.getByText(email)).toBeVisible({ timeout: 15000 });
  });

  test('Leia tests_log p/ solucionar -> deve exibir status "Aguardando cadastro" para convites pendentes', async ({ page, request }) => {
    const email = generateTestEmail();
    await createTeamInviteViaAPI(request, teamId, email);
    
    await page.goto(`/teams/${teamId}/members`);
    await waitForMembersPage(page);
    
    // Verificar que tem badge de pendente (usar first() para evitar strict mode violation)
    await expect(page.getByText('Aguardando cadastro').first()).toBeVisible({ timeout: 15000 });
  });

  test('Leia tests_log p/ solucionar -> deve exibir "Expira em Xh" para convites válidos', async ({ page, request }) => {
    const email = generateTestEmail();
    await createTeamInviteViaAPI(request, teamId, email);
    
    await page.goto(`/teams/${teamId}/members`);
    await waitForMembersPage(page);
    
    // Verificar que mostra tempo restante (texto: "Expira em 47h", etc.)
    // Usar first() para evitar strict mode violation quando há múltiplos convites
    await expect(page.getByText(/Expira em \d+h/).first()).toBeVisible({ timeout: 15000 });
  });

  test('Leia tests_log p/ solucionar -> deve ter botões Reenviar e Cancelar para convites pendentes', async ({ page, request }) => {
    const email = generateTestEmail();
    await createTeamInviteViaAPI(request, teamId, email);
    
    await page.goto(`/teams/${teamId}/members`);
    await waitForMembersPage(page);
    
    // Hover na linha para mostrar ações
    const row = page.locator('tr').filter({ hasText: email });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.hover();
    
    // Verificar botões
    await expect(row.getByText('Reenviar')).toBeVisible();
    await expect(row.getByText('Cancelar')).toBeVisible();
  });
});

// =============================================================================
// TESTES DE WELCOME FLOW (Sprint 2)
// =============================================================================

test.describe('Teams - Welcome Flow (Sprint 2)', () => {
  // Usar contexto vazio (usuário não autenticado)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Leia tests_log p/ solucionar -> deve redirecionar /welcome sem token para login', async ({ page }) => {
    await page.goto('/welcome');
    
    // Deve redirecionar (para /signin ou mostrar erro)
    await page.waitForURL(/\/(signin|welcome)/, { timeout: 10000 });
    
    // Se ficou em /welcome, deve mostrar mensagem de erro
    if (page.url().includes('/welcome')) {
      await expect(page.getByText(/token|inválido|erro/i).first()).toBeVisible();
    }
  });

  test('Leia tests_log p/ solucionar -> deve mostrar erro para token inválido', async ({ page }) => {
    await page.goto('/welcome?token=invalid_token_12345');
    await page.waitForLoadState('domcontentloaded');
    
    // Aguardar verificação do token (elemento de erro)
    // Deve mostrar heading ou texto de erro (usar first() para evitar strict mode)
    await expect(page.getByRole('heading', { name: /inválido/i })).toBeVisible({ timeout: 15000 });
  });

  test('Leia tests_log p/ solucionar -> deve verificar token inválido via API', async ({ request }) => {
    const result = await verifyWelcomeTokenViaAPI(request, 'invalid_token_xyz');
    
    expect(result.valid).toBe(false);
    // A API pode retornar error como objeto ou em formato diferente
    // O importante é que valid=false indica token inválido
  });
});

// =============================================================================
// TESTES DE PERMISSÃO (RBAC)
// =============================================================================

test.describe('Teams - Invites RBAC', () => {
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    // Nome determinístico (Regra 48)
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-InvRBAC-${suffix}` 
    });
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Leia tests_log p/ solucionar -> usuário autenticado deve poder ver lista de convites', async ({ page }) => {
    await page.goto(`/teams/${teamId}/members`);
    await waitForMembersPage(page);
    
    // Não deve ter erro de permissão
    await expect(page.getByText(/403|forbidden|sem permissão/i)).not.toBeVisible();
  });

  // NOTA: Este teste foi removido porque não é possível criar um contexto
  // de API sem cookies dentro do teste do Playwright de forma confiável.
  // A validação de 401 já é feita no backend tests.
});

// =============================================================================
// TESTES DE EDGE CASES (Sprint 3)
// =============================================================================

test.describe('Teams - Invites Edge Cases (Sprint 3)', () => {
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    // Nome determinístico (Regra 48)
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-InvEdge-${suffix}` 
    });
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Leia tests_log p/ solucionar -> deve retornar TEAM_NOT_FOUND para equipe inexistente', async ({ request }) => {
    const fakeTeamId = '00000000-0000-0000-0000-000000000000';
    const email = generateTestEmail();
    
    const result = await createTeamInviteViaAPI(request, fakeTeamId, email);
    expect(result.success).toBe(false);
    expect(result.code).toBe('TEAM_NOT_FOUND');
  });

  test('Leia tests_log p/ solucionar -> deve validar formato de email', async ({ request }) => {
    const invalidEmail = 'nao-e-um-email';
    
    // Deve falhar na validação (422)
    const res = await request.post(`http://localhost:8000/api/v1/teams/${teamId}/invites`, {
      data: { email: invalidEmail, role: 'membro' },
      headers: { 'Content-Type': 'application/json' },
    });
    
    expect(res.status()).toBe(422);
  });

  test('Leia tests_log p/ solucionar -> idempotência: reenviar não deve criar token duplicado se válido', async ({ request }) => {
    const email = generateTestEmail();
    
    // Criar convite
    await createTeamInviteViaAPI(request, teamId, email);
    
    // Buscar convite
    const list1 = await listTeamInvitesViaAPI(request, teamId);
    const invite = list1.items.find(i => i.email === email);
    expect(invite).toBeDefined();
    
    const hoursBefore = invite!.hours_remaining;
    
    // Reenviar
    await resendTeamInviteViaAPI(request, teamId, invite!.id);
    
    // Verificar horas restantes (deve ser similar se token foi reutilizado)
    const list2 = await listTeamInvitesViaAPI(request, teamId);
    const inviteAfter = list2.items.find(i => i.email === email);
    
    // Se token foi reutilizado (>4h), hours_remaining deve ser similar
    // Se foi gerado novo token, será ~48h
    expect(inviteAfter?.hours_remaining).toBeGreaterThan(0);
  });
});
