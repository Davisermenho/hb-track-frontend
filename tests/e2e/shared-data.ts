/**
 * Dados compartilhados para testes E2E
 *
 * IMPORTANTE: Estes IDs devem ser idênticos aos definidos em:
 * - Backend: scripts/seed_e2e.py
 *
 * Padrão de IDs E2E: 88888888-8888-8888-XXXX-YYYYYYYYYY
 * Onde:
 * - XXXX: Tipo de recurso
 *   - 8888: Organization
 *   - 8881: Pessoas (Person)
 *   - 8882: Usuários (User)
 *   - 8883: Org Memberships
 *   - 8884: Teams
 * - YYYYYYYYYY: Sequencial do recurso
 */

// Organização E2E
export const SEED_ORG_ID = '88888888-8888-8888-8888-000000000001'
export const SEED_ORG_NAME = 'E2E-HBTRACK-TEST-ORG'

// Team Base E2E
export const SEED_TEAM_ID = '88888888-8888-8888-8884-000000000001'
export const SEED_TEAM_NAME = 'E2E-Base-Team'

// Season E2E
export const SEED_SEASON_ID = '88888888-8888-8888-8888-000000000010'
export const SEED_SEASON_NAME = 'E2E-Temporada-2026'

// Pessoas E2E
export const SEED_PERSON_ADMIN_ID = '88888888-8888-8888-8881-000000000001'
export const SEED_PERSON_DIRIGENTE_ID = '88888888-8888-8888-8881-000000000002'
export const SEED_PERSON_COORDENADOR_ID = '88888888-8888-8888-8881-000000000003'
export const SEED_PERSON_TREINADOR_ID = '88888888-8888-8888-8881-000000000004'
export const SEED_PERSON_ATLETA_ID = '88888888-8888-8888-8881-000000000005'
export const SEED_PERSON_MEMBRO_ID = '88888888-8888-8888-8881-000000000006'

// Usuários E2E
export const SEED_USER_ADMIN_ID = '88888888-8888-8888-8882-000000000001'
export const SEED_USER_DIRIGENTE_ID = '88888888-8888-8888-8882-000000000002'
export const SEED_USER_COORDENADOR_ID = '88888888-8888-8888-8882-000000000003'
export const SEED_USER_TREINADOR_ID = '88888888-8888-8888-8882-000000000004'
export const SEED_USER_ATLETA_ID = '88888888-8888-8888-8882-000000000005'
export const SEED_USER_MEMBRO_ID = '88888888-8888-8888-8882-000000000006'

// Org Memberships E2E
export const SEED_MEMBERSHIP_ADMIN_ID = '88888888-8888-8888-8883-000000000000'  // admin é dirigente
export const SEED_MEMBERSHIP_COORDENADOR_ID = '88888888-8888-8888-8883-000000000002'
export const SEED_MEMBERSHIP_TREINADOR_ID = '88888888-8888-8888-8883-000000000003'
export const SEED_MEMBERSHIP_ATLETA_ID = '88888888-8888-8888-8883-000000000004'
export const SEED_MEMBERSHIP_MEMBRO_ID = '88888888-8888-8888-8883-000000000005'

// Emails dos usuários E2E
export const SEED_ADMIN_EMAIL = 'e2e.admin@teste.com'  // dirigente
export const SEED_COORDENADOR_EMAIL = 'e2e.coordenador@teste.com'
export const SEED_TREINADOR_EMAIL = 'e2e.treinador@teste.com'
export const SEED_ATLETA_EMAIL = 'e2e.atleta@teste.com'
export const SEED_MEMBRO_EMAIL = 'e2e.membro@teste.com'

// Senha padrão para todos os usuários E2E
export const SEED_PASSWORD = 'Admin@123'
