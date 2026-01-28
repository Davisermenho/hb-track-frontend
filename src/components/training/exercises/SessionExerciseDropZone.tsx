/**
 * SessionExerciseDropZone
 * 
 * Drop zone for session exercises with drag-and-drop reordering,
 * duration inputs, notes, and remove functionality.
 * 
 * Features:
 * - useDrop hook accepting EXERCISE type
 * - Visual feedback (border color when hovering)
 * - List of exercises with DraggableSessionExercise items
 * - Reordering within the same session
 * - Duration minutes input per exercise
 * - Notes textarea per exercise
 * - Remove exercise button
 * - Total duration display
 * - Warning if exceeds session planned duration
 * 
 * @module SessionExerciseDropZone
 */

'use client';

import { useState, useCallback } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { Icons } from '@/design-system/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import * as api from '@/lib/api/session-exercises';
import {
  useBulkAddSessionExercises,
  useReorderSessionExercises,
  useUpdateSessionExercise,
  useRemoveSessionExercise,
  useSessionExercises,
} from '@/hooks/useSessionExercises';
import type { ExerciseDragItem, EXERCISE_DRAG_TYPE } from './DraggableExerciseCard';

// ============================================================================
// Types
// ============================================================================

interface SessionExerciseDropZoneProps {
  sessionId: string;
  plannedDuration: number; // session.duration_planned_minutes
  readOnly?: boolean;
}

interface DraggableSessionExerciseItemProps {
  exercise: api.SessionExercise;
  sessionId: string;
  index: number;
  totalExercises: number;
  onMoveExercise: (fromIndex: number, toIndex: number) => void;
  onUpdateDuration: (exerciseId: string, minutes: number | null) => void;
  onUpdateNotes: (exerciseId: string, notes: string) => void;
  onRemove: (exerciseId: string) => void;
  readOnly: boolean;
}

const SESSION_EXERCISE_DRAG_TYPE = 'SESSION_EXERCISE' as const;

interface SessionExerciseDragItem {
  type: typeof SESSION_EXERCISE_DRAG_TYPE;
  exerciseId: string;
  index: number;
}

// ============================================================================
// Draggable Session Exercise Item
// ============================================================================

