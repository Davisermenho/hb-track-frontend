/**
 * WeeklyAgenda
 * 
 * Componente principal da Agenda Semanal:
 * - Calendário horizontal (segunda a domingo)
 * - Cards de sessão por dia
 * - Drag & drop entre dias
 * - Hover com resumo
 * - Acoes por status diretamente no card
 * 
 * Design System: Cards compactos, animações suaves
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TrainingSession } from '@/lib/api/trainings';
import { Icons } from '@/design-system/icons';
import { SessionTextBlock } from './SessionTextBlock';
import { SessionExpandedCard } from './SessionExpandedCard';
import { useConflicts } from '@/lib/hooks/useConflicts';

interface WeeklyAgendaProps {
  sessions: TrainingSession[];
  isLoading?: boolean;
  weekStart: Date;
  onSessionClick?: (session: TrainingSession) => void;
  onSessionEdit?: (session: TrainingSession) => void;
  onSessionReview?: (session: TrainingSession) => void;
  onSessionViewDetails?: (session: TrainingSession) => void;
  onSessionViewExecution?: (session: TrainingSession) => void;
  onSessionViewReport?: (session: TrainingSession) => void;
  onSessionMove?: (sessionId: string, newDate: string) => void;
  onCreateSession?: (date: string) => void;
  onCompleteAndSchedule?: (session: TrainingSession) => void;
  onSaveNotes?: (sessionId: string, notes: string) => void;
  onSessionDelete?: (session: TrainingSession, reason: string) => Promise<void>;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyAgenda({
  sessions,
  isLoading = false,
  weekStart,
  onSessionClick,
  onSessionEdit,
  onSessionReview,
  onSessionViewDetails,
  onSessionViewExecution,
  onSessionViewReport,
  onSessionMove,
  onCreateSession,
  onCompleteAndSchedule,
  onSaveNotes,
  onSessionDelete,
}: WeeklyAgendaProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [expandedSession, setExpandedSession] = useState<TrainingSession | null>(null);

  const conflicts = useConflicts(sessions);
  const sessionConflicts = useMemo(() => {
    const conflictMap: Record<string, boolean> = {};
    conflicts.forEach(conflict => {
      conflictMap[conflict.sessionId] = true;
    });
    return conflictMap;
  }, [conflicts]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Gera os dias da semana atual
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  }, [weekStart]);

  // Agrupa sessões por dia
  const sessionsByDay = useMemo(() => {
    const grouped: Record<string, TrainingSession[]> = {};
    
    weekDays.forEach(day => {
      const dateKey = day.toISOString().split('T')[0];
      grouped[dateKey] = [];
    });

    sessions.forEach(session => {
      const sessionDate = new Date(session.session_at).toISOString().split('T')[0];
      if (grouped[sessionDate]) {
        grouped[sessionDate].push(session);
      }
    });

    return grouped;
  }, [sessions, weekDays]);

  // Verifica se é hoje
  const isToday = (date: Date) => {
    const today = new Date().toISOString().split('T')[0];
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === today;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const sessionId = event.active.id as string;
    const session = sessions.find((item) => item.id === sessionId) || null;
    setActiveSession(session);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSession(null);
    if (!over || !onSessionMove) return;

    const sessionId = active.id as string;
    const targetDate = over.id as string;
    const session = sessions.find((item) => item.id === sessionId);
    if (!session || session.status !== 'draft') return;

    const currentDate = new Date(session.session_at).toISOString().split('T')[0];
    if (currentDate === targetDate) return;

    onSessionMove(sessionId, targetDate);
  };

  const toggleDayExpanded = (dateKey: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const handleOpenExpanded = (session: TrainingSession) => {
    setExpandedSession(session);
  };

  const handleCloseExpanded = () => {
    setExpandedSession(null);
  };

  const handleFocusOnFirstTraining = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessionsByDay[today] || [];
    
    if (todaySessions.length > 0) {
      // Find the earliest session today
      const earliestSession = todaySessions.reduce((earliest, current) => {
        const earliestTime = new Date(earliest.session_at);
        const currentTime = new Date(current.session_at);
        return currentTime < earliestTime ? current : earliest;
      });
      
      // Scroll to the column for today
      const todayColumn = document.querySelector(`[data-testid="weekly-day-${today}"]`);
      if (todayColumn) {
        todayColumn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  if (isLoading) {
    return <WeeklyAgendaSkeleton />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveSession(null)}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dateKey = day.toISOString().split('T')[0];
            const daySessions = sessionsByDay[dateKey] || [];
            const today = isToday(day);
            const isExpanded = expandedDays.has(dateKey);
            const visibleSessions = isExpanded ? daySessions : daySessions.slice(0, 4);
            const hiddenCount = Math.max(0, daySessions.length - visibleSessions.length);
            const isEmpty = daySessions.length === 0;

            return (
              <DayColumn
                key={dateKey}
                dateKey={dateKey}
                dayLabel={WEEKDAYS[index]}
                dayNumber={day.getDate()}
                today={today}
                isEmpty={isEmpty}
                sessions={daySessions}
                onCreateSession={onCreateSession}
              >
                <div className="space-y-3 pt-3">
                  {/* Sort sessions by time for this day */}
                  {visibleSessions
                    .sort((a, b) => new Date(a.session_at).getTime() - new Date(b.session_at).getTime())
                    .map((session) => (
                      <DraggableSessionCard
                        key={session.id}
                        session={session}
                        disabled={session.status !== 'draft'}
                      >
                        <SessionTextBlock
                          session={session}
                          disabled={session.status !== 'draft'}
                          hasConflict={sessionConflicts[session.id]}
                          onClick={handleOpenExpanded}
                        />
                      </DraggableSessionCard>
                    ))}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleDayExpanded(dateKey)}
                      className="w-full h-9 rounded-md border border-[#e5e7eb] text-xs font-bold uppercase tracking-wider text-[#616e89] hover:border-[#2463eb]/40 hover:text-[#2463eb] transition-all dark:border-gray-800 dark:text-gray-300 dark:hover:border-[#2463eb]/60"
                    >
                      Ver mais ({hiddenCount})
                    </button>
                  )}
                  {hiddenCount === 0 && isExpanded && daySessions.length > 4 && (
                    <button
                      type="button"
                      onClick={() => toggleDayExpanded(dateKey)}
                      className="w-full h-9 rounded-md border border-[#e5e7eb] text-xs font-bold uppercase tracking-wider text-[#616e89] hover:border-[#2463eb]/40 hover:text-[#2463eb] transition-all dark:border-gray-800 dark:text-gray-300 dark:hover:border-[#2463eb]/60"
                    >
                      Ver menos
                    </button>
                  )}
                </div>
              </DayColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeSession ? (
          <div className="w-full max-w-sm">
            <SessionTextBlock session={activeSession} />
          </div>
        ) : null}
      </DragOverlay>

      <SessionExpandedCard
        session={expandedSession}
        isOpen={!!expandedSession}
        onClose={handleCloseExpanded}
        onEdit={onSessionEdit}
        onReview={onSessionReview}
        onViewDetails={onSessionViewDetails}
        onViewExecution={onSessionViewExecution}
        onViewReport={onSessionViewReport}
        onCompleteAndSchedule={onCompleteAndSchedule}
        onSaveNotes={onSaveNotes}
        onDelete={onSessionDelete}
      />
    </DndContext>
  );
}

