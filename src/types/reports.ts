/**
 * Tipos de relatórios (R1-R4)
 *
 * Referências RAG:
 * - R1: Relatório de Performance em Treinos
 * - R2: Relatório Individual de Atleta
 * - R3: Relatório de Prontidão e Bem-Estar
 * - R4: Relatório de Gerenciamento de Lesões
 */

// ============================================================================
// R1: TRAINING PERFORMANCE
// ============================================================================

export interface TrainingPerformanceMetrics {
  total_athletes: number
  presentes: number
  ausentes: number
  dm: number
  lesionadas: number
  attendance_rate: number
  avg_minutes: number | null
  avg_rpe: number | null
  avg_internal_load: number | null
  stddev_internal_load: number | null
  load_ok_count: number
  data_completeness_pct: number
  avg_fatigue_after: number | null
  avg_mood_after: number | null
}

export interface TrainingPerformanceReport {
  session_id: string
  organization_id: string
  season_id: string | null
  team_id: string | null
  session_at: string
  main_objective: string | null
  planned_load: number | null
  group_climate: number | null
  metrics: TrainingPerformanceMetrics
  created_at: string
  updated_at: string
}

export interface TrainingPerformanceFilters {
  season_id?: string
  team_id?: string
  start_date?: string
  end_date?: string
  min_attendance_rate?: number
  skip?: number
  limit?: number
}

export interface TrainingPerformanceTrend {
  period: 'week' | 'month'
  period_start: string
  period_end: string
  sessions_count: number
  avg_attendance_rate: number
  avg_internal_load: number | null
  avg_fatigue: number | null
  avg_mood: number | null
}

// ============================================================================
// R2: ATHLETE INDIVIDUAL
// ============================================================================

export interface AthleteReadinessMetrics {
  avg_sleep_hours: number | null
  avg_sleep_quality: number | null
  avg_fatigue_pre: number | null
  avg_stress: number | null
  avg_muscle_soreness: number | null
  last_sleep_hours: number | null
  last_fatigue: number | null
}

export interface AthleteTrainingLoadMetrics {
  avg_internal_load: number | null
  avg_rpe: number | null
  avg_minutes: number | null
  load_7d: number | null
  load_28d: number | null
  last_internal_load: number | null
}

export interface AthleteAttendanceMetrics {
  total_sessions: number
  sessions_presente: number
  sessions_ausente: number
  sessions_dm: number
  sessions_lesionada: number
  attendance_rate: number
}

export interface AthleteWellnessMetrics {
  avg_fatigue_after: number | null
  avg_mood_after: number | null
}

export interface AthleteIndividualReport {
  athlete_id: string
  person_id: string
  full_name: string
  nickname: string | null
  birth_date: string | null
  position: string | null
  current_age: number | null
  expected_category_code: string | null
  current_state: 'ativa' | 'lesionada' | 'dispensada'
  current_season_id: string | null
  current_team_id: string | null
  organization_id: string
  readiness: AthleteReadinessMetrics
  training_load: AthleteTrainingLoadMetrics
  attendance: AthleteAttendanceMetrics
  wellness: AthleteWellnessMetrics
  active_medical_cases: number
  last_session_at: string | null
}

export interface AthleteListFilters {
  season_id?: string
  team_id?: string
  state?: 'ativa' | 'lesionada' | 'dispensada'
  min_attendance_rate?: number
  skip?: number
  limit?: number
}

// ============================================================================
// R3: WELLNESS SUMMARY
// ============================================================================

export interface WellnessSummaryMetrics {
  avg_sleep_hours: number | null
  avg_sleep_quality: number | null
  avg_fatigue: number | null
  avg_stress: number | null
  avg_muscle_soreness: number | null
  avg_mood: number | null
  athletes_with_low_sleep: number
  athletes_with_high_fatigue: number
  athletes_with_high_stress: number
}

export interface WellnessSummaryReport {
  period_start: string
  period_end: string
  organization_id: string
  season_id: string | null
  team_id: string | null
  metrics: WellnessSummaryMetrics
  total_athletes: number
  total_sessions: number
}

export interface WellnessSummaryFilters {
  season_id?: string
  team_id?: string
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}

// ============================================================================
// R4: MEDICAL SUMMARY
// ============================================================================

export interface MedicalCaseSummary {
  id: string
  athlete_id: string
  athlete_name: string
  case_type: 'lesao' | 'doenca' | 'cirurgia' | 'outro'
  severity: 'leve' | 'moderada' | 'grave'
  status: 'ativo' | 'recuperacao' | 'alta'
  reason: string | null
  started_at: string
  ended_at: string | null
  days_active: number
  affected_sessions: number
}

export interface MedicalSummaryMetrics {
  total_cases: number
  active_cases: number
  cases_in_recovery: number
  cases_closed: number
  avg_days_active: number | null
  cases_by_severity: {
    leve: number
    moderada: number
    grave: number
  }
  cases_by_type: {
    lesao: number
    doenca: number
    cirurgia: number
    outro: number
  }
}

export interface MedicalSummaryReport {
  organization_id: string
  season_id: string | null
  team_id: string | null
  period_start: string
  period_end: string
  metrics: MedicalSummaryMetrics
  cases: MedicalCaseSummary[]
}

export interface MedicalSummaryFilters {
  season_id?: string
  team_id?: string
  status?: 'ativo' | 'recuperacao' | 'alta'
  severity?: 'leve' | 'moderada' | 'grave'
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}
