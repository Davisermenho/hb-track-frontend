'use client';

/**
 * ProfessionalSidebar - Sidebar principal do HB Track
 * 
 * Estrutura organizada em seções:
 * - INÍCIO: Página Inicial, Dashboard
 * - ORGANIZAÇÃO: Equipes, Calendário Geral
 * - PLANEJAMENTO TÉCNICO: Treinos, Jogos (submenu), Competições
 * - DESEMPENHO: Atletas (submenu), Estatísticas (submenu com RBAC)
 * - ADMINISTRAÇÃO: Usuários, Comissão Técnica, Histórico, Configurações (RBAC)
 * 
 * @version 4.2.2 - Ícone Volleyball + Item Competições adicionado
 */

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/design-system/icons';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UsersRound,
  Trophy,
  CalendarDays,
  ChevronLeft,
  TrendingUp,
  ClipboardList,
  ListChecks,
  Target,
  Loader2,
  Settings,
  Moon,
  Sun,
  Home,
  UserCheck,
  ClipboardCheck,
  FileText,
  UserCircle,
  GitCompare,
  History,
  Shield,
  Sparkles,
  // Ícones esportivos v4.2.2
  Volleyball,      // Para jogos (bola de handebol)
  Activity,        // Para estatísticas e desempenho
  Clipboard,       // Para treinos (prancheta técnica)
  UserCog,         // Para comissão técnica
  FileBarChart,    // Para relatórios
  AlertCircle,     // Para indicadores de pendência
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTeamSeasonOptional } from '@/context/TeamSeasonContext';
import { useTeams } from '@/hooks/useTeams';
import CreateTeamModal from '@/components/teams-v2/CreateTeamModal';
import { useQueryClient } from '@tanstack/react-query';
import {
  SidebarSection,
  SidebarCollapsibleSection,
  SidebarDivider,
  SidebarItem,
  SidebarSubmenu,
  SidebarTeamContext,
  SidebarJourneyShortcuts,
} from '@/components/Sidebar';
import { useRouteVisibility } from '@/hooks/useRouteVisibility';
import { useJourneyShortcuts } from '@/hooks/useJourneyShortcuts';

interface ProfessionalSidebarProps {}

// =============================================================================
// CONFIGURAÇÃO DE MENUS - v4.2 Ícones corrigidos
// =============================================================================

// Submenu Treinos - ícones esportivos (v4.3 - Corrigido para usar SidebarSubmenu padrão)
const treinosSubmenu = [
  { name: 'Agenda Semanal', href: '/training/agenda', icon: CalendarDays, tooltip: 'Visão semanal dos treinos' },
  { name: 'Planejamento', href: '/training/planejamento', icon: ClipboardList, tooltip: 'Ciclos e microciclos' },
  { name: 'Banco de Exercícios', href: '/training/exercise-bank', icon: ListChecks, tooltip: 'Biblioteca de exercícios' },
  { name: 'Analytics', href: '/training/analytics', icon: Activity, tooltip: 'Análise de desempenho e métricas' },
  { name: 'Rankings', href: '/training/rankings', icon: Trophy, tooltip: 'Rankings de equipes por wellness' },
  { name: 'Eficácia Preventiva', href: '/training/eficacia-preventiva', icon: Icons.Medical, tooltip: 'Correlação alertas-sugestões-lesões' },
  { name: 'Configurações', href: '/training/configuracoes', icon: Settings, tooltip: 'Templates e configurações do módulo' },
];

// Submenu Jogos - ícones esportivos (Volleyball = bola de handebol)
const jogosSubmenu = [
  { name: 'Dashboard', href: '/games', icon: Activity, tooltip: 'Visão geral dos jogos' },
  { name: 'Agenda de Jogos', href: '/games/agenda', icon: CalendarDays, tooltip: 'Calendário de partidas' },
  { name: 'Escalações', href: '/games/escalacoes', icon: ClipboardCheck, tooltip: 'Definir escalações' },
  { name: 'Eventos', href: '/games/eventos', icon: Target, tooltip: 'Gols, cartões, substituições' },
  { name: 'Relatório Técnico', href: '/games/relatorio', icon: FileBarChart, tooltip: 'Análise pós-jogo' },
];

