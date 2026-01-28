/**
 * Notification Context - Gerenciamento de Estado de Notificações
 * 
 * @description React Context que integra WebSocket com estado React.
 * Gerencia notificações, contadores e sincronização com backend.
 * 
 * @module NotificationContext
 * 
 * @example
 * ```tsx
 * // App.tsx
 * import { NotificationProvider } from '@/contexts/NotificationContext';
 * 
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 * 
 * // Component.tsx
 * import { useNotificationContext } from '@/contexts/NotificationContext';
 * 
 * const MyComponent = () => {
 *   const { notifications, unreadCount, markAsRead } = useNotificationContext();
 *   
 *   return (
 *     <div>
 *       <span>Você tem {unreadCount} não lidas</span>
 *       {notifications.map(n => (
 *         <div key={n.id} onClick={() => markAsRead(n.id)}>
 *           {n.message}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NotificationWebSocket, ConnectionState } from '@/lib/websocket/NotificationWebSocket';

/**
 * Interface de notificação do backend
 */
export interface Notification {
  id: string;
  user_id?: string;
  type: 'team_assignment' | 'coach_removal' | 'member_added' | 'invite' | 'game' | 'training' | 'info';
  message: string;
  notification_data?: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Interface do contexto
 */
interface NotificationContextValue {
  /** Lista de notificações (ordenadas por created_at DESC) */
  notifications: Notification[];
  
  /** Contadorде notificações não lidas */
  unreadCount: number;
  
  /** Estado da conexão WebSocket */
  connectionState: ConnectionState;
  
  /** Se está carregando dados iniciais */
  isLoading: boolean;
  
  /** Marcar notificação como lida */
  markAsRead: (id: string) => Promise<void>;
  
  /** Marcar todas como lidas */
  markAllAsRead: () => Promise<void>;
  
  /** Buscar notificações (fallback se WebSocket falhar) */
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  
  /** Forçar reconexão WebSocket */
  reconnect: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * Props do Provider
 */
interface NotificationProviderProps {
  children: React.ReactNode;
  /** URL da API (padrão: process.env.NEXT_PUBLIC_API_URL) */
  apiUrl?: string;
}

/**
 * Provider do contexto de notificações
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}) => {
  // Estado
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const wsRef = useRef<NotificationWebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Calcula contador de não lidas
   */
  const updateUnreadCount = useCallback((notifs: Notification[]) => {
    const count = notifs.filter(n => !n.is_read).length;
    setUnreadCount(count);
  }, []);

