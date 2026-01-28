/**
 * SessionExpandedCard
 *
 * Card expandido para preview e ações rápidas:
 * - Modal lateral com AppDrawer
 * - Cabeçalho dinâmico (badge status + ícone tipo)
 * - Corpo técnico (objetivo, logística vertical, mini-stack bar)
 * - Ações CTA adaptativas por status
 * - Chips interativos para pendências
 *
 * Design System: Modal consistente, ações contextuais
 */

'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { TrainingSession } from '@/lib/api/trainings';
import { FocusMiniBar, useFocusData } from './FocusMiniBar';
import { Icons } from '@/design-system/icons';
import { useTeamDetail } from '@/hooks/useTeams';
import { useSessionIntelligence } from '@/hooks/useSessionIntelligence';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SessionExpandedCardProps {
  session: TrainingSession | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (session: TrainingSession) => void;
  onReview?: (session: TrainingSession) => void;
  onViewDetails?: (session: TrainingSession) => void;
  onViewExecution?: (session: TrainingSession) => void;
  onViewReport?: (session: TrainingSession) => void;
  onCompleteAndSchedule?: (session: TrainingSession) => void;
  onSaveNotes?: (sessionId: string, notes: string) => void;
  onDelete?: (session: TrainingSession, reason: string) => Promise<void>;
}

/**
 * Ações por status
 */
const STATUS_ACTIONS = {
  draft: {
    primary: { label: 'Completar e agendar', action: 'edit' },
    secondary: { action: 'delete', icon: Icons.Actions.Delete },
    checklist: ['Carga definida', 'Exercícios adicionados', 'Dados validados'],
  },
  scheduled: {
    primary: { label: 'Editar sessão', action: 'edit' },
    secondary: { action: 'delete', icon: Icons.Actions.Delete },
    countdown: true,
  },
  in_progress: {
    primary: { label: 'Ver execução', action: 'viewExecution' },
    progress: true,
    notes: true,
  },
  pending_review: {
    primary: { label: 'Revisar', action: 'review' },
    chips: ['Outcome não definido', 'Presenças pendentes'],
  },
  readonly: {
    primary: { label: 'Ver relatório', action: 'viewReport' },
    donut: true,
  },
};

/**
 * Ícones por tipo
 */
const SESSION_TYPE_ICONS = {
  quadra: Icons.Training.SessionTypes.Quadra,
  fisico: Icons.Training.SessionTypes.Fisico,
  video: Icons.Training.SessionTypes.Video,
  reuniao: Icons.Training.SessionTypes.Reuniao,
  teste: Icons.Training.SessionTypes.Teste,
};

/**
 * Títulos por tipo
 */
const SESSION_TYPE_TITLES = {
  quadra: 'Treino na Quadra',
  fisico: 'Treinos físicos',
  video: 'Análise de vídeo',
  reuniao: 'Reuniões de equipe',
  teste: 'Teste - Avaliação',
};

// Funções helper para badge consolidada (idênticas ao SessionEditClient)
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

const STATUS_LABELS: Record<string, string> = {
  draft: 'RASCUNHO',
  scheduled: 'AGENDADO',
  in_progress: 'EM ANDAMENTO',
  pending_review: 'REVISÃO PENDENTE',
  readonly: 'CONGELADO',
};

