/**
 * Página de Treinos da Equipe (Server Component)
 * 
 * Rota: /teams/[teamId]/trainings
 * 
 * Exibe:
 * - Lista de treinos agendados
 * - Histórico de treinos
 * - Estatísticas de presença
 * 
 * Arquitetura:
 * - Server Component passa teamId para TrainingsTab
 * - TrainingsTab é Client Component que faz fetches client-side
 */

import TrainingsTab from '@/components/teams-v2/TrainingsTab';

interface TrainingsPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TrainingsPage({ params }: TrainingsPageProps) {
  const { teamId } = await params;

  return <TrainingsTab teamId={teamId} />;
}
