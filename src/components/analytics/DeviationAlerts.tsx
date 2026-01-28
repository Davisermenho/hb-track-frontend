'use client'

/**
 * DeviationAlerts - Step 17
 * 
 * Exibe alertas de desvios de RPE que excederam o threshold dinâmico.
 * Integra com Step 15 (alert_threshold_multiplier).
 */

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DeviationItem } from '@/lib/api/analytics'
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface DeviationAlertsProps {
  deviations: DeviationItem[]
  thresholdMultiplier: number
  onSessionClick?: (sessionId: string) => void
  maxDisplay?: number
}

// ============================================================================
// HELPER
// ============================================================================

function getDeviationBadge(deviation: number) {
  const abs = Math.abs(deviation)
  
  if (abs >= 3) {
    return {
      color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
      icon: AlertTriangle,
      label: 'Crítico',
    }
  }
  
  if (abs >= 2) {
    return {
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
      icon: AlertTriangle,
      label: 'Alto',
    }
  }
  
  return {
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    icon: AlertTriangle,
    label: 'Moderado',
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DeviationAlerts({
  deviations,
  thresholdMultiplier,
  onSessionClick,
  maxDisplay = 10,
}: DeviationAlertsProps) {
  // Ordenar por desvio absoluto (maior primeiro)
  const sortedDeviations = useMemo(() => {
    return [...deviations]
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      .slice(0, maxDisplay)
  }, [deviations, maxDisplay])

  // Estatísticas
  const stats = useMemo(() => {
    if (deviations.length === 0) {
      return {
        avgDeviation: 0,
        maxDeviation: 0,
        criticalCount: 0,
        highCount: 0,
      }
    }

    const avgDeviation =
      deviations.reduce((sum, d) => sum + Math.abs(d.deviation), 0) / deviations.length
    const maxDeviation = Math.max(...deviations.map((d) => Math.abs(d.deviation)))
    const criticalCount = deviations.filter((d) => Math.abs(d.deviation) >= 3).length
    const highCount = deviations.filter(
      (d) => Math.abs(d.deviation) >= 2 && Math.abs(d.deviation) < 3
    ).length

    return {
      avgDeviation,
      maxDeviation,
      criticalCount,
      highCount,
    }
  }, [deviations])

  if (deviations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <span className="text-2xl">✅</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Sem desvios detectados
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Todas as sessões estão dentro do threshold de {thresholdMultiplier.toFixed(1)}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Total Desvios
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {deviations.length}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            Críticos
          </p>
          <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.criticalCount}
          </p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30">
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Altos
          </p>
          <p className="mt-1 text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.highCount}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Desvio Médio
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.avgDeviation.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Info threshold */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Threshold configurado:</strong> {thresholdMultiplier.toFixed(1)}
          <span className="ml-2 text-xs">
            (Step 15 - alert_threshold_multiplier da equipe)
          </span>
        </p>
      </div>

      {/* Lista de desvios */}
      <div className="space-y-2">
        {sortedDeviations.map((deviation) => {
          const badge = getDeviationBadge(deviation.deviation)
          const Icon = badge.icon
          const isOverplanned = deviation.deviation > 0 // RPE real > planejado
          const TrendIcon = isOverplanned ? TrendingUp : TrendingDown

          return (
            <button
              key={deviation.session_id}
              onClick={() => onSessionClick?.(deviation.session_id)}
              className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Data e ícone */}
                <div className="flex items-start gap-3">
                  <div className={`rounded-full p-2 ${badge.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(parseISO(deviation.session_at), "d 'de' MMMM, yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Planejado:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                          {deviation.planned_rpe.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Real:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                          {deviation.actual_rpe.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Desvio e badge */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendIcon
                      className={`h-5 w-5 ${
                        isOverplanned
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    />
                    <span
                      className={`text-2xl font-bold ${
                        isOverplanned
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isOverplanned ? '+' : ''}
                      {deviation.deviation.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isOverplanned ? 'Sobre-executado' : 'Sub-executado'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      {deviations.length > maxDisplay && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Exibindo {maxDisplay} de {deviations.length} desvios
          </p>
        </div>
      )}

      {/* Legenda */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
        <p className="font-semibold">Critérios de classificação:</p>
        <ul className="mt-2 space-y-1">
          <li>
            <span className="font-semibold text-red-600 dark:text-red-400">Crítico:</span> Desvio ≥ 3.0
          </li>
          <li>
            <span className="font-semibold text-orange-600 dark:text-orange-400">Alto:</span> Desvio ≥ 2.0
          </li>
          <li>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">Moderado:</span> Desvio {'<'} 2.0
          </li>
        </ul>
        <p className="mt-2">
          <strong>Desvio:</strong> |RPE_real - RPE_planejado| × {thresholdMultiplier.toFixed(1)}
        </p>
      </div>
    </div>
  )
}
