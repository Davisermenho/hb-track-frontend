"use client";

/**
 * ImportLegacyModal - Modal para importação de dados legacy (CSV)
 * 
 * **Step 28:** Import CSV Legacy
 * 
 * **Features:**
 * - Upload de 2 arquivos CSV (sessions, attendance opcional)
 * - Preview com validação antes de importar
 * - Progresso em tempo real (polling)
 * - Display de erros e warnings
 * - Download do relatório final
 * 
 * **Usage:**
 * ```tsx
 * <ImportLegacyModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   organizationId={orgId}
 * />
 * ```
 */

import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle2, XCircle, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import Alert from '@/components/ui/alert/Alert';
import { Badge } from '@/components/ui/badge-ui';
import { Progress } from '@/components/ui/progress';
import { toast as showToast } from 'react-hot-toast';
import {
  previewImport,
  executeImport,
  pollUntilComplete,
  downloadImportSummary,
  validateCSVFile,
  formatEstimatedDuration,
  getStatusText,
  getStatusBadgeVariant,
  type ImportPreviewResponse,
  type ImportJobStatusResponse,
} from '@/lib/api/import-legacy';

// ================================================================================
// TYPES
// ================================================================================

interface ImportLegacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

type Step = 'upload' | 'preview' | 'importing' | 'completed';

// ================================================================================
// COMPONENT
// ================================================================================

