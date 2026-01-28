/**
 * Dashboard Content - Componente Cliente Otimizado
 * Versão Clean com UX melhorada
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useDashboard, DashboardTrainingSession, DashboardTrainingTrend } from '@/lib/hooks/useDashboard';
import TrainingPerformanceChart from '@/components/charts/TrainingPerformanceChart';
import WellnessRadar from '@/components/Dashboard/WellnessRadar';
import MedicalSummary from '@/components/Dashboard/MedicalSummary';
import RecentTrainings from '@/components/Dashboard/RecentTrainings';
import WeeklyHeader from '@/components/Dashboard/WeeklyHeader';
import AthleteKPIs from '@/components/Dashboard/AthleteKPIs';
import { DashboardSkeleton } from '@/components/Dashboard/DashboardSkeleton';

interface DashboardContentProps {
  teamId?: string;
  seasonId?: string;
}

export default function DashboardContent({ teamId, seasonId }: DashboardContentProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    forceRefresh,
  } = useDashboard({ teamId, seasonId });

  if (isLoading && !data) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center min-h-[500px]"
      >
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          {/* Logo */}
          <div className="relative w-20 h-20 animate-pulse">
            <Image
              src="/images/logo/logo-icon.svg"
              alt="HB Track"
              fill
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/images/logo/logo-icon-dark.svg"
              alt="HB Track"
              fill
              className="object-contain hidden dark:block"
              priority
            />
          </div>
          
          {/* Texto animado */}
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Carregando dashboard...
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preparando dados analíticos
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="w-64 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-900 dark:bg-slate-100 rounded-full"
              style={{
                animation: 'loading-bar 1.5s ease-in-out infinite'
              }}
            ></div>
          </div>
        </div>

        {/* Animação da barra de progresso */}
        <style jsx>{`
          @keyframes loading-bar {
            0% {
              width: 0%;
              margin-left: 0%;
            }
            50% {
              width: 70%;
              margin-left: 15%;
            }
            100% {
              width: 0%;
              margin-left: 100%;
            }
          }
        `}</style>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">
            {error?.message || 'Erro ao carregar dashboard'}
          </p>
          <button
            onClick={() => forceRefresh()}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200"
          >
            Tentar novamente
          </button>
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Nenhum dado disponível para exibir.</p>
      </motion.div>
    );
  }

  const { athletes, training, training_trends, wellness, medical, next_training, next_match } = data;

  const nextTrainingData = next_training?.session_at ? {
    date: new Date(next_training.session_at).toISOString().split('T')[0],
    time: new Date(next_training.session_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    type: next_training.main_objective || 'Treino',
  } : { date: '-', time: '-', type: 'Não agendado' };

  const nextMatchData = next_match?.match_at ? {
    opponent: next_match.opponent_name || 'A definir',
    date: new Date(next_match.match_at).toISOString().split('T')[0],
    time: new Date(next_match.match_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    location: next_match.location || 'A definir',
    isHome: next_match.is_home ?? true,
  } : { opponent: 'A definir', date: '-', time: '-', location: 'A definir', isHome: true };

  const wellnessData = wellness ? {
    avg_sleep_quality: wellness.avg_sleep_quality,
    avg_fatigue: wellness.avg_fatigue,
    avg_stress: wellness.avg_stress,
    avg_mood: wellness.avg_mood,
    avg_soreness: wellness.avg_soreness,
    readiness_score: wellness.readiness_score,
    athletes_reported: wellness.athletes_reported,
  } : null;

  const medicalData = medical ? {
    active_cases: medical.active_cases,
    recovering: medical.recovering,
    cleared_this_week: medical.cleared_this_week,
    avg_days_out: medical.avg_days_out,
  } : null;

  const trainingData = training.recent_sessions.map((s: DashboardTrainingSession) => ({
    session_id: s.session_id,
    session_at: s.session_at,
    main_objective: s.main_objective,
    team_name: s.team_name,
    attendance_rate: s.attendance_rate,
    avg_internal_load: s.avg_internal_load,
    presentes: s.presentes,
    total_athletes: s.total_athletes,
  }));

  const trendsData = training_trends.map((t: DashboardTrainingTrend) => ({
    period: (t.period_label.toLowerCase().includes('semana') ? 'week' : 'month') as 'week' | 'month',
    period_start: t.period_start,
    period_end: t.period_start,
    period_label: t.period_label,
    sessions_count: t.sessions_count,
    avg_attendance: t.avg_attendance,
    avg_attendance_rate: t.avg_attendance,
    avg_load: t.avg_load,
    avg_internal_load: t.avg_load,
    total_athletes: 0,
    total_present: 0,
    avg_fatigue: 0,
    avg_mood: 0,
  }));

  const athleteStats = {
    total: athletes.total,
    ativas: athletes.ativas,
    lesionadas: athletes.lesionadas,
    dispensadas: athletes.dispensadas,
    dm: athletes.dm,
    em_captacao: 0,
    suspensas: 0,
    arquivadas: 0,
    com_restricao_medica: athletes.dm || 0,
    carga_restrita: 0,
    por_categoria: {} as Record<string, number>,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      {isFetching && !isLoading && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-brand-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Atualizando...
        </motion.div>
      )}

      {/* CABEÇALHO SEMANAL */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <WeeklyHeader nextTraining={nextTrainingData} nextMatch={nextMatchData} />
      </motion.div>

      {/* BLOCO ATLETAS - KPIs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <AthleteKPIs stats={athleteStats} />
      </motion.div>

      {/* VISÃO GERAL - Cards Minimalistas */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Visão Geral</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Sessões de Treino</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{training.total_sessions}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">registros</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Presença Média</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{training.avg_attendance_rate.toFixed(0)}%</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">nos treinos</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Atletas Ativas</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{athletes.ativas}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">de {athletes.total}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Casos Médicos</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold ${(medical?.active_cases || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {medical?.active_cases || 0}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{(medical?.active_cases || 0) > 0 ? 'ativos' : 'nenhum'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <WellnessRadar data={wellnessData} />
          </div>
        </div>
      </motion.div>

      {/* TENDÊNCIAS DE TREINO */}
      {trendsData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Tendências</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <TrainingPerformanceChart data={trendsData} />
          </div>
        </motion.div>
      )}

      {/* HISTÓRICO E SITUAÇÃO MÉDICA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentTrainings data={trainingData.slice(0, 5)} />
          <MedicalSummary data={medicalData} />
        </div>
      </motion.div>

      {/* ACESSO RÁPIDO */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Link href="/trainings" className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 text-center transition-all duration-200 hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-md shadow-sm">
            <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Treinos</span>
          </Link>
          <Link href="/admin/athletes" className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 text-center transition-all duration-200 hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-md shadow-sm">
            <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Atletas</span>
          </Link>
          <Link href="/reports/wellness" className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 text-center transition-all duration-200 hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-md shadow-sm">
            <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Prontidão</span>
          </Link>
          <Link href="/reports/medical" className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 text-center transition-all duration-200 hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-md shadow-sm">
            <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Lesões</span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}