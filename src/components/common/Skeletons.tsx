/**
 * Skeleton Components - Loading States
 * 
 * FASE 6.2: Loading States e Skeletons
 * 
 * Componentes para feedback visual durante carregamento
 */

import React from 'react';

// ============================================================================
// SKELETON BASE
// ============================================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ 
  className = '', 
  width, 
  height,
  rounded = 'md' 
}: SkeletonProps) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];
  
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };
  
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${roundedClass} ${className}`}
      style={style}
    />
  );
}

// ============================================================================
// ATHLETE CARD SKELETON
// ============================================================================

export function AthleteCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Skeleton className="w-16 h-16" rounded="full" />
        
        <div className="flex-1 space-y-2">
          {/* Nome */}
          <Skeleton className="h-5 w-3/4" />
          {/* Apelido/Info */}
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Badge de estado */}
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>
      
      <div className="flex items-center gap-2">
        {/* Posição defensiva */}
        <Skeleton className="h-4 w-24" />
        {/* Posição ofensiva */}
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Botões de ação */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

// ============================================================================
// ATHLETE TABLE ROW SKELETON
// ============================================================================

export function AthleteTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10" rounded="full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-6 w-16" rounded="full" />
      </td>
      <td className="py-4 px-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" rounded="md" />
          <Skeleton className="h-8 w-8" rounded="md" />
        </div>
      </td>
    </tr>
  );
}

export function AthleteTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="py-3 px-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="py-3 px-4 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="py-3 px-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="py-3 px-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="py-3 px-4 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <AthleteTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// ATHLETE FORM SKELETON
// ============================================================================

export function AthleteFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Seção 1: Dados Pessoais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome completo */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Data de nascimento */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* RG */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* CPF */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Telefone */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      
      {/* Seção 2: Dados Esportivos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <Skeleton className="h-6 w-36" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gênero */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          
          {/* Posição Defensiva */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Posição Ofensiva */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Número da camisa */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      
      {/* Botões */}
      <div className="flex gap-4 justify-end">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

// ============================================================================
// ATHLETE PROFILE SKELETON
// ============================================================================

export function AthleteProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header com foto e informações básicas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Foto */}
          <Skeleton className="w-32 h-32 mx-auto md:mx-0" rounded="full" />
          
          <div className="flex-1 space-y-4">
            {/* Nome e apelido */}
            <div className="text-center md:text-left">
              <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-5 w-24 mx-auto md:mx-0 mt-2" />
            </div>
            
            {/* Badges de estado */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Skeleton className="h-6 w-20" rounded="full" />
              <Skeleton className="h-6 w-24" rounded="full" />
              <Skeleton className="h-6 w-16" rounded="full" />
            </div>
            
            {/* Info rápida */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-20 mt-1" />
              </div>
              <div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-16 mt-1" />
              </div>
              <div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-24 mt-1" />
              </div>
              <div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20 mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs de conteúdo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD CARD SKELETON
// ============================================================================

export function DashboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12" rounded="full" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// ============================================================================
// LIST SKELETON
// ============================================================================

export function AthleteListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AthleteCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

const Skeletons = {
  Skeleton,
  AthleteCardSkeleton,
  AthleteTableRowSkeleton,
  AthleteTableSkeleton,
  AthleteFormSkeleton,
  AthleteProfileSkeleton,
  DashboardCardSkeleton,
  AthleteListSkeleton,
};

export default Skeletons;
