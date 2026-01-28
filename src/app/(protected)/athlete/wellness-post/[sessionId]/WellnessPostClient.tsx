/**
 * WellnessPostClient
 * 
 * Componente cliente da página de wellness pós-treino com:
 * - Informações da sessão
 * - Formulário de wellness post
 * - Badge de progresso mensal
 * - Historical chart
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Award,
  Trophy,
  Flame,
} from 'lucide-react';
import { WellnessPostForm } from '@/components/training/wellness/WellnessPostForm';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { useSessionDetail } from '@/lib/hooks/useSessions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WellnessPostClientProps {
  sessionId: string;
}

export default function WellnessPostClient({ sessionId }: WellnessPostClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [monthlyProgress] = useState<{
    responded: number;
    total: number;
    rate: number;
    badge_status: 'earned' | 'on-track' | 'at-risk';
  }>({
    responded: 15,
    total: 20,
    rate: 75,
    badge_status: 'on-track',
  });
  
  // Fetch session data from API
  const { session, isLoading, error } = useSessionDetail(sessionId);

  const handleSuccess = () => {
    toast.success('Wellness pós-treino enviado com sucesso!');
    setTimeout(() => {
      router.push('/athlete/dashboard'); // TODO: Adjust route
    }, 1500);
  };

  const handleRequestUnlock = () => {
    setShowUnlockModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                  Erro ao carregar sessão
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Target className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Sessão não encontrada
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            A sessão solicitada não existe ou você não tem permissão para acessá-la.
          </p>
          <Button onClick={() => router.back()} variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(session.session_at);
  const { responded, total, rate, badge_status } = monthlyProgress;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0f0f0f] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {/* Title */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Wellness Pós-Treino
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Como você se sentiu após o treino?
              </p>
            </div>
          </div>

          {/* Session Info */}
          <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {sessionDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {sessionDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {session.duration_planned_minutes && (
                    <span className="text-slate-500"> • {session.duration_planned_minutes}min</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {session.session_type}
                </span>
              </div>
            </div>

            {session.main_objective && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                <span className="font-medium">Objetivo:</span> {session.main_objective}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#0f0f0f] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <WellnessPostForm
                sessionId={sessionId}
                sessionAt={session.session_at}
                sessionType={session.session_type}
                sessionDuration={session.duration_planned_minutes}
                onSuccess={handleSuccess}
                onRequestUnlock={handleRequestUnlock}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Monthly Progress Badge */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Seu Progresso
                </h3>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Este Mês</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {responded}/{total}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rate >= 90
                        ? 'bg-emerald-500'
                        : rate >= 70
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Taxa de resposta: {rate}%
                </p>
              </div>

              {/* Badge Status */}
              <div
                className={`p-3 rounded-lg border-2 ${
                  badge_status === 'earned'
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                    : badge_status === 'on-track'
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  {badge_status === 'earned' ? (
                    <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : badge_status === 'on-track' ? (
                    <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  ) : (
                    <Award className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        badge_status === 'earned'
                          ? 'text-emerald-800 dark:text-emerald-200'
                          : badge_status === 'on-track'
                          ? 'text-amber-800 dark:text-amber-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}
                    >
                      {badge_status === 'earned'
                        ? '🏆 Badge Conquistado!'
                        : badge_status === 'on-track'
                        ? '🔥 Continue assim!'
                        : '⚠️ Em risco'}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        badge_status === 'earned'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : badge_status === 'on-track'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {badge_status === 'earned'
                        ? `Parabéns! Você respondeu ${rate}% dos wellness este mês.`
                        : badge_status === 'on-track'
                        ? `Você está no caminho certo. Mais ${90 - rate}% para o badge!`
                        : `Aumente sua taxa para ${90 - rate}% para conquistar o badge.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Dicas
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>RPE é sua percepção geral de quão difícil foi o treino</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>A carga interna é calculada automaticamente (RPE × duração)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Preencha até 24h após o treino</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Responda ≥90% mensalmente para ganhar badge</span>
                </li>
              </ul>
            </div>

            {/* TODO: Historical Chart */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Histórico de RPE
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gráfico de RPE em desenvolvimento...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock Request Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowUnlockModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0f0f0f] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Solicitar Desbloqueio
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Funcionalidade em desenvolvimento. Em breve você poderá solicitar ao treinador o desbloqueio do wellness.
            </p>
            <Button onClick={() => setShowUnlockModal(false)} variant="secondary" className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
