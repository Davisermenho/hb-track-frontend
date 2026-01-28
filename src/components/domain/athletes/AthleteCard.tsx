'use client';

import { motion } from 'framer-motion';
import { User, Calendar, Shirt, TrendingUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge-ui';
import { AthleteStateBadge } from './AthleteStateBadge';
import { cn, calculateAge, formatDate } from '@/lib/utils';

interface AthleteCardProps {
  athlete: {
    id: string;
    photo_url?: string | null;
    name: string;
    birth_date: string;
    state: 'ativa' | 'dispensada' | 'arquivada';
    flags?: {
      injured?: boolean;
      suspended_until?: string | null;
      medical_restriction?: boolean;
      load_restricted?: boolean;
    };
    positions?: {
      defensive?: string;
      offensive?: string;
    };
    shirt_number?: number;
    team?: string;
    stats?: {
      games: number;
      goals: number;
      assists: number;
    };
  };
  onClick?: () => void;
  className?: string;
}

export function AthleteCard({ athlete, onClick, className }: AthleteCardProps) {
  const age = calculateAge(athlete.birth_date);
  const MotionDiv = motion.div as any;

  return (
    <MotionDiv
      whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-900',
        'border border-gray-200 dark:border-gray-800',
        'rounded-xl p-5',
        'transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={athlete.photo_url || undefined} alt={athlete.name} />
          <AvatarFallback>{athlete.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {athlete.name}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="size-4" />
            <span>{age} anos</span>
            {athlete.shirt_number && (
              <>
                <span>•</span>
                <Shirt className="size-4" />
                <span>#{athlete.shirt_number}</span>
              </>
            )}
          </div>

          {athlete.team && (
            <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
              {athlete.team}
            </p>
          )}
        </div>
      </div>

      {/* State & Flags */}
      <div className="mb-4">
        <AthleteStateBadge state={athlete.state} flags={athlete.flags} size="sm" />
      </div>

      {/* Positions */}
      {athlete.positions && (
        <div className="flex flex-wrap gap-2 mb-4">
          {athlete.positions.defensive && (
            <Badge variant="secondary">
              Def: {athlete.positions.defensive}
            </Badge>
          )}
          {athlete.positions.offensive && (
            <Badge variant="default">
              Ofe: {athlete.positions.offensive}
            </Badge>
          )}
        </div>
      )}

      {/* Stats */}
      {athlete.stats && (
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {athlete.stats.games}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Jogos</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {athlete.stats.goals}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Gols</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {athlete.stats.assists}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Assist.</p>
          </div>
        </div>
      )}
    </MotionDiv>
  );
}