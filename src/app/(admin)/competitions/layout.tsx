/**
 * Layout da Rota /competitions
 * 
 * Gerenciamento de competições e torneios:
 * - Dashboard de competições
 * - Detalhes da competição (fases, tabela, regulamento)
 * 
 * URL params:
 * - competitionId: ID da competição selecionada
 * - tab: Tab ativa (phases, standings, rules)
 * - isNew: Se true, abre modal de criação
 */

import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { CompetitionsLayoutWrapper } from './CompetitionsLayoutWrapper';

export default async function CompetitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  return <CompetitionsLayoutWrapper>{children}</CompetitionsLayoutWrapper>;
}
