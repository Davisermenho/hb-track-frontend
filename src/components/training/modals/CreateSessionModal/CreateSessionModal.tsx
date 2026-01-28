/**
 * CreateSessionModal (Novo treino)
 *
 * Modal rápido para criar um draft de treino:
 * - Seleções rápidas e sem bloqueio de campos não obrigatórios
 * - Defaults baseados no último treino da equipe
 * - Fluxos "Salvar rascunho" e "Salvar e continuar"
 */

'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { Icons } from '@/design-system/icons';
import { cn } from '@/lib/utils';
import { TrainingSessionsAPI, type SessionCreate, type TrainingSession } from '@/lib/api/trainings';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { Strategy } from '@phosphor-icons/react';
import type { CreateSessionModalProps } from './types';

const SESSION_TYPES = [
  { value: 'quadra', label: 'Técnico/Tático' },
  { value: 'fisico', label: 'Físico' },
  { value: 'reuniao', label: 'Regenerativo' },
  { value: 'video', label: 'Vídeo' },
  { value: 'teste', label: 'Jogo' },
] as const;

const DURATION_PRESETS = [60, 90, 120] as const;

const OBJECTIVE_TAGS = [
  'Defesa 6:0',
  'Contra-ataque',
  'Finalização de pontas',
  'Transição ofensiva',
  'Transição defensiva',
  'Jogo reduzido',
] as const;

