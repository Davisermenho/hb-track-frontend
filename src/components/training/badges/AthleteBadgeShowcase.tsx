"use client";

/**
 * AthleteBadgeShowcase - Seção de conquistas com badges no perfil do atleta
 * 
 * **Step 27:** Badge visual no perfil com animação confetti
 * 
 * **Features:**
 * - Exibe badges conquistados (wellness_champion_monthly, wellness_streak_3months)
 * - Animação confetti ao conquistar novo badge
 * - Grid responsivo com cards
 * - Filtro por mês/ano
 * - Tooltip com detalhes do badge
 * - Empty state motivacional
 * - Skeleton loading
 * 
 * **Usage:**
 * ```tsx
 * import { AthleteBadgeShowcase } from '@/components/training/badges/AthleteBadgeShowcase';
 * 
 * <AthleteBadgeShowcase athleteId={athleteId} />
 * ```
 */

import React, { useEffect, useState, useMemo } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Trophy, Award, Star, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge-ui';
import { Skeleton } from '@/components/ui/Skeleton';
// Select component não disponível - usando alternativa nativa
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

// ================================================================================
// TYPES
// ================================================================================

interface AthleteBadge {
  id: string;
  type: 'wellness_champion_monthly' | 'wellness_streak_3months' | 'perfect_attendance';
  earned_at: string;
  month_reference: string; // YYYY-MM format
  metadata?: {
    response_rate?: number;
    streak_months?: number;
    sessions_attended?: number;
  };
}

interface AthleteBadgeShowcaseProps {
  athleteId: string;
  showConfetti?: boolean;
}

// ================================================================================
// BADGE CONFIG
// ================================================================================

const BADGE_CONFIG = {
  wellness_champion_monthly: {
    icon: Trophy,
    title: 'Wellness Champion',
    description: 'Taxa de resposta wellness ≥ 90% no mês',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  wellness_streak_3months: {
    icon: TrendingUp,
    title: 'Streak de 3 Meses',
    description: 'Wellness Champion por 3 meses consecutivos',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  perfect_attendance: {
    icon: Star,
    title: 'Presença Perfeita',
    description: '100% de presença no mês',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
};

// ================================================================================
// COMPONENT
// ================================================================================

export const AthleteBadgeShowcase: React.FC<AthleteBadgeShowcaseProps> = ({
  athleteId,
  showConfetti = false,
}) => {
  const { width, height } = useWindowSize();
  const [badges, setBadges] = useState<AthleteBadge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<AthleteBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract unique months from badges
  const months = useMemo(() => {
    const uniqueMonths = Array.from(new Set(badges.map(b => b.month_reference)));
    return uniqueMonths.sort((a, b) => b.localeCompare(a)); // Descending
  }, [badges]);
  const [showConfettiEffect, setShowConfettiEffect] = useState(false);

  // Mock fetch badges (substituir por API real)
  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        // TODO: Substituir por chamada real à API
        // const response = await fetch(`/api/v1/badges/athlete/${athleteId}`);
        // const data = await response.json();
        
        // Mock data
        const mockBadges: AthleteBadge[] = [
          {
            id: '1',
            type: 'wellness_champion_monthly',
            earned_at: '2026-01-31T23:59:59Z',
            month_reference: '2026-01',
            metadata: { response_rate: 95 },
          },
          {
            id: '2',
            type: 'wellness_champion_monthly',
            earned_at: '2025-12-31T23:59:59Z',
            month_reference: '2025-12',
            metadata: { response_rate: 92 },
          },
          {
            id: '3',
            type: 'wellness_streak_3months',
            earned_at: '2025-12-31T23:59:59Z',
            month_reference: '2025-12',
            metadata: { streak_months: 3 },
          },
        ];

        setBadges(mockBadges);
        setFilteredBadges(mockBadges);
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [athleteId]);

  // Trigger confetti on mount if showConfetti prop is true
  useEffect(() => {
    if (showConfetti && badges.length > 0) {
      setShowConfettiEffect(true);
      const timer = setTimeout(() => setShowConfettiEffect(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti, badges]);

  // Filter badges by month
  useEffect(() => {
    if (selectedMonth === 'all') {
      setFilteredBadges(badges);
    } else {
      setFilteredBadges(badges.filter((b) => b.month_reference === selectedMonth));
    }
  }, [selectedMonth, badges]);

  // Get unique months for filter
  const availableMonths = Array.from(
    new Set(badges.map((b) => b.month_reference))
  ).sort((a, b) => b.localeCompare(a));

  // Format month label
  const formatMonth = (monthRef: string) => {
    const [year, month] = monthRef.split('-');
    const date = new Date(`${year}-${month}-01`);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Render loading skeleton
  if (loading) {
    return (
      <Card data-tour="badge-progress">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Minhas Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (badges.length === 0) {
    return (
      <Card data-tour="badge-progress">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Minhas Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nenhum badge conquistado ainda
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Conquiste badges respondendo wellness consistentemente!
              <br />
              <strong className="text-blue-600 dark:text-blue-400">
                Meta: 90% de respostas mensais
              </strong>{' '}
              para ganhar o badge &ldquo;Wellness Champion&rdquo;.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showConfettiEffect && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <Card data-tour="badge-progress">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Minhas Conquistas
          </CardTitle>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[180px] px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="all">Todos os meses</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Star className="h-4 w-4" />
            <span>
              Total de badges: <strong>{badges.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const config = BADGE_CONFIG[badge.type];
              const Icon = config.icon;

              return (
                <TooltipProvider key={badge.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card
                        className={`cursor-pointer transition-all hover:scale-105 border-2 ${config.borderColor} ${config.bgColor}`}
                      >
                        <CardContent className="p-4 flex flex-col items-center text-center">
                          <Icon className="h-16 w-16 mb-3" />
                          <h3 className="font-bold text-sm">{config.title}</h3>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-semibold mb-1">{config.title}</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {config.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Conquistado em{' '}
                          {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {filteredBadges.length === 0 && selectedMonth !== 'all' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum badge conquistado em {formatMonth(selectedMonth)}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
