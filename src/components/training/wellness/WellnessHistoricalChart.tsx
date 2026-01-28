/**
 * WellnessHistoricalChart - Gráfico de Tendência de Wellness
 * 
 * Exibe gráfico de linha com histórico dos últimos 30 dias
 * de uma métrica específica de wellness (sleep, fatigue, etc.)
 * 
 * Step 28.2: Feature restante - Historical Charts
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Icons } from '@/design-system/icons';
import { apiClient } from '@/lib/api/client';

// ========================================
// Interfaces
// ========================================

interface WellnessHistoricalData {
  date: string;
  sleep_quality: number | null;
  fatigue_level: number | null;
  stress_level: number | null;
  muscle_soreness: number | null;
  mood: number | null;
  readiness: number | null;
}

interface WellnessHistoricalChartProps {
  athleteId: number;
  metric: 'sleep_quality' | 'fatigue_level' | 'stress_level' | 'muscle_soreness' | 'mood' | 'readiness';
  days?: number;
  height?: number;
  showTitle?: boolean;
}

// ========================================
// API Function
// ========================================

async function fetchWellnessHistory(
  athleteId: number,
  days: number
): Promise<WellnessHistoricalData[]> {
  return await apiClient.get<WellnessHistoricalData[]>(
    `/wellness-pre/athletes/${athleteId}/history`,
    { params: { days } }
  );
}

// ========================================
// Component
// ========================================

export function WellnessHistoricalChart({
  athleteId,
  metric,
  days = 30,
  height = 200,
  showTitle = true,
}: WellnessHistoricalChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['wellness-history', athleteId, days],
    queryFn: () => fetchWellnessHistory(athleteId, days),
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1,
  });

  const metricConfig = getMetricConfig(metric);

  // Transformar dados para Recharts
  const chartData = data?.map((item) => ({
    date: formatDate(item.date),
    value: item[metric],
  })) || [];

  // Filtrar valores nulos
  const validData = chartData.filter((item) => item.value !== null);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center" style={{ height }}>
          <Icons.UI.Loading className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center text-gray-400" style={{ height }}>
          <Icons.Status.Warning className="h-8 w-8" />
          <span className="ml-2 text-sm">Erro ao carregar histórico</span>
        </div>
      </div>
    );
  }

  if (validData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center text-gray-400" style={{ height }}>
          <Icons.Charts.ChartLine className="h-8 w-8" />
          <span className="mt-2 text-sm">Sem dados históricos</span>
          <span className="mt-1 text-xs text-gray-400">
            Complete mais wellness para ver tendências
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {showTitle && (
        <div className="flex items-center gap-2 mb-3">
          {metricConfig.icon}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {metricConfig.label} - Últimos {days} dias
          </h3>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={validData}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            labelStyle={{ fontWeight: 'bold' }}
            formatter={(value: number | undefined) => value !== undefined ? [value.toFixed(1), metricConfig.label] : ['', '']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={metricConfig.color}
            strokeWidth={2}
            dot={{ fill: metricConfig.color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="mt-3 flex items-center justify-around text-xs text-gray-600 dark:text-gray-400">
        <div className="text-center">
          <div className="font-medium">Média</div>
          <div className="mt-1 text-base font-semibold" style={{ color: metricConfig.color }}>
            {calculateAverage(validData).toFixed(1)}
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium">Mínimo</div>
          <div className="mt-1 text-base font-semibold">
            {calculateMin(validData).toFixed(1)}
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium">Máximo</div>
          <div className="mt-1 text-base font-semibold">
            {calculateMax(validData).toFixed(1)}
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium">Tendência</div>
          <div className="mt-1 text-base font-semibold">
            {getTrendIcon(validData)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Helper Functions
// ========================================

interface MetricConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

function getMetricConfig(metric: string): MetricConfig {
  const configs: Record<string, MetricConfig> = {
    sleep_quality: {
      label: 'Qualidade do Sono',
      color: '#3b82f6', // blue-500
      icon: <Icons.Training.Wellness.Moon className="h-4 w-4 text-blue-500" />,
    },
    fatigue_level: {
      label: 'Nível de Fadiga',
      color: '#ef4444', // red-500
      icon: <Icons.Training.Wellness.Battery className="h-4 w-4 text-red-500" />,
    },
    stress_level: {
      label: 'Nível de Estresse',
      color: '#f59e0b', // amber-500
      icon: <Icons.Training.Wellness.Brain className="h-4 w-4 text-amber-500" />,
    },
    muscle_soreness: {
      label: 'Dor Muscular',
      color: '#8b5cf6', // violet-500
      icon: <Icons.Training.Wellness.Activity className="h-4 w-4 text-violet-500" />,
    },
    mood: {
      label: 'Humor',
      color: '#10b981', // green-500
      icon: <Icons.Training.Wellness.Smile className="h-4 w-4 text-green-500" />,
    },
    readiness: {
      label: 'Prontidão',
      color: '#06b6d4', // cyan-500
      icon: <Icons.Training.Wellness.Target className="h-4 w-4 text-cyan-500" />,
    },
  };

  return configs[metric] || configs.readiness;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function calculateAverage(data: { value: number | null }[]): number {
  const validValues = data.filter((d) => d.value !== null).map((d) => d.value as number);
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

function calculateMin(data: { value: number | null }[]): number {
  const validValues = data.filter((d) => d.value !== null).map((d) => d.value as number);
  if (validValues.length === 0) return 0;
  return Math.min(...validValues);
}

function calculateMax(data: { value: number | null }[]): number {
  const validValues = data.filter((d) => d.value !== null).map((d) => d.value as number);
  if (validValues.length === 0) return 0;
  return Math.max(...validValues);
}

function getTrendIcon(data: { value: number | null }[]): string {
  if (data.length < 2) return '➖';
  
  const validData = data.filter((d) => d.value !== null);
  if (validData.length < 2) return '➖';
  
  const firstHalf = validData.slice(0, Math.floor(validData.length / 2));
  const secondHalf = validData.slice(Math.floor(validData.length / 2));
  
  const firstAvg = calculateAverage(firstHalf);
  const secondAvg = calculateAverage(secondHalf);
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 0.5) return '📈'; // Trend up
  if (diff < -0.5) return '📉'; // Trend down
  return '➖'; // Stable
}
