/**
 * Dashboard - HB Track
 * Visão geral do desempenho da equipe
 */

import type { Metadata } from "next";
import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import DashboardContent from '@/components/Dashboard/DashboardContent';

export const metadata: Metadata = {
  title: "Dashboard - HB Track",
  description: "Visão geral do desempenho da equipe",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  const teamId = (session as any)?.team_id;
  const seasonId = (session as any)?.season_id;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Visão geral do desempenho da equipe
        </p>
      </div>
      <DashboardContent teamId={teamId} seasonId={seasonId} />
    </div>
  );
}
