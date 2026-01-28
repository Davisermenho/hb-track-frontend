/**
 * Empty State Components
 * 
 * FASE 6.2: Empty States e Feedback Visual
 * 
 * Componentes para estados vazios com ilustrações e CTAs
 */

import React from 'react';

// ============================================================================
// EMPTY STATE BASE
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
            >
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ICONS (SVG)
// ============================================================================

function UsersIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function SearchIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function FilterIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  );
}

function ErrorIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ClipboardIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

// ============================================================================
// SPECIALIZED EMPTY STATES
// ============================================================================

interface SpecializedEmptyStateProps {
  onAction?: () => void;
  onSecondaryAction?: () => void;
}

/**
 * Estado vazio para lista de atletas
 */
export function AthleteEmptyState({ onAction }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={<UsersIcon />}
      title="Nenhum atleta cadastrado"
      description="Comece adicionando atletas ao seu time para gerenciar presenças, estatísticas e muito mais."
      action={onAction ? {
        label: '+ Adicionar Atleta',
        onClick: onAction,
      } : undefined}
    />
  );
}

/**
 * Estado vazio para busca sem resultados
 */
export function SearchEmptyState({ 
  onAction, 
  searchTerm 
}: SpecializedEmptyStateProps & { searchTerm?: string }) {
  return (
    <EmptyState
      icon={<SearchIcon />}
      title="Nenhum resultado encontrado"
      description={searchTerm 
        ? `Não encontramos resultados para "${searchTerm}". Tente buscar com outros termos.`
        : 'Tente ajustar sua busca ou usar termos diferentes.'
      }
      action={onAction ? {
        label: 'Limpar busca',
        onClick: onAction,
      } : undefined}
    />
  );
}

/**
 * Estado vazio para filtros sem resultados
 */
export function FilterEmptyState({ onAction }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={<FilterIcon />}
      title="Nenhum atleta corresponde aos filtros"
      description="Tente ajustar os filtros selecionados para ver mais resultados."
      action={onAction ? {
        label: 'Limpar filtros',
        onClick: onAction,
      } : undefined}
    />
  );
}

/**
 * Estado de erro genérico
 */
export function ErrorEmptyState({ 
  onAction, 
  message 
}: SpecializedEmptyStateProps & { message?: string }) {
  return (
    <EmptyState
      icon={<ErrorIcon className="w-16 h-16 text-error-500" />}
      title="Ops! Algo deu errado"
      description={message || 'Não foi possível carregar os dados. Tente novamente em alguns instantes.'}
      action={onAction ? {
        label: 'Tentar novamente',
        onClick: onAction,
      } : undefined}
    />
  );
}

/**
 * Estado vazio para histórico de treinos
 */
export function TrainingHistoryEmptyState({ onAction }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={<ClipboardIcon />}
      title="Nenhum treino registrado"
      description="Este atleta ainda não participou de nenhum treino. Os registros aparecerão aqui conforme forem adicionados."
      action={onAction ? {
        label: 'Ver treinos disponíveis',
        onClick: onAction,
      } : undefined}
    />
  );
}

/**
 * Estado vazio para calendário de jogos
 */
export function GamesEmptyState({ onAction }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={<CalendarIcon />}
      title="Nenhum jogo agendado"
      description="Não há jogos programados no momento. Agende um novo jogo para começar."
      action={onAction ? {
        label: '+ Agendar Jogo',
        onClick: onAction,
      } : undefined}
    />
  );
}

/**
 * Estado vazio para temporadas
 */
export function SeasonsEmptyState({ onAction }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={<CalendarIcon />}
      title="Nenhuma temporada criada"
      description="Crie uma temporada para organizar times, jogos e estatísticas."
      action={onAction ? {
        label: '+ Criar Temporada',
        onClick: onAction,
      } : undefined}
    />
  );
}

/**
 * Estado vazio para times
 */
export function TeamsEmptyState({ onAction }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={<UsersIcon />}
      title="Nenhum time cadastrado"
      description="Cadastre times para organizar atletas e gerenciar competições."
      action={onAction ? {
        label: '+ Criar Time',
        onClick: onAction,
      } : undefined}
    />
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  UsersIcon,
  SearchIcon,
  FilterIcon,
  ErrorIcon,
  ClipboardIcon,
  CalendarIcon,
};

const EmptyStates = {
  EmptyState,
  AthleteEmptyState,
  SearchEmptyState,
  FilterEmptyState,
  ErrorEmptyState,
  TrainingHistoryEmptyState,
  GamesEmptyState,
  SeasonsEmptyState,
  TeamsEmptyState,
};

export default EmptyStates;
