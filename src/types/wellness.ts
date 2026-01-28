/**
 * Tipos para o sistema de Wellness
 */

export interface WellnessMetrics {
  sleep_quality: number; // 0-10
  fatigue_level: number; // 0-10
  stress_level: number; // 0-10
  mood: number; // 0-10
  muscle_soreness: number; // 0-10
  hydration?: number; // 0-10
  motivation?: number; // 0-10
}

export interface WellnessEntry {
  id: string;
  athlete_id: string;
  date: Date;
  metrics: WellnessMetrics;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WellnessStats {
  average: WellnessMetrics;
  trend: 'improving' | 'stable' | 'declining';
  alerts: WellnessAlert[];
}

export interface WellnessAlert {
  id: string;
  metric: keyof WellnessMetrics;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: Date;
}

export interface WellnessComparison {
  athlete: WellnessMetrics;
  teamAverage: WellnessMetrics;
  percentile: number; // 0-100
}

export interface WellnessTrendData {
  date: string;
  metrics: WellnessMetrics;
}