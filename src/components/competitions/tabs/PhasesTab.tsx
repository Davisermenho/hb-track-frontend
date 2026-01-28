/**
 * PhasesTab - Tab de fases/etapas da competição
 * 
 * Exibe as temporadas vinculadas e suas fases (quando implementadas no backend)
 * Atualmente o backend só tem competition_seasons, não há endpoint de phases ainda
 */

'use client';

import { useState } from 'react';
import { useCompetitionSeasons } from '@/hooks/useCompetitions';
import { 
  Plus, 
  CalendarDays,
  ChevronRight,
  Folder
} from 'lucide-react';
import { CompetitionSeason } from '@/lib/api/competitions';

interface PhasesTabProps {
  competitionId: string;
}

// Extended type for UI display with phases (future feature)
interface SeasonWithPhases extends CompetitionSeason {
  phases?: Array<{
    id: string;
    name: string;
    order: number;
    type: string;
    groups?: Array<{ id: string; name: string }>;
  }>;
}

export default function PhasesTab({ competitionId }: PhasesTabProps) {
  const { data: seasonsData, isLoading } = useCompetitionSeasons(competitionId);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Type assert for now - phases will come from future API
  const seasons = seasonsData as SeasonWithPhases[] | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!seasons || seasons.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhuma temporada cadastrada
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Crie temporadas para organizar as fases e jogos da competição
        </p>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                   bg-amber-500 hover:bg-amber-600 text-white font-medium
                   transition-colors"
        >
          <Plus className="w-5 h-5" />
          Criar Temporada
        </button>
      </div>
    );
  }

  const toggleSeason = (seasonId: string) => {
    setExpandedSeason(expandedSeason === seasonId ? null : seasonId);
    setExpandedPhase(null);
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Temporadas e Fases
        </h3>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                   text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20
                   transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Temporada
        </button>
      </div>

      {/* Seasons list */}
      <div className="space-y-3">
        {seasons.map((season: SeasonWithPhases) => (
          <div
            key={season.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg 
                     overflow-hidden"
          >
            {/* Season header */}
            <button
              onClick={() => toggleSeason(season.id)}
              className="w-full flex items-center justify-between p-4 
                       hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-amber-500" />
                <div className="text-left">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {season.name || `Temporada ${season.season_id.slice(0, 8)}...`}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {season.phases?.length || 0} fases
                  </span>
                </div>
              </div>
              <ChevronRight 
                className={`w-5 h-5 text-gray-400 transition-transform
                          ${expandedSeason === season.id ? 'rotate-90' : ''}`} 
              />
            </button>

            {/* Season content (phases) */}
            {expandedSeason === season.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 
                            bg-gray-50 dark:bg-gray-800/50">
                {season.phases && season.phases.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {season.phases.map((phase) => (
                      <div
                        key={phase.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border 
                                 border-gray-200 dark:border-gray-700"
                      >
                        {/* Phase header */}
                        <button
                          onClick={() => togglePhase(phase.id)}
                          className="w-full flex items-center justify-between p-3 
                                   hover:bg-gray-50 dark:hover:bg-gray-700/50 
                                   transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center
                                          bg-amber-100 dark:bg-amber-900/30 rounded
                                          text-xs font-medium text-amber-600 
                                          dark:text-amber-400">
                              {phase.order}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {phase.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 
                                          bg-gray-100 dark:bg-gray-700 px-2 py-0.5 
                                          rounded">
                              {phase.type}
                            </span>
                          </div>
                          <ChevronRight 
                            className={`w-4 h-4 text-gray-400 transition-transform
                                      ${expandedPhase === phase.id ? 'rotate-90' : ''}`} 
                          />
                        </button>

                        {/* Phase content (groups) */}
                        {expandedPhase === phase.id && (
                          <div className="border-t border-gray-200 dark:border-gray-700 
                                        p-3 space-y-2">
                            {phase.groups && phase.groups.length > 0 ? (
                              phase.groups.map((group) => (
                                <div
                                  key={group.id}
                                  className="flex items-center gap-2 p-2 
                                           bg-gray-50 dark:bg-gray-700/50 rounded"
                                >
                                  <Folder className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {group.name}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 
                                          text-center py-2">
                                Nenhum grupo nesta fase
                              </p>
                            )}
                            <button
                              className="w-full text-center text-sm text-amber-600 
                                       hover:text-amber-700 dark:text-amber-400 
                                       py-2 transition-colors"
                            >
                              + Adicionar Grupo
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      className="w-full text-center text-sm text-amber-600 
                               hover:text-amber-700 dark:text-amber-400 
                               py-2 transition-colors"
                    >
                      + Adicionar Fase
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Nenhuma fase nesta temporada
                    </p>
                    <button
                      className="text-sm text-amber-600 hover:text-amber-700 
                               dark:text-amber-400 font-medium"
                    >
                      + Criar Primeira Fase
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
