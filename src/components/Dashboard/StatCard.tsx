/**
 * Card de estatística (reutilizável) - Enhanced com Framer Motion
 * 
 * Features:
 * ✅ Animações com Framer Motion
 * ✅ Micro-animações em ícones (rotate, scale)
 * ✅ Feedback Visual Imediato (verde/vermelho/azul)
 * ✅ Loading States com spinners animados
 * ✅ Tooltips elegantes com Info icons
 * ✅ Acessibilidade (aria-labels, labels corretos)
 * ✅ Dark Mode completo
 * ✅ Responsivo (mobile/desktop)
 * ✅ Badge de sucesso animado
 * ✅ Estado isEmpty com visual cinza
 * ✅ Hover/tap animations
 */

'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  isLoading?: boolean;
  isEmpty?: boolean;
  tooltip?: string;
  badge?: 'success' | 'warning' | 'error';
  onEdit?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800',
};

const badgeColors = {
  success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-300 dark:border-success-700',
  warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-300 dark:border-warning-700',
  error: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border-danger-300 dark:border-danger-700',
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  isLoading = false,
  isEmpty = false,
  tooltip,
  badge,
  onEdit,
}: StatCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const effectiveColor = isEmpty ? 'gray' : color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md
        border border-gray-100 dark:border-gray-700
        transition-all duration-300
        hover:shadow-xl dark:hover:shadow-gray-900/50
        ${isEmpty ? 'opacity-60' : ''}
      `}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
          >
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge de Sucesso Animado */}
      <AnimatePresence>
        {badge && !isLoading && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`
              absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium
              border flex items-center gap-1
              ${badgeColors[badge]}
            `}
          >
            {badge === 'success' && <CheckCircle2 className="size-3" />}
            {badge === 'warning' && <AlertCircle className="size-3" />}
            {badge === 'error' && <AlertCircle className="size-3" />}
            <span className="sr-only">{badge}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title com Tooltip */}
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            
            {tooltip && (
              <div className="relative">
                <motion.button
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={`Informação sobre ${title}`}
                >
                  <Info className="size-4" />
                </motion.button>

                <AnimatePresence>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 top-6 z-50 w-48 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl"
                    >
                      {tooltip}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Value com Animação */}
          <motion.p
            key={String(value)}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`
              text-3xl font-bold mt-1
              ${isEmpty 
                ? 'text-gray-400 dark:text-gray-600' 
                : 'text-gray-900 dark:text-white'
              }
            `}
          >
            {isEmpty ? '-' : value}
          </motion.p>

          {/* Subtitle */}
          {subtitle && !isEmpty && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Trend com Animação */}
          {trend && !isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 mt-3"
            >
              <motion.div
                animate={{
                  y: trend.direction === 'up' ? [-2, 0, -2] : [2, 0, 2],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp className="size-4 text-success-500" />
                ) : (
                  <TrendingDown className="size-4 text-danger-500" />
                )}
              </motion.div>
              
              <span
                className={`text-sm font-semibold ${
                  trend.direction === 'up'
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                }`}
              >
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs. anterior
              </span>
            </motion.div>
          )}

          {/* Empty State */}
          {isEmpty && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400 dark:text-gray-600 mt-2"
            >
              Sem dados disponíveis
            </motion.p>
          )}
        </div>

        {/* Icon com Animação */}
        {icon && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            whileHover={{ scale: 1.1, rotate: 10 }}
            className={`
              p-3 rounded-xl border
              ${colorClasses[effectiveColor]}
            `}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* Botão Editar */}
      {onEdit && !isEmpty && (
        <motion.button
          onClick={onEdit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium
            border transition-all duration-200
            ${colorClasses[effectiveColor]}
            hover:shadow-md
          `}
          aria-label={`Editar ${title}`}
        >
          Editar
        </motion.button>
      )}
    </motion.div>
  );
}
