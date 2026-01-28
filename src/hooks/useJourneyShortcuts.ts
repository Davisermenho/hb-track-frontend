'use client';

/**
 * useJourneyShortcuts - Hook para atalhos de jornada na sidebar
 * 
 * Gera atalhos dinâmicos baseados em:
 * - Rotas mais acessadas (telemetria)
 * - Contexto atual (ex: pós-jogo)
 * - Planejamento da semana
 * 
 * @version 1.0.0
 */

import { useMemo, useEffect, useState } from 'react';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  CalendarClock,
  ClipboardCheck,
  TrendingUp,
  Dumbbell,
  Gamepad2,
  Star,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export interface JourneyShortcut {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  condition?: 'always' | 'contextual' | 'frequent';
  priority: number;
}

interface UseJourneyShortcutsReturn {
  shortcuts: JourneyShortcut[];
  contextualShortcut: JourneyShortcut | null;
  frequentRoutes: JourneyShortcut[];
  addFrequentRoute: (route: string) => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const STORAGE_KEY = 'hbtrack-route-frequency';
const MAX_FREQUENT_ROUTES = 3;

// Atalhos fixos baseados em jornadas principais
const FIXED_SHORTCUTS: JourneyShortcut[] = [
  {
    id: 'weekly-planning',
    name: 'Planejamento da Semana',
    href: '/training/agenda',
    icon: CalendarClock,
    description: 'Ver e planejar treinos da semana',
    condition: 'always',
    priority: 1,
  },
  {
    id: 'next-game',
    name: 'Próximo Jogo',
    href: '/games',
    icon: Gamepad2,
    description: 'Preparação para o próximo jogo',
    condition: 'always',
    priority: 2,
  },
];

// Atalhos contextuais (aparecem em situações específicas)
const CONTEXTUAL_SHORTCUTS: Record<string, JourneyShortcut> = {
  'post-game': {
    id: 'post-game-analysis',
    name: 'Avaliação Pós-Jogo',
    href: '/games/relatorio',
    icon: ClipboardCheck,
    description: 'Registrar análise do jogo',
    condition: 'contextual',
    priority: 0,
  },
  'pre-training': {
    id: 'training-prep',
    name: 'Preparar Treino',
    href: '/training/planejamento',
    icon: Dumbbell,
    description: 'Definir atividades do treino',
    condition: 'contextual',
    priority: 0,
  },
  'review-stats': {
    id: 'review-stats',
    name: 'Revisar Estatísticas',
    href: '/statistics/teams',
    icon: TrendingUp,
    description: 'Analisar desempenho da equipe',
    condition: 'contextual',
    priority: 0,
  },
};

// Mapeamento de rotas para atalhos contextuais
const ROUTE_TO_CONTEXTUAL: Record<string, string> = {
  '/games': 'post-game',
  '/games/': 'post-game',
  '/training': 'pre-training',
  '/training/agenda': 'pre-training',
  '/dashboard': 'review-stats',
};

// =============================================================================
// HOOK
// =============================================================================

export function useJourneyShortcuts(): UseJourneyShortcutsReturn {
  const pathname = usePathname();
  const [routeFrequency, setRouteFrequency] = useState<Record<string, number>>({});

  // Carregar frequência do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setRouteFrequency(JSON.parse(stored));
        }
      } catch (e) {
        // Ignorar erro de parse
      }
    }
  }, []);

  // Determinar atalho contextual baseado na rota atual
  const contextualShortcut = useMemo(() => {
    // Verificar se a rota atual tem um atalho contextual
    for (const [route, shortcutKey] of Object.entries(ROUTE_TO_CONTEXTUAL)) {
      if (pathname.startsWith(route)) {
        const shortcut = CONTEXTUAL_SHORTCUTS[shortcutKey];
        // Não mostrar o atalho se já estamos na rota dele
        if (shortcut && !pathname.startsWith(shortcut.href)) {
          return shortcut;
        }
      }
    }
    return null;
  }, [pathname]);

  // Calcular rotas frequentes
  const frequentRoutes = useMemo(() => {
    const entries = Object.entries(routeFrequency);
    if (entries.length === 0) return [];

    // Ordenar por frequência
    const sorted = entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, MAX_FREQUENT_ROUTES);

    // Converter para atalhos
    return sorted.map(([route, count], index) => ({
      id: `frequent-${index}`,
      name: getRouteLabel(route),
      href: route,
      icon: Star,
      description: `Acessado ${count}x`,
      condition: 'frequent' as const,
      priority: 10 + index,
    }));
  }, [routeFrequency]);

  // Adicionar rota à frequência
  const addFrequentRoute = useCallback((route: string) => {
    // Ignorar rotas de autenticação
    if (route.includes('/signin') || route.includes('/signup')) return;
    
    // Normalizar rota para lowercase (evita /OVERVIEW vs /overview)
    const normalizedRoute = route.toLowerCase();
    
    setRouteFrequency(prev => {
      const updated = {
        ...prev,
        [normalizedRoute]: (prev[normalizedRoute] || 0) + 1,
      };
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []);

  // Rastrear navegação automaticamente
  useEffect(() => {
    if (pathname) {
      addFrequentRoute(pathname);
    }
  }, [pathname, addFrequentRoute]);

  // Combinar todos os atalhos
  const shortcuts = useMemo(() => {
    const all: JourneyShortcut[] = [...FIXED_SHORTCUTS];
    
    // Adicionar contextual se existir
    if (contextualShortcut) {
      all.unshift(contextualShortcut);
    }
    
    // Ordenar por prioridade
    return all.sort((a, b) => a.priority - b.priority);
  }, [contextualShortcut]);

  return {
    shortcuts,
    contextualShortcut,
    frequentRoutes,
    addFrequentRoute,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function getRouteLabel(route: string): string {
  const labels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/games': 'Jogos',
    '/training': 'Treinos',
    '/training/agenda': 'Agenda de Treinos',
    '/training/planejamento': 'Planejamento',
    '/teams': 'Equipes',
    '/admin/athletes': 'Atletas',
    '/statistics': 'Estatísticas',
    '/calendar': 'Calendário',
  };
  
  return labels[route] || route.split('/').pop()?.replace(/-/g, ' ') || route;
}

export default useJourneyShortcuts;
