/**
 * Athlete Wellness Post Page
 * 
 * Página protegida onde atletas preenchem wellness pós-treino
 * Rota: /athlete/wellness-post/[sessionId]
 * Permissão: Apenas atletas (self-only)
 */

import { Metadata } from 'next';
import WellnessPostClient from './WellnessPostClient';

export const metadata: Metadata = {
  title: 'Wellness Pós-Treino | HB Track',
  description: 'Registre como foi seu treino',
};

export default function WellnessPostPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <WellnessPostClient sessionId={params.sessionId} />;
}
