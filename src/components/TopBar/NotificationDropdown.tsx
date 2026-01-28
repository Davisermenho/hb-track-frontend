'use client';

/**
 * NotificationDropdown - Menu de notificações na topbar
 * 
 * Exibe notificações com badge de não lidas e ações rápidas.
 * Integrado com NotificationContext para dados reais via WebSocket + REST API.
 * 
 * @version 2.0.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Users,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationContext, type Notification } from '@/context/NotificationContext';
import { dropdownVariants } from '@/lib/animations';

// =============================================================================
// TIPOS
// =============================================================================

// Notification type importado do NotificationContext:
// interface Notification {
//   id: string;
//   user_id: string;
//   type: 'team_assignment' | 'coach_removal' | 'member_added' | 'invite' | 'game' | 'training' | 'info';
//   message: string;
//   notification_data: any;
//   is_read: boolean;
//   read_at: string | null;
//   created_at: string;
// }

interface NotificationDropdownProps {
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'team_assignment':
    case 'member_added':
    case 'invite':
      return Users;
    case 'game':
      return Trophy;
    case 'training':
      return Calendar;
    case 'coach_removal':
      return AlertCircle;
    default:
      return Bell;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return 'Ontem';
  return `${days}d`;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function NotificationDropdown({
  className,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Integração com NotificationContext
  const {
    notifications,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationContext();

  // Polling fallback se WebSocket falhar
  useEffect(() => {
    if (connectionState === 'error') {
      const interval = setInterval(() => {
        fetchNotifications(false); // Busca todas as notificações
      }, 60000); // 60 segundos

      return () => clearInterval(interval);
    }
  }, [connectionState, fetchNotifications]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Marcar como lida
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Botão */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-gray-600 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type);
                  const isWarning = notification.type === 'coach_removal';
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                        !notification.is_read && 'bg-brand-50/50 dark:bg-brand-900/10'
                      )}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      {/* Ícone */}
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isWarning
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm line-clamp-2',
                            notification.is_read
                              ? 'text-gray-600 dark:text-gray-400' 
                              : 'text-gray-900 dark:text-white font-medium'
                          )}>
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>

                        {/* Metadados (opcional) */}
                        {notification.notification_data?.team_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            Equipe: {notification.notification_data.team_name}
                          </p>
                        )}

                        {/* Ações */}
                        {!notification.is_read && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Check className="w-3 h-3" />
                              Marcar como lida
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-xs text-center text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationDropdown;