interface DayColumnProps {
  dateKey: string;
  dayLabel: string;
  dayNumber: number;
  today: boolean;
  isEmpty: boolean;
  sessions: TrainingSession[];
  onCreateSession?: (date: string) => void;
  children: React.ReactNode;
}

function DayColumn({
  dateKey,
  dayLabel,
  dayNumber,
  today,
  isEmpty,
  sessions,
  onCreateSession,
  children,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });

  // Smart time slots generation based on sessions
  const timeSlots = useMemo(() => {
    const getVisibleHours = (daySessions: TrainingSession[]) => {
      if (daySessions.length === 0) {
        // Default useful hours: 08:00 to 22:00
        return Array.from({ length: 15 }, (_, i) => i + 8); // 8 to 22 inclusive
      }

      const startHours = daySessions.map(s => {
        const time = new Date(s.session_at);
        return time.getHours();
      });
      const endHours = daySessions.map(s => {
        const time = new Date(s.session_at);
        const duration = s.duration_planned_minutes || 60;
        time.setMinutes(time.getMinutes() + duration);
        return time.getHours();
      });

      const minHour = Math.max(0, Math.min(...startHours) - 1); // 1h margin before
      const maxHour = Math.min(23, Math.max(...endHours) + 1);  // 1h margin after

      return Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);
    };

    const visibleHours = getVisibleHours(sessions);
    const slots: Array<{ time: string; hour: number; minute: number }> = [];

    visibleHours.forEach(hour => {
      // Generate 15-minute slots for precise positioning
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        minute: 0,
      });
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:15`,
        hour,
        minute: 15,
      });
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        hour,
        minute: 30,
      });
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:45`,
        hour,
        minute: 45,
      });
    });

    return slots;
  }, [sessions]);

  // Check if early morning hours (00:00-07:00) are collapsed
  const hasEarlyMorningCollapsed = useMemo(() => {
    if (sessions.length === 0) return false;
    const earliestHour = Math.min(...sessions.map(s => new Date(s.session_at).getHours()));
    return earliestHour >= 8; // If earliest training is at 8:00 or later, collapse early morning
  }, [sessions]);

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex min-h-[400px] flex-col gap-0 rounded-xl border border-gray-200 bg-white p-2 transition-all
        hover:border-gray-300 hover:shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:hover:border-gray-600
        ${isOver ? 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20' : ''}
      `}
      data-testid={`weekly-day-${dateKey}`}
    >
      {/* Header */}
      <div className={`flex flex-col pb-4 border-b ${today ? 'border-[#2463eb]' : 'border-slate-200/60'}`}>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider dark:text-gray-400">
          {dayLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {dayNumber}
          </span>
          {today && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Sessions positioned at the top, sorted by time */}
      <div className="flex-1 relative">
        {/* Sessions positioned at the top */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}

interface DraggableSessionCardProps {
  session: TrainingSession;
  disabled?: boolean;
  children: React.ReactNode;
}

function DraggableSessionCard({ session, disabled, children }: DraggableSessionCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    disabled,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.4 : undefined,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// Skeleton Loading
function WeeklyAgendaSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="min-h-[320px] rounded-lg p-2">
            <div className="mb-4 space-y-2">
              <div className="h-3 w-10 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="space-y-3">
              <div className="h-28 rounded-lg bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-800" />
              <div className="h-10 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
