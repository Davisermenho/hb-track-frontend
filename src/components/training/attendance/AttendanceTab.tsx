/**
 * AttendanceTab
 * 
 * Tab de registro de presenças com batch operations
 * - Grid de atletas com checkboxes
 * - Participation type (Complete/Partial/Observer)
 * - Minutes effective
 * - Estatísticas real-time
 * - Batch save
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, Save, Loader2, AlertCircle } from 'lucide-react';
import {
  getSessionAttendance,
  batchRecordAttendance,
  getAttendanceStatistics,
  type Attendance,
  type AttendanceInput,
  type PresenceStatus,
  type ParticipationType,
  type ReasonAbsence,
  type AttendanceStatistics,
} from '@/lib/api/attendance';
import { teamsService, type TeamRegistration } from '@/lib/api/teams';
import { Button } from '@/components/ui/Button';

interface AttendanceTabProps {
  sessionId: string;
  teamId?: string;
  sessionDuration?: number;
  actualDurationMinutes?: number;
  isEditable?: boolean;
}

type AttendanceDraft = Partial<AttendanceInput> & {
  athlete_id: string;
  team_registration_id?: string;
};

export function AttendanceTab({
  sessionId,
  teamId,
  sessionDuration,
  actualDurationMinutes,
  isEditable = true,
}: AttendanceTabProps) {
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);
  const [editedRecords, setEditedRecords] = useState<Map<string, AttendanceDraft>>(new Map());
  const [roster, setRoster] = useState<TeamRegistration[]>([]);
  const canEdit = Boolean(isEditable);
  const defaultMinutes = actualDurationMinutes ?? sessionDuration ?? 90;

  // Carrega presenças existentes
  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [attendanceData, statsData] = await Promise.all([
        getSessionAttendance(sessionId),
        getAttendanceStatistics(sessionId),
      ]);
      
      setAttendances(attendanceData);
      setStatistics(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presenças');
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadRoster = useCallback(async () => {
    if (!teamId) {
      setRoster([]);
      return;
    }
    try {
      setRosterLoading(true);
      const response = await teamsService.getAthletes(teamId, { active_only: true, limit: 100 });
      setRoster(response.items || []);
    } catch (err) {
      console.error('Error loading roster:', err);
    } finally {
      setRosterLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadAttendance();
    loadRoster();
  }, [loadAttendance, loadRoster]);

  useEffect(() => {
    if (!canEdit && editedRecords.size > 0) {
      setEditedRecords(new Map());
    }
  }, [canEdit, editedRecords.size]);

  // Handler para atualizar presença
  const handleUpdatePresence = useCallback(
    (athleteId: string, field: keyof AttendanceInput, value: any, teamRegistrationId?: string) => {
      if (!canEdit) {
        return;
      }
      setEditedRecords((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(athleteId) || { athlete_id: athleteId };
        const next: AttendanceDraft = {
          ...existing,
          team_registration_id: teamRegistrationId || existing.team_registration_id,
          [field]: value,
        };
        if (field === 'presence_status') {
          if (value === 'present') {
            next.participation_type = next.participation_type || 'full';
            next.minutes_effective = next.minutes_effective ?? defaultMinutes;
            next.reason_absence = undefined;
            next.comment = undefined;
          } else if (value === 'absent') {
            next.participation_type = undefined;
            next.minutes_effective = undefined;
            next.reason_absence = next.reason_absence || 'outro';
          }
        }
        if (field === 'participation_type' && value === 'did_not_train') {
          next.minutes_effective = 0;
        }
        newMap.set(athleteId, next);
        return newMap;
      });
    },
    [canEdit, defaultMinutes]
  );

  // Handler para salvar em batch
  const handleBatchSave = useCallback(async () => {
    if (!canEdit || editedRecords.size === 0) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const attendanceInputs = Array.from(editedRecords.values())
        .filter((record) => record.presence_status)
        .map((record) => ({
          athlete_id: record.athlete_id,
          team_registration_id: record.team_registration_id,
          presence_status: record.presence_status as PresenceStatus,
          participation_type: record.participation_type,
          minutes_effective: record.minutes_effective,
          reason_absence: record.reason_absence as ReasonAbsence | undefined,
          comment: record.comment,
          source: record.source || 'manual',
          is_medical_restriction: record.is_medical_restriction,
        }));

      if (attendanceInputs.length === 0) {
        setError('Selecione presenças antes de salvar');
        setSaving(false);
        return;
      }
      await batchRecordAttendance(sessionId, { attendances: attendanceInputs });

      // Recarrega dados
      await loadAttendance();
      
      // Limpa edições
      setEditedRecords(new Map());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar presenças');
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  }, [sessionId, editedRecords, loadAttendance, canEdit]);

  // Helper para obter valor editado ou existente
  const getFieldValue = (
    attendance: Attendance | null,
    athleteId: string,
    field: keyof AttendanceInput
  ) => {
    const edited = editedRecords.get(athleteId);
    if (edited && edited[field] !== undefined) {
      return edited[field];
    }
    if (!attendance) return undefined;
    return attendance[field];
  };

  const attendanceByAthlete = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendances.forEach((attendance) => {
      map.set(attendance.athlete_id, attendance);
    });
    return map;
  }, [attendances]);

  const rows = useMemo(() => {
    if (roster.length > 0) {
      return roster.map((registration) => ({
        athlete_id: registration.athlete_id,
        team_registration_id: registration.id,
        athlete: registration.athlete,
        attendance: attendanceByAthlete.get(registration.athlete_id) || null,
      }));
    }
    return attendances.map((attendance) => ({
      athlete_id: attendance.athlete_id,
      team_registration_id: attendance.team_registration_id,
      athlete: attendance.athlete,
      attendance,
    }));
  }, [roster, attendances, attendanceByAthlete]);

  const pendingCount = useMemo(() => {
    return rows.filter((row) => {
      const currentStatus = getFieldValue(row.attendance, row.athlete_id, 'presence_status');
      return !currentStatus;
    }).length;
  }, [rows, getFieldValue]);

  const applyAllPresent = () => {
    if (!canEdit) return;
    setEditedRecords((prev) => {
      const next = new Map(prev);
      rows.forEach((row) => {
        const current = next.get(row.athlete_id) || { athlete_id: row.athlete_id };
        next.set(row.athlete_id, {
          ...current,
          team_registration_id: row.team_registration_id,
          presence_status: 'present',
          participation_type: current.participation_type || 'full',
          minutes_effective: current.minutes_effective ?? defaultMinutes,
          reason_absence: undefined,
          comment: undefined,
        });
      });
      return next;
    });
  };

  const applyMinutesToPresent = () => {
    if (!canEdit) return;
    const input = window.prompt('Quantos minutos para todos os presentes?');
    if (!input) return;
    const minutes = Number(input);
    if (!Number.isFinite(minutes) || minutes < 0) return;
    setEditedRecords((prev) => {
      const next = new Map(prev);
      rows.forEach((row) => {
        const status = getFieldValue(row.attendance, row.athlete_id, 'presence_status');
        if (status === 'present') {
          const current = next.get(row.athlete_id) || { athlete_id: row.athlete_id };
          next.set(row.athlete_id, {
            ...current,
            team_registration_id: row.team_registration_id,
            presence_status: 'present',
            minutes_effective: minutes,
          });
        }
      });
      return next;
    });
  };

  const clearEdits = () => {
    if (!canEdit) return;
    setEditedRecords(new Map());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error && attendances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={loadAttendance} variant="secondary" size="sm">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!canEdit && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Somente leitura. Presencas so podem ser editadas na revisao operacional.
          </p>
        </div>
      )}

      {/* Statistics Header */}
      {statistics && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Presenças
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {statistics.present_count} / {statistics.total_athletes}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Taxa
              </p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {statistics.attendance_rate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Ausências
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {statistics.absent_count}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button
                  onClick={applyAllPresent}
                  variant="outline"
                  className="text-xs"
                  disabled={saving}
                >
                  Marcar todos presentes
                </Button>
                <Button
                  onClick={applyMinutesToPresent}
                  variant="outline"
                  className="text-xs"
                  disabled={saving}
                >
                  Aplicar minutos iguais
                </Button>
                <Button
                  onClick={clearEdits}
                  variant="outline"
                  className="text-xs"
                  disabled={saving || editedRecords.size === 0}
                >
                  Limpar alterações
                </Button>
              </>
            )}
            {canEdit && editedRecords.size > 0 && (
              <Button
                onClick={handleBatchSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar {editedRecords.size} {editedRecords.size === 1 ? 'Alteração' : 'Alterações'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Attendance Grid */}
      {rows.length === 0 && !rosterLoading ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhum atleta cadastrado para esta sessão
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingCount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              {pendingCount} atleta(s) ainda sem presenca definida.
            </div>
          )}

          {rows.map((row) => {
            const attendance = row.attendance;
            const isEdited = canEdit && editedRecords.has(row.athlete_id);
            const presenceStatus = getFieldValue(attendance, row.athlete_id, 'presence_status') as PresenceStatus | undefined;
            const participationType = getFieldValue(attendance, row.athlete_id, 'participation_type') as ParticipationType | undefined;
            const minutesEffective = getFieldValue(attendance, row.athlete_id, 'minutes_effective') as number | undefined;
            const reasonAbsence = getFieldValue(attendance, row.athlete_id, 'reason_absence') as ReasonAbsence | undefined;
            const comment = getFieldValue(attendance, row.athlete_id, 'comment') as string | undefined;

            return (
              <div
                key={attendance?.id || row.athlete_id}
                className={`
                  p-4 rounded-lg border transition-all
                  ${isEdited
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a]'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Athlete Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {row.athlete?.athlete_nickname || row.athlete?.athlete_name || 'Atleta'}
                    </p>
                  </div>

                  {/* Presence Status */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdatePresence(
                          row.athlete_id,
                          'presence_status',
                          'present',
                          row.team_registration_id
                        )
                      }
                      disabled={!canEdit}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                        ${presenceStatus === 'present'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700'
                          : 'bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }
                        ${canEdit ? '' : 'opacity-60 cursor-not-allowed'}
                      `}
                    >
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdatePresence(
                          row.athlete_id,
                          'presence_status',
                          'absent',
                          row.team_registration_id
                        )
                      }
                      disabled={!canEdit}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                        ${presenceStatus === 'absent'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700'
                          : 'bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }
                        ${canEdit ? '' : 'opacity-60 cursor-not-allowed'}
                      `}
                    >
                      Ausente
                    </button>
                  </div>

                  {/* Participation Type (only if present) */}
                  {presenceStatus === 'present' && (
                    <select
                      value={participationType || 'full'}
                      onChange={(e) =>
                        handleUpdatePresence(
                          row.athlete_id,
                          'participation_type',
                          e.target.value as ParticipationType,
                          row.team_registration_id
                        )
                      }
                      disabled={!canEdit}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="full">Completa</option>
                      <option value="partial">Parcial</option>
                      <option value="adapted">Adaptado</option>
                      <option value="did_not_train">Nao treinou</option>
                    </select>
                  )}

                  {/* Minutes Effective */}
                  {presenceStatus === 'present' && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        max={defaultMinutes}
                        value={minutesEffective ?? ''}
                        onChange={(e) =>
                          handleUpdatePresence(
                            row.athlete_id,
                            'minutes_effective',
                            parseInt(e.target.value, 10) || 0,
                            row.team_registration_id
                          )
                        }
                        placeholder="Min"
                        disabled={!canEdit}
                        className="w-16 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500">min</span>
                    </div>
                  )}
                </div>

                {/* Ausência - Detalhes */}
                {presenceStatus === 'absent' && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Motivo da ausencia
                      </label>
                      <select
                        value={reasonAbsence || ''}
                        onChange={(e) =>
                          handleUpdatePresence(
                            row.athlete_id,
                            'reason_absence',
                            e.target.value as ReasonAbsence,
                            row.team_registration_id
                          )
                        }
                        disabled={!canEdit}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="">Selecionar</option>
                        <option value="medico">Medico</option>
                        <option value="escola">Escola</option>
                        <option value="familiar">Familiar</option>
                        <option value="opcional">Opcional</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Comentario
                      </label>
                      <input
                        type="text"
                        value={comment || ''}
                        onChange={(e) =>
                          handleUpdatePresence(
                            row.athlete_id,
                            'comment',
                            e.target.value,
                            row.team_registration_id
                          )
                        }
                        disabled={!canEdit}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="Observacao opcional"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
