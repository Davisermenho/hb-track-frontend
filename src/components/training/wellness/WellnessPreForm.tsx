/**
 * WellnessPreForm
 * 
 * Formulário de wellness pré-treino com:
 * - 6 sliders (0-10) com cores progressivas
 * - 4 preset buttons para preenchimento rápido
 * - Validação de valores críticos
 * - Countdown de deadline
 * - Histórico visual mini-chart
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Moon,
  Zap,
  Brain,
  Activity,
  Smile,
  Target,
  Clock,
  Save,
  AlertTriangle,
  Lock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Slider, SliderGrid } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import {
  submitWellnessPre,
  getMyWellnessPre,
  calculateDeadline,
  WELLNESS_PRE_PRESETS,
  type WellnessPreInput,
  type WellnessPre,
  type DeadlineInfo,
} from '@/lib/api/wellness';
import { WellnessHistoricalChart } from './WellnessHistoricalChart';

interface WellnessPreFormProps {
  sessionId: string;
  sessionAt: string;
  sessionType?: string;
  athleteId?: number;
  showHistoricalChart?: boolean;
  onSuccess?: (wellness: WellnessPre) => void;
  onRequestUnlock?: () => void;
}

export function WellnessPreForm({
  sessionId,
  athleteId,
  showHistoricalChart = true,
  sessionAt,
  sessionType = 'Treino',
  onSuccess,
  onRequestUnlock,
}: WellnessPreFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingWellness, setExistingWellness] = useState<WellnessPre | null>(null);
  const [deadline, setDeadline] = useState<DeadlineInfo>(calculateDeadline(sessionAt));
  
  // Form values
  const [values, setValues] = useState<WellnessPreInput>({
    sleep_quality: 7,
    fatigue_level: 5,
    stress_level: 4,
    muscle_soreness: 4,
    mood: 7,
    readiness: 7,
    notes: '',
  });

  // Load existing wellness
  useEffect(() => {
    async function loadWellness() {
      try {
        setLoading(true);
        const existing = await getMyWellnessPre(sessionId);
        if (existing) {
          setExistingWellness(existing);
          setValues({
            sleep_quality: existing.sleep_quality,
            fatigue_level: existing.fatigue_level,
            stress_level: existing.stress_level,
            muscle_soreness: existing.muscle_soreness,
            mood: existing.mood,
            readiness: existing.readiness,
            notes: existing.notes || '',
          });
        }
      } catch (err) {
        console.error('Error loading wellness:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadWellness();
  }, [sessionId]);

  // Update deadline every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setDeadline(calculateDeadline(sessionAt));
    }, 60000); // 60s

    return () => clearInterval(interval);
  }, [sessionAt]);

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = WELLNESS_PRE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setValues((prev) => ({
        ...prev,
        ...preset.values,
      }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deadline.is_expired) {
      setError('Prazo de preenchimento expirado. Solicite desbloqueio ao treinador.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const wellness = await submitWellnessPre(sessionId, values);
      
      if (onSuccess) {
        onSuccess(wellness);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar wellness');
      console.error('Error submitting wellness:', err);
    } finally {
      setSaving(false);
    }
  };

  // Check if any value is critical
  const hasCriticalValues = 
    values.fatigue_level >= 8 ||
    values.stress_level >= 8 ||
    values.readiness <= 3 ||
    values.muscle_soreness >= 7;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Deadline Warning */}
      {!deadline.is_expired && deadline.remaining_minutes < 120 && (
        <div data-tour="deadline-countdown" className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                ⏰ Último momento para preencher!
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {sessionType} em {deadline.remaining_minutes} minutos. Complete antes que expire.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired Deadline */}
      {deadline.is_expired && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                🔒 Prazo de edição expirado
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                O prazo para preencher o wellness pré-treino expirou (2h antes da sessão).
              </p>
              {onRequestUnlock && (
                <button
                  type="button"
                  onClick={onRequestUnlock}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline mt-2"
                >
                  Solicitar desbloqueio ao treinador →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Preset Buttons */}
      <div data-tour="wellness-presets">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Preenchimento Rápido
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {WELLNESS_PRE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              disabled={deadline.is_expired}
              className="p-3 rounded-lg border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-2xl mb-1">{preset.emoji}</div>
              <div className="text-xs font-medium text-slate-900 dark:text-white">
                {preset.label}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Historical Chart */}
      {showHistoricalChart && athleteId && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            📊 Tendência Histórica (14 dias)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WellnessHistoricalChart
              athleteId={athleteId}
              metric="readiness"
              days={14}
              height={180}
              showTitle={false}
            />
            <WellnessHistoricalChart
              athleteId={athleteId}
              metric="fatigue_level"
              days={14}
              height={180}
              showTitle={false}
            />
          </div>
        </div>
      )}

      {/* Sliders Grid */}
      <div data-tour="wellness-form">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
          Como você está se sentindo hoje?
        </h3>
        
        <SliderGrid columns={2}>
          <Slider
            label="Qualidade do Sono"
            value={values.sleep_quality}
            onChange={(v) => setValues((prev) => ({ ...prev, sleep_quality: v }))}
            icon={<Moon className="w-5 h-5" />}
            minLabel="Péssimo"
            maxLabel="Excelente"
            reversed
            disabled={deadline.is_expired}
          />

          <Slider
            label="Nível de Fadiga"
            value={values.fatigue_level}
            onChange={(v) => setValues((prev) => ({ ...prev, fatigue_level: v }))}
            icon={<Zap className="w-5 h-5" />}
            minLabel="Nenhuma"
            maxLabel="Extrema"
            showWarning
            warningThreshold={8}
            disabled={deadline.is_expired}
          />

          <Slider
            label="Nível de Estresse"
            value={values.stress_level}
            onChange={(v) => setValues((prev) => ({ ...prev, stress_level: v }))}
            icon={<Brain className="w-5 h-5" />}
            minLabel="Relaxado"
            maxLabel="Muito estressado"
            showWarning
            warningThreshold={8}
            disabled={deadline.is_expired}
          />

          <Slider
            label="Dor Muscular"
            value={values.muscle_soreness}
            onChange={(v) => setValues((prev) => ({ ...prev, muscle_soreness: v }))}
            icon={<Activity className="w-5 h-5" />}
            minLabel="Nenhuma"
            maxLabel="Muita dor"
            showWarning
            warningThreshold={7}
            disabled={deadline.is_expired}
          />

          <Slider
            label="Humor"
            value={values.mood}
            onChange={(v) => setValues((prev) => ({ ...prev, mood: v }))}
            icon={<Smile className="w-5 h-5" />}
            minLabel="Muito mal"
            maxLabel="Excelente"
            reversed
            disabled={deadline.is_expired}
          />

          <Slider
            label="Prontidão para Treinar"
            value={values.readiness}
            onChange={(v) => setValues((prev) => ({ ...prev, readiness: v }))}
            icon={<Target className="w-5 h-5" />}
            minLabel="Não pronto"
            maxLabel="100% pronto"
            reversed
            disabled={deadline.is_expired}
          />
        </SliderGrid>
      </div>

      {/* Critical Values Warning */}
      {hasCriticalValues && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Atenção: Valores críticos detectados
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Seus valores indicam fadiga elevada ou baixa prontidão. Considere comunicar ao treinador.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
        >
          Observações (opcional)
        </label>
        <textarea
          id="notes"
          value={values.notes}
          onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
          disabled={deadline.is_expired}
          rows={3}
          placeholder="Alguma informação adicional relevante..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="submit"
          disabled={deadline.is_expired || saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {existingWellness ? 'Atualizar Wellness' : 'Enviar Wellness'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
