/**
 * SessionEditClient
 *
 * Editor de sessão em página inteira (draft/scheduled).
 * - Salvamento manual
 * - Tabs internas
 * - Botão "Agendar treino" com validação
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDrag } from 'react-dnd';
import { Loader2, Save, Check, X, AlertCircle, CheckCircle, AlertTriangle, CloudDownload, Search, GripVertical, Plus, Trash, Target, Crosshair, Shield } from 'lucide-react';
import Lottie from 'lottie-react';
import { useToast } from '@/context/ToastContext';
import { useTeamSeason } from '@/context/TeamSeasonContext';
import { useSessionDetail, useDeleteSession } from '@/lib/hooks/useSessions';
import { TrainingSessionsAPI, type SessionUpdate } from '@/lib/api/trainings';
import { computeFocusSummary, type ApiFocusInput } from '@/lib/training/focus';
import { useExercises } from '@/hooks/useExercises';
import { useSessionTemplates } from '@/hooks/useSessionTemplates';
import { useAddSessionExercise, useSessionExercises } from '@/hooks/useSessionExercises';
import type { Exercise } from '@/lib/api/exercises';
import { FocusDistributionEditor } from '@/components/training/focus/FocusDistributionEditor';
import { SessionExerciseDropZone } from '@/components/training/exercises/SessionExerciseDropZone';
import { Icons } from '@/design-system/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import successAnimation from '@/assets/lottie/check-success.json';

const SESSION_TYPES = [
  { value: 'quadra', label: 'Técnico/Tático' },
  { value: 'fisico', label: 'Físico' },
  { value: 'reuniao', label: 'Regenerativo' },
  { value: 'video', label: 'Vídeo' },
  { value: 'teste', label: 'Jogo' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  pending_review: 'Revisão pendente',
  readonly: 'Congelado',
};

const BALANCED_TEMPLATE: ApiFocusInput = {
  focus_attack_positional_pct: 15,
  focus_defense_positional_pct: 15,
  focus_transition_offense_pct: 15,
  focus_transition_defense_pct: 15,
  focus_attack_technical_pct: 15,
  focus_defense_technical_pct: 15,
  focus_physical_pct: 10,
};

const OFFENSIVE_TEMPLATE: ApiFocusInput = {
  focus_attack_positional_pct: 30,
  focus_defense_positional_pct: 10,
  focus_transition_offense_pct: 20,
  focus_transition_defense_pct: 5,
  focus_attack_technical_pct: 20,
  focus_defense_technical_pct: 5,
  focus_physical_pct: 10,
};

const RECOVERY_TEMPLATE: ApiFocusInput = {
  focus_attack_positional_pct: 10,
  focus_defense_positional_pct: 10,
  focus_transition_offense_pct: 10,
  focus_transition_defense_pct: 10,
  focus_attack_technical_pct: 10,
  focus_defense_technical_pct: 10,
  focus_physical_pct: 40,
};

const FOCUS_TEMPLATES = [
  { id: 'balanced', label: 'Padrão 100%', values: BALANCED_TEMPLATE },
  { id: 'offensive', label: 'Foco ofensivo', values: OFFENSIVE_TEMPLATE },
  { id: 'recovery', label: 'Recuperação', values: RECOVERY_TEMPLATE },
] as const;

const FOCUS_SEGMENTS = [
  { key: 'focus_attack_positional_pct', label: 'Ataque Posicional', color: 'bg-emerald-500' },
  { key: 'focus_defense_positional_pct', label: 'Defesa Posicional', color: 'bg-sky-500' },
  { key: 'focus_transition_offense_pct', label: 'Transição Ofensiva', color: 'bg-indigo-500' },
  { key: 'focus_transition_defense_pct', label: 'Transição Defensiva', color: 'bg-violet-500' },
  { key: 'focus_attack_technical_pct', label: 'Ataque Técnico', color: 'bg-amber-500' },
  { key: 'focus_defense_technical_pct', label: 'Defesa Técnica', color: 'bg-rose-500' },
  { key: 'focus_physical_pct', label: 'Físico', color: 'bg-lime-500' },
] as const;

const NOTE_SUGGESTIONS = [
  'Focar na postura do pivô',
  'Observar retorno defensivo do ponta esquerda',
  'Ajustar comunicação entre 2 e 3',
  'Trabalhar transição rápida após perda',
] as const;

type ExerciseView = 'favorites' | 'recent' | 'search';

interface SessionEditClientProps {
  sessionId: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

// Funções helper para a badge consolidada de status
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary';
    case 'scheduled': return 'default';
    case 'in_progress': return 'default';
    case 'pending_review': return 'secondary';
    case 'readonly': return 'outline';
    default: return 'outline';
  }
};

const getStatusClasses = (status: string) => {
  const classes = {
    draft: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    scheduled: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    pending_review: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    readonly: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return classes[status as keyof typeof classes] || classes.draft;
};

export default function SessionEditClient({
  sessionId,
  onClose,
  onSuccess
}: SessionEditClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { selectedTeam } = useTeamSeason();
  const {
    session,
    isLoading,
    error,
    updateSession,
    refetch,
  } = useSessionDetail(sessionId, true);
  const { data: templatesData, isLoading: templatesLoading, error: templatesError } = useSessionTemplates();
  const deleteSessionMutation = useDeleteSession();
  const isDraft = session?.status === 'draft';
  const isScheduled = session?.status === 'scheduled';
  const [now, setNow] = useState(Date.now());
  const scheduledLockTime = session
    ? new Date(session.session_at).getTime() - 10 * 60 * 1000
    : null;
  const isEditLocked = Boolean(isScheduled && scheduledLockTime && now > scheduledLockTime);
  const isEditable = Boolean(isDraft || (isScheduled && !isEditLocked));
  const isDateTimeLocked = Boolean(isScheduled);
  const [activeTab, setActiveTab] = useState<'overview' | 'focus' | 'exercises' | 'notes'>('overview');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [form, setForm] = useState({
    date: '',
    time: '',
    session_type: '',
    main_objective: '',
    secondary_objective: '',
    location: '',
    duration_planned_minutes: '',
  });
  const [initialData, setInitialData] = useState<{
    form: typeof form;
    notes: string;
    focusValues: ApiFocusInput;
    justification: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [focusValues, setFocusValues] = useState<ApiFocusInput>({});
  const [justification, setJustification] = useState('');
  const [focusMode, setFocusMode] = useState<'template' | 'manual'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const [exerciseView, setExerciseView] = useState<ExerciseView>('favorites');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [pendingAdds, setPendingAdds] = useState(0);

  const sessionExercisesQuery = useSessionExercises(sessionId, { enabled: !!session });
  const totalExercises = sessionExercisesQuery.data?.total_exercises || 0;

  const exercisesQuery = useExercises(
    {
      favorites_only: exerciseView === 'favorites' ? true : undefined,
      search: exerciseSearch || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    },
    1,
    50
  );

  const exerciseOptions = useMemo(() => {
    const list = exercisesQuery.data?.exercises || [];
    if (exerciseView === 'recent') {
      return [...list].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }
    return list;
  }, [exercisesQuery.data, exerciseView]);

  const addExerciseMutation = useAddSessionExercise();

  const initializedRef = useRef(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!session) return;
    const sessionDate = new Date(session.session_at);
    setForm({
      date: format(sessionDate, 'yyyy-MM-dd'),
      time: format(sessionDate, 'HH:mm'),
      session_type: session.session_type || '',
      main_objective: session.main_objective || '',
      secondary_objective: session.secondary_objective || '',
      location: session.location || '',
      duration_planned_minutes: session.duration_planned_minutes
        ? String(session.duration_planned_minutes)
        : '',
    });
    setNotes(session.notes || '');
    setJustification(session.deviation_justification || '');
    setFocusValues({
      focus_attack_positional_pct: session.focus_attack_positional_pct || 0,
      focus_defense_positional_pct: session.focus_defense_positional_pct || 0,
      focus_transition_offense_pct: session.focus_transition_offense_pct || 0,
      focus_transition_defense_pct: session.focus_transition_defense_pct || 0,
      focus_attack_technical_pct: session.focus_attack_technical_pct || 0,
      focus_defense_technical_pct: session.focus_defense_technical_pct || 0,
      focus_physical_pct: session.focus_physical_pct || 0,
    });
    setFocusMode('template');
    setInitialData({
      form: {
        date: format(sessionDate, 'yyyy-MM-dd'),
        time: format(sessionDate, 'HH:mm'),
        session_type: session.session_type || '',
        main_objective: session.main_objective || '',
        secondary_objective: session.secondary_objective || '',
        location: session.location || '',
        duration_planned_minutes: session.duration_planned_minutes
          ? String(session.duration_planned_minutes)
          : '',
      },
      notes: session.notes || '',
      focusValues: {
        focus_attack_positional_pct: session.focus_attack_positional_pct || 0,
        focus_defense_positional_pct: session.focus_defense_positional_pct || 0,
        focus_transition_offense_pct: session.focus_transition_offense_pct || 0,
        focus_transition_defense_pct: session.focus_transition_defense_pct || 0,
        focus_attack_technical_pct: session.focus_attack_technical_pct || 0,
        focus_defense_technical_pct: session.focus_defense_technical_pct || 0,
        focus_physical_pct: session.focus_physical_pct || 0,
      },
      justification: session.deviation_justification || '',
    });
    initializedRef.current = true;
  }, [session?.id, session]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notesRef.current) return;
    notesRef.current.style.height = 'auto';
    notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
  }, [notes]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const isEditableTarget =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isEditableTarget) return;

      if (event.key === '1') setActiveTab('overview');
      if (event.key === '2') setActiveTab('focus');
      if (event.key === '3') setActiveTab('exercises');
      if (event.key === '4') setActiveTab('notes');
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!isDeleteOpen) return;
    setDeleteReason('');
  }, [isDeleteOpen]);

  const focusSummary = useMemo(
    () => computeFocusSummary(focusValues, { justification }),
    [focusValues, justification]
  );
  const focusTotalValue = Number(focusSummary.totalFocusExact.toString());
  const focusIsExact = focusSummary.totalFocusExact.eq(100);
  const focusIsBelow = focusSummary.totalFocusExact.lt(100);
  const focusIsOver = focusSummary.totalFocusExact.gt(100) && focusSummary.totalFocusExact.lte(120);
  const focusIsCritical = focusSummary.totalFocusExact.gt(120);
  const focusSegments = useMemo(
    () =>
      FOCUS_SEGMENTS.map((segment) => ({
        ...segment,
        value: Number(focusValues[segment.key as keyof ApiFocusInput]) || 0,
      })),
    [focusValues]
  );

  const requiredFieldsOk = Boolean(
    form.date &&
      form.time &&
      form.location.trim() &&
      form.session_type &&
      form.main_objective.trim() &&
      Number(form.duration_planned_minutes) > 0
  );
  const focusCanSchedule = focusIsExact || (focusIsOver && !focusSummary.missingJustification);
  const canPublish = requiredFieldsOk && focusCanSchedule && totalExercises > 0;
  const publishChecklist = [
    { label: 'Data e horário definidos', ok: Boolean(form.date && form.time) },
    { label: 'Duração planejada', ok: Number(form.duration_planned_minutes) > 0 },
    { label: 'Local do treino', ok: Boolean(form.location.trim()) },
    { label: 'Tipo da sessão', ok: Boolean(form.session_type) },
    { label: 'Objetivo principal', ok: Boolean(form.main_objective.trim()) },
    { label: 'Distribuição de foco >= 100%', ok: focusIsExact || focusIsOver },
    { label: 'Focos até 120%', ok: !focusIsCritical },
    {
      label: 'Justificativa de sobrecarga',
      ok: !focusSummary.requiresJustification || !focusSummary.missingJustification,
    },
    { label: 'Ao menos 1 exercício', ok: totalExercises > 0 },
  ];

  const validationState = useMemo(() => {
    const cargas = {
      ok: focusIsExact || (focusIsOver && !focusSummary.missingJustification),
      label: focusIsExact ? '100%' : `${focusTotalValue}%`,
    };
    const exercicios = {
      ok: totalExercises > 0,
      label: `${totalExercises}`,
    };
    const dados = {
      ok: requiredFieldsOk,
      label: requiredFieldsOk ? 'OK' : 'Pendente',
    };
    const completed = [cargas.ok, exercicios.ok, dados.ok].filter(Boolean).length;
    const percentage = Math.round((completed / 3) * 100);
    return { cargas, exercicios, dados, percentage };
  }, [focusIsExact, focusIsOver, focusSummary.missingJustification, focusTotalValue, totalExercises, requiredFieldsOk]);

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return (
      JSON.stringify(initialData.form) !== JSON.stringify(form) ||
      initialData.notes !== notes ||
      JSON.stringify(initialData.focusValues) !== JSON.stringify(focusValues) ||
      initialData.justification !== justification
    );
  }, [initialData, form, notes, focusValues, justification]);

  const handlePublish = () => {
    if (!session || !canPublish) return;
    setIsPublishConfirmOpen(true);
  };

  const handleSave = async (newStatus: 'draft' | 'scheduled') => {
    if (!session) return;
    setSyncStatus('saving');
    try {
      const payload: SessionUpdate = {};

      // Campos que podem ser editados apenas em draft
      if (newStatus === 'draft' || session.status === 'draft') {
        if (form.date && form.time) {
          const sessionAt = new Date(`${form.date}T${form.time}:00`);
          if (!Number.isNaN(sessionAt.getTime()) && sessionAt.toISOString() !== session.session_at) {
            payload.session_at = sessionAt.toISOString();
          }
        }

        if (form.session_type !== session.session_type) {
          payload.session_type = form.session_type || undefined;
        }
        if (form.main_objective !== (session.main_objective || '')) {
          payload.main_objective = form.main_objective || undefined;
        }
        if (form.secondary_objective !== (session.secondary_objective || '')) {
          payload.secondary_objective = form.secondary_objective || undefined;
        }
        if (form.location !== (session.location || '')) {
          payload.location = form.location || undefined;
        }

        const durationValue = form.duration_planned_minutes
          ? Number(form.duration_planned_minutes)
          : undefined;
        if (durationValue !== session.duration_planned_minutes) {
          payload.duration_planned_minutes = durationValue;
        }
      }

      // Campos que podem ser editados sempre
      if (notes !== (session.notes || '')) {
        payload.notes = notes || undefined;
      }

      const focusMap: Array<keyof ApiFocusInput> = [
        'focus_attack_positional_pct',
        'focus_defense_positional_pct',
        'focus_transition_offense_pct',
        'focus_transition_defense_pct',
        'focus_attack_technical_pct',
        'focus_defense_technical_pct',
        'focus_physical_pct',
      ];
      focusMap.forEach((key) => {
        const currentValue = Number(focusValues[key]) || 0;
        const sessionValue = Number(session[key as keyof typeof session]) || 0;
        if (currentValue !== sessionValue) {
          payload[key] = currentValue;
        }
      });

      if (justification !== (session.deviation_justification || '')) {
        payload.deviation_justification = justification || undefined;
      }

      if (newStatus === 'scheduled') {
        // Salvar mudanças nos campos se houver
        if (Object.keys(payload).length > 0) {
          await updateSession(payload);
        }
        // Publicar para mudar status para scheduled
        await TrainingSessionsAPI.publishSession(session.id);
        setSyncStatus('idle');
        toast.success('Treino agendado com sucesso!');
        await refetch();
        
        onSuccess?.();
        onClose?.();
      } else {
        const updated = await updateSession(payload);
        if (updated) {
          setSyncStatus('idle');
          toast.success('Rascunho salvo com sucesso!');
          await refetch();
        } else {
          setSyncStatus('error');
        }
      }
    } catch (err: any) {
      setSyncStatus('error');
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  const handleConfirmPublish = async () => {
    if (!session || !canPublish) return;
    setIsPublishing(true);
    setSyncStatus('saving');
    try {
      await TrainingSessionsAPI.publishSession(session.id);
      setPublishSuccess(true);
      setSyncStatus('idle');
      
      // Delay de confirmação visual
      await new Promise(resolve => setTimeout(resolve, 250));
      
      toast.success('Treino confirmado! Os atletas agora podem visualizar o cronograma no app.', {
        icon: (
          <Lottie
            animationData={successAnimation}
            loop={false}
            className="h-7 w-7"
          />
        ),
      });
      await refetch();
      setIsPublishConfirmOpen(false);
      
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      setSyncStatus('error');
      toast.error(err.message || 'Erro ao agendar treino');
    } finally {
      setIsPublishing(false);
      setPublishSuccess(false);
    }
  };

  const handleBack = () => {
    onClose?.();
  };

  const handleDeleteSession = async () => {
    if (!session || deleteReason.trim().length < 5) return;
    setIsDeleting(true);
    try {
      await deleteSessionMutation.mutateAsync({
        sessionId: session.id,
        reason: deleteReason.trim(),
      });
      setIsDeleteOpen(false);
      handleBack();
    } catch (err: any) {
      // Error toast handled by mutation hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddExercise = (exerciseId: string) => {
    if (!isEditable) return;
    const baseIndex = sessionExercisesQuery.data?.total_exercises ?? 0;
    const orderIndex = baseIndex + pendingAdds;
    setPendingAdds((prev) => prev + 1);
    addExerciseMutation.mutate(
      { sessionId, data: { exercise_id: exerciseId, order_index: orderIndex } },
      {
        onSettled: () => setPendingAdds((prev) => Math.max(0, prev - 1)),
      }
    );
  };

  const handleAddNoteSuggestion = (text: string) => {
    if (!isEditable) return;
    setNotes((prev) => (prev ? `${prev}\n- ${text}` : text));
  };

  const sessionDate = session ? new Date(session.session_at) : null;
  const sessionDateLabel = sessionDate ? format(sessionDate, 'dd/MM/yyyy') : '--/--/----';
  const sessionTimeLabel = sessionDate ? format(sessionDate, 'HH:mm') : '--:--';
  const sessionTypeLabel =
    SESSION_TYPES.find((type) => type.value === session?.session_type)?.label ||
    session?.session_type ||
    'Sessão';

  const focusPreviewBase = focusTotalValue > 100 ? focusTotalValue : 100;
  const focusRingProgress = Math.min(focusTotalValue, 120) / 120;
  const focusRingColor = focusIsCritical
    ? 'text-rose-600'
    : focusIsOver
    ? 'text-orange-500'
    : focusIsExact
    ? 'text-emerald-600'
    : 'text-amber-500';

  // ESC handler para fechar modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleteOpen && !isPublishConfirmOpen) {
        onClose?.();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isDeleteOpen, isPublishConfirmOpen, onClose]);

  const focusStatus = focusIsCritical
    ? {
        tone: 'border-rose-200 bg-rose-50 text-rose-700',
        message: 'Bloqueado. Carga crítica! Reduza os focos para garantir a segurança dos atletas.',
      }
    : focusIsOver
    ? {
        tone: 'border-orange-200 bg-orange-50 text-orange-700',
        message:
          'Liberado. Carga elevada. Justificativa necessária para prosseguir.',
      }
    : focusIsExact
    ? {
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        message: 'Liberado. Carga padrão atingida.',
      }
    : {
        tone: 'border-amber-200 bg-amber-50 text-amber-700',
        message:
          'Bloqueado. Distribua os focos até atingir pelo menos 100% da sessão.',
      };

  function LibraryExerciseItem({ exercise }: { exercise: Exercise }) {
    const [{ isDragging }, dragRef] = useDrag(
      () => ({
        type: 'EXERCISE',
        item: { type: 'EXERCISE', exercise },
        canDrag: isEditable,
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }),
      [exercise, isEditable]
    );

    return (
      <div
        ref={dragRef as any}
        className={cn(
          'group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition',
          'hover:border-slate-900 hover:shadow-sm',
          isDragging && 'opacity-50'
        )}
      >
        <div className="min-w-0">
          <div className="truncate font-medium">{exercise.name}</div>
          <div className="text-xs text-slate-400">
            {exercise.category || 'Sem categoria'}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAddExercise(exercise.id)}
          disabled={!isEditable || addExerciseMutation.isPending}
          className="shrink-0"
        >
          <Icons.Actions.Add className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isLoading || !session) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0b1020]">
        <div className="h-16 border-b border-slate-200 bg-slate-50 dark:border-gray-800 dark:bg-[#121827]" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-32 w-full max-w-3xl rounded-xl border border-slate-200 bg-white animate-pulse dark:border-gray-800 dark:bg-[#1a1f2e]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0b1020]">
        <div className="h-16 border-b border-slate-200 bg-slate-50 dark:border-gray-800 dark:bg-[#121827]" />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Falha ao carregar a sessão: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TooltipProvider>
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="flex h-full flex-col overflow-hidden"
        >
          {/* Header redesenhado */}
          <header className="h-16 shrink-0 border-b border-slate-700 bg-slate-900 px-6 flex items-center justify-between">
            {/* Esquerda: Título */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white truncate">
                    {form.main_objective || 'Nova Sessão'}
                  </h2>
                </div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Sessão • {selectedTeam?.name || 'Sem equipe'}
                </p>
              </div>
            </div>

            {/* Centro: Tabs */}
            <div className="hidden md:flex">
              <TabsList className="h-fit bg-transparent">
                
                <TabsTrigger
                  value="overview"
                  className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                >
                  Visão geral
                </TabsTrigger>
                <TabsTrigger
                  value="focus"
                  className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                >
                  Focos
                </TabsTrigger>
                <TabsTrigger
                  value="exercises"
                  className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                >
                  Exercícios
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                >
                  Notas
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Direita: Badge de Status + Close */}
            <div className="flex items-center gap-3 shrink-0">
              <Badge
                variant={getStatusVariant(session.status)}
                className={cn(
                  "text-[9px] font-bold uppercase tracking-widest rounded-full px-3 py-1",
                  getStatusClasses(session.status)
                )}
              >
                {STATUS_LABELS[session.status] || session.status}
              </Badge>
              {onClose && (
                <DialogClose className="rounded-sm opacity-70 ring-offset-slate-900 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 disabled:pointer-events-none text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </DialogClose>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-hidden min-h-0">
            <div className="h-full overflow-y-auto px-6 py-8">
              <div className="mb-6 md:hidden">
                <TabsList className="h-fit w-full justify-between bg-transparent">
                  
                  <TabsTrigger
                    value="overview"
                    className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                  >
                    Visão geral
                  </TabsTrigger>
                  <TabsTrigger
                    value="focus"
                    className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                  >
                    Focos
                  </TabsTrigger>
                  <TabsTrigger
                    value="exercises"
                    className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                  >
                    Exercícios
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="h-fit bg-transparent px-2 pb-1 pt-0 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:font-bold rounded-none"
                  >
                    Notas
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="mx-auto max-w-6xl space-y-8">
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Coluna 1: Objetivos */}
                    <div className="col-span-3 space-y-2">
                      <Label>Objetivo principal</Label>
                      <Input
                        value={form.main_objective}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, main_objective: event.target.value }))
                        }
                        disabled={!isEditable}
                        placeholder="Defina o norte do treino"
                        className="bg-white border-slate-300 font-semibold"
                      />
                    </div>
                    
                    <div className="col-span-3 space-y-2">
                      <Label>Objetivo secundário</Label>
                      <Input
                        value={form.secondary_objective}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            secondary_objective: event.target.value,
                          }))
                        }
                        disabled={!isEditable}
                        className="bg-white border-slate-300"
                        placeholder="Ex: acelerar transicão defensiva"
                      />
                    </div>

                    {/* Coluna 2: Data/Hora/Duração */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Data
                        {isDateTimeLocked && (
                          <Icons.Security.Lock className="h-3 w-3 text-slate-400" />
                        )}
                      </Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, date: event.target.value }))
                        }
                        disabled={!isEditable || isDateTimeLocked}
                        className="bg-white border-slate-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Horário
                        {isDateTimeLocked && (
                          <Icons.Security.Lock className="h-3 w-3 text-slate-400" />
                        )}
                      </Label>
                      <Input
                        type="time"
                        value={form.time}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, time: event.target.value }))
                        }
                        disabled={!isEditable || isDateTimeLocked}
                        className="bg-white border-slate-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duração (min)</Label>
                      <Input
                        type="number"
                        min={15}
                        max={240}
                        step={15}
                        value={form.duration_planned_minutes}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            duration_planned_minutes: event.target.value,
                          }))
                        }
                        disabled={!isEditable}
                        className="bg-white border-slate-300"
                      />
                    </div>

                    {/* Coluna 3: Local e Tipo */}
                    <div className="col-span-2 space-y-2">
                      <Label>Local</Label>
                      <Input
                        value={form.location}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, location: event.target.value }))
                        }
                        disabled={!isEditable}
                        className="bg-white border-slate-300"
                        placeholder="Ex: Ginásio principal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={form.session_type}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, session_type: value }))
                        }
                        disabled={!isEditable}
                      >
                        <SelectTrigger className="bg-white border-slate-300">
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
                  </div>
                </TabsContent>

                <TabsContent value="focus" className="mt-0">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Coluna: Preview Cockpit Compacto */}
                    <div className="space-y-4">
                      {/* Preview Card Compacto */}
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-4">
                          {/* Ring Progress */}
                          <div className={cn('relative h-20 w-20 shrink-0', focusRingColor)}>
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: `conic-gradient(currentColor ${focusRingProgress * 360}deg, #e2e8f0 0deg)`,
                              }}
                            />
                            <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                              <span className="text-xl font-bold text-slate-900">
                                {focusSummary.totalFocusRounded}%
                              </span>
                              <span className="text-[8px] text-slate-400">/ 120</span>
                            </div>
                          </div>
                          
                          {/* Barra + Status */}
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-full overflow-hidden rounded border border-slate-200 bg-slate-50">
                              <div className="flex h-full w-full">
                                {focusSegments.map((segment) => {
                                  if (segment.value <= 0) return null;
                                  const width = focusPreviewBase > 0 ? (segment.value / focusPreviewBase) * 100 : 0;
                                  return (
                                    <div
                                      key={segment.key}
                                      className={segment.color}
                                      style={{ width: `${width}%` }}
                                      title={`${segment.label}: ${segment.value}%`}
                                    />
                                  );
                                })}
                                {focusTotalValue < focusPreviewBase && (
                                  <div
                                    className="h-full bg-slate-100"
                                    style={{ width: `${((focusPreviewBase - focusTotalValue) / focusPreviewBase) * 100}%` }}
                                  />
                                )}
                              </div>
                            </div>
                            
                            <div
                              className={cn(
                                'flex items-center gap-2 rounded px-2 py-1 text-[10px] font-semibold',
                                focusStatus.tone
                              )}
                            >
                              {focusIsCritical ? (
                                <Shield className="h-3 w-3" />
                              ) : focusIsExact ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {focusStatus.message}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botões Template/Manual */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={focusMode === 'template' ? 'default' : 'outline'}
                          onClick={() => setFocusMode('template')}
                          disabled={!isEditable}
                        >
                          <Target className="h-3.5 w-3.5 mr-1.5" />
                          Templates
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={focusMode === 'manual' ? 'default' : 'outline'}
                          onClick={() => {
                            setFocusMode('manual');
                            setSelectedTemplateId(null);
                          }}
                          disabled={!isEditable}
                        >
                          <Crosshair className="h-3.5 w-3.5 mr-1.5" />
                          Manual
                        </Button>
                      </div>
                      
                      {focusMode === 'template' && (
                        <div className="flex flex-wrap gap-2">
                          {templatesLoading ? (
                            <div className="text-xs text-slate-500">Carregando templates...</div>
                          ) : templatesError ? (
                            <div className="text-xs text-red-500">Erro ao carregar templates</div>
                          ) : (
                            templatesData?.templates.map((template) => (
                              <Button
                                key={template.id}
                                type="button"
                                size="sm"
                                variant={selectedTemplateId === template.id ? "default" : "outline"}
                                onClick={() => {
                                  setFocusValues({
                                    focus_attack_positional_pct: template.focus_attack_positional_pct,
                                    focus_defense_positional_pct: template.focus_defense_positional_pct,
                                    focus_transition_offense_pct: template.focus_transition_offense_pct,
                                    focus_transition_defense_pct: template.focus_transition_defense_pct,
                                    focus_attack_technical_pct: template.focus_attack_technical_pct,
                                    focus_defense_technical_pct: template.focus_defense_technical_pct,
                                    focus_physical_pct: template.focus_physical_pct,
                                  });
                                  setSelectedTemplateId(template.id);
                                }}
                                disabled={!isEditable}
                                className="text-xs h-7 px-2"
                                title={template.description || undefined}
                              >
                                {template.icon && <span className="mr-1">{template.icon}</span>}
                                {template.name}
                              </Button>
                            ))
                          )}
                        </div>
                      )}

                      {/* Editor de Focos */}
                      <FocusDistributionEditor
                        values={focusValues}
                        onChange={(key, value) =>
                          setFocusValues((prev) => ({ ...prev, [key]: value }))
                        }
                        justification={justification}
                        onJustificationChange={setJustification}
                        mode="lenient"
                        disabled={!isEditable || selectedTemplateId !== null}
                        showBadge={false}
                        layout="grid"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exercises" className="mt-0">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                      <SessionExerciseDropZone
                        sessionId={sessionId}
                        plannedDuration={Number(form.duration_planned_minutes) || 0}
                        readOnly={!isEditable}
                      />
                    </div>
                    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white lg:col-span-4">
                      <div className="space-y-3 border-b border-slate-200 p-4">
                        <div className="flex items-center gap-2">
                          <Icons.Actions.Search className="h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Buscar exercício..."
                            value={exerciseSearch}
                            onChange={(event) => setExerciseSearch(event.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(['favorites', 'recent', 'search'] as ExerciseView[]).map((view) => (
                            <button
                              key={view}
                              type="button"
                              onClick={() => setExerciseView(view)}
                              className={cn(
                                'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide',
                                exerciseView === view
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
                              )}
                            >
                              {view === 'favorites' && 'Favoritos'}
                              {view === 'recent' && 'Recentes'}
                              {view === 'search' && 'Explorar'}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['all', 'Técnico', 'Tático', 'Físico', 'Goleiro'].map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setCategoryFilter(category)}
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase',
                                categoryFilter === category
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 text-slate-500'
                              )}
                            >
                              {category === 'all' ? 'Todos' : category}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[400px]">
                        {exerciseOptions.map((exercise) => (
                          <LibraryExerciseItem key={exercise.id} exercise={exercise} />
                        ))}
                        {!exerciseOptions.length && (
                          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                            Nenhum exercício encontrado.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
                      <Label>Notas do planejamento</Label>
                      <Textarea
                        ref={notesRef}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="mt-2 min-h-[160px] resize-none"
                        placeholder="Descreva observacoes, enfases e variacoes do treino..."
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Sugestoes rapidas
                      </div>
                      <div className="mt-4 space-y-2">
                        {NOTE_SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleAddNoteSuggestion(suggestion)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            disabled={!isEditable}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </main>

          {/* Footer Sticky com Validação em Tempo Real */}
          <footer className={cn(
            "relative h-20 shrink-0 border-t border-slate-200 bg-white px-6 flex items-center justify-between gap-6 transition-opacity duration-200",
            isPublishing && "opacity-60"
          )}>
            {/* Banner de Erro (aparece acima do footer) */}
            {syncStatus === 'error' && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-full max-w-lg px-6">
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Icons.Status.Warning className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-rose-700">
                        Falha ao salvar alterações
                      </p>
                      <p className="text-[10px] text-rose-600 mt-0.5">
                        Verifique sua conexão e tente novamente.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSyncStatus('idle')}
                      className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 shrink-0"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Zona Esquerda: Ícone de Deletar */}
            <div className="flex-none">
              <button
                onClick={() => setIsDeleteOpen(true)}
                disabled={syncStatus === 'saving'}
                className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition disabled:opacity-50 disabled:pointer-events-none"
              >
                <Icons.Actions.Delete className="h-5 w-5" />
                <span className="text-xs font-medium hidden sm:inline">Excluir</span>
              </button>
            </div>

            {/* Zona Centro: Validação em Tempo Real */}
            <div className="flex-1 flex justify-center">
              {isDraft ? (
                <div className="max-w-sm w-full space-y-2.5">
                  {/* Micro-indicadores */}
                  <div className="flex items-center justify-between gap-6">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <Icons.Status.Check 
                            className={cn(
                              "h-4 w-4 transition-colors",
                              validationState.cargas.ok ? "text-emerald-500" : "text-slate-300"
                            )} 
                          />
                          <span className="text-xs font-medium text-slate-600">Carga</span>
                          <span className={cn(
                            "text-xs font-bold",
                            validationState.cargas.ok ? "text-emerald-700" : "text-slate-400"
                          )}>
                            {validationState.cargas.label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Distribuição de focos deve somar entre 100-120%</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <Icons.Status.Check 
                            className={cn(
                              "h-4 w-4 transition-colors",
                              validationState.exercicios.ok ? "text-emerald-500" : "text-slate-300"
                            )} 
                          />
                          <span className="text-xs font-medium text-slate-600">Exercícios</span>
                          <span className={cn(
                            "text-xs font-bold",
                            validationState.exercicios.ok ? "text-emerald-700" : "text-slate-400"
                          )}>
                            {validationState.exercicios.label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Pelo menos 1 exercício deve ser adicionado</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <Icons.Status.Check 
                            className={cn(
                              "h-4 w-4 transition-colors",
                              validationState.dados.ok ? "text-emerald-500" : "text-slate-300"
                            )} 
                          />
                          <span className="text-xs font-medium text-slate-600">Dados</span>
                          <span className={cn(
                            "text-xs font-bold",
                            validationState.dados.ok ? "text-emerald-700" : "text-slate-400"
                          )}>
                            {validationState.dados.label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Campos obrigatórios: objetivo, local, tipo, data e duração</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Barra de Progresso */}
                  <Progress 
                    value={validationState.percentage} 
                    className={cn(
                      "h-2",
                      validationState.percentage === 100 
                        ? "[&>div]:bg-emerald-500" 
                        : validationState.percentage >= 66 
                        ? "[&>div]:bg-blue-500" 
                        : validationState.percentage >= 33 
                        ? "[&>div]:bg-amber-500" 
                        : "[&>div]:bg-slate-300"
                    )}
                  />
                  <p className="text-[10px] text-center text-slate-500 font-medium">
                    {validationState.percentage}% completo para agendar
                  </p>
                </div>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Treino Agendado
                </span>
              )}
            </div>

            {/* Zona Direita: Ações */}
            <div className="flex gap-3 flex-none">
              <Button variant="ghost" onClick={handleBack}>
                Cancelar
              </Button>

              {isDraft ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSave('draft')}
                    disabled={!isDirty || syncStatus === 'saving'}
                  >
                    {syncStatus === 'saving' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Rascunho'
                    )}
                  </Button>
                  <Button
                    onClick={() => handleSave('scheduled')}
                    disabled={!canPublish || syncStatus === 'saving'}
                    className="bg-slate-900 text-white font-bold uppercase text-[11px] tracking-widest"
                  >
                    {syncStatus === 'saving' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Agendando...
                      </>
                    ) : (
                      'Agendar Treino'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleSave('scheduled')}
                  disabled={!isDirty || syncStatus === 'saving'}
                  className="bg-slate-900 text-white font-bold uppercase text-[11px] tracking-widest"
                >
                  {syncStatus === 'saving' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              )}
            </div>
          </footer>
        </Tabs>
      </div>

      <AlertDialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agendar treino</AlertDialogTitle>
            <AlertDialogDescription>
              Treino agendado para {sessionDateLabel} às {sessionTimeLabel}. Confirmar publicação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleConfirmPublish} disabled={isPublishing}>
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o treino da agenda. Informe um motivo para continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Motivo (minimo 5 caracteres)</Label>
            <Textarea
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Ex: treino cancelado, ajuste de calendario..."
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleDeleteSession}
              disabled={isDeleting || deleteReason.trim().length < 5}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Excluir treino
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
    </>
  );
}
