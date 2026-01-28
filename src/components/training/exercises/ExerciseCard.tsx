/**
 * ExerciseCard Component
 * Step 20: Frontend de Exercícios
 * 
 * Card responsivo para exibir exercício no grid
 * - Thumbnail YouTube
 * - Tags coloridas
 * - Botão favorito
 * - Click abre modal de detalhes
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { Exercise, ExerciseTag } from '@/lib/api/exercises';
import { Icons } from '@/design-system/icons';

interface ExerciseCardProps {
  exercise: Exercise;
  tags?: ExerciseTag[];
  isFavorite?: boolean;
  onToggleFavorite?: (exerciseId: string, currentState: boolean) => void;
  onClick?: () => void;
  isDragging?: boolean;
}

const TAG_COLORS: Record<string, string> = {
  // Pais
  Tático: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Técnico: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Físico: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Fundamentos: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  // Default
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function ExerciseCard({
  exercise,
  tags = [],
  isFavorite = false,
  onToggleFavorite,
  onClick,
  isDragging = false,
}: ExerciseCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(exercise.id, isFavorite);
  };

  const getTagColor = (tagName: string): string => {
    // Buscar tag pai para determinar cor
    const parentTag = tags.find(t => t.name === tagName || t.children?.some(c => c.name === tagName));
    if (parentTag) {
      return TAG_COLORS[parentTag.name] || TAG_COLORS.default;
    }
    return TAG_COLORS.default;
  };

  const exerciseTags = tags.filter(t => exercise.tag_ids.includes(t.id));

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white dark:bg-gray-800 
        rounded-lg border border-gray-200 dark:border-gray-700
        overflow-hidden cursor-pointer
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-lg hover:scale-[1.02]'}
      `}
    >
      {/* YouTube Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
        {exercise.youtube_embed_url || exercise.media_url ? (
          <Image
            src={`https://img.youtube.com/vi/${extractVideoId(exercise.media_url || exercise.youtube_embed_url || '')}/mqdefault.jpg`}
            alt={exercise.name}
            width={320}
            height={180}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icons.Training.Exercise className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`
              absolute top-2 right-2 p-2 rounded-full
              bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
              border border-gray-200 dark:border-gray-700
              transition-all duration-200
              hover:scale-110 hover:bg-white dark:hover:bg-gray-800
              ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
            `}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            {isFavorite ? (
              <Icons.UI.Star className="w-5 h-5 fill-current" />
            ) : (
              <Icons.UI.Star className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Play Overlay */}
        {exercise.media_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 min-h-[3rem]">
          {exercise.name}
        </h3>

        {/* Description */}
        {exercise.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {exercise.description}
          </p>
        )}

        {/* Tags */}
        {exerciseTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {exerciseTags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className={`
                  px-2 py-1 rounded-md text-xs font-medium
                  ${getTagColor(tag.name)}
                `}
              >
                {tag.name}
              </span>
            ))}
            {exerciseTags.length > 3 && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                +{exerciseTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Category Badge */}
        {exercise.category && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Icons.UI.Tag className="w-3 h-3" />
            <span>{exercise.category}</span>
          </div>
        )}
      </div>

      {/* Drag Handle (visible quando draggable) */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg" />
      )}
    </div>
  );
}

/**
 * Compact variant - para uso em listas menores
 */
export function ExerciseCardCompact({
  exercise,
  tags = [],
  isFavorite = false,
  onToggleFavorite,
  onClick,
}: Omit<ExerciseCardProps, 'isDragging'>) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(exercise.id, isFavorite);
  };

  const exerciseTags = tags.filter(t => exercise.tag_ids.includes(t.id));

  return (
    <div
      onClick={onClick}
      className="
        group flex items-center gap-3 p-3 
        bg-white dark:bg-gray-800 
        rounded-lg border border-gray-200 dark:border-gray-700
        cursor-pointer hover:shadow-md transition-all
      "
    >
      {/* Thumbnail pequeno */}
      <div className="relative w-20 h-14 bg-gray-100 dark:bg-gray-900 rounded overflow-hidden flex-shrink-0">
        {exercise.media_url ? (
          <Image
            src={`https://img.youtube.com/vi/${extractVideoId(exercise.media_url)}/default.jpg`}
            alt={exercise.name}
            width={80}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icons.Training.Exercise className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
          {exercise.name}
        </h4>
        {exerciseTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {exerciseTags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Favorite */}
      {onToggleFavorite && (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`
            p-1.5 rounded-full transition-colors
            ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
          `}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          {isFavorite ? (
            <Icons.UI.Star className="w-4 h-4 fill-current" />
          ) : (
            <Icons.UI.Star className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Skeleton loader
 */
export function ExerciseCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Thumbnail skeleton */}
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state
 */
export function ExerciseCardEmpty({ message = 'Nenhum exercício encontrado' }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <Icons.Training.Exercise className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// ==================== HELPERS ====================

function extractVideoId(url: string): string {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}
