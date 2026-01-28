/**
 * Export API Client
 * 
 * Step 23: Export PDF Assíncrono com Wellness Metrics
 * 
 * Funções para gerenciar exports de PDFs de analytics com:
 * - Rate limiting (5 exports/dia)
 * - Cache automático de exports idênticos
 * - Polling assíncrono de status
 * - Download de arquivos gerados
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export type ExportType = 'analytics_pdf' | 'athlete_data';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ExportFormat = 'json' | 'csv';

export interface AnalyticsPDFExportRequest {
  team_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  include_wellness_metrics?: boolean;
  include_prevention_effectiveness?: boolean;
  include_badges?: boolean;
  include_rankings?: boolean;
}

export interface AthleteDataExportRequest {
  format: ExportFormat;
}

export interface ExportJob {
  id: string;
  user_id: string;
  export_type: ExportType;
  status: ExportStatus;
  params: Record<string, any>;
  file_url: string | null;
  file_size_bytes: number | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ExportJobListResponse {
  exports: ExportJob[];
  total: number;
  page: number;
  per_page: number;
}

export interface ExportRateLimit {
  export_type: ExportType;
  remaining_today: number;
  total_limit: number;
  resets_at: string; // ISO datetime
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Request analytics PDF export (async job)
 * Returns 202 Accepted with job_id for polling
 * 
 * Rate limit: 5/day per user
 * Cache: Returns existing job if same params within 7 days
 * 
 * @throws 429 if rate limit exceeded
 * @throws 400 if validation fails (start_date > end_date)
 */
export async function requestAnalyticsPDFExport(
  request: AnalyticsPDFExportRequest
): Promise<ExportJob> {
  const response = await apiClient.post<ExportJob>(
    '/analytics/export-pdf',
    request
  );
  return response;
}

/**
 * Request athlete data export (LGPD compliance)
 * Rate limit: 3/day per user
 */
export async function requestAthleteDataExport(
  request: AthleteDataExportRequest
): Promise<ExportJob> {
  const response = await apiClient.post<ExportJob>(
    '/athletes/me/export-data',
    request
  );
  return response;
}

/**
 * Get export job status (for polling)
 * Client should poll every 2-3 seconds until status is 'completed' or 'failed'
 * 
 * @throws 404 if job not found or not owned by user
 */
export async function getExportJobStatus(jobId: string): Promise<ExportJob> {
  const response = await apiClient.get<ExportJob>(
    `/analytics/exports/${jobId}`
  );
  return response;
}

/**
 * List user's export history (paginated)
 * 
 * @param page - Page number (1-based)
 * @param perPage - Items per page (1-50, default 20)
 */
export async function listUserExports(
  page: number = 1,
  perPage: number = 20
): Promise<ExportJobListResponse> {
  const response = await apiClient.get<ExportJobListResponse>(
    '/analytics/exports',
    {
      params: { page, per_page: perPage }
    }
  );
  return response;
}

/**
 * Check remaining export quota for today
 * Use this before showing export button to display "X exports remaining"
 */
export async function checkExportRateLimit(
  exportType: ExportType = 'analytics_pdf'
): Promise<ExportRateLimit> {
  const response = await apiClient.get<ExportRateLimit>(
    '/analytics/export-rate-limit',
    {
      params: { export_type: exportType }
    }
  );
  return response;
}

/**
 * Download export file
 * Use file_url from completed job
 * Opens file in new tab or triggers download
 */
export function downloadExportFile(fileUrl: string): void {
  window.open(fileUrl, '_blank');
}

/**
 * Poll export job until completed/failed
 * Returns completed job or throws on failure
 * 
 * @param jobId - Export job ID
 * @param onProgress - Callback for status updates (optional)
 * @param pollInterval - Polling interval in ms (default 2000)
 * @param maxAttempts - Max polling attempts (default 150 = 5 min)
 * 
 * @throws Error if job fails or timeout
 */
export async function pollExportJob(
  jobId: string,
  onProgress?: (job: ExportJob) => void,
  pollInterval: number = 2000,
  maxAttempts: number = 150
): Promise<ExportJob> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const job = await getExportJobStatus(jobId);
    
    if (onProgress) {
      onProgress(job);
    }

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed') {
      throw new Error(job.error_message || 'Export failed');
    }

    // Status is 'pending' or 'processing', continue polling
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error('Export timeout - job took too long to complete');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calculate export progress percentage (estimated)
 */
export function getExportProgress(job: ExportJob): number {
  switch (job.status) {
    case 'pending':
      return 10;
    case 'processing':
      return 50;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

/**
 * Get human-readable status text
 */
export function getExportStatusText(status: ExportStatus): string {
  const statusMap: Record<ExportStatus, string> = {
    pending: 'Na fila...',
    processing: 'Gerando PDF...',
    completed: 'Concluído',
    failed: 'Falhou'
  };
  return statusMap[status];
}

/**
 * Get status color for badges
 */
export function getExportStatusColor(status: ExportStatus): string {
  const colorMap: Record<ExportStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return colorMap[status];
}

/**
 * Check if export can be retried
 */
export function canRetryExport(job: ExportJob): boolean {
  return job.status === 'failed';
}

/**
 * Validate date range for export request
 */
export function validateExportDateRange(startDate: string, endDate: string): string | null {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return 'Data inicial inválida';
  }

  if (isNaN(end.getTime())) {
    return 'Data final inválida';
  }

  if (start > end) {
    return 'Data inicial deve ser anterior à data final';
  }

  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) {
    return 'Período máximo: 365 dias';
  }

  return null; // Valid
}
