/**
 * Gráfico de Pizza - Distribuição de Focos (Step 14)
 * 
 * Visualiza distribuição de 7 focos em gráfico de pizza com Recharts:
 * - Ataque Posicional
 * - Defesa Posicional
 * - Transição Ofensiva
 * - Transição Defensiva
 * - Técnica Ataque
 * - Técnica Defesa
 * - Físico
 * 
 * @author HB TRACK - Training Module
 * @date 2026-01-16
 */

'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import type { FocusValues } from '@/lib/api/trainings';

// Alternative focus format with focus_ prefix (used by templates)
interface FocusValuesWithPrefix {
  focus_attack_positional_pct?: number;
  focus_defense_positional_pct?: number;
  focus_transition_offense_pct?: number;
  focus_transition_defense_pct?: number;
  focus_attack_technical_pct?: number;
  focus_defense_technical_pct?: number;
  focus_physical_pct?: number;
}

interface FocusDistributionPieChartProps {
  focus: Partial<FocusValues> | FocusValuesWithPrefix;
  total?: number;
  className?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const focusLabels: Record<keyof FocusValues, string> = {
  attack_positional_pct: 'Ataque Posicional',
  defense_positional_pct: 'Defesa Posicional',
  transition_offense_pct: 'Transição Ofensiva',
  transition_defense_pct: 'Transição Defensiva',
  attack_technical_pct: 'Técnica Ataque',
  defense_technical_pct: 'Técnica Defesa',
  physical_pct: 'Físico',
};

const focusColors: Record<keyof FocusValues, string> = {
  attack_positional_pct: '#ef4444', // red-500
  defense_positional_pct: '#3b82f6', // blue-500
  transition_offense_pct: '#f97316', // orange-500
  transition_defense_pct: '#06b6d4', // cyan-500
  attack_technical_pct: '#ec4899', // pink-500
  defense_technical_pct: '#8b5cf6', // violet-500
  physical_pct: '#10b981', // green-500
};

const sizeConfig = {
  sm: { width: 200, height: 200, innerRadius: 40, outerRadius: 80 },
  md: { width: 300, height: 300, innerRadius: 60, outerRadius: 120 },
  lg: { width: 400, height: 400, innerRadius: 80, outerRadius: 160 },
};

/**
 * Gráfico de pizza para visualizar distribuição de focos
 */
export function FocusDistributionPieChart({
  focus,
  total,
  className,
  showLegend = true,
  showTooltip = true,
  size = 'md',
}: FocusDistributionPieChartProps) {
  const config = sizeConfig[size];

  // Map keys with focus_ prefix to keys without prefix
  const keyMapping: Record<string, keyof FocusValues> = {
    focus_attack_positional_pct: 'attack_positional_pct',
    focus_defense_positional_pct: 'defense_positional_pct',
    focus_transition_offense_pct: 'transition_offense_pct',
    focus_transition_defense_pct: 'transition_defense_pct',
    focus_attack_technical_pct: 'attack_technical_pct',
    focus_defense_technical_pct: 'defense_technical_pct',
    focus_physical_pct: 'physical_pct',
  };

  // Prepara dados para o gráfico (filtra valores > 0)
  const chartData = Object.entries(focus)
    .filter(([key, value]) => value && value > 0)
    .map(([key, value]) => {
      // Normalize key (remove focus_ prefix if present)
      const normalizedKey = keyMapping[key] || (key as keyof FocusValues);
      return {
        name: focusLabels[normalizedKey],
        value: value || 0,
        color: focusColors[normalizedKey],
      };
    })
    .filter((item) => item.name && item.color);

  // Se não há dados, mostra mensagem
  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900',
          className
        )}
        style={{ width: config.width, height: config.height }}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum foco definido
        </p>
      </div>
    );
  }

  const calculatedTotal = chartData.reduce((sum, item) => sum + item.value, 0);
  const displayTotal = total !== undefined ? total : calculatedTotal;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <ResponsiveContainer width={config.width} height={config.height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${value.toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {data.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {data.value.toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}

          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Total centralizado */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          width: config.width,
          height: config.height,
        }}
      >
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {displayTotal.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Versão compacta do gráfico (sem legenda, menor)
 */
export function FocusDistributionPieChartCompact({
  focus,
  total,
  className,
}: Pick<FocusDistributionPieChartProps, 'focus' | 'total' | 'className'>) {
  return (
    <FocusDistributionPieChart
      focus={focus}
      total={total}
      className={className}
      showLegend={false}
      showTooltip={true}
      size="sm"
    />
  );
}

/**
 * Legenda separada do gráfico (para layout customizado)
 */
export function FocusDistributionLegend({
  focus,
  className,
}: Pick<FocusDistributionPieChartProps, 'focus' | 'className'>) {
  // Map keys with focus_ prefix to keys without prefix
  const keyMapping: Record<string, keyof FocusValues> = {
    focus_attack_positional_pct: 'attack_positional_pct',
    focus_defense_positional_pct: 'defense_positional_pct',
    focus_transition_offense_pct: 'transition_offense_pct',
    focus_transition_defense_pct: 'transition_defense_pct',
    focus_attack_technical_pct: 'attack_technical_pct',
    focus_defense_technical_pct: 'defense_technical_pct',
    focus_physical_pct: 'physical_pct',
  };

  const items = Object.entries(focus)
    .filter(([key, value]) => value && value > 0)
    .map(([key, value]) => {
      const normalizedKey = keyMapping[key] || (key as keyof FocusValues);
      return {
        name: focusLabels[normalizedKey],
        value: value || 0,
        color: focusColors[normalizedKey],
      };
    })
    .filter((item) => item.name && item.color)
    .sort((a, b) => b.value - a.value);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-700 dark:text-gray-300 truncate">
              {item.name}
            </span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
            {item.value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
