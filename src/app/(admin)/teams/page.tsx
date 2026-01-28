/**
 * Página de Gerenciamento de Equipes V2
 *
 * Nova implementação do módulo de equipes com:
 * - Design moderno e responsivo
 * - Integração com API real
 * - Validação de autenticação
 */

import type { Metadata } from "next";
import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import TeamsV2PageClient from './page-original';

export const metadata: Metadata = {
  title: "Gerenciar Equipes - HB Track",
  description: "Gerencie suas equipes com ferramentas modernas e inteligentes",
};

export default async function TeamsV2Page() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  return <TeamsV2PageClient />;
}
