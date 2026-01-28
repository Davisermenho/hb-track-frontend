'use client';

import { Target, X, Save, Users, Slash, Shield, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import type { ScoutEvent } from '@/types/scout';

interface EventTimelineProps {
  events: ScoutEvent[];
  onDeleteEvent?: (eventId: string) => void;
  className?: string;
}

const eventConfig = {
  goal: {
    icon: Target,
    label: 'Gol',
    color: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-success-200 dark:border-success-800',
  },
  shot_miss: {
    icon: X,
    label: 'Arremesso Errado',
    color: 'text-error-600 dark:text-error-400',
    bgColor: 'bg-error-50 dark:bg-error-900/20',
    borderColor: 'border-error-200 dark:border-error-800',
  },
  save: {
    icon: Save,
    label: 'Defesa',
    color: 'text-info-600 dark:text-info-400',
    bgColor: 'bg-info-50 dark:bg-info-900/20',
    borderColor: 'border-info-200 dark:border-info-800',
  },
  turnover: {
    icon: Slash,
    label: 'Turnover',
    color: 'text-warning-600 dark:text-warning-400',
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    borderColor: 'border-warning-200 dark:border-warning-800',
  },
  foul: {
    icon: Shield,
    label: 'Falta',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  seven_meter: {
    icon: Target,
    label: '7 Metros',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  timeout: {
    icon: Clock,
    label: 'Tempo Técnico',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  substitution: {
    icon: Users,
    label: 'Substituição',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  yellow_card: {
    icon: Shield,
    label: 'Cartão Amarelo',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  red_card: {
    icon: Shield,
    label: 'Cartão Vermelho',
    color: 'text-error-600 dark:text-error-400',
    bgColor: 'bg-error-50 dark:bg-error-900/20',
    borderColor: 'border-error-200 dark:border-error-800',
  },
  two_min_suspension: {
    icon: Clock,
    label: 'Suspensão 2min',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
};

const formatGameTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function EventTimeline({ events, onDeleteEvent, className }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-full text-center p-8',
        className
      )}>
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum evento registrado
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Use os atalhos de teclado ou clique na quadra para registrar eventos
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 overflow-y-auto', className)}>
      {events.map((event, index) => {
        const config = eventConfig[event.type] || eventConfig.foul;
        const Icon = config.icon;

        return (
          <div
            key={event.id}
            className={cn(
              'relative group',
              'border-l-4 pl-4 py-3',
              config.borderColor,
              'hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-r-lg',
              'transition-colors duration-200'
            )}
          >
            {/* Hora e Tempo de Jogo */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  config.bgColor
                )}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('font-semibold text-sm', config.color)}>
                      {config.label}
                    </span>
                    {event.team === 'home' && (
                      <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded">
                        Casa
                      </span>
                    )}
                    {event.team === 'away' && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        Visitante
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatGameTime(event.gameTime)} • {formatRelativeTime(event.timestamp)}
                  </div>
                </div>
              </div>

              {/* Botão Deletar */}
              {onDeleteEvent && (
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error-100 dark:hover:bg-error-900/30 text-error-600 dark:text-error-400 rounded transition-opacity"
                  title="Remover evento"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Detalhes do Evento */}
            <div className="ml-10 space-y-1">
              {event.playerName && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <User className="w-3 h-3" />
                  <span>
                    #{event.playerNumber} {event.playerName}
                  </span>
                </div>
              )}
              
              {event.zone && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Zona: {event.zone.replace('shot_', '').replace('_', ' ')}
                </div>
              )}

              {event.phase && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Fase: {event.phase.replace('_', ' ')}
                </div>
              )}

              {event.details && (
                <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                  {event.details}
                </div>
              )}
            </div>

            {/* Indicador de sucesso/falha */}
            {event.success !== undefined && (
              <div className={cn(
                'ml-10 mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                event.success 
                  ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                  : 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400'
              )}>
                {event.success ? '✓ Sucesso' : '✗ Falha'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}