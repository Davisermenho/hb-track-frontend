'use client';

import { useState, useEffect } from 'react';
import { StatisticsEmptyState } from '@/components/Statistics/StatisticsEmptyState';
import { SessionSelectorModal } from '@/components/Statistics/SessionSelectorModal';
import { statisticsService } from '@/lib/api/statistics-operational';
import type { OperationalSessionSnapshot } from '@/lib/api/statistics-operational';
import { 
  ClipboardList, 
  Users, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';

/**
 * Container da página /statistics
 * 
 * Conforme STATISTICS.TXT:
 * - Estado default: empty state
 * - Modal bloqueante para seleção
 * - Cancelar → retorna ao empty state
 * - Dados só aparecem após confirmação
 * - Tempo de decisão: <30s
 */
export default function StatisticsOperationalPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [data, setData] = useState<OperationalSessionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados quando sessão é confirmada
  useEffect(() => {
    if (!selectedSessionId) return;

    async function loadSnapshot() {
      setLoading(true);
      setError(null);

      try {
        // selectedSessionId is guaranteed to be non-null here due to guard above
        const snapshot = await statisticsService.getOperationalSession(selectedSessionId as string);
        setData(snapshot);
      } catch (err) {
        setError('Não foi possível carregar a sessão selecionada.');
        setData(null);
        // Volta ao empty state em caso de erro
        setSelectedSessionId(null);
      } finally {
        setLoading(false);
      }
    }

    loadSnapshot();
  }, [selectedSessionId]);

  const handleConfirmSession = (sessionId: string, sessionType: 'training' | 'match') => {
    setSelectedSessionId(sessionId);
    setShowModal(false);
  };

  const handleCancelModal = () => {
    setShowModal(false);
    // Não persiste seleção, retorna ao empty state
  };

  const handleChangeSession = () => {
    setShowModal(true);
  };

  // Empty state: nenhuma sessão selecionada
  if (!selectedSessionId && !loading) {
    return (
      <>
        <StatisticsEmptyState onSelectSession={() => setShowModal(true)} />
        <SessionSelectorModal
          isOpen={showModal}
          onClose={handleCancelModal}
          onConfirm={handleConfirmSession}
        />
      </>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Tentar novamente
            </button>
          </div>
        </div>
        <SessionSelectorModal
          isOpen={showModal}
          onClose={handleCancelModal}
          onConfirm={handleConfirmSession}
        />
      </>
    );
  }

  // Data view: sessão selecionada e dados carregados
  if (!data) return null;

  const { context, process_status, load_summary, athletes, alerts } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header fixo com contexto */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Visão Operacional
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {context.team.name} · {new Date(context.date).toLocaleDateString('pt-BR')} · {
                  context.session_type === 'training' ? 'Treino' : 'Jogo'
                }
              </p>
            </div>
            <button
              onClick={handleChangeSession}
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Trocar sessão
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Pendências do processo */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Pendências do Processo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Presentes</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {process_status.present}/{process_status.total_athletes}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Ausentes</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {process_status.absent}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Wellness Pendente</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {process_status.wellness_pending}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Engajamento</div>
              <div className={`text-2xl font-bold mt-1 ${
                process_status.engagement_status === 'active' ? 'text-success-600' :
                process_status.engagement_status === 'partial' ? 'text-warning-600' :
                'text-gray-400'
              }`}>
                {process_status.engagement_status === 'active' ? 'Ativo' :
                 process_status.engagement_status === 'partial' ? 'Parcial' : 'Inativo'}
              </div>
            </div>
          </div>
        </section>

        {/* Carga da sessão */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Carga da Sessão
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Carga Média</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {load_summary.session_load_avg.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Baseline da Equipe</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {load_summary.team_baseline_avg.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Desvio</div>
                <div className={`text-3xl font-bold mt-1 ${
                  Math.abs(load_summary.deviation_pct) > 15 ? 'text-warning-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {load_summary.deviation_pct > 0 ? '+' : ''}{load_summary.deviation_pct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lista operacional de atletas */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista Operacional ({athletes.length})
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Atleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Presença
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Wellness
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Carga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {athletes.map((athlete) => (
                  <tr key={athlete.athlete_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {athlete.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        athlete.presence === 'present' 
                          ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                      }`}>
                        {athlete.presence === 'present' && <CheckCircle className="w-3 h-3" />}
                        {athlete.presence === 'absent' && <XCircle className="w-3 h-3" />}
                        {athlete.presence === 'present' ? 'Presente' : 'Ausente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        athlete.wellness === 'ok' 
                          ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                          : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      }`}>
                        {athlete.wellness === 'ok' ? 'OK' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        athlete.load_status === 'ok'
                          ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                          : athlete.load_status === 'alert'
                          ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {athlete.load_status === 'ok' ? 'OK' : athlete.load_status === 'alert' ? 'Atenção' : 'Crítico'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        athlete.overall_status === 'ok'
                          ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                          : athlete.overall_status === 'attention'
                          ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {athlete.overall_status === 'critical' && <AlertTriangle className="w-3 h-3" />}
                        {athlete.overall_status === 'ok' ? 'OK' : athlete.overall_status === 'attention' ? 'Atenção' : 'Crítico'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Alertas */}
        {alerts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas ({alerts.length})
            </h2>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    alert.level === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : alert.level === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                      alert.level === 'critical' ? 'text-red-600 dark:text-red-400' :
                      alert.level === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        alert.level === 'critical' ? 'text-red-900 dark:text-red-300' :
                        alert.level === 'warning' ? 'text-amber-900 dark:text-amber-300' :
                        'text-blue-900 dark:text-blue-300'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modal de seleção */}
      <SessionSelectorModal
        isOpen={showModal}
        onClose={handleCancelModal}
        onConfirm={handleConfirmSession}
      />
    </div>
  );
}
