/**
 * EditSessionModal
 *
 * Modal para editar uma sessão de treino existente:
 * - Carregamento imediato por cima da agenda
 * - Campos editáveis baseados no status da sessão
 * - Validação e salvamento otimizado
 */

'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/design-system/icons';
import { cn } from '@/lib/utils';
import { TrainingSessionsAPI, type SessionUpdate, type TrainingSession } from '@/lib/api/trainings';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

interface EditSessionModalProps {
  session: TrainingSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (session: TrainingSession) => void;
}

const SESSION_TYPES = [
  { value: 'quadra', label: 'Técnico/Tático' },
  { value: 'fisico', label: 'Físico' },
  { value: 'reuniao', label: 'Regenerativo' },
  { value: 'video', label: 'Vídeo' },
  { value: 'teste', label: 'Jogo' },
] as const;

const DURATION_PRESETS = [60, 90, 120] as const;

export function EditSessionModal({ session, isOpen, onClose, onSuccess }: EditSessionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    session_at: '',
    session_type: '',
    main_objective: '',
    secondary_objective: '',
    duration_planned_minutes: 60,
    location: '',
    notes: '',
  });

  // Reset form when session changes
  useEffect(() => {
    if (session) {
      setFormData({
        session_at: session.session_at,
        session_type: session.session_type || '',
        main_objective: session.main_objective || '',
        secondary_objective: session.secondary_objective || '',
        duration_planned_minutes: session.duration_planned_minutes || 60,
        location: session.location || '',
        notes: session.notes || '',
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setIsLoading(true);
    try {
      const updateData: SessionUpdate = {
        session_at: formData.session_at,
        session_type: formData.session_type,
        main_objective: formData.main_objective,
        secondary_objective: formData.secondary_objective,
        duration_planned_minutes: formData.duration_planned_minutes,
        location: formData.location,
        notes: formData.notes,
      };

      const updatedSession = await TrainingSessionsAPI.updateSession(session.id, updateData);

      toast.success('Sessão atualizada com sucesso!');

      onSuccess?.(updatedSession);
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Erro ao atualizar sessão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Sessão</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Sessão */}
          <div className="space-y-2">
            <Label htmlFor="session_type">Tipo de Sessão</Label>
            <Select
              value={formData.session_type}
              onValueChange={(value) => handleInputChange('session_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objetivo Principal */}
          <div className="space-y-2">
            <Label htmlFor="main_objective">Objetivo Principal</Label>
            <Input
              id="main_objective"
              value={formData.main_objective}
              onChange={(e) => handleInputChange('main_objective', e.target.value)}
              placeholder="Ex: Treino técnico de finalização"
            />
          </div>

          {/* Objetivo Secundário */}
          <div className="space-y-2">
            <Label htmlFor="secondary_objective">Objetivo Secundário</Label>
            <Input
              id="secondary_objective"
              value={formData.secondary_objective}
              onChange={(e) => handleInputChange('secondary_objective', e.target.value)}
              placeholder="Objetivo secundário (opcional)"
            />
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <div className="flex gap-2">
              {DURATION_PRESETS.map((duration) => (
                <Button
                  key={duration}
                  type="button"
                  variant={formData.duration_planned_minutes === duration ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputChange('duration_planned_minutes', duration)}
                >
                  {duration}
                </Button>
              ))}
              <Input
                type="number"
                value={formData.duration_planned_minutes}
                onChange={(e) => handleInputChange('duration_planned_minutes', parseInt(e.target.value) || 60)}
                className="w-20"
                min="15"
                max="300"
              />
            </div>
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ex: Quadra 1"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                'Salvando...'
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}