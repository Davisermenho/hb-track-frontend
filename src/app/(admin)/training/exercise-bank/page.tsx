/**
 * Exercise Bank Page
 * Step 20: Frontend de Exercícios
 *
 * Página principal do banco de exercícios com:
 * - Grid de ExerciseCard
 * - Filtros (busca, tags, categoria, favoritos)
 * - Paginação
 * - Modal de detalhes
 *
 * Movido de (protected) para (admin) para manter consistência
 * do layout com TrainingTabs
 */

'use client';

import React, { useState } from 'react';
import { useExerciseFilters, useDeleteExercise } from '@/hooks/useExercises';
import { ExerciseCard, ExerciseCardSkeleton, ExerciseCardEmpty } from '@/components/training/exercises/ExerciseCard';
import { DraggableExerciseCard } from '@/components/training/exercises/DraggableExerciseCard';
import { VirtualizedExerciseGrid } from '@/components/training/exercises/VirtualizedExerciseGrid';
import { ExerciseModal } from '@/components/training/exercises/ExerciseModal';
import { CreateExerciseModal } from '@/components/training/exercises/CreateExerciseModal';
import { EditExerciseModal } from '@/components/training/exercises/EditExerciseModal';
import { TagFilter } from '@/components/training/exercises/TagFilter';
import { Exercise } from '@/lib/api/exercises';
import { Icons } from '@/design-system/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/context/AuthContext';

export default function ExerciseBankPage() {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editExerciseId, setEditExerciseId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  const deleteMutation = useDeleteExercise();

  const {
    exercises,
    totalCount,
    totalPages,
    tags,
    filters,
    page,
    perPage,
    updateFilters,
    clearFilters,
    goToPage,
    setPerPage,
    isFavorite,
    toggleFavorite,
    isLoading,
    isFetching,
    isError,
  } = useExerciseFilters();

  // Sync debounced search com filters
  React.useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch, updateFilters]);

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedExercise(null), 300);
  };

  const handleEditClick = (exercise: Exercise) => {
    setEditExerciseId(exercise.id);
  };

  const handleDeleteClick = async (exerciseId: string) => {
    if (confirm('Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita.')) {
      await deleteMutation.mutateAsync(exerciseId);
      if (isModalOpen && selectedExercise?.id === exerciseId) {
        setIsModalOpen(false);
        setSelectedExercise(null);
      }
    }
  };

  const handleCreateSuccess = () => {
    // Query invalidation já é feita pelo hook
  };

  const handleEditSuccess = () => {
    setEditExerciseId(null);
  };

  // Check if user is staff (treinador, coordenador, dirigente)
  const isStaff = user?.role && ['treinador', 'coordenador', 'dirigente', 'superadmin'].includes(user.role);

  const hasActiveFilters =
    (filters.tag_ids && filters.tag_ids.length > 0) ||
    filters.search ||
    filters.category ||
    filters.favorites_only;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Banco de Exercícios
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isLoading ? 'Carregando...' : `${totalCount} exercícios disponíveis`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <Icons.Status.Close className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            )}

            {isStaff && (
              <Button variant="default" onClick={() => setIsCreateModalOpen(true)}>
                <Icons.Actions.Add className="w-4 h-4 mr-2" />
                Novo Exercício
              </Button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Buscar
              </label>
              <div className="relative">
                <Icons.Actions.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nome ou descrição..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Categoria
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => updateFilters({ category: e.target.value || undefined })}
                className="
                  w-full px-3 py-2
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
              >
                <option value="">Todas as categorias</option>
                <option value="aquecimento">Aquecimento</option>
                <option value="técnico">Técnico</option>
                <option value="tático">Tático</option>
                <option value="físico">Físico</option>
                <option value="jogo">Jogo</option>
              </select>
            </div>

            {/* Favorites Toggle */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                id="favorites-only"
                checked={filters.favorites_only}
                onChange={(e) => updateFilters({ favorites_only: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="favorites-only"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <Icons.UI.Star className="w-4 h-4 inline-block mr-1 text-yellow-500" />
                Apenas Favoritos
              </label>
            </div>

            {/* Tag Filter */}
            <TagFilter
              tags={tags}
              selectedTagIds={filters.tag_ids || []}
              onSelectedChange={(tagIds) => updateFilters({ tag_ids: tagIds })}
              tagOperator={filters.tag_operator}
              onOperatorChange={(op) => updateFilters({ tag_operator: op })}
              showOperator={(filters.tag_ids && filters.tag_ids.length > 1) || false}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Info */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isFetching && !isLoading && (
                  <Icons.UI.Loading className="w-4 h-4 inline-block mr-2 animate-spin" />
                )}
                Mostrando {exercises.length} de {totalCount} exercícios
              </p>

              {/* Per Page Selector */}
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="
                  px-3 py-1.5 text-sm
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
              >
                <option value={12}>12 por página</option>
                <option value={20}>20 por página</option>
                <option value={40}>40 por página</option>
              </select>
            </div>

            {/* Exercise Grid */}
            {isError ? (
              <div className="text-center py-12">
                <Icons.Status.Error className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">
                  Erro ao carregar exercícios. Tente novamente.
                </p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: perPage }).map((_, i) => (
                  <ExerciseCardSkeleton key={i} />
                ))}
              </div>
            ) : exercises.length === 0 ? (
              <ExerciseCardEmpty
                message={
                  hasActiveFilters
                    ? 'Nenhum exercício encontrado com os filtros aplicados'
                    : 'Nenhum exercício disponível'
                }
              />
            ) : totalCount > 100 ? (
              // Virtualized grid for large datasets (Step 21)
              <VirtualizedExerciseGrid
                exercises={exercises}
                favorites={new Set(Array.from({ length: exercises.length }, (_, i) => exercises[i].id).filter(id => isFavorite(id)))}
                onToggleFavorite={(id) => toggleFavorite(id, !isFavorite(id))}
                onEdit={(ex) => handleEditClick(ex)}
                onDelete={(id) => handleDeleteClick(id)}
              />
            ) : (
              // Standard grid for smaller datasets
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {exercises.map((exercise) => (
                  <DraggableExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={isFavorite(exercise.id)}
                    onToggleFavorite={(id) => toggleFavorite(id, !isFavorite(id))}
                    onEdit={(ex) => handleEditClick(ex)}
                    onDelete={(id) => handleDeleteClick(id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || isLoading}
                >
                  <Icons.Navigation.Left className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;

                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages || isLoading}
                >
                  <Icons.Navigation.Right className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Exercise Modal */}
        <ExerciseModal
          exercise={selectedExercise}
          tags={tags}
          isFavorite={selectedExercise ? isFavorite(selectedExercise.id) : false}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onToggleFavorite={toggleFavorite}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          canEdit={isStaff}
        />

        {/* Create Exercise Modal */}
        <CreateExerciseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Edit Exercise Modal */}
        <EditExerciseModal
          exerciseId={editExerciseId}
          isOpen={!!editExerciseId}
          onClose={() => setEditExerciseId(null)}
          onSuccess={handleEditSuccess}
        />
      </div>
  );
}
