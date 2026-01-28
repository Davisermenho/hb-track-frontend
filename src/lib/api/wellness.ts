/**
 * API: Wellness Pre/Post
 * 
 * Gerenciamento de wellness reports com:
 * - Permissões duplas (atleta self-only + staff read-all)
 * - Janelas temporais de edição
 * - Validação de deadlines
 * - Histórico e tendências
 */

import { apiClient } from './client';

/**
 * Wellness Pre (Pré-Treino)
 */
export interface WellnessPre {
  id: string;
  training_session_id: string;
  athlete_id: string;
  
  // Métricas (0-10)
  sleep_quality: number;
  fatigue_level: number;
  stress_level: number;
  muscle_soreness: number;
  mood: number;
  readiness: number;
  
  // Metadados
  notes?: string;
  filled_at: string;
  locked_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  session?: {
    id: string;
    session_at: string;
    session_type: string;
    duration_planned_minutes?: number;
  };
}

/**
 * Wellness Post (Pós-Treino)
 */
export interface WellnessPost {
  id: string;
  training_session_id: string;
  athlete_id: string;
  
  // Métricas (0-10)
  session_rpe: number; // Rating of Perceived Exertion
  fatigue_after: number;
  mood_after: number;
  muscle_soreness_after: number;
  
  // Calculado automaticamente (trigger)
  internal_load?: number;
  minutes_effective?: number;
  
  // Metadados
  notes?: string;
  filled_at: string;
  locked_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  session?: {
    id: string;
    session_at: string;
    session_type: string;
    duration_planned_minutes?: number;
  };
}

/**
 * Wellness Pre Input
 */
export interface WellnessPreInput {
  sleep_quality: number;
  fatigue_level: number;
  stress_level: number;
  muscle_soreness: number;
  mood: number;
  readiness: number;
  notes?: string;
}

/**
 * Wellness Post Input
 */
export interface WellnessPostInput {
  session_rpe: number;
  fatigue_after: number;
  mood_after: number;
  muscle_soreness_after: number;
  minutes_effective?: number;
  notes?: string;
}

/**
 * Session Wellness Status
 */
export interface SessionWellnessStatus {
  session_id: string;
  total_athletes: number;
  responded_pre: number;
  responded_post: number;
  pending_pre: string[]; // athlete_ids
  pending_post: string[]; // athlete_ids
  response_rate_pre: number; // percentage
  response_rate_post: number; // percentage
}

/**
 * Athlete Wellness Summary
 */
export interface AthleteWellnessSummary {
  athlete_id: string;
  period_days: number;
  
  // Pre averages
  avg_sleep_quality: number;
  avg_fatigue_level: number;
  avg_stress_level: number;
  avg_muscle_soreness: number;
  avg_mood: number;
  avg_readiness: number;
  
  // Post averages
  avg_session_rpe: number;
  avg_internal_load: number;
  
  // Response rate
  total_sessions: number;
  responded_pre: number;
  responded_post: number;
  response_rate: number; // percentage
  
  // Critical patterns
  high_fatigue_days: number; // >= 8
  high_stress_days: number; // >= 8
  low_readiness_days: number; // <= 3
}

/**
 * Wellness Preset
 */
export interface WellnessPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  values: Partial<WellnessPreInput>;
}

/**
 * Deadline Info
 */
export interface DeadlineInfo {
  deadline: string; // ISO datetime
  remaining_minutes: number;
  is_expired: boolean;
  can_edit: boolean;
}

/**
 * API Functions - Wellness Pre
 */

/**
 * Submete wellness pré-treino
 * Endpoint: POST /wellness_pre
 * Permissão: Atleta (self-only)
 */
export async function submitWellnessPre(
  sessionId: string,
  data: WellnessPreInput
): Promise<WellnessPre> {
  return await apiClient.post<WellnessPre>('/wellness_pre', {
    training_session_id: sessionId,
    ...data,
  });
}

/**
 * Busca wellness pre existente do atleta
 * Endpoint: GET /wellness_pre?training_session_id={id}&athlete_id=me
 */
