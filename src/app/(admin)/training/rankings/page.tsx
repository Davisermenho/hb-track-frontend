/**
 * Rankings Page - Team Wellness Rankings
 * 
 * Página de rankings de equipes por taxa de resposta wellness
 * Step 28.2: Feature restante - Rankings
 */

import { Suspense } from 'react';
import { RankingsClient } from './RankingsClient';
import { Icons } from '@/design-system/icons';

export const metadata = {
  title: 'Rankings de Equipes | HB Track',
  description: 'Rankings de equipes por taxa de resposta de wellness',
};

export default function RankingsPage() {
  return (
    <Suspense fallback={<RankingsPageSkeleton />}>
      <RankingsClient />
    </Suspense>
  );
}

function RankingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="mt-2 h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="mt-2 h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
