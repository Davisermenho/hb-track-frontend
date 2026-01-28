'use client';

/**
 * Layout para detalhamento de equipe (Client Component)
 * 
 * Rota: /teams/[teamId]/*
 * 
 * Responsabilidades:
 * - Renderizar tabs de navegação entre subrotas
 * - Controlar visibilidade de tabs baseado em permissões
 * - Manter estado de navegação entre tabs
 * - Normalizar URLs para lowercase (fix para Windows case-insensitive)
 * 
 * Tabs:
 * - Visão Geral  → /teams/[teamId]/overview
 * - Membros      → /teams/[teamId]/members
 * - Treinos      → /teams/[teamId]/trainings
 * - Estatísticas → /teams/[teamId]/stats
 * - Configurações→ /teams/[teamId]/settings (se canManageTeam)
 * 
 * Arquitetura:
 * - Client Component para usar useParams() e hooks de permissão
 * - TeamNavigationTabs usa usePathname() para highlight ativo
 * 
 * @see system/TEAMS_ROTAS_CANONICAS.md
 */

import { useEffect } from 'react';
import { TeamNavigationTabs } from '@/components/teams/TeamNavigationTabs';
import { Settings, Users, Calendar, BarChart3, LayoutDashboard } from 'lucide-react';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';
import { useParams, usePathname, useRouter } from 'next/navigation';

// Tabs válidas (lowercase)
const VALID_TABS = ['overview', 'members', 'trainings', 'stats', 'settings'];

interface TeamLayoutProps {
  children: React.ReactNode;
}

export default function TeamLayout({ children }: TeamLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const teamId = params.teamId as string;

  // Normalização de URL: garantir que tabs sejam lowercase
  // Necessário porque Windows (NTFS) é case-insensitive e resolve /OVERVIEW para /overview
  useEffect(() => {
    // Usar window.location.pathname para pegar a URL real do navegador
    // (usePathname pode retornar normalizado)
    const browserPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    
    // Extrair a tab da URL atual
    const match = browserPath.match(/^\/teams\/[^/]+\/([^/]+)/);
    if (match) {
      const currentTab = match[1];
      const lowerTab = currentTab.toLowerCase();
      
      // Se a tab não está em lowercase e é uma tab válida, redirecionar
      if (currentTab !== lowerTab && VALID_TABS.includes(lowerTab)) {
        const newPath = browserPath.replace(`/${currentTab}`, `/${lowerTab}`);
        router.replace(newPath);
      }
    }
  }, [pathname, router]);

  // Carregar permissões do usuário na equipe
  const { canManageTeam } = useTeamPermissions(teamId);

  // Definir tabs de navegação
  const tabs = [
    {
      label: 'Visão Geral',
      href: `/teams/${teamId}/overview`,
      icon: LayoutDashboard,
    },
    {
      label: 'Membros',
      href: `/teams/${teamId}/members`,
      icon: Users,
    },
    {
      label: 'Treinos',
      href: `/teams/${teamId}/trainings`,
      icon: Calendar,
    },
    {
      label: 'Estatísticas',
      href: `/teams/${teamId}/stats`,
      icon: BarChart3,
    },
    // Configurações só aparece para quem pode gerenciar
    ...(canManageTeam ? [{
      label: 'Configurações',
      href: `/teams/${teamId}/settings`,
      icon: Settings,
    }] : []),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Tabs de Navegação */}
      <TeamNavigationTabs tabs={tabs} />

      {/* Conteúdo da página */}
      <div>
        {children}
      </div>
    </div>
  );
}
