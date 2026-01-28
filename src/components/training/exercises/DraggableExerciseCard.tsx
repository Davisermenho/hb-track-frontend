/**
 * DraggableExerciseCard
 * 
 * Wrapper for ExerciseCard with drag-and-drop functionality.
 * Used in exercise bank to drag exercises into training sessions.
 * 
 * Features:
 * - useDrag hook from react-dnd
 * - Visual feedback (opacity, cursor)
 * - Exercise data passed via drag item
 * - Compatible with SessionExerciseDropZone
 * 
 * @module DraggableExerciseCard
 */

'use client';

import { useDrag } from 'react-dnd';
import type { Exercise } from '@/lib/api/exercises';
import { ExerciseCard } from './ExerciseCard';

// ============================================================================
// Types
// ============================================================================

/**
 * Drag item type identifier
 * Must match drop zone accept type
 */
export const EXERCISE_DRAG_TYPE = 'EXERCISE' as const;

/**
 * Data transferred during drag operation
 */
export interface ExerciseDragItem {
  type: typeof EXERCISE_DRAG_TYPE;
  exercise: Exercise;
}

interface DraggableExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ExerciseCard with drag functionality
 * 
 * @example
 * ```tsx
 * <DraggableExerciseCard
 *   exercise={exercise}
 *   isFavorite={favorites.has(exercise.id)}
 *   onToggleFavorite={handleToggleFavorite}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function DraggableExerciseCard({
  exercise,
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDelete,
}: DraggableExerciseCardProps) {
  // ============================================================================
  // Drag Hook
  // ============================================================================

  const [{ isDragging }, dragRef] = useDrag<
    ExerciseDragItem,
    void,
    { isDragging: boolean }
  >(() => ({
    type: EXERCISE_DRAG_TYPE,
    item: () => ({
      type: EXERCISE_DRAG_TYPE,
      exercise,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [exercise]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      ref={dragRef as any}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="transition-opacity"
    >
      <ExerciseCard
        exercise={exercise}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onClick={() => onEdit(exercise)}
      />
    </div>
  );
}
