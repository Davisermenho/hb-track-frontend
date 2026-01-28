/**
 * Athlete Wellness Pre Page
 * 
 * Página protegida onde atletas preenchem wellness pré-treino
 * Rota: /athlete/wellness-pre/[sessionId]
 * Permissão: Apenas atletas (self-only)
 */

import { Metadata } from 'next';
import WellnessPreClient from './WellnessPreClient';

export const metadata: Metadata = {
  title: 'Wellness Pré-Treino | HB Track',
  description: 'Preencha seu wellness antes do treino',
};

export default function WellnessPrePage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <WellnessPreClient sessionId={params.sessionId} />;
}
