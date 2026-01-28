/**
 * Client Wrapper para SettingsTab
 *
 * Esse componente existe para permitir que page.tsx (Server Component)
 * passe o teamId, e o SettingsTab faz o fetch client-side.
 * O handler onTeamUpdated é definido aqui no client.
 */
'use client';

import { useRouter } from 'next/navigation';
import SettingsTab from '@/components/teams-v2/SettingsTab';
import type { Team } from '@/types/teams-v2';

interface TeamSettingsClientProps {
  teamId: string;
}

export default function TeamSettingsClient({ teamId }: TeamSettingsClientProps) {
  const router = useRouter();

  /**
   * Handler chamado quando a equipe é atualizada.
   * Usa router.refresh() para revalidar a página.
   */
  function handleTeamUpdated(updatedTeam: Team) {
    console.log('Equipe atualizada:', updatedTeam.name);
    router.refresh();
  }

  return (
    <SettingsTab
      teamId={teamId}
      onTeamUpdated={handleTeamUpdated}
    />
  );
}
