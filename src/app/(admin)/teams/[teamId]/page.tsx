/**
 * Página raiz de detalhamento de equipe (Server Component)
 * 
 * Redireciona automaticamente para a aba "Visão Geral" (/teams/[teamId]/overview)
 * 
 * Arquitetura de Rotas Canônicas:
 * - /teams/[teamId]          → Redirect para overview
 * - /teams/[teamId]/overview → Visão geral da equipe
 * - /teams/[teamId]/members  → Lista de membros
 * - /teams/[teamId]/trainings→ Treinos da equipe
 * - /teams/[teamId]/stats    → Estatísticas
 * - /teams/[teamId]/settings → Configurações (com Client Wrapper)
 * 
 * @see system/TEAMS_ROTAS_CANONICAS.md
 */

import { redirect } from 'next/navigation';

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;
  
  // Redirecionar para a aba de visão geral
  redirect(`/teams/${teamId}/overview`);
}
