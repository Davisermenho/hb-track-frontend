/**
 * useConflicts
 *
 * Hook para detectar conflitos de horário/local entre sessões
 */

import { useMemo } from 'react';
import { TrainingSession } from '@/lib/api/trainings';

export interface Conflict {
  sessionId: string;
  type: 'time' | 'location';
  conflictingSessionId: string;
  message: string;
}

export function useConflicts(sessions: TrainingSession[]): Conflict[] {
  return useMemo(() => {
    const conflicts: Conflict[] = [];

    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const sessionA = sessions[i];
        const sessionB = sessions[j];

        // Verificar conflito de horário
        const startA = new Date(sessionA.session_at);
        const endA = new Date(startA.getTime() + (sessionA.duration_planned_minutes || 60) * 60000);
        const startB = new Date(sessionB.session_at);
        const endB = new Date(startB.getTime() + (sessionB.duration_planned_minutes || 60) * 60000);

        const timeOverlap = startA < endB && startB < endA;

        if (timeOverlap) {
          // Conflito de horário
          conflicts.push({
            sessionId: sessionA.id,
            type: 'time',
            conflictingSessionId: sessionB.id,
            message: `Conflito de horário com "${sessionB.main_objective || 'outra sessão'}"`,
          });
          conflicts.push({
            sessionId: sessionB.id,
            type: 'time',
            conflictingSessionId: sessionA.id,
            message: `Conflito de horário com "${sessionA.main_objective || 'outra sessão'}"`,
          });

          // Conflito de local (se ambos têm local definido)
          if (sessionA.location && sessionB.location && sessionA.location === sessionB.location) {
            conflicts.push({
              sessionId: sessionA.id,
              type: 'location',
              conflictingSessionId: sessionB.id,
              message: `Mesmo local: ${sessionA.location}`,
            });
            conflicts.push({
              sessionId: sessionB.id,
              type: 'location',
              conflictingSessionId: sessionA.id,
              message: `Mesmo local: ${sessionB.location}`,
            });
          }
        }
      }
    }

    return conflicts;
  }, [sessions]);
}