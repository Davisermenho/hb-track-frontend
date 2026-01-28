/**
 * Global Teardown - Limpeza de dados E2E após toda a suíte
 * 
 * REGRAS:
 * 1. Só executa se E2E=1 (guard obrigatório)
 * 2. Apaga apenas dados com namespace E2E (name LIKE 'E2E-%')
 * 3. Nunca apaga dados da org E2E fixa (apenas teams criados dinamicamente)
 * 4. É uma "rede de segurança" - cleanup principal é no afterAll de cada spec
 * 
 * DADOS LIMPOS:
 * - Teams com nome 'E2E-%' (exceto E2E-Base-Team)
 * - TeamMemberships de teams deletados
 * - Convites pendentes da org E2E
 */

import { FullConfig } from '@playwright/test';

// IDs fixos E2E (devem bater com seed_e2e.py)
const E2E_ORG_ID = 'e2e00000-0000-0000-0000-000000000001';
const E2E_TEAM_BASE_ID = 'e2e00000-0000-0000-0004-000000000001';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function globalTeardown(config: FullConfig) {
  // Guard: só executar em ambiente E2E
  if (process.env.E2E !== '1') {
    console.log('⚠️ Global Teardown: E2E não está ativo. Pulando cleanup.');
    return;
  }

  console.log('\n🧹 Global Teardown: Iniciando limpeza de dados E2E...\n');

  try {
    // Login como admin E2E para ter permissão de deletar
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: process.env.TEST_ADMIN_EMAIL || 'e2e.admin@teste.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123',
      }),
    });

    if (!loginRes.ok) {
      console.log('⚠️ Global Teardown: Falha no login admin. Pulando cleanup.');
      return;
    }

    const { access_token } = await loginRes.json();

    // Buscar todos os teams da org E2E
    const teamsRes = await fetch(`${API_BASE}/teams?organization_id=${E2E_ORG_ID}&limit=100`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!teamsRes.ok) {
      console.log('⚠️ Global Teardown: Falha ao buscar teams. Pulando cleanup.');
      return;
    }

    const teamsData = await teamsRes.json();
    const teams = teamsData.items || teamsData || [];

    // Filtrar teams E2E dinâmicos (exceto o base)
    const teamsToDelete = teams.filter((t: any) => 
      t.name?.startsWith('E2E-') && 
      t.id !== E2E_TEAM_BASE_ID
    );

    console.log(`   Encontrados ${teamsToDelete.length} teams E2E para limpar`);

    // Deletar cada team
    let deleted = 0;
    for (const team of teamsToDelete) {
      try {
        const delRes = await fetch(`${API_BASE}/teams/${team.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${access_token}` },
        });
        
        if (delRes.ok) {
          deleted++;
        }
      } catch (e) {
        // Ignora erros individuais
      }
    }

    console.log(`   ✅ Deletados ${deleted} teams E2E`);
    console.log('\n🧹 Global Teardown: Limpeza concluída!\n');

  } catch (error) {
    console.log('⚠️ Global Teardown: Erro durante cleanup:', error);
    // Não falha a suíte por erro de cleanup
  }
}

export default globalTeardown;
