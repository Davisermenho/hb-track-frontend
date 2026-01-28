/**
 * Layout da Rota /games
 * 
 * Gerenciamento de jogos e partidas:
 * - Dashboard de jogos
 * - Detalhes do jogo (escalação, eventos, estatísticas, relatório)
 * 
 * URL params:
 * - gameId: ID do jogo selecionado
 * - tab: Tab ativa (overview, lineup, events, stats, report)
 * - isNew: Se true, abre modal de criação
 */

import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { GamesLayoutWrapper } from './GamesLayoutWrapper';

export default async function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  return <GamesLayoutWrapper>{children}</GamesLayoutWrapper>;
}
