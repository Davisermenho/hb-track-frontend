'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon, MagnifyingGlassIcon, MixerHorizontalIcon, LayoutIcon, Pencil1Icon, CopyIcon,
  ChevronLeftIcon, ChevronRightIcon, CalendarIcon, InfoCircledIcon, ReloadIcon,
  ClockIcon, PersonIcon, Cross2Icon, LightningBoltIcon, ChevronDownIcon,
  DotsHorizontalIcon, TrashIcon, EyeOpenIcon
} from '@radix-ui/react-icons';
import { Dumbbell } from 'lucide-react';
import CreateTrainingModal from './CreateTrainingModal';
import { TrainingSessionsAPI, TrainingSession } from '@/lib/api/trainings';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';
import { useToast } from '@/context/ToastContext';

interface TrainingsTabProps {
  teamId: string;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

const TrainingsTableSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
        </div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20" />
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-20" />
      </div>
    ))}
  </div>
);

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyTrainingsState: React.FC<{ 
  onCreateTraining: () => void;
  canCreate: boolean;
  hasSearch?: boolean;
}> = ({ onCreateTraining, canCreate, hasSearch }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-emerald-900/20 dark:to-slate-800 flex items-center justify-center mb-5">
      <CalendarIcon className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
      {hasSearch ? 'Nenhum treino encontrado' : 'Nenhum treino cadastrado ainda'}
    </h3>
    {!hasSearch && (
      <>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
          Crie o primeiro treino para começar o planejamento da equipe. 
          Organize sessões técnicas, físicas e táticas.
        </p>
        {canCreate && (
          <button
            onClick={onCreateTraining}
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            Criar primeiro treino
          </button>
        )}
      </>
    )}
    {hasSearch && (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
        Tente ajustar os filtros ou termos de busca.
      </p>
    )}
  </div>
);

// ============================================================================
// SUGGESTION BANNER COMPONENT
// ============================================================================

const SuggestionBanner: React.FC<{
  message: string;
  onApply: () => void;
  onDismiss: () => void;
}> = ({ message, onApply, onDismiss }) => (
  <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg animate-in slide-in-from-top-2 duration-300">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
        <LightningBoltIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
          {message}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onApply}
            className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
          >
            Ver sugestão
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
          >
            Ignorar
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
      >
        <Cross2Icon className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ============================================================================
