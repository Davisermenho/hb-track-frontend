/**
 * Página Calendário Mensal - /training/calendario
 * 
 * DEPRECATED: Funcionalidade consolidada em /training/agenda?view=month
 * Esta página agora redireciona automaticamente
 */

import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Calendário de Treinos - HB Track',
  description: 'Visualização mensal de treinos e eventos',
};

export default async function CalendarioPage() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  // Redireciona para a agenda com visualização mensal
  redirect('/training/agenda?view=month');
}
