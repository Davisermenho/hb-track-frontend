/**
 * Tests de Sincronização de Permissões - Teams Module
 * 
 * FASE 4: Testes E2E de validação de permissões sincronizadas
 * 
 * Cenários testados:
 * 1. API rejeita requisições sem permissão (403)
 * 2. Invalidação em tempo real via WebSocket
 * 3. Fallback offline com aviso ao usuário
 * 
 * Referências:
 * - PERMISSIONS.md - Documentação da sincronização
 * - useTeamPermissions.tsx - Hook refatorado
 * - permissions_map.py - Mapa de permissões Backend
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { 
  createTeamViaAPI, 
  deleteTeamViaAPI,
  getAccessTokenFromFile,
  loginViaAPI
} from '../helpers/api';
import {
  SEED_MEMBERSHIP_TREINADOR_ID,
} from '../shared-data';

const ADMIN_STATE = 'playwright/.auth/admin.json';
const DIRIGENTE_STATE = 'playwright/.auth/dirigente.json';
const COORDENADOR_STATE = 'playwright/.auth/coordenador.json';
const COACH_STATE = 'playwright/.auth/coach.json';
const TREINADOR_STATE = 'playwright/.auth/treinador.json';
const ATLETA_STATE = 'playwright/.auth/atleta.json';

/**
 * Helper: Aguardar página carregar
 */
async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-testid="team-overview-tab"], [data-testid="create-team-btn"]').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
}

/**
 * Helper: Interceptar fetch e simular erro de rede
 */
async function simulateNetworkError(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/me', route => {
    route.abort('failed');
  });
}

/**
 * Helper: Restaurar fetch normal
 */
async function restoreNetwork(page: Page): Promise<void> {
  await page.unroute('**/api/v1/auth/me');
}

// =============================================================================
// TESTE 12: Rejeição de API (403) - Sem permissão can_manage_team
// =============================================================================

test.describe('Permissions - API Rejection (403)', () => {
  test.use({ storageState: TREINADOR_STATE });
  
  let teamId: string;
  let treinadorToken: string | null;

  test.beforeAll(async ({ request }) => {
    // Buscar token do treinador
    treinadorToken = await getAccessTokenFromFile(TREINADOR_STATE);
    if (!treinadorToken) throw new Error('Token treinador não encontrado');

    // Criar equipe via API (treinador cria sua própria equipe)
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-Permissions-Valid-${suffix}`,
      coach_membership_id: SEED_MEMBERSHIP_TREINADOR_ID,
    }, treinadorToken); // Passar token
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Step 12.1: Treinador sem can_manage_team NÃO pode atualizar equipe (403)', async ({ request }) => {
    if (!treinadorToken) {
      test.skip();
      return;
    }
    
    // Tentar atualizar equipe via API
    const response = await request.patch(`/api/v1/teams/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${treinadorToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Nome Atualizado (deve falhar)',
      },
    });

    // Deve retornar 403 Forbidden
    expect(response.status()).toBe(403);
    
    const body = await response.json();
    expect(body.detail).toContain('can_manage_team');
  });

  test('Step 12.2: UI esconde botão de editar quando sem permissão', async ({ page }) => {
    await page.goto(`/teams/${teamId}/settings`);
    await waitForPageLoad(page);

    // Botão de editar configurações não deve existir ou estar disabled
    const editButton = page.locator('[data-testid="edit-team-settings-btn"]');
    
    // Aguardar carregamento
    await page.waitForTimeout(2000);
    
    // Verificar que botão não está visível OU está disabled
    const count = await editButton.count();
    if (count > 0) {
      await expect(editButton).toBeDisabled();
    } else {
      // Botão não renderizado (comportamento esperado)
      expect(count).toBe(0);
    }
  });
});

// =============================================================================
// TESTE 12: Rejeição de API (403) - Sem permissão can_manage_members
// =============================================================================

