'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  MapPin,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TrainingSession, TrainingSessionsAPI } from '@/lib/api/trainings';
import {
  Attendance,
  AttendanceStatistics,
  getAttendanceStatistics,
  getSessionAttendance,
} from '@/lib/api/attendance';
import {
  SessionExercise,
  getSessionExercises,
} from '@/lib/api/session-exercises';

const OUTCOME_LABELS: Record<string, string> = {
  on_time: 'No horario',
  delayed: 'Atrasou',
  canceled: 'Cancelado',
  shortened: 'Encurtou',
  extended: 'Estendeu',
};

const FOCUS_LABELS: Record<string, string> = {
  focus_attack_positional_pct: 'Ataque posicional',
  focus_defense_positional_pct: 'Defesa posicional',
  focus_transition_offense_pct: 'Transicao ofensiva',
  focus_transition_defense_pct: 'Transicao defensiva',
  focus_attack_technical_pct: 'Tecnico ataque',
  focus_defense_technical_pct: 'Tecnico defesa',
  focus_physical_pct: 'Fisico',
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function formatTime(value?: Date | null) {
  if (!value) return '-';
  return value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatMinutes(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${value} min`;
}

export function RelatorioClient() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatistics | null>(null);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const sessionData = await TrainingSessionsAPI.getSession(sessionId as string);
        if (!isMounted) return;
        setSession(sessionData);
      } catch (err) {
        if (isMounted) {
          setError('Nao foi possivel carregar o relatorio.');
          setIsLoading(false);
        }
        return;
      }

      const [attendanceResult, statsResult, exercisesResult] = await Promise.allSettled([
        getSessionAttendance(sessionId as string),
        getAttendanceStatistics(sessionId as string),
        getSessionExercises(sessionId as string),
      ]);

      if (!isMounted) return;

      if (attendanceResult.status === 'fulfilled') {
        setAttendance(attendanceResult.value);
      } else {
        setAttendance([]);
      }

      if (statsResult.status === 'fulfilled') {
        setAttendanceStats(statsResult.value);
      } else {
        setAttendanceStats(null);
      }

      if (exercisesResult.status === 'fulfilled') {
        setExercises(exercisesResult.value.exercises || []);
      } else {
        setExercises([]);
      }

      setIsLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const plannedStart = useMemo(() => {
    if (!session) return null;
    return new Date(session.session_at);
  }, [session]);

  const plannedEnd = useMemo(() => {
    if (!session || !plannedStart || !session.duration_planned_minutes) return null;
    return new Date(plannedStart.getTime() + session.duration_planned_minutes * 60000);
  }, [session, plannedStart]);

  const actualStart = useMemo(() => {
    if (!session) return null;
    return new Date(session.started_at || session.session_at);
  }, [session]);

  const actualEnd = useMemo(() => {
    if (!session || !actualStart) return null;
    if (session.ended_at) return new Date(session.ended_at);
    if (session.duration_actual_minutes) {
      return new Date(actualStart.getTime() + session.duration_actual_minutes * 60000);
    }
    return null;
  }, [session, actualStart]);

  const actualDuration = useMemo(() => {
    if (!actualStart || !actualEnd) return session?.duration_actual_minutes ?? null;
    const diffMinutes = Math.round((actualEnd.getTime() - actualStart.getTime()) / 60000);
    return diffMinutes;
  }, [actualStart, actualEnd, session]);

  const focusEntries = useMemo(() => {
    if (!session) return [];
    const entries = [
      { key: 'focus_attack_positional_pct', value: session.focus_attack_positional_pct || 0 },
      { key: 'focus_defense_positional_pct', value: session.focus_defense_positional_pct || 0 },
      { key: 'focus_transition_offense_pct', value: session.focus_transition_offense_pct || 0 },
      { key: 'focus_transition_defense_pct', value: session.focus_transition_defense_pct || 0 },
      { key: 'focus_attack_technical_pct', value: session.focus_attack_technical_pct || 0 },
      { key: 'focus_defense_technical_pct', value: session.focus_defense_technical_pct || 0 },
      { key: 'focus_physical_pct', value: session.focus_physical_pct || 0 },
    ].filter((entry) => entry.value > 0);
    return entries;
  }, [session]);

  const focusTotal = focusEntries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatório do treino</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Resumo final da sessão</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/training/agenda')}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para agenda
          </Button>
          {session && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <ClipboardCheck className="w-4 h-4" />
              Realizado
            </div>
          )}
        </div>

        {isLoading && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 text-sm text-slate-500">
            Carregando relatorio...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && session && (
          <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sessao
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {session.main_objective || 'Treino sem objetivo principal'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {session.secondary_objective || 'Objetivo secundario nao informado'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(session.session_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{session.location || 'Local nao informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>{session.session_type || 'Tipo nao informado'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Planejado vs realizado
                </h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Inicio planejado</span>
                    <span>{plannedStart ? formatTime(plannedStart) : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Inicio real</span>
                    <span>{actualStart ? formatTime(actualStart) : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fim planejado</span>
                    <span>{plannedEnd ? formatTime(plannedEnd) : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fim real</span>
                    <span>{actualEnd ? formatTime(actualEnd) : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duracao planejada</span>
                    <span>{formatMinutes(session.duration_planned_minutes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duracao real</span>
                    <span>{formatMinutes(actualDuration)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Outcome e observacoes
                </h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span>{OUTCOME_LABELS[session.execution_outcome] || 'Indefinido'}</span>
                  </div>
                  {session.delay_minutes ? (
                    <div className="flex items-center justify-between">
                      <span>Atraso</span>
                      <span>{formatMinutes(session.delay_minutes)}</span>
                    </div>
                  ) : null}
                  {session.cancellation_reason ? (
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Motivo do cancelamento
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {session.cancellation_reason}
                      </p>
                    </div>
                  ) : null}
                  {session.deviation_justification ? (
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Justificativa operacional
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {session.deviation_justification}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Presencas
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-4 h-4" />
                    {attendanceStats
                      ? `${attendanceStats.present_count}/${attendanceStats.total_athletes}`
                      : `${attendance.length}`}
                  </div>
                </div>
                {attendanceStats ? (
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Taxa de presenca: {attendanceStats.attendance_rate.toFixed(1)}%
                  </div>
                ) : null}
                <div className="space-y-2">
                  {attendance.length === 0 ? (
                    <p className="text-sm text-slate-500">Sem presencas registradas.</p>
                  ) : (
                    attendance.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-200">
                          {item.athlete?.athlete_name || 'Atleta'}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.presence_status === 'present' ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Conteudo planejado
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-4 h-4" />
                    {exercises.length} exercicios
                  </div>
                </div>
                <div className="space-y-2">
                  {exercises.length === 0 ? (
                    <p className="text-sm text-slate-500">Sem exercicios cadastrados.</p>
                  ) : (
                    exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-200">
                          {exercise.exercise?.name || 'Exercicio'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {exercise.duration_minutes ? `${exercise.duration_minutes} min` : '-'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Focos do treino
                </h3>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total {focusTotal}/120
                </div>
              </div>
              {focusEntries.length === 0 ? (
                <p className="text-sm text-slate-500">Sem focos informados.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {focusEntries.map((entry) => (
                    <div
                      key={entry.key}
                      className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-700 dark:text-slate-200">
                        {FOCUS_LABELS[entry.key] || entry.key}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f0f0f] p-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trilha de auditoria
              </p>
              <div className="flex items-center justify-between">
                <span>Revisado em</span>
                <span>{formatDateTime(session.closed_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revisado por</span>
                <span>{session.closed_by_user_id || '-'}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
