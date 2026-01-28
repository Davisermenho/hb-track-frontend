/**
 * Skeleton Loading Components para Dashboard
 *
 * Implementa loading states visuais que:
 * 1. Reduzem percepção de lentidão
 * 2. Mantêm layout estável (evita layout shift)
 * 3. Indicam ao usuário que dados estão carregando
 */

'use client';

import React from 'react';

// =============================================================================
// COMPONENTE BASE SKELETON
// =============================================================================

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  style?: React.CSSProperties;
}

export function Skeleton({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
  style,
}: SkeletonProps) {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${width} ${height} ${roundedClass} ${className}`}
      style={style}
    />
  );
}

// =============================================================================
// STAT CARD SKELETON
// =============================================================================

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton width="w-24" height="h-4" className="mb-2" />
          <Skeleton width="w-16" height="h-8" className="mb-1" />
          <Skeleton width="w-20" height="h-3" />
        </div>
        <Skeleton width="w-12" height="h-12" rounded="full" />
      </div>
    </div>
  );
}

// =============================================================================
// WELLNESS RADAR SKELETON
// =============================================================================

export function WellnessRadarSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 h-full">
      <Skeleton width="w-32" height="h-5" className="mb-4" />
      <div className="flex items-center justify-center h-[200px]">
        <Skeleton width="w-40" height="h-40" rounded="full" className="opacity-50" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton width="w-full" height="h-3" />
        <Skeleton width="w-3/4" height="h-3" />
      </div>
    </div>
  );
}

// =============================================================================
// TRAINING CHART SKELETON
// =============================================================================

// Alturas fixas para evitar hydration mismatch (servidor vs cliente)
const CHART_BAR_HEIGHTS = [65, 78, 45, 82, 55, 70, 90, 42, 68, 75, 50, 85];

export function TrainingChartSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <Skeleton width="w-40" height="h-5" className="mb-2" />
        <Skeleton width="w-64" height="h-3" />
      </div>
      <div className="flex items-end justify-between h-[200px] gap-2">
        {CHART_BAR_HEIGHTS.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <Skeleton
              width="w-full"
              height="h-full"
              className="animate-pulse"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// RECENT TRAININGS SKELETON
// =============================================================================

export function RecentTrainingsSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <Skeleton width="w-40" height="h-5" className="mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <Skeleton width="w-10" height="h-10" rounded="lg" />
            <div className="flex-1">
              <Skeleton width="w-32" height="h-4" className="mb-2" />
              <Skeleton width="w-48" height="h-3" />
            </div>
            <Skeleton width="w-16" height="h-6" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MEDICAL SUMMARY SKELETON
// =============================================================================

export function MedicalSummarySkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <Skeleton width="w-40" height="h-5" className="mb-4" />
      <div className="grid grid-cols-3 gap-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <Skeleton width="w-8" height="h-8" className="mx-auto mb-2" />
            <Skeleton width="w-16" height="h-3" className="mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton width="w-3" height="h-3" rounded="full" />
            <Skeleton width="w-full" height="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// WEEKLY HEADER SKELETON
// =============================================================================

export function WeeklyHeaderSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Próximo Treino */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Skeleton width="w-12" height="h-12" rounded="lg" />
          <div className="flex-1">
            <Skeleton width="w-24" height="h-4" className="mb-2" />
            <Skeleton width="w-32" height="h-5" className="mb-1" />
            <Skeleton width="w-20" height="h-3" />
          </div>
        </div>
      </div>

      {/* Próximo Jogo */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Skeleton width="w-12" height="h-12" rounded="lg" />
          <div className="flex-1">
            <Skeleton width="w-24" height="h-4" className="mb-2" />
            <Skeleton width="w-40" height="h-5" className="mb-1" />
            <Skeleton width="w-28" height="h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ATHLETE KPIS SKELETON
// =============================================================================

export function AthleteKPIsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 text-center">
          <Skeleton width="w-12" height="h-8" className="mx-auto mb-2" />
          <Skeleton width="w-16" height="h-3" className="mx-auto" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// FULL DASHBOARD SKELETON
// =============================================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho Semanal */}
      <WeeklyHeaderSkeleton />

      {/* KPIs de Atletas */}
      <AthleteKPIsSkeleton />

      {/* Bloco 1: Stats + Wellness */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="lg:col-span-4">
          <WellnessRadarSkeleton />
        </div>
      </div>

      {/* Bloco 2: Gráfico de Tendências */}
      <TrainingChartSkeleton />

      {/* Bloco 3: Treinos Recentes + Medical */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTrainingsSkeleton />
        <MedicalSummarySkeleton />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