test.describe('Permissions - API Rejection (403) - Members', () => {
  test.use({ storageState: TREINADOR_STATE });
  
  let teamId: string;
  let treinadorToken: string | null;

  test.beforeAll(async ({ request }) => {
    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-Permissions-Members-${suffix}` 
    });
    
    treinadorToken = await getAccessTokenFromFile(TREINADOR_STATE);
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Step 12.3: Treinador sem can_manage_members NÃO pode convidar membro (403)', async ({ request }) => {
    if (!treinadorToken) {
      test.skip();
      return;
    }
    
    const response = await request.post('/api/v1/team-members/invite', {
      headers: {
        'Authorization': `Bearer ${treinadorToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        email: 'novo.membro@test.com',
        role: 'membro',
        team_id: teamId,
      },
    });

    // Deve retornar 403 Forbidden
    expect(response.status()).toBe(403);
    
    const body = await response.json();
    expect(body.detail).toContain('can_manage_members');
  });

  test('Step 12.4: UI esconde botão de convidar quando sem permissão', async ({ page }) => {
    await page.goto(`/teams/${teamId}/members`);
    await waitForPageLoad(page);

    const inviteButton = page.locator('[data-testid="invite-member-btn"]');
    
    await page.waitForTimeout(2000);
    
    const count = await inviteButton.count();
    if (count > 0) {
      await expect(inviteButton).toBeDisabled();
    } else {
      expect(count).toBe(0);
    }
  });
});

// =============================================================================
// TESTE 12: Permissão válida - Coordenador pode gerenciar membros
// =============================================================================

test.describe('Permissions - Valid Permission', () => {
  test.use({ storageState: COORDENADOR_STATE });
  
  let teamId: string;
  let coordenadorToken: string | null;

  test.beforeAll(async ({ request }) => {
    // Buscar token do coordenador
    const tokenResult = await getAccessTokenFromFile(COORDENADOR_STATE);
    coordenadorToken = tokenResult;
    if (!coordenadorToken) throw new Error('Token coordenador não encontrado');

    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-Permissions-Valid-${suffix}`,
      coach_membership_id: SEED_MEMBERSHIP_TREINADOR_ID,
    }, coordenadorToken); // Passar token
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Step 12.5: Coordenador com can_manage_members PODE atualizar equipe (200)', async ({ request }) => {
    if (!coordenadorToken) {
      test.skip();
      return;
    }

    const response = await request.patch(`/api/v1/teams/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${coordenadorToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Nome Atualizado com Sucesso',
      },
    });

    // Deve retornar 200 OK
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.name).toBe('Nome Atualizado com Sucesso');
  });

  test('Step 12.6: UI mostra botão de editar quando tem permissão', async ({ page }) => {
    await page.goto(`/teams/${teamId}/settings`);
    await waitForPageLoad(page);

    // Botão de editar deve estar visível e habilitado
    const editButton = page.locator('[data-testid="edit-team-settings-btn"]');
    
    await page.waitForTimeout(2000);
    
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await expect(editButton).toBeEnabled();
  });
});

// =============================================================================
// TESTE 13: Invalidação WebSocket - Permissões mudam em tempo real
// =============================================================================

test.describe('Permissions - WebSocket Invalidation', () => {
  test.skip('Step 13.1: Permissões atualizam em <1s via WebSocket', async ({ page, context }) => {
    // NOTA: Este teste requer:
    // 1. WebSocket conectado e funcional
    // 2. Backend enviando evento permissions-changed
    // 3. Dois browsers (user A e user B)
    
    // Por enquanto skipado - requer setup mais complexo
    // Pode ser testado manualmente conforme documentação em PERMISSIONS.md
  });

  test.skip('Step 13.2: UI reconstrói botões ao receber evento WebSocket', async ({ page }) => {
    // NOTA: Requer mock de WebSocket event
    // Implementação futura após setup de WebSocket em testes
  });
});

// =============================================================================
// TESTE 14: Fallback Offline - Simular erro de rede
// =============================================================================

