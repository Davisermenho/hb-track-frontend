"use client";

/**
 * AthleteTimeline - Timeline Visual do Histórico da Atleta
 * 
 * FASE 5.4 - FLUXO_GERENCIAMENTO_ATLETAS.md
 * 
 * Funcionalidades:
 * - Eventos cronológicos com ícones
 * - Filtro por tipo de evento
 * - Exibição de mudanças (old → new)
 * - Actor e timestamp
 * 
 * Regras RAG:
 * - R30: Ações críticas auditáveis
 * - R31: Log obrigatório (actor_id, timestamp, action, context, old_value, new_value)
 * - R34: Imutabilidade dos logs
 */

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Edit2,
  Shield,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export type TimelineEventType =
  | 'created'
  | 'updated'
  | 'state_changed'
  | 'injury_start'
  | 'injury_end'
  | 'suspension_start'
  | 'suspension_end'
  | 'team_registered'
  | 'team_unregistered'
  | 'position_changed'
  | 'training_attended'
  | 'match_played'
  | 'medical_case'
  | 'observation_added';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  description: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, unknown>;
}

interface AthleteTimelineProps {
  athleteId: string;
  events?: TimelineEvent[];
  onFetchEvents?: (athleteId: string) => Promise<TimelineEvent[]>;
  maxHeight?: string;
}

// ============================================================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================================================

const EVENT_CONFIG: Record<TimelineEventType, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
}> = {
  created: {
    icon: <UserPlus className="w-4 h-4" />,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Cadastro',
  },
  updated: {
    icon: <Edit2 className="w-4 h-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Atualização',
  },
  state_changed: {
    icon: <Shield className="w-4 h-4" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Mudança de Estado',
  },
  injury_start: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Lesão Registrada',
  },
  injury_end: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Alta de Lesão',
  },
  suspension_start: {
    icon: <Shield className="w-4 h-4" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Suspensão',
  },
  suspension_end: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Fim da Suspensão',
  },
  team_registered: {
    icon: <Users className="w-4 h-4" />,
    color: 'text-brand-500',
    bgColor: 'bg-brand-100 dark:bg-brand-900/30',
    label: 'Vínculo com Equipe',
  },
  team_unregistered: {
    icon: <Users className="w-4 h-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    label: 'Desvinculação',
  },
  position_changed: {
    icon: <Activity className="w-4 h-4" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    label: 'Mudança de Posição',
  },
  training_attended: {
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    label: 'Treino',
  },
  match_played: {
    icon: <Award className="w-4 h-4" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Partida',
  },
  medical_case: {
    icon: <Activity className="w-4 h-4" />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    label: 'Caso Médico',
  },
  observation_added: {
    icon: <Edit2 className="w-4 h-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    label: 'Observação',
  },
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    type: 'created',
    timestamp: '2024-01-15T10:30:00Z',
    description: 'Atleta cadastrada no sistema',
    actor_name: 'João Coordenador',
    actor_role: 'Coordenador',
  },
  {
    id: '2',
    type: 'team_registered',
    timestamp: '2024-01-15T10:35:00Z',
    description: 'Vinculada à equipe Infantil Feminino',
    actor_name: 'João Coordenador',
    actor_role: 'Coordenador',
    new_value: 'Infantil Feminino',
  },
  {
    id: '3',
    type: 'training_attended',
    timestamp: '2024-01-20T16:00:00Z',
    description: 'Participou do treino tático',
    actor_name: 'Carlos Treinador',
    actor_role: 'Treinador',
  },
  {
    id: '4',
    type: 'injury_start',
    timestamp: '2024-02-10T09:00:00Z',
    description: 'Lesão no tornozelo esquerdo',
    actor_name: 'Dr. Paulo',
    actor_role: 'Médico',
    old_value: 'Sem lesão',
    new_value: 'Tornozelo esquerdo - Entorse',
  },
  {
    id: '5',
    type: 'injury_end',
    timestamp: '2024-02-28T14:00:00Z',
    description: 'Alta médica - Liberada para treinos',
    actor_name: 'Dr. Paulo',
    actor_role: 'Médico',
    old_value: 'Tornozelo esquerdo - Entorse',
    new_value: 'Sem lesão',
  },
  {
    id: '6',
    type: 'position_changed',
    timestamp: '2024-03-05T11:00:00Z',
    description: 'Posição ofensiva alterada',
    actor_name: 'Carlos Treinador',
    actor_role: 'Treinador',
    old_value: 'Armadora Central',
    new_value: 'Lateral Esquerda',
  },
  {
    id: '7',
    type: 'match_played',
    timestamp: '2024-03-15T15:00:00Z',
    description: 'Jogou contra Clube XYZ (vitória 25-20)',
    actor_name: 'Sistema',
    metadata: { goals: 5, assists: 3 },
  },
  {
    id: '8',
    type: 'team_registered',
    timestamp: '2024-04-01T10:00:00Z',
    description: 'Promovida para equipe Cadete Feminino',
    actor_name: 'Maria Dirigente',
    actor_role: 'Dirigente',
    new_value: 'Cadete Feminino',
  },
];

