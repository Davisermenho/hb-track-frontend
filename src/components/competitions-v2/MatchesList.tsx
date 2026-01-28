/**
 * MatchesList - Lista de jogos da competição
 * 
 * Features:
 * - Agrupamento por rodada/fase
 * - Indicador de resultado (V/E/D)
 * - Edição de placar
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Edit3, 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  Home,
  Plane,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  CompetitionMatch, 
  CompetitionMatchResultUpdate,
  MatchStatus 
} from '@/lib/api/competitions-v2';

interface MatchesListProps {
  matches: CompetitionMatch[];
  onUpdateResult?: (matchId: string, result: CompetitionMatchResultUpdate) => Promise<void>;
  groupBy?: 'round' | 'phase' | 'date' | 'none';
  className?: string;
}

export default function MatchesList({ 
  matches, 
  onUpdateResult,
  groupBy = 'round',
  className 
}: MatchesListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum jogo cadastrado
        </p>
      </div>
    );
  }

  // Agrupar jogos
  const groupedMatches = groupMatchesBy(matches, groupBy);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(groupedMatches).map(([groupKey, groupMatches]) => (
        <div 
          key={groupKey} 
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          {/* Group Header */}
          {groupBy !== 'none' && (
            <button
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {groupKey}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {groupMatches.length} {groupMatches.length === 1 ? 'jogo' : 'jogos'}
                </span>
                {expandedGroups.has(groupKey) ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
          )}
          
          {/* Matches */}
          {(expandedGroups.has(groupKey) || expandedGroups.has('all') || groupBy === 'none') && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {groupMatches.map(match => (
                <MatchRow
                  key={match.id}
                  match={match}
                  isEditing={editingMatchId === match.id}
                  onEditStart={() => setEditingMatchId(match.id)}
                  onEditEnd={() => setEditingMatchId(null)}
                  onUpdateResult={onUpdateResult}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MATCH ROW
// =============================================================================

interface MatchRowProps {
  match: CompetitionMatch;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdateResult?: (matchId: string, result: CompetitionMatchResultUpdate) => Promise<void>;
}

function MatchRow({ match, isEditing, onEditStart, onEditEnd, onUpdateResult }: MatchRowProps) {
  const [ourScore, setOurScore] = useState(match.our_score ?? 0);
  const [opponentScore, setOpponentScore] = useState(match.opponent_score ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  const isFinished = match.status === 'finished';
  const hasResult = match.our_score !== null && match.opponent_score !== null;
  
  const getResultIndicator = () => {
    if (!hasResult) return null;
    if (match.our_score! > match.opponent_score!) return 'win';
    if (match.our_score! < match.opponent_score!) return 'loss';
    return 'draw';
  };

  const result = getResultIndicator();

  const handleSave = async () => {
    if (!onUpdateResult) return;
    
    setIsSaving(true);
    try {
      await onUpdateResult(match.id, {
        our_score: ourScore,
        opponent_score: opponentScore,
        status: 'finished',
      });
      onEditEnd();
    } catch (err) {
      console.error('Error saving result:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setOurScore(match.our_score ?? 0);
    setOpponentScore(match.opponent_score ?? 0);
    onEditEnd();
  };

  return (
    <div className={cn(
      'p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors',
      result === 'win' && 'border-l-4 border-l-green-500',
      result === 'loss' && 'border-l-4 border-l-red-500',
      result === 'draw' && 'border-l-4 border-l-gray-400'
    )}>
      {/* Main Row */}
      <div className="flex items-center gap-4">
        {/* Home/Away Indicator */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          match.is_home_game 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
        )}>
          {match.is_home_game ? (
            <Home className="w-4 h-4" />
          ) : (
            <Plane className="w-4 h-4" />
          )}
        </div>

        {/* Teams & Score */}
        <div className="flex-1 flex items-center justify-center gap-3">
          {/* Our Team */}
          <div className="flex-1 text-right">
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Nós
            </span>
          </div>

          {/* Score */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={ourScore}
                onChange={(e) => setOurScore(parseInt(e.target.value) || 0)}
                className="w-12 h-10 text-center text-lg font-bold rounded border border-gray-300 
                         dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="text-gray-400 font-bold">×</span>
              <input
                type="number"
                min="0"
                value={opponentScore}
                onChange={(e) => setOpponentScore(parseInt(e.target.value) || 0)}
                className="w-12 h-10 text-center text-lg font-bold rounded border border-gray-300 
                         dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              hasResult 
                ? 'bg-gray-100 dark:bg-gray-800' 
                : 'bg-gray-50 dark:bg-gray-800/50'
            )}>
              <span className={cn(
                'text-xl font-bold',
                result === 'win' && 'text-green-600 dark:text-green-400',
                result === 'loss' && 'text-red-600 dark:text-red-400',
                !hasResult && 'text-gray-400'
              )}>
                {hasResult ? match.our_score : '-'}
              </span>
              <span className="text-gray-400 font-bold">×</span>
              <span className={cn(
                'text-xl font-bold',
                result === 'loss' && 'text-green-600 dark:text-green-400',
                result === 'win' && 'text-red-600 dark:text-red-400',
                !hasResult && 'text-gray-400'
              )}>
                {hasResult ? match.opponent_score : '-'}
              </span>
            </div>
          )}

          {/* Opponent Team */}
          <div className="flex-1 text-left">
            <span className="font-medium text-gray-900 dark:text-white">
              {match.opponent_team?.name || 'Adversário'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : onUpdateResult ? (
            <button
              onClick={onEditStart}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 
                       dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              title="Editar resultado"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400 ml-12">
        {match.match_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(match.match_date)}
          </span>
        )}
        {match.match_time && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {match.match_time}
          </span>
        )}
        {match.venue && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {match.venue}
          </span>
        )}
        {match.round_number && (
          <span className="text-gray-400">
            Rodada {match.round_number}
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function groupMatchesBy(
  matches: CompetitionMatch[], 
  groupBy: 'round' | 'phase' | 'date' | 'none'
): Record<string, CompetitionMatch[]> {
  if (groupBy === 'none') {
    return { 'all': matches };
  }

  return matches.reduce((acc, match) => {
    let key: string;
    
    switch (groupBy) {
      case 'round':
        key = match.round_number ? `Rodada ${match.round_number}` : 'Sem rodada';
        break;
      case 'phase':
        key = match.phase_id || 'Fase única';
        break;
      case 'date':
        key = match.match_date ? formatDate(match.match_date) : 'Data indefinida';
        break;
      default:
        key = 'Jogos';
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(match);
    return acc;
  }, {} as Record<string, CompetitionMatch[]>);
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

// Card compacto para próximo jogo
interface NextMatchCardProps {
  match: CompetitionMatch;
  className?: string;
}

export function NextMatchCard({ match, className }: NextMatchCardProps) {
  return (
    <div className={cn(
      'p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      className
    )}>
      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2 uppercase tracking-wider">
        Próximo Jogo
      </p>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            vs {match.opponent_team?.name || 'Adversário'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
            {match.match_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(match.match_date)}
              </span>
            )}
            {match.match_time && (
              <span>{match.match_time}</span>
            )}
          </div>
        </div>
        
        <div className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium',
          match.is_home_game 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
        )}>
          {match.is_home_game ? 'Casa' : 'Fora'}
        </div>
      </div>
    </div>
  );
}