function DraggableSessionExerciseItem({
  exercise,
  sessionId,
  index,
  totalExercises,
  onMoveExercise,
  onUpdateDuration,
  onUpdateNotes,
  onRemove,
  readOnly,
}: DraggableSessionExerciseItemProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(exercise.notes || '');
  const [localDuration, setLocalDuration] = useState<string>(
    exercise.duration_minutes?.toString() || ''
  );

  // Drag for reordering
  const [{ isDragging }, dragRef] = useDrag<
    SessionExerciseDragItem,
    void,
    { isDragging: boolean }
  >(() => ({
    type: SESSION_EXERCISE_DRAG_TYPE,
    item: { type: SESSION_EXERCISE_DRAG_TYPE, exerciseId: exercise.id, index },
    canDrag: !readOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [exercise.id, index, readOnly]);

  // Drop for reordering
  const [{ isOver }, dropRef] = useDrop<
    SessionExerciseDragItem,
    void,
    { isOver: boolean }
  >(() => ({
    accept: SESSION_EXERCISE_DRAG_TYPE,
    canDrop: (item) => item.index !== index && !readOnly,
    drop: (item) => {
      if (item.index !== index) {
        onMoveExercise(item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  }), [index, onMoveExercise, readOnly]);

  // Combined ref for drag and drop
  const combinedRef = (node: HTMLDivElement | null) => {
    dragRef(node);
    dropRef(node);
  };

  const handleDurationBlur = () => {
    const parsed = localDuration === '' ? null : parseInt(localDuration, 10);
    if (parsed !== exercise.duration_minutes) {
      onUpdateDuration(exercise.id, parsed);
    }
  };

  const handleNotesBlur = () => {
    if (localNotes !== (exercise.notes || '')) {
      onUpdateNotes(exercise.id, localNotes);
    }
    setIsEditingNotes(false);
  };

  // Safety check: ensure exercise.exercise exists (after hooks)
  if (!exercise.exercise) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">
          ⚠️ Dados do exercício incompletos
        </p>
      </div>
    );
  }

  // Create local variable for safe access
  const exerciseData = exercise.exercise;

  return (
    <div
      ref={combinedRef}
      className={cn(
        'group relative rounded-lg border bg-white p-4 transition-all',
        isDragging && 'opacity-50',
        isOver && 'border-blue-500 ring-2 ring-blue-200',
        !isDragging && !isOver && 'border-gray-200 hover:border-gray-300 hover:shadow-md',
        !readOnly && 'cursor-move'
      )}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Drag Handle */}
      {!readOnly && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
          <Icons.UI.DragHandle className="h-5 w-5" />
        </div>
      )}

      {/* Content */}
      <div className={cn('space-y-3', !readOnly && 'pl-6')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {index + 1}
              </span>
              <h4 className="truncate font-semibold text-gray-900">
                {exerciseData.name}
              </h4>
            </div>
            {exerciseData.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {exerciseData.description}
              </p>
            )}
          </div>

          {/* Remove Button */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => onRemove(exercise.id)}
              className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Remover exercício"
            >
              <Icons.Actions.Delete className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Category Badge */}
          {exerciseData.category && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                'bg-blue-100 text-blue-700'
              )}
            >
              📋 {exerciseData.category}
            </span>
          )}

          {/* Tag Count Badge */}
          {exerciseData.tag_ids && exerciseData.tag_ids.length > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                'bg-gray-100 text-gray-700'
              )}
            >
              🏷️ {exerciseData.tag_ids.length} {exerciseData.tag_ids.length === 1 ? 'tag' : 'tags'}
            </span>
          )}
        </div>

        {/* Duration Input */}
        <div className="flex items-center gap-3">
          <label htmlFor={`duration-${exercise.id}`} className="text-sm font-medium text-gray-700">
            <Icons.UI.Clock className="inline h-4 w-4 mr-1" />
            Duração:
          </label>
          <input
            id={`duration-${exercise.id}`}
            type="number"
            min="0"
            max="180"
            value={localDuration}
            onChange={(e) => setLocalDuration(e.target.value)}
            onBlur={handleDurationBlur}
            readOnly={readOnly}
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="min"
          />
          <span className="text-sm text-gray-600">minutos</span>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          {!isEditingNotes && !exercise.notes && !readOnly && (
            <button
              type="button"
              onClick={() => setIsEditingNotes(true)}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              + Adicionar observações
            </button>
          )}

          {(isEditingNotes || exercise.notes) && (
            <div>
              <label htmlFor={`notes-${exercise.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                <Icons.UI.FileText className="inline h-4 w-4 mr-1" />
                Observações:
              </label>
              <textarea
                id={`notes-${exercise.id}`}
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={handleNotesBlur}
                readOnly={readOnly}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Ex: Focar em passes curtos, trabalhar deslocamento lateral..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SessionExerciseDropZone({
  sessionId,
  plannedDuration,
  readOnly = false,
}: SessionExerciseDropZoneProps) {
  // ============================================================================
  // Hooks
  // ============================================================================

  const { data, isLoading, error } = useSessionExercises(sessionId);
  const bulkAddMutation = useBulkAddSessionExercises();
  const reorderMutation = useReorderSessionExercises();
  const updateMutation = useUpdateSessionExercise();
  const removeMutation = useRemoveSessionExercise();

  // Estado para modal de confirmação de remoção
  const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null);

  // ============================================================================
  // Drop Zone
  // ============================================================================

  const [{ isOver, canDrop }, dropRef] = useDrop<
    ExerciseDragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(() => ({
    accept: 'EXERCISE',
    canDrop: () => !readOnly,
    drop: (item) => {
      // Add exercise to end of list
      const nextIndex = data?.exercises.length || 0;

      bulkAddMutation.mutate({
        sessionId,
        data: {
          exercises: [{
            exercise_id: item.exercise.id,
            order_index: nextIndex,
            duration_minutes: null,
            notes: null,
          }],
        },
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [sessionId, data, bulkAddMutation, readOnly]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleMoveExercise = useCallback((fromIndex: number, toIndex: number) => {
    if (!data) return;

    const reorderedData = api.recomputeOrderAfterDrag(
      data.exercises,
      fromIndex,
      toIndex
    );

    reorderMutation.mutate({
      sessionId,
      data: { exercises: reorderedData },
    });
  }, [data, sessionId, reorderMutation]);

  const handleUpdateDuration = (exerciseId: string, minutes: number | null) => {
    updateMutation.mutate({
      exerciseId,
      sessionId,
      data: { duration_minutes: minutes },
    });
  };

  const handleUpdateNotes = (exerciseId: string, notes: string) => {
    updateMutation.mutate({
      exerciseId,
      sessionId,
      data: { notes },
    });
  };

  const handleRemove = (exerciseId: string) => {
    setExerciseToRemove(exerciseId);
  };

  const confirmRemove = () => {
    if (exerciseToRemove) {
      removeMutation.mutate({ exerciseId: exerciseToRemove, sessionId });
      setExerciseToRemove(null);
    }
  };

  // ============================================================================
  // Duration Check
  // ============================================================================

  const durationCheck = data
    ? api.checkDurationExceedance(data.exercises, plannedDuration)
    : { exceeded: false, message: null };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8">
        <div className="text-center">
          <Icons.UI.Loading className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Carregando exercícios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <Icons.Status.Error className="h-5 w-5" />
          <p className="font-medium">Erro ao carregar exercícios</p>
        </div>
        <p className="mt-1 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Tente recarregar a página'}
        </p>
      </div>
    );
  }

  const exercises = data?.exercises || [];
  const totalExercises = data?.total_exercises || 0;
  const totalDuration = data?.total_duration_minutes || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          <Icons.Training.Exercise className="inline h-5 w-5 mr-2" />
          Exercícios da Sessão
        </h3>
        <div className="text-sm text-gray-600">
          {totalExercises} {totalExercises === 1 ? 'exercício' : 'exercícios'} •{' '}
          <span className={cn(durationCheck.exceeded && 'font-semibold text-red-600')}>
            {totalDuration}min
          </span>
          {' '}/ {plannedDuration}min
        </div>
      </div>

      {/* Duration Warning */}
      {durationCheck.exceeded && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex items-start gap-2">
            <Icons.Status.Warning className="h-5 w-5 shrink-0 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Duração excedida
              </p>
              <p className="mt-0.5 text-sm text-yellow-700">
                {durationCheck.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        ref={dropRef as any}
        className={cn(
          'min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-colors',
          canDrop && isOver && 'border-blue-500 bg-blue-50',
          canDrop && !isOver && 'border-gray-300 bg-gray-50',
          !canDrop && 'border-gray-200 bg-white'
        )}
      >
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.Training.Exercise className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-600">
              {readOnly
                ? 'Nenhum exercício adicionado'
                : 'Arraste exercícios do Banco para adicionar'}
            </p>
            {!readOnly && (
              <p className="mt-1 text-xs text-gray-500">
                Ou clique em um exercício e depois aqui para adicioná-lo
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <DraggableSessionExerciseItem
                key={exercise.id}
                exercise={exercise}
                sessionId={sessionId}
                index={index}
                totalExercises={totalExercises}
                onMoveExercise={handleMoveExercise}
                onUpdateDuration={handleUpdateDuration}
                onUpdateNotes={handleUpdateNotes}
                onRemove={handleRemove}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {!readOnly && exercises.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          💡 Dica: Arraste os exercícios para reordenar • Clique no ícone de lixeira para remover
        </p>
      )}

      {/* Modal de confirmação de remoção */}
      <AlertDialog open={!!exerciseToRemove} onOpenChange={(open) => !open && setExerciseToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover exercício</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este exercício da sessão?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              onClick={confirmRemove}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Remover
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
