/**
 * SessionTextBlock
 *
 * Bloco de texto compacto para grade semanal:
 * - Linha 1: Nome da sessão + ícone do tipo
 * - Linha 2: Horário + badge de status
 * - Alinhamento à esquerda na coluna
 * - Suporte drag-and-drop
 * - Visualização de conflitos
 *
 * Design System: Texto limpo, ícones discretos
 */

'use client';

import React, { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { TrainingSession } from '@/lib/api/trainings';
import { useSessionIntelligence } from '@/hooks/useSessionIntelligence';
import { Icons } from '@/design-system/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SessionTextBlockProps {
  session: TrainingSession;
  disabled?: boolean;
  hasConflict?: boolean;
  onClick?: (session: TrainingSession) => void;
}

/**
 * Ícones por tipo de sessão - Phosphor Professional
 */
const SESSION_TYPE_ICONS = {
  quadra: Icons.Training.SessionTypes.Quadra,
  fisico: Icons.Training.SessionTypes.Fisico,
  video: Icons.UI.Video,
  reuniao: Icons.Training.SessionTypes.Reuniao,
  analise: Icons.Training.SessionTypes.Analise,
  teste: Icons.Training.SessionTypes.Teste,
};

export function SessionTextBlock({ session, disabled = false, hasConflict = false, onClick }: SessionTextBlockProps) {
  const TypeIcon = SESSION_TYPE_ICONS[session.session_type?.toLowerCase() as keyof typeof SESSION_TYPE_ICONS] || Icons.Training.Session;
  const intelligence = useSessionIntelligence(session);

  // Drag and drop
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    disabled: disabled || session.status !== 'draft',
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Tooltip content
  const tooltipContent = useMemo(() => {
    const time = new Date(session.session_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const duration = session.duration_planned_minutes || 60;
    return `${session.main_objective || 'Sem objetivo'} • ${time} • ${duration}min`;
  }, [session]);

  // Time display
  const timeDisplay = useMemo(() => {
    return new Date(session.session_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [session.session_at]);

  // Status text and styling
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft': return { text: 'Rascunho', bg: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600' };
      case 'scheduled': return { text: 'Agendado', bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700' };
      case 'in_progress': return { text: 'Em andamento', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700' };
      case 'pending_review': return { text: 'Revisão', bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700' };
      case 'readonly': return { text: 'Finalizado', bg: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600' };
      default: return { text: 'Rascunho', bg: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600' };
    }
  };

  const statusInfo = getStatusInfo(session.status);

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={cn(
        'relative w-full max-w-full cursor-pointer transition-all duration-200 rounded-md p-2 bg-transparent border border-dashed border-gray-400 dark:border-gray-500',
        'hover:scale-[1.02] hover:shadow-md hover:-translate-y-0.5',
        isDragging && 'opacity-50 rotate-2 scale-105 z-50 shadow-2xl',
        disabled && 'cursor-not-allowed opacity-60'
      )}
      onClick={() => !isDragging && onClick?.(session)}
      title={tooltipContent}
      {...listeners}
      {...attributes}
    >
      {/* Linha 1: Nome da sessão + ícone do tipo + ícone de alerta */}
      <div className="flex items-center gap-2 mb-1">
        <TypeIcon className="h-4 w-4 flex-shrink-0 text-slate-600 dark:text-gray-300" />
        <span className="text-xs font-medium text-slate-800 dark:text-gray-200 truncate flex-1">
          {session.main_objective || 'Sem título'}
        </span>
        {/* Alert icon dentro do contorno, alinhado à direita */}
        {intelligence.hasAnyAlert && (
          <Icons.Status.Warning className="h-3 w-3 flex-shrink-0 text-amber-500" />
        )}
      </div>

      {/* Linha 2: Horário + badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          {timeDisplay}
        </span>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] px-1.5 py-0 h-4 flex items-center border-current',
            statusInfo.bg
          )}
        >
          {statusInfo.text}
        </Badge>
      </div>
    </div>
  );
}