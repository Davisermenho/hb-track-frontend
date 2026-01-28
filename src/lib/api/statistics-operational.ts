import { apiClient } from './client';

// ============================================================================
// TIPOS - Operational Session
// ============================================================================

export interface OperationalSessionSnapshot {
  context: {
    session_id: string;
    session_type: 'training' | 'match';
    team: {
      id: string;
      name: string;
    };
    date: string;
    status: 'scheduled' | 'ongoing' | 'completed';
  };
  process_status: {
    total_athletes: number;
    present: number;
    absent: number;
    wellness_pending: number;
    inactive_engagement: number;
    engagement_status: 'active' | 'partial' | 'inactive';
    session_risk: boolean;
  };
  load_summary: {
    session_load_avg: number;
    team_baseline_avg: number;
    deviation_pct: number;
    out_of_zone_athletes: number;
  };
  athletes: AthleteOperationalStatus[];
  alerts: Alert[];
}

export interface AthleteOperationalStatus {
  athlete_id: string;
  name: string;
  presence: 'present' | 'absent' | 'late';
  wellness: 'ok' | 'pending_pre' | 'pending_post';
  load_status: 'ok' | 'alert' | 'critical';
  overall_status: 'ok' | 'attention' | 'critical';
}

export interface Alert {
  type: 'attendance' | 'wellness' | 'load' | 'medical';
  level: 'info' | 'warning' | 'critical';
  athlete_id: string;
  message: string;
}

// ============================================================================
// TIPOS - Athlete Self View
// ============================================================================

export interface AthleteSelfReport {
  presence: {
    streak: number;
    recent_absences: number;
    last_sessions: string[]; // ["P", "P", "A", "P", "A"]
    sessions_count?: number; // For display
    participation_rate?: number; // For display
  };
  wellness: {
    trend: 'stable' | 'improving' | 'attention';
    note: string | null;
    status?: 'stable' | 'fluctuating' | 'pending'; // For copy logic
  };
  load: {
    zone: 'within_zone' | 'above_zone' | 'below_zone';
    note: string | null;
    current_load?: number; // For display
    baseline?: number; // For display
    deviation?: number; // For display
    status?: 'within_zone' | 'above_zone' | 'below_zone'; // For copy logic
  };
  overall_status: 'ok' | 'attention';
  alerts: AthleteSelfAlert[];
  insights: string[];
}

export interface AthleteSelfAlert {
  type: 'compliance' | 'attendance' | 'medical' | 'load';
  level: 'info' | 'warning';
  message: string;
  severity?: 'attention'; // For frontend filtering
}

// ============================================================================
// SERVIÇOS
// ============================================================================

export const statisticsService = {
  /**
   * Obter snapshot operacional de uma sessão (treino ou jogo)
   * Usado por: /statistics (visão da comissão técnica)
   */
  async getOperationalSession(sessionId: string): Promise<OperationalSessionSnapshot> {
    const response = await apiClient.get<OperationalSessionSnapshot>(
      `/reports/operational-session`,
      { params: { session_id: sessionId } }
    );
    return response;
  },

  /**
   * Obter visão individual do atleta autenticado
   * Usado por: /statistics/me (visão do atleta)
   * Não aceita parâmetros - retorna dados do usuário atual
   */
  async getAthleteSelf(): Promise<AthleteSelfReport> {
    const response = await apiClient.get<AthleteSelfReport>(`/reports/athlete-self`);
    return response;
  },
};
