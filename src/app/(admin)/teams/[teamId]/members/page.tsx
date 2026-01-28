/**
 * Página de Membros da Equipe (Server Component)
 *
 * Rota: /teams/[teamId]/members
 *
 * Exibe:
 * - Lista de staff/comissão técnica
 * - Lista de atletas
 * - Funcionalidades de convite, edição e remoção
 *
 * Arquitetura:
 * - Server Component valida UUID e existência da equipe
 * - MembersTab é Client Component que faz fetches client-side
 */

import { notFound } from 'next/navigation';
import MembersTab from '@/components/teams-v2/MembersTab';
import { serverApiClient } from '@/lib/api/server';

interface MembersPageProps {
  params: Promise<{ teamId: string }>;
}

// Valida se a string é um UUID válido
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { teamId } = await params;

  // Validação 1: UUID válido
  if (!isValidUUID(teamId)) {
    console.log(`[MembersPage] UUID inválido: ${teamId}`);
    notFound();
  }

  // Validação 2: Equipe existe
  try {
    await serverApiClient.get(`/teams/${teamId}`);
  } catch (error: any) {
    console.log(`[MembersPage] Erro ao buscar equipe ${teamId}:`, error?.message || error);
    notFound();
  }

  return <MembersTab teamId={teamId} />;
}
