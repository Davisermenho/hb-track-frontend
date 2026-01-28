/**
 * Página de Configurações da Equipe (Server Component)
 *
 * Exibe:
 * - Configurações gerais da equipe
 * - Gerenciamento de permissões
 * - Opções de exclusão/arquivamento
 *
 * Arquitetura:
 * - page.tsx (Server Component) → valida UUID e existência
 * - TeamSettingsClient (Client Component) → faz fetch client-side e define handlers/interações
 *
 * Nota: Apenas usuários com permissão de gerenciamento podem acessar
 */

import { notFound } from 'next/navigation';
import TeamSettingsClient from './TeamSettingsClient';
import { serverApiClient } from '@/lib/api/server';

interface SettingsPageProps {
  params: Promise<{ teamId: string }>;
}

// Valida se a string é um UUID válido
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { teamId } = await params;

  // Validação 1: UUID válido
  if (!isValidUUID(teamId)) {
    console.log(`[SettingsPage] UUID inválido: ${teamId}`);
    notFound();
  }

  // Validação 2: Equipe existe
  try {
    await serverApiClient.get(`/teams/${teamId}`);
  } catch (error: any) {
    console.log(`[SettingsPage] Erro ao buscar equipe ${teamId}:`, error?.message || error);
    notFound();
  }

  return <TeamSettingsClient teamId={teamId} />;
}
