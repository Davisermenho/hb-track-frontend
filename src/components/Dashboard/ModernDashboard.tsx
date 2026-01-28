'use client';

import { motion } from 'framer-motion';
import {
  Lightning,
  Fire,
  Trophy,
  TrendUp,
  Users,
  Target,
  Heart,
  ChartLine,
  Calendar,
  Sparkle,
  Medal,
  Heartbeat,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function ModernDashboard() {
  // Performance Chart
  const performanceOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    colors: ['#3b82f6', '#8b5cf6'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.1,
      },
    },
    xaxis: {
      categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      labels: { style: { colors: '#6b7280', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#6b7280', fontSize: '12px' } },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 3,
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'dark',
    },
  };

  const performanceSeries = [
    { name: 'Performance', data: [65, 72, 68, 85, 78, 90, 88] },
    { name: 'Média da Liga', data: [60, 65, 62, 70, 68, 72, 70] },
  ];

  // Stats data
  const stats = [
    {
      label: 'Gols',
      value: '142',
      change: '+12%',
      trend: 'up',
      icon: Target,
      gradient: 'from-orange-500 to-red-500',
      glow: 'shadow-orange-500/50',
    },
    {
      label: 'Vitórias',
      value: '18',
      change: '+3',
      trend: 'up',
      icon: Trophy,
      gradient: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/50',
    },
    {
      label: 'Atletas Ativas',
      value: '24',
      change: '100%',
      trend: 'stable',
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
    },
    {
      label: 'Wellness Médio',
      value: '8.5',
      change: '+0.3',
      trend: 'up',
      icon: Heart,
      gradient: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/50',
    },
  ];

  const recentGames = [
    { opponent: 'HB Warriors', result: 'W', score: '28-24', date: 'Há 2 dias', highlight: true },
    { opponent: 'Team Handball', result: 'W', score: '32-26', date: 'Há 5 dias', highlight: false },
    { opponent: 'Sport Clube', result: 'L', score: '24-27', date: 'Há 1 semana', highlight: false },
  ];

  const topScorers = [
    { name: 'Maria Santos', goals: 45, photo: null, position: 1 },
    { name: 'Ana Paula', goals: 38, photo: null, position: 2 },
    { name: 'Julia Mendes', goals: 32, photo: null, position: 3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-brand-50/20 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Fire weight="fill" className="w-12 h-12 animate-pulse" />
              <div>
                <h1 className="text-4xl font-bold">
                  Dashboard
                </h1>
                <p className="text-white/90 text-lg mt-1">
                  Visão geral do desempenho da equipe
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative group"
              >
                <div className={cn(
                  'relative overflow-hidden rounded-2xl p-6',
                  'bg-white dark:bg-gray-900',
                  'border border-gray-200 dark:border-gray-800',
                  'shadow-xl hover:shadow-2xl',
                  stat.glow,
                  'transition-all duration-300'
                )}>
                  {/* Gradient overlay */}
                  <div className={cn(
                    'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity',
                    'bg-gradient-to-br',
                    stat.gradient
                  )} />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {stat.label}
                      </p>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {stat.trend === 'up' ? (
                          <TrendUp weight="bold" className="w-4 h-4 text-success-600" />
                        ) : null}
                        <span className={cn(
                          'text-sm font-semibold',
                          stat.trend === 'up' ? 'text-success-600' : 'text-gray-600'
                        )}>
                          {stat.change}
                        </span>
                      </div>
                    </div>

                    <div className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br shadow-lg',
                      stat.gradient,
                      'group-hover:scale-110 transition-transform'
                    )}>
                      <Icon weight="fill" className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChartLine weight="fill" className="w-5 h-5 text-brand-500" />
                  Performance Semanal
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Comparação com média da liga
                </p>
              </div>
              <select className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium">
                <option>Última semana</option>
                <option>Último mês</option>
                <option>Último ano</option>
              </select>
            </div>
            <Chart
              options={performanceOptions}
              series={performanceSeries}
              type="area"
              height={300}
            />
          </motion.div>

          {/* Top Scorers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Medal weight="fill" className="w-5 h-5 text-yellow-500" />
              Top Artilheiras
            </h2>

            <div className="space-y-4">
              {topScorers.map((scorer, index) => (
                <motion.div
                  key={scorer.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Position Badge */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                    index === 0 && 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white',
                    index === 1 && 'bg-gradient-to-br from-gray-400 to-gray-500 text-white',
                    index === 2 && 'bg-gradient-to-br from-orange-600 to-amber-700 text-white'
                  )}>
                    {scorer.position}
                  </div>

                  {/* Photo */}
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {scorer.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {scorer.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {scorer.goals} gols
                    </p>
                  </div>

                  {/* Trend */}
                  <Fire weight="fill" className="w-5 h-5 text-orange-500" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Calendar weight="fill" className="w-5 h-5 text-brand-500" />
            Últimos Jogos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentGames.map((game, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  game.highlight
                    ? 'bg-gradient-to-br from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20 border-success-200 dark:border-success-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    'px-2 py-1 rounded-lg font-bold text-xs',
                    game.result === 'W'
                      ? 'bg-success-500 text-white'
                      : 'bg-error-500 text-white'
                  )}>
                    {game.result === 'W' ? 'VITÓRIA' : 'DERROTA'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {game.date}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  vs {game.opponent}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {game.score}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Novo Scout', icon: Target, href: '/scout/live' },
            { label: 'Wellness', icon: Heart, href: '/wellness' },
            { label: 'Ver Atletas', icon: Users, href: '/atletas-grid' },
            { label: 'Estatísticas', icon: ChartLine, href: '/statistics' },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.a
                key={action.label}
                href={action.href}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 hover:from-brand-500 hover:to-purple-500 border border-gray-200 dark:border-gray-800 hover:border-transparent shadow-lg hover:shadow-2xl transition-all group"
              >
                <Icon weight="fill" className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-white mb-3 transition-colors" />
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-white transition-colors">
                  {action.label}
                </p>
              </motion.a>
            );
          })}
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-brand-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-brand-500/50 transition-all z-50"
      >
        <Sparkle weight="fill" className="w-7 h-7" />
      </motion.button>
    </div>
  );
}