export function CreateSessionModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  initialDate,
  microcycleId,
  recentSessions,
}: CreateSessionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('16:30');
  const [durationPreset, setDurationPreset] =
    useState<typeof DURATION_PRESETS[number] | 'custom'>(90);
  const [customDuration, setCustomDuration] = useState('90');
  const [location, setLocation] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [objective, setObjective] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSession, setLatestSession] = useState<TrainingSession | null>(null);
  const [defaultsReady, setDefaultsReady] = useState(false);
  const defaultsAppliedRef = useRef(false);

  const durationValue =
    durationPreset === 'custom' ? Number(customDuration) : durationPreset;
  const hasValidDuration =
    durationPreset !== 'custom' || (customDuration.trim() && Number(customDuration) > 0);
  const canSubmit = Boolean(selectedDate && selectedTime && hasValidDuration && objective.trim() && (() => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const sessionDateTime = setMinutes(setHours(selectedDate, hours), minutes);
    return sessionDateTime > new Date();
  })());

  const fallbackLatestSession = useMemo(() => {
    if (!recentSessions?.length) return null;
    return [...recentSessions].sort(
      (a, b) => new Date(b.session_at).getTime() - new Date(a.session_at).getTime()
    )[0];
  }, [recentSessions]);

  useEffect(() => {
    if (!isOpen) {
      setDefaultsReady(false);
      return;
    }

    if (!teamId) {
      setLatestSession(null);
      setDefaultsReady(true);
      return;
    }

    let isActive = true;
    setDefaultsReady(false);

    const syncLatestSession = async () => {
      try {
        const response = await TrainingSessionsAPI.listSessions({
          team_id: teamId,
          limit: 1,
        });
        if (!isActive) return;
        setLatestSession(response.items[0] ?? null);
      } catch (error) {
        if (!isActive) return;
        console.error('Erro ao buscar ultimo treino:', error);
        setLatestSession(null);
      } finally {
        if (isActive) {
          setDefaultsReady(true);
        }
      }
    };

    syncLatestSession();

    return () => {
      isActive = false;
    };
  }, [isOpen, teamId]);

  const effectiveLatestSession = latestSession || fallbackLatestSession;

  const defaultTime = effectiveLatestSession
    ? format(new Date(effectiveLatestSession.session_at), 'HH:mm')
    : '16:30';
  const defaultDuration = effectiveLatestSession?.duration_planned_minutes || 90;

  const timeOptions = useMemo(() => {
    const base = Array.from({ length: 24 }, (_, hour) =>
      ['00', '30'].map((minute) => `${String(hour).padStart(2, '0')}:${minute}`)
    ).flat();
    if (!base.includes(defaultTime)) base.push(defaultTime);
    
    // Se a data selecionada for hoje, filtrar horários passados
    if (selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      if (selectedDateStr === today) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        return base.filter(time => {
          const [hour, minute] = time.split(':').map(Number);
          return hour > currentHour || (hour === currentHour && minute > currentMinute);
        });
      }
    }
    
    return base.sort();
  }, [defaultTime, selectedDate]);

  const locationHistory = useMemo(() => {
    const history =
      recentSessions
        ?.map((session) => session.location?.trim())
        .filter((loc): loc is string => Boolean(loc))
        .filter((loc, index, arr) => arr.indexOf(loc) === index) || [];

    const latestLocation = effectiveLatestSession?.location?.trim();
    if (latestLocation && !history.includes(latestLocation)) {
      history.unshift(latestLocation);
    }

    return history;
  }, [recentSessions, effectiveLatestSession]);

  const favoriteLocation = useMemo(() => {
    if (!recentSessions?.length) return null;
    const counts = new Map<string, number>();
    recentSessions.forEach((session) => {
      const loc = session.location?.trim();
      if (!loc) return;
      counts.set(loc, (counts.get(loc) || 0) + 1);
    });
    let top: string | null = null;
    let topCount = 0;
    counts.forEach((count, loc) => {
      if (count > topCount) {
        topCount = count;
        top = loc;
      }
    });
    return topCount > 1 ? top : null;
  }, [recentSessions]);

  const lastLocation = effectiveLatestSession?.location?.trim() || null;
  const showLastLocation = lastLocation && lastLocation !== favoriteLocation;
  const recentLocations = locationHistory
    .filter((loc) => loc !== favoriteLocation && loc !== lastLocation)
    .slice(0, 5);

  useEffect(() => {
    if (!isOpen) {
      defaultsAppliedRef.current = false;
      return;
    }

    if (!defaultsReady || defaultsAppliedRef.current) return;

    setSelectedDate(initialDate ? new Date(initialDate) : new Date());
    setSelectedTime(defaultTime);
    setDurationPreset(
      [60, 90, 120].includes(defaultDuration)
        ? (defaultDuration as typeof DURATION_PRESETS[number])
        : 'custom'
    );
    setCustomDuration(String(defaultDuration));
    setLocation('');
    setSessionType('');
    setObjective('');
    defaultsAppliedRef.current = true;
  }, [isOpen, defaultsReady, initialDate, defaultTime, defaultDuration]);

  const handleSubmit = async (asDraft: boolean = true) => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const sessionDateTime = setMinutes(setHours(selectedDate, hours), minutes);

      // Validar se a data/hora não é no passado
      if (sessionDateTime <= new Date()) {
        throw new Error('Não é possível criar treinos com data/hora no passado.');
      }

      if (!teamId) {
        throw new Error('Equipe não encontrada. Selecione uma equipe.');
      }
      if (!user?.organization_id) {
        throw new Error('Organização não identificada. Faça login novamente.');
      }

      const sessionData: SessionCreate = {
        organization_id: user.organization_id,
        team_id: teamId,
        session_at: sessionDateTime.toISOString(),
        duration_planned_minutes: hasValidDuration && durationValue > 0 ? durationValue : undefined,
        location: location.trim() ? location.trim() : undefined,
        session_type: sessionType || undefined,
        main_objective: objective.trim() ? objective.trim() : undefined,
        microcycle_id: microcycleId || undefined,
      };

      const created = await TrainingSessionsAPI.createSession(sessionData);
      onSuccess?.(created, asDraft ? 'close' : 'continue');
      onClose();
    } catch (error) {
      console.error('Error creating session:', error);
      const message =
        (error as any)?.response?.data?.detail ||
        (error as Error)?.message ||
        'Não foi possível criar o treino.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg mx-auto pt-0 pl-0 pr-0 gap-3" onPointerDownOutside={(e) => e.preventDefault()}>
        <header className="h-16 shrink-0 border-b border-slate-700 bg-slate-900 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3 min-w-0 pl-6">
            <Strategy className="h-6 w-6 text-white" />
            <span className="font-medium text-white">Criar Nova Sessão de Treino</span>
          </div>
          <DialogClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none text-slate-400 hover:text-white pr-6">
            <X className="h-4 w-4" />
          </DialogClose>
        </header>
        <VisuallyHidden>
          <DialogTitle>Criar nova sessão de Treino</DialogTitle>
        </VisuallyHidden>

        <div className="px-6 py-3">
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs">Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <Icons.UI.Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, 'dd/MM', { locale: ptBR })
                    ) : (
                      <span>Selecionar</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs">Horário *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-xs">Duração (minutos)</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => {
                const active = durationPreset === preset;
                return (
                  <Button
                    key={preset}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    onClick={() => {
                      setDurationPreset(preset);
                      setCustomDuration(String(preset));
                    }}
                    className={cn(
                      active ? 'bg-slate-900 text-white hover:bg-black h-5 text-[10px]' : 'text-slate-600 h-5 text-[10px]'
                    )}
                  >
                    <Icons.UI.Clock className="h-1 w-1" />
                    {preset} min
                  </Button>
                );
              })}
              <Button
                type="button"
                variant={durationPreset === 'custom' ? 'default' : 'outline'}
                onClick={() => setDurationPreset('custom')}
                className={cn(
                  durationPreset === 'custom'
                    ? 'bg-slate-900 text-white hover:bg-black h-5 text-[10px]'
                    : 'text-slate-600 h-5 text-[10px]'
                )}
              >
                Outro...
              </Button>
            </div>
            {durationPreset === 'custom' && (
              <Input
                id="duration"
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="90"
                min="15"
                max="240"
                step="15"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-xs">Local</Label>
            <div className="flex flex-wrap gap-2">
              {favoriteLocation && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(favoriteLocation)}
                  className="h-5 text-[10px]"
                >
                  <Icons.UI.Star className="h-1 w-1" />
                  {favoriteLocation}
                </Button>
              )}
              {showLastLocation && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => lastLocation && setLocation(lastLocation)}
                  className="h-5 text-[10px]"
                >
                  <Icons.UI.MapPin className="h-1 w-1" />
                </Button>
              )}
              {recentLocations.slice(0, 3).map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(suggestion)}
                  className="h-5 text-[10px]"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Quadra 1, Ginásio principal..."
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-xs">Tipo</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
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

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-xs">Objetivo *</Label>
            <Input
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Defesa 6:0 e transição rápida"
              maxLength={120}
              className="h-8"
            />
            <div className="flex flex-wrap gap-2">
              {OBJECTIVE_TAGS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setObjective((prev) => (prev ? `${prev} • ${tag}` : tag));
                  }}
                  className="h-5 text-[10px]"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 h-7 text-xs"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || !canSubmit}
              className="flex-1 h-7 text-xs"
            >
              Salvar rascunho
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !canSubmit}
              className="flex-1 gap-1 h-7 text-xs"
            >
              Salvar e continuar
              <Icons.Navigation.Arrow className="h-3 w-3" />
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
