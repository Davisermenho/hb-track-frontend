'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Cross2Icon, EnterFullScreenIcon, DownloadIcon, InfoCircledIcon, PersonIcon, CalendarIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic import para ApexCharts (evita SSR issues)
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ============================================================================
// TYPES
// ============================================================================

interface AthleteLoadData {
  athleteId: string;
  athleteName: string;
  microcycles: Array<{
    name: string;
    load: number; // 0-100 normalizado
    wellness: number; // 0-100
    attendance: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
}

interface LoadHeatmapChartProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// MOCK DATA (Em produção, viria da API)
// ============================================================================

const generateMockData = (): AthleteLoadData[] => {
  const athletes = [
    'João Silva', 'Pedro Santos', 'Lucas Oliveira', 'Gabriel Costa', 
    'Rafael Lima', 'Bruno Souza', 'Mateus Ferreira', 'André Almeida',
    'Felipe Rocha', 'Thiago Martins', 'Gustavo Ribeiro', 'Carlos Pereira'
  ];
  
  const microcycles = ['MC1', 'MC2', 'MC3', 'MC4', 'MC5', 'MC6'];
  
  return athletes.map((name, idx) => ({
    athleteId: `athlete-${idx}`,
    athleteName: name,
    microcycles: microcycles.map((mc) => ({
      name: mc,
      load: Math.floor(Math.random() * 60) + 40,
      wellness: Math.floor(Math.random() * 40) + 60,
      attendance: Math.random() > 0.15,
      riskLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low',
    })),
  }));
};

// ============================================================================
// COMPONENT
// ============================================================================

const LoadHeatmapChart: React.FC<LoadHeatmapChartProps> = ({ teamId, isOpen, onClose }) => {
  const data = useMemo(() => (isOpen ? generateMockData() : []), [isOpen, teamId]);
  const isLoading = false;
  const [viewMode, setViewMode] = useState<'load' | 'wellness' | 'attendance'>('load');

  const getColorForValue = (value: number, mode: string) => {
    if (mode === 'attendance') {
      return value ? '#10b981' : '#ef4444';
    }
    
    // Gradiente de cor baseado no valor
    if (value >= 80) return '#ef4444'; // Vermelho - alto risco
    if (value >= 60) return '#f59e0b'; // Amarelo - atenção
    if (value >= 40) return '#10b981'; // Verde - ideal
    return '#3b82f6'; // Azul - baixo
  };

  // Preparar dados para o heatmap
  const heatmapSeries = data.map((athlete) => ({
    name: athlete.athleteName,
    data: athlete.microcycles.map((mc) => ({
      x: mc.name,
      y: viewMode === 'load' ? mc.load : viewMode === 'wellness' ? mc.wellness : (mc.attendance ? 100 : 0),
    })),
  }));

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'heatmap',
      toolbar: { show: false },
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 500,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff'],
        fontSize: '11px',
        fontWeight: 600,
      },
      formatter: (val: number) => viewMode === 'attendance' ? (val === 100 ? '✓' : '✗') : `${val}`,
    },
    colors: ['#0f172a'],
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: viewMode === 'attendance' ? [
            { from: 0, to: 50, color: '#ef4444', name: 'Ausente' },
            { from: 51, to: 100, color: '#10b981', name: 'Presente' },
          ] : [
            { from: 0, to: 40, color: '#3b82f6', name: 'Baixo' },
            { from: 41, to: 60, color: '#10b981', name: 'Ideal' },
            { from: 61, to: 80, color: '#f59e0b', name: 'Atenção' },
            { from: 81, to: 100, color: '#ef4444', name: 'Alto' },
          ],
        },
      },
    },
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
        },
        maxWidth: 120,
      },
    },
    grid: {
      padding: { left: 0, right: 0 },
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex }) => {
        const athlete = data[seriesIndex];
        const mc = athlete?.microcycles[dataPointIndex];
        if (!mc) return '';
        
        return `
          <div class="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs">
            <p class="font-bold text-sm mb-2">${athlete.athleteName}</p>
            <p class="text-slate-400 mb-2">${mc.name}</p>
            <div class="space-y-1">
              <p>Carga: <span class="font-bold">${mc.load}%</span></p>
              <p>Wellness: <span class="font-bold">${mc.wellness}%</span></p>
              <p>Presença: <span class="font-bold">${mc.attendance ? 'Sim' : 'Não'}</span></p>
              ${mc.riskLevel === 'high' ? '<p class="text-red-400 font-bold mt-1">⚠️ Risco elevado</p>' : ''}
            </div>
          </div>
        `;
      },
    },
    theme: {
      mode: 'light',
    },
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
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <EnterFullScreenIcon className="w-5 h-5 text-white" />
                </div>
                Mapa de Carga Integrada
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Visualização 3D de carga, wellness e presença por atleta e microciclo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <DownloadIcon className="w-4 h-4" />
                Exportar
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="px-6 pt-4 flex items-center gap-2">
            {[
              { key: 'load', label: 'Carga', icon: Activity },
              { key: 'wellness', label: 'Wellness', icon: HeartPulse },
              { key: 'attendance', label: 'Presença', icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === key
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="px-6 pt-4 flex items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legenda:</span>
            {viewMode === 'attendance' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-[10px] text-slate-500">Presente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-[10px] text-slate-500">Ausente</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-[10px] text-slate-500">Baixo (0-40)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-[10px] text-slate-500">Ideal (40-60)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-[10px] text-slate-500">Atenção (60-80)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-[10px] text-slate-500">Alto (80+)</span>
                </div>
              </>
            )}
          </div>

          {/* Chart */}
          <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
            {isLoading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Carregando mapa de carga...</p>
                </div>
              </div>
            ) : (
              <div className="min-h-[500px]">
                <ReactApexChart
                  options={chartOptions}
                  series={heatmapSeries}
                  type="heatmap"
                  height={Math.max(400, data.length * 40)}
                />
              </div>
            )}
          </div>

          {/* Footer with insights */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <InfoCircledIcon className="w-4 h-4" />
              <span>
                Clique em qualquer célula para ver detalhes. Dados baseados nos últimos 6 microciclos.
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Importar HeartPulse e Activity que faltaram
import { HeartPulse, Activity, Users } from 'lucide-react';

export default LoadHeatmapChart;
