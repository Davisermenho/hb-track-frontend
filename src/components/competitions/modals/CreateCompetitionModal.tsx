/**
 * CreateCompetitionModal - Modal para criar/editar competição
 * 
 * Features:
 * - Formulário de criação/edição
 * - Validação de campos obrigatórios
 * - Feedback visual de loading/erro
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCompetitionsContext } from '@/context/CompetitionsContext';
import { useCreateCompetition, useUpdateCompetition, useCompetition } from '@/hooks/useCompetitions';
import { CompetitionCreate, CompetitionUpdate } from '@/lib/api/competitions';

const COMPETITION_KINDS = [
  { value: 'official', label: 'Oficial' },
  { value: 'friendly', label: 'Amistoso' },
  { value: 'training-game', label: 'Jogo-Treino' },
];

interface CreateCompetitionModalProps {
  editId?: string;
}

export default function CreateCompetitionModal({ editId }: CreateCompetitionModalProps) {
  const { 
    isCreateModalOpen, 
    closeCreateModal,
    isEditMode,
    editingCompetitionId 
  } = useCompetitionsContext();
  
  const competitionId = editId || editingCompetitionId;
  const isEditing = isEditMode || !!editId;
  
  const { data: competition } = useCompetition(isEditing ? competitionId : null);
  
  const createMutation = useCreateCompetition();
  const updateMutation = useUpdateCompetition();
  
  const [formData, setFormData] = useState<CompetitionCreate>({
    name: '',
    kind: 'official',
  });
  const [isDirty, setIsDirty] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const effectiveFormData = !isEditing || isDirty || !competition
    ? formData
    : {
        name: competition.name,
        kind: competition.kind || 'official',
      };

  const handleClose = () => {
    setFormData({
      name: '',
      kind: 'official',
    });
    setErrors({});
    setIsDirty(false);
    closeCreateModal();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!effectiveFormData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (effectiveFormData.name.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    if (!effectiveFormData.kind) {
      newErrors.kind = 'Tipo é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      if (isEditing && competitionId) {
        const updateData: CompetitionUpdate = {
          name: effectiveFormData.name,
          kind: effectiveFormData.kind,
        };
        await updateMutation.mutateAsync({ 
          id: competitionId, 
          data: updateData 
        });
      } else {
        await createMutation.mutateAsync(effectiveFormData);
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar competição:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-lg transform overflow-hidden rounded-2xl 
                        bg-white dark:bg-gray-800 p-6 shadow-xl transition-all relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Competição' : 'Nova Competição'}
              </h2>
              <button
                onClick={closeCreateModal}
                type="button"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-500 
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 
                            border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error instanceof Error ? error.message : 'Erro ao salvar competição'}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={effectiveFormData.name}
                      onChange={handleChange}
                      placeholder="Ex: Campeonato Estadual 2025"
                      className={`w-full px-4 py-2 rounded-lg border 
                               ${errors.name 
                                 ? 'border-red-300 dark:border-red-600' 
                                 : 'border-gray-300 dark:border-gray-600'}
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               placeholder-gray-400 focus:ring-2 focus:ring-amber-500 
                               focus:border-transparent transition-colors`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Kind */}
                  <div>
                    <label 
                      htmlFor="kind" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Tipo *
                    </label>
                    <select
                      id="kind"
                      name="kind"
                      value={effectiveFormData.kind}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg border 
                               ${errors.kind 
                                 ? 'border-red-300 dark:border-red-600' 
                                 : 'border-gray-300 dark:border-gray-600'}
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-amber-500 focus:border-transparent 
                               transition-colors cursor-pointer`}
                    >
                      {COMPETITION_KINDS.map((kind) => (
                        <option key={kind.value} value={kind.value}>
                          {kind.label}
                        </option>
                      ))}
                    </select>
                    {errors.kind && (
                      <p className="mt-1 text-sm text-red-500">{errors.kind}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                               text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                               dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 
                               text-white font-medium transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center gap-2"
                    >
                      {isLoading && (
                        <svg 
                          className="animate-spin h-4 w-4" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          />
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      {isLoading 
                        ? (isEditing ? 'Salvando...' : 'Criando...') 
                        : (isEditing ? 'Salvar' : 'Criar Competição')
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
  );
}
