'use client';

/**
 * useContextualShortcuts - Hook para atalhos contextuais na busca
 * 
 * Gera ações rápidas baseadas em:
 * - Rota atual
 * - Equipe ativa
 * - Permissões do usuário
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  Plus,
  FileText,
  Users,
  Dumbbell,
  Gamepad2,
  ClipboardCheck,
  Calendar,
  UserPlus,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// =============================================================================
// TIPOS
// =============================================================================

export interface ContextualShortcut {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  action: string; // path ou comando
  type: 'navigation' | 'action';
  keywords: string[];
}

interface UseContextualShortcutsReturn {
  shortcuts: ContextualShortcut[];
  quickActions: ContextualShortcut[];
  navigationShortcuts: ContextualShortcut[];
}

// =============================================================================
// CONFIGURAÇÃO DE ATALHOS
// =============================================================================

// Atalhos globais (sempre disponíveis)
const GLOBAL_SHORTCUTS: ContextualShortcut[] = [
  {
    id: 'new-training',
    title: 'Novo Treino',
    description: 'Criar sessão de treino',
    icon: Plus,
    action: '/training/novo',
    type: 'action',
    keywords: ['novo', 'treino', 'criar', 'sessão'],
  },
  {
    id: 'new-game',
    title: 'Novo Jogo',
    description: 'Registrar partida',
    icon: Gamepad2,
    action: '/games/novo',
    type: 'action',
    keywords: ['novo', 'jogo', 'partida', 'criar'],
  },
  {
    id: 'new-athlete',
    title: 'Novo Atleta',
    description: 'Cadastrar atleta',
    icon: UserPlus,
    action: '/admin/athletes/new',
    type: 'action',
    keywords: ['novo', 'atleta', 'cadastrar', 'jogador'],
  },
];

// Atalhos por rota
const ROUTE_SHORTCUTS: Record<string, ContextualShortcut[]> = {
  '/training': [
    {
      id: 'training-attendance',
      title: 'Registrar Presenças',
      description: 'Marcar presença dos atletas',
      icon: ClipboardCheck,
      action: '/training/presencas',
      type: 'navigation',
      keywords: ['presença', 'frequência', 'chamada'],
    },
    {
      id: 'training-plan',
      title: 'Ver Planejamento',
      description: 'Ciclos e microciclos',
      icon: Calendar,
      action: '/training/planejamento',
      type: 'navigation',
      keywords: ['planejamento', 'ciclo', 'microciclo'],
    },
  ],
  '/games': [
    {
      id: 'game-lineup',
      title: 'Definir Escalação',
      description: 'Montar time titular',
      icon: Users,
      action: '/games/escalacoes',
      type: 'navigation',
      keywords: ['escalação', 'time', 'titular', 'formação'],
    },
    {
      id: 'game-report',
      title: 'Relatório Técnico',
      description: 'Análise pós-jogo',
      icon: FileText,
      action: '/games/relatorio',
      type: 'navigation',
      keywords: ['relatório', 'análise', 'pós-jogo'],
    },
  ],
  '/admin/athletes': [
    {
      id: 'athlete-evaluation',
      title: 'Nova Avaliação',
      description: 'Avaliar atleta',
      icon: Target,
      action: '/training/avaliacoes',
      type: 'navigation',
      keywords: ['avaliação', 'avaliar', 'teste'],
    },
    {
      id: 'athlete-stats',
      title: 'Ver Estatísticas',
      description: 'Números do atleta',
      icon: Target,
      action: '/admin/athletes/estatisticas',
      type: 'navigation',
      keywords: ['estatísticas', 'números', 'dados'],
    },
  ],
  '/competitions': [
    {
      id: 'competition-table',
      title: 'Ver Tabela',
      description: 'Classificação atual',
      icon: Trophy,
      action: '/eventos/competicoes/tabela',
      type: 'navigation',
      keywords: ['tabela', 'classificação', 'ranking'],
    },
  ],
};

// Atalhos por papel de usuário
const ROLE_SHORTCUTS: Record<string, ContextualShortcut[]> = {
  admin: [
    {
      id: 'admin-users',
      title: 'Gerenciar Usuários',
      description: 'Administrar acessos',
      icon: Users,
      action: '/admin/cadastro',
      type: 'navigation',
      keywords: ['usuários', 'admin', 'acessos'],
    },
  ],
  coordenador: [
    {
      id: 'coord-staff',
      title: 'Comissão Técnica',
      description: 'Gerenciar equipe técnica',
      icon: Users,
      action: '/admin/staff',
      type: 'navigation',
      keywords: ['comissão', 'técnica', 'staff'],
    },
  ],
};

// =============================================================================
// HOOK
// =============================================================================

export function useContextualShortcuts(): UseContextualShortcutsReturn {
  const pathname = usePathname();
  const { user } = useAuth();

  const shortcuts = useMemo(() => {
    const all: ContextualShortcut[] = [...GLOBAL_SHORTCUTS];

    // Adicionar atalhos baseados na rota atual
    if (pathname) {
      // Buscar match exato ou parcial
      for (const [route, routeShortcuts] of Object.entries(ROUTE_SHORTCUTS)) {
        if (pathname.startsWith(route)) {
          all.push(...routeShortcuts);
        }
      }
    }

    // Adicionar atalhos baseados no papel do usuário
    if (user?.role) {
      const roleShortcuts = ROLE_SHORTCUTS[user.role];
      if (roleShortcuts) {
        all.push(...roleShortcuts);
      }
    }

    // Remover duplicatas
    const unique = all.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    return unique;
  }, [pathname, user]);

  // Separar ações rápidas de navegação
  const quickActions = useMemo(() => 
    shortcuts.filter(s => s.type === 'action'),
    [shortcuts]
  );

  const navigationShortcuts = useMemo(() => 
    shortcuts.filter(s => s.type === 'navigation'),
    [shortcuts]
  );

  return {
    shortcuts,
    quickActions,
    navigationShortcuts,
  };
}

export default useContextualShortcuts;
