/**
 * Top Performers Page - Team Top 5 Athletes
 * 
 * Página dos top 5 atletas com melhor taxa de resposta wellness
 * Step 28.2: Feature restante - Top Performers
 */

import { Suspense } from 'react';
import { TopPerformersClient } from './TopPerformersClient';
import { Icons } from '@/design-system/icons';

export const metadata = {
  title: 'Top Performers | HB Track',
  description: 'Top 5 atletas com melhor taxa de resposta de wellness',
};

export default function TopPerformersPage() {
  return (
    <Suspense fallback={<TopPerformersSkeleton />}>
      <TopPerformersClient />
    </Suspense>
  );
}

function TopPerformersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="mt-2 h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="mt-2 h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
