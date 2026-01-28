'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, MoreVertical, Pencil, Copy, Trash2, Settings } from 'lucide-react';
import { TrainingSessionsAPI, SessionTemplate } from '@/lib/api/trainings';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CreateTemplateModal } from '@/components/training/CreateTemplateModal';
import { EditTemplateModal } from '@/components/training/EditTemplateModal';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, string> = {
  target: '🎯',
  activity: '⚡',
  'bar-chart': '📊',
  shield: '🛡️',
  zap: '⚡',
  flame: '🔥',
};

const FOCUS_LABELS: Record<string, string> = {
  focus_attack_positional_pct: 'Atq. Posicional',
  focus_defense_positional_pct: 'Def. Posicional',
  focus_transition_offense_pct: 'Trans. Ofensiva',
  focus_transition_defense_pct: 'Trans. Defensiva',
  focus_attack_technical_pct: 'Téc. Ofensiva',
  focus_defense_technical_pct: 'Téc. Defensiva',
  focus_physical_pct: 'Físico',
};

export function ConfiguracoesClient() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<SessionTemplate | null>(null);

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['session-templates'],
    queryFn: () => TrainingSessionsAPI.getSessionTemplates(true),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sort: favorites first, then alphabetical
  const sortedTemplates = useMemo(() => {
    if (!templatesData?.templates) return [];
    return [...templatesData.templates].sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) {
        return a.is_favorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [templatesData]);

  // Mutations
  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => TrainingSessionsAPI.toggleTemplateFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-templates'] });
      toast.success('Favorito atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar favorito');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TrainingSessionsAPI.deleteSessionTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-templates'] });
      toast.success('Template deletado permanentemente');
      setDeletingTemplate(null);
    },
    onError: () => {
      toast.error('Erro ao deletar template');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      TrainingSessionsAPI.duplicateSessionTemplate(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-templates'] });
      toast.success('Template duplicado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao duplicar template');
    },
  });

  // Handlers
  const handleToggleFavorite = async (template: SessionTemplate) => {
    toggleFavoriteMutation.mutate(template.id);
  };

  const handleEdit = (template: SessionTemplate) => {
    setEditingTemplate(template);
  };

  const handleDuplicate = async (template: SessionTemplate) => {
    const newName = prompt('Nome da cópia:', `Cópia de ${template.name}`);
    if (!newName || newName.trim() === '') return;
    duplicateMutation.mutate({ id: template.id, newName: newName.trim() });
  };

  const handleDelete = (template: SessionTemplate) => {
    setDeletingTemplate(template);
  };

  const confirmDelete = () => {
    if (!deletingTemplate) return;
    deleteMutation.mutate(deletingTemplate.id);
  };

  // Get top 3 focus values for badges
  const getTopFocus = (template: SessionTemplate) => {
    const focuses = [
      { label: 'Atq. Pos', value: template.focus_attack_positional_pct },
      { label: 'Def. Pos', value: template.focus_defense_positional_pct },
      { label: 'Trans. Of', value: template.focus_transition_offense_pct },
      { label: 'Trans. Def', value: template.focus_transition_defense_pct },
      { label: 'Téc. Atq', value: template.focus_attack_technical_pct },
      { label: 'Téc. Def', value: template.focus_defense_technical_pct },
      { label: 'Físico', value: template.focus_physical_pct },
    ];
    return focuses
      .filter((f) => f.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };

  const total = templatesData?.total || 0;
  const limit = templatesData?.limit || 50;
  const isLimitReached = total >= limit;

  // Separate favorites from non-favorites
  const favorites = sortedTemplates.filter((t) => t.is_favorite);
  const nonFavorites = sortedTemplates.filter((t) => !t.is_favorite);

  return (
    <>
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Configurações de Treino
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Gerencie templates customizados de foco de treino
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Templates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {total}/{limit}
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                disabled={isLimitReached}
                className="bg-emerald-600 hover:bg-emerald-700"
                title={isLimitReached ? 'Limite de 50 templates atingido' : undefined}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Template
              </Button>
            </div>
          </div>
          {isLimitReached && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Limite de 50 templates atingido. Delete templates existentes para criar novos.
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedTemplates.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-gray-800">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum template criado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Crie seu primeiro template personalizado de treino
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </div>
        )}

        {/* Templates Table */}
        {!isLoading && sortedTemplates.length > 0 && (
          <div className="bg-white dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-12">
                      
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-16">
                      Ícone
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nome
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Descrição
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Focos Principais
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-20">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Favorites */}
                  {favorites.map((template) => (
                    <tr
                      key={template.id}
                      className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFavorite(template)}
                          className="transition-colors"
                        >
                          <Star
                            className={cn(
                              'w-5 h-5',
                              template.is_favorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            )}
                          />
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="text-3xl">{ICON_MAP[template.icon] || '📝'}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                          {template.description || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 flex-wrap">
                          {getTopFocus(template).map((focus, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                'px-2 py-1 rounded text-xs font-semibold',
                                idx === 0 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                idx === 1 &&
                                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                                idx === 2 &&
                                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                              )}
                            >
                              {focus.label} {focus.value.toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(template)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}

                  {/* Divider if there are both favorites and non-favorites */}
                  {favorites.length > 0 && nonFavorites.length > 0 && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="border-t-2 border-gray-300 dark:border-gray-700" />
                      </td>
                    </tr>
                  )}

                  {/* Non-favorites */}
                  {nonFavorites.map((template) => (
                    <tr
                      key={template.id}
                      className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFavorite(template)}
                          className="transition-colors"
                        >
                          <Star
                            className={cn(
                              'w-5 h-5',
                              template.is_favorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            )}
                          />
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="text-3xl">{ICON_MAP[template.icon] || '📝'}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                          {template.description || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 flex-wrap">
                          {getTopFocus(template).map((focus, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                'px-2 py-1 rounded text-xs font-semibold',
                                idx === 0 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                idx === 1 &&
                                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                                idx === 2 &&
                                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                              )}
                            >
                              {focus.label} {focus.value.toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(template)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['session-templates'] });
        }}
      />

      {editingTemplate && (
        <EditTemplateModal
          isOpen={!!editingTemplate}
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={() => {
            setEditingTemplate(null);
            queryClient.invalidateQueries({ queryKey: ['session-templates'] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar template permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação NÃO pode ser desfeita. O template será removido permanentemente do sistema.
              Sessões de treino passadas que usaram este template não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
