'use client';

import { motion } from 'framer-motion';
import { Button } from './Button';

/**
 * @deprecated Use `AppEmptyState` de '@/components/app' para novas implementações.
 * Este componente será removido em versão futura.
 * 
 * Migração:
 * ```tsx
 * // Antes
 * import { EmptyState } from '@/components/ui/EmptyState';
 * <EmptyState title="..." action={{ label: '...', onClick: fn }} />
 * 
 * // Depois
 * import { AppEmptyState } from '@/components/app';
 * <AppEmptyState title="..." action={<Button size="sm">...</Button>} />
 * ```
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const MotionDiv = motion.div as any;
  
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {icon && (
        <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </MotionDiv>
  );
}