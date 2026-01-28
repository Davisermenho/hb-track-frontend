'use client';

import { Target, TrendingUp, Save, Slash, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoutStats } from '@/types/scout';

interface ScoutStatsProps {
  homeStats: ScoutStats;
  awayStats: ScoutStats;
  className?: string;
}

interface StatRowProps {
  icon: React.ElementType;
  label: string;
  homeValue: number | string;
  awayValue: number | string;
  homeHighlight?: boolean;
  awayHighlight?: boolean;
}

function StatRow({ icon: Icon, label, homeValue, awayValue, homeHighlight, awayHighlight }: StatRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Casa */}
      <div className={cn(
        'text-right font-semibold',
        homeHighlight ? 'text-success-600 dark:text-success-400' : 'text-gray-700 dark:text-gray-300'
      )}>
        {homeValue}
      </div>

      {/* Label */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Icon className="w-4 h-4" />
        <span className="hidden md:inline">{label}</span>
      </div>

      {/* Visitante */}
      <div className={cn(
        'text-left font-semibold',
        awayHighlight ? 'text-success-600 dark:text-success-400' : 'text-gray-700 dark:text-gray-300'
      )}>
        {awayValue}
      </div>
    </div>
  );
}

export function ScoutStats({ homeStats, awayStats, className }: ScoutStatsProps) {
  const homeAccuracy = homeStats.shots > 0 
    ? ((homeStats.goals / homeStats.shots) * 100).toFixed(1) 
    : '0.0';
  
  const awayAccuracy = awayStats.shots > 0 
    ? ((awayStats.goals / awayStats.shots) * 100).toFixed(1) 
    : '0.0';

  const home7mRate = homeStats.sevenMeters.attempts > 0
    ? ((homeStats.sevenMeters.conversions / homeStats.sevenMeters.attempts) * 100).toFixed(0)
    : '0';

  const away7mRate = awayStats.sevenMeters.attempts > 0
    ? ((awayStats.sevenMeters.conversions / awayStats.sevenMeters.attempts) * 100).toFixed(0)
    : '0';

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800',
      'shadow-sm',
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Estatísticas da Partida
          </h3>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <StatRow
          icon={Target}
          label="Gols"
          homeValue={homeStats.goals}
          awayValue={awayStats.goals}
          homeHighlight={homeStats.goals > awayStats.goals}
          awayHighlight={awayStats.goals > homeStats.goals}
        />

        <StatRow
          icon={Target}
          label="Arremessos"
          homeValue={homeStats.shots}
          awayValue={awayStats.shots}
        />

        <StatRow
          icon={TrendingUp}
          label="Eficácia"
          homeValue={`${homeAccuracy}%`}
          awayValue={`${awayAccuracy}%`}
          homeHighlight={parseFloat(homeAccuracy) > parseFloat(awayAccuracy)}
          awayHighlight={parseFloat(awayAccuracy) > parseFloat(homeAccuracy)}
        />

        <StatRow
          icon={Save}
          label="Defesas"
          homeValue={homeStats.saves}
          awayValue={awayStats.saves}
          homeHighlight={homeStats.saves > awayStats.saves}
          awayHighlight={awayStats.saves > homeStats.saves}
        />

        <StatRow
          icon={Slash}
          label="Turnovers"
          homeValue={homeStats.turnovers}
          awayValue={awayStats.turnovers}
          homeHighlight={homeStats.turnovers < awayStats.turnovers}
          awayHighlight={awayStats.turnovers < homeStats.turnovers}
        />

        <StatRow
          icon={Shield}
          label="Faltas"
          homeValue={homeStats.fouls}
          awayValue={awayStats.fouls}
        />

        {/* 7 Metros */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center">
            7 METROS
          </div>
          <StatRow
            icon={Target}
            label="Cobranças"
            homeValue={`${homeStats.sevenMeters.conversions}/${homeStats.sevenMeters.attempts}`}
            awayValue={`${awayStats.sevenMeters.conversions}/${awayStats.sevenMeters.attempts}`}
          />
          <StatRow
            icon={TrendingUp}
            label="Conversão"
            homeValue={`${home7mRate}%`}
            awayValue={`${away7mRate}%`}
            homeHighlight={parseInt(home7mRate) > parseInt(away7mRate)}
            awayHighlight={parseInt(away7mRate) > parseInt(home7mRate)}
          />
        </div>
      </div>

      {/* Footer com resumo */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">
              {homeStats.goals + homeStats.shots}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Total Ações
            </div>
          </div>
          <div>
            <div className="font-semibold text-brand-600 dark:text-brand-400">
              {homeStats.goals + awayStats.goals}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Gols Total
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">
              {awayStats.goals + awayStats.shots}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Total Ações
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}