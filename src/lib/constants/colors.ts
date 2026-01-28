/**
 * Color system for athlete states and UI elements
 */

export const STATE_COLORS = {
  ativa: {
    bg: 'bg-success-50 dark:bg-success-950',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-300 dark:border-success-700',
    dot: 'bg-success-500',
  },
  dispensada: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-700',
    dot: 'bg-gray-500',
  },
  arquivada: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-500',
    border: 'border-gray-300 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
} as const;

export const FLAG_COLORS = {
  injured: {
    bg: 'bg-error-50 dark:bg-error-950',
    text: 'text-error-700 dark:text-error-400',
    border: 'border-error-300 dark:border-error-700',
    dot: 'bg-error-500',
  },
  suspended: {
    bg: 'bg-warning-50 dark:bg-warning-950',
    text: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-300 dark:border-warning-700',
    dot: 'bg-warning-500',
  },
  medical_restriction: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-300 dark:border-orange-700',
    dot: 'bg-orange-500',
  },
  load_restricted: {
    bg: 'bg-blue-light-50 dark:bg-blue-light-950',
    text: 'text-blue-light-700 dark:text-blue-light-400',
    border: 'border-blue-light-300 dark:border-blue-light-700',
    dot: 'bg-blue-light-500',
  },
} as const;

export const LOAD_COLORS = {
  deficit: {
    bg: 'bg-warning-50 dark:bg-warning-950',
    text: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-300 dark:border-warning-700',
    indicator: 'bg-warning-500',
  },
  optimal: {
    bg: 'bg-success-50 dark:bg-success-950',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-300 dark:border-success-700',
    indicator: 'bg-success-500',
  },
  excess: {
    bg: 'bg-error-50 dark:bg-error-950',
    text: 'text-error-700 dark:text-error-400',
    border: 'border-error-300 dark:border-error-700',
    indicator: 'bg-error-500',
  },
} as const;