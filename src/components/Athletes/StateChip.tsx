/**
 * Componente StateChip (FASE 2)
 * 
 * Badge visual para estados e flags de atletas.
 * Baseado em: REGRAS.md R12/R13 e REGRAS_GERENCIAMENTO_ATLETAS.md
 */

'use client';

import { AthleteState } from '../../types/athlete-canonical';

interface StateChipProps {
  state: AthleteState;
  injured?: boolean;
  suspended_until?: string | null;
  medical_restriction?: boolean;
  load_restricted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showFlags?: boolean;
}

// Configurações de cores por estado
const stateConfig: Record<AthleteState, { label: string; bg: string; text: string; icon: string }> = {
  ativa: {
    label: 'Ativa',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-400',
    icon: '✅',
  },
  dispensada: {
    label: 'Dispensada',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-400',
    icon: '🚫',
  },
  arquivada: {
    label: 'Arquivada',
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-400',
    icon: '📦',
  },
};

// Configurações de flags
const flagConfig = {
  injured: {
    label: 'Lesionada',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-400',
    icon: '🩹',
  },
  suspended: {
    label: 'Suspensa',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-400',
    icon: '⏸️',
  },
  medical_restriction: {
    label: 'Restrição Médica',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-400',
    icon: '⚠️',
  },
  load_restricted: {
    label: 'Carga Restrita',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-400',
    icon: '📉',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function StateChip({
  state,
  injured = false,
  suspended_until,
  medical_restriction = false,
  load_restricted = false,
  size = 'md',
  showFlags = true,
}: StateChipProps) {
  const config = stateConfig[state];
  const sizeClass = sizeClasses[size];

  // Verificar se tem suspensão ativa
  const isSuspended = suspended_until && new Date(suspended_until) >= new Date();

  // Se lesionada ou suspensa, mostrar a flag prioritária
  if (showFlags && injured) {
    return (
      <div className="flex flex-wrap gap-1">
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${flagConfig.injured.bg} ${flagConfig.injured.text}`}>
          <span>{flagConfig.injured.icon}</span>
          {flagConfig.injured.label}
        </span>
        {/* Mostrar estado base ao lado */}
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${config.bg} ${config.text} opacity-70`}>
          {state}
        </span>
      </div>
    );
  }

  if (showFlags && isSuspended) {
    return (
      <div className="flex flex-wrap gap-1">
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${flagConfig.suspended.bg} ${flagConfig.suspended.text}`}>
          <span>{flagConfig.suspended.icon}</span>
          {flagConfig.suspended.label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          até {new Date(suspended_until!).toLocaleDateString('pt-BR')}
        </span>
      </div>
    );
  }

  // Renderizar apenas o estado base
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
      
      {/* Flags adicionais menores */}
      {showFlags && medical_restriction && (
        <span className={`inline-flex items-center gap-0.5 rounded-full font-medium px-1.5 py-0.5 text-xs ${flagConfig.medical_restriction.bg} ${flagConfig.medical_restriction.text}`}>
          {flagConfig.medical_restriction.icon}
        </span>
      )}
      {showFlags && load_restricted && (
        <span className={`inline-flex items-center gap-0.5 rounded-full font-medium px-1.5 py-0.5 text-xs ${flagConfig.load_restricted.bg} ${flagConfig.load_restricted.text}`}>
          {flagConfig.load_restricted.icon}
        </span>
      )}
    </div>
  );
}

// Componente simples apenas para o estado (sem flags)
export function SimpleStateChip({ state, size = 'sm' }: { state: AthleteState; size?: 'sm' | 'md' | 'lg' }) {
  const config = stateConfig[state];
  const sizeClass = sizeClasses[size];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
