'use client';

/**
 * GameEventsTab - Tab de eventos do jogo
 * 
 * Exibe e permite registrar:
 * - Gols
 * - Cartões (amarelo/vermelho)
 * - Substituições
 * - Timeouts
 * - Outros eventos
 */

import { useState } from 'react';
import { Match, MatchEvent } from '@/context/GamesContext';
import AppCard from '@/components/ui/AppCard';
import AppEmptyState from '@/components/ui/AppEmptyState';
import AppTag from '@/components/ui/AppTag';
import GameEventModal from '../modals/GameEventModal';
import { Plus, Clock, Flag, Hand, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface GameEventsTabProps {
  game: Match;
}

// Mock de eventos
const MOCK_EVENTS: MatchEvent[] = [
  {
    id: '1',
    match_id: '1',
    event_type: 'goal',
    minute: 5,
    player_name: 'Pedro Santos',
    description: 'Gol de pivô',
  },
  {
    id: '2',
    match_id: '1',
    event_type: 'yellow_card',
    minute: 12,
    player_name: 'Lucas Oliveira',
    description: 'Falta técnica',
  },
  {
    id: '3',
    match_id: '1',
    event_type: 'goal',
    minute: 18,
    player_name: 'Marcos Costa',
    description: 'Contra-ataque',
  },
  {
    id: '4',
    match_id: '1',
    event_type: 'timeout',
    minute: 25,
    description: 'Timeout técnico',
  },
  {
    id: '5',
    match_id: '1',
    event_type: 'substitution',
    minute: 30,
    player_name: 'Carlos Neto',
    description: 'Entra Carlos, sai Pedro',
  },
];

const EVENT_CONFIG = {
  goal: {
    icon: Flag,
    color: 'green' as const,
    label: 'Gol',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  yellow_card: {
    icon: AlertTriangle,
    color: 'yellow' as const,
    label: 'Cartão Amarelo',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  red_card: {
    icon: AlertTriangle,
    color: 'red' as const,
    label: 'Cartão Vermelho',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  substitution: {
    icon: ArrowRightLeft,
    color: 'blue' as const,
    label: 'Substituição',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  timeout: {
    icon: Hand,
    color: 'purple' as const,
    label: 'Timeout',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  other: {
    icon: Clock,
    color: 'gray' as const,
    label: 'Outro',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
};

export default function GameEventsTab({ game }: GameEventsTabProps) {
  const [events, setEvents] = useState<MatchEvent[]>(MOCK_EVENTS);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  const canAddEvents = game.status !== 'Cancelado';

  const filteredEvents = filterType
    ? events.filter((e) => e.event_type === filterType)
    : events;

  const sortedEvents = [...filteredEvents].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  // Estatísticas de eventos
  const eventStats = {
    goals: events.filter((e) => e.event_type === 'goal').length,
    yellowCards: events.filter((e) => e.event_type === 'yellow_card').length,
    redCards: events.filter((e) => e.event_type === 'red_card').length,
    substitutions: events.filter((e) => e.event_type === 'substitution').length,
  };

  const handleAddEvent = (newEvent: MatchEvent) => {
    setEvents([...events, { ...newEvent, id: String(events.length + 1) }]);
    setIsEventModalOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Linha do Tempo
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {events.length} eventos registrados
          </p>
        </div>

        {canAddEvents && (
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar Evento
          </button>
        )}
      </div>

      {/* Cards de estatísticas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => setFilterType(filterType === 'goal' ? null : 'goal')}
          className={`rounded-lg border p-4 text-left transition-all ${
            filterType === 'goal'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 bg-white hover:border-green-300 dark:border-gray-700 dark:bg-gray-800'
          }`}
        >
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {eventStats.goals}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gols</p>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'yellow_card' ? null : 'yellow_card')}
          className={`rounded-lg border p-4 text-left transition-all ${
            filterType === 'yellow_card'
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
              : 'border-gray-200 bg-white hover:border-yellow-300 dark:border-gray-700 dark:bg-gray-800'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {eventStats.yellowCards}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cartões Amarelos</p>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'red_card' ? null : 'red_card')}
          className={`rounded-lg border p-4 text-left transition-all ${
            filterType === 'red_card'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 bg-white hover:border-red-300 dark:border-gray-700 dark:bg-gray-800'
          }`}
        >
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {eventStats.redCards}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cartões Vermelhos</p>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'substitution' ? null : 'substitution')}
          className={`rounded-lg border p-4 text-left transition-all ${
            filterType === 'substitution'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {eventStats.substitutions}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Substituições</p>
        </button>
      </div>

      {/* Filtro ativo */}
      {filterType && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtro:</span>
          <AppTag
            label={EVENT_CONFIG[filterType as keyof typeof EVENT_CONFIG]?.label || filterType}
            color={EVENT_CONFIG[filterType as keyof typeof EVENT_CONFIG]?.color || 'gray'}
            onRemove={() => setFilterType(null)}
          />
        </div>
      )}

      {/* Lista de eventos */}
      {sortedEvents.length === 0 ? (
        <AppEmptyState
          icon={<Clock className="h-12 w-12" />}
          title="Nenhum evento registrado"
          description={
            game.status === 'Agendado'
              ? 'Os eventos serão registrados durante o jogo'
              : 'Não há eventos para este jogo'
          }
          action={
            canAddEvents
              ? {
                  label: 'Adicionar evento',
                  onClick: () => setIsEventModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <AppCard>
          <div className="relative space-y-0">
            {/* Linha vertical da timeline */}
            <div className="absolute bottom-0 left-6 top-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {sortedEvents.map((event, index) => {
              const config = EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG] || EVENT_CONFIG.other;
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className={`relative flex gap-4 pb-6 ${index === sortedEvents.length - 1 ? 'pb-0' : ''}`}
                >
                  {/* Ícone na timeline */}
                  <div className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>

                  {/* Conteúdo do evento */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {config.label}
                          </span>
                          {event.minute !== undefined && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {event.minute}&apos;
                            </span>
                          )}
                        </div>
                        {event.player_name && (
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {event.player_name}
                          </p>
                        )}
                        {event.description && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <AppTag label={config.label} color={config.color} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AppCard>
      )}

      {/* Modal de adicionar evento */}
      <GameEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        matchId={game.id}
        onSuccess={handleAddEvent}
      />
    </div>
  );
}
