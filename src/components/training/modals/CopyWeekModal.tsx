/**
 * CopyWeekModal
 * 
 * Modal para copiar uma semana completa de treinos
 * - Seleção de semana origem
 * - Seleção de semana destino
 * - Preview de sessões a copiar
 * - Validação de conflitos
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { copyWeek } from '@/lib/api/trainings';
import { toast } from 'sonner';

interface CopyWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
}

export function CopyWeekModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
}: CopyWeekModalProps) {
  const [sourceWeek, setSourceWeek] = useState<string>('');
  const [targetWeek, setTargetWeek] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setSourceWeek('');
      setTargetWeek('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Calcula inicio da semana a partir de uma data
  const getWeekStart = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Ajusta para segunda-feira
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    return monday.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceWeek || !targetWeek) {
      toast.error('Selecione ambas as semanas');
      return;
    }

    const sourceStart = getWeekStart(sourceWeek);
    const targetStart = getWeekStart(targetWeek);

    if (sourceStart === targetStart) {
      toast.error('As semanas de origem e destino devem ser diferentes');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await copyWeek({
        team_id: teamId,
        source_week_start: sourceStart,
        target_week_start: targetStart,
      });

      toast.success(
        `${result.sessions_copied} sessões copiadas com sucesso!`,
        {
          description: result.message,
        }
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao copiar semana:', error);
      toast.error(
        error.message || 'Erro ao copiar semana. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f0f0f] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Copiar Semana
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Duplique sessões de uma semana para outra
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info Alert */}
          <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Como funciona:</p>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li>Todas as sessões da semana origem serão copiadas</li>
                <li>As datas serão ajustadas para a semana destino</li>
                <li>Status será &ldquo;draft&rdquo; (rascunho)</li>
                <li>Presenças e wellness não serão copiados</li>
              </ul>
            </div>
          </div>

          {/* Semana Origem */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Semana de Origem
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={sourceWeek}
                onChange={(e) => setSourceWeek(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#0f0f0f] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-slate-900 dark:text-white"
                placeholder="Selecione a semana origem"
              />
            </div>
            {sourceWeek && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Início da semana: {getWeekStart(sourceWeek)}
              </p>
            )}
          </div>

          {/* Semana Destino */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Semana de Destino
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={targetWeek}
                onChange={(e) => setTargetWeek(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#0f0f0f] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-slate-900 dark:text-white"
                placeholder="Selecione a semana destino"
              />
            </div>
            {targetWeek && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Início da semana: {getWeekStart(targetWeek)}
              </p>
            )}
          </div>

          {/* Success Preview */}
          {sourceWeek && targetWeek && getWeekStart(sourceWeek) !== getWeekStart(targetWeek) && (
            <div className="flex gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800 dark:text-emerald-200">
                <p className="font-medium">Pronto para copiar</p>
                <p className="text-xs mt-1">
                  Semana de {new Date(getWeekStart(sourceWeek)).toLocaleDateString('pt-BR')} 
                  {' → '}
                  Semana de {new Date(getWeekStart(targetWeek)).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button
            onClick={handleSubmit}
            disabled={!sourceWeek || !targetWeek || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Copiando...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Semana
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
