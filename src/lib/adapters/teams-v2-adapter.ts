/**
 * Adapter: API Team → Teams-v2 Team
 *
 * Converte o tipo Team retornado pela API (/lib/api/teams.ts)
 * para o tipo Team esperado pelo teams-v2 (/types/teams-v2.ts)
 */

import { Team as ApiTeam } from '@/lib/api/teams';
import { Team as V2Team } from '@/types/teams-v2';

/**
 * Mapeia categoria_id para label legível
 */
const CATEGORY_MAP: Record<number, string> = {
  1: 'Mirim',
  2: 'Infantil',
  3: 'Cadete',
  4: 'Juvenil',
  5: 'Júnior',
  6: 'Adulto',
  7: 'Master',
};

/**
 * Mapeia gênero da API para formato Teams-v2
 */
function mapGender(gender: 'feminino' | 'masculino' | 'misto'): string {
  const map: Record<string, string> = {
    feminino: 'Feminino',
    masculino: 'Masculino',
    misto: 'Misto'
  };
  return map[gender] || 'Não definido';
}

/**
 * Determina role do usuário baseado em permissões
 * TODO: Integrar com sistema de permissões real quando disponível
 */
function determineUserRole(apiTeam: ApiTeam, userId?: string): string {
  // Por enquanto, retorna role padrão
  // Futuramente, consultar tabela de membros/staff
  if (apiTeam.coach_membership_id === userId) {
    return 'Treinador Principal';
  }
  return 'Membro';
}

/**
 * Formata data para formato legível em português
 */
function formatActivityTime(isoDate?: string): string {
  if (!isoDate) return 'Não disponível';

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `Hoje, ${hours}:${minutes}`;
  } else if (diffDays === 1) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `Ontem, ${hours}:${minutes}`;
  } else if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

/**
 * Converte Team da API para formato Teams-v2
 */
export function mapApiTeamToV2(apiTeam: ApiTeam, userId?: string): V2Team {
  const categoryLabel = CATEGORY_MAP[apiTeam.category_id] || 'Categoria';
  
  // Limpar nome se vier concatenado com season_id (bug do backend)
  let cleanName = apiTeam.name;
  if (cleanName && cleanName.includes(' ')) {
    const parts = cleanName.split(' ');
    const lastPart = parts[parts.length - 1];
    // Se a última parte é um número decimal grande (timestamp), remover
    if (lastPart && /^\d+\.\d+$/.test(lastPart)) {
      cleanName = parts.slice(0, -1).join(' ');
    }
  }

  // Determinar status: se deleted_at existe, está arquivada
  const isArchived = !!apiTeam.deleted_at;

  return {
    id: apiTeam.id,
    name: cleanName,
    code: apiTeam.id.substring(0, 10).toUpperCase(),
    role: determineUserRole(apiTeam, userId),
    lastActivity: 'Sem atividade recente', // TODO: Integrar com sistema de atividades
    activityTime: formatActivityTime(apiTeam.updated_at),
    status: isArchived ? 'archived' : 'active',
    initial: cleanName.charAt(0).toUpperCase(),
    category: categoryLabel,
    category_id: apiTeam.category_id, // CRÍTICO: Manter ID numérico da categoria
    gender: mapGender(apiTeam.gender),
    club: apiTeam.organization_name || apiTeam.organization_id,
    season: apiTeam.season_id || 'Não definida', // season_id vem como UUID, não como label legível
    alert_threshold_multiplier: apiTeam.alert_threshold_multiplier || 2.0, // Step 15
  };
}

/**
 * Converte array de Teams da API para formato Teams-v2
 */
export function mapApiTeamsToV2(apiTeams: ApiTeam[], userId?: string): V2Team[] {
  return apiTeams.map(team => mapApiTeamToV2(team, userId));
}

/**
 * Converte Team-v2 para payload de criação na API
 */
export function mapV2TeamToApiCreate(v2Team: Partial<V2Team>, organizationId: string): Partial<ApiTeam> {
  // Mapear de volta para API
  // Será usado quando integrar CreateTeamModal com API real

  const genderMap: Record<string, 'feminino' | 'masculino' | 'misto'> = {
    'Feminino': 'feminino',
    'Masculino': 'masculino',
    'Misto': 'misto'
  };

  return {
    name: v2Team.name || '',
    organization_id: organizationId,
    category_id: 3, // TODO: Mapear categoria de volta para ID
    gender: v2Team.gender ? genderMap[v2Team.gender] : 'masculino',
    is_our_team: true,
    is_active: v2Team.status === 'active'
  };
}