// Submenu Atletas - ícones esportivos
const atletasSubmenu = [
  { name: 'Lista de Atletas', href: '/admin/athletes', icon: Users, tooltip: 'Todos os atletas' },
  { name: 'Perfil', href: '/admin/athletes/perfil', icon: UserCircle, tooltip: 'Dados do atleta' },
  { name: 'Estatísticas', href: '/admin/athletes/estatisticas', icon: Activity, tooltip: 'Números individuais' },
  { name: 'Evolução', href: '/admin/athletes/evolucao', icon: TrendingUp, tooltip: 'Histórico de desempenho' },
];

// Submenu Estatísticas com RBAC - ícones esportivos
const getStatisticsSubmenu = (userRole: string | undefined) => {
  if (!userRole) return [];
  
  // Atleta: apenas visão própria
  if (userRole === 'atleta') {
    return [
      { name: 'Minhas Estatísticas', href: '/statistics/me', icon: TrendingUp, tooltip: 'Seu acompanhamento pessoal' },
    ];
  }
  
  // Comissão técnica e admin: visão completa
  if (['treinador', 'coordenador', 'admin', 'dirigente'].includes(userRole)) {
    return [
      { name: 'Por Equipes', href: '/statistics/teams', icon: UsersRound, tooltip: 'Análise coletiva' },
      { name: 'Por Atletas', href: '/statistics/athletes', icon: Users, tooltip: 'Análise individual' },
      { name: 'Comparativos', href: '/statistics/comparativos', icon: GitCompare, tooltip: 'Comparar desempenhos' },
    ];
  }
  
  return [];
};

