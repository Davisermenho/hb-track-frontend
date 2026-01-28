/**
 * API: Attendance (Presenças)
 * 
 * Gerenciamento de presenças em sessões de treino com:
 * - Batch operations para performance
 * - Eager loading (<50ms)
 * - LGPD compliance
 * - Estatísticas real-time
 */

import { apiClient } from './client';

/**
 * Status de presença (backend canonical)
 */
export type PresenceStatus = 'present' | 'absent';

/**
 * Tipo de participação (backend canonical)
 */
export type ParticipationType = 'full' | 'partial' | 'adapted' | 'did_not_train';

/**
 * Motivo de ausência (backend canonical)
 */
export type ReasonAbsence = 'medico' | 'escola' | 'familiar' | 'opcional' | 'outro';

/**
 * Attendance Record (Registro de Presença)
 */
export interface Attendance {
  id: string;
  training_session_id: string;
  team_registration_id: string;
  athlete_id: string;
  
  // Status
  presence_status: PresenceStatus;
  participation_type?: ParticipationType;
  
  // Métricas
  minutes_effective?: number; // Minutos efetivos participados
  
  // Justificativas
  reason_absence?: ReasonAbsence;
  comment?: string;

  // Auditoria
  source?: 'manual' | 'import' | 'correction';
  is_medical_restriction?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (eager loaded)
  athlete?: {
    id: string;
    athlete_name: string;
    athlete_nickname?: string;
    shirt_number?: number;
    state?: string;
  };
}

/**
 * Create/Update attendance payload
 */
export interface AttendanceInput {
  athlete_id: string;
  team_registration_id?: string;
  presence_status: PresenceStatus;
  participation_type?: ParticipationType;
  minutes_effective?: number;
  reason_absence?: ReasonAbsence;
  comment?: string;
  source?: 'manual' | 'import' | 'correction';
  is_medical_restriction?: boolean;
}

/**
 * Batch attendance payload
 */
export interface BatchAttendanceInput {
  attendances: AttendanceInput[];
}

/**
 * Attendance Statistics
 */
export interface AttendanceStatistics {
  total_athletes: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number; // Percentage
}

/**
 * API Functions
 */

/**
 * Busca presenças de uma sessão
 * Endpoint: GET /training_sessions/{id}/attendance
 * Performance: <50ms com eager loading
 */
export async function getSessionAttendance(
  sessionId: string,
  filters?: {
    athlete_id?: string;
    status?: PresenceStatus;
  }
): Promise<Attendance[]> {
  const params = new URLSearchParams();
  if (filters?.athlete_id) params.set('athlete_id', filters.athlete_id);
  if (filters?.status) params.set('status', filters.status);
  
  const queryString = params.toString();
  const url = `/training_sessions/${sessionId}/attendance${queryString ? `?${queryString}` : ''}`;
  
  return await apiClient.get<Attendance[]>(url);
}

/**
 * Cria/atualiza presenças em lote (batch operation)
 * Endpoint: POST /training_sessions/{id}/attendance/batch
 */
export async function batchRecordAttendance(
  sessionId: string,
  data: BatchAttendanceInput
): Promise<Attendance[]> {
  return await apiClient.post<Attendance[]>(
    `/training_sessions/${sessionId}/attendance/batch`,
    data
  );
}

/**
 * Cria uma presença individual
 * Endpoint: POST /attendance
 */
export async function createAttendance(
  data: AttendanceInput & { training_session_id: string }
): Promise<Attendance> {
  return await apiClient.post<Attendance>('/attendance', data);
}

/**
 * Atualiza uma presença existente
 * Endpoint: PATCH /attendance/{id}
 */
export async function updateAttendance(
  attendanceId: string,
  data: Partial<AttendanceInput>
): Promise<Attendance> {
  return await apiClient.patch<Attendance>(
    `/attendance/${attendanceId}`,
    data
  );
}

/**
 * Busca estatísticas de presença de uma sessão
 * Endpoint: GET /training_sessions/{id}/attendance/statistics
 */
export async function getAttendanceStatistics(
  sessionId: string
): Promise<AttendanceStatistics> {
  return await apiClient.get<AttendanceStatistics>(
    `/training_sessions/${sessionId}/attendance/statistics`
  );
}
