'use client'

/**
 * WellnessResponseChart - Step 17
 * 
 * Gráfico de taxa de resposta de wellness (pré e pós-treino).
 * Meta: 80% de adesão (Step 16 - wellness_response_rate).
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
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts'
import { WeeklyLoadItem, formatWeek } from '@/lib/api/analytics'

// ============================================================================
// TYPES
// ============================================================================

interface WellnessData {
  week_start: string
  week_end: string
  response_rate_pre?: number
  response_rate_post?: number
}

interface WellnessResponseChartProps {
  data: WellnessData[]
  showPreRate?: boolean
  showPostRate?: boolean
  targetRate?: number
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload as WellnessData & { weekLabel: string }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
        {data.weekLabel}
      </p>
      <div className="space-y-1 text-sm">
        {data.response_rate_pre !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Pré-Treino</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {data.response_rate_pre.toFixed(1)}%
            </span>
          </div>
        )}
        {data.response_rate_post !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">Pós-Treino</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {data.response_rate_post.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// HELPER
// ============================================================================

function getRateBadge(rate: number, target: number) {
  if (rate >= target) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-950',
      icon: '🏆',
      label: 'Excelente',
    }
  }
  if (rate >= target * 0.8) {
    return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-950',
      icon: '✅',
      label: 'Bom',
    }
  }
  return {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-950',
    icon: '⚠️',
    label: 'Atenção',
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WellnessResponseChart({
  data,
  showPreRate = true,
  showPostRate = true,
  targetRate = 80,
}: WellnessResponseChartProps) {
  // Formatar dados para o gráfico
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      weekLabel: formatWeek(item.week_start, item.week_end),
    }))
  }, [data])

  // Calcular médias
  const avgPreRate = useMemo(() => {
    const validData = data.filter((d) => d.response_rate_pre !== undefined)
    if (validData.length === 0) return 0
    return (
      validData.reduce((sum, d) => sum + (d.response_rate_pre || 0), 0) / validData.length
    )
  }, [data])

  const avgPostRate = useMemo(() => {
    const validData = data.filter((d) => d.response_rate_post !== undefined)
    if (validData.length === 0) return 0
    return (
      validData.reduce((sum, d) => sum + (d.response_rate_post || 0), 0) / validData.length
    )
  }, [data])

  const preBadge = getRateBadge(avgPreRate, targetRate)
  const postBadge = getRateBadge(avgPostRate, targetRate)

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-gray-500 dark:text-gray-400">
          Sem dados de wellness disponíveis
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-lg border p-3 ${preBadge.bg}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{preBadge.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Pré-Treino
              </p>
              <p className={`text-2xl font-bold ${preBadge.color}`}>
                {avgPreRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className={`mt-1 text-xs font-semibold ${preBadge.color}`}>
            {preBadge.label}
          </p>
        </div>

        <div className={`rounded-lg border p-3 ${postBadge.bg}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{postBadge.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Pós-Treino
              </p>
              <p className={`text-2xl font-bold ${postBadge.color}`}>
                {avgPostRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className={`mt-1 text-xs font-semibold ${postBadge.color}`}>
            {postBadge.label}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Meta
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {targetRate}%
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Target configurado
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPre" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              domain={[0, 100]}
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              label={{
                value: 'Taxa de Resposta (%)',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />

            {/* Linha de meta */}
            <ReferenceLine
              y={targetRate}
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Meta ${targetRate}%`,
                position: 'right',
                fill: '#10b981',
                fontSize: 12,
              }}
            />

            {/* Zona de alerta (abaixo de 80% da meta) */}
            <ReferenceLine
              y={targetRate * 0.8}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'Limite',
                position: 'right',
                fill: '#f59e0b',
                fontSize: 10,
              }}
            />

            {showPreRate && (
              <>
                <Area
                  type="monotone"
                  dataKey="response_rate_pre"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorPre)"
                  name="Pré-Treino"
                />
                <Line
                  type="monotone"
                  dataKey="response_rate_pre"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}

            {showPostRate && (
              <>
                <Area
                  type="monotone"
                  dataKey="response_rate_post"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#colorPost)"
                  name="Pós-Treino"
                />
                <Line
                  type="monotone"
                  dataKey="response_rate_post"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-400">
          💡 Insights
        </p>
        <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400">
          {avgPreRate < targetRate && (
            <li>
              • Pré-treino abaixo da meta ({avgPreRate.toFixed(1)}% vs {targetRate}%) - 
              considere estratégias de engajamento
            </li>
          )}
          {avgPostRate < targetRate && (
            <li>
              • Pós-treino abaixo da meta ({avgPostRate.toFixed(1)}% vs {targetRate}%) - 
              foco em feedbacks imediatos
            </li>
          )}
          {avgPreRate >= targetRate && avgPostRate >= targetRate && (
            <li>
              • Excelente adesão em ambos os momentos! Continue o bom trabalho 🎉
            </li>
          )}
          {avgPreRate < avgPostRate && (
            <li>
              • Pós-treino ({avgPostRate.toFixed(1)}%) supera pré-treino ({avgPreRate.toFixed(1)}%) - 
              ótimo engajamento após sessão
            </li>
          )}
          {avgPreRate > avgPostRate && (
            <li>
              • Pré-treino ({avgPreRate.toFixed(1)}%) supera pós-treino ({avgPostRate.toFixed(1)}%) - 
              possível cansaço pós-sessão
            </li>
          )}
        </ul>
      </div>

      {/* Legenda */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>
          <strong>Taxa de Resposta:</strong> Percentual de atletas que preencheram wellness 
          em relação aos presentes na sessão
        </p>
        <p className="mt-1">
          <strong>Meta:</strong> {targetRate}% de adesão (Step 16 - KPI de engajamento)
        </p>
      </div>
    </div>
  )
}
