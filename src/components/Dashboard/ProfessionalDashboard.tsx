'use client';

import { Users, Target, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function ProfessionalDashboard() {
  // Performance Chart Options
  const performanceOptions: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#3b82f6', '#94a3b8'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
        },
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 3,
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      labels: {
        colors: '#6b7280',
      },
    },
    tooltip: {
      theme: 'light',
    },
  };

  const performanceSeries = [
    { name: 'Performance', data: [65, 72, 68, 85, 78, 90, 88] },
    { name: 'Média', data: [60, 65, 62, 70, 68, 72, 70] },
  ];

  const stats = [
    {
      label: 'Total de Gols',
      value: '142',
      change: '+12% vs mês anterior',
      icon: Target,
      positive: true,
    },
    {
      label: 'Atletas Ativas',
      value: '24',
      change: '100% de presença',
      icon: Users,
      positive: true,
    },
    {
      label: 'Performance Média',
      value: '85%',
      change: '+5% vs média liga',
      icon: TrendingUp,
      positive: true,
    },
    {
      label: 'Treinos Semana',
      value: '5',
      change: 'Conforme planejado',
      icon: Activity,
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visão geral do desempenho da equipe
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </p>
                  <p className={cn(
                    'text-xs font-medium',
                    stat.positive ? 'text-success-600 dark:text-success-400' : 'text-gray-500'
                  )}>
                    {stat.change}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Performance Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Performance Semanal
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Comparação com média da liga
              </p>
            </div>
            <Chart
              options={performanceOptions}
              series={performanceSeries}
              type="line"
              height={300}
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Atividades Recentes
            </h2>
            <div className="space-y-4">
              {[
                { type: 'Jogo', title: 'Vitória vs HB Warriors', time: 'Há 2 dias' },
                { type: 'Treino', title: 'Treino Tático', time: 'Há 3 dias' },
                { type: 'Scout', title: 'Análise completa', time: 'Há 5 dias' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activity.type} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Scorers */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Artilheiras
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Maria Santos', goals: 45, number: 10 },
                { name: 'Ana Paula', goals: 38, number: 7 },
                { name: 'Julia Mendes', goals: 32, number: 15 },
              ].map((player, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                      #{player.number}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {player.goals}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Games */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Últimos Jogos
            </h2>
            <div className="space-y-3">
              {[
                { opponent: 'HB Warriors', result: 'V', score: '28-24' },
                { opponent: 'Team Handball', result: 'V', score: '32-26' },
                { opponent: 'Sport Clube', result: 'D', score: '24-27' },
              ].map((game, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                      game.result === 'V'
                        ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                        : 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
                    )}>
                      {game.result}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      vs {game.opponent}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {game.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}