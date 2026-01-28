/**
 * System roles and permissions
 */

export const ROLES = {
  SUPERADMIN: 'superadmin',
  DIRIGENTE: 'dirigente',
  COORDENADOR: 'coordenador',
  TREINADOR: 'treinador',
  ATLETA: 'atleta',
} as const;

export type RoleCode = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleCode, string> = {
  [ROLES.SUPERADMIN]: 'Super Administrador',
  [ROLES.DIRIGENTE]: 'Dirigente',
  [ROLES.COORDENADOR]: 'Coordenador',
  [ROLES.TREINADOR]: 'Treinador',
  [ROLES.ATLETA]: 'Atleta',
};

export const ROLE_HIERARCHY: Record<RoleCode, number> = {
  [ROLES.ATLETA]: 1,
  [ROLES.TREINADOR]: 2,
  [ROLES.COORDENADOR]: 3,
  [ROLES.DIRIGENTE]: 4,
  [ROLES.SUPERADMIN]: 5,
};

export function canCreateRole(userRole: RoleCode, targetRole: RoleCode): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export function hasMinimumRole(userRole: RoleCode, minimumRole: RoleCode): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}