/**
 * useSessionIntelligence Hook
 *
 * Centraliza lógica de alertas e inteligência visual para sessões de treino
 * Baseado nas colunas de training_sessions
 */

'use client';

import { useMemo } from 'react';
import { TrainingSession } from '@/lib/api/trainings';

export interface SessionIntelligence {
  // Alertas de validação
  missingLocation: boolean;
  hasDeviation: boolean;
  missingObjectives: boolean;
  missingFocus: boolean;
  missingExercises: boolean;
  hasAnyAlert: boolean;

  // Estado visual
  variant: 'draft' | 'scheduled' | 'in_progress' | 'pending_review' | 'readonly';
  loadLevel: 'low' | 'normal' | 'high';

  // Progresso e status
  isComplete: boolean;
  completionPercentage: number;
  statusColor: string;
  statusIcon: string;
}

/**
 * Hook que analisa uma sessão e retorna inteligência visual/alertas
 */
export function useSessionIntelligence(session: TrainingSession | null): SessionIntelligence {
  return useMemo(() => {
    if (!session) {
      return {
        missingLocation: false,
        hasDeviation: false,
        missingObjectives: false,
        missingFocus: false,
        missingExercises: false,
        hasAnyAlert: false,
        variant: 'draft',
        loadLevel: 'normal',
        isComplete: false,
        completionPercentage: 0,
        statusColor: 'gray',
        statusIcon: 'circle',
      };
    }

    // Alertas baseados nas colunas
    const missingLocation = !session.location?.trim() && session.status === 'draft';
    const hasDeviation = session.planning_deviation_flag === true;
    const missingObjectives = !session.main_objective?.trim();
    const missingFocus = !session.focus_attack_positional_pct &&
                        !session.focus_defense_positional_pct &&
                        !session.focus_transition_offense_pct &&
                        !session.focus_transition_defense_pct &&
                        !session.focus_attack_technical_pct &&
                        !session.focus_defense_technical_pct &&
                        !session.focus_physical_pct;
    const missingExercises = !session.exercises_count || session.exercises_count === 0;

    // Flag consolidada para alertas
    const hasAnyAlert = missingLocation || hasDeviation || missingObjectives || missingFocus || missingExercises;

    // Estado visual baseado no status
    const variant = session.status as SessionIntelligence['variant'];

    // Nível de carga (coluna 11: planned_load)
    const loadLevel: SessionIntelligence['loadLevel'] =
      (session.planned_load || 0) > 8 ? 'high' :
      (session.planned_load || 0) > 5 ? 'normal' : 'low';

    // Cálculo de completude para draft
    let completionPercentage = 0;
    if (session.status === 'draft') {
      const checks = [
        !missingLocation,
        !missingObjectives,
        !missingFocus,
        !missingExercises,
      ];
      completionPercentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    const isComplete = completionPercentage === 100;

    // Cores e ícones por status
    const statusConfig = {
      draft: { color: 'amber', icon: 'edit' },
      scheduled: { color: 'emerald', icon: 'calendar' },
      in_progress: { color: 'blue', icon: 'play' },
      pending_review: { color: 'orange', icon: 'clock' },
      readonly: { color: 'slate', icon: 'lock' },
    };

    const config = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.draft;

    return {
      missingLocation,
      hasDeviation,
      missingObjectives,
      missingFocus,
      missingExercises,
      hasAnyAlert,
      variant,
      loadLevel,
      isComplete,
      completionPercentage,
      statusColor: config.color,
      statusIcon: config.icon,
    };
  }, [session]);
}