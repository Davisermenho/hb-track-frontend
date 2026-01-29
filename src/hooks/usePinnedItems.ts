'use client';

/**
 * usePinnedItems - Hook para gerenciar itens fixados/favoritos
 * 
 * Permite ao usuário fixar itens para acesso rápido na busca global.
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
  Star,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export interface PinnedItem {
  id: string;
  path: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  type: 'page' | 'athlete' | 'team' | 'game' | 'training' | 'custom';
  pinnedAt: number;
}

interface UsePinnedItemsReturn {
  pinnedItems: PinnedItem[];
  isPinned: (path: string) => boolean;
  togglePin: (item: Omit<PinnedItem, 'id' | 'pinnedAt'>) => void;
  pinItem: (item: Omit<PinnedItem, 'id' | 'pinnedAt'>) => void;
  unpinItem: (path: string) => void;
  clearPinnedItems: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const STORAGE_KEY = 'hbtrack-pinned-items';
const MAX_PINNED = 8;

// Mapeamento de rotas para ícones
const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/dashboard': Home,
  '/teams': Users,
  '/training': Dumbbell,
  '/games': Gamepad2,
  '/competitions': Trophy,
  '/statistics': BarChart3,
  '/calendar': Calendar,
};

// =============================================================================
// HOOK
// =============================================================================

export function usePinnedItems(): UsePinnedItemsReturn {
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        icon: ROUTE_ICONS[item.path] || Star,
      }));
    } catch (e) {
      console.error('Erro ao carregar itens fixados:', e);
      return [];
    }
  });

  // Persistir no localStorage
  const persistItems = useCallback((items: PinnedItem[]) => {
    if (typeof window !== 'undefined') {
      // Remover ícones para serialização
      const toStore = items.map(({ icon, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }
  }, []);

  // Verificar se um item está fixado
  const isPinned = useCallback((path: string): boolean => {
    return pinnedItems.some(item => item.path === path);
  }, [pinnedItems]);

  // Fixar item
  const pinItem = useCallback((item: Omit<PinnedItem, 'id' | 'pinnedAt'>) => {
    setPinnedItems(prev => {
      // Verificar se já está fixado
      if (prev.some(i => i.path === item.path)) {
        return prev;
      }
      
      // Verificar limite
      if (prev.length >= MAX_PINNED) {
        console.warn(`Limite de ${MAX_PINNED} itens fixados atingido`);
        return prev;
      }
      
      const newItem: PinnedItem = {
        ...item,
        id: `pinned-${Date.now()}`,
        pinnedAt: Date.now(),
      };
      
      const updated = [...prev, newItem];
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  // Remover item fixado
  const unpinItem = useCallback((path: string) => {
    setPinnedItems(prev => {
      const updated = prev.filter(item => item.path !== path);
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  // Alternar fixar/desfixar
  const togglePin = useCallback((item: Omit<PinnedItem, 'id' | 'pinnedAt'>) => {
    if (isPinned(item.path)) {
      unpinItem(item.path);
    } else {
      pinItem(item);
    }
  }, [isPinned, pinItem, unpinItem]);

  // Limpar todos
  const clearPinnedItems = useCallback(() => {
    setPinnedItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    pinnedItems,
    isPinned,
    togglePin,
    pinItem,
    unpinItem,
    clearPinnedItems,
  };
}

export default usePinnedItems;
