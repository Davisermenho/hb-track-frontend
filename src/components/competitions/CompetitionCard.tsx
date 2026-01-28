/**
 * CompetitionCard - Card de exibição de competição
 * 
 * Exibe:
 * - Nome da competição
 * - Tipo (official, friendly, etc)
 * - Data de criação
 * - Número de temporadas vinculadas (futuro)
 */

'use client';

import { Trophy, Calendar, Tag } from 'lucide-react';
import type { Competition } from '@/lib/api/competitions';

interface CompetitionCardProps {
  competition: Competition;
  onClick?: () => void;
}

export default function CompetitionCard({ competition, onClick }: CompetitionCardProps) {
  // Determina a cor baseada no tipo
  const getKindColor = (kind?: string) => {
    switch (kind) {
      case 'official':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'friendly':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'training-game':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getKindLabel = (kind?: string) => {
    switch (kind) {
      case 'official':
        return 'Oficial';
      case 'friendly':
        return 'Amistoso';
      case 'training-game':
        return 'Jogo-Treino';
      default:
        return kind || 'Não definido';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
               dark:border-gray-700 p-4 cursor-pointer transition-all duration-200
               hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0
                      group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate 
                       group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {competition.name}
          </h3>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2">
        {/* Kind badge */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className={`text-xs px-2 py-0.5 rounded-full ${getKindColor(competition.kind)}`}>
            {getKindLabel(competition.kind)}
          </span>
        </div>

        {/* Created date */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            Criado em {new Date(competition.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Footer - hover action hint */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400 dark:text-gray-500 
                       group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
          Clique para ver detalhes →
        </span>
      </div>
    </div>
  );
}
