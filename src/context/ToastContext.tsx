/**
 * ToastContext - Sistema de notificações global para HB Track
 * 
 * Uso:
 * const { toast } = useToast();
 * toast.success('Operação realizada com sucesso!');
 * toast.error('Erro ao processar operação');
 * toast.warning('Atenção: dados não salvos');
 * toast.info('Carregando...');
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    loading: (message: string, options?: ToastOptions) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
    update: (id: string, options: Partial<ToastItem>) => void;
  };
}

interface ToastOptions {
  description?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const TOAST_CONFIGS: Record<ToastType, {
  icon: React.ReactNode;
  colors: string;
  iconColor: string;
}> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    colors: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    colors: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    colors: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    colors: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  loading: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    colors: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
};

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
  loading: Infinity, // Loading não fecha automaticamente
};

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export function ToastProvider({ 
  children, 
  position = 'bottom-right',
  maxToasts = 5 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const initializeToast = () => setIsMounted(true);
    initializeToast();
  }, []);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const dismiss = useCallback((id: string) => {
    // Limpar timeout
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    // Limpar todos os timeouts
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    setToasts([]);
  }, []);

  const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions): string => {
    const id = generateId();
    const duration = options?.duration ?? DEFAULT_DURATION[type];

    const newToast: ToastItem = {
      id,
      type,
      message,
      description: options?.description,
      duration,
      icon: options?.icon,
      action: options?.action,
    };

    setToasts((prev) => {
      // Limitar número de toasts
      const updated = [...prev, newToast];
      if (updated.length > maxToasts) {
        const removed = updated.shift();
        if (removed) {
          const timeout = timeoutsRef.current.get(removed.id);
          if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(removed.id);
          }
        }
      }
      return updated;
    });

    // Auto-dismiss (exceto para loading)
    if (duration !== Infinity) {
      const timeout = setTimeout(() => dismiss(id), duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [dismiss, maxToasts]);

  const update = useCallback((id: string, options: Partial<ToastItem>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...options } : t))
    );

    // Se atualizou o tipo para algo diferente de loading, iniciar auto-dismiss
    if (options.type && options.type !== 'loading') {
      const timeout = timeoutsRef.current.get(id);
      if (timeout) clearTimeout(timeout);
      
      const duration = options.duration ?? DEFAULT_DURATION[options.type];
      if (duration !== Infinity) {
        const newTimeout = setTimeout(() => dismiss(id), duration);
        timeoutsRef.current.set(id, newTimeout);
      }
    }
  }, [dismiss]);

  const toast = {
    success: (message: string, options?: ToastOptions) => addToast('success', message, options),
    error: (message: string, options?: ToastOptions) => addToast('error', message, options),
    warning: (message: string, options?: ToastOptions) => addToast('warning', message, options),
    info: (message: string, options?: ToastOptions) => addToast('info', message, options),
    loading: (message: string, options?: ToastOptions) => addToast('loading', message, options),
    dismiss,
    dismissAll,
    update,
  };

  // Posições
  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      
      {/* Toast Container - renderizado via portal */}
      {isMounted && createPortal(
        <div
          className={cn(
            'fixed z-[100] flex flex-col gap-2 pointer-events-none',
            positionClasses[position]
          )}
          style={{ maxWidth: 'min(400px, calc(100vw - 32px))' }}
        >
          {toasts.map((toastItem) => (
            <ToastComponent
              key={toastItem.id}
              toast={toastItem}
              onDismiss={() => dismiss(toastItem.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

interface ToastComponentProps {
  toast: ToastItem;
  onDismiss: () => void;
}

function ToastComponent({ toast, onDismiss }: ToastComponentProps) {
  const config = TOAST_CONFIGS[toast.type];
  const iconNode = toast.icon ?? config.icon;
  const iconClass = toast.icon ? undefined : config.iconColor;
  const testId = toast.type === 'success' ? 'toast-success' : 
                 toast.type === 'error' ? 'toast-error' : 
                 `toast-${toast.type}`;

  return (
    <div
      data-testid={testId}
      className={cn(
        'pointer-events-auto',
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'animate-in slide-in-from-right-full duration-300',
        'min-w-[280px] max-w-[400px]',
        config.colors
      )}
      role="alert"
    >
      {/* Icon */}
      <span className={cn('flex-shrink-0 mt-0.5', iconClass)}>
        {iconNode}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {toast.message}
        </p>
        {toast.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-xs font-semibold underline hover:no-underline text-slate-700 dark:text-slate-300"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {toast.type !== 'loading' && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  );
}

export default ToastProvider;
