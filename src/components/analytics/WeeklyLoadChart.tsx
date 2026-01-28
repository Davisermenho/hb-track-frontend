'use client'

/**
 * WeeklyLoadChart - Step 17
 * 
 * Gráfico de carga semanal usando dados de training_analytics_cache.
 * Mostra evolução de internal_load, RPE e attendance_rate ao longo das semanas.
 */

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { WeeklyLoadItem, formatWeek } from '@/lib/api/analytics'

// ============================================================================
// TYPES
// ============================================================================

interface WeeklyLoadChartProps {
  data: WeeklyLoadItem[]
  showInternalLoad?: boolean
  showRPE?: boolean
  showAttendance?: boolean
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload as WeeklyLoadItem

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
        Semana {formatWeek(data.week_start, data.week_end)}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Carga Total</span>
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {data.total_internal_load.toFixed(0)} UA
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-gray-600 dark:text-gray-400">RPE Médio</span>
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {data.avg_rpe.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Assiduidade</span>
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {data.attendance_rate.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {data.total_sessions} {data.total_sessions === 1 ? 'sessão' : 'sessões'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WeeklyLoadChart({
  data,
  showInternalLoad = true,
  showRPE = true,
  showAttendance = true,
}: WeeklyLoadChartProps) {
  // Formatar dados para o gráfico
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      weekLabel: formatWeek(item.week_start, item.week_end),
      // Normalizar carga para escala 0-10 (para visualização junto com RPE)
      normalizedLoad: item.total_internal_load / 100,
    }))
  }, [data])

  // Calcular médias para referência
  const avgLoad = useMemo(() => {
    if (data.length === 0) return 0
    return data.reduce((sum, item) => sum + item.total_internal_load, 0) / data.length
  }, [data])

  const avgRPE = useMemo(() => {
    if (data.length === 0) return 0
    return data.reduce((sum, item) => sum + item.avg_rpe, 0) / data.length
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-gray-500 dark:text-gray-400">
          Sem dados de carga semanal disponíveis
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Carga Média
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {avgLoad.toFixed(0)}
            <span className="ml-1 text-sm font-normal text-gray-500">UA</span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            RPE Médio
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {avgRPE.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Semanas
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey="weekLabel"
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              yAxisId="left"
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              label={{
                value: 'Carga (UA)',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 10]}
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              label={{
                value: 'RPE / Assiduidade (%)',
                angle: 90,
                position: 'insideRight',
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            
            {showInternalLoad && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total_internal_load"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Carga Total"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            
            {showRPE && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_rpe"
                stroke="#f59e0b"
                strokeWidth={2}
                name="RPE Médio"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            
            {showAttendance && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="attendance_rate"
                stroke="#10b981"
                strokeWidth={2}
                name="Assiduidade (%)"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda adicional */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>
          💡 <strong>Carga Interna:</strong> Somatório de RPE × Duração das sessões da semana (UA = Unidades Arbitrárias)
        </p>
        <p className="mt-1">
          📊 <strong>RPE Médio:</strong> Escala de 0-10 (percepção subjetiva de esforço)
        </p>
        <p className="mt-1">
          ✅ <strong>Assiduidade:</strong> Percentual de atletas presentes nas sessões
        </p>
      </div>
    </div>
  )
}
