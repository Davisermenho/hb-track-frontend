'use client';

import React, { useState, useEffect } from 'react';
import { Cross2Icon, ExclamationTriangleIcon, CheckCircledIcon, LightningBoltIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Sparkles, TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface AIInsightsPanelProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'suggestion' | 'trend';
  title: string;
  description: string;
  metric?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  confidence: number; // 0-100
}

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockInsights = (): Insight[] => [
  {
    id: '1',
    type: 'positive',
    title: 'Consistência mantida',
    description: 'A equipe apresentou bom nível de consistência nas últimas 3 semanas, com frequência acima de 85% e wellness estável.',
    metric: '+12% vs período anterior',
    confidence: 92,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Queda de wellness detectada',
    description: '3 atletas da base apresentaram queda no índice de wellness nas últimas 2 sessões. Considere ajustar a carga ou verificar fatores externos.',
    metric: 'Wellness médio: 68%',
    action: {
      label: 'Ver atletas afetados',
      onClick: () => alert('Navegar para atletas'),
    },
    confidence: 87,
  },
  {
    id: '3',
    type: 'suggestion',
    title: 'Sugestão de foco',
    description: 'Com base no histórico e na fase atual do planejamento, recomendamos priorizar trabalho técnico esta semana para manter o equilíbrio de desenvolvimento.',
    action: {
      label: 'Aplicar sugestão ao plano',
      onClick: () => alert('Aplicar ao planejamento'),
    },
    confidence: 78,
  },
  {
    id: '4',
    type: 'trend',
    title: 'Tendência de melhora',
    description: 'A taxa de presença aumentou 8% nas últimas 2 semanas. Continue monitorando para consolidar o padrão.',
    metric: 'Presença: 91%',
    confidence: 95,
  },
  {
    id: '5',
    type: 'warning',
    title: 'Desvio de planejamento',
    description: 'O foco tático ficou 15% abaixo do planejado no último microciclo. Isso pode impactar a preparação para jogos futuros.',
    action: {
      label: 'Revisar planejamento',
      onClick: () => alert('Abrir planejamento'),
    },
    confidence: 84,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ teamId, isOpen, onClose }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'warning' | 'suggestion'>('all');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setTimeout(() => {
        setInsights(generateMockInsights());
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, teamId]);

  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(i => i.type === filter || (filter === 'warning' && i.type === 'trend'));

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircledIcon className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case 'suggestion':
        return <LightningBoltIcon className="w-5 h-5 text-blue-500" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <Brain className="w-5 h-5 text-slate-500" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'suggestion':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'trend':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
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
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  Insights com IA
                  <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wide">
                    Beta
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Análise automática dos dados da equipe
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Cross2Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'Todos', count: insights.length },
                { key: 'positive', label: 'Positivos', count: insights.filter(i => i.type === 'positive').length },
                { key: 'warning', label: 'Alertas', count: insights.filter(i => i.type === 'warning' || i.type === 'trend').length },
                { key: 'suggestion', label: 'Sugestões', count: insights.filter(i => i.type === 'suggestion').length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  data-tour={key === 'suggestion' ? 'auto-suggestions' : undefined}
                  onClick={() => setFilter(key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    filter === key
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    filter === key
                      ? 'bg-white/20 dark:bg-black/20'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 py-4">
                  <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
                  <span className="text-sm text-slate-500">Analisando dados da equipe...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInsights.map((insight, idx) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`rounded-xl border p-5 ${getInsightBg(insight.type)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {insight.title}
                          </h3>
                          <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                            {insight.confidence}% confiança
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          {insight.metric && (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded">
                              {insight.metric}
                            </span>
                          )}
                          {insight.action && (
                            <button
                              onClick={insight.action.onClick}
                              className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              {insight.action.label}
                              <ChevronRightIcon className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                Insights gerados automaticamente com base nos dados dos últimos 30 dias.
              </p>
              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Powered by HBTrack AI
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIInsightsPanel;