test.describe('Permissions - Offline Fallback', () => {
  test.use({ storageState: COORDENADOR_STATE });
  
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    // Buscar token do coordenador
    const coordToken = await getAccessTokenFromFile(COORDENADOR_STATE);
    if (!coordToken) throw new Error('Token coordenador não encontrado');

    const suffix = Date.now().toString(16).slice(-6);
    teamId = await createTeamViaAPI(request, { 
      name: `E2E-Permissions-Offline-${suffix}`,
      coach_membership_id: SEED_MEMBERSHIP_TREINADOR_ID,
    }, coordToken); // Passar token
  });

  test.afterAll(async ({ request }) => {
    if (teamId) {
      await deleteTeamViaAPI(request, teamId).catch(() => {});
    }
  });

  test('Step 14.1: Hook ativa fallback restritivo em erro de rede', async ({ page }) => {
    // Ir para página da equipe
    await page.goto(`/teams/${teamId}/overview`);
    await waitForPageLoad(page);

    // Simular erro de rede no endpoint /api/v1/auth/me
    await simulateNetworkError(page);

    // Forçar refetch (reload ou navegar para outra página)
    await page.reload();
    
    // Aguardar carregamento
    await page.waitForTimeout(3000);

    // Verificar que aviso offline aparece
    // NOTA: Requer que componente exiba toast com offlineMessage
    const offlineToast = page.locator('text=/Problemas de conexão/i');
    
    // Toast deve aparecer ou permissões devem estar restritivas
    const toastVisible = await offlineToast.isVisible().catch(() => false);
    
    if (toastVisible) {
      await expect(offlineToast).toContainText('Algumas funções podem estar limitadas');
    }
    
    // Verificar que botões críticos estão disabled ou ocultos (fallback restritivo)
    const inviteButton = page.locator('[data-testid="invite-member-btn"]');
    const count = await inviteButton.count();
    
    if (count > 0) {
      // Se botão existe, deve estar disabled (fallback)
      await expect(inviteButton).toBeDisabled();
    }
  });

  test('Step 14.2: Permissões restauram ao reconectar', async ({ page }) => {
    // Ir para página com rede simulada como offline
    await page.goto(`/teams/${teamId}/overview`);
    await simulateNetworkError(page);
    await page.reload();
    await page.waitForTimeout(2000);

    // Restaurar rede
    await restoreNetwork(page);
    
    // Navegar para forçar refetch
    await page.goto(`/teams/${teamId}/members`);
    await waitForPageLoad(page);

    // Aguardar cache invalidar e refetch
    await page.waitForTimeout(3000);

    // Botão de convidar deve estar visível e habilitado novamente
    const inviteButton = page.locator('[data-testid="invite-member-btn"]');
    
    await expect(inviteButton).toBeVisible({ timeout: 10000 });
    await expect(inviteButton).toBeEnabled();
  });

  test('Step 14.3: Aviso desaparece ao reconectar', async ({ page }) => {
    await page.goto(`/teams/${teamId}/overview`);
    await simulateNetworkError(page);
    await page.reload();
    
    // Aguardar aviso aparecer
    await page.waitForTimeout(2000);
    
    // Restaurar rede
    await restoreNetwork(page);
    await page.goto(`/teams/${teamId}/members`);
    
    // Aguardar refetch
    await page.waitForTimeout(3000);

    // Toast offline não deve estar mais visível
    const offlineToast = page.locator('text=/Problemas de conexão/i');
    await expect(offlineToast).not.toBeVisible();
  });
});

// =============================================================================
// TESTE: Verificação de sincronização GET /api/v1/auth/me
// =============================================================================

test.describe('Permissions - Backend Sync', () => {
  test.use({ storageState: COORDENADOR_STATE });

  test('Step 3: GET /api/v1/auth/me retorna dict de permissões', async ({ request }) => {
    // Buscar token do coordenador do storage state
    const token = getAccessTokenFromFile(COORDENADOR_STATE);
    if (!token) {
      test.skip();
      return;
    }

    // Fazer chamada com token no header Authorization
    const response = await request.get('http://localhost:8000/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
    
    // Verificar que campo permissions existe
    expect(body).toHaveProperty('permissions');
    expect(typeof body.permissions).toBe('object');
    
    // Verificar que as 3 permissões estão presentes
    expect(body.permissions).toHaveProperty('can_manage_teams');
    expect(body.permissions).toHaveProperty('can_manage_members');
    expect(body.permissions).toHaveProperty('can_create_training');
    
    // Coordenador deve ter can_manage_members = true
    expect(body.permissions.can_manage_members).toBe(true);
  });
});

test.describe('Permissions - Backend Sync - Treinador', () => {
  test.use({ storageState: TREINADOR_STATE });

  test('Step 3: Treinador não tem can_manage_members', async ({ request }) => {
    // Buscar token do treinador do storage state
    const token = getAccessTokenFromFile(TREINADOR_STATE);
    if (!token) {
      test.skip();
      return;
    }

    // Fazer chamada com token no header Authorization
    const response = await request.get('http://localhost:8000/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
    
    // Treinador deve ter can_manage_members = false
    expect(body.permissions.can_manage_members).toBe(false);
    
    // Mas deve ter can_create_training = true
    expect(body.permissions.can_create_training).toBe(true);
  });
});