// Verificar se o usuário pode acessar área de administração
const canAccessAdmin = (role: string | undefined) => {
  return role && ['admin', 'coordenador'].includes(role);
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

// Chaves para localStorage
const SIDEBAR_COLLAPSED_KEY = 'hbtrack-sidebar-collapsed';
const ADMIN_SECTION_EXPANDED_KEY = 'hbtrack-admin-section-expanded';

export function ProfessionalSidebar({}: ProfessionalSidebarProps) {
  // Inicializar estado colapsado do localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === 'true';
    }
    return false;
  });
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isCheckingTeams, setIsCheckingTeams] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Verificar permissão para criar equipe (RF6: Dirigentes, Coordenadores e Treinadores)
  // Nota: superadmin tem role_code='dirigente' + is_superadmin=true
  const canCreateTeam = user?.role === 'dirigente' || user?.role === 'coordenador' || user?.role === 'treinador';
  
  // Hook para verificar se o usuário tem equipes
  const { data: teams, isLoading: teamsLoading, refetch: refetchTeams } = useTeams();
  const hasTeams = teams && teams.length > 0;
  
  // Equipe ativa (selecionada ou primeira da lista)
  const activeTeam = hasTeams 
    ? teams.find(t => t.id === selectedTeamId) || teams[0] 
    : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // HOOKS DE MELHORIAS ESTRUTURAIS v4.1
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Contexto de temporada (opcional, pode não estar disponível)
  const teamSeasonContext = useTeamSeasonOptional();
  
  // Hook de visibilidade de rotas baseada em dados
  // O hook usa internamente o contexto de equipe/temporada
  const routeVisibility = useRouteVisibility();
  
  // Hook de atalhos de jornada
  const journeyData = useJourneyShortcuts();

  // Persistir preferência de sidebar colapsada
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      }
      return newValue;
    });
  }, []);

  // Handler para clique no item Equipes
  const handleTeamsClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (teamsLoading) {
      setIsCheckingTeams(true);
      const result = await refetchTeams();
      setIsCheckingTeams(false);
      
      if (result.data && result.data.length > 0) {
        router.push('/teams');
      } else {
        setIsCreateTeamModalOpen(true);
      }
      return;
    }
    
    if (hasTeams) {
      router.push('/teams');
    } else {
      setIsCreateTeamModalOpen(true);
    }
  }, [teamsLoading, hasTeams, router, refetchTeams]);

  // Handler para sucesso ao criar equipe
  const handleCreateTeamSuccess = useCallback((newTeam: any) => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    setIsCreateTeamModalOpen(false);
    setSelectedTeamId(newTeam.id);
    // Navegar para overview com flag de nova equipe
    router.push(`/teams/${newTeam.id}/overview?isNew=true`);
  }, [queryClient, router]);

  // Handler para trocar equipe (abre modal ou página de equipes)
  const handleChangeTeam = useCallback(() => {
    if (hasTeams && teams.length > 1) {
      // Se tem múltiplas equipes, o dropdown já permite selecionar
      return;
    } else if (!hasTeams) {
      setIsCreateTeamModalOpen(true);
    } else {
      router.push('/teams');
    }
  }, [hasTeams, teams, router]);

  // Handler para selecionar equipe no dropdown
  const handleSelectTeam = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
    // Salvar preferência no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('hbtrack-selected-team', teamId);
    }
  }, []);

  // Menus baseados em RBAC
  const statisticsSubmenu = !isLoading ? getStatisticsSubmenu(user?.role) : [];
  const showAdminSection = !isLoading && canAccessAdmin(user?.role);

  // Selecionar logo baseado no estado e tema
  const getLogo = () => {
    if (isCollapsed) {
      return theme === 'dark' 
        ? '/images/logo/logo-icon-dark.svg'
        : '/images/logo/logo-icon.svg';
    }
    return theme === 'dark'
      ? '/images/logo/logo-dark.svg'
      : '/images/logo/logo.svg';
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ duration: 0.2 }}
      className="h-screen bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
    >
      {/* Header com Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-gray-200 dark:border-gray-800",
        isCollapsed ? "justify-center px-3.5" : "justify-between px-5"
      )}>
        {isCollapsed ? (
          <button
            onClick={handleToggleCollapse}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Image
              src={getLogo()}
              alt="HB Track"
              width={35}
              height={35}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </button>
        ) : (
          <>
            <Link href="/dashboard">
              <Image
                src={getLogo()}
                alt="HB Track"
                width={89}
                height={24}
                className="object-contain cursor-pointer"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </Link>
            <button
              onClick={handleToggleCollapse}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}
      </div>

      {/* Contexto da Equipe Ativa com Seletor */}
      <SidebarTeamContext
        teamName={activeTeam?.name ?? teamSeasonContext?.selectedTeam?.name ?? null}
        teamId={activeTeam?.id ?? teamSeasonContext?.selectedTeam?.id ?? null}
        seasonYear={teamSeasonContext?.selectedSeason?.year ?? new Date().getFullYear()}
        isCollapsed={isCollapsed}
        onChangeTeam={handleChangeTeam}
        teams={teams?.map(t => ({ id: t.id, name: t.name })) ?? []}
        onSelectTeam={handleSelectTeam}
        onCreateTeam={canCreateTeam ? () => setIsCreateTeamModalOpen(true) : undefined}
      />

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-0.5">
          
          {/* ═══════════════════════════════════════════════════════════════
             SEÇÃO: ATALHOS INTELIGENTES (Jornadas) - v4.1
          ═══════════════════════════════════════════════════════════════ */}
          {!isCollapsed && (
            <SidebarJourneyShortcuts isCollapsed={isCollapsed} />
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
             SEÇÃO: INÍCIO
          ═══════════════════════════════════════════════════════════════ */}
          <SidebarSection title="Início" isCollapsed={isCollapsed} />
          
          <SidebarItem
            name="Página Inicial"
            href="/inicio"
            icon={Home}
            isActive={pathname === '/inicio'}
            isCollapsed={isCollapsed}
          />
          
          <SidebarItem
            name="Dashboard"
            href="/dashboard"
            icon={LayoutDashboard}
            isActive={pathname === '/dashboard'}
            isCollapsed={isCollapsed}
          />

          {/* ═══════════════════════════════════════════════════════════════
             SEÇÃO: ORGANIZAÇÃO
          ═══════════════════════════════════════════════════════════════ */}
          <SidebarSection title="Organização" isCollapsed={isCollapsed} />
          
          <SidebarItem
            name="Equipes"
            href="/teams"
            icon={UsersRound}
            isActive={pathname === '/teams' || pathname.startsWith('/teams/')}
            isCollapsed={isCollapsed}
            onClick={handleTeamsClick}
            disabled={isCheckingTeams}
            isLoading={isCheckingTeams}
            badge={teams?.length}
          />
          
          <SidebarItem
            name="Calendário Geral"
            href="/calendar"
            icon={CalendarDays}
            isActive={pathname === '/calendar'}
            isCollapsed={isCollapsed}
          />

          {/* ═══════════════════════════════════════════════════════════════
             SEÇÃO: PLANEJAMENTO TÉCNICO
          ═══════════════════════════════════════════════════════════════ */}
          <SidebarSection title="Planejamento Técnico" isCollapsed={isCollapsed} />

          {/* Treinos - Submenu colapsável (v4.3 - Padrão igual a Jogos/Atletas) */}
          <SidebarSubmenu
            name="Treinos"
            icon={Clipboard}
            items={treinosSubmenu}
            isCollapsed={isCollapsed}
            badge={routeVisibility.training.count > 0 ? undefined : '!'}
            tooltip={routeVisibility.training.count > 0 ? undefined : 'Sem treinos cadastrados'}
          />
          
          <SidebarSubmenu
            name="Jogos"
            icon={Volleyball}
            items={jogosSubmenu}
            isCollapsed={isCollapsed}
            badge={routeVisibility.games.visible ? undefined : '!'}
            tooltip={routeVisibility.games.visible ? undefined : routeVisibility.games.fallbackMessage}
          />
          
          <SidebarItem
            name="Competições"
            href="/competitions"
            icon={Trophy}
            isActive={pathname === '/competitions' || pathname.startsWith('/competitions/')}
            isCollapsed={isCollapsed}
          />

          {/* ═══════════════════════════════════════════════════════════════
             SEÇÃO: DESEMPENHO
          ═══════════════════════════════════════════════════════════════ */}
          <SidebarSection title="Desempenho" isCollapsed={isCollapsed} />
          
          <SidebarSubmenu
            name="Atletas"
            icon={Users}
            items={atletasSubmenu}
            isCollapsed={isCollapsed}
            badge={routeVisibility.athletes.count > 0 ? undefined : '!'}
            tooltip={routeVisibility.athletes.count > 0 ? undefined : 'Sem atletas cadastrados'}
          />
          
          {statisticsSubmenu.length > 0 && (
            <SidebarSubmenu
              name="Estatísticas"
              icon={Activity}
              items={statisticsSubmenu}
              isCollapsed={isCollapsed}
              badge={routeVisibility.statistics.visible ? undefined : '!'}
              tooltip={routeVisibility.statistics.visible ? undefined : routeVisibility.statistics.fallbackMessage}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════
             SEÇÃO: ADMINISTRAÇÃO (RBAC) - v4.2 Colapsável com divisor
          ═══════════════════════════════════════════════════════════════ */}
          {showAdminSection && (
            <>
              {/* Divisor visual antes da seção admin */}
              <SidebarDivider spacing="lg" />
              
              <SidebarCollapsibleSection
                title="Administração"
                icon={Settings}
                isCollapsed={isCollapsed}
                defaultExpanded={true}
                storageKey={ADMIN_SECTION_EXPANDED_KEY}
              >
                <SidebarItem
                  name="Cadastro e Permissões"
                  href="/admin/cadastro"
                  icon={UserPlus}
                  isActive={pathname === '/admin/cadastro' || pathname.startsWith('/admin/cadastro/')}
                  isCollapsed={isCollapsed}
                />
                
                <SidebarItem
                  name="Comissão Técnica"
                  href="/admin/staff"
                  icon={UserCog}
                  isActive={pathname === '/admin/staff' || pathname.startsWith('/admin/staff/')}
                  isCollapsed={isCollapsed}
                />
                
                <SidebarItem
                  name="Histórico / Auditoria"
                  href="/history"
                  icon={History}
                  isActive={pathname === '/history' || pathname.startsWith('/history/')}
                  isCollapsed={isCollapsed}
                />
                
                <SidebarItem
                  name="Configurações"
                  href="/settings"
                  icon={Settings}
                  isActive={pathname === '/settings' || pathname.startsWith('/settings/')}
                  isCollapsed={isCollapsed}
                />
              </SidebarCollapsibleSection>
            </>
          )}
        </div>
      </nav>

      {/* Footer com tema toggle */}
      <div className={cn(
        "border-t border-gray-200 dark:border-gray-700 p-2",
        isCollapsed ? "flex justify-center" : ""
      )}>
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
            "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
            isCollapsed && "justify-center w-full"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          {!isCollapsed && (
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          )}
        </button>
      </div>

      {/* Modal para criar equipe */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onSuccess={handleCreateTeamSuccess}
        onError={(message) => {
          console.error('Erro ao criar equipe:', message);
        }}
      />
    </motion.aside>
  );
}
