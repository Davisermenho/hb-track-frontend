/**
 * MonthlyAgenda
 *
 * Visao mensal de densidade + triagem.
 * - Mostra contagem de pendencias e sessoes por dia
 * - Exibe pílulas compactas (ate 2 por dia)
 * - Abre drawer do dia com lista e CTAs por status
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import AppDrawer from '@/components/ui/AppDrawer';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/design-system/icons';
import type { TrainingSession } from '@/lib/api/trainings';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const STATUS_CONFIG: Record<string, { pill: string; label: string }> = {
  draft: { pill: 'border-l-violet-500 bg-violet-50/50 text-violet-700', label: 'Rascunho' },
  scheduled: { pill: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-700', label: 'Agendado' },
  in_progress: { pill: 'border-l-sky-500 bg-sky-50 text-sky-700', label: 'Em andamento' },
  pending_review: { pill: 'border-l-amber-500 bg-amber-50 text-amber-700', label: 'Revisão pendente' },
  readonly: { pill: 'border-l-slate-400 bg-slate-50 text-slate-600', label: 'Congelado' },
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  quadra: 'Quadra',
  fisico: 'Físico',
  video: 'Vídeo',
  reuniao: 'Reunião',
  teste: 'Teste',
};

const SESSION_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  quadra: Icons.Training.Session,
  fisico: Icons.Training.Physical,
  video: Icons.UI.Video,
  reuniao: Icons.UI.Users,
  teste: Icons.Charts.Bar,
};

type MonthlyFilter = 'all' | 'pending_review' | 'scheduled' | 'draft';

interface MonthlyAgendaProps {
  sessions: TrainingSession[];
  isLoading?: boolean;
  onCreateSession?: (date: string) => void;
  onMonthChange?: (startDate: string, endDate: string) => void;
  onSessionEdit?: (session: TrainingSession) => void;
  onSessionReview?: (session: TrainingSession) => void;
  onSessionViewDetails?: (session: TrainingSession) => void;
  onSessionViewExecution?: (session: TrainingSession) => void;
  onSessionViewReport?: (session: TrainingSession) => void;
}

export function MonthlyAgenda({
  sessions,
  isLoading = false,
  onCreateSession,
  onMonthChange,
  onSessionEdit,
  onSessionReview,
  onSessionViewDetails,
  onSessionViewExecution,
  onSessionViewReport,
}: MonthlyAgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<MonthlyFilter>('all');
  const [drawerDateKey, setDrawerDateKey] = useState<string | null>(null);

  useEffect(() => {
    if (!onMonthChange) return;
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    onMonthChange(
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
  }, [currentDate, onMonthChange]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentDate]);

  const sessionsByDayAll = useMemo(() => {
    const grouped: Record<string, TrainingSession[]> = {};
    sessions.forEach((session) => {
      const key = new Date(session.session_at).toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    });
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => new Date(a.session_at).getTime() - new Date(b.session_at).getTime());
    });
    return grouped;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions;
    return sessions.filter((session) => session.status === filter);
  }, [sessions, filter]);

  const sessionsByDayFiltered = useMemo(() => {
    const grouped: Record<string, TrainingSession[]> = {};
    filteredSessions.forEach((session) => {
      const key = new Date(session.session_at).toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    });
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => new Date(a.session_at).getTime() - new Date(b.session_at).getTime());
    });
    return grouped;
  }, [filteredSessions]);

  const drawerSessions = useMemo(() => {
    if (!drawerDateKey) return [];
    return sessionsByDayAll[drawerDateKey] || [];
  }, [drawerDateKey, sessionsByDayAll]);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const openDrawer = (dateKey: string) => {
    setDrawerDateKey(dateKey);
  };

  const closeDrawer = () => {
    setDrawerDateKey(null);
  };

  if (isLoading) {
    return <MonthlyAgendaSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="Todos"
        />
        <FilterButton
          active={filter === 'pending_review'}
          onClick={() => setFilter('pending_review')}
          label="Pendências"
        />
        <FilterButton
          active={filter === 'scheduled'}
          onClick={() => setFilter('scheduled')}
          label="Agendados"
        />
        <FilterButton
          active={filter === 'draft'}
          onClick={() => setFilter('draft')}
          label="Rascunhos"
        />
      </div>

      <div className="bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1f2e]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              <Icons.Navigation.Left className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              <Icons.Navigation.Right className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="h-8 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-md transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Hoje
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1f2e]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = day?.toISOString().split('T')[0] || '';
            const daySessionsAll = dateKey ? sessionsByDayAll[dateKey] || [] : [];
            const daySessionsFiltered = dateKey ? sessionsByDayFiltered[dateKey] || [] : [];
            const today = isToday(day);
            const pendingCount = daySessionsAll.filter((s) => s.status === 'pending_review').length;
            const inProgress = daySessionsAll.some((s) => s.status === 'in_progress');
            const displaySessions = (filter === 'all' ? daySessionsAll : daySessionsFiltered).slice(0, 2);
            const overflowCount =
              (filter === 'all' ? daySessionsAll : daySessionsFiltered).length - displaySessions.length;
            const dimCell = filter !== 'all' && daySessionsFiltered.length === 0;

            return (
              <div
                key={index}
                onClick={() => {
                  if (day) {
                    openDrawer(dateKey);
                  }
                }}
                className={`
                  min-h-[110px] p-2 border-b border-r bg-white hover:bg-slate-50 transition-colors cursor-pointer group relative
                  ${!day ? 'bg-[#f6f6f8] dark:bg-[#111621]' : ''}
                  ${today ? 'bg-[#2463eb]/5 dark:bg-[#2463eb]/10' : ''}
                  ${pendingCount > 0 ? 'ring-1 ring-inset ring-amber-100' : ''}
                  ${dimCell ? 'opacity-40' : ''}
                `}
              >
                {day && (
                  <>
                    <div className="flex items-start justify-between mb-1.5">
                      <span className={`text-sm font-semibold ${day ? 'text-slate-900' : 'text-slate-300'}`}>
                        {day.getDate()}
                      </span>
                      {pendingCount > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1 py-0 h-4 uppercase font-bold"
                        >
                          {pendingCount} pend.
                        </Badge>
                      )}
                      {inProgress && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      {displaySessions.map((session) => {
                        const typeKey = (session.session_type || 'quadra').toLowerCase().trim();
                        const TypeIcon = SESSION_TYPE_ICONS[typeKey] || Icons.Training.Session;
                        const typeLabel = SESSION_TYPE_LABELS[typeKey] || 'Treino';
                        const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.draft;
                        const timeLabel = format(new Date(session.session_at), 'HH:mm');
                        const focus = buildFocusSegments(session);
                        const focusTotal = focus.reduce((sum, segment) => sum + segment.value, 0);

                        return (
                          <div key={session.id} className="flex flex-col gap-0.5">
                            <div
                              className={`flex items-center gap-1 px-1.5 py-0.5 border-l-2 rounded-r text-[10px] font-medium truncate ${status.pill}`}
                            >
                              <span className="shrink-0 tabular-nums">{timeLabel}</span>
                              <TypeIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate uppercase tracking-tighter">{typeLabel}</span>
                            </div>
                            <div className="flex h-0.5 w-full overflow-hidden rounded bg-slate-200">
                              {focusTotal > 0 ? (
                                focus.map((segment) =>
                                  segment.value > 0 ? (
                                    <div
                                      key={`${session.id}-${segment.key}`}
                                      className={segment.color}
                                      style={{ width: `${(segment.value / 120) * 100}%` }}
                                    />
                                  ) : null
                                )
                              ) : (
                                focus.map((segment) => (
                                  <div
                                    key={`${session.id}-${segment.key}`}
                                    className={`${segment.color} opacity-40`}
                                    style={{ width: `${100 / focus.length}%` }}
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {overflowCount > 0 && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDrawer(dateKey);
                          }}
                          className="text-[10px] text-slate-400 font-bold pl-1 text-left"
                        >
                          + {overflowCount} sessões
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCreateSession?.(dateKey);
                      }}
                      className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-slate-900 text-white rounded-md transition-all"
                    >
                      <Icons.Actions.Add className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AppDrawer
        isOpen={!!drawerDateKey}
        onClose={closeDrawer}
        title={drawerDateKey ? `Dia ${format(new Date(drawerDateKey), 'dd/MM')} - Sessões` : 'Sessões'}
        size="md"
      >
        <div className="px-4 pb-6">
          <p className="text-sm text-slate-500 mb-4">
            Gerencie e revise os treinos deste dia.
          </p>

          {drawerSessions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-slate-400 text-sm">Nenhum treino agendado.</p>
              <button
                type="button"
                onClick={() => {
                  if (drawerDateKey) {
                    onCreateSession?.(drawerDateKey);
                  }
                }}
                className="mt-2 text-blue-600 font-bold text-xs uppercase hover:underline"
              >
                Criar agora
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {drawerSessions.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  onEdit={onSessionEdit}
                  onReview={onSessionReview}
                  onViewDetails={onSessionViewDetails}
                  onViewExecution={onSessionViewExecution}
                  onViewReport={onSessionViewReport}
                />
              ))}
            </div>
          )}
        </div>
      </AppDrawer>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg border transition-colors ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function SessionListItem({
  session,
  onEdit,
  onReview,
  onViewDetails,
  onViewExecution,
  onViewReport,
}: {
  session: TrainingSession;
  onEdit?: (session: TrainingSession) => void;
  onReview?: (session: TrainingSession) => void;
  onViewDetails?: (session: TrainingSession) => void;
  onViewExecution?: (session: TrainingSession) => void;
  onViewReport?: (session: TrainingSession) => void;
}) {
  const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.draft;
  const timeLabel = format(new Date(session.session_at), 'HH:mm');
  const focusTotal = buildFocusSegments(session).reduce((sum, segment) => sum + segment.value, 0);
  const focusOk = focusTotal <= 120;
  const outcomeMissing = session.status === 'pending_review' && !session.execution_outcome;
  const attendanceTotal = session.attendance_total_count;
  const attendancePresent = session.attendance_present_count;
  const presencePending =
    session.status === 'pending_review' &&
    (attendanceTotal === undefined || attendanceTotal === null || attendancePresent === undefined);

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 tabular-nums">{timeLabel}</span>
            <Badge className={`text-[10px] uppercase ${status.pill}`}>{status.label}</Badge>
          </div>
          <h4 className="font-bold text-slate-900 leading-tight">
            {session.main_objective || 'Treino sem título'}
          </h4>
          <span className={`text-[10px] font-semibold ${focusOk ? 'text-emerald-600' : 'text-rose-600'}`}>
            Total foco: {focusTotal}/120
          </span>
        </div>
        <button className="text-slate-300 hover:text-slate-600">
          <Icons.UI.More className="h-4 w-4" />
        </button>
      </div>

      {session.status === 'pending_review' && (
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
            <Icons.Status.Warning className="h-3 w-3" />
            Revisão pendente
          </span>
          {outcomeMissing && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              <Icons.Status.Warning className="h-3 w-3" />
              Outcome não definido
            </span>
          )}
          {presencePending && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              <Icons.Status.Warning className="h-3 w-3" />
              Presenças pendentes
            </span>
          )}
        </div>
      )}

      <div className="pt-2">
        {session.status === 'draft' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(session)}
              className="flex-1 bg-slate-900 text-white text-[11px] font-bold py-2 rounded-lg uppercase tracking-wider"
            >
              Abrir editor
            </button>
          </div>
        )}

        {session.status === 'scheduled' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onViewDetails?.(session)}
              className="flex-1 bg-slate-900 text-white text-[11px] font-bold py-2 rounded-lg uppercase tracking-wider"
            >
              Ver detalhes
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(session)}
              className="px-3 border border-slate-200 text-slate-600 rounded-lg"
            >
              Editar sessão
            </button>
          </div>
        )}

        {session.status === 'in_progress' && (
          <div className="flex items-center justify-between text-[11px] font-medium text-sky-600 bg-sky-50 p-2 rounded-lg">
            <span className="flex items-center gap-2">
              <Icons.Training.Performance className="h-4 w-4" />
              Iniciado automaticamente pelo sistema
            </span>
            <button
              type="button"
              onClick={() => onViewExecution?.(session)}
              className="font-bold uppercase underline"
            >
              Ver
            </button>
          </div>
        )}

        {session.status === 'pending_review' && (
          <button
            type="button"
            onClick={() => onReview?.(session)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-2 rounded-lg uppercase tracking-wider shadow-sm"
          >
            Abrir sessão
          </button>
        )}

        {session.status === 'readonly' && (
          <button
            type="button"
            onClick={() => onViewReport?.(session)}
            className="w-full bg-white border border-slate-200 text-slate-700 text-[11px] font-bold py-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2"
          >
            Ver relatório
            <Icons.Actions.Eye className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function buildFocusSegments(session: TrainingSession) {
  return [
    { key: 'focus_attack_positional_pct', color: 'bg-emerald-500', value: Number(session.focus_attack_positional_pct) || 0 },
    { key: 'focus_defense_positional_pct', color: 'bg-sky-500', value: Number(session.focus_defense_positional_pct) || 0 },
    { key: 'focus_transition_offense_pct', color: 'bg-indigo-500', value: Number(session.focus_transition_offense_pct) || 0 },
    { key: 'focus_transition_defense_pct', color: 'bg-violet-500', value: Number(session.focus_transition_defense_pct) || 0 },
    { key: 'focus_attack_technical_pct', color: 'bg-amber-500', value: Number(session.focus_attack_technical_pct) || 0 },
    { key: 'focus_defense_technical_pct', color: 'bg-rose-500', value: Number(session.focus_defense_technical_pct) || 0 },
    { key: 'focus_physical_pct', color: 'bg-lime-500', value: Number(session.focus_physical_pct) || 0 },
  ];
}

function MonthlyAgendaSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="h-14 border-b border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[110px] border-b border-r border-slate-100 dark:border-slate-800 p-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