export const ImportLegacyModal: React.FC<ImportLegacyModalProps> = ({
  open,
  onOpenChange,
  organizationId,
}) => {
  // State
  const [step, setStep] = useState<Step>('upload');
  const [sessionsFile, setSessionsFile] = useState<File | null>(null);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [jobStatus, setJobStatus] = useState<ImportJobStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset state on close
  const handleClose = () => {
    setStep('upload');
    setSessionsFile(null);
    setAttendanceFile(null);
    setPreview(null);
    setJobStatus(null);
    setLoading(false);
    onOpenChange(false);
  };

  // File upload handlers
  const handleSessionsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateCSVFile(file);
    if (error) {
      showToast.error(`Erro no arquivo: ${error}`);
      return;
    }

    setSessionsFile(file);
  };

  const handleAttendanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateCSVFile(file);
    if (error) {
      showToast.error(`Erro no arquivo: ${error}`);
      return;
    }

    setAttendanceFile(file);
  };

  // Preview import
  const handlePreview = async () => {
    if (!sessionsFile) return;

    setLoading(true);
    try {
      const result = await previewImport(
        organizationId,
        sessionsFile,
        attendanceFile || undefined
      );

      setPreview(result);
      setStep('preview');

      if (!result.success) {
        showToast.error(`Validação falhou: ${result.sessions_errors.length} erro(s) encontrado(s)`);
      }
    } catch (error: any) {
      showToast.error(`Erro no preview: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Execute import
  const handleExecute = async () => {
    if (!sessionsFile || !preview?.success) return;

    setLoading(true);
    try {
      const result = await executeImport(
        organizationId,
        sessionsFile,
        attendanceFile || undefined
      );

      setStep('importing');

      // Start polling
      const finalStatus = await pollUntilComplete(
        result.job_id,
        (status) => {
          setJobStatus(status);
        }
      );

      setJobStatus(finalStatus);
      setStep('completed');

      if (finalStatus.status === 'completed') {
        showToast.success(`Importação concluída: ${finalStatus.result?.sessions.sessions_imported || 0} sessões importadas`);
      } else {
        showToast.error(`Importação falhou: ${finalStatus.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      showToast.error(`Erro na importação: ${error.message || 'Erro desconhecido'}`);
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Download summary
  const handleDownloadSummary = async () => {
    if (!jobStatus?.job_id) return;

    try {
      await downloadImportSummary(jobStatus.job_id);
      showToast.success('Relatório de importação baixado com sucesso');
    } catch (error: any) {
      showToast.error(`Erro no download: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Dados Legacy (CSV)
          </DialogTitle>
          <DialogDescription>
            Importe sessões de treino e attendance de arquivos CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <>
              <div className="space-y-4">
                {/* Sessions File */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Arquivo de Sessões <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('sessions-input')?.click()}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {sessionsFile ? sessionsFile.name : 'Selecionar sessions.csv'}
                    </Button>
                    <input
                      id="sessions-input"
                      type="file"
                      accept=".csv"
                      onChange={handleSessionsFileChange}
                      className="hidden"
                    />
                  </div>
                  {sessionsFile && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(sessionsFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>

                {/* Attendance File (optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Arquivo de Attendance (Opcional)
                  </label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('attendance-input')?.click()}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {attendanceFile ? attendanceFile.name : 'Selecionar attendance.csv'}
                    </Button>
                    <input
                      id="attendance-input"
                      type="file"
                      accept=".csv"
                      onChange={handleAttendanceFileChange}
                      className="hidden"
                    />
                  </div>
                  {attendanceFile && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(attendanceFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>

              <Alert
                variant="info"
                title="Formato CSV Esperado"
                message="sessions.csv: team_name, title, session_type, session_at, duration_minutes, focus_*_pct (7 focos) | attendance.csv: team_name, session_title, session_at, athlete_name, status | ⚠️ Sessões com mais de 60 dias receberão status 'readonly'"
              />

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={!sessionsFile || loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Validar e Visualizar Preview
                </Button>
              </DialogFooter>
            </>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 'preview' && preview && (
            <>
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sessões</p>
                    <p className="text-2xl font-bold">{preview.sessions_count}</p>
                  </div>
                  {preview.attendance_count !== null && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Attendance</p>
                      <p className="text-2xl font-bold">{preview.attendance_count}</p>
                    </div>
                  )}
                </div>

                {/* Errors */}
                {preview.sessions_errors.length > 0 && (
                  <div>
                    <Alert
                      variant="error"
                      title={`Erros de Validação (${preview.sessions_errors.length})`}
                      message={preview.sessions_errors.slice(0, 3).join(' | ')}
                    />
                    {preview.sessions_errors.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">... e mais {preview.sessions_errors.length - 3} erros</p>
                    )}
                  </div>
                )}

                {preview.attendance_errors && preview.attendance_errors.length > 0 && (
                  <div>
                    <Alert
                      variant="error"
                      title={`Erros de Attendance (${preview.attendance_errors.length})`}
                      message={preview.attendance_errors.slice(0, 3).join(' | ')}
                    />
                    {preview.attendance_errors.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">... e mais {preview.attendance_errors.length - 3} erros</p>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {preview.warnings.length > 0 && (
                  <Alert
                    variant="warning"
                    title="Avisos"
                    message={preview.warnings.join(' | ')}
                  />
                )}

                {/* Success */}
                {preview.success && (
                  <Alert
                    variant="success"
                    title="Validação OK"
                    message={`Duração estimada: ${formatEstimatedDuration(preview.estimated_duration_seconds)}`}
                  />
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Voltar
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={!preview.success || loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Executar Importação
                </Button>
              </DialogFooter>
            </>
          )}

          {/* STEP 3: IMPORTING */}
          {step === 'importing' && jobStatus && (
            <>
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="font-semibold">{jobStatus.message}</p>
                  <Badge variant={getStatusBadgeVariant(jobStatus.status) as 'default' | 'secondary' | 'destructive'} className="mt-2">
                    {getStatusText(jobStatus.status)}
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso</span>
                    <span>{jobStatus.progress_pct}%</span>
                  </div>
                  <Progress value={jobStatus.progress_pct} />
                </div>

                <Alert
                  variant="info"
                  title="Processando"
                  message="A importação está sendo processada em background. Não feche esta janela."
                />
              </div>
            </>
          )}

          {/* STEP 4: COMPLETED */}
          {step === 'completed' && jobStatus && (
            <>
              <div className="space-y-4">
                {jobStatus.status === 'completed' && jobStatus.result && (
                  <>
                    <div className="text-center">
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      <p className="text-lg font-semibold">Importação Concluída!</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sessões Importadas</p>
                        <p className="text-2xl font-bold text-green-600">
                          {jobStatus.result.sessions.sessions_imported}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sessões Readonly</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {jobStatus.result.sessions.sessions_readonly}
                        </p>
                      </div>
                      {jobStatus.result.attendance && (
                        <>
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Attendance Importados</p>
                            <p className="text-2xl font-bold text-green-600">
                              {jobStatus.result.attendance.attendance_imported}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {jobStatus.result.sessions.sessions_skipped.length > 0 && (
                      <Alert
                        variant="warning"
                        title={`${jobStatus.result.sessions.sessions_skipped.length} Sessão(ões) Ignoradas`}
                        message={jobStatus.result.sessions.sessions_skipped.slice(0, 3).map(s => `Linha ${s.row}: ${s.reason}`).join(' | ')}
                      />
                    )}
                  </>
                )}

                {jobStatus.status === 'failed' && (
                  <>
                    <div className="text-center">
                      <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                      <p className="text-lg font-semibold">Importação Falhou</p>
                    </div>

                    <Alert
                      variant="error"
                      title="Erro na Importação"
                      message={jobStatus.error || 'Erro desconhecido'}
                    />
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleDownloadSummary}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório JSON
                </Button>
                <Button onClick={handleClose}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
