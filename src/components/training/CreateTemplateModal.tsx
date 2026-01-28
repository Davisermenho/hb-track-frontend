'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { TrainingSessionsAPI, SessionTemplateCreate } from '@/lib/api/trainings';
import { computeFocusSummary } from '@/lib/training/focus';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SliderRange as Slider } from '@/components/ui/slider-range';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FocusDistributionPieChart } from './charts/FocusDistributionPieChart';
import { cn } from '@/lib/utils';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ICONS = [
  { value: 'target' as const, emoji: '🎯', label: 'Alvo' },
  { value: 'activity' as const, emoji: '⚡', label: 'Atividade' },
  { value: 'bar-chart' as const, emoji: '📊', label: 'Gráfico' },
  { value: 'shield' as const, emoji: '🛡️', label: 'Escudo' },
  { value: 'zap' as const, emoji: '⚡', label: 'Raio' },
  { value: 'flame' as const, emoji: '🔥', label: 'Fogo' },
];

const FOCUS_FIELDS = [
  { key: 'focus_attack_positional_pct' as const, label: 'Ataque Posicional' },
  { key: 'focus_defense_positional_pct' as const, label: 'Defesa Posicional' },
  { key: 'focus_transition_offense_pct' as const, label: 'Transição Ofensiva' },
  { key: 'focus_transition_defense_pct' as const, label: 'Transição Defensiva' },
  { key: 'focus_attack_technical_pct' as const, label: 'Técnica Ofensiva' },
  { key: 'focus_defense_technical_pct' as const, label: 'Técnica Defensiva' },
  { key: 'focus_physical_pct' as const, label: 'Físico' },
];

export function CreateTemplateModal({ isOpen, onClose, onSuccess }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<SessionTemplateCreate['icon']>('target');
  const [isFavorite, setIsFavorite] = useState(false);
  const [focus, setFocus] = useState({
    focus_attack_positional_pct: 0,
    focus_defense_positional_pct: 0,
    focus_transition_offense_pct: 0,
    focus_transition_defense_pct: 0,
    focus_attack_technical_pct: 0,
    focus_defense_technical_pct: 0,
    focus_physical_pct: 0,
  });

  // Compute focus validation
  const focusStatus = computeFocusSummary(focus, { mode: 'lenient', justification: '' });
  const total = focusStatus.totalFocusRounded;

  const createMutation = useMutation({
    mutationFn: (data: SessionTemplateCreate) => TrainingSessionsAPI.createSessionTemplate(data),
    onSuccess: () => {
      toast.success('Template criado com sucesso');
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail?.message || 'Erro ao criar template';
      toast.error(message);
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('target');
    setIsFavorite(false);
    setFocus({
      focus_attack_positional_pct: 0,
      focus_defense_positional_pct: 0,
      focus_transition_offense_pct: 0,
      focus_transition_defense_pct: 0,
      focus_attack_technical_pct: 0,
      focus_defense_technical_pct: 0,
      focus_physical_pct: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length === 0) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (name.trim().length > 100) {
      toast.error('Nome deve ter no máximo 100 caracteres');
      return;
    }

    const focusValidation = computeFocusSummary(focus, { mode: 'lenient', justification: '' });
    if (focusValidation.totalFocusRounded > 120) {
      toast.error(`Total de focos (${focusValidation.totalFocusRounded}%) excede 120%`);
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      is_favorite: isFavorite,
      ...focus,
    });
  };

  const handleFocusChange = (key: keyof typeof focus, value: number) => {
    setFocus((prev) => ({ ...prev, [key]: value }));
  };

  // Usar computeFocusSummary para validação
  const focusSummary = computeFocusSummary(focus);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        data-testid="create-template-modal"
        role="dialog"
        aria-labelledby="create-template-title"
        className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-[#0f0f0f] rounded-xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 id="create-template-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100">Criar Template</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Form */}
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  data-testid="template-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Treino Tático Ofensivo"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-500">{name.length}/100 caracteres</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo deste template..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">{description.length}/500 caracteres</p>
              </div>

              {/* Icon Selection */}
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="grid grid-cols-3 gap-3">
                  {ICONS.map((iconOption) => (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() => setIcon(iconOption.value)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                        icon === iconOption.value
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      )}
                    >
                      <span className="text-4xl">{iconOption.emoji}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{iconOption.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox id="favorite" checked={isFavorite} onCheckedChange={setIsFavorite} />
                <Label htmlFor="favorite" className="cursor-pointer">
                  ⭐ Marcar como favorito
                </Label>
              </div>

              {/* Focus Sliders */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Distribuição de Focos (%)</h3>
                {FOCUS_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.key} className="text-sm">
                        {field.label}
                      </Label>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[50px] text-right">
                        {focus[field.key].toFixed(0)}%
                      </span>
                    </div>
                    <input 
                      type="number" 
                      name={field.key}
                      value={focus[field.key]}
                      onChange={(e) => handleFocusChange(field.key, Number(e.target.value))}
                      className="sr-only"
                      min={0}
                      max={100}
                      step={5}
                      aria-label={field.label}
                    />
                    <Slider
                      id={field.key}
                      value={[focus[field.key]]}
                      onValueChange={(value) => handleFocusChange(field.key, value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-5 lg:sticky lg:top-0">
              {/* Validation Badge */}
              <div
                className={cn(
                  'p-4 rounded-lg border-2 text-center',
                  focusStatus.color === 'green' && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                  focusStatus.color === 'yellow' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
                  focusStatus.color === 'red' && 'border-red-500 bg-red-50 dark:bg-red-900/20'
                )}
              >
                <p className="text-2xl font-bold mb-1">
                  {total.toFixed(1)}%
                </p>
                <p
                  className={cn(
                    'text-sm font-medium',
                    focusStatus.color === 'green' && 'text-green-700 dark:text-green-300',
                    focusStatus.color === 'yellow' && 'text-yellow-700 dark:text-yellow-300',
                    focusStatus.color === 'red' && 'text-red-700 dark:text-red-300'
                  )}
                >
                  {focusStatus.message}
                </p>
              </div>

              {/* Pizza Chart */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  Visualização
                </h4>
                <FocusDistributionPieChart
                  focus={focus}
                  total={total}
                  size="md"
                  showLegend={false}
                  className="h-[300px]"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              data-testid="submit-template-button"
              disabled={createMutation.isPending || !focusStatus.canSubmit || name.trim().length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