  /**
   * Adiciona ou atualiza notificação na lista
   */
  const upsertNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      
      if (exists) {
        // Atualizar existente
        return prev.map(n => n.id === notification.id ? notification : n);
      } else {
        // Adicionar nova (no topo)
        return [notification, ...prev];
      }
    });
  }, []);

  /**
   * Handler: carga inicial de notificações (ao conectar WebSocket)
   */
  const handleNotificationsLoaded = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ notifications: Notification[] }>;
    const loadedNotifications = customEvent.detail.notifications;

    console.log(`[NotificationContext] Carregadas ${loadedNotifications.length} notificações iniciais`);
    
    // Ordenar por created_at DESC
    const sorted = [...loadedNotifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setNotifications(sorted);
    updateUnreadCount(sorted);
    setIsLoading(false);
  }, [updateUnreadCount]);

  /**
   * Handler: nova notificação recebida em tempo real
   */
  const handleNotificationReceived = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<Notification>;
    const notification = customEvent.detail;

    console.log('[NotificationContext] Nova notificação recebida:', notification);

    // Adicionar ao topo da lista
    upsertNotification(notification);
    
    // Atualizar contador
    setUnreadCount(prev => notification.is_read ? prev : prev + 1);

    // Opcional: mostrar notificação do navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.message, {
        icon: '/favicon.ico',
        badge: '/badge.png',
      });
    }
  }, [upsertNotification]);

  /**
   * Handler: mudança de estado da conexão WebSocket
   */
  const handleStateChange = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ state: ConnectionState }>;
    const newState = customEvent.detail.state;
    
    console.log(`[NotificationContext] Estado mudou para: ${newState}`);
    setConnectionState(newState);

    // Se entrou em error, iniciar polling fallback
    if (newState === 'error') {
      startPollingFallback();
    } else if (newState === 'connected') {
      stopPollingFallback();
    }
  }, []);

  /**
   * Handler: máximo de tentativas de reconexão atingido
   */
  const handleMaxReconnectAttempts = useCallback(() => {
    console.warn('[NotificationContext] Máximo de tentativas excedido - ativando polling');
    startPollingFallback();
  }, []);

  /**
   * Busca notificações via REST API (fallback)
   */
  const fetchNotifications = useCallback(async (unreadOnly: boolean = false) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.warn('[NotificationContext] Token não encontrado');
        return;
      }

      const params = new URLSearchParams({
        unread_only: unreadOnly.toString(),
        limit: '50',
      });

      const response = await fetch(`${apiUrl}/api/v1/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Ordenar por created_at DESC
      const sorted = [...data.items].sort((a: Notification, b: Notification) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(sorted);
      setUnreadCount(data.unread_count);
      setIsLoading(false);

    } catch (error) {
      console.error('[NotificationContext] Erro ao buscar notificações:', error);
    }
  }, [apiUrl]);

  /**
   * Marca notificação como lida
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${apiUrl}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('[NotificationContext] Erro ao marcar como lida:', error);
    }
  }, [apiUrl]);

  /**
   * Marca todas as notificações como lidas
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${apiUrl}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Atualizar estado local
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: n.read_at || now }))
      );
      
      setUnreadCount(0);

    } catch (error) {
      console.error('[NotificationContext] Erro ao marcar todas como lidas:', error);
    }
  }, [apiUrl]);

  /**
   * Inicia polling fallback (1 requisição a cada 60s)
   */
  const startPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) return; // Já ativo

    console.log('[NotificationContext] Iniciando polling fallback (60s)');
    
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 60000); // 60 segundos
  }, [fetchNotifications]);

  /**
   * Para polling fallback
   */
  const stopPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('[NotificationContext] Polling fallback parado');
    }
  }, []);

  /**
   * Reconecta WebSocket
   */
  const reconnect = useCallback(async () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token && wsRef.current) {
      await wsRef.current.reconnect(token);
    }
  }, []);

  /**
   * Inicialização: conectar WebSocket e registrar listeners
   */
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Inicializar WebSocket
    wsRef.current = NotificationWebSocket.getInstance({ baseUrl: apiUrl });

    // Registrar listeners de eventos do WebSocket
    window.addEventListener('notifications-loaded', handleNotificationsLoaded);
    window.addEventListener('notification-received', handleNotificationReceived);
    window.addEventListener('websocket-state-change', handleStateChange);
    window.addEventListener('websocket-max-reconnect-attempts', handleMaxReconnectAttempts);

    // Conectar se houver token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      wsRef.current.connect(token).catch(err => {
        console.error('[NotificationContext] Erro ao conectar:', err);
        // Fallback: buscar via REST
        fetchNotifications();
      });
    } else {
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      window.removeEventListener('notifications-loaded', handleNotificationsLoaded);
      window.removeEventListener('notification-received', handleNotificationReceived);
      window.removeEventListener('websocket-state-change', handleStateChange);
      window.removeEventListener('websocket-max-reconnect-attempts', handleMaxReconnectAttempts);
      
      stopPollingFallback();
      wsRef.current?.disconnect();
    };
  }, []); // Executar apenas uma vez

  /**
   * Pedir permissão de notificações do navegador
   */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(`[NotificationContext] Permissão de notificações: ${permission}`);
      });
    }
  }, []);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    connectionState,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    reconnect,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook para consumir o contexto
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext deve ser usado dentro de NotificationProvider');
  }
  
  return context;
}
