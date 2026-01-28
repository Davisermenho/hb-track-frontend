/**
 * Layout da Rota /training
 * 
 * Centro estratégico para o treinador:
 * - Planejamento tático e físico
 * - Execução de sessões
 * - Avaliação qualitativa e quantitativa
 * 
 * Subrotas:
 * - /training (redireciona para /training/agenda)
 * - /training/agenda - Agenda Semanal
 * - /training/calendario - Calendário Mensal
 * - /training/planejamento - Planejamento Estrutural
 * - /training/banco - Banco de Exercícios
 * - /training/avaliacoes - Avaliações e Relatórios
 */

import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { TrainingLayoutWrapper } from './TrainingLayoutWrapper';
import { TourProvider } from '@/components/training/tours/TourProvider';

export default async function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  return (
    <TourProvider>
      <TrainingLayoutWrapper>{children}</TrainingLayoutWrapper>
    </TourProvider>
  );
}
