'use client';

/**
 * TeamsPageClient - Client Component da página de listagem de equipes
 * 
 * Arquivo: page-original.tsx (nome legacy, mantido para compatibilidade)
 * 
 * Responsabilidades:
 * - Renderizar o dashboard de equipes
 * - Navegar para /teams/{id}/overview ao selecionar equipe
 * - Usar router.push() para navegação SPA (não window.location)
 * 
 * Nota: searchParams/query strings NÃO são usados neste componente.
 * A navegação é feita apenas via rotas canônicas.
 * 
 * @see TEAMS_ROTAS_CANONICAS.md
 */

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/teams-v2/DashboardV2';

function TeamsContent() {
  const router = useRouter();
  
  const handleSelectTeam = (team: any, tab?: 'MEMBERS', isNew = false) => {
    // Navegar para a nova estrutura de rotas (SEM query string)
    const targetTab = tab === 'MEMBERS' ? 'members' : 'overview';
    const queryParams = isNew ? '?isNew=true' : '';
    router.push(`/teams/${team.id}/${targetTab}${queryParams}`);
  };

  return (
    <div className="px-6 py-8">
      <Dashboard onSelectTeam={handleSelectTeam} />
    </div>
  );
}


// Componente principal com Suspense (OBRIGATÓRIO para useSearchParams)
export default function TeamsV2PageClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    }>
      <TeamsContent />
    </Suspense>
  );
}
