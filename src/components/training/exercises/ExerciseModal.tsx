/**
 * ExerciseModal Component
 * Step 20: Frontend de Exercícios
 * 
 * Modal para visualização completa do exercício:
 * - YouTube iframe player
 * - Detalhes completos
 * - Tags hierárquicas
 * - Botão favorito
 * - Edit/Delete para staff
 */

'use client';

import React from 'react';
import { Exercise, ExerciseTag, getYouTubeEmbedUrl } from '@/lib/api/exercises';
import { Icons } from '@/design-system/icons';
import AppModal from '@/components/ui/AppModal';
import { Button } from '@/components/ui/Button';

interface ExerciseModalProps {
  exercise: Exercise | null;
  tags?: ExerciseTag[];
  isFavorite?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (exerciseId: string, currentState: boolean) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exerciseId: string) => void;
  canEdit?: boolean; // Staff only
}

export function ExerciseModal({
  exercise,
  tags = [],
  isFavorite = false,
  isOpen,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
  canEdit = false,
}: ExerciseModalProps) {
  if (!exercise) return null;

  const embedUrl = exercise.youtube_embed_url || getYouTubeEmbedUrl(exercise.media_url || '');
  const exerciseTags = tags.filter(t => exercise.tag_ids.includes(t.id));

  const handleFavoriteClick = () => {
    onToggleFavorite?.(exercise.id, isFavorite);
  };

  const handleEditClick = () => {
    onEdit?.(exercise);
  };

  const handleDeleteClick = () => {
    if (confirm('Tem certeza que deseja excluir este exercício?')) {
      onDelete?.(exercise.id);
      onClose();
    }
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="xl" title={exercise.name}>
      <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
        {/* Header actions */}
        <div className="flex items-center justify-end gap-2 mb-4">
          {/* Favorite button */}
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteClick}
              className={isFavorite ? 'text-yellow-500' : 'text-gray-400'}
            >
              {isFavorite ? (
                <Icons.UI.Star className="w-5 h-5 fill-current" />
              ) : (
                <Icons.UI.Star className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Edit/Delete buttons - Staff only */}
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={handleEditClick}>
                <Icons.Actions.Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
                <Icons.Actions.Delete className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6 mt-4">
          {/* YouTube Player */}
          {embedUrl && (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                title={exercise.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {/* Category Badge */}
          {exercise.category && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Icons.UI.Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {exercise.category}
              </span>
            </div>
          )}

          {/* Tags */}
          {exerciseTags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {exerciseTags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} allTags={tags} />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {exercise.category && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Categoria</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {exercise.category}
                </p>
              </div>
            )}
          </div>

          {/* Created info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            Criado em {new Date(exercise.created_at).toLocaleDateString('pt-BR')}
            {exercise.updated_at && exercise.updated_at !== exercise.created_at && (
              <> · Atualizado em {new Date(exercise.updated_at).toLocaleDateString('pt-BR')}</>
            )}
          </div>
        </div>
      </div>
    </AppModal>
  );
}

// ==================== TAG BADGE ====================

interface TagBadgeProps {
  tag: ExerciseTag;
  allTags: ExerciseTag[];
}

function TagBadge({ tag, allTags }: TagBadgeProps) {
  // Buscar tag pai para determinar cor
  const parentTag = tag.parent_tag_id
    ? allTags.find(t => t.id === tag.parent_tag_id)
    : tag;

  const colorMap: Record<string, string> = {
    Tático: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Técnico: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Físico: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Fundamentos: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const colorClass = parentTag
    ? colorMap[parentTag.name] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${colorClass}`}>
      {tag.name}
      {tag.description && (
        <span className="ml-1.5 text-xs opacity-75">· {tag.description}</span>
      )}
    </span>
  );
}

// ==================== SKELETON ====================

export function ExerciseModalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4" />
      <div className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
      </div>
    </div>
  );
}
