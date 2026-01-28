/**
 * RoleBadge - Badge para exibir papel do usuário na equipe
 * 
 * Segue a identidade visual do HB Track com cores distintas por papel.
 */

'use client';

import { cn } from '@/lib/utils';
import { 
  Crown, 
  Shield, 
  Users, 
  Dumbbell, 
  UserCircle,
  type LucideIcon 
} from 'lucide-react';

export type RoleType = 
  | 'owner' 
  | 'admin' 
  | 'dirigente' 
  | 'coordenador' 
  | 'treinador' 
  | 'membro' 
  | 'atleta'
  | 'pendente';

interface RoleBadgeProps {
  role: RoleType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

interface RoleConfig {
  label: string;
  icon: LucideIcon;
  colors: string;
  iconColor: string;
}

const ROLE_CONFIGS: Record<RoleType, RoleConfig> = {
  owner: {
    label: 'Criador',
    icon: Crown,
    colors: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    colors: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black border-slate-900 dark:border-slate-100',
    iconColor: 'text-white dark:text-black',
  },
  dirigente: {
    label: 'Dirigente',
    icon: Shield,
    colors: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-500',
  },
  coordenador: {
    label: 'Coordenador',
    icon: Users,
    colors: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
  },
  treinador: {
    label: 'Treinador',
    icon: Dumbbell,
    colors: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500',
  },
  membro: {
    label: 'Membro',
    icon: UserCircle,
    colors: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-400',
  },
  atleta: {
    label: 'Atleta',
    icon: UserCircle,
    colors: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-400',
  },
  pendente: {
    label: 'Pendente',
    icon: UserCircle,
    colors: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-400',
  },
};

const SIZE_CLASSES = {
  sm: 'text-[9px] px-1.5 py-0.5 gap-1',
  md: 'text-[10px] px-2 py-0.5 gap-1.5',
  lg: 'text-xs px-2.5 py-1 gap-1.5',
};

const ICON_SIZES = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
};

/**
 * Normaliza o papel para o formato padrão
 */
function normalizeRole(role: string): RoleType {
  const normalized = role.toLowerCase().trim();
  
  const roleMap: Record<string, RoleType> = {
    'owner': 'owner',
    'criador': 'owner',
    'proprietário': 'owner',
    'admin': 'admin',
    'administrador': 'admin',
    'dirigente': 'dirigente',
    'coordenador': 'coordenador',
    'coordenadora': 'coordenador',
    'treinador': 'treinador',
    'treinadora': 'treinador',
    'coach': 'treinador',
    'técnico': 'treinador',
    'membro': 'membro',
    'member': 'membro',
    'atleta': 'atleta',
    'athlete': 'atleta',
    'pendente': 'pendente',
    'pending': 'pendente',
  };
  
  return roleMap[normalized] || 'membro';
}

export function RoleBadge({
  role,
  size = 'md',
  showIcon = true,
  className,
}: RoleBadgeProps) {
  const normalizedRole = normalizeRole(role);
  const config = ROLE_CONFIGS[normalizedRole];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold uppercase tracking-wider rounded border',
        SIZE_CLASSES[size],
        config.colors,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(ICON_SIZES[size], config.iconColor)} />
      )}
      {config.label}
    </span>
  );
}

/**
 * Badge de status (Ativo, Pendente, Inativo)
 */
interface StatusBadgeProps {
  status: 'ativo' | 'pendente' | 'inativo' | 'arquivado' | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIGS: Record<string, { label: string; colors: string; dotColor: string }> = {
  ativo: {
    label: 'Ativo',
    colors: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  pendente: {
    label: 'Pendente',
    colors: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  inativo: {
    label: 'Inativo',
    colors: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-400',
  },
  arquivado: {
    label: 'Arquivado',
    colors: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-400',
  },
};

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = STATUS_CONFIGS[normalizedStatus] || STATUS_CONFIGS.inativo;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded border',
        SIZE_CLASSES[size],
        config.colors,
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      )}
      {config.label}
    </span>
  );
}

export default RoleBadge;
