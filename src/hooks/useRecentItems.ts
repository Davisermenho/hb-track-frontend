'use client';

/**
 * useRecentItems - Hook para rastrear itens acessados recentemente
 * 
 * Armazena navegação recente do usuário para sugestões na busca global.
 * 
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import {
  Users,
  Dumbbell,
  Gamepad2,
  Trophy,
  BarChart3,
  Home,
  Calendar,
  Settings,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export interface RecentItem {
  id: string;
  path: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  type: 'page' | 'athlete' | 'team' | 'game' | 'training';
  timestamp: number;
}

interface UseRecentItemsReturn {
  recentItems: RecentItem[];
  addRecentItem: (item: Omit<RecentItem, 'id' | 'timestamp'>) => void;
  removeRecentItem: (id: string) => void;
  clearRecentItems: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const STORAGE_KEY = 'hbtrack-recent-items';
const MAX_ITEMS = 10;

// Mapeamento de rotas para ícones e títulos
const ROUTE_CONFIG: Record<string, { title: string; icon: LucideIcon; type: RecentItem['type'] }> = {
  '/dashboard': { title: 'Dashboard', icon: Home, type: 'page' },
  '/inicio': { title: 'Página Inicial', icon: Home, type: 'page' },
  '/teams': { title: 'Equipes', icon: Users, type: 'page' },
  '/training': { title: 'Treinos', icon: Dumbbell, type: 'page' },
  '/training/agenda': { title: 'Agenda de Treinos', icon: Dumbbell, type: 'page' },
  '/training/planejamento': { title: 'Planejamento', icon: Dumbbell, type: 'page' },
  '/training/banco': { title: 'Banco de Exercícios', icon: Dumbbell, type: 'page' },
  '/training/avaliacoes': { title: 'Avaliações', icon: Dumbbell, type: 'page' },
  '/training/presencas': { title: 'Presenças', icon: Dumbbell, type: 'page' },
  '/games': { title: 'Jogos', icon: Gamepad2, type: 'page' },
  '/games/agenda': { title: 'Agenda de Jogos', icon: Gamepad2, type: 'page' },
  '/games/escalacoes': { title: 'Escalações', icon: Gamepad2, type: 'page' },
  '/games/eventos': { title: 'Eventos de Jogos', icon: Gamepad2, type: 'page' },
  '/games/relatorio': { title: 'Relatório Técnico', icon: Gamepad2, type: 'page' },
  '/competitions': { title: 'Competições', icon: Trophy, type: 'page' },
  '/admin/athletes': { title: 'Atletas', icon: Users, type: 'page' },
  '/statistics': { title: 'Estatísticas', icon: BarChart3, type: 'page' },
  '/calendar': { title: 'Calendário', icon: Calendar, type: 'page' },
  '/admin/cadastro': { title: 'Usuários', icon: Users, type: 'page' },
  '/admin/staff': { title: 'Comissão Técnica', icon: Users, type: 'page' },
  '/admin/settings': { title: 'Configurações', icon: Settings, type: 'page' },
};

// =============================================================================
// HOOK
// =============================================================================

export function useRecentItems(): UseRecentItemsReturn {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        icon: ROUTE_CONFIG[item.path]?.icon || Home,
      }));
    } catch (e) {
      console.error('Erro ao carregar itens recentes:', e);
      return [];
    }
  });

  // Persistir no localStorage
  const persistItems = useCallback((items: RecentItem[]) => {
    if (typeof window !== 'undefined') {
      // Remover ícones para serialização
      const toStore = items.map(({ icon, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }
  }, []);

  // Adicionar item recente
  const addRecentItem = useCallback((item: Omit<RecentItem, 'id' | 'timestamp'>) => {
    setRecentItems(prev => {
      // Remover duplicata se existir
      const filtered = prev.filter(i => i.path !== item.path);
      
      // Adicionar no início
      const newItem: RecentItem = {
        ...item,
        id: `recent-${Date.now()}`,
        timestamp: Date.now(),
      };
      
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  // Remover item
  const removeRecentItem = useCallback((id: string) => {
    setRecentItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  // Limpar tudo
  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
  };
}

export default useRecentItems;