export async function getMyWellnessPre(sessionId: string): Promise<WellnessPre | null> {
  try {
    const response = await apiClient.get<WellnessPre[]>('/wellness_pre', {
      params: {
        training_session_id: sessionId,
        athlete_id: 'me', // Backend resolve para user.athlete_id
      },
    });
    return response[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Busca status de wellness de uma sessão
 * Endpoint: GET /wellness_pre/sessions/{session_id}/status
 * Permissão: Staff (todos do team)
 */
export async function getSessionWellnessStatus(
  sessionId: string
): Promise<SessionWellnessStatus> {
  return await apiClient.get<SessionWellnessStatus>(
    `/wellness_pre/sessions/${sessionId}/status`
  );
}

/**
 * Busca histórico wellness do atleta
 * Endpoint: GET /athletes/me/wellness-summary?days={days}
 */
export async function getMyWellnessSummary(days: number = 28): Promise<AthleteWellnessSummary> {
  return await apiClient.get<AthleteWellnessSummary>(
    `/athletes/me/wellness-summary`,
    {
      params: { days },
    }
  );
}

/**
 * Calcula informações de deadline
 */
export function calculateDeadline(sessionAt: string): DeadlineInfo {
  const sessionDate = new Date(sessionAt);
  const deadline = new Date(sessionDate.getTime() - 2 * 60 * 60 * 1000); // 2h antes
  const now = new Date();
  const remaining_minutes = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));
  
  return {
    deadline: deadline.toISOString(),
    remaining_minutes,
    is_expired: remaining_minutes <= 0,
    can_edit: remaining_minutes > 0,
  };
}

/**
 * API Functions - Wellness Post
 */

/**
 * Submete wellness pós-treino
 * Endpoint: POST /wellness_post
 * Permissão: Atleta (self-only)
 */
export async function submitWellnessPost(
  sessionId: string,
  data: WellnessPostInput
): Promise<WellnessPost> {
  return await apiClient.post<WellnessPost>('/wellness_post', {
    training_session_id: sessionId,
    ...data,
  });
}

/**
 * Busca wellness post existente do atleta
 * Endpoint: GET /wellness_post?training_session_id={id}&athlete_id=me
 */
export async function getMyWellnessPost(sessionId: string): Promise<WellnessPost | null> {
  try {
    const response = await apiClient.get<WellnessPost[]>('/wellness_post', {
      params: {
        training_session_id: sessionId,
        athlete_id: 'me',
      },
    });
    return response[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Solicita desbloqueio de wellness (após deadline)
 * Endpoint: POST /wellness_pre/{id}/request-unlock
 */
export async function requestWellnessUnlock(
  wellnessId: string,
  reason: string
): Promise<void> {
  await apiClient.post(`/wellness_pre/${wellnessId}/request-unlock`, { reason });
}

/**
 * Presets pré-configurados
 */
export const WELLNESS_PRE_PRESETS: WellnessPreset[] = [
  {
    id: 'very-rested',
    label: 'Muito Bem Descansado',
    emoji: '💪',
    description: 'Dormiu muito bem, sem fadiga, pronto para treinar',
    values: {
      sleep_quality: 9,
      fatigue_level: 2,
      stress_level: 2,
      muscle_soreness: 1,
      mood: 9,
      readiness: 9,
    },
  },
  {
    id: 'normal',
    label: 'Normal',
    emoji: '😊',
    description: 'Estado normal de treino, sem problemas',
    values: {
      sleep_quality: 7,
      fatigue_level: 5,
      stress_level: 4,
      muscle_soreness: 4,
      mood: 7,
      readiness: 7,
    },
  },
  {
    id: 'tired',
    label: 'Cansado',
    emoji: '😓',
    description: 'Pouco descanso, fadiga moderada',
    values: {
      sleep_quality: 4,
      fatigue_level: 7,
      stress_level: 6,
      muscle_soreness: 6,
      mood: 5,
      readiness: 4,
    },
  },
  {
    id: 'very-tired',
    label: 'Muito Cansado',
    emoji: '😴',
    description: 'Muito fatigado, considere treino leve',
    values: {
      sleep_quality: 3,
      fatigue_level: 9,
      stress_level: 8,
      muscle_soreness: 8,
      mood: 3,
      readiness: 2,
    },
  },
];
