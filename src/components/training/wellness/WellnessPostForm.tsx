/**
 * WellnessPostForm
 * 
 * Formulário de wellness pós-treino com:
 * - RPE slider (0-10) com escala Borg visual
 * - 3 sliders de recuperação (fadiga, humor, dor muscular)
 * - Internal load calculado automaticamente (read-only)
 * - 4 presets para preenchimento rápido
 * - Validação: só pode preencher se preencheu Pre
 * - Deadline: editável até 24h após criação
 * - Badge de progresso mensal
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Smile,
  Activity,
  TrendingUp,
  Clock,
  Save,
  AlertTriangle,
  Lock,
  Award,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Slider, SliderGrid } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import {
  submitWellnessPost,
  getMyWellnessPost,
  getMyWellnessPre,
  type WellnessPostInput,
  type WellnessPost,
} from '@/lib/api/wellness';

interface WellnessPostFormProps {
  sessionId: string;
  sessionAt: string;
  sessionType?: string;
  sessionDuration?: number;
  onSuccess?: (wellness: WellnessPost) => void;
  onRequestUnlock?: () => void;
}

// Presets para wellness pós-treino
const WELLNESS_POST_PRESETS = [
  {
    id: 'light-session',
    label: 'Treino Leve',
    emoji: '😊',
    description: 'Treino tranquilo, sem fadiga',
    values: {
      session_rpe: 3,
      fatigue_after: 3,
      mood_after: 8,
      muscle_soreness_after: 2,
    },
  },
  {
    id: 'normal-session',
    label: 'Treino Normal',
    emoji: '💪',
    description: 'Intensidade moderada, recuperável',
    values: {
      session_rpe: 6,
      fatigue_after: 5,
      mood_after: 7,
      muscle_soreness_after: 4,
    },
  },
  {
    id: 'intense-session',
    label: 'Treino Intenso',
    emoji: '🔥',
    description: 'Treino puxado, fadiga moderada',
    values: {
      session_rpe: 8,
      fatigue_after: 7,
      mood_after: 6,
      muscle_soreness_after: 6,
    },
  },
  {
    id: 'exhausted',
    label: 'Exausto',
    emoji: '😰',
    description: 'Treino muito pesado, exaustão',
    values: {
      session_rpe: 10,
      fatigue_after: 9,
      mood_after: 4,
      muscle_soreness_after: 8,
    },
  },
];

// Escala Borg de RPE
const RPE_SCALE = [
  { value: 0, label: 'Repouso', color: 'emerald' },
  { value: 1, label: 'Muito Leve', color: 'emerald' },
  { value: 2, label: 'Leve', color: 'emerald' },
  { value: 3, label: 'Moderado', color: 'amber' },
  { value: 4, label: 'Algo Pesado', color: 'amber' },
  { value: 5, label: 'Pesado', color: 'amber' },
  { value: 6, label: 'Mais Pesado', color: 'orange' },
  { value: 7, label: 'Muito Pesado', color: 'orange' },
  { value: 8, label: 'Extremamente Pesado', color: 'red' },
  { value: 9, label: 'Máximo', color: 'red' },
  { value: 10, label: 'Máximo Absoluto', color: 'red' },
];

export function WellnessPostForm({
  sessionId,
  sessionAt,
  sessionType = 'Treino',
  sessionDuration = 90,
  onSuccess,
  onRequestUnlock,
}: WellnessPostFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingWellness, setExistingWellness] = useState<WellnessPost | null>(null);
  const [hasWellnessPre, setHasWellnessPre] = useState(false);
  const [checkingPre, setCheckingPre] = useState(true);
  
  // Form values
  const [values, setValues] = useState<WellnessPostInput>({
    session_rpe: 5,
    fatigue_after: 5,
    mood_after: 7,
    muscle_soreness_after: 4,
    minutes_effective: sessionDuration,
    notes: '',
  });

  // Check if wellness pre was filled
  useEffect(() => {
    async function checkWellnessPre() {
      try {
        setCheckingPre(true);
        const wellnessPre = await getMyWellnessPre(sessionId);
        setHasWellnessPre(!!wellnessPre);
      } catch (err) {
        console.error('Error checking wellness pre:', err);
        setHasWellnessPre(false);
      } finally {
        setCheckingPre(false);
      }
    }
    
    checkWellnessPre();
  }, [sessionId]);

  // Load existing wellness post
  useEffect(() => {
    async function loadWellness() {
      try {
        setLoading(true);
        const existing = await getMyWellnessPost(sessionId);
        if (existing) {
          setExistingWellness(existing);
          setValues({
            session_rpe: existing.session_rpe,
            fatigue_after: existing.fatigue_after,
            mood_after: existing.mood_after,
            muscle_soreness_after: existing.muscle_soreness_after,
            minutes_effective: existing.minutes_effective || sessionDuration,
            notes: existing.notes || '',
          });
        }
      } catch (err) {
        console.error('Error loading wellness:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (!checkingPre) {
      loadWellness();
    }
  }, [sessionId, sessionDuration, checkingPre]);

  // Check if 24h have passed since creation
  const isExpired = existingWellness
    ? new Date().getTime() - new Date(existingWellness.created_at).getTime() > 24 * 60 * 60 * 1000
    : false;

  const canEdit = !isExpired && hasWellnessPre;

  // Calculate internal load (RPE × duration)
  const internalLoad = values.session_rpe * (values.minutes_effective || 0);

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = WELLNESS_POST_PRESETS.find((p) => p.id === presetId);
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
    
    if (!hasWellnessPre) {
      setError('Complete o Wellness Pré-Treino primeiro antes de preencher o Pós-Treino.');
      return;
    }

    if (isExpired) {
      setError('Prazo de edição expirado (24h após criação). Solicite desbloqueio ao treinador.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const wellness = await submitWellnessPost(sessionId, values);
      
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

  // Get RPE label
  const rpeLabel = RPE_SCALE.find((s) => s.value === Math.round(values.session_rpe))?.label || 'Moderado';

  if (checkingPre || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Must Complete Pre First */}
      {!hasWellnessPre && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Complete o Wellness Pré-Treino primeiro
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Você precisa ter preenchido o wellness antes do treino para poder registrar o pós-treino.
              </p>
              <a
                href={`/athlete/wellness-pre/${sessionId}`}
                className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block"
              >
                Preencher Wellness Pré-Treino →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Expired Deadline */}
      {isExpired && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                🔒 Prazo de edição expirado (24h)
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                O prazo para editar o wellness pós-treino expirou (24h após a criação inicial).
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
      {hasWellnessPre && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Preenchimento Rápido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {WELLNESS_POST_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                disabled={!canEdit}
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
      )}

      {/* RPE Slider with Borg Scale */}
      {hasWellnessPre && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
            Como foi o treino?
          </h3>
          
          <div className="space-y-4">
            {/* RPE Slider */}
            <Slider
              label="Percepção de Esforço (RPE)"
              value={values.session_rpe}
              onChange={(v) => setValues((prev) => ({ ...prev, session_rpe: v }))}
              icon={<TrendingUp className="w-5 h-5" />}
              minLabel="Repouso"
              maxLabel="Máximo"
              description={`Escala Borg: ${rpeLabel}`}
              disabled={!canEdit}
            />

            {/* RPE Visual Scale */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>😌 Leve</span>
              <span>😐 Moderado</span>
              <span>😤 Pesado</span>
              <span>🥵 Máximo</span>
            </div>

            {/* Internal Load (Read-only) */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Carga Interna (Internal Load)
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      Calculado automaticamente: RPE × Duração
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {internalLoad}
                </div>
              </div>
            </div>

            {/* Minutes Effective */}
            <div>
              <label
                htmlFor="minutes_effective"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Minutos Efetivos de Treino
              </label>
              <input
                id="minutes_effective"
                type="number"
                min="0"
                max={sessionDuration * 2}
                value={values.minutes_effective || ''}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    minutes_effective: parseInt(e.target.value) || undefined,
                  }))
                }
                disabled={!canEdit}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Duração planejada: {sessionDuration} minutos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Sliders */}
      {hasWellnessPre && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
            Estado Pós-Treino
          </h3>
          
          <SliderGrid columns={2}>
            <Slider
              label="Fadiga Após Treino"
              value={values.fatigue_after}
              onChange={(v) => setValues((prev) => ({ ...prev, fatigue_after: v }))}
              icon={<Zap className="w-5 h-5" />}
              minLabel="Nenhuma"
              maxLabel="Extrema"
              showWarning
              warningThreshold={8}
              disabled={!canEdit}
            />

            <Slider
              label="Humor Após Treino"
              value={values.mood_after}
              onChange={(v) => setValues((prev) => ({ ...prev, mood_after: v }))}
              icon={<Smile className="w-5 h-5" />}
              minLabel="Muito mal"
              maxLabel="Excelente"
              reversed
              disabled={!canEdit}
            />

            <Slider
              label="Dor Muscular Após Treino"
              value={values.muscle_soreness_after}
              onChange={(v) => setValues((prev) => ({ ...prev, muscle_soreness_after: v }))}
              icon={<Activity className="w-5 h-5" />}
              minLabel="Nenhuma"
              maxLabel="Muita dor"
              showWarning
              warningThreshold={7}
              disabled={!canEdit}
            />
          </SliderGrid>
        </div>
      )}

      {/* Notes */}
      {hasWellnessPre && (
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
            disabled={!canEdit}
            rows={3}
            placeholder="Como você se sentiu durante o treino..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Submit Button */}
      {hasWellnessPre && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="submit"
            disabled={!canEdit || saving}
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
      )}
    </form>
  );
}
