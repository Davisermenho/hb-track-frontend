'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Cross2Icon, DownloadIcon, PersonIcon, TargetIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { ArrowLeftRight, TrendingUp, Activity, Users, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ============================================================================
// TYPES
// ============================================================================

interface TeamComparisonModalProps {
  currentTeamId: string;
  currentTeamName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TeamMetrics {
  id: string;
  name: string;
  avgLoad: number;
  attendanceRate: number;
  wellnessRate: number;
  focusDistribution: {
    tecnico: number;
    fisico: number;
    tatico: number;
    psicologico: number;
  };
  sessionsPerWeek: number;
  avgDuration: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTeams: TeamMetrics[] = [
  {
    id: 'team-1',
    name: 'Sub-17 Masculino',
    avgLoad: 72,
    attendanceRate: 87,
    wellnessRate: 78,
    focusDistribution: { tecnico: 45, fisico: 25, tatico: 20, psicologico: 10 },
    sessionsPerWeek: 4.5,
    avgDuration: 75,
  },
  {
    id: 'team-2',
    name: 'Sub-20 Masculino',
    avgLoad: 85,
    attendanceRate: 92,
    wellnessRate: 72,
    focusDistribution: { tecnico: 35, fisico: 35, tatico: 25, psicologico: 5 },
    sessionsPerWeek: 5.2,
    avgDuration: 90,
  },
  {
    id: 'team-3',
    name: 'Sub-15 Feminino',
    avgLoad: 65,
    attendanceRate: 78,
    wellnessRate: 82,
    focusDistribution: { tecnico: 50, fisico: 20, tatico: 15, psicologico: 15 },
    sessionsPerWeek: 3.8,
    avgDuration: 60,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const TeamComparisonModal: React.FC<TeamComparisonModalProps> = ({
  currentTeamId,
  currentTeamName,
  isOpen,
  onClose,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<TeamMetrics[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Simular carregamento de times disponíveis
      setTeams(mockTeams);
      if (mockTeams.length > 0 && !selectedTeamId) {
        const otherTeam = mockTeams.find(t => t.id !== currentTeamId);
        if (otherTeam) setSelectedTeamId(otherTeam.id);
      }
    }
  }, [isOpen, currentTeamId]);

  const currentTeam = teams.find(t => t.name === currentTeamName) || teams[0];
  const comparisonTeam = teams.find(t => t.id === selectedTeamId);

  // Radar chart data
  const radarSeries = currentTeam && comparisonTeam ? [
    {
      name: currentTeam.name,
      data: [
        currentTeam.avgLoad,
        currentTeam.attendanceRate,
        currentTeam.wellnessRate,
        currentTeam.sessionsPerWeek * 20,
        currentTeam.avgDuration,
      ],
    },
    {
      name: comparisonTeam.name,
      data: [
        comparisonTeam.avgLoad,
        comparisonTeam.attendanceRate,
        comparisonTeam.wellnessRate,
        comparisonTeam.sessionsPerWeek * 20,
        comparisonTeam.avgDuration,
      ],
    },
  ] : [];

  const radarOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'radar',
      toolbar: { show: false },
      background: 'transparent',
    },
    colors: ['#0f172a', '#3b82f6'],
    xaxis: {
      categories: ['Carga', 'Presença', 'Wellness', 'Frequência', 'Duração'],
      labels: {
        style: {
          colors: ['#64748b', '#64748b', '#64748b', '#64748b', '#64748b'],
          fontSize: '11px',
          fontWeight: 600,
        },
      },
    },
    yaxis: { show: false },
    stroke: { width: 2 },
    fill: { opacity: 0.2 },
    markers: { size: 4 },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontWeight: 600,
      markers: { strokeWidth: 0 },
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#e2e8f0',
          connectorColors: '#e2e8f0',
        },
      },
    },
  };

  const getComparisonValue = (current: number, comparison: number) => {
    const diff = current - comparison;
    if (Math.abs(diff) < 2) return { text: 'Similar', color: 'text-slate-500', bg: 'bg-slate-100' };
    if (diff > 0) return { text: `+${diff.toFixed(0)}%`, color: 'text-emerald-700', bg: 'bg-emerald-100' };
    return { text: `${diff.toFixed(0)}%`, color: 'text-red-700', bg: 'bg-red-100' };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                </div>
                Comparar Equipes
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Compare métricas de performance entre equipes
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Cross2Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Team Selector */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              {/* Current Team */}
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Equipe Atual</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{currentTeamName}</p>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-slate-500" />
              </div>
              
              {/* Comparison Team Selector */}
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Comparar com</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {teams.filter(t => t.name !== currentTeamName).map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Content */}
          <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 260px)' }}>
            {currentTeam && comparisonTeam ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Comparação Geral</h3>
                  <ReactApexChart
                    options={radarOptions}
                    series={radarSeries}
                    type="radar"
                    height={350}
                  />
                </div>

                {/* Metrics Comparison */}
                <div className="space-y-4">
                  {/* Metric Cards */}
                  {[
                    { label: 'Carga Média', current: currentTeam.avgLoad, comparison: comparisonTeam.avgLoad, icon: Activity, unit: '%' },
                    { label: 'Presença', current: currentTeam.attendanceRate, comparison: comparisonTeam.attendanceRate, icon: Users, unit: '%' },
                    { label: 'Wellness', current: currentTeam.wellnessRate, comparison: comparisonTeam.wellnessRate, icon: TrendingUp, unit: '%' },
                    { label: 'Sessões/Semana', current: currentTeam.sessionsPerWeek, comparison: comparisonTeam.sessionsPerWeek, icon: Target, unit: '' },
                  ].map((metric) => {
                    const comp = getComparisonValue(metric.current, metric.comparison);
                    return (
                      <div key={metric.label} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <metric.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{metric.label}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${comp.bg} ${comp.color}`}>
                            {comp.text}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] text-slate-400 mb-1">{currentTeam.name}</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              {typeof metric.current === 'number' ? metric.current.toFixed(metric.unit ? 0 : 1) : metric.current}
                              <span className="text-sm text-slate-400">{metric.unit}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 mb-1">{comparisonTeam.name}</div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {typeof metric.comparison === 'number' ? metric.comparison.toFixed(metric.unit ? 0 : 1) : metric.comparison}
                              <span className="text-sm text-slate-400">{metric.unit}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Focus Distribution Comparison */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TargetIcon className="w-4 h-4 text-slate-400" />
                    Distribuição de Foco Comparada
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Current Team Focus */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-3">{currentTeam.name}</p>
                      {Object.entries(currentTeam.focusDistribution).map(([key, value]) => (
                        <div key={key} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 capitalize">{key}</span>
                            <span className="font-bold text-slate-900">{value}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Comparison Team Focus */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-3">{comparisonTeam.name}</p>
                      {Object.entries(comparisonTeam.focusDistribution).map(([key, value]) => (
                        <div key={key} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 capitalize">{key}</span>
                            <span className="font-bold text-blue-600">{value}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-sm text-slate-500">Selecione uma equipe para comparar</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Dados baseados nos últimos 30 dias de atividade.
            </p>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors">
              <DownloadIcon className="w-4 h-4" />
              Exportar comparação
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TeamComparisonModal;
