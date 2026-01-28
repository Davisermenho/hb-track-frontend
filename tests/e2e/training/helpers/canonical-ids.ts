/**
 * IDs Canônicos Determinísticos - Training Module E2E Tests
 * 
 * Sincronizado com: Hb Track - Backend/scripts/seed_e2e_canonical.py
 * Versão Seed: 3.0.0-canonical
 * 
 * IMPORTANTE:
 * - Estes UUIDs são gerados deterministicamente via uuid5 hash
 * - Sempre iguais para mesmos inputs (nome, namespace)
 * - Reprodutível em qualquer ambiente
 * - Documentação completa em SEED_CANONICO.md
 * 
 * USO:
 *   import { CanonicalIds } from '../helpers/canonical-ids';
 *   expect(response.athlete_id).toBe(CanonicalIds.ATHLETE_JOAO_SILVA);
 */

// Função Python de referência (documentação):
// def deterministic_uuid(namespace: str, name: str) -> UUID:
//     return uuid.uuid5(NAMESPACE_DNS, f"{namespace}:{name}")

export const CanonicalIds = {
  // ==========================================================================
  // ORGANIZATIONS
  // ==========================================================================
  
  /** Organização E2E principal - Namespace: "organizations:e2e-hbtrack-test-org" */
  ORG_E2E: '88888888-8888-8888-8888-000000000001', // TEMPORÁRIO - será substituído após execução seed
  
  // ==========================================================================
  // USERS (32 total - 6 principais + 26 atletas)
  // ==========================================================================
  
  /** Dirigente - Namespace: "users:dirigente@e2e.teste" */
  USER_DIRIGENTE: 'user-dirigente-uuid',
  
  /** Coordenador - Namespace: "users:coordenador@e2e.teste" */
  USER_COORDENADOR: 'user-coordenador-uuid',
  
  /** Treinador Principal - Namespace: "users:treinador@e2e.teste" */
  USER_TREINADOR: 'user-treinador-uuid',
  
  /** Treinador Auxiliar - Namespace: "users:treinador2@e2e.teste" */
  USER_TREINADOR2: 'user-treinador2-uuid',
  
  /** Atleta João Silva - Namespace: "users:joao.silva@e2e.teste" */
  USER_ATLETA_JOAO: 'user-joao-silva-uuid',
  
  /** Atleta Maria Santos - Namespace: "users:maria.santos@e2e.teste" */
  USER_ATLETA_MARIA: 'user-maria-santos-uuid',
  
  // ==========================================================================
  // TEAMS (16 total - 4 categorias × 2 gêneros × 2 teams)
  // ==========================================================================
  
  /** SUB20 Masculino 01 - Namespace: "teams:sub20-m-01" */
  TEAM_SUB20_M: 'team-sub20-m-01-uuid',
  
  /** SUB20 Feminino 01 - Namespace: "teams:sub20-f-01" */
  TEAM_SUB20_F: 'team-sub20-f-01-uuid',
  
  /** SUB17 Masculino 01 - Namespace: "teams:sub17-m-01" */
  TEAM_SUB17_M: 'team-sub17-m-01-uuid',
  
  /** SUB17 Feminino 01 - Namespace: "teams:sub17-f-01" */
  TEAM_SUB17_F: 'team-sub17-f-01-uuid',
  
  /** SUB14 Masculino 01 - Namespace: "teams:sub14-m-01" */
  TEAM_SUB14_M: 'team-sub14-m-01-uuid',
  
  /** SUB14 Feminino 01 - Namespace: "teams:sub14-f-01" */
  TEAM_SUB14_F: 'team-sub14-f-01-uuid',
  
  /** Adulto Masculino 01 - Namespace: "teams:adulto-m-01" */
  TEAM_ADULTO_M: 'team-adulto-m-01-uuid',
  
  /** Adulto Feminino 01 - Namespace: "teams:adulto-f-01" */
  TEAM_ADULTO_F: 'team-adulto-f-01-uuid',
  
  // ==========================================================================
  // ATHLETES (240 total - 15 por team, destacando principais)
  // ==========================================================================
  
  /** João Silva (SUB20-M) - Namespace: "athletes:joao-silva" */
  ATHLETE_JOAO_SILVA: 'athlete-joao-silva-uuid',
  
  /** Maria Santos (SUB20-F) - Namespace: "athletes:maria-santos" */
  ATHLETE_MARIA_SANTOS: 'athlete-maria-santos-uuid',
  
  /** Pedro Oliveira (SUB20-M) - Namespace: "athletes:pedro-oliveira" */
  ATHLETE_PEDRO_OLIVEIRA: 'athlete-pedro-oliveira-uuid',
  
  // ==========================================================================
  // TEMPLATES (4 padrão)
  // ==========================================================================
  
  /** Template Tático Ofensivo - Namespace: "templates:tatico-ofensivo" */
  TEMPLATE_TATICO: 'template-tatico-ofensivo-uuid',
  
  /** Template Físico Intensivo - Namespace: "templates:fisico-intensivo" */
  TEMPLATE_FISICO: 'template-fisico-intensivo-uuid',
  
  /** Template Equilibrado - Namespace: "templates:equilibrado" */
  TEMPLATE_EQUILIBRADO: 'template-equilibrado-uuid',
  
  /** Template Defesa Posicional - Namespace: "templates:defesa-posicional" */
  TEMPLATE_DEFESA: 'template-defesa-posicional-uuid',
  
  // ==========================================================================
  // TRAINING CYCLES
  // ==========================================================================
  
  /** Macrociclo Preparatório 2026 - Namespace: "cycles:macro-preparatorio-2026" */
  MACRO_PREPARATORIO: 'macro-preparatorio-2026-uuid',
  
  /** Mesociclo Fase 1 - Namespace: "cycles:meso-fase1-2026" */
  MESO_FASE1: 'meso-fase1-2026-uuid',
  
  // ==========================================================================
  // TRAINING SESSIONS (320 total - destacando samples)
  // ==========================================================================
  
  /** Session SUB20-M 2026-01-20 Tático - Namespace: "sessions:{team[:8]}-2026-01-20-tatico" */
  SESSION_SUB20_2026_01_20_TATICO: 'session-sub20-2026-01-20-tatico-uuid',
  
  /** Session SUB20-M 2026-01-22 Físico - Namespace: "sessions:{team[:8]}-2026-01-22-fisico" */
  SESSION_SUB20_2026_01_22_FISICO: 'session-sub20-2026-01-22-fisico-uuid',
  
} as const;

