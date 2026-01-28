/**
 * VirtualizedExerciseGrid
 * 
 * Virtual scrolling grid for large exercise lists (>100 items).
 * Uses react-window FixedSizeGrid for performance optimization.
 * 
 * Features:
 * - Dynamic column count (1-3) based on viewport width
 * - Responsive breakpoints
 * - Drag-and-drop compatible
 * - Lazy rendering (only visible items)
 * - Smooth scrolling
 * 
 * @module VirtualizedExerciseGrid
 */

'use client';

import { useEffect, useState } from 'react';
import { FixedSizeGrid } from 'react-window';
import type { Exercise } from '@/lib/api/exercises';
import { DraggableExerciseCard } from './DraggableExerciseCard';

// ============================================================================
// Types
// ============================================================================

interface VirtualizedExerciseGridProps {
  exercises: Exercise[];
  favorites: Set<string>;
  onToggleFavorite: (exerciseId: string) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    exercises: Exercise[];
    columnCount: number;
    favorites: Set<string>;
    onToggleFavorite: (exerciseId: string) => void;
    onEdit: (exercise: Exercise) => void;
    onDelete: (exerciseId: string) => void;
  };
}

// ============================================================================
// Constants
// ============================================================================

const CARD_WIDTH = 380; // Card width in px
const CARD_HEIGHT = 280; // Card height in px
const GAP = 24; // Gap between cards in px

// ============================================================================
// Helper: Calculate column count based on viewport width
// ============================================================================

function getColumnCount(width: number): number {
  if (width < 768) return 1; // Mobile: 1 column
  if (width < 1280) return 2; // Tablet: 2 columns
  return 3; // Desktop: 3 columns
}

// ============================================================================
// Cell Renderer
// ============================================================================

function Cell({ columnIndex, rowIndex, style, data }: CellProps) {
  const { exercises, columnCount, favorites, onToggleFavorite, onEdit, onDelete } = data;
  
  const index = rowIndex * columnCount + columnIndex;
  
  // Empty cell (beyond array length)
  if (index >= exercises.length) {
    return null;
  }
  
  const exercise = exercises[index];
  
  return (
    <div
      style={{
        ...style,
        padding: GAP / 2,
      }}
    >
      <DraggableExerciseCard
        exercise={exercise}
        isFavorite={favorites.has(exercise.id)}
        onToggleFavorite={onToggleFavorite}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VirtualizedExerciseGrid({
  exercises,
  favorites,
  onToggleFavorite,
  onEdit,
  onDelete,
}: VirtualizedExerciseGridProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // ============================================================================
  // Responsive Dimensions
  // ============================================================================
  
  useEffect(() => {
    function updateDimensions() {
      const container = document.getElementById('exercise-grid-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.min(window.innerHeight - 300, 800), // Max 800px height
        });
      }
    }
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // ============================================================================
  // Grid Calculations
  // ============================================================================
  
  const columnCount = getColumnCount(dimensions.width);
  const rowCount = Math.ceil(exercises.length / columnCount);
  
  const columnWidth = Math.floor(dimensions.width / columnCount);
  const rowHeight = CARD_HEIGHT + GAP;
  
  // ============================================================================
  // Render
  // ============================================================================
  
  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div id="exercise-grid-container" className="w-full h-[600px]">
        <div className="flex items-center justify-center h-full text-gray-500">
          Carregando grid...
        </div>
      </div>
    );
  }
  
  return (
    <div id="exercise-grid-container" className="w-full">
      <FixedSizeGrid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={dimensions.height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={dimensions.width}
        itemData={{
          exercises,
          columnCount,
          favorites,
          onToggleFavorite,
          onEdit,
          onDelete,
        }}
        overscanRowCount={2} // Render 2 extra rows above/below for smooth scrolling
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700"
      >
        {Cell}
      </FixedSizeGrid>
      
      {/* Info */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        💡 Renderização otimizada para {exercises.length} exercícios • Mostrando {Math.min(columnCount * 5, exercises.length)} por vez
      </div>
    </div>
  );
}
