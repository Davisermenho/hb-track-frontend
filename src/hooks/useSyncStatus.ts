'use client';

/**
 * useSyncStatus - Hook para monitorar status de sincronização
 * 
 * Rastreia estado da conexão e sincronização com o servidor.
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// TIPOS
// =============================================================================

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncStatus {
  status: SyncState;
  lastSyncedAt: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  message?: string;
}

interface UseSyncStatusReturn extends SyncStatus {
  triggerSync: () => void;
  markAsSynced: () => void;
  addPendingChange: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const STORAGE_KEY = 'hbtrack-last-sync';

// =============================================================================
// HOOK
// =============================================================================

export function useSyncStatus(): UseSyncStatusReturn {
  const [status, setStatus] = useState<SyncState>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Date(stored) : null;
  });
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });
  const [pendingChanges, setPendingChanges] = useState(0);
  const [message, setMessage] = useState<string>();

  // Escutar mudanças de conexão
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setStatus('syncing');
      setMessage('Reconectado. Sincronizando...');
      
      // Simular sincronização após reconexão
      setTimeout(() => {
        setStatus('synced');
        setLastSyncedAt(new Date());
        setMessage(undefined);
        setPendingChanges(0);
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
      setMessage('Sem conexão com a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Disparar sincronização manual
  const triggerSync = useCallback(() => {
    if (!isOnline) {
      setMessage('Não é possível sincronizar offline');
      return;
    }

    setStatus('syncing');
    setMessage('Sincronizando...');

    // Simular sincronização (substituir por chamada real à API)
    setTimeout(() => {
      setStatus('synced');
      setLastSyncedAt(new Date());
      setPendingChanges(0);
      setMessage(undefined);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }, 1500);
  }, [isOnline]);

  // Marcar como sincronizado
  const markAsSynced = useCallback(() => {
    setStatus('synced');
    setLastSyncedAt(new Date());
    setPendingChanges(0);
    setMessage(undefined);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  }, []);

  // Adicionar mudança pendente
  const addPendingChange = useCallback(() => {
    setPendingChanges(prev => prev + 1);
    if (isOnline && status === 'synced') {
      setStatus('syncing');
    }
  }, [isOnline, status]);

  return {
    status,
    lastSyncedAt,
    isOnline,
    pendingChanges,
    message,
    triggerSync,
    markAsSynced,
    addPendingChange,
  };
}

export default useSyncStatus;
