'use client';

/**
 * AthleteSelfView Component
 * Route: /statistics/me
 * 
 * Following STATISTICS.TXT specifications (lines 300-448):
 * - Auto-load (no manual selection)
 * - Interpretative, non-technical language
 * - Status limited to "ok" or "atenção" only
 * - FORBIDDEN: rankings, comparisons, team averages
 * - Copy: protective and supportive tone
 * - Sections: estado atual, presença, wellness, carga, insights (optional)
 */

import { useEffect, useState } from 'react';
import { statisticsService, AthleteSelfReport } from '@/lib/api/statistics-operational';
import { AlertCircle, TrendingUp, Heart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ViewState = 'loading' | 'error' | 'data';

export default function AthleteSelfView() {
  const [state, setState] = useState<ViewState>('loading');
  const [data, setData] = useState<AthleteSelfReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setState('loading');
    setError(null);
    try {
      const report = await statisticsService.getAthleteSelf();
      setData(report);
      setState('data');
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar seus dados');
      setState('error');
    }
  };

  // Loading State - Skeleton
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3 border border-gray-200 dark:border-gray-700">
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State - With retry button
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg p-8 text-center space-y-4 border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Não foi possível carregar seus dados
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error || 'Tente novamente em alguns instantes.'}
            </p>
          </div>
          <Button onClick={loadData} variant="default" className="w-full">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Copy functions - Exact text from STATISTICS.TXT lines 345-416
  const getOverallStatusCopy = () => {
    if (data.overall_status === 'ok') {
      return 'Seu acompanhamento está dentro do esperado neste período.';
    }
    return 'Alguns pontos merecem atenção neste momento. Isso é comum em períodos mais intensos.';
  };

  const getPresenceCopy = () => {
    if (!data.presence || data.presence.last_sessions.length === 0) {
      return 'Ainda não há registros recentes. Quando você participar de treinos ou jogos, eles aparecerão aqui.';
    }
    if (data.presence.recent_absences > 2) {
      return 'Houve algumas ausências recentes. Quando possível, retomar a regularidade ajuda no desempenho.';
    }
    return 'Você tem mantido uma boa constância de participação.';
  };

  const getWellnessCopy = () => {
    if (!data.wellness) {
      return 'Seu questionário de bem-estar ainda não foi respondido. Ao responder, seu acompanhamento ficará mais completo.';
    }
    const trend = data.wellness.trend;
    if (trend === 'stable' || trend === 'improving') {
      return 'Seu bem-estar está estável neste período.';
    }
    if (trend === 'attention') {
      return 'Seu bem-estar apresentou variações recentes. Observe como seu corpo responde aos treinos.';
    }
    return 'Seu questionário de bem-estar ainda não foi respondido. Ao responder, seu acompanhamento ficará mais completo.';
  };

  const getLoadCopy = () => {
    if (!data.load) {
      return 'Ainda não há dados de carga disponíveis.';
    }
    const zone = data.load.zone;
    if (zone === 'within_zone') {
      return 'Sua carga está equilibrada para este momento.';
    }
    if (zone === 'above_zone') {
      return 'Sua carga esteve um pouco acima do habitual. Priorizar recuperação pode ajudar.';
    }
    if (zone === 'below_zone') {
      return 'Sua carga esteve abaixo do seu padrão recente. Isso pode acontecer em semanas diferentes.';
    }
    return 'Sua carga está equilibrada para este momento.';
  };

  // Calculate display values from backend data
  const calculateParticipationRate = () => {
    if (!data.presence || data.presence.last_sessions.length === 0) return 0;
    const present = data.presence.last_sessions.filter((s) => s === 'P').length;
    return Math.round((present / data.presence.last_sessions.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header - STATISTICS.TXT line 339-341 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Minhas Estatísticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe sua evolução ao longo do tempo.
          </p>
        </div>

        {/* Overall Status Card - STATISTICS.TXT line 343-352 */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg p-6 border ${
            data.overall_status === 'ok'
              ? 'border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20'
              : 'border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20'
          }`}
          role="region"
          aria-label="Estado atual"
        >
          <div className="flex items-start gap-3">
            <TrendingUp
              className={`w-5 h-5 mt-0.5 ${
                data.overall_status === 'ok'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
              aria-hidden="true"
            />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Estado atual
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {getOverallStatusCopy()}
              </p>
            </div>
          </div>
        </div>

        {/* Presence Card - STATISTICS.TXT line 354-367 */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          role="region"
          aria-label="Presença e constância"
        >
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Presença e constância
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {getPresenceCopy()}
              </p>
              {data.presence && data.presence.last_sessions.length > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {calculateParticipationRate()}% de participação nas últimas {data.presence.last_sessions.length} sessões
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wellness Card - STATISTICS.TXT line 369-382 */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          role="region"
          aria-label="Bem-estar"
        >
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 mt-0.5 text-pink-600 dark:text-pink-400" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Bem-estar
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {getWellnessCopy()}
              </p>
            </div>
          </div>
        </div>

        {/* Load Card - STATISTICS.TXT line 384-403 */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          role="region"
          aria-label="Carga"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 mt-0.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Carga
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {getLoadCopy()}
              </p>
              {data.load && data.load.current_load && (
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Atual</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data.load.current_load}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Sua média</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data.load.baseline || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Diferença</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data.load.deviation ? `${data.load.deviation > 0 ? '+' : ''}${data.load.deviation}%` : '-'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights (optional) - STATISTICS.TXT line 405-413 */}
        {data.insights && data.insights.length > 0 && (
          <div
            className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900/30"
            role="region"
            aria-label="Observações"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Observações
            </h2>
            <ul className="space-y-2">
              {data.insights.map((insight, idx) => (
                <li key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alerts (attention only, never critical) - STATISTICS.TXT line 415-428 */}
        {data.alerts && data.alerts.length > 0 && (
          <div
            className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-6 border border-amber-200 dark:border-amber-900/30"
            role="region"
            aria-label="Pontos de atenção"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Pontos de atenção
            </h2>
            <ul className="space-y-2">
              {data.alerts
                .filter((alert) => alert.level === 'warning' || alert.level === 'info')
                .map((alert, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    • {alert.message}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
