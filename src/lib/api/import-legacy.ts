"use client";

/**
 * API Layer para Import Legacy (CSV)
 * 
 * **Step 28:** Import CSV Legacy
 * 
 * **Endpoints:**
 * - POST /admin/import-legacy/preview: Valida e preview
 * - POST /admin/import-legacy/execute: Executa importação
 * - GET /admin/import-legacy/jobs/{jobId}: Status do job
 * - GET /admin/import-legacy/jobs/{jobId}/summary: Download relatório
 */

import { apiClient } from './client';

// ================================================================================
// TYPES
// ================================================================================

export interface ImportPreviewResponse {
  success: boolean;
  sessions_count: number;
  sessions_errors: string[];
  attendance_count: number | null;
  attendance_errors: string[] | null;
  warnings: string[];
  estimated_duration_seconds: number;
}

export interface ImportExecuteResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface ImportJobStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_pct: number;
  message: string;
  result: ImportResult | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ImportResult {
  import_started_at: string;
  import_completed_at?: string;
  organization_id: string;
  sessions: {
    success: boolean;
    sessions_imported: number;
    sessions_readonly: number;
    sessions_skipped: Array<{
      row: number;
      reason: string;
      title: string;
    }>;
  };
  attendance?: {
    success: boolean;
    attendance_imported: number;
    attendance_skipped: Array<{
      row: number;
      reason: string;
      athlete: string;
    }>;
  };
  errors: string[];
}

// ================================================================================
// API FUNCTIONS
// ================================================================================

/**
 * Preview de importação CSV (valida sem importar)
 */
export async function previewImport(
  organizationId: string,
  sessionsFile: File,
  attendanceFile?: File
): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append('organization_id', organizationId);
  formData.append('sessions_file', sessionsFile);
  
  if (attendanceFile) {
    formData.append('attendance_file', attendanceFile);
  }

  const response = await apiClient.post<ImportPreviewResponse>(
    '/admin/import-legacy/preview',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response;
}

/**
 * Executa importação CSV (job assíncrono)
 */
export async function executeImport(
  organizationId: string,
  sessionsFile: File,
  attendanceFile?: File
): Promise<ImportExecuteResponse> {
  const formData = new FormData();
  formData.append('organization_id', organizationId);
  formData.append('sessions_file', sessionsFile);
  
  if (attendanceFile) {
    formData.append('attendance_file', attendanceFile);
  }

  const response = await apiClient.post<ImportExecuteResponse>(
    '/admin/import-legacy/execute',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response;
}

/**
 * Consulta status do job de importação
 */
export async function getImportJobStatus(
  jobId: string
): Promise<ImportJobStatusResponse> {
  const response = await apiClient.get<ImportJobStatusResponse>(
    `/admin/import-legacy/jobs/${jobId}`
  );

  return response;
}

/**
 * Download do relatório de importação (JSON)
 */
export async function downloadImportSummary(jobId: string): Promise<void> {
  // Use fetch directly for blob download
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const url = `${API_BASE}/admin/import-legacy/jobs/${jobId}/summary`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include', // Send cookies
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();

  // Trigger browser download
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', `import_summary_${jobId}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Polling do status até completar (helper)
 */
export async function pollUntilComplete(
  jobId: string,
  onProgress?: (status: ImportJobStatusResponse) => void,
  intervalMs: number = 2000,
  timeoutMs: number = 600000 // 10 minutes
): Promise<ImportJobStatusResponse> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getImportJobStatus(jobId);

        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'completed' || status.status === 'failed') {
          resolve(status);
          return;
        }

        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Timeout: Importação excedeu 10 minutos'));
          return;
        }

        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

// ================================================================================
// HELPERS
// ================================================================================

/**
 * Formata duração estimada
 */
export function formatEstimatedDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} segundos`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  
  return `${minutes}min ${remainingSeconds}s`;
}

/**
 * Valida arquivo CSV
 */
export function validateCSVFile(file: File): string | null {
  // Check extension
  if (!file.name.endsWith('.csv')) {
    return 'Arquivo deve ser .csv';
  }

  // Check size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Arquivo muito grande (máximo 10MB)';
  }

  return null;
}

/**
 * Retorna cor do status
 */
export function getStatusColor(status: ImportJobStatusResponse['status']): string {
  switch (status) {
    case 'pending':
      return 'text-gray-500';
    case 'processing':
      return 'text-blue-500';
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Retorna badge color do status
 */
export function getStatusBadgeVariant(
  status: ImportJobStatusResponse['status']
): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'completed':
      return 'success';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Retorna texto do status
 */
export function getStatusText(status: ImportJobStatusResponse['status']): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'processing':
      return 'Processando';
    case 'completed':
      return 'Concluído';
    case 'failed':
      return 'Falhou';
    default:
      return 'Desconhecido';
  }
}
