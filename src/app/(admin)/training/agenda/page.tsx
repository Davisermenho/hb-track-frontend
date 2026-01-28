/**
 * Página Agenda Semanal - /training/agenda
 * 
 * Visão semanal de treinos com:
 * - Calendário horizontal (seg-dom)
 * - Cards de sessão por dia
 * - Drag & drop entre dias
 * - Modal de detalhes
 * - Criação rápida
 */

import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import AgendaClient from './AgendaClient';

export const metadata: Metadata = {
  title: 'Agenda de Treinos - HB Track',
  description: 'Visualize e gerencie sua agenda semanal de treinos',
};

export default async function AgendaPage() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  return <AgendaClient />;
}
