'use client';

/**
 * useSidebarBadges - Hook para badges dinâmicos na sidebar
 * 
 * Fornece contadores em tempo real para:
 * - Jogos do dia
 * - Treinos pendentes
 * - Relatórios novos
 * - Notificações não lidas
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface BadgeData {
  games: {
    today: number;
    thisWeek: number;
  };
  training: {
    pending: number;
    today: number;
  };
  reports: {
    new: number;
    unread: number;
  };
  notifications: {
    unread: number;
  };
  athletes: {
    pendingEvaluation: number;
  };
}

interface UseSidebarBadgesReturn {
  badges: BadgeData;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  // Helpers formatados
  getGamesBadge: () => string | null;
  getTrainingBadge: () => string | null;
  getReportsBadge: () => string | null;
  getNotificationsBadge: () => string | null;
}

// Função para buscar dados dos badges (mock por enquanto)
async function fetchBadgeData(): Promise<BadgeData> {
  // TODO: Substituir por chamadas reais à API
  // const [games, trainings, reports, notifications] = await Promise.all([
  //   api.get('/games/today/count'),
  //   api.get('/training/pending/count'),
  //   api.get('/reports/new/count'),
  //   api.get('/notifications/unread/count'),
  // ]);

  // Mock data - simular dados reais
  return {
    games: {
      today: Math.floor(Math.random() * 3), // 0-2 jogos hoje
      thisWeek: Math.floor(Math.random() * 5) + 1, // 1-5 jogos na semana
    },
    training: {
      pending: Math.floor(Math.random() * 4), // 0-3 treinos pendentes
      today: Math.floor(Math.random() * 2) + 1, // 1-2 treinos hoje
    },
    reports: {
      new: Math.floor(Math.random() * 5), // 0-4 relatórios novos
      unread: Math.floor(Math.random() * 8), // 0-7 não lidos
    },
    notifications: {
      unread: Math.floor(Math.random() * 10), // 0-9 notificações
    },
    athletes: {
      pendingEvaluation: Math.floor(Math.random() * 6), // 0-5 avaliações pendentes
    },
  };
}

export function useSidebarBadges(): UseSidebarBadgesReturn {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<BadgeData, Error>({
    queryKey: ['sidebar-badges'],
    queryFn: fetchBadgeData,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
    refetchOnWindowFocus: true,
    staleTime: 30000, // Considerar stale após 30 segundos
  });

  const badges: BadgeData = useMemo(() => data || {
    games: { today: 0, thisWeek: 0 },
    training: { pending: 0, today: 0 },
    reports: { new: 0, unread: 0 },
    notifications: { unread: 0 },
    athletes: { pendingEvaluation: 0 },
  }, [data]);

  // Helpers para formatar badges
  const getGamesBadge = (): string | null => {
    if (badges.games.today > 0) {
      return badges.games.today === 1 ? '1 hoje' : `${badges.games.today} hoje`;
    }
    return null;
  };

  const getTrainingBadge = (): string | null => {
    if (badges.training.pending > 0) {
      return badges.training.pending === 1 
        ? '1 pendente' 
        : `${badges.training.pending} pendentes`;
    }
    return null;
  };

  const getReportsBadge = (): string | null => {
    if (badges.reports.new > 0) {
      return badges.reports.new === 1 ? '1 novo' : `${badges.reports.new} novos`;
    }
    return null;
  };

  const getNotificationsBadge = (): string | null => {
    if (badges.notifications.unread > 0) {
      return badges.notifications.unread > 9 
        ? '9+' 
        : String(badges.notifications.unread);
    }
    return null;
  };

  return {
    badges,
    isLoading,
    error: error || null,
    refetch,
    getGamesBadge,
    getTrainingBadge,
    getReportsBadge,
    getNotificationsBadge,
  };
}

export default useSidebarBadges;
