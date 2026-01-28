'use client';

/**
 * AppTabs - Componente de tabs reutilizável
 * 
 * Segue o Design System HB Track Mini
 */

import { cn } from '@/lib/utils';
import { FileText, Users, Clock, BarChart3, ClipboardList, LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: string | 'document' | 'users' | 'clock' | 'chart' | 'clipboard';
  disabled?: boolean;
}

interface AppTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'boxed';
  size?: 'sm' | 'md';
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  document: FileText,
  users: Users,
  clock: Clock,
  chart: BarChart3,
  clipboard: ClipboardList,
};

export default function AppTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  size = 'md',
  className,
}: AppTabsProps) {
  const getVariantClasses = (isActive: boolean, disabled: boolean) => {
    if (disabled) {
      return 'text-gray-400 dark:text-gray-600 cursor-not-allowed';
    }

    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700';
      
      case 'boxed':
        return isActive
          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow border border-gray-200 dark:border-gray-700'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
      
      case 'underline':
      default:
        return isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent';
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <div
      className={cn(
        'flex',
        variant === 'underline' && 'border-b border-gray-200 dark:border-gray-700 gap-0',
        variant === 'pills' && 'gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg',
        variant === 'boxed' && 'gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon && typeof tab.icon === 'string' ? iconMap[tab.icon] : null;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'flex items-center gap-2 font-medium transition-all duration-200',
              sizeClasses[size],
              variant === 'pills' && 'rounded-md',
              variant === 'boxed' && 'rounded-lg',
              getVariantClasses(isActive, !!tab.disabled)
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
