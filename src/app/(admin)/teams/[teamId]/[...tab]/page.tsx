/**
 * Catch-all para tabs inválidas
 * 
 * Rota: /teams/[teamId]/[...qualquer-coisa]
 * 
 * Comportamento:
 * - Se a tab não é válida (overview, members, trainings, stats, settings),
 *   redireciona para /teams/[teamId]/overview
 * 
 * Este catch-all existe porque o middleware não consegue interceptar rotas
 * que o App Router resolve como 404 em Next.js 14+.
 * 
 * @see middleware.ts - VALID_TEAM_TABS
 */

import { redirect } from 'next/navigation';

const VALID_TEAM_TABS = ['overview', 'members', 'trainings', 'stats', 'settings'];

interface Params {
  teamId: string;
  tab: string[];
}

export default async function InvalidTabCatchAll({ params }: { params: Promise<Params> }) {
  const { teamId, tab } = await params;
  const firstSegment = tab?.[0];
  
  // Se a tab não é válida, redirecionar para overview
  if (!firstSegment || !VALID_TEAM_TABS.includes(firstSegment)) {
    redirect(`/teams/${teamId}/overview`);
  }
  
  // Se chegou aqui com tab válida, algo está errado - mas não deveria acontecer
  // porque as rotas específicas (overview, members, etc) têm precedência
  return null;
}
