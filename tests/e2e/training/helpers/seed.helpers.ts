/**
 * Seed Helpers - Training Module E2E Tests
 * 
 * Helpers núcleo para lookup de IDs seedados e fixtures sem lógica de negócio.
 * 
 * PRINCÍPIOS:
 * - Genéricos e reutilizáveis
 * - Sem regras de negócio
 * - Baixo acoplamento
 * - Alto sinal de qualidade
 */

import { CanonicalIds } from './canonical-ids';

/**
 * Entity types suportados
 */
export type EntityType = 
  | 'organization'
  | 'user'
  | 'team'
  | 'athlete'
  | 'template'
  | 'cycle'
  | 'session';

/**
 * Lookup UUID canônico por nome.
 * 
 * USO:
 *   const joaoId = lookupUuidByName('athlete', 'joao-silva');
 *   // Retorna: CanonicalIds.ATHLETE_JOAO_SILVA
 * 
 * @param entityType - Tipo de entidade
 * @param name - Nome identificador (ex: "joao-silva", "sub20-m-01")
 * @returns UUID canônico ou null se não encontrado
 */
export function lookupUuidByName(
  entityType: EntityType,
  name: string
): string | null {
  // Mapeamento nome → constante CanonicalIds
  const mappings: Record<string, string> = {
    // Organizations
    'e2e-hbtrack-test-org': CanonicalIds.ORG_E2E,
    
    // Users
    'dirigente@e2e.teste': CanonicalIds.USER_DIRIGENTE,
    'coordenador@e2e.teste': CanonicalIds.USER_COORDENADOR,
    'treinador@e2e.teste': CanonicalIds.USER_TREINADOR,
    'treinador2@e2e.teste': CanonicalIds.USER_TREINADOR2,
    'joao.silva@e2e.teste': CanonicalIds.USER_ATLETA_JOAO,
    'maria.santos@e2e.teste': CanonicalIds.USER_ATLETA_MARIA,
    
    // Teams
    'sub20-m-01': CanonicalIds.TEAM_SUB20_M,
    'sub20-f-01': CanonicalIds.TEAM_SUB20_F,
    'sub17-m-01': CanonicalIds.TEAM_SUB17_M,
    'sub17-f-01': CanonicalIds.TEAM_SUB17_F,
    'sub14-m-01': CanonicalIds.TEAM_SUB14_M,
    'sub14-f-01': CanonicalIds.TEAM_SUB14_F,
    'adulto-m-01': CanonicalIds.TEAM_ADULTO_M,
    'adulto-f-01': CanonicalIds.TEAM_ADULTO_F,
    
    // Athletes
    'joao-silva': CanonicalIds.ATHLETE_JOAO_SILVA,
    'maria-santos': CanonicalIds.ATHLETE_MARIA_SANTOS,
    'pedro-oliveira': CanonicalIds.ATHLETE_PEDRO_OLIVEIRA,
    
    // Templates
    'tatico-ofensivo': CanonicalIds.TEMPLATE_TATICO,
    'fisico-intensivo': CanonicalIds.TEMPLATE_FISICO,
    'equilibrado': CanonicalIds.TEMPLATE_EQUILIBRADO,
    'defesa-posicional': CanonicalIds.TEMPLATE_DEFESA,
    
    // Cycles
    'macro-preparatorio-2026': CanonicalIds.MACRO_PREPARATORIO,
    'meso-fase1-2026': CanonicalIds.MESO_FASE1,
    
    // Sessions
    'session-sub20-2026-01-20-tatico': CanonicalIds.SESSION_SUB20_2026_01_20_TATICO,
    'session-sub20-2026-01-22-fisico': CanonicalIds.SESSION_SUB20_2026_01_22_FISICO,
  };
  
  return mappings[name] || null;
}

/**
 * Retorna todos os IDs fixos de um tipo de entidade.
 * 
 * USO:
 *   const teamIds = getFixtureIds('team');
 *   // Retorna: [TEAM_SUB20_M, TEAM_SUB20_F, ...]
 * 
 * @param entityType - Tipo de entidade
 * @returns Array de UUIDs canônicos
 */
export function getFixtureIds(entityType: EntityType): string[] {
  switch (entityType) {
    case 'organization':
      return [CanonicalIds.ORG_E2E];
    
    case 'user':
      return [
        CanonicalIds.USER_DIRIGENTE,
        CanonicalIds.USER_COORDENADOR,
        CanonicalIds.USER_TREINADOR,
        CanonicalIds.USER_TREINADOR2,
        CanonicalIds.USER_ATLETA_JOAO,
        CanonicalIds.USER_ATLETA_MARIA,
      ];
    
    case 'team':
      return [
        CanonicalIds.TEAM_SUB20_M,
        CanonicalIds.TEAM_SUB20_F,
        CanonicalIds.TEAM_SUB17_M,
        CanonicalIds.TEAM_SUB17_F,
        CanonicalIds.TEAM_SUB14_M,
        CanonicalIds.TEAM_SUB14_F,
        CanonicalIds.TEAM_ADULTO_M,
        CanonicalIds.TEAM_ADULTO_F,
      ];
    
    case 'athlete':
      return [
        CanonicalIds.ATHLETE_JOAO_SILVA,
        CanonicalIds.ATHLETE_MARIA_SANTOS,
        CanonicalIds.ATHLETE_PEDRO_OLIVEIRA,
      ];
    
    case 'template':
      return [
        CanonicalIds.TEMPLATE_TATICO,
        CanonicalIds.TEMPLATE_FISICO,
        CanonicalIds.TEMPLATE_EQUILIBRADO,
        CanonicalIds.TEMPLATE_DEFESA,
      ];
    
    case 'cycle':
      return [
        CanonicalIds.MACRO_PREPARATORIO,
        CanonicalIds.MESO_FASE1,
      ];
    
    case 'session':
      return [
        CanonicalIds.SESSION_SUB20_2026_01_20_TATICO,
        CanonicalIds.SESSION_SUB20_2026_01_22_FISICO,
      ];
    
    default:
      return [];
  }
}

/**
 * Conta esperada de entidades por tipo.
 * Útil para validações de seed.
 * 
 * USO:
 *   const expectedCount = getExpectedCount('athlete');
 *   expect(athletes.length).toBe(expectedCount); // 240
 * 
 * @param entityType - Tipo de entidade
 * @returns Contagem esperada pelo seed canônico
 */
export function getExpectedCount(entityType: EntityType): number {
  switch (entityType) {
    case 'organization':
      return 1;
    case 'user':
      return 32;
    case 'team':
      return 16;
    case 'athlete':
      return 240;
    case 'template':
      return 4;
    case 'cycle':
      return 2; // Simplificado (2 macro + 2 meso na implementação real)
    case 'session':
      return 60; // 3 teams × 20 sessions (simplificado)
    default:
      return 0;
  }
}

/**
 * Valida se UUID é canônico (conhecid antecipadamente).
 * 
 * @param uuid - UUID para validar
 * @returns true se UUID está em CanonicalIds
 */
export function isCanonicalUuid(uuid: string): boolean {
  return Object.values(CanonicalIds).includes(uuid as any);
}
