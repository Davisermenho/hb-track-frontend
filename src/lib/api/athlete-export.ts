/**
 * API Client - Athlete Data Export (LGPD Compliance)
 * 
 * Implements LGPD Art. 18, II - Direito à portabilidade dos dados
 * Allows athletes to export their personal data in JSON or CSV format
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'json' | 'csv';

export interface AthleteDataExportResponse {
  personal_info: {
    id: string;
    full_name: string;
    date_of_birth: string;
    position: string;
    height_cm: number | null;
    weight_kg: number | null;
    preferred_foot: string | null;
    jersey_number: string | null;
  };
  wellness_pre_history: Array<{
    date: string;
    session_id: string;
    sleep_hours: number;
    sleep_quality: number;
    muscle_soreness: number;
    stress_level: number;
    fatigue_level: number;
    mood: number;
    hydration_level: number;
    injury_concerns: string | null;
  }>;
  wellness_post_history: Array<{
    date: string;
    session_id: string;
    perceived_exertion: number;
    session_satisfaction: number;
    muscle_pain_level: number;
    technical_performance: number;
    tactical_performance: number;
    mental_state: number;
    notes: string | null;
  }>;
  attendance_history: Array<{
    date: string;
    session_id: string;
    present: boolean;
    justified: boolean;
    justification: string | null;
  }>;
  medical_cases: Array<{
    id: string;
    type: string;
    description: string;
    injury_date: string;
    return_date: string | null;
    status: string;
    severity: string;
  }>;
  badges: Array<{
    id: string;
    type: string;
    awarded_at: string;
    month: string | null;
  }>;
  generated_at: string;
  total_records: number;
  lgpd_notice: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Export athlete data in JSON format
 * Returns complete data structure directly in response
 */
export async function exportAthleteDataJSON(): Promise<AthleteDataExportResponse> {
  const response = await apiClient.get<AthleteDataExportResponse>(
    '/athletes/me/export-data',
    {
      params: { format: 'json' },
    }
  );
  return response;
}

/**
 * Export athlete data in CSV format
 * Returns ZIP file as blob for download
 */
export async function exportAthleteDataCSV(): Promise<Blob> {
  const response = await fetch('/api/v1/athletes/me/export-data?format=csv', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to export data');
  }
  
  return response.blob();
}

/**
 * Download a blob as file
 * Helper function to trigger browser download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
