'use client';

/**
 * AppToast - Componente de notificação toast reutilizável
 * 
 * Segue o Design System HB Track Mini
 */

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface AppToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const typeClasses = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const iconClasses = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  info: 'text-blue-500 dark:text-blue-400',
};

export default function AppToast({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  isVisible,
}: AppToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const showToast = () => setIsShowing(true);
      showToast();
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsShowing(false);
    }
  }, [isVisible, duration, onClose]);

  if (!isShowing) return null;

  const Icon = iconMap[type];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300',
          typeClasses[type],
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', iconClasses[type])} />
        <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 rounded p-1 text-gray-400 transition-colors hover:bg-black/10 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Hook helper para usar toasts
export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return {
    toast,
    showToast,
    hideToast,
    ToastComponent: () => (
      <AppToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    ),
  };
}
