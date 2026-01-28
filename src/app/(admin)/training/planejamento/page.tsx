/**
 * Página Planejamento - /training/planejamento
 * 
 * Visão hierárquica: Trimestre → Mesociclos → Microciclos
 * - Timeline ou cards colapsáveis
 * - Destaques de foco técnico
 * - Alertas de desvio
 */

import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import PlanejamentoClient from './PlanejamentoClient';

export const metadata: Metadata = {
  title: 'Planejamento de Treinos - HB Track',
  description: 'Gerencie ciclos de treinamento e microciclos',
};

export default async function PlanejamentoPage() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  return <PlanejamentoClient />;
}
