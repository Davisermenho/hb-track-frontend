import { apiClient } from "./client";

export interface AthleteStatistics {
  athlete_id: string;
  year_of_birth: number;
  shirt_number: number;
  position: string;
  preferred_foot: string;
  bodyweight?: number;
  
  // ACWR data for chart
  acwr_data?: ACWRDataPoint[];
  
  // Overview stats
  overview?: {
    games_played: number;
    minutes_played: number;
    goals: number;
    assists: number;
  };
  
  // Readiness metrics
  readiness?: {
    wellness_score: number;
    sleep_quality: number;
    muscle_soreness: number;
    stress_level: number;
  };
  
  // Training load
  training_load?: {
    current_week_load: number;
    previous_week_load: number;
    acute_load: number;
    chronic_load: number;
    acwr_ratio: number;
  };
  
  // Test results
  test_results?: TestResult[];
}

export interface ACWRDataPoint {
  date: string;
  load: number;
  acwr_ratio: number;
  is_training: boolean;
  is_overtraining: boolean;
}

export interface TestResult {
  test_name: string;
  date: string;
  value: number;
  unit: string;
  percentile?: number;
}

export interface MonthFilter {
  year: number;
  month: number; // 1-12
}

// Visão operacional consolidada (/reports/operational-session)
export type OperationalSessionSnapshot = {
  context: {
    session_id: string;
    session_type: "training" | "match";
    team: { id: string; name: string };
    date: string;
    status: "scheduled" | "ongoing" | "completed";
  };
  process_status: {
    total_athletes: number;
    present: number;
    absent: number;
    wellness_pending: number;
    inactive_engagement: number;
    engagement_status?: string;
    session_risk: boolean;
  };
  load_summary: {
    session_load_avg: number;
    team_baseline_avg: number;
    deviation_pct: number;
    out_of_zone_athletes: number;
  };
  athletes: Array<{
    athlete_id: string;
    name: string;
    presence: string;
    wellness: string;
    load_status: string;
    overall_status: "critical" | "attention" | "ok";
  }>;
  alerts: Array<{
    type: "medical" | "load" | "attendance" | "compliance";
    level: "warning" | "critical";
    athlete_id?: string;
    message: string;
  }>;
};

// Visão individual do atleta (/reports/athlete-self)
export type AthleteSelfReport = {
  context: {
    athlete_id: string;
    period: string;
  };
  presence: {
    streak: number;
    recent_absences: number;
    last_sessions: string[];
  };
  wellness: {
    trend: string;
    note: string | null;
  };
  load: {
    zone: string;
    note: string | null;
  };
  overall_status: "ok" | "attention";
  alerts: Array<{
    type: "attendance" | "compliance" | "medical" | "load";
    level: "warning" | "critical";
    message: string;
  }>;
  insights: string[];
};

export const statisticsService = {
  async getAthleteStats(
    athleteId: string, 
    filter?: MonthFilter
  ): Promise<AthleteStatistics> {
    // TODO: Backend endpoint not implemented yet
    // For now, this will throw an error and the frontend will use mock data
    // When backend implements this endpoint, uncomment the following:
    /*
    return apiClient.get<AthleteStatistics>(`/statistics/athletes/${athleteId}`, {
      params: filter,
    });
    */
    
    throw new Error('Statistics endpoint not implemented in backend yet');
  },
  
  async getTeamStats(teamId: string, filter?: MonthFilter): Promise<any> {
    // TODO: Backend endpoint not implemented yet
    throw new Error('Statistics endpoint not implemented in backend yet');
  },

  async getOperationalSession(sessionId: string): Promise<OperationalSessionSnapshot> {
    return apiClient.get<OperationalSessionSnapshot>('/reports/operational-session', {
      params: { session_id: sessionId },
    });
  },

  async getAthleteSelf(): Promise<AthleteSelfReport> {
    return apiClient.get<AthleteSelfReport>('/reports/athlete-self');
  },
};
