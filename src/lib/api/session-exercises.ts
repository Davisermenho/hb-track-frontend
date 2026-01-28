/**
 * API Client for Session Exercises (Training Module - Step 21)
 * 
 * Manages CRUD operations for exercises linked to training sessions.
 * Supports single add, bulk add, reorder, update metadata, and remove.
 * 
 * @module session-exercises
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

/**
 * Exercise data returned from session-exercises endpoints
 */
export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  exercise: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    media_url: string | null;
    tag_ids: string[];
  };
}

/**
 * Input for adding a single exercise to session
 */
export interface AddExerciseInput {
  exercise_id: string;
  order_index: number;
  duration_minutes?: number | null;
  notes?: string | null;
}

/**
 * Input for bulk adding exercises to session
 */
export interface BulkAddExercisesInput {
  exercises: Array<{
    exercise_id: string;
    order_index: number;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
}

/**
 * Input for updating exercise metadata
 */
export interface UpdateExerciseInput {
  order_index?: number;
  duration_minutes?: number | null;
  notes?: string | null;
}

/**
 * Input for reordering exercises
 */
export interface ReorderExercisesInput {
  exercises: Array<{
    id: string;
    order_index: number;
  }>;
}

/**
 * Response for list of session exercises
 */
export interface SessionExercisesListResponse {
  exercises: SessionExercise[];
  total_exercises: number;
  total_duration_minutes: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Add a single exercise to a training session
 * 
 * @param sessionId - Training session UUID
 * @param data - Exercise data (exercise_id, order_index, duration, notes)
 * @returns Created session exercise with nested exercise data
 * 
 * @example
 * ```ts
 * const exercise = await addSessionExercise(sessionId, {
 *   exercise_id: exerciseId,
 *   order_index: 0,
 *   duration_minutes: 15,
 *   notes: 'Focus on passing accuracy'
 * });
 * ```
 */
export async function addSessionExercise(
  sessionId: string,
  data: AddExerciseInput
): Promise<SessionExercise> {
  const response = await apiClient.post<SessionExercise>(
    `/training-sessions/${sessionId}/exercises`,
    data
  );
  return response;
}

/**
 * Bulk add multiple exercises to a training session
 * 
 * Useful for multi-select drag operations or importing exercise templates.
 * Maximum 50 exercises per request (backend validation).
 * 
 * @param sessionId - Training session UUID
 * @param data - Array of exercises with order_index
 * @returns Array of created session exercises
 * 
 * @example
 * ```ts
 * const exercises = await bulkAddSessionExercises(sessionId, {
 *   exercises: [
 *     { exercise_id: id1, order_index: 0, duration_minutes: 10 },
 *     { exercise_id: id2, order_index: 1, duration_minutes: 15 }
 *   ]
 * });
 * ```
 */
export async function bulkAddSessionExercises(
  sessionId: string,
  data: BulkAddExercisesInput
): Promise<SessionExercise[]> {
  const response = await apiClient.post<SessionExercise[]>(
    `/training-sessions/${sessionId}/exercises/bulk`,
    data
  );
  return response;
}

/**
 * Get all exercises linked to a training session
 * 
 * Returns exercises ordered by order_index ascending.
 * Includes nested exercise data (name, tags, focus_area, etc).
 * 
 * @param sessionId - Training session UUID
 * @returns List of session exercises with metadata
 * 
 * @example
 * ```ts
 * const { exercises, total_exercises, total_duration_minutes } = 
 *   await getSessionExercises(sessionId);
 * ```
 */
export async function getSessionExercises(
  sessionId: string
): Promise<SessionExercisesListResponse> {
  const response = await apiClient.get<SessionExercisesListResponse>(
    `/training-sessions/${sessionId}/exercises`
  );
  return response;
}

/**
 * Update exercise metadata (duration, notes, order)
 * 
 * Use this for in-place edits. For reordering multiple exercises,
 * prefer reorderSessionExercises() for better performance.
 * 
 * @param exerciseId - Session exercise UUID (NOT exercise_id)
 * @param data - Fields to update (order_index, duration_minutes, notes)
 * @returns Updated session exercise
 * 
 * @example
 * ```ts
 * const updated = await updateSessionExercise(sessionExerciseId, {
 *   duration_minutes: 20,
 *   notes: 'Increased duration'
 * });
 * ```
 */
export async function updateSessionExercise(
  exerciseId: string,
  data: UpdateExerciseInput
): Promise<SessionExercise> {
  const response = await apiClient.patch<SessionExercise>(
    `/training-sessions/exercises/${exerciseId}`,
    data
  );
  return response;
}

/**
 * Reorder exercises in bulk (drag-and-drop)
 * 
 * Efficient batch update for drag-and-drop operations.
 * Updates all order_index values in a single transaction.
 * 
 * @param sessionId - Training session UUID
 * @param data - Array of {id, order_index} pairs
 * @returns Success message with update count
 * 
 * @example
 * ```ts
 * // User dragged exercise from position 2 to 0
 * await reorderSessionExercises(sessionId, {
 *   exercises: [
 *     { id: draggedId, order_index: 0 },
 *     { id: otherId1, order_index: 1 },
 *     { id: otherId2, order_index: 2 }
 *   ]
 * });
 * ```
 */
export async function reorderSessionExercises(
  sessionId: string,
  data: ReorderExercisesInput
): Promise<{ message: string; updated_count: number }> {
  const response = await apiClient.patch<{ message: string; updated_count: number }>(
    `/training-sessions/${sessionId}/exercises/reorder`,
    data
  );
  return response;
}

/**
 * Remove an exercise from a training session (soft delete)
 * 
 * Sets deleted_at timestamp. Exercise remains in DB for history.
 * 
 * @param exerciseId - Session exercise UUID (NOT exercise_id)
 * @returns void (204 No Content)
 * 
 * @example
 * ```ts
 * await removeSessionExercise(sessionExerciseId);
 * // UI should remove from list and show toast
 * ```
 */
export async function removeSessionExercise(exerciseId: string): Promise<void> {
  await apiClient.delete(`/training-sessions/exercises/${exerciseId}`);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate total duration of session exercises
 * 
 * @param exercises - Array of session exercises
 * @returns Total duration in minutes (null durations counted as 0)
 */
export function calculateTotalDuration(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, ex) => sum + (ex.duration_minutes || 0), 0);
}

/**
 * Recompute order_index after removing an exercise
 * 
 * Ensures sequential ordering: 0, 1, 2, 3...
 * 
 * @param exercises - Current exercises list
 * @param removedIndex - Index of removed exercise
 * @returns Array of {id, order_index} for reorder API
 */
export function recomputeOrderAfterRemoval(
  exercises: SessionExercise[],
  removedIndex: number
): ReorderExercisesInput['exercises'] {
  return exercises
    .filter((_, idx) => idx !== removedIndex)
    .map((ex, idx) => ({
      id: ex.id,
      order_index: idx
    }));
}

/**
 * Recompute order_index after drag-and-drop
 * 
 * @param exercises - Current exercises list
 * @param sourceIndex - Original index
 * @param destinationIndex - Target index
 * @returns Array of {id, order_index} for reorder API
 */
export function recomputeOrderAfterDrag(
  exercises: SessionExercise[],
  sourceIndex: number,
  destinationIndex: number
): ReorderExercisesInput['exercises'] {
  const reordered = [...exercises];
  const [moved] = reordered.splice(sourceIndex, 1);
  reordered.splice(destinationIndex, 0, moved);

  return reordered.map((ex, idx) => ({
    id: ex.id,
    order_index: idx
  }));
}

/**
 * Check if session duration exceeds planned duration
 * 
 * @param exercises - Session exercises
 * @param plannedDuration - Session duration_planned_minutes
 * @returns Object with boolean and message
 */
export function checkDurationExceedance(
  exercises: SessionExercise[],
  plannedDuration: number
): { exceeded: boolean; message: string | null } {
  const total = calculateTotalDuration(exercises);
  
  if (total > plannedDuration) {
    const diff = total - plannedDuration;
    return {
      exceeded: true,
      message: `⚠️ Duração total dos exercícios (${total}min) excede a duração planejada (${plannedDuration}min) em ${diff}min`
    };
  }
  
  return { exceeded: false, message: null };
}

/**
 * Group exercises by focus_area for visualization
 * 
 * @param exercises - Session exercises
 * @returns Map of focus_area to exercises array
 */
export function groupExercisesByFocus(
  exercises: SessionExercise[]
): Map<string, SessionExercise[]> {
  const groups = new Map<string, SessionExercise[]>();
  
  exercises.forEach(ex => {
    const focus = ex.exercise.category || 'other';
    if (!groups.has(focus)) {
      groups.set(focus, []);
    }
    groups.get(focus)!.push(ex);
  });
  
  return groups;
}

/**
 * Format exercise duration for display
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "15min", "1h 30min", "Não definido")
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === 0) return 'Não definido';
  
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
}
