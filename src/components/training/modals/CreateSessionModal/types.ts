/**
 * Types para CreateSessionModal
 */

import type { TrainingSession } from '@/lib/api/trainings';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props do CreateSessionModal principal
 */
export interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: TrainingSession, intent: 'close' | 'continue') => void;
  teamId?: string;
  initialDate?: string | null;
  microcycleId?: string;
  recentSessions?: TrainingSession[];
}
