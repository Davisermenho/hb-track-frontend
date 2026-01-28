/**
 * Página de Gerenciamento de Equipes
 *
 * Permite ao treinador:
 * - Cadastrar uma nova equipe
 * - Visualizar lista de equipes cadastradas
 * - Editar equipes existentes
 */

import type { Metadata } from "next";
import { getSession } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import TeamsManagementAPI from '@/components/Teams/TeamsManagementAPI'

export const metadata: Metadata = {
  title: "Gerenciar Equipes - HB Track",
  description: "Cadastre e gerencie suas equipes",
};

export default async function TeamsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/signin')
  }

  return <TeamsManagementAPI />
}