// ============================================================================
// UTILS
// ============================================================================

function formatDateTime(dateStr: string): { date: string; time: string } {
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function groupEventsByMonth(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  
  events.forEach(event => {
    const date = new Date(event.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    if (!groups.has(monthName)) {
      groups.set(monthName, []);
    }
    groups.get(monthName)!.push(event);
  });
  
  return groups;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function AthleteTimeline({
  athleteId,
  events: propEvents,
  onFetchEvents,
  maxHeight = '600px',
}: AthleteTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(propEvents || MOCK_EVENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Carregar eventos
  useEffect(() => {
    if (propEvents) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvents(propEvents);
      return;
    }
    
    if (onFetchEvents) {
      setIsLoading(true);
      onFetchEvents(athleteId)
        .then(data => setEvents(data))
        .catch(err => console.error('Erro ao carregar histórico:', err))
        .finally(() => setIsLoading(false));
    }
  }, [athleteId, propEvents, onFetchEvents]);

  // Inicializar meses expandidos
  useEffect(() => {
    const groupedEvents = groupEventsByMonth(events);
    const months = Array.from(groupedEvents.keys());
    if (months.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedMonths(new Set([months[0]])); // Expandir primeiro mês
    }
  }, [events]);

  // Filtrar eventos
  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.type === filterType);

  // Agrupar por mês
  const groupedEvents = groupEventsByMonth(
    [...filteredEvents].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  );

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  // Tipos únicos para filtro
  const uniqueTypes = Array.from(new Set(events.map(e => e.type)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Histórico da Atleta
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {events.length} eventos registrados
              </p>
            </div>
          </div>
          
          {/* Botão Filtro */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg 
                      transition-colors ${
                        filterType !== 'all'
                          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterType === 'all'
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Todos
            </button>
            {uniqueTypes.map(type => {
              const config = EVENT_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterType === type
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum evento encontrado</p>
          </div>
        ) : (
          <div className="p-4">
            {Array.from(groupedEvents.entries()).map(([month, monthEvents]) => (
              <div key={month} className="mb-4">
                {/* Cabeçalho do Mês */}
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex items-center justify-between px-3 py-2 mb-2 
                           bg-gray-50 dark:bg-gray-700/50 rounded-lg 
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {month}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''}
                    </span>
                    {expandedMonths.has(month) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Eventos do Mês */}
                {expandedMonths.has(month) && (
                  <div className="space-y-4 pl-4">
                    {monthEvents.map((event, index) => {
                      const config = EVENT_CONFIG[event.type];
                      const { date, time } = formatDateTime(event.timestamp);
                      const isLast = index === monthEvents.length - 1;

                      return (
                        <div key={event.id} className="relative flex gap-4">
                          {/* Linha conectora */}
                          {!isLast && (
                            <div className="absolute left-5 top-10 bottom-0 w-0.5 
                                          bg-gray-200 dark:bg-gray-700" />
                          )}

                          {/* Ícone */}
                          <div className={`relative z-10 flex-shrink-0 w-10 h-10 
                                        rounded-full flex items-center justify-center 
                                        ${config.bgColor}`}>
                            <span className={config.color}>{config.icon}</span>
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 pb-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              {/* Header do evento */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className={`text-xs font-medium ${config.color}`}>
                                    {config.label}
                                  </span>
                                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {event.description}
                                  </p>
                                </div>
                                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                  <p>{date}</p>
                                  <p>{time}</p>
                                </div>
                              </div>

                              {/* Mudança old → new */}
                              {event.old_value && event.new_value && (
                                <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border 
                                              border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500 line-through">
                                      {event.old_value}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {event.new_value}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Apenas new_value (sem old) */}
                              {!event.old_value && event.new_value && (
                                <div className="mt-2">
                                  <span className="inline-block px-2 py-1 text-xs font-medium 
                                                 bg-brand-50 dark:bg-brand-900/20 
                                                 text-brand-600 dark:text-brand-400 rounded">
                                    {event.new_value}
                                  </span>
                                </div>
                              )}

                              {/* Actor */}
                              {event.actor_name && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  Por {event.actor_name}
                                  {event.actor_role && ` (${event.actor_role})`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HOOK PARA HISTÓRICO
// ============================================================================

export function useAthleteHistory(athleteId: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      // TODO: Chamar API real
      // const response = await apiClient.get<TimelineEvent[]>(`/athletes/${athleteId}/history`);
      // setEvents(response);
      
      // Mock
      await new Promise(resolve => setTimeout(resolve, 500));
      setEvents(MOCK_EVENTS);
    } catch (err) {
      setError('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (athleteId) {
      fetchHistory();
    }
  }, [athleteId]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

