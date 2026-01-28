'use client';

import { useState } from 'react';
import { Save, Calendar, TrendingUp, Activity, Moon, Brain, Heart, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { WellnessSlider, WELLNESS_EMOJI_PRESETS } from '@/components/wellness/WellnessSlider';
import { WellnessCard } from '@/components/wellness/WellnessCard';
import { WellnessTrendChart } from '@/components/wellness/WellnessTrendChart';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { WellnessMetrics } from '@/types/wellness';

// Helper function to get closest emoji
const getClosestEmoji = (emojiMap: Record<number, string>, value: number): string => {
  const keys = Object.keys(emojiMap).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) => 
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
  return emojiMap[closest] || '😐';
};

export default function WellnessPage() {
  const [metrics, setMetrics] = useState<WellnessMetrics>({
    sleep_quality: 7,
    fatigue_level: 3,
    stress_level: 4,
    mood: 8,
    muscle_soreness: 2,
    hydration: 7,
    motivation: 8,
  });

  const [isSaving, setIsSaving] = useState(false);
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Mock data para o gráfico de tendência (últimos 7 dias)
  const trendData = {
    dates: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    sleep: [6, 7, 8, 7, 6, 8, 7],
    fatigue: [4, 3, 3, 4, 5, 3, 3],
    stress: [5, 4, 4, 5, 6, 4, 4],
    mood: [7, 8, 8, 7, 6, 8, 8],
  };

  // Mock data para comparação com a equipe
  const teamAverages: WellnessMetrics = {
    sleep_quality: 7.2,
    fatigue_level: 3.5,
    stress_level: 4.1,
    mood: 7.5,
    muscle_soreness: 2.8,
    hydration: 6.8,
    motivation: 7.3,
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Wellness salvo com sucesso!', {
      description: 'Seus dados foram registrados para hoje.',
    });
    
    setIsSaving(false);
  };

  const getComparisonBadge = (myValue: number, teamValue: number) => {
    const diff = myValue - teamValue;
    if (Math.abs(diff) < 0.5) {
      return { label: 'Na média', color: 'text-gray-600 dark:text-gray-400' };
    }
    if (diff > 0) {
      return { label: 'Acima da média', color: 'text-success-600 dark:text-success-400' };
    }
    return { label: 'Abaixo da média', color: 'text-warning-600 dark:text-warning-400' };
  };

  const overallScore = (
    metrics.sleep_quality +
    (10 - metrics.fatigue_level) +
    (10 - metrics.stress_level) +
    metrics.mood +
    (10 - metrics.muscle_soreness)
  ) / 5;

  const getOverallStatus = (score: number) => {
    if (score >= 8) return { label: 'Excelente', color: 'text-success-600', bg: 'bg-success-50' };
    if (score >= 6) return { label: 'Bom', color: 'text-brand-600', bg: 'bg-brand-50' };
    if (score >= 4) return { label: 'Regular', color: 'text-warning-600', bg: 'bg-warning-50' };
    return { label: 'Alerta', color: 'text-error-600', bg: 'bg-error-50' };
  };

  const status = getOverallStatus(overallScore);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Wellness Diário
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {today}
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
            >
              <Save className="w-4 h-4" />
              Salvar Wellness
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Geral */}
        <div className="mb-8">
          <div className={cn(
            'rounded-lg p-6 border-2',
            status.bg,
            'border-gray-200 dark:border-gray-800'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Prontidão Geral
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Baseado em 5 métricas principais
                </p>
              </div>
              <div className="text-center">
                <div className={cn('text-5xl font-bold mb-1', status.color)}>
                  {overallScore.toFixed(1)}
                </div>
                <span className={cn('text-sm font-semibold', status.color)}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <WellnessCard
            title="Qualidade do Sono"
            value={metrics.sleep_quality}
            icon={<Moon className="w-5 h-5 text-white" />}
            color="bg-blue-500"
            emoji={getClosestEmoji(WELLNESS_EMOJI_PRESETS.sleep, metrics.sleep_quality)}
            trend="up"
            trendValue={8.5}
          />
          <WellnessCard
            title="Fadiga"
            value={metrics.fatigue_level}
            icon={<Activity className="w-5 h-5 text-white" />}
            color="bg-red-500"
            emoji={getClosestEmoji(WELLNESS_EMOJI_PRESETS.fatigue, metrics.fatigue_level)}
            trend="down"
            trendValue={-12.3}
          />
          <WellnessCard
            title="Nível de Stress"
            value={metrics.stress_level}
            icon={<Brain className="w-5 h-5 text-white" />}
            color="bg-orange-500"
            emoji={getClosestEmoji(WELLNESS_EMOJI_PRESETS.stress, metrics.stress_level)}
            trend="stable"
          />
          <WellnessCard
            title="Humor"
            value={metrics.mood}
            icon={<Heart className="w-5 h-5 text-white" />}
            color="bg-green-500"
            emoji={getClosestEmoji(WELLNESS_EMOJI_PRESETS.mood, metrics.mood)}
            trend="up"
            trendValue={5.2}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Wellness */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Como você está hoje?
              </h2>
              
              <div className="space-y-8">
                <WellnessSlider
                  label="Qualidade do Sono"
                  value={metrics.sleep_quality}
                  onChange={(v) => setMetrics({ ...metrics, sleep_quality: v })}
                  emojis={WELLNESS_EMOJI_PRESETS.sleep}
                />

                <WellnessSlider
                  label="Nível de Fadiga"
                  value={metrics.fatigue_level}
                  onChange={(v) => setMetrics({ ...metrics, fatigue_level: v })}
                  emojis={WELLNESS_EMOJI_PRESETS.fatigue}
                />

                <WellnessSlider
                  label="Nível de Stress"
                  value={metrics.stress_level}
                  onChange={(v) => setMetrics({ ...metrics, stress_level: v })}
                  emojis={WELLNESS_EMOJI_PRESETS.stress}
                />

                <WellnessSlider
                  label="Humor"
                  value={metrics.mood}
                  onChange={(v) => setMetrics({ ...metrics, mood: v })}
                  emojis={WELLNESS_EMOJI_PRESETS.mood}
                />

                <WellnessSlider
                  label="Dor Muscular"
                  value={metrics.muscle_soreness}
                  onChange={(v) => setMetrics({ ...metrics, muscle_soreness: v })}
                  emojis={WELLNESS_EMOJI_PRESETS.soreness}
                />

                <WellnessSlider
                  label="Hidratação"
                  value={metrics.hydration || 7}
                  onChange={(v) => setMetrics({ ...metrics, hydration: v })}
                  emojis={{
                    0: '🏜️',
                    3: '😐',
                    5: '💧',
                    7: '💦',
                    10: '🌊'
                  }}
                />

                <WellnessSlider
                  label="Motivação"
                  value={metrics.motivation || 8}
                  onChange={(v) => setMetrics({ ...metrics, motivation: v })}
                  emojis={{
                    0: '😴',
                    3: '😐',
                    5: '🙂',
                    7: '😊',
                    10: '🔥'
                  }}
                />
              </div>

              {/* Notas adicionais */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas Adicionais (Opcional)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  placeholder="Ex: Dormi mal por conta de barulho na rua..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Comparação e Tendências */}
          <div className="space-y-6">
            {/* Comparação com a Equipe */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  vs. Equipe
                </h3>
              </div>
              
              <div className="space-y-4">
                {Object.entries(metrics).map(([key, value]) => {
                  const teamValue = teamAverages[key as keyof WellnessMetrics];
                  if (!teamValue) return null;
                  
                  const comparison = getComparisonBadge(value, teamValue);
                  
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <span className={comparison.color}>
                          {comparison.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500"
                            style={{ width: `${(value / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                          {value.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-50">
                        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-400 dark:bg-gray-500"
                            style={{ width: `${(teamValue / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">
                          {teamValue.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">💡</span>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-brand-900 dark:text-brand-100 mb-1">
                    Dica do Dia
                  </p>
                  <p className="text-brand-700 dark:text-brand-300">
                    Seu nível de fadiga está acima da média. Considere uma sessão de recuperação ativa hoje.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Tendência */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Tendência dos Últimos 7 Dias
            </h2>
            <WellnessTrendChart data={trendData} />
          </div>
        </div>
      </div>
    </div>
  );
}