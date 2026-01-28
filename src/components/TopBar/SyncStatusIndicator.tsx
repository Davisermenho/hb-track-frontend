'use client';

/**
 * SyncStatusIndicator - Indicador de status de sincronização
 * 
 * Mostra estado da conexão com o servidor:
 * - ✅ Verde: Sincronizado
 * - 🔄 Azul: Sincronizando
 * - ❌ Vermelho: Offline
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStatus, type SyncState } from '@/hooks/useSyncStatus';

// =============================================================================
// TIPOS
// =============================================================================

interface SyncStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

// =============================================================================
// HELPERS
// =============================================================================

function formatLastSync(date: Date | null): string {
  if (!date) return 'Nunca sincronizado';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Agora mesmo';
  if (minutes < 60) return `Há ${minutes}min`;
  if (hours < 24) return `Há ${hours}h`;
  
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusConfig(status: SyncState, isOnline: boolean) {
  if (!isOnline) {
    return {
      icon: WifiOff,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      dotColor: 'bg-red-500',
      label: 'Offline',
      animate: false,
    };
  }

  switch (status) {
    case 'syncing':
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        dotColor: 'bg-blue-500',
        label: 'Sincronizando',
        animate: true,
      };
    case 'error':
      return {
        icon: CloudOff,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        dotColor: 'bg-amber-500',
        label: 'Erro de sincronização',
        animate: false,
      };
    case 'synced':
    default:
      return {
        icon: Check,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        dotColor: 'bg-green-500',
        label: 'Sincronizado',
        animate: false,
      };
  }
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function SyncStatusIndicator({
  className,
  showLabel = false,
  size = 'md',
}: SyncStatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { status, lastSyncedAt, isOnline, pendingChanges, triggerSync } = useSyncStatus();

  const config = getStatusConfig(status, isOnline);
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'w-7 h-7' 
    : 'w-8 h-8';
  
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={cn('relative', className)}>
      {/* Botão principal */}
      <button
        onClick={triggerSync}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={status === 'syncing' || !isOnline}
        className={cn(
          'relative flex items-center gap-2 rounded-lg transition-colors',
          showLabel ? 'px-2.5 py-1.5' : 'p-2',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label={config.label}
      >
        {/* Ícone com animação */}
        <div className={cn(
          'relative flex items-center justify-center',
          config.color
        )}>
          <Icon className={cn(
            iconSize,
            config.animate && 'animate-spin'
          )} />
          
          {/* Dot pulsante quando sincronizando ou offline */}
          {(status === 'syncing' || !isOnline) && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full',
                config.dotColor,
                status === 'syncing' && 'animate-pulse'
              )}
            />
          )}
        </div>

        {/* Label (opcional) */}
        {showLabel && (
          <span className={cn(
            'text-xs font-medium',
            config.color
          )}>
            {config.label}
          </span>
        )}
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50"
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg px-3 py-2 min-w-[180px]">
              {/* Status */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  config.dotColor
                )} />
                <span className="text-xs font-medium">{config.label}</span>
              </div>

              {/* Última sincronização */}
              <div className="text-[10px] text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Última sync:</span>
                  <span>{formatLastSync(lastSyncedAt)}</span>
                </div>
                
                {pendingChanges > 0 && (
                  <div className="flex justify-between">
                    <span>Pendentes:</span>
                    <span className="text-amber-400">{pendingChanges} alterações</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Conexão:</span>
                  <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Dica */}
              {isOnline && status === 'synced' && (
                <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-700">
                  Clique para sincronizar manualmente
                </p>
              )}

              {/* Seta do tooltip */}
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SyncStatusIndicator;
