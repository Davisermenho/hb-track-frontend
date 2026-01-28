'use client';

import { motion } from 'framer-motion';
import { Edit2, Check } from 'lucide-react';
import { ReactNode } from 'react';

interface ReviewCardProps {
  title: string;
  icon?: ReactNode;
  onEdit?: () => void;
  children: ReactNode;
  isEmpty?: boolean;
}

export function ReviewCard({ title, icon, onEdit, children, isEmpty }: ReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-xl p-5 border-2 transition-all
        ${isEmpty
          ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
          : 'border-success-200 dark:border-success-900/30 bg-white dark:bg-gray-900 shadow-md'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`
              size-10 rounded-lg flex items-center justify-center
              ${isEmpty
                ? 'bg-gray-200 dark:bg-gray-800'
                : 'bg-success-100 dark:bg-success-950/30'
              }
            `}>
              {icon}
            </div>
          )}
          
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {isEmpty && (
              <p className="text-xs text-gray-500 dark:text-gray-600 mt-0.5">
                Não preenchido
              </p>
            )}
          </div>
        </div>

        {onEdit && !isEmpty && (
          <motion.button
            type="button"
            onClick={onEdit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Edit2 className="size-3" />
            Editar
          </motion.button>
        )}
      </div>

      {/* Content */}
      {!isEmpty && (
        <div className="space-y-2">
          {children}
        </div>
      )}

      {/* Success Badge */}
      {!isEmpty && (
        <div className="absolute -top-2 -right-2 size-6 bg-success-500 rounded-full flex items-center justify-center shadow-lg">
          <Check className="size-4 text-white" strokeWidth={3} />
        </div>
      )}
    </motion.div>
  );
}

// Componente helper para exibir dados
export function ReviewItem({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        {label}:
      </span>
      <span className="text-sm text-gray-900 dark:text-white font-medium text-right">
        {value}
      </span>
    </div>
  );
}