export function SessionExpandedCard({
  session,
  isOpen,
  onClose,
  onEdit,
  onReview,
  onViewDetails,
  onViewExecution,
  onViewReport,
  onCompleteAndSchedule,
  onSaveNotes,
  onDelete,
}: SessionExpandedCardProps) {
  const [notes, setNotes] = useState(session?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const focusData = useFocusData(session);
  const actions = session ? STATUS_ACTIONS[session.status as keyof typeof STATUS_ACTIONS] : null;
  const { data: teamData } = useTeamDetail(session?.team_id);
  const intelligence = useSessionIntelligence(session);

  // Chips dinâmicos baseados em inteligência centralizada
  const validationChips = useMemo(() => {
    if (!session) return [];

    const chips = [];

    // Usar inteligência centralizada
    if (intelligence.missingLocation) {
      chips.push({
        type: 'warning',
        message: 'Local não definido',
        icon: Icons.Status.Warning,
      });
    }

    if (intelligence.hasDeviation) {
      chips.push({
        type: 'error',
        message: 'Desvio de planejamento detectado',
        icon: Icons.Status.Error,
      });
    }

    if (intelligence.missingObjectives) {
      chips.push({
        type: 'warning',
        message: 'Objetivos não definidos',
        icon: Icons.Status.Warning,
      });
    }

    if (intelligence.missingFocus) {
      chips.push({
        type: 'warning',
        message: 'Foco não distribuído',
        icon: Icons.Status.Warning,
      });
    }

    if (intelligence.missingExercises) {
      chips.push({
        type: 'error',
        message: 'Nenhum exercício adicionado',
        icon: Icons.Status.Error,
      });
    }

    return chips;
  }, [session, intelligence]);

  // Progresso para draft
  const draftProgress = useMemo(() => {
    if (!session || session.status !== 'draft') return null;

    // Cargas: total_focus >= 100
    const totalFocus = (session.focus_attack_positional_pct || 0) +
                      (session.focus_defense_positional_pct || 0) +
                      (session.focus_transition_offense_pct || 0) +
                      (session.focus_transition_defense_pct || 0) +
                      (session.focus_attack_technical_pct || 0) +
                      (session.focus_defense_technical_pct || 0) +
                      (session.focus_physical_pct || 0);

    const cargaOk = totalFocus >= 100;
    const exerciciosOk = !!(session.exercises_count && session.exercises_count > 0);
    const dadosOk = !!session.main_objective;

    const completed = [cargaOk, exerciciosOk, dadosOk].filter(Boolean).length;
    const percentage = Math.round((completed / 3) * 100);

    return { completed, total: 3, percentage, cargaOk, exerciciosOk, dadosOk };
  }, [session]);

  const TypeIcon = session ? SESSION_TYPE_ICONS[session.session_type?.toLowerCase() as keyof typeof SESSION_TYPE_ICONS] || Icons.Training.Session : null;

  // Contagem regressiva para scheduled
  const countdown = useMemo(() => {
    if (!session || session.status !== 'scheduled') return null;
    const now = new Date();
    const sessionTime = new Date(session.session_at);
    const diff = sessionTime.getTime() - now.getTime();
    if (diff <= 0) return 'Iniciando agora';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Inicia em ${hours}h ${minutes}min`;
  }, [session]);

  // Progresso para in_progress
  const progress = useMemo(() => {
    if (!session || session.status !== 'in_progress' || !session.started_at) return null;
    const now = new Date();
    const start = new Date(session.started_at);
    const duration = (session.duration_planned_minutes || 60) * 60 * 1000;
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, (elapsed / duration) * 100);
  }, [session]);

  // Donut para readonly
  const attendanceRate = useMemo(() => {
    if (!session || session.status !== 'readonly') return null;
    const present = session.attendance_present_count || 0;
    const total = session.attendance_total_count || 1;
    return Math.round((present / total) * 100);
  }, [session]);

  const handleAction = (action: string) => {
    if (!session) return;
    switch (action) {
      case 'edit':
        onEdit?.(session);
        break;
      case 'review':
        onReview?.(session);
        break;
      case 'viewDetails':
        onViewDetails?.(session);
        break;
      case 'viewExecution':
        onViewExecution?.(session);
        break;
      case 'viewReport':
        onViewReport?.(session);
        break;
      case 'completeAndSchedule':
        onCompleteAndSchedule?.(session);
        break;
      case 'delete':
        setIsDeleteOpen(true);
        return; // Não fechar o modal principal
    }
    onClose();
  };

  const handleSaveNotes = async () => {
    if (!session || !onSaveNotes) return;
    setSavingNotes(true);
    try {
      await onSaveNotes(session.id, notes);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!session || !onDelete || deleteReason.trim().length < 5) return;
    try {
      await onDelete(session, deleteReason.trim());
      setIsDeleteOpen(false);
      onClose();
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-md p-0 gap-0"
        onPointerDownOutside={(e) => e.preventDefault()} // Impede fechar ao clicar fora
        onEscapeKeyDown={onClose} // ESC como atalho
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Detalhes da Sessão</DialogTitle>
        </DialogHeader>

        {/* Container interno para controle total do layout */}
        <div className="flex flex-col">

        {/* Header padronizado - sem tabs, com badge consolidada + botão X */}
        <header className="h-16 shrink-0 border-b border-slate-700 bg-slate-900 rounded-t-lg flex items-center justify-between px-6">
          {/* Esquerda: Ícone + Título do Tipo + Subtítulo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                {TypeIcon && <TypeIcon className="h-5 w-5 text-slate-400" />}
                <span className="font-medium text-white">
                  {SESSION_TYPE_TITLES[session.session_type as keyof typeof SESSION_TYPE_TITLES] || session.session_type}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                Sessão • {teamData?.name || 'Sem equipe'}
              </p>
            </div>
          </div>
          
          {/* Centro: Vazio (sem tabs) */}
          
          {/* Direita: Badge Consolidada + Botão X */}
          <div className="flex items-center gap-3">
            <Badge
              variant={getStatusVariant(session.status)}
              className={cn(
                "text-[9px] font-bold uppercase tracking-widest rounded-full px-3 py-1",
                getStatusClasses(session.status)
              )}
            >
              {STATUS_LABELS[session.status] || session.status}
            </Badge>
            <DialogClose className="rounded-sm opacity-70 ring-offset-slate-900 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 disabled:pointer-events-none text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
        </header>

        {/* Corpo Técnico */}
        <div className="space-y-4 px-6 py-4">
          {/* Objetivo */}
          <div>
            <h3 className="font-semibold text-lg">{session.main_objective || 'Sem objetivo definido'}</h3>
            {session.secondary_objective && (
              <p className="text-sm text-muted-foreground mt-1">{session.secondary_objective}</p>
            )}
          </div>

          {/* Logística Vertical */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Icons.UI.Clock className="h-3 w-3" />
              <span>
                {new Date(session.session_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' • '}
                {session.duration_planned_minutes || 60} min
              </span>
            </div>
            {session.location && (
              <div className="flex items-center gap-2 text-xs">
                <Icons.UI.MapPin className="h-3 w-3" />
                <span>{session.location}</span>
              </div>
            )}
          </div>

          {/* Indicadores */}
          <FocusMiniBar session={session} size="sm" />

          {/* Countdown para scheduled */}
          {countdown && (
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <Icons.UI.Countdown className="h-4 w-4" />
              <span>{countdown}</span>
            </div>
          )}

          {/* Progress para in_progress */}
          {progress !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso do treino</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Notas rápidas para in_progress */}
          {actions && 'notes' in actions && actions.notes && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas rápidas</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações durante o treino..."
                className="min-h-[80px]"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                size="sm"
                variant="outline"
              >
                {savingNotes ? 'Salvando...' : 'Salvar notas'}
              </Button>
            </div>
          )}

          {/* Chips dinâmicos de validação */}
          {validationChips.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Pendências</h4>
              <div className="flex flex-wrap gap-2">
                {validationChips.map((chip, index) => (
                  <Badge
                    key={index}
                    variant={chip.type === 'error' ? 'destructive' : 'secondary'}
                    className={cn(
                      'cursor-pointer',
                      chip.type === 'warning' && 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
                      chip.type === 'error' && 'hover:bg-red-600'
                    )}
                    onClick={() => {
                      // TODO: Navegar para seção específica baseada no chip
                      console.log(`Corrigir: ${chip.message}`);
                    }}
                  >
                    <chip.icon className="h-3 w-3 mr-1" />
                    {chip.message}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Donut para readonly */}
          {attendanceRate !== null && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Taxa de Presença</h4>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${attendanceRate}, 100`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                    {attendanceRate}%
                  </div>
                </div>
                <div className="text-sm">
                  <div>Presentes: {session.attendance_present_count || 0}</div>
                  <div>Total: {session.attendance_total_count || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Progresso para draft */}
          {draftProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Progresso de criação</span>
                <span>{draftProgress.percentage}%</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-1 text-xs">
                  {draftProgress.cargaOk ? (
                    <Icons.Status.CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Icons.Status.Error className="h-3 w-3 text-red-500" />
                  )}
                  <span>Carga</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {draftProgress.exerciciosOk ? (
                    <Icons.Status.CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Icons.Status.Error className="h-3 w-3 text-red-500" />
                  )}
                  <span>Exercícios</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {draftProgress.dadosOk ? (
                    <Icons.Status.CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Icons.Status.Error className="h-3 w-3 text-red-500" />
                  )}
                  <span>Dados</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-between gap-3 py-4 px-6 border-t">
          {actions && 'secondary' in actions && actions.secondary && (
            <Button
              onClick={() => handleAction(actions.secondary.action)}
              variant="outline"
              size="icon"
              aria-label="Deletar sessão"
            >
              <actions.secondary.icon className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => handleAction(actions?.primary?.action || '')}
            size="sm"
          >
            {actions?.primary?.label}
          </Button>
        </div>
        </div>
      </DialogContent>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o treino da agenda. Informe um motivo para continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo (mínimo 5 caracteres)</label>
            <textarea
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Ex: treino cancelado, ajuste de calendario..."
              className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleDeleteSession}
              disabled={deleteReason.trim().length < 5}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Excluir treino
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}