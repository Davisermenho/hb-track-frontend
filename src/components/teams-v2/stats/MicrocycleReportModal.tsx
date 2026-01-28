'use client';

import React, { useState, useEffect } from 'react';
import {
  Cross2Icon, DownloadIcon, FileTextIcon, EnvelopeClosedIcon, CalendarIcon, ClockIcon, PersonIcon,
  TargetIcon, CheckCircledIcon, ExclamationTriangleIcon, ReloadIcon
} from '@radix-ui/react-icons';
import { TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface MicrocycleReportModalProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface MicrocycleReport {
  id: string;
  period: string;
  dateRange: string;
  summary: {
    totalSessions: number;
    avgDuration: number;
    attendanceRate: number;
    wellnessAvg: number;
  };
  focusDistribution: {
    tecnico: number;
    fisico: number;
    tatico: number;
    psicologico: number;
  };
  highlights: Array<{
    type: 'positive' | 'warning' | 'info';
    text: string;
  }>;
  athletes: Array<{
    name: string;
    attendance: number;
    wellness: number;
    loadZone: 'low' | 'ideal' | 'high';
  }>;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockReport = (microcycleId: string): MicrocycleReport => ({
  id: microcycleId,
  period: `Microciclo ${microcycleId}`,
  dateRange: '01/01/2026 - 07/01/2026',
  summary: {
    totalSessions: 5,
    avgDuration: 72,
    attendanceRate: 87,
    wellnessAvg: 74,
  },
  focusDistribution: {
    tecnico: 45,
    fisico: 25,
    tatico: 20,
    psicologico: 10,
  },
  highlights: [
    { type: 'positive', text: 'Frequência acima de 85% mantida' },
    { type: 'warning', text: '2 atletas com queda de wellness' },
    { type: 'info', text: 'Foco técnico predominante conforme planejado' },
  ],
  athletes: [
    { name: 'João Silva', attendance: 100, wellness: 82, loadZone: 'ideal' },
    { name: 'Pedro Santos', attendance: 80, wellness: 65, loadZone: 'high' },
    { name: 'Lucas Oliveira', attendance: 100, wellness: 78, loadZone: 'ideal' },
    { name: 'Gabriel Costa', attendance: 60, wellness: 70, loadZone: 'low' },
  ],
});

// ============================================================================
// COMPONENT
// ============================================================================

const MicrocycleReportModal: React.FC<MicrocycleReportModalProps> = ({
  teamId,
  teamName,
  isOpen,
  onClose,
}) => {
  const [selectedMicrocycle, setSelectedMicrocycle] = useState('1');
  const [report, setReport] = useState<MicrocycleReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const microcycles = [
    { id: '1', label: 'MC 1 (01-07 Jan)', current: true },
    { id: '2', label: 'MC 2 (08-14 Jan)', current: false },
    { id: '3', label: 'MC 3 (15-21 Jan)', current: false },
    { id: '4', label: 'MC 4 (22-28 Jan)', current: false },
  ];

  useEffect(() => {
    if (isOpen && selectedMicrocycle) {
      setIsLoading(true);
      setTimeout(() => {
        setReport(generateMockReport(selectedMicrocycle));
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, selectedMicrocycle]);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    const steps = [
      'Coletando dados...',
      'Gerando gráficos...',
      'Montando relatório...',
      'Finalizando PDF...',
    ];
    
    for (const step of steps) {
      setGenerationStep(step);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setIsGenerating(false);
    setGenerationStep('');
    
    // Simular download
    alert('Relatório gerado com sucesso! (Simulação)');
  };

  const handleSendEmail = async () => {
    setIsGenerating(true);
    setGenerationStep('Enviando por e-mail...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsGenerating(false);
    setGenerationStep('');
    
    alert('E-mail enviado com sucesso! (Simulação)');
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
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FileTextIcon className="w-5 h-5 text-white" />
                </div>
                Relatório de Microciclo
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {teamName} • Relatório detalhado de performance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Cross2Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Microcycle Selector */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Selecione o microciclo:
              </span>
              <div className="flex gap-2">
                {microcycles.map((mc) => (
                  <button
                    key={mc.id}
                    onClick={() => setSelectedMicrocycle(mc.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedMicrocycle === mc.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mc.label}
                    {mc.current && (
                      <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Carregando relatório...</p>
                </div>
              </div>
            ) : report ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                    <CalendarIcon className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {report.summary.totalSessions}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase">Sessões</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                    <ClockIcon className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {report.summary.avgDuration}<span className="text-sm">min</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase">Duração Média</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                    <PersonIcon className="w-5 h-5 mx-auto text-emerald-500 mb-2" />
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {report.summary.attendanceRate}%
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase">Presença</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {report.summary.wellnessAvg}%
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase">Wellness</div>
                  </div>
                </div>

                {/* Focus Distribution */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TargetIcon className="w-4 h-4 text-slate-400" />
                    Distribuição de Foco
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(report.focusDistribution).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{key}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              key === 'tecnico' ? 'bg-blue-500' :
                              key === 'fisico' ? 'bg-emerald-500' :
                              key === 'tatico' ? 'bg-amber-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                    Destaques do Período
                  </h3>
                  <div className="space-y-3">
                    {report.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {highlight.type === 'positive' ? (
                          <CheckCircledIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : highlight.type === 'warning' ? (
                          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        ) : (
                          <TargetIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-400">{highlight.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Athletes Overview */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                    Resumo por Atleta
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700">
                          <th className="text-left py-2">Atleta</th>
                          <th className="text-center py-2">Presença</th>
                          <th className="text-center py-2">Wellness</th>
                          <th className="text-center py-2">Zona de Carga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {report.athletes.map((athlete, idx) => (
                          <tr key={idx}>
                            <td className="py-3 font-medium text-slate-900 dark:text-white">{athlete.name}</td>
                            <td className="py-3 text-center">
                              <span className={`font-bold ${
                                athlete.attendance >= 90 ? 'text-emerald-600' :
                                athlete.attendance >= 70 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {athlete.attendance}%
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`font-bold ${
                                athlete.wellness >= 80 ? 'text-emerald-600' :
                                athlete.wellness >= 60 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {athlete.wellness}%
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                athlete.loadZone === 'ideal'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : athlete.loadZone === 'high'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {athlete.loadZone === 'ideal' ? 'Ideal' : athlete.loadZone === 'high' ? 'Alto' : 'Baixo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Relatório gerado em tempo real com dados até o momento atual.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendEmail}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
              >
                <EnvelopeClosedIcon className="w-4 h-4" />
                Enviar por e-mail
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <ReloadIcon className="w-4 h-4 animate-spin" />
                    {generationStep}
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-4 h-4" />
                    Gerar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MicrocycleReportModal;
