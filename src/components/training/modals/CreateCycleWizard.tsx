/**
 * CreateCycleWizard
 * 
 * Wizard multi-step para criar Macro/Mesociclos com:
 * - 4 etapas com progressbar horizontal
 * - Draft persistente em localStorage
 * - Validações específicas por etapa
 * - Preview de hierarquia para mesociclos
 * 
 * @author HB Track Team
 * @step Step 10 - FECHAMENTO_TRAINING.md
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Calendar, Target, Layers, ChevronRight, Trash2 } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebouncedCallback } from 'use-debounce';
import { Icons } from '@/design-system/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { trainingsService, type CycleCreate, type CycleType, type TrainingCycle } from '@/lib/api/trainings';

// ============================================================================
// TYPES
// ============================================================================

interface CreateCycleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
}

interface FormData {
  type: CycleType | '';
  name: string;
  objective: string;
  start_date: string;
  end_date: string;
  parent_cycle_id: string;
}

const DRAFT_KEY = 'cycle-draft';

const INITIAL_FORM_DATA: FormData = {
  type: '',
  name: '',
  objective: '',
  start_date: '',
  end_date: '',
  parent_cycle_id: '',
};

const CYCLE_TYPES = [
  {
    value: 'macro' as const,
    icon: '📅',
    label: 'Macrociclo',
    description: 'Temporada completa',
    duration: '6-12 meses',
    color: 'blue',
  },
  {
    value: 'meso' as const,
    icon: '📆',
    label: 'Mesociclo',
    description: 'Período de treinamento',
    duration: '4-6 semanas',
    color: 'emerald',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateCycleWizard({ isOpen, onClose, onSuccess, teamId }: CreateCycleWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // Query para buscar macrociclos (quando tipo = meso)
  const { data: macrocycles } = useQuery({
    queryKey: ['cycles', 'macro', teamId],
    queryFn: () => trainingsService.getCycles({ team_id: teamId, type: 'macro', status: 'active' }),
    enabled: isOpen && formData.type === 'meso',
  });

  // Mutation para criar ciclo
  const createMutation = useMutation({
    mutationFn: (data: CycleCreate) => trainingsService.createCycle(data),
    onSuccess: () => {
      toast.success('Ciclo criado com sucesso!');
      localStorage.removeItem(DRAFT_KEY);
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep(0);
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar ciclo');
    },
  });

  // ============================================================================
  // DRAFT PERSISTENCE
  // ============================================================================

  // Salvar draft com debounce
  const saveDraft = useDebouncedCallback((data: FormData) => {
    if (data.type || data.name || data.objective || data.start_date || data.end_date) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    }
  }, 500);

  // Restaurar draft ao montar
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && isOpen) {
      try {
        const parsed = JSON.parse(draft);
        const restoreData = () => setFormData(parsed);
        restoreData();
        toast.info('📝 Rascunho restaurado', {
          description: 'Continue de onde parou',
        });
      } catch (error) {
        console.error('Erro ao restaurar draft:', error);
      }
    }
  }, [isOpen]);

  // Auto-save quando formData mudar
  useEffect(() => {
    saveDraft(formData);
  }, [formData, saveDraft]);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const durationDays = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return 0;
    try {
      return differenceInDays(parseISO(formData.end_date), parseISO(formData.start_date)) + 1;
    } catch {
      return 0;
    }
  }, [formData.start_date, formData.end_date]);

  const selectedParent = useMemo(() => {
    return macrocycles?.find(m => m.id === formData.parent_cycle_id);
  }, [macrocycles, formData.parent_cycle_id]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const canProceedStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!formData.type;
      case 1:
        return formData.name.trim().length > 0 && formData.objective.trim().length > 0;
      case 2:
        return !!formData.start_date && !!formData.end_date && durationDays > 0;
      case 3:
        if (formData.type === 'meso') {
          return !!formData.parent_cycle_id;
        }
        return true;
      default:
        return false;
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNext = () => {
    if (!canProceedStep(currentStep)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (currentStep === 3) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = () => {
    const payload: CycleCreate = {
      team_id: teamId,
      type: formData.type as CycleType,
      start_date: formData.start_date,
      end_date: formData.end_date,
      objective: formData.objective.trim() || undefined,
      notes: undefined,
      status: 'active',
    };

    if (formData.type === 'meso' && formData.parent_cycle_id) {
      payload.parent_cycle_id = formData.parent_cycle_id;
    }

    createMutation.mutate(payload);
  };

  const handleDiscardDraft = () => {
    if (confirm('Descartar rascunho? Todas as alterações não salvas serão perdidas.')) {
      localStorage.removeItem(DRAFT_KEY);
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep(0);
      toast.success('Rascunho descartado');
    }
  };

  const handleClose = () => {
    if (formData.type || formData.name || formData.objective) {
      if (confirm('Fechar sem salvar? O rascunho será mantido.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  const steps = [
    { label: 'Tipo', icon: Layers },
    { label: 'Informações', icon: Target },
    { label: 'Período', icon: Calendar },
    { label: 'Hierarquia', icon: ChevronRight },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={cn(
        "relative w-full bg-white dark:bg-[#0f0f0f] shadow-2xl border border-slate-200 dark:border-slate-800",
        "rounded-none sm:rounded-xl overflow-hidden flex flex-col",
        "fixed inset-0 sm:relative sm:inset-auto",
        "sm:max-w-4xl sm:max-h-[90vh]"
      )} data-testid="create-cycle-wizard">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Criar Novo Ciclo
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Etapa {currentStep + 1} de 4
            </p>
          </div>

          {/* Discard Button */}
          {(formData.type || formData.name) && (
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="mr-3 text-sm text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Descartar rascunho
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index <= currentStep
                  ? "w-12 bg-emerald-500"
                  : "w-8 bg-slate-300 dark:bg-slate-700"
              )}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Step 0: Tipo */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Selecione o tipo de ciclo
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Escolha entre macrociclo (temporada completa) ou mesociclo (período específico)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CYCLE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    data-testid={`cycle-type-${type.value}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all text-left",
                      "hover:shadow-lg hover:scale-105",
                      formData.type === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                    )}
                  >
                    <div className="text-4xl mb-3">{type.icon}</div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {type.label}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {type.description}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 rounded">
                      {type.duration}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Informações */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Informações do ciclo
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Defina o nome e objetivo principal
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome do {formData.type === 'macro' ? 'Macrociclo' : 'Mesociclo'} *
                  </Label>
                  <Input
                    id="name"
                    data-testid="cycle-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`Ex: ${formData.type === 'macro' ? 'Temporada 2026' : 'Preparação Física'}`}
                    className="mt-1.5"
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formData.name.length}/100 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="objective" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Objetivo *
                  </Label>
                  <Textarea
                    id="objective"
                    data-testid="cycle-objective-input"
                    value={formData.objective}
                    onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Descreva o objetivo principal deste ciclo..."
                    rows={5}
                    className="mt-1.5"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                    {formData.objective.length}/500 caracteres
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Período */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Defina o período
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Escolha as datas de início e término
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Data de Início *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    data-testid="cycle-start-date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="end_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Data de Término *
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    data-testid="cycle-end-date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    min={formData.start_date}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Duration Badge */}
              {durationDays > 0 && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icons.UI.Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Duração: <strong>{durationDays} dias</strong>
                    </span>
                  </div>
                </div>
              )}

              {durationDays < 0 && formData.end_date && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icons.Status.Error className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      A data de término deve ser posterior à data de início
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Hierarquia */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {formData.type === 'meso' ? 'Vincule a um Macrociclo' : 'Revisão Final'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formData.type === 'meso' 
                    ? 'Selecione o macrociclo pai (obrigatório)' 
                    : 'Confirme os dados antes de criar'}
                </p>
              </div>

              {formData.type === 'meso' ? (
                <>
                  <div>
                    <Label htmlFor="parent" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Macrociclo Pai *
                    </Label>
                    <select
                      id="parent"
                      data-testid="cycle-parent-select"
                      value={formData.parent_cycle_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_cycle_id: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Selecione um macrociclo...</option>
                      {macrocycles?.map((macro) => (
                        <option key={macro.id} value={macro.id}>
                          {format(parseISO(macro.start_date), 'dd/MM/yyyy', { locale: ptBR })} - {format(parseISO(macro.end_date), 'dd/MM/yyyy', { locale: ptBR })} • {macro.objective || 'Sem objetivo'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preview Hierarquia */}
                  {selectedParent && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Preview da Hierarquia
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">📅 Macrociclo:</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {format(parseISO(selectedParent.start_date), 'dd/MM/yyyy')} - {format(parseISO(selectedParent.end_date), 'dd/MM/yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm ml-6">
                          <ChevronRight className="w-4 h-4 text-emerald-500" />
                          <span className="text-slate-600 dark:text-slate-400">📆 Mesociclo:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {formData.name || 'Novo Mesociclo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Tipo
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          📅 Macrociclo
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Nome
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {formData.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Período
                        </dt>
                        <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          {format(parseISO(formData.start_date), 'dd/MM/yyyy')} - {format(parseISO(formData.end_date), 'dd/MM/yyyy')}
                          <span className="ml-2 text-xs text-slate-500">({durationDays} dias)</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Objetivo
                        </dt>
                        <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          {formData.objective}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || createMutation.isPending}
            data-testid="cycle-back"
          >
            Voltar
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceedStep(currentStep) || createMutation.isPending}
            className="min-w-32"
            data-testid="cycle-next"
          >
            {createMutation.isPending ? (
              <>
                <Icons.UI.Loading className="w-4 h-4 animate-spin mr-2" />
                Criando...
              </>
            ) : currentStep === 3 ? (
              'Criar Ciclo'
            ) : (
              'Próximo'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
