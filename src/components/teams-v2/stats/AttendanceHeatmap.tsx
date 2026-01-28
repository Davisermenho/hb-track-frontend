'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Cross2Icon, DownloadIcon, InfoCircledIcon, CalendarIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceHeatmapProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AttendanceData {
  athleteId: string;
  athleteName: string;
  sessions: Array<{
    date: string;
    dayOfWeek: string;
    present: boolean;
    justified?: boolean;
  }>;
  attendanceRate: number;
  streak: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockAttendanceData = (): AttendanceData[] => {
  const athletes = [
    'João Silva', 'Pedro Santos', 'Lucas Oliveira', 'Gabriel Costa', 
    'Rafael Lima', 'Bruno Souza', 'Mateus Ferreira', 'André Almeida',
    'Felipe Rocha', 'Thiago Martins', 'Gustavo Ribeiro', 'Carlos Pereira'
  ];
  
  const sessions = [
    { date: '02/01', dayOfWeek: 'Qui' },
    { date: '03/01', dayOfWeek: 'Sex' },
    { date: '06/01', dayOfWeek: 'Seg' },
    { date: '07/01', dayOfWeek: 'Ter' },
    { date: '08/01', dayOfWeek: 'Qua' },
    { date: '09/01', dayOfWeek: 'Qui' },
    { date: '10/01', dayOfWeek: 'Sex' },
    { date: '13/01', dayOfWeek: 'Seg' },
  ];
  
  return athletes.map((name, idx) => {
    const sessionsData = sessions.map((s) => ({
      ...s,
      present: Math.random() > 0.15,
      justified: Math.random() > 0.7,
    }));
    
    const presentCount = sessionsData.filter(s => s.present).length;
    
    return {
      athleteId: `athlete-${idx}`,
      athleteName: name,
      sessions: sessionsData,
      attendanceRate: Math.round((presentCount / sessions.length) * 100),
      streak: Math.floor(Math.random() * 8),
    };
  }).sort((a, b) => b.attendanceRate - a.attendanceRate);
};

// ============================================================================
// COMPONENT
// ============================================================================

const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({ teamId, isOpen, onClose }) => {
  const [data, setData] = useState<AttendanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'rate' | 'streak'>('rate');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setTimeout(() => {
        setData(generateMockAttendanceData());
        setIsLoading(false);
      }, 600);
    }
  }, [isOpen, teamId]);

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'name') return a.athleteName.localeCompare(b.athleteName);
    if (sortBy === 'rate') return b.attendanceRate - a.attendanceRate;
    return b.streak - a.streak;
  });

  // Estatísticas gerais
  const avgAttendance = data.length > 0 
    ? Math.round(data.reduce((sum, a) => sum + a.attendanceRate, 0) / data.length)
    : 0;
  
  const chronicAbsences = data.filter(a => a.attendanceRate < 70).length;
  const perfectAttendance = data.filter(a => a.attendanceRate === 100).length;

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                Mapa de Calor de Presença
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Visualização de presença por atleta e sessão de treino
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

          {/* Stats Summary */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{avgAttendance}%</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Média Geral</div>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{perfectAttendance}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">100% Presença</div>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{chronicAbsences}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Absenteísmo &lt;70%</div>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="px-6 pt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">Ordenar por:</span>
            {[
              { key: 'rate', label: 'Taxa' },
              { key: 'name', label: 'Nome' },
              { key: 'streak', label: 'Sequência' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === key
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Heatmap Table */}
          <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 300px)' }}>
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Carregando dados de presença...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10">
                        Atleta
                      </th>
                      {data[0]?.sessions.map((s, idx) => (
                        <th key={idx} className="px-2 py-3 text-center">
                          <div className="text-[10px] font-bold text-slate-900 dark:text-white">{s.date}</div>
                          <div className="text-[9px] text-slate-400">{s.dayOfWeek}</div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Taxa
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Seq.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedData.map((athlete) => (
                      <tr key={athlete.athleteId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-900 z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                              {athlete.athleteName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                              {athlete.athleteName}
                            </span>
                          </div>
                        </td>
                        {athlete.sessions.map((session, idx) => (
                          <td key={idx} className="px-2 py-3 text-center">
                            <div 
                              className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                session.present 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                  : session.justified
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              }`}
                              title={session.present ? 'Presente' : session.justified ? 'Falta justificada' : 'Ausente'}
                            >
                              {session.present ? (
                                <CheckCircledIcon className="w-4 h-4" />
                              ) : (
                                <CrossCircledIcon className="w-4 h-4" />
                              )}
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
                            athlete.attendanceRate >= 90
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : athlete.attendanceRate >= 70
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {athlete.attendanceRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {athlete.streak}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">dias</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-6 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legenda:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircledIcon className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-slate-500">Presente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <CrossCircledIcon className="w-3 h-3 text-amber-600" />
                </div>
                <span className="text-slate-500">Falta justificada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <CrossCircledIcon className="w-3 h-3 text-red-600" />
                </div>
                <span className="text-slate-500">Ausente</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AttendanceHeatmap;
