/**
 * Bloco de Prontidão/Wellness da Equipe (R3)
 */

import { Moon, Star, Battery, Activity, Brain, Smile, Target } from 'lucide-react';

interface WellnessData {
  avg_sleep_hours?: number | null;
  avg_sleep_quality: number | null;
  avg_fatigue: number | null;
  avg_stress: number | null;
  avg_muscle_soreness?: number | null;
  avg_soreness?: number | null;
  avg_mood: number | null;
  avg_mood_post?: number | null;
  readiness_score?: number | null;
  athletes_reported?: number;
  total_athletes?: number;
}

interface WellnessRadarProps {
  data: WellnessData | null;
}

export default function WellnessRadar({ data }: WellnessRadarProps) {
  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          🎯 Prontidão da Equipe
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sem dados de wellness disponíveis
        </p>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Sono',
      value: data.avg_sleep_hours || 0,
      max: 10,
      unit: 'h',
      icon: <Moon className="w-4 h-4" />,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      status: (data.avg_sleep_hours || 0) >= 7 ? 'good' : 'warning',
    },
    {
      label: 'Qualidade Sono',
      value: data.avg_sleep_quality || 0,
      max: 5,
      unit: '/5',
      icon: <Star className="w-4 h-4" />,
      color: 'bg-indigo-500',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      status: (data.avg_sleep_quality || 0) >= 3.5 ? 'good' : 'warning',
    },
    {
      label: 'Fadiga',
      value: data.avg_fatigue || 0,
      max: 5,
      unit: '/5',
      icon: <Battery className="w-4 h-4" />,
      color: 'bg-yellow-500',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      status: (data.avg_fatigue || 0) <= 2.5 ? 'good' : 'warning',
    },
    {
      label: 'Dor Muscular',
      value: data.avg_muscle_soreness || 0,
      max: 5,
      unit: '/5',
      icon: <Activity className="w-4 h-4" />,
      color: 'bg-orange-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      status: (data.avg_muscle_soreness || 0) <= 2.5 ? 'good' : 'warning',
    },
    {
      label: 'Estresse',
      value: data.avg_stress || 0,
      max: 5,
      unit: '/5',
      icon: <Brain className="w-4 h-4" />,
      color: 'bg-red-500',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      status: (data.avg_stress || 0) <= 2.5 ? 'good' : 'warning',
    },
    {
      label: 'Humor Pós-Treino',
      value: data.avg_mood_post || 0,
      max: 5,
      unit: '/5',
      icon: <Smile className="w-4 h-4" />,
      color: 'bg-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      status: (data.avg_mood_post || 0) >= 3.5 ? 'good' : 'warning',
    },
  ]

  const warningCount = metrics.filter((m) => m.status === 'warning').length

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Prontidão da Equipe
          </h3>
        </div>
        {warningCount > 0 && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            ⚠️ {warningCount} alerta{warningCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${metric.iconBg} ${metric.iconColor}`}>
                  {metric.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {metric.value.toFixed(1)}
                {metric.unit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full ${metric.color} transition-all duration-300`}
                style={{ width: `${(metric.value / metric.max) * 100}%` }}
              />
            </div>
            {metric.status === 'warning' && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ Atenção necessária
              </p>
            )}
          </div>
        ))}
      </div>

      {data.total_athletes && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.total_athletes}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Atletas monitoradas
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.avg_sleep_hours?.toFixed(1) || '0'}h
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sono médio
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {data.avg_fatigue?.toFixed(1) || '0'}/5
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Fadiga média
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.avg_mood_post?.toFixed(1) || '0'}/5
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Humor pós-treino
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
