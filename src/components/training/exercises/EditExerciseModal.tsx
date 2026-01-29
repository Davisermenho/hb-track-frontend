/**
 * EditExerciseModal Component
 * Modal para editar exercício existente (staff apenas)
 * 
 * Features:
 * - Carrega dados do exercício
 * - Formulário pré-preenchido com validação
 * - Preview de YouTube URL
 * - Edição de tags hierárquicas
 * - Categoria dropdown
 */

'use client';

import { useState, useMemo } from 'react';
import { X, Youtube, Tag as TagIcon, Loader2 } from 'lucide-react';
import { useUpdateExercise, useExerciseTags, useExercise } from '@/hooks/useExercises';
import { ExerciseInput, Exercise, ExerciseTag } from '@/lib/api/exercises';
import { validateExerciseInput, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/api/exercises';

interface EditExerciseModalProps {
  exerciseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Aquecimento',
  'Técnica',
  'Tática',
  'Físico',
  'Finalização',
  'Defesa',
  'Transição',
  'Jogo Coletivo',
  'Posse de Bola',
  'Bola Parada',
  'Outro',
];

type UpdateExerciseMutation = ReturnType<typeof useUpdateExercise>;

function EditExerciseForm({
  exercise,
  exerciseId,
  tags,
  updateMutation,
  onClose,
  onSuccess,
}: {
  exercise: Exercise;
  exerciseId: string;
  tags: ExerciseTag[];
  updateMutation: UpdateExerciseMutation;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [formData, setFormData] = useState<ExerciseInput>(() => ({
    name: exercise.name,
    description: exercise.description || '',
    tag_ids: exercise.tag_ids,
    category: exercise.category || '',
    media_url: exercise.media_url || '',
  }));

  const [errors, setErrors] = useState<Partial<Record<keyof ExerciseInput, string>>>({});

  const youtubeData = useMemo(() => {
    if (!formData.media_url) return { preview: null, error: undefined };
    const videoId = extractYouTubeVideoId(formData.media_url);
    if (videoId) {
      return { preview: getYouTubeEmbedUrl(formData.media_url), error: undefined };
    }
    return { preview: null, error: formData.media_url.trim() ? 'URL do YouTube inválida' : undefined };
  }, [formData.media_url]);

  const errorsWithMedia = useMemo(
    () => ({ ...errors, media_url: youtubeData.error }),
    [errors, youtubeData.error]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exerciseId) return;

    // Validação
    const validationErrors = validateExerciseInput(formData);
    if (validationErrors.length > 0) {
      // Converter array de strings para objeto de erros
      const errorObj: Partial<Record<keyof ExerciseInput, string>> = {};
      validationErrors.forEach(err => {
        if (err.includes('Nome')) errorObj.name = err;
        if (err.includes('tag')) errorObj.tag_ids = err;
        if (err.includes('YouTube')) errorObj.media_url = err;
      });
      setErrors(errorObj);
      return;
    }

    // Preparar dados (apenas campos modificados)
    const dataToSubmit: Partial<ExerciseInput> = {};
    if (formData.name.trim() !== exercise?.name) {
      dataToSubmit.name = formData.name.trim();
    }
    if ((formData.description?.trim() || '') !== (exercise?.description || '')) {
      dataToSubmit.description = formData.description?.trim() || undefined;
    }
    if (JSON.stringify(formData.tag_ids.sort()) !== JSON.stringify(exercise?.tag_ids.sort())) {
      dataToSubmit.tag_ids = formData.tag_ids;
    }
    if ((formData.category || '') !== (exercise?.category || '')) {
      dataToSubmit.category = formData.category || undefined;
    }
    if ((formData.media_url?.trim() || '') !== (exercise?.media_url || '')) {
      dataToSubmit.media_url = formData.media_url?.trim() || undefined;
    }

    // Se nada mudou, apenas fechar
    if (Object.keys(dataToSubmit).length === 0) {
      onClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: exerciseId, data: dataToSubmit });
      onSuccess?.();
      onClose();
    } catch (error) {
      // Erro já tratado no hook (toast)
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleCancel = () => {
    if (updateMutation.isPending) return;
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome do Exercício <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errorsWithMedia.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Rondo 4x2, Finalização em velocidade..."
          disabled={updateMutation.isPending}
        />
        {errorsWithMedia.name && <p className="mt-1 text-sm text-red-600">{errorsWithMedia.name}</p>}
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Descreva o exercício, objetivos, variações..."
          disabled={updateMutation.isPending}
        />
      </div>

      {/* Categoria */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Categoria
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={updateMutation.isPending}
        >
          <option value="">Selecione uma categoria</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <TagIcon className="w-4 h-4 inline mr-1" />
          Tags
        </label>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma tag disponível</p>
        ) : (
          <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {tags
                .filter((tag) => tag.is_active)
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    disabled={updateMutation.isPending}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.tag_ids.includes(tag.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
            </div>
          </div>
        )}
        {errorsWithMedia.tag_ids && <p className="mt-1 text-sm text-red-600">{errorsWithMedia.tag_ids}</p>}
      </div>

      {/* YouTube URL */}
      <div>
        <label htmlFor="media_url" className="block text-sm font-medium text-gray-700 mb-1">
          <Youtube className="w-4 h-4 inline mr-1" />
          URL do YouTube
        </label>
        <input
          type="url"
          id="media_url"
          value={formData.media_url}
          onChange={(e) => setFormData((prev) => ({ ...prev, media_url: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errorsWithMedia.media_url ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={updateMutation.isPending}
        />
        {errorsWithMedia.media_url && <p className="mt-1 text-sm text-red-600">{errorsWithMedia.media_url}</p>}

        {/* Preview */}
        {youtubeData.preview && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={youtubeData.preview}
                title="YouTube video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={updateMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

export function EditExerciseModal({ exerciseId, isOpen, onClose, onSuccess }: EditExerciseModalProps) {
  const updateMutation = useUpdateExercise();
  const { data: tags = [], isLoading: tagsLoading } = useExerciseTags();
  const { data: exercise, isLoading: exerciseLoading } = useExercise(exerciseId);

  if (!isOpen || !exerciseId) return null;

  const isLoading = exerciseLoading || tagsLoading || !exercise;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Editar Exercício</h2>
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-600">Carregando exercício...</p>
          </div>
        ) : (
          <EditExerciseForm
            key={exercise.id}
            exercise={exercise}
            exerciseId={exerciseId}
            tags={tags}
            updateMutation={updateMutation}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}
