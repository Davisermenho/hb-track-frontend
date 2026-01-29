/**
 * AgendaClient
 *
 * Componente cliente da página de Agenda Semanal com URL-state e busca funcional
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AgendaHeader } from '@/components/training/agenda/AgendaHeader';
import { WeeklyAgenda } from '@/components/training/agenda/WeeklyAgenda';
import { MonthlyAgenda } from '@/components/training/agenda/MonthlyAgenda';
import { CreateSessionModal } from '@/components/training/modals/CreateSessionModal';
import { SessionEditorModal } from '@/components/training/modals/SessionEditorModal';
import { ImportLegacyModal } from '@/components/admin/ImportLegacyModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSessions, useDeleteSession } from '@/lib/hooks/useSessions';
import { useTrainingContext } from '@/context/TrainingContext';
import { useToast } from '@/context/ToastContext';
import { useDebouncedSearch } from '@/lib/hooks/useDebouncedSearch';
import { matchesSearch } from '@/lib/utils/searchUtils';
import type { TrainingSession } from '@/lib/api/trainings';
import { Search } from 'lucide-react';
import { getISOWeek } from 'date-fns';
import { Icons } from '@/design-system/icons';

export default function AgendaClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL State: ?view=week|month, ?date=YYYY-MM-DD, ?teamId=UUID, ?q=string
  const viewFromUrl = (searchParams.get('view') as 'week' | 'month') || 'week';
  const dateFromUrl = searchParams.get('date');
  const teamIdFromUrl = searchParams.get('teamId');
  const queryFromUrl = searchParams.get('q') || '';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  
  // Inicializar currentWeekStart a partir de URL ou fallback
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Sempre calcular a segunda-feira da semana atual se não houver date específica na URL
    // ou se a date da URL for muito antiga (mais de 1 mês atrás)
    if (dateFromUrl && viewFromUrl === 'week') {
      const date = new Date(dateFromUrl);
      if (!isNaN(date.getTime())) {
        const today = new Date();
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);

        // Se a data da URL não é muito antiga, use ela
        if (date >= oneMonthAgo) {
          return date;
        }
      }
    }

    // Fallback: Monday da semana atual (usando timezone local)
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = day === 0 ? 1 : 1 - day; // Se Sunday (0), diff = 1 (próxima Monday)
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const { sessions, isLoading, error, fetchSessions, updateSession } = useSessions();
  const deleteSessionMutation = useDeleteSession();
  const { teams, selectedTeam, setSelectedTeam } = useTrainingContext();
  const { toast } = useToast();

  useEffect(() => {
    if (!teamIdFromUrl || !teams.length) return;
    if (selectedTeam?.id === teamIdFromUrl) return;
    const team = teams.find((item) => item.id === teamIdFromUrl);
    if (team) {
      setSelectedTeam(team);
    }
  }, [teamIdFromUrl, teams, selectedTeam?.id, setSelectedTeam]);
  
  // Debounce search query para evitar atualizações excessivas
  const debouncedSearchQuery = useDebouncedSearch(searchQuery, 300);
  
  // Filtered sessions baseado na busca (client-side)
  const filteredSessions = useMemo(() => {
    if (!debouncedSearchQuery) return sessions;
    
    return sessions.filter((session) => {
      // Buscar em: main_objective, location, session_type
      return (
        matchesSearch(session.main_objective, debouncedSearchQuery) ||
        matchesSearch(session.location, debouncedSearchQuery) ||
        matchesSearch(session.session_type, debouncedSearchQuery)
      );
    });
  }, [sessions, debouncedSearchQuery]);

  const pendingReviewCount = filteredSessions.filter((s) => s.status === 'pending_review').length;
  const draftSessionsCount = filteredSessions.filter((s) => s.status === 'draft').length;

  // Função para atualizar URL params mantendo os existentes
  const updateUrlParams = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    const nextQuery = newParams.toString();
    if (nextQuery === searchParams.toString()) {
      return;
    }
    router.push(`/training/agenda?${nextQuery}`, { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    if (selectedTeam?.id) {
      updateUrlParams({ teamId: selectedTeam.id });
    } else {
      updateUrlParams({ teamId: null });
    }
  }, [selectedTeam?.id, updateUrlParams]);

  useEffect(() => {
    if (searchParams.get('session')) {
      updateUrlParams({ session: null });
    }
  }, [searchParams, updateUrlParams]);

  // Atualizar URL quando debounced query mudar
  useEffect(() => {
    if (debouncedSearchQuery) {
      updateUrlParams({ q: debouncedSearchQuery });
    } else {
      updateUrlParams({ q: null });
    }
  }, [debouncedSearchQuery, updateUrlParams]);

  // Atualizar URL quando date mudar
  useEffect(() => {
    const dateStr = currentWeekStart.toISOString().split('T')[0]; // YYYY-MM-DD
    updateUrlParams({ date: dateStr });
  }, [currentWeekStart, updateUrlParams]);

  const setView = (newView: 'week' | 'month') => {
    updateUrlParams({ view: newView });
  };

  // Handler para limpar filtros
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    updateUrlParams({ q: null });
  }, [updateUrlParams]);

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = day === 0 ? 1 : 1 - day; // Se Sunday (0), diff = 1 (próxima Monday)
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  }, []);

  const weekPeriod = useMemo(() => {
    const start = new Date(currentWeekStart);
    const weekNumber = getISOWeek(start);
    const monthLabel = start.toLocaleDateString('pt-BR', { month: 'short' });
    return `Semana ${weekNumber} · ${monthLabel} ${start.getFullYear()}`;
  }, [currentWeekStart]);

  const buildReturnTo = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('session');
    if (selectedTeam?.id) {
      params.set('teamId', selectedTeam.id);
    }
    const query = params.toString();
    return query ? `/training/agenda?${query}` : '/training/agenda';
  }, [searchParams, selectedTeam?.id]);

  const openEditorById = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setEditingSession(session);
      setShowEditModal(true);
    }
  }, [sessions]);

  const handleSessionClick = useCallback((session: TrainingSession) => {
    if (session.status === 'readonly') {
      router.push(`/training/relatorio/${session.id}`);
      return;
    }
    openEditorById(session.id);
  }, [router, openEditorById]);

  // Handlers legados (manter compatibilidade com WeeklyAgenda props)
  const handleEditSession = useCallback((session: TrainingSession) => {
    setEditingSession(session);
    setShowEditModal(true);
  }, []);

  const handleViewDetails = useCallback((session: TrainingSession) => {
    handleSessionClick(session);
  }, [handleSessionClick]);

  const handleReviewSession = useCallback((session: TrainingSession) => {
    handleSessionClick(session);
  }, [handleSessionClick]);

  const handleViewReport = useCallback((session: TrainingSession) => {
    router.push(`/training/relatorio/${session.id}`);
  }, [router]);

  const handleCompleteAndSchedule = useCallback((session: TrainingSession) => {
    // TODO: Implement complete and schedule logic
    toast.info('Funcionalidade "Completar e agendar" em desenvolvimento');
  }, [toast]);

  const handleSaveNotes = useCallback(async (sessionId: string, notes: string) => {
    try {
      await updateSession(sessionId, { notes });
      toast.success('Notas salvas com sucesso');
    } catch (err) {
      toast.error('Erro ao salvar notas');
    }
  }, [updateSession, toast]);

  const handleDeleteSession = useCallback(async (session: TrainingSession, reason: string) => {
    await deleteSessionMutation.mutateAsync({
      sessionId: session.id,
      reason,
    });
  }, [deleteSessionMutation]);

  // Buscar sessões quando equipe mudar
  useEffect(() => {
    if (selectedTeam?.id) {
      fetchSessions({ team_id: selectedTeam.id });
    }
  }, [fetchSessions, selectedTeam]);

  // Handler para criar sessão
  const handleCreateSession = useCallback((date?: string) => {
    setSelectedDate(date || null);
    setShowCreateModal(true);
  }, []);

  // Handler para mover sessão (drag & drop)
  const handleSessionMove = useCallback(async (sessionId: string, newDate: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      if (session.status !== 'draft') {
        toast.info('Sessões agendadas não podem ser movidas.');
        return;
      }

      // Mantém o horário, apenas muda a data
      const oldDateTime = new Date(session.session_at);
      const newDateTime = new Date(newDate);
      newDateTime.setHours(oldDateTime.getHours(), oldDateTime.getMinutes());

      await updateSession(sessionId, { session_at: newDateTime.toISOString() });

      toast.success(`Sessão movida para ${newDateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}`);
    } catch (err) {
      toast.error('Erro ao mover sessão');
    }
  }, [sessions, updateSession, toast]);

  // Handler para busca
  const handleSearch = useCallback((query: string) => {
    if (selectedTeam?.id) {
      fetchSessions({
        team_id: selectedTeam.id,
        // A API pode não suportar busca textual, então fazemos filtro local
      });
    }
  }, [fetchSessions, selectedTeam]);

  const handleMonthChange = useCallback((startDate: string, endDate: string) => {
    if (selectedTeam?.id) {
      fetchSessions({
        team_id: selectedTeam.id,
        start_date: startDate,
        end_date: endDate,
      });
    }
  }, [fetchSessions, selectedTeam]);

  // Handler após criar sessão
  const handleSessionCreated = useCallback((createdSession: TrainingSession, intent: 'close' | 'continue') => {
    setShowCreateModal(false);
    setSelectedDate(null);

    // Recarrega sessões
    if (selectedTeam?.id) {
      fetchSessions({ team_id: selectedTeam.id });
    }

    if (intent === 'continue') {
      setEditingSession(createdSession);
      setShowEditModal(true);
      toast.success('Sessão criada. Continue o planejamento.');
      return;
    }

    toast.success('Rascunho criado com sucesso!');
  }, [fetchSessions, selectedTeam, toast]);

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#111621]">
      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1600px] px-6 lg:px-10 py-4">
        <AgendaHeader
          viewMode={viewFromUrl}
          onViewModeChange={setView}
          rangeLabel={weekPeriod}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
          onToday={handleToday}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={() => handleSearch(searchQuery)}
          onClearFilters={handleClearFilters}
          teams={teams}
          selectedTeam={selectedTeam}
          teamDropdownOpen={teamDropdownOpen}
          onToggleTeamDropdown={() => setTeamDropdownOpen((prev) => !prev)}
          onCloseTeamDropdown={() => setTeamDropdownOpen(false)}
          onSelectTeam={setSelectedTeam}
          onCreateSession={() => handleCreateSession()}
          onImportLegacy={() => setShowImportModal(true)}
          createButtonLabel="Novo treino"
        />
        {pendingReviewCount > 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            Você tem {pendingReviewCount} treino(s) aguardando revisão operacional.
          </div>
        )}

        {draftSessionsCount > 0 && (
          <div className="mb-4 rounded-md px-3 py-2 bg-gray-100 border border-gray-400 w-fit ml-auto">
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <Icons.Status.Info className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  {draftSessionsCount} treino{draftSessionsCount > 1 ? 's' : ''} em rascunho
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Complete o planejamento
                </span>
              </div>
              <button
                onClick={() => {
                  // Scroll to first draft session
                  const firstDraftSession = filteredSessions.find(s => s.status === 'draft');
                  if (firstDraftSession) {
                    const draftElement = document.querySelector(`[data-session-id="${firstDraftSession.id}"]`);
                    if (draftElement) {
                      draftElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Add temporary highlight
                      draftElement.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
                      setTimeout(() => {
                        draftElement.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
                      }, 2000);
                    }
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-[10px] font-medium rounded transition-all shadow-sm hover:shadow-sm"
              >
                <Icons.Actions.Eye className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
        {/* Estado sem equipe selecionada */}
        {!selectedTeam && (
          <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Selecione uma equipe
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Use o seletor de equipe acima para ver os treinos
            </p>
          </div>
        )}

        {/* Estado de erro */}
        {selectedTeam && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300">
                  Falha ao carregar a agenda
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {error}
                </p>
                <button
                  onClick={() => fetchSessions({ team_id: selectedTeam.id })}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline mt-2"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agenda - Semanal ou Mensal */}
        {selectedTeam && !error && (
          viewFromUrl === 'week' ? (
            <>
              <WeeklyAgenda
                sessions={filteredSessions}
                isLoading={isLoading}
                weekStart={currentWeekStart}
                onSessionClick={handleSessionClick}
                onSessionEdit={handleEditSession}
                onSessionReview={handleReviewSession}
                onSessionViewDetails={handleViewDetails}
                onSessionViewExecution={handleViewDetails}
                onSessionViewReport={handleViewReport}
                onSessionMove={handleSessionMove}
                onCreateSession={handleCreateSession}
                onCompleteAndSchedule={handleCompleteAndSchedule}
                onSaveNotes={handleSaveNotes}
                onSessionDelete={handleDeleteSession}
              />
              
              {/* Empty state para busca sem resultados */}
                {debouncedSearchQuery && filteredSessions.length === 0 && (
                  <div className="mt-8">
                    <EmptyState
                      icon={<Search />}
                      title="Nenhum treino encontrado"
                      description={`Sua busca por "${debouncedSearchQuery}" não retornou resultados.`}
                      action={{
                        label: 'Limpar filtros',
                        onClick: handleClearFilters,
                      }}
                    />
                  </div>
                )}
            </>
          ) : (
            <>
              <MonthlyAgenda
                sessions={filteredSessions}
                isLoading={isLoading}
                onCreateSession={handleCreateSession}
                onMonthChange={handleMonthChange}
                onSessionEdit={handleEditSession}
                onSessionReview={handleReviewSession}
                onSessionViewDetails={handleViewDetails}
                onSessionViewExecution={handleViewDetails}
                onSessionViewReport={handleViewReport}
              />
              
              {/* Empty state para busca sem resultados */}
                {debouncedSearchQuery && filteredSessions.length === 0 && (
                  <div className="mt-8">
                    <EmptyState
                      icon={<Search />}
                      title="Nenhum treino encontrado"
                      description={`Sua busca por "${debouncedSearchQuery}" não retornou resultados.`}
                      action={{
                        label: 'Limpar filtros',
                        onClick: handleClearFilters,
                      }}
                    />
                  </div>
                )}
            </>
          )
        )}
      </main>

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateSessionModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDate(null);
          }}
          onSuccess={handleSessionCreated}
          teamId={selectedTeam?.id}
          initialDate={selectedDate}
          recentSessions={sessions}
        />
      )}

      {/* Modal de Edição */}
      <SessionEditorModal
        sessionId={editingSession?.id || null}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSession(null);
        }}
        onSuccess={() => {
          // Refresh sessions to show updated data
          fetchSessions();
        }}
      />

      {/* Modal de Importação CSV Legacy */}
      {showImportModal && (
        <ImportLegacyModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          organizationId={selectedTeam?.organization_id || ''}
        />
      )}

    </div>
  );
}
