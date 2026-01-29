/**
 * CreateExerciseModal Component
 * Modal para criar novo exercício no banco (staff apenas)
 * 
 * Features:
 * - Formulário com validação completa
 * - Upload de YouTube URL com preview
 * - Seleção de tags hierárquicas
 * - Categoria dropdown
 * - Descrição opcional com textarea
 */

'use client';

import { useState, useMemo } from 'react';
import { X, Youtube, Tag as TagIcon, FileText } from 'lucide-react';
import { useCreateExercise, useExerciseTags } from '@/hooks/useExercises';
import { ExerciseInput } from '@/lib/api/exercises';
import { validateExerciseInput, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/api/exercises';

interface CreateExerciseModalProps {
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

export function CreateExerciseModal({ isOpen, onClose, onSuccess }: CreateExerciseModalProps) {
  const createMutation = useCreateExercise();
  const { data: tags = [], isLoading: tagsLoading } = useExerciseTags();

  const [formData, setFormData] = useState<ExerciseInput>(() => ({
    name: '',
    description: '',
    tag_ids: [],
    category: '',
    media_url: '',
  }));

  const [errors, setErrors] = useState<Partial<Record<keyof ExerciseInput, string>>>({});

  // Update YouTube preview usando useMemo em vez de useEffect
  const youtubePreviewData = useMemo(() => {
    if (!formData.media_url) return { preview: null, error: undefined };
    
    const videoId = extractYouTubeVideoId(formData.media_url);
    if (videoId) {
      return { 
        preview: getYouTubeEmbedUrl(formData.media_url), 
        error: undefined 
      };
    } else if (formData.media_url.trim()) {
      return { 
        preview: null, 
        error: 'URL do YouTube inválida' 
      };
    }
    return { preview: null, error: undefined };
  }, [formData.media_url]);

  const errorsWithMedia = useMemo(
    () => ({ ...errors, media_url: youtubePreviewData.error }),
    [errors, youtubePreviewData.error]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // Preparar dados (remover campos vazios)
    const dataToSubmit: ExerciseInput = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      tag_ids: formData.tag_ids,
      category: formData.category || undefined,
      media_url: formData.media_url?.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(dataToSubmit);
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
    if (createMutation.isPending) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Criar Novo Exercício</h2>
          <button
            onClick={handleCancel}
            disabled={createMutation.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
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
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
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
            {tagsLoading ? (
              <p className="text-sm text-gray-500">Carregando tags...</p>
            ) : tags.length === 0 ? (
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
                        disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
            />
            {errorsWithMedia.media_url && <p className="mt-1 text-sm text-red-600">{errorsWithMedia.media_url}</p>}

            {/* Preview */}
            {youtubePreviewData.preview && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={youtubePreviewData.preview}
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
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Exercício'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
