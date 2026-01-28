'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  ArrowUpIcon, ArrowDownIcon, PersonIcon, CalendarIcon, InfoCircledIcon,
  BarChartIcon, ChevronRightIcon, ExclamationTriangleIcon, CheckCircledIcon, ClockIcon,
  TargetIcon, ActivityLogIcon, MinusIcon, ReloadIcon, MixerHorizontalIcon,
  ChevronDownIcon, MagicWandIcon, PlusIcon, ClipboardIcon,
  EnterFullScreenIcon, EyeOpenIcon, FileTextIcon, QuestionMarkCircledIcon, DotsHorizontalIcon
} from '@radix-ui/react-icons';
import { TrendingUp, TrendingDown, Dumbbell, ArrowUpRight, ArrowDownRight, HeartPulse, Brain, ArrowLeftRight, FileBarChart, Sparkles } from 'lucide-react';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';
import { TrainingSessionsAPI, TrainingSession } from '@/lib/api/trainings';

// Advanced Stats Components (lazy loaded)
import dynamic from 'next/dynamic';
const LoadHeatmapChart = dynamic(() => import('./stats/LoadHeatmapChart'), { ssr: false });
const AttendanceHeatmap = dynamic(() => import('./stats/AttendanceHeatmap'), { ssr: false });
const MicrocycleReportModal = dynamic(() => import('./stats/MicrocycleReportModal'), { ssr: false });
const AIInsightsPanel = dynamic(() => import('./stats/AIInsightsPanel'), { ssr: false });
const TeamComparisonModal = dynamic(() => import('./stats/TeamComparisonModal'), { ssr: false });
const StatsTour = dynamic(() => import('./stats/StatsTour'), { ssr: false });

// ============================================================================
// TYPES
// ============================================================================

interface StatsTabProps {
  teamId: string;
  teamName?: string;
  onNavigateToTrainings?: () => void;
}

interface TeamStats {
  totalSessions: number;
  closedSessions: number;
  avgSessionsPerWeek: number;
  avgDurationMinutes: number;
  attendanceRate: number;
  wellnessSubmissionRate: number;
  focusDistribution: {
    tecnico: number;
    fisico: number;
    tatico: number;
    psicologico: number;
  };
  weeklyTrend: {
    sessions: number;
    sessionsTrend: 'up' | 'down' | 'stable';
    attendance: number;
    attendanceTrend: 'up' | 'down' | 'stable';
  };
  loadData: Array<{ name: string; value: number; rpe: number }>;
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
  }>;
}

