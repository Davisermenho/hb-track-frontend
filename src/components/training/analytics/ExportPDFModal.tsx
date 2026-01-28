/**
 * ExportPDFModal Component
 * 
 * Step 23: Export PDF Assíncrono com Wellness Metrics
 * 
 * Modal para solicitar export de PDF de analytics com:
 * - Formulário com seleção de período e opções
 * - Validação de rate limit (5/dia)
 * - Polling automático de status
 * - Progress bar animado
 * - Download automático ao completar
 * - Histórico de exports anteriores
 */

'use client';

import { useState, useEffect } from 'react';
import { Icons } from '@/design-system/icons';
import {
  requestAnalyticsPDFExport,
  pollExportJob,
  checkExportRateLimit,
  listUserExports,
  downloadExportFile,
  formatFileSize,
  getExportProgress,
  getExportStatusText,
  getExportStatusColor,
  validateExportDateRange,
  type AnalyticsPDFExportRequest,
  type ExportJob,
  type ExportRateLimit
} from '@/lib/api/exports';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

type ModalView = 'form' | 'polling' | 'history';

export function ExportPDFModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  defaultStartDate,
  defaultEndDate
}: ExportPDFModalProps) {
  // View state
  const [view, setView] = useState<ModalView>('form');

  // Form state
  const [startDate, setStartDate] = useState(defaultStartDate || '');
  const [endDate, setEndDate] = useState(defaultEndDate || '');
  const [includeWellness, setIncludeWellness] = useState(true);
  const [includePrevention, setIncludePrevention] = useState(true);
  const [includeBadges, setIncludeBadges] = useState(true);
  const [includeRankings, setIncludeRankings] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Rate limit state
  const [rateLimit, setRateLimit] = useState<ExportRateLimit | null>(null);
  const [rateLimitLoading, setRateLimitLoading] = useState(false);

  // Export job state
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  // History state
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load rate limit on mount
  useEffect(() => {
    if (isOpen) {
      loadRateLimit();
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('form');
      setFormError(null);
      setExportError(null);
      setCurrentJob(null);
      setExportProgress(0);
    }
  }, [isOpen]);

  const loadRateLimit = async () => {
    setRateLimitLoading(true);
    try {
      const limit = await checkExportRateLimit('analytics_pdf');
      setRateLimit(limit);
    } catch (error) {
      console.error('Failed to load rate limit:', error);
    } finally {
      setRateLimitLoading(false);
    }
  };

  const loadExportHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await listUserExports(1, 10);
      setExportHistory(response.exports);
    } catch (error) {
      console.error('Failed to load export history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setExportError(null);

    // Validate dates
    const dateError = validateExportDateRange(startDate, endDate);
    if (dateError) {
      setFormError(dateError);
      return;
    }

    // Check rate limit
    if (rateLimit && rateLimit.remaining_today <= 0) {
      setFormError(`Limite de ${rateLimit.total_limit} exports/dia atingido. Aguarde até ${new Date(rateLimit.resets_at).toLocaleString('pt-BR')}`);
      return;
    }

    // Create export request
    const request: AnalyticsPDFExportRequest = {
      team_id: teamId,
      start_date: startDate,
      end_date: endDate,
      include_wellness_metrics: includeWellness,
      include_prevention_effectiveness: includePrevention,
      include_badges: includeBadges,
      include_rankings: includeRankings
    };

    try {
      // Request export (returns job immediately)
      const job = await requestAnalyticsPDFExport(request);
      setCurrentJob(job);
      setView('polling');

      // Start polling
      const completedJob = await pollExportJob(
        job.id,
        (updatedJob) => {
          setCurrentJob(updatedJob);
          setExportProgress(getExportProgress(updatedJob));
        },
        2000, // Poll every 2 seconds
        150   // Timeout after 5 minutes (150 * 2s)
      );

      // Download automatically
      if (completedJob.file_url) {
        downloadExportFile(completedJob.file_url);
      }

      // Reload rate limit
      await loadRateLimit();

    } catch (error: any) {
      setExportError(error.message || 'Erro ao gerar export');
      console.error('Export failed:', error);
    }
  };

  const handleDownload = () => {
    if (currentJob?.file_url) {
      downloadExportFile(currentJob.file_url);
    }
  };

  const handleReset = () => {
    setView('form');
    setCurrentJob(null);
    setExportProgress(0);
    setExportError(null);
  };

  const handleViewHistory = () => {
    setView('history');
    loadExportHistory();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icons.Files.PDF className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold">Exportar Analytics PDF</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{teamName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.Status.Close className="w-6 h-6" />
          </button>
        </div>

        {/* Rate Limit Badge */}
        {rateLimit && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Icons.Status.Info className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600 dark:text-gray-400">
                {rateLimit.remaining_today} de {rateLimit.total_limit} exports disponíveis hoje
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {view === 'form' && (
            <form data-tour="export-analytics" onSubmit={handleSubmit} className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium mb-2">
                  Incluir no PDF:
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWellness}
                    onChange={(e) => setIncludeWellness(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Métricas de Wellness (taxa resposta, média fadiga)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePrevention}
                    onChange={(e) => setIncludePrevention(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Eficácia Preventiva (alertas × lesões)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBadges}
                    onChange={(e) => setIncludeBadges(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Badges Conquistados</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRankings}
                    onChange={(e) => setIncludeRankings(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Ranking de Equipes</span>
                </label>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <Icons.Status.Warning className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-600 dark:text-red-400">{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={handleViewHistory}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Ver histórico de exports
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={rateLimitLoading || (rateLimit?.remaining_today ?? 1) <= 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Icons.Actions.Download className="w-4 h-4" />
                    Gerar PDF
                  </button>
                </div>
              </div>
            </form>
          )}

          {view === 'polling' && currentJob && (
            <div className="space-y-6">
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {getExportStatusText(currentJob.status)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {exportProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {currentJob.status === 'completed' ? (
                  <Icons.Status.Success className="w-6 h-6 text-green-600" />
                ) : currentJob.status === 'failed' ? (
                  <Icons.Status.Error className="w-6 h-6 text-red-600" />
                ) : (
                  <div className="animate-spin">
                    <Icons.UI.Loading className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{getExportStatusText(currentJob.status)}</div>
                  {currentJob.file_size_bytes && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tamanho: {formatFileSize(currentJob.file_size_bytes)}
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {exportError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <Icons.Status.Warning className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-600 dark:text-red-400">{exportError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                {currentJob.status === 'completed' && (
                  <>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Novo Export
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Icons.Actions.Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </>
                )}
                {currentJob.status === 'failed' && (
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Tentar Novamente
                  </button>
                )}
                {(currentJob.status === 'pending' || currentJob.status === 'processing') && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Fechar (continua em background)
                  </button>
                )}
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Histórico de Exports</h3>
                <button
                  onClick={() => setView('form')}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  ← Voltar
                </button>
              </div>

              {historyLoading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  Carregando...
                </div>
              ) : exportHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  Nenhum export anterior
                </div>
              ) : (
                <div className="space-y-2">
                  {exportHistory.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getExportStatusColor(job.status)}`}>
                            {getExportStatusText(job.status)}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(job.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {job.file_size_bytes && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatFileSize(job.file_size_bytes)}
                          </div>
                        )}
                      </div>
                      {job.status === 'completed' && job.file_url && (
                        <button
                          onClick={() => downloadExportFile(job.file_url!)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