// DATE HELPERS
// ============================================================================

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getRelativeDay = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) return 'Hoje';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Amanhã';
  if (dateOnly < today) return 'Passado';
  return null;
};

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
    scheduled: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      label: 'Agendado',
      dot: 'bg-emerald-500'
    },
    in_progress: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/30',
      label: 'Em andamento',
      dot: 'bg-blue-500'
    },
    pending_review: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/30',
      label: 'Revisao pendente',
      dot: 'bg-amber-500'
    },
    draft: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      label: 'Rascunho',
      dot: 'bg-slate-400'
    },
    readonly: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      label: 'Congelado',
      dot: 'bg-emerald-500'
    },
  };

  const config = statusMap[status] || statusMap['draft'];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TrainingsTab: React.FC<TrainingsTabProps> = ({ teamId }) => {
  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(true);
  const limit = 20;

  // Hooks
  const { toast } = useToast();
  const { canCreateTraining, canEditTraining } = useTeamPermissions(teamId);

  // Buscar treinos do banco de dados
  const fetchTrainings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await TrainingSessionsAPI.listSessions({
        team_id: teamId,
        page,
        limit,
      });

      setTrainings(response.items || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('Erro ao buscar treinos:', err);
      setError('Não foi possível carregar os treinos');
    } finally {
      setIsLoading(false);
    }
  }, [teamId, page, limit]);

  useEffect(() => {
    if (teamId) {
      fetchTrainings();
    }
  }, [teamId, fetchTrainings]);

  const handleTrainingSuccess = (trainingId: string) => {
    console.log('Treino criado com sucesso:', trainingId);
    fetchTrainings();
  };

  // Handler para duplicar treino
  const handleDuplicateTraining = async (training: TrainingSession) => {
    if (isDuplicating) return;
    
    setIsDuplicating(training.id);
    
    try {
      // Criar novo treino baseado no existente
      const newSession = await TrainingSessionsAPI.createSession({
        organization_id: training.organization_id,
        team_id: training.team_id,
        session_at: new Date().toISOString(),
        session_type: training.session_type,
        main_objective: `${training.main_objective} (cópia)`,
        duration_planned_minutes: training.duration_planned_minutes,
      });
      
      toast.success('Treino duplicado!', {
        description: 'Uma cópia do treino foi criada. Edite a data e detalhes.'
      });
      
      fetchTrainings();
    } catch (err) {
      console.error('Erro ao duplicar:', err);
      toast.error('Erro ao duplicar', {
        description: 'Não foi possível duplicar o treino.'
      });
    } finally {
      setIsDuplicating(null);
    }
  };

  const totalPages = Math.ceil(total / limit);
  
  // Filtrar por busca e status
  const filteredTrainings = trainings.filter(t => {
    const matchesSearch = !searchQuery || 
      t.main_objective?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.session_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Detectar sugestão (exemplo simplificado - baseado em dados)
  const suggestionMessage = trainings.length >= 3 && showSuggestion
    ? 'Com base nos últimos treinos, recomendamos foco em trabalho técnico nesta semana.'
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="teams-trainings-root">
      {/* Sugestão contextual */}
      {suggestionMessage && canCreateTraining && (
        <SuggestionBanner
          message={suggestionMessage}
          onApply={() => {
            setShowCreateModal(true);
            setShowSuggestion(false);
          }}
          onDismiss={() => setShowSuggestion(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Treinos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie o cronograma de treinamentos e planejamento da equipe.
          </p>
        </div>
        {canCreateTraining && (
          <button 
            onClick={() => setShowCreateModal(true)}
            data-testid="create-training-button"
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            Criar treino
          </button>
        )}
      </div>

      {/* Container principal */}
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        {/* Barra de filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            {/* Busca */}
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou tipo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border rounded-lg transition-colors ${
                  showFilters || statusFilter
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black border-transparent'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <MixerHorizontalIcon className="w-3.5 h-3.5" />
                Filtros
                {statusFilter && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {(searchQuery || statusFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Cross2Icon className="w-3 h-3" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mr-2 self-center">
                  Status:
                </span>
                {['', 'draft', 'scheduled', 'in_progress', 'pending_review', 'readonly'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      statusFilter === status
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black border-transparent'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {status === '' ? 'Todos' :
                     status === 'draft' ? 'Rascunho' :
                     status === 'scheduled' ? 'Agendado' :
                     status === 'in_progress' ? 'Em andamento' :
                     status === 'pending_review' ? 'Revisao pendente' :
                     'Finalizado'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && <TrainingsTableSkeleton />}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
              <InfoCircledIcon className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
            <button
              onClick={fetchTrainings}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ReloadIcon className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTrainings.length === 0 && (
          <EmptyTrainingsState 
            onCreateTraining={() => setShowCreateModal(true)}
            canCreate={canCreateTraining}
            hasSearch={!!searchQuery || !!statusFilter}
          />
        )}

        {/* Table with Data */}
        {!isLoading && !error && filteredTrainings.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-3">Treino</th>
                    <th className="px-6 py-3">Data e Horário</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTrainings.map((training) => {
                    const relativeDay = getRelativeDay(training.session_at);
                    
                    return (
                      <tr 
                        key={training.id} 
                        className="group hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <Dumbbell className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                                {training.main_objective || 'Sem objetivo definido'}
                              </span>
                              {training.duration_planned_minutes && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <ClockIcon className="w-3 h-3" />
                                  {training.duration_planned_minutes} min
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {relativeDay && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                relativeDay === 'Hoje' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : relativeDay === 'Amanhã'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {relativeDay}
                              </span>
                            )}
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {formatDate(training.session_at)}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {formatTime(training.session_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                            {training.session_type || 'Não especificado'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={training.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              title="Ver detalhes"
                            >
                              <EyeOpenIcon className="w-3.5 h-3.5" />
                            </button>
                            {canEditTraining && (
                              <>
                                <button 
                                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                  title="Editar treino"
                                >
                                  <Pencil1Icon className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDuplicateTraining(training)}
                                  disabled={isDuplicating === training.id}
                                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                                  title="Duplicar treino"
                                >
                                  <CopyIcon className={`w-3.5 h-3.5 ${isDuplicating === training.id ? 'animate-pulse' : ''}`} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Mostrando {filteredTrainings.length} de {total} treinos
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 px-2">
                  {page} de {totalPages || 1}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de criação */}
      <CreateTrainingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTrainingSuccess}
        teamId={teamId}
      />
    </div>
  );
};

export default TrainingsTab;