/**
 * Tipo auxiliar para constante de IDs
 */
export type CanonicalIdKey = keyof typeof CanonicalIds;
export type CanonicalIdValue = typeof CanonicalIds[CanonicalIdKey];

/**
 * Mapa reverso: UUID → Nome
 * Útil para debugging e logs
 */
export const CanonicalIdsReverse = Object.fromEntries(
  Object.entries(CanonicalIds).map(([key, value]) => [value, key])
) as Record<CanonicalIdValue, CanonicalIdKey>;

/**
 * Helper para validar se UUID é canônico
 */
export function isCanonicalId(uuid: string): boolean {
  return Object.values(CanonicalIds).includes(uuid as any);
}

/**
 * Helper para obter nome do ID canônico
 */
export function getCanonicalIdName(uuid: string): CanonicalIdKey | null {
  return CanonicalIdsReverse[uuid as CanonicalIdValue] || null;
}

// ==========================================================================
// EXPORTAÇÃO DE GRUPOS (para facilitar uso)
// ==========================================================================

export const UserIds = {
  DIRIGENTE: CanonicalIds.USER_DIRIGENTE,
  COORDENADOR: CanonicalIds.USER_COORDENADOR,
  TREINADOR: CanonicalIds.USER_TREINADOR,
  TREINADOR2: CanonicalIds.USER_TREINADOR2,
  ATLETA_JOAO: CanonicalIds.USER_ATLETA_JOAO,
  ATLETA_MARIA: CanonicalIds.USER_ATLETA_MARIA,
} as const;

export const TeamIds = {
  SUB20_M: CanonicalIds.TEAM_SUB20_M,
  SUB20_F: CanonicalIds.TEAM_SUB20_F,
  SUB17_M: CanonicalIds.TEAM_SUB17_M,
  SUB17_F: CanonicalIds.TEAM_SUB17_F,
  SUB14_M: CanonicalIds.TEAM_SUB14_M,
  SUB14_F: CanonicalIds.TEAM_SUB14_F,
  ADULTO_M: CanonicalIds.TEAM_ADULTO_M,
  ADULTO_F: CanonicalIds.TEAM_ADULTO_F,
} as const;

export const AthleteIds = {
  JOAO_SILVA: CanonicalIds.ATHLETE_JOAO_SILVA,
  MARIA_SANTOS: CanonicalIds.ATHLETE_MARIA_SANTOS,
  PEDRO_OLIVEIRA: CanonicalIds.ATHLETE_PEDRO_OLIVEIRA,
} as const;

export const TemplateIds = {
  TATICO: CanonicalIds.TEMPLATE_TATICO,
  FISICO: CanonicalIds.TEMPLATE_FISICO,
  EQUILIBRADO: CanonicalIds.TEMPLATE_EQUILIBRADO,
  DEFESA: CanonicalIds.TEMPLATE_DEFESA,
} as const;

export const CycleIds = {
  MACRO_PREPARATORIO: CanonicalIds.MACRO_PREPARATORIO,
  MESO_FASE1: CanonicalIds.MESO_FASE1,
} as const;

export const SessionIds = {
  SUB20_2026_01_20_TATICO: CanonicalIds.SESSION_SUB20_2026_01_20_TATICO,
  SUB20_2026_01_22_FISICO: CanonicalIds.SESSION_SUB20_2026_01_22_FISICO,
} as const;

/**
 * TODO: Após executar seed_e2e_canonical.py:
 * 
 * 1. Script Python deve exportar JSON com UUIDs reais:
 *    python scripts/seed_e2e_canonical.py --export-ids > canonical-ids.json
 * 
 * 2. Importar JSON e substituir placeholders:
 *    node scripts/update-canonical-ids.js canonical-ids.json
 * 
 * 3. Validar determinismo:
 *    - Executar seed 2x
 *    - Verificar UUIDs idênticos
 *    - Rodar testes e validar asserções
 */
