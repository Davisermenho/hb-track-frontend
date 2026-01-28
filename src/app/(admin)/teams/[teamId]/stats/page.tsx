/**
 * Página de Estatísticas da Equipe (Server Component)
 * 
 * Rota: /teams/[teamId]/stats
 * 
 * Exibe:
 * - Gráficos de performance
 * - Métricas de treinos
 * - Estatísticas de atletas
 * 
 * Arquitetura:
 * - Server Component faz fetch com serverApiClient (cookies SSR)
 * - StatsTab é Client Component para interatividade
 */

import { notFound } from 'next/navigation';
import StatsTab from '@/components/teams-v2/StatsTab';
import { serverApiClient } from '@/lib/api/server';
import { mapApiTeamToV2 } from '@/lib/adapters/teams-v2-adapter';
import type { Team } from '@/lib/api/teams';

interface StatsPageProps {
  params: Promise<{ teamId: string }>;
}

async function getTeam(teamId: string) {
  try {
    // Usa serverApiClient para passar o cookie de autenticação no SSR
    const apiTeam = await serverApiClient.get<Team>(`/teams/${teamId}`);
    return mapApiTeamToV2(apiTeam as any);
  } catch (error) {
    console.error('Erro ao carregar equipe:', error);
    return null;
  }
}

export default async function StatsPage({ params }: StatsPageProps) {
  const { teamId } = await params;
  const team = await getTeam(teamId);

  if (!team) {
    notFound();
  }

  return (
    <StatsTab 
      teamId={teamId}
      teamName={team.name}
    />
  );
}