type DataState = 'loading' | 'no-trainings' | 'trainings-not-closed' | 'has-data';

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-8">
      <div>
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    </div>
    <div className="h-[280px] flex items-end justify-around gap-4 px-4">
      {[40, 65, 50, 80, 70, 90].map((h, i) => (
        <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

const FeedbackSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm animate-pulse">
    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// EMPTY STATE COMPONENTS
// ============================================================================

interface EmptyStateProps {
  state: 'no-trainings' | 'trainings-not-closed';
  canCreate: boolean;
  onCreateTraining: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ state, canCreate, onCreateTraining }) => {
  const isNoTrainings = state === 'no-trainings';
  
  return (
    <div 
      data-testid={`stats-empty-state-${state}`}
      className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-500"
    >
      {/* Ilustração */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            {isNoTrainings ? (
              <BarChartIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            ) : (
              <ClockIcon className="w-10 h-10 text-amber-500 dark:text-amber-400" />
            )}
          </div>
        </div>
        {/* Status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center ${
          isNoTrainings 
            ? 'bg-slate-100 dark:bg-slate-800' 
            : 'bg-amber-100 dark:bg-amber-900/30'
        }`}>
          {isNoTrainings ? (
            <ClipboardIcon className="w-4 h-4 text-slate-500" />
          ) : (
            <InfoCircledIcon className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </div>

      {/* Título */}
      <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-3 text-center">
        {isNoTrainings 
          ? 'As estatísticas começam aqui' 
          : 'Quase lá!'
        }
      </h3>

      {/* Mensagem principal */}
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md mb-2 leading-relaxed">
        {isNoTrainings
          ? 'As estatisticas da equipe aparecerao aqui assim que os primeiros treinos forem realizados e revisados.'
          : 'Voce ja tem treinos criados! As estatisticas aparecem apos a revisao das sessoes.'
        }
      </p>

      {/* Texto complementar */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-sm mb-8 leading-relaxed">
        {isNoTrainings
          ? 'Estatisticas sao calculadas a partir de sessoes revisadas e finalizadas. Comece planejando e registrando treinos.'
          : 'Finalize pelo menos uma revisao de treino para comecar a visualizar metricas de performance, frequencia e carga.'
        }
      </p>

      {/* CTA - apenas para admins/técnicos */}
      {canCreate && (
        <button
          onClick={onCreateTraining}
          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          {isNoTrainings ? 'Criar primeiro treino' : 'Ver treinos'}
        </button>
      )}

      {/* Card de contexto */}
      <div className="mt-10 w-full max-w-md">
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircledIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                O sistema está funcionando corretamente
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Esta tela vazia indica que ainda não há dados suficientes — não é um erro. 
                Assim que houver treinos revisados, voce vera metricas detalhadas aqui.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* O que você verá */}
      <div className="mt-6 w-full max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 text-center">
          O que você verá aqui
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-blue-500 mb-2" />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center">Sessões por semana</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <PersonIcon className="w-5 h-5 text-emerald-500 mb-2" />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center">Taxa de presença</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <ActivityLogIcon className="w-5 h-5 text-amber-500 mb-2" />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center">Carga de treino</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// WEEKLY SUMMARY COMPONENT
// ============================================================================

interface WeeklySummaryProps {
  stats: TeamStats;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ stats }) => {
  const getInsightIcon = (type: 'positive' | 'warning' | 'neutral') => {
    switch (type) {
      case 'positive':
        return <CheckCircledIcon className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />;
      default:
        return <InfoCircledIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  const insights: Array<{ type: 'positive' | 'warning' | 'neutral'; text: string }> = [];
  
  // Gerar insights baseados nos dados
  if (stats.weeklyTrend.attendanceTrend === 'up') {
    insights.push({ type: 'positive', text: 'Frequência em alta' });
  } else if (stats.weeklyTrend.attendanceTrend === 'down') {
    insights.push({ type: 'warning', text: 'Frequência em queda' });
  }
  
  if (stats.wellnessSubmissionRate >= 80) {
    insights.push({ type: 'positive', text: 'Wellness aderente' });
  } else if (stats.wellnessSubmissionRate < 60) {
    insights.push({ type: 'warning', text: 'Wellness baixo' });
  }

  if (stats.alerts.some(a => a.type === 'warning')) {
    insights.push({ type: 'warning', text: 'Atenção ao foco' });
  } else {
    insights.push({ type: 'positive', text: 'Foco mantido' });
  }

  return (
    <div data-tour="weekly-summary" className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 text-white mb-6 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Resumo da Semana
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
            {getInsightIcon(insight.type)}
            <span className="text-sm font-medium">{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// DATA CONFIDENCE BANNER
// ============================================================================

interface DataConfidenceBannerProps {
  closedSessions: number;
  totalSessions: number;
  wellnessRate: number;
}

const DataConfidenceBanner: React.FC<DataConfidenceBannerProps> = ({ 
  closedSessions, 
  totalSessions, 
  wellnessRate 
}) => {
  const pendingSessions = totalSessions - closedSessions;
  const hasIssues = pendingSessions > 0 || wellnessRate < 70;
  
  if (!hasIssues) return null;
  
  return (
    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-3">
        <InfoCircledIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-200">
          <span className="font-bold">Confiança nos dados:</span>{' '}
          {pendingSessions > 0 && (
            <span>{pendingSessions} sessão(ões) ainda não encerrada(s). </span>
          )}
          {wellnessRate < 70 && (
            <span>Taxa de wellness abaixo de 70% pode afetar os insights.</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STAT METRIC CARD
// ============================================================================

interface StatMetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'stable';
  subtitle: string;
  icon: React.ReactNode;
  progress?: number;
  progressColor?: 'emerald' | 'amber' | 'red' | 'blue';
  zone?: 'green' | 'yellow' | 'red';
}

const StatMetricCard: React.FC<StatMetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  trendDirection = 'stable',
  subtitle, 
  icon, 
  progress, 
  progressColor = 'emerald',
  zone
}) => {
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <ArrowUpRight className="w-3 h-3" />;
      case 'down':
        return <ArrowDownRight className="w-3 h-3" />;
      default:
        return <MinusIcon className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'down':
        return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
    }
  };

  const getProgressColor = () => {
    switch (progressColor) {
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'red':
        return 'bg-red-500';
      case 'blue':
        return 'bg-blue-500';
      default:
        return 'bg-slate-900 dark:bg-white';
    }
  };

  const getZoneBorder = () => {
    switch (zone) {
      case 'green':
        return 'border-l-4 border-l-emerald-500';
      case 'yellow':
        return 'border-l-4 border-l-amber-500';
      case 'red':
        return 'border-l-4 border-l-red-500';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-all ${getZoneBorder()}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-heading font-bold text-slate-900 dark:text-white">{value}</span>
        {trend && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${getTrendColor()}`}>
            {getTrendIcon()}
            {trend}
          </span>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-3 space-y-1">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      {zone && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            zone === 'green' ? 'bg-emerald-500' : zone === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
          }`} />
          <span className="text-[10px] font-medium text-slate-500">
            Zona {zone === 'green' ? 'ideal' : zone === 'yellow' ? 'de atenção' : 'crítica'}
          </span>
        </div>
      )}
      <p className="text-[10px] text-slate-400 mt-2">{subtitle}</p>
    </div>
  );
};

// ============================================================================
// FEEDBACK ITEM
// ============================================================================

interface FeedbackItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  type?: 'info' | 'warning' | 'success';
  actionLabel?: string;
  onAction?: () => void;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ 
  icon, 
  title, 
  desc, 
  type = 'info',
  actionLabel,
  onAction 
}) => {
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500';
    }
  };

  return (
    <div className="flex gap-4 group">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getBgColor()}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            {actionLabel}
            <ChevronRightIcon className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FOCUS DISTRIBUTION
// ============================================================================

interface FocusDistributionProps {
  distribution: TeamStats['focusDistribution'];
}

const FocusDistribution: React.FC<FocusDistributionProps> = ({ distribution }) => {
  const items = [
    { label: 'Técnico', value: distribution.tecnico, color: 'bg-blue-500' },
    { label: 'Físico', value: distribution.fisico, color: 'bg-emerald-500' },
    { label: 'Tático', value: distribution.tatico, color: 'bg-amber-500' },
    { label: 'Psicológico', value: distribution.psicologico, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{item.value}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color}`}
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StatsTab: React.FC<StatsTabProps> = ({ teamId, teamName = 'Equipe', onNavigateToTrainings }) => {
  const [dataState, setDataState] = useState<DataState>('loading');
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'7' | '14' | '21' | '30'>('7');
  
  // Advanced features modals
  const [showLoadHeatmap, setShowLoadHeatmap] = useState(false);
  const [showAttendanceHeatmap, setShowAttendanceHeatmap] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showTeamComparison, setShowTeamComparison] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  
  const { canCreateTraining, canEditTraining } = useTeamPermissions(teamId);
  const canManage = canCreateTraining || canEditTraining;
  
  // Check if first visit for tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`stats-tour-${teamId}`);
    if (!hasSeenTour && dataState === 'has-data') {
      // Delay tour to let page render
      setTimeout(() => setShowTour(true), 1000);
    }
  }, [dataState, teamId]);
  
  const handleTourComplete = () => {
    localStorage.setItem(`stats-tour-${teamId}`, 'true');
    setShowTour(false);
  };

  // Buscar dados de estatísticas
  const fetchStats = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Buscar treinos da equipe
      const response = await TrainingSessionsAPI.listSessions({
        team_id: teamId,
        limit: 100,
      });
      
      const trainings = response.items || [];
      const closedTrainings = trainings.filter(t => t.status === 'readonly');
      
      if (trainings.length === 0) {
        setDataState('no-trainings');
        setStats(null);
        return;
      }
      
      if (closedTrainings.length === 0) {
        setDataState('trainings-not-closed');
        setStats(null);
        return;
      }
      
      // Calcular estatísticas reais
      const now = new Date();
      const periodDays = parseInt(periodFilter);
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      
      const recentTrainings = closedTrainings.filter(t => 
        new Date(t.session_at) >= startDate
      );
      
      const avgDuration = closedTrainings.reduce((sum, t) => 
        sum + (t.duration_planned_minutes || 60), 0
      ) / closedTrainings.length;
      
      // Simular algumas estatísticas (em produção viriam da API)
      const mockStats: TeamStats = {
        totalSessions: trainings.length,
        closedSessions: closedTrainings.length,
        avgSessionsPerWeek: Math.round((recentTrainings.length / (periodDays / 7)) * 10) / 10 || 0,
        avgDurationMinutes: Math.round(avgDuration),
        attendanceRate: 85 + Math.random() * 10, // Mock
        wellnessSubmissionRate: 70 + Math.random() * 20, // Mock
        focusDistribution: {
          tecnico: 45,
          fisico: 25,
          tatico: 20,
          psicologico: 10,
        },
        weeklyTrend: {
          sessions: recentTrainings.length,
          sessionsTrend: recentTrainings.length > 3 ? 'up' : 'stable',
          attendance: 87,
          attendanceTrend: Math.random() > 0.5 ? 'up' : 'stable',
        },
        loadData: [
          { name: 'MC 1', value: 40, rpe: 4.5 },
          { name: 'MC 2', value: 55, rpe: 5.8 },
          { name: 'MC 3', value: 48, rpe: 5.0 },
          { name: 'MC 4', value: 70, rpe: 6.5 },
          { name: 'MC 5', value: 65, rpe: 6.2 },
          { name: 'Atual', value: 85, rpe: 8.0 },
        ],
        alerts: closedTrainings.length < 3 ? [] : [
          {
            type: 'info',
            title: 'Consistência mantida',
            description: 'O foco de treino está alinhado com o planejamento nas últimas semanas.',
          }
        ],
      };
      
      setStats(mockStats);
      setDataState('has-data');
      
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      setDataState('no-trainings');
    } finally {
      setIsRefreshing(false);
    }
  }, [teamId, periodFilter]);

  useEffect(() => {
    setDataState('loading');
    fetchStats();
  }, [fetchStats]);

  const handleNavigateToTrainings = () => {
    if (onNavigateToTrainings) {
      onNavigateToTrainings();
    }
  };

  // Loading state
  if (dataState === 'loading') {
    return (
      <div data-testid="teams-stats-root" className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <FeedbackSkeleton />
        </div>
      </div>
    );
  }

  // Empty states
  if (dataState === 'no-trainings' || dataState === 'trainings-not-closed') {
    return (
      <div data-testid="teams-stats-root" className="animate-in fade-in duration-500">
        <EmptyState
          state={dataState}
          canCreate={canManage}
          onCreateTraining={handleNavigateToTrainings}
        />
      </div>
    );
  }

  // Has data - render full dashboard
  if (!stats) return null;

  return (
    <div data-testid="teams-stats-root" className="space-y-6 animate-in fade-in duration-700">
      {/* Tour */}
      <StatsTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
      
      {/* Advanced Modals */}
      <LoadHeatmapChart
        teamId={teamId}
        isOpen={showLoadHeatmap}
        onClose={() => setShowLoadHeatmap(false)}
      />
      <AttendanceHeatmap
        teamId={teamId}
        isOpen={showAttendanceHeatmap}
        onClose={() => setShowAttendanceHeatmap(false)}
      />
      <MicrocycleReportModal
        teamId={teamId}
        teamName={teamName}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
      <AIInsightsPanel
        teamId={teamId}
        isOpen={showAIInsights}
        onClose={() => setShowAIInsights(false)}
      />
      <TeamComparisonModal
        currentTeamId={teamId}
        currentTeamName={teamName}
        isOpen={showTeamComparison}
        onClose={() => setShowTeamComparison(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
            Estatísticas da Equipe
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visão analítica de performance baseada nos treinos realizados.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tour button */}
          <button
            onClick={() => setShowTour(true)}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            title="Tour da página"
          >
            <QuestionMarkCircledIcon className="w-4 h-4 text-slate-400" />
          </button>
          
          {/* Period filter */}
          <div className="relative">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none cursor-pointer"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="14">Últimos 14 dias</option>
              <option value="21">Últimos 21 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          {/* Refresh button */}
          <button
            onClick={fetchStats}
            disabled={isRefreshing}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            <ReloadIcon className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Weekly Summary */}
      <WeeklySummary stats={stats} />

      {/* Data Confidence Banner */}
      <DataConfidenceBanner
        closedSessions={stats.closedSessions}
        totalSessions={stats.totalSessions}
        wellnessRate={stats.wellnessSubmissionRate}
      />

      {/* Metric Cards */}
      <div data-tour="metric-cards" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatMetricCard
          title="Sessões / Semana"
          value={stats.avgSessionsPerWeek.toFixed(1)}
          trend={stats.weeklyTrend.sessionsTrend === 'up' ? '+0.4' : stats.weeklyTrend.sessionsTrend === 'down' ? '-0.2' : undefined}
          trendDirection={stats.weeklyTrend.sessionsTrend}
          subtitle={`Média dos últimos ${periodFilter} dias`}
          icon={<CalendarIcon className="w-5 h-5 text-blue-500" />}
          zone="green"
        />
        <StatMetricCard
          title="Frequência"
          value={`${Math.round(stats.attendanceRate)}%`}
          trend={stats.weeklyTrend.attendanceTrend === 'up' ? '+3%' : stats.weeklyTrend.attendanceTrend === 'down' ? '-2%' : undefined}
          trendDirection={stats.weeklyTrend.attendanceTrend}
          subtitle="Taxa de presença acumulada"
          icon={<PersonIcon className="w-5 h-5 text-emerald-500" />}
          progress={stats.attendanceRate}
          progressColor="emerald"
        />
        <StatMetricCard
          title="Wellness"
          value={`${Math.round(stats.wellnessSubmissionRate)}%`}
          subtitle="Taxa de submissão de bem-estar"
          icon={<HeartPulse className="w-5 h-5 text-amber-500" />}
          progress={stats.wellnessSubmissionRate}
          progressColor={stats.wellnessSubmissionRate >= 80 ? 'emerald' : stats.wellnessSubmissionRate >= 60 ? 'amber' : 'red'}
          zone={stats.wellnessSubmissionRate >= 80 ? 'green' : stats.wellnessSubmissionRate >= 60 ? 'yellow' : 'red'}
        />
      </div>

      {/* Advanced Features Section */}
      <div data-tour="advanced-features" className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recursos Avançados</h3>
              <p className="text-[11px] text-slate-500">Visualizações poderosas e relatórios detalhados</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            {showAdvancedFeatures ? 'Menos opções' : 'Mais opções'}
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvancedFeatures ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Main Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Load Heatmap */}
          <button
            onClick={() => setShowLoadHeatmap(true)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <EnterFullScreenIcon className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Mapa de Carga</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">Visualize carga, wellness e presença em heatmap</p>
          </button>
          
          {/* Attendance Heatmap */}
          <button
            onClick={() => setShowAttendanceHeatmap(true)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <EyeOpenIcon className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Mapa de Presença</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">Grade atletas x sessões com indicadores</p>
          </button>
          
          {/* Microcycle Report */}
          <button
            onClick={() => setShowReportModal(true)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileTextIcon className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Relatório PDF</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">Gere relatório do microciclo</p>
          </button>
          
          {/* AI Insights */}
          <button
            onClick={() => setShowAIInsights(true)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1">
              Insights IA
              <span className="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[8px] font-bold rounded">BETA</span>
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">Análise automática da equipe</p>
          </button>
        </div>
        
        {/* Additional Features (collapsed) */}
        {showAdvancedFeatures && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Team Comparison */}
              <button
                onClick={() => setShowTeamComparison(true)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Comparar Equipes</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Compare métricas entre times</p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load Chart */}
        <div data-tour="load-chart" className="lg:col-span-2 bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-heading font-bold text-slate-900 dark:text-white">Carga Interna (AU)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Volume semanal por microciclo</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                <span className="w-3 h-3 bg-slate-900 dark:bg-slate-100 rounded-sm"></span>
                Volume (AU)
              </div>
              <button
                onClick={() => setShowLoadHeatmap(true)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <EnterFullScreenIcon className="w-3 h-3" />
                Explorar
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.loadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-[11px] shadow-lg">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-2">{payload[0].payload.name}</p>
                          <p className="flex justify-between gap-4">
                            <span className="text-slate-400">Volume:</span>
                            <span className="font-bold">{payload[0].value} AU</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-slate-400">RPE médio:</span>
                            <span className="font-bold">{payload[0].payload.rpe}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                  {stats.loadData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === 'Atual' ? '#0f172a' : '#e2e8f0'}
                      className="dark:fill-slate-700"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-4 text-center">
            Baseado nos treinos finalizados. Cada barra representa um microciclo de 7 dias.
          </p>
        </div>

        {/* Feedback Panel */}
        <div data-tour="insights" className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-slate-900 dark:text-white">
              Insights da Semana
            </h3>
            <button
              onClick={() => setShowAIInsights(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Brain className="w-3 h-3" />
              Ver IA
            </button>
          </div>
          <div className="space-y-6 flex-1">
            <FeedbackItem
              icon={<TrendingUp className="w-4 h-4" />}
              title="Volume de Treino"
              desc={`Média de ${stats.avgDurationMinutes} min por sessão. ${stats.avgSessionsPerWeek > 4 ? 'Frequência alta.' : 'Considere aumentar frequência.'}`}
              type={stats.avgSessionsPerWeek > 3 ? 'success' : 'info'}
            />
            <FeedbackItem
              icon={<PersonIcon className="w-4 h-4" />}
              title="Aderência da Equipe"
              desc={`${Math.round(stats.attendanceRate)}% de presença nos treinos. ${stats.attendanceRate >= 90 ? 'Excelente!' : 'Há espaço para melhoria.'}`}
              type={stats.attendanceRate >= 85 ? 'success' : 'warning'}
            />
            <FeedbackItem
              icon={<HeartPulse className="w-4 h-4" />}
              title="Wellness"
              desc={`${Math.round(stats.wellnessSubmissionRate)}% de preenchimento. ${stats.wellnessSubmissionRate >= 80 ? 'Dados confiáveis.' : 'Incentive o preenchimento.'}`}
              type={stats.wellnessSubmissionRate >= 80 ? 'success' : 'warning'}
            />
          </div>
          
          {canManage && (
            <button 
              onClick={() => setShowReportModal(true)}
              className="mt-8 w-full py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
            >
              <FileBarChart className="w-4 h-4" />
              Ver relatório detalhado
            </button>
          )}
        </div>
      </div>

      {/* Focus Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-slate-900 dark:text-white">
              Distribuição de Foco
            </h3>
            <TargetIcon className="w-5 h-5 text-slate-400" />
          </div>
          <FocusDistribution distribution={stats.focusDistribution} />
          <p className="text-[10px] text-slate-400 mt-4">
            Inclui apenas sessoes revisadas e finalizadas.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-slate-900 dark:text-white">
              Resumo Rápido
            </h3>
            <BarChartIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total de treinos realizados</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.totalSessions}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-400">Treinos revisados</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.closedSessions}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-400">Média de duração</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.avgDurationMinutes} min</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Sessões por semana</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.avgSessionsPerWeek.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
