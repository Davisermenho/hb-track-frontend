'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  style,
}: SkeletonProps) {
  const MotionDiv = motion.div as any;
  
  return (
    <MotionDiv
      style={style}
      animate={
        animation === 'wave'
          ? {
              backgroundPosition: ['200% 0', '-200% 0'],
            }
          : undefined
      }
      transition={
        animation === 'wave'
          ? {
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            }
          : undefined
      }
      className={cn(
        'bg-gray-200 dark:bg-gray-800',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' &&
          'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" className="size-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" className="size-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para cards de métricas/estatísticas
 */
export function SkeletonMetricCard() {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-5">
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton variant="circular" className="size-5" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/**
 * Skeleton para gráficos
 */
export function SkeletonChart({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div style={{ height }} className="flex items-end gap-2">
        {Array.from({ length: 6 }).map((_, i) => {
          // Usar altura determinística baseada no índice
          const heights = [40, 85, 60, 95, 70, 55];
          return (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${heights[i]}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Skeleton para tabela de membros (Teams)
 */
export function SkeletonMembersTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-6">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-6">
            <Skeleton variant="circular" className="size-9" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de treinos (Teams)
 */
export function SkeletonTrainingsList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
        <Skeleton className="h-9 w-64" />
      </div>
      {/* Table */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-6">
            <Skeleton className="size-8 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para Overview da equipe
 */
export function SkeletonTeamOverview() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome block */}
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-full max-w-lg mb-4" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members table */}
        <div className="lg:col-span-2">
          <Skeleton className="h-5 w-40 mb-4" />
          <SkeletonMembersTable rows={3} />
        </div>

        {/* Next activity */}
        <div>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-8">
            <Skeleton variant="circular" className="size-12 mx-auto mb-4" />
            <Skeleton className="h-4 w-32 mx-auto mb-2" />
            <Skeleton className="h-3 w-40 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
