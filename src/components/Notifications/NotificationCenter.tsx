"use client";

/**
 * NotificationCenter - Centro de Notificações In-App
 * 
 * FASE 5.3 - FLUXO_GERENCIAMENTO_ATLETAS.md
 * 
 * Funcionalidades:
 * - Badge com contador de não lidas
 * - Lista de notificações com ícones por tipo
 * - Marcar como lida
 * - Filtro por tipo
 * - Polling para novas notificações (5min)
 * 
 * Regras RAG:
 * - R30/R31: Ações críticas auditáveis geram notificações
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  UserPlus,
  Calendar,
  Activity,
  Shield,
  X,
  Filter,
  Trash2
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'athlete_added'
  | 'athlete_updated'
  | 'state_changed'
  | 'training_scheduled'
  | 'match_scheduled'
  | 'injury_reported';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  actor_name?: string;
  actor_role?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationCenterProps {
  /** Função para buscar notificações do backend */
  onFetchNotifications?: () => Promise<Notification[]>;
  /** Função para marcar notificação como lida */
  onMarkAsRead?: (id: string) => Promise<void>;
  /** Função para marcar todas como lidas */
  onMarkAllAsRead?: () => Promise<void>;
  /** Intervalo de polling em ms (default: 5 min) */
  pollingInterval?: number;
}

// ============================================================================
// CONFIGURAÇÃO DE TIPOS
// ============================================================================

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  info: {
    icon: <Info className="w-5 h-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  success: {
    icon: <CheckCircle2 data-tour="notifications" className="w-5 h-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  athlete_added: {
    icon: <UserPlus className="w-5 h-5" />,
    color: 'text-brand-500',
    bgColor: 'bg-brand-50 dark:bg-brand-900/20',
  },
  athlete_updated: {
    icon: <Activity className="w-5 h-5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  state_changed: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  training_scheduled: {
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  match_scheduled: {
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  injury_reported: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
};

const TYPE_LABELS: Record<string, string> = {
  all: 'Todas',
  info: 'Informação',
  success: 'Sucesso',
  warning: 'Aviso',
  error: 'Erro',
  athlete_added: 'Nova Atleta',
  athlete_updated: 'Atualização',
  state_changed: 'Mudança Estado',
  training_scheduled: 'Treino',
  match_scheduled: 'Partida',
  injury_reported: 'Lesão',
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'athlete_added',
    title: 'Nova atleta cadastrada',
    message: 'Maria Silva foi adicionada à equipe Infantil Feminino',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actor_name: 'João Coordenador',
    actor_role: 'Coordenador',
  },
  {
    id: '2',
    type: 'injury_reported',
    title: 'Lesão registrada',
    message: 'Ana Santos foi marcada como lesionada',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actor_name: 'Dr. Carlos',
    actor_role: 'Treinador',
  },
  {
    id: '3',
    type: 'training_scheduled',
    title: 'Treino agendado',
    message: 'Treino tático para amanhã às 16h',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actor_name: 'Sistema',
  },
  {
    id: '4',
    type: 'state_changed',
    title: 'Estado alterado',
    message: 'Carla Oliveira foi dispensada da equipe',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actor_name: 'Pedro Dirigente',
    actor_role: 'Dirigente',
  },
  {
    id: '5',
    type: 'success',
    title: 'Importação concluída',
    message: '15 atletas importadas com sucesso',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// ============================================================================
// UTILS
// ============================================================================

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR');
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function NotificationCenter({
  onFetchNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  pollingInterval = 5 * 60 * 1000, // 5 minutos
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Polling para novas notificações
  useEffect(() => {
    if (!onFetchNotifications) return;

    const fetchNotifications = async () => {
      try {
        const data = await onFetchNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollingInterval);
    return () => clearInterval(interval);
  }, [onFetchNotifications, pollingInterval]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleMarkAsRead = async (id: string) => {
    if (onMarkAsRead) {
      await onMarkAsRead(id);
    }
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = async () => {
    if (onMarkAllAsRead) {
      await onMarkAllAsRead();
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Filtrar notificações
  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 
                 dark:text-gray-400 dark:hover:text-gray-200 
                 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 
                         flex items-center justify-center text-xs font-bold 
                         text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 
                      rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 
                      overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 
                        flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notificações
            </h3>
            <div className="flex items-center gap-2">
              {/* Botão Filtro */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`p-1.5 rounded-lg transition-colors ${
                  filterType !== 'all'
                    ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Filtrar"
              >
                <Filter className="w-4 h-4" />
              </button>
              
              {/* Marcar todas como lidas */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-brand-500 hover:text-brand-600 
                           dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          {showFilter && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 
                          flex flex-wrap gap-1">
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilterType(value)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    filterType === value
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Lista de Notificações */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              filteredNotifications.map(notification => {
                const config = NOTIFICATION_CONFIG[notification.type];
                
                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 
                              last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                              transition-colors group ${
                                !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                  >
                    <div className="flex gap-3">
                      {/* Ícone */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full 
                                    flex items-center justify-center ${config.bgColor}`}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm font-medium ${
                              !notification.read 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 
                                        line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Ações */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 
                                        transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-green-500 
                                         rounded transition-colors"
                                title="Marcar como lida"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-500 
                                       rounded transition-colors"
                              title="Remover"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Meta */}
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.created_at)}</span>
                          {notification.actor_name && (
                            <>
                              <span>•</span>
                              <span>
                                {notification.actor_name}
                                {notification.actor_role && ` (${notification.actor_role})`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Indicador de não lida */}
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 
                        text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navegar para página de notificações
              }}
              className="text-sm text-brand-500 hover:text-brand-600 
                       dark:text-brand-400 dark:hover:text-brand-300"
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HOOK PARA NOTIFICAÇÕES
// ============================================================================

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // TODO: Chamar API real
      // const response = await apiClient.get<Notification[]>('/notifications');
      // setNotifications(response);
      setNotifications(MOCK_NOTIFICATIONS);
    } catch (err) {
      setError('Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    // TODO: Chamar API real
    // await apiClient.patch(`/notifications/${id}/read`);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    // TODO: Chamar API real
    // await apiClient.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    isLoading,
    error,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
