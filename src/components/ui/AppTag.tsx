'use client';

/**
 * AppTag - Componente de tag/badge reutilizável
 * 
 * Segue o Design System HB Track Mini
 */

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TagColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';

interface AppTagProps {
  label: string;
  color?: TagColor;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

const colorClasses: Record<TagColor, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function AppTag({
  label,
  color = 'gray',
  size = 'md',
  onRemove,
  className,
}: AppTagProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
