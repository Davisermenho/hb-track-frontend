/**
 * Página de Visão Geral da Equipe (Server Component)
 *
 * Rota: /teams/[teamId]/overview
 *
 * Exibe:
 * - Boas-vindas e ações rápidas
 * - Informações gerais da equipe
 * - Atividade recente
 * - Próximo treino
 *
 * Arquitetura:
 * - Server Component valida UUID e existência da equipe
 * - Chama notFound() se inválido
 * - OverviewTab é Client Component que faz fetches client-side
 *
 * SearchParams aceitos:
 * - isNew: 'true' quando equipe foi recém-criada (mostra wizard de boas-vindas)
 */

import { notFound } from 'next/navigation';
import OverviewTab from '@/components/teams-v2/OverviewTab';
import { serverApiClient } from '@/lib/api/server';

interface OverviewPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ isNew?: string }>;
}

// Valida se a string é um UUID válido
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default async function OverviewPage({ params, searchParams }: OverviewPageProps) {
  const { teamId } = await params;
  const { isNew } = await searchParams;

  // Validação 1: Verificar se é um UUID válido
  if (!isValidUUID(teamId)) {
    console.log(`[OverviewPage] UUID inválido: ${teamId}`);
    notFound();
  }

  // Validação 2: Verificar se a equipe existe (apenas HEAD request)
  try {
    const response = await serverApiClient.get(`/teams/${teamId}`);
    // Se chegou aqui, a equipe existe
  } catch (error: any) {
    // Se retornou 404, 401 ou qualquer erro, mostrar página 404
    console.log(`[OverviewPage] Erro ao buscar equipe ${teamId}:`, error?.message || error);
    notFound();
  }

  return (
    <OverviewTab
      teamId={teamId}
      isNewTeam={isNew === 'true'}
    />
  );
}
