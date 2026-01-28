'use server'

/**
 * Server Actions para relatórios (R1-R4)
 *
 * Referências RAG:
 * - R1: Training Performance
 * - R2: Athlete Individual
 * - R3: Wellness Summary
 * - R4: Medical Summary
 *
 * Backend: https://hbtrack.onrender.com/api/v1/reports
 */

import { getSession } from '@/lib/auth/actions'
import {
  TrainingPerformanceReport,
  TrainingPerformanceFilters,
  TrainingPerformanceTrend,
  AthleteIndividualReport,
  AthleteListFilters,
  WellnessSummaryReport,
  WellnessSummaryFilters,
  MedicalSummaryReport,
  MedicalSummaryFilters,
} from '../../src/types/reports'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

// ============================================================================
// Padrão HttpOnly Cookies (2026-01-08)
// ============================================================================
// Em Server Actions, usamos cookies().get() para obter o token HttpOnly
// e repassar na requisição ao backend.
// ============================================================================

import { cookies } from 'next/headers'

/**
 * Utilitário para fetch autenticado em Server Actions.
 * Obtém o token do cookie HttpOnly e repassa ao backend.
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('hb_access_token')?.value

  if (!token) {
    throw new Error('Não autenticado')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: 'Erro desconhecido',
    }))
    throw new Error(error.detail || 'Erro na requisição')
  }

  return response.json()
}

// ============================================================================
// R1: TRAINING PERFORMANCE
// ============================================================================

/**
 * Obter relatório de performance em treinos
 */
export async function getTrainingPerformance(
  filters?: TrainingPerformanceFilters
): Promise<TrainingPerformanceReport[]> {
  const params = new URLSearchParams()

  if (filters?.season_id) params.set('season_id', filters.season_id)
  if (filters?.team_id) params.set('team_id', filters.team_id)
  if (filters?.start_date) params.set('start_date', filters.start_date)
  if (filters?.end_date) params.set('end_date', filters.end_date)
  if (filters?.min_attendance_rate)
    params.set('min_attendance_rate', filters.min_attendance_rate.toString())
  if (filters?.skip !== undefined) params.set('skip', filters.skip.toString())
  if (filters?.limit !== undefined)
    params.set('limit', filters.limit.toString())

  const queryString = params.toString()
  const endpoint = `/reports/training-performance${queryString ? `?${queryString}` : ''}`

  return fetchWithAuth<TrainingPerformanceReport[]>(endpoint)
}

/**
 * Obter tendências de performance em treinos
 */
export async function getTrainingTrends(
  filters?: {
    season_id?: string
    team_id?: string
    period?: 'week' | 'month'
    limit?: number
  }
): Promise<TrainingPerformanceTrend[]> {
  const params = new URLSearchParams()

  if (filters?.season_id) params.set('season_id', filters.season_id)
  if (filters?.team_id) params.set('team_id', filters.team_id)
  if (filters?.period) params.set('period', filters.period)
  if (filters?.limit) params.set('limit', filters.limit.toString())

  const queryString = params.toString()
  const endpoint = `/reports/training-trends${queryString ? `?${queryString}` : ''}`

  return fetchWithAuth<TrainingPerformanceTrend[]>(endpoint)
}

// ============================================================================
// R2: ATHLETE INDIVIDUAL
// ============================================================================

/**
 * Obter lista de atletas resumida
 */
export async function getAthletesList(
  filters?: AthleteListFilters
): Promise<AthleteIndividualReport[]> {
  const params = new URLSearchParams()

  if (filters?.team_id) params.set('team_id', filters.team_id)
  if (filters?.state) params.set('state', filters.state)
  if (filters?.skip !== undefined) params.set('skip', filters.skip.toString())
  if (filters?.limit !== undefined)
    params.set('limit', filters.limit.toString())

  const queryString = params.toString()
  const endpoint = `/reports/athletes-list${queryString ? `?${queryString}` : ''}`

  return fetchWithAuth<AthleteIndividualReport[]>(endpoint)
}

// ============================================================================
// R3: WELLNESS SUMMARY
// ============================================================================

/**
 * Obter relatório de prontidão e bem-estar
 */
export async function getWellnessSummary(
  filters?: WellnessSummaryFilters
): Promise<WellnessSummaryReport> {
  const params = new URLSearchParams()

  if (filters?.season_id) params.set('season_id', filters.season_id)
  if (filters?.team_id) params.set('team_id', filters.team_id)
  if (filters?.start_date) params.set('start_date', filters.start_date)
  if (filters?.end_date) params.set('end_date', filters.end_date)
  if (filters?.skip !== undefined) params.set('skip', filters.skip.toString())
  if (filters?.limit !== undefined)
    params.set('limit', filters.limit.toString())

  const queryString = params.toString()
  const endpoint = `/reports/wellness-summary${queryString ? `?${queryString}` : ''}`

  return fetchWithAuth<WellnessSummaryReport>(endpoint)
}

/**
 * Refresh materialized view de wellness
 */
export async function refreshWellness(): Promise<{
  status: string
  view: string
  refreshed_at?: string
  error?: string
}> {
  return fetchWithAuth('/reports/refresh-wellness', {
    method: 'POST',
  })
}

// ============================================================================
// R4: MEDICAL SUMMARY
// ============================================================================

/**
 * Obter relatório de gerenciamento de lesões
 */
export async function getMedicalSummary(
  filters?: MedicalSummaryFilters
): Promise<MedicalSummaryReport> {
  const params = new URLSearchParams()

  if (filters?.season_id) params.set('season_id', filters.season_id)
  if (filters?.team_id) params.set('team_id', filters.team_id)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.severity) params.set('severity', filters.severity)
  if (filters?.start_date) params.set('start_date', filters.start_date)
  if (filters?.end_date) params.set('end_date', filters.end_date)
  if (filters?.skip !== undefined) params.set('skip', filters.skip.toString())
  if (filters?.limit !== undefined)
    params.set('limit', filters.limit.toString())

  const queryString = params.toString()
  const endpoint = `/reports/medical-summary${queryString ? `?${queryString}` : ''}`

  return fetchWithAuth<MedicalSummaryReport>(endpoint)
}

/**
 * Refresh materialized view de medical
 */
export async function refreshMedical(): Promise<{
  status: string
  view: string
  refreshed_at?: string
  error?: string
}> {
  return fetchWithAuth('/reports/refresh-medical', {
    method: 'POST',
  })
}

// ============================================================================
// ATHLETE STATS - DASHBOARD (FASE 2)
// ============================================================================

export interface AthleteStats {
  total: number;
  em_captacao: number;
  lesionadas: number;
  suspensas: number;
  ativas: number;
  dispensadas: number;
  arquivadas: number;
  com_restricao_medica: number;
  carga_restrita: number;
  por_categoria: Record<string, number>;
}

/**
 * Obter estatísticas de atletas para dashboard
 */
export async function getAthleteStats(): Promise<AthleteStats> {
  return fetchWithAuth<AthleteStats>('/athletes/stats')
}
