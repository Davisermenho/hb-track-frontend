/**
 * PlanejamentoClient
 * 
 * Componente cliente do Planejamento Estrutural
 * - Timeline hierárquica: Trimestre → Meso → Micro
 * - Cards colapsáveis
 * - Criação e edição de ciclos
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  Target,
  Layers,
  AlertTriangle,
  MoreHorizontal,
  Copy,
  Edit3,
  Trash2
} from 'lucide-react';
import { useCycles } from '@/lib/hooks/useCycles';
import { useMicrocycles } from '@/lib/hooks/useMicrocycles';
import { useTrainingContext } from '@/context/TrainingContext';
import { Button } from '@/components/ui/Button';
import { CopyWeekModal } from '@/components/training/modals/CopyWeekModal';
import { CreateCycleWizard } from '@/components/training/modals/CreateCycleWizard';
import type { TrainingCycle, TrainingMicrocycle } from '@/lib/api/trainings';

const CYCLE_TYPE_CONFIG = {
  macro: {
    label: 'Macrociclo',
    icon: '🔄',
    color: 'blue',
    description: 'Temporada completa (6-12 meses)',
  },
  meso: {
    label: 'Mesociclo',
    icon: '📅',
    color: 'emerald',
    description: 'Período de 4-6 semanas',
  },
};

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'emerald' },
  completed: { label: 'Concluído', color: 'slate' },
  cancelled: { label: 'Cancelado', color: 'red' },
};

export default function PlanejamentoClient() {
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  
  const { cycles, isLoading: cyclesLoading, fetchCycles } = useCycles();
  const { microcycles, isLoading: microcyclesLoading, fetchMicrocycles } = useMicrocycles();
  const { selectedTeam } = useTrainingContext();

  useEffect(() => {
    if (selectedTeam?.id) {
      fetchCycles({ team_id: selectedTeam.id });
      fetchMicrocycles({ team_id: selectedTeam.id });
    }
  }, [selectedTeam?.id, fetchCycles, fetchMicrocycles]);

  // Organiza ciclos: macrociclos com mesociclos filhos
  const organizedCycles = React.useMemo(() => {
    const macros = cycles.filter(c => c.type === 'macro');
    const mesos = cycles.filter(c => c.type === 'meso');
    
    return macros.map(macro => ({
      ...macro,
      mesocycles: mesos.filter(m => m.parent_cycle_id === macro.id),
    }));
  }, [cycles]);

  // Microciclos por ciclo
  const microcyclesByCycle = React.useMemo(() => {
    const grouped: Record<string, TrainingMicrocycle[]> = {};
    microcycles.forEach(micro => {
      if (micro.cycle_id) {
        if (!grouped[micro.cycle_id]) {
          grouped[micro.cycle_id] = [];
        }
        grouped[micro.cycle_id].push(micro);
      }
    });
    return grouped;
  }, [microcycles]);

  const toggleExpand = (cycleId: string) => {
    setExpandedCycles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cycleId)) {
        newSet.delete(cycleId);
      } else {
        newSet.add(cycleId);
      }
      return newSet;
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  const isLoading = cyclesLoading || microcyclesLoading;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Planejamento</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organize macrociclos, mesociclos e microciclos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCopyWeekModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0f0f0f] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              data-tour="copy-week"
            >
              <Copy className="w-4 h-4" />
              Copiar Semana
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Novo Ciclo
            </button>
          </div>
        </div>
      </div>

      <main className="p-6">
        {/* Estado sem equipe */}
        {!selectedTeam && (
          <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Selecione uma equipe
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Escolha uma equipe para ver o planejamento de treinos
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedTeam && isLoading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-5">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-900 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Lista de Ciclos */}
        {selectedTeam && !isLoading && (
          <div className="space-y-4">
            {/* Empty State */}
            {organizedCycles.length === 0 && (
              <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Target className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Nenhum ciclo criado
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Crie seu primeiro macrociclo para começar o planejamento
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Criar Macrociclo
                </Button>
              </div>
            )}

            {/* Macrociclos */}
            {organizedCycles.map(macro => {
              const isExpanded = expandedCycles.has(macro.id);
              const config = CYCLE_TYPE_CONFIG.macro;
              const status = STATUS_CONFIG[macro.status];

              return (
                <div
                  key={macro.id}
                  className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
                >
                  {/* Macro Header */}
                  <div
                    onClick={() => toggleExpand(macro.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button className="p-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      
                      <span className="text-2xl">{config.icon}</span>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {macro.objective || config.label}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${status.color}-100 dark:bg-${status.color}-900/30 text-${status.color}-700 dark:text-${status.color}-300`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDateRange(macro.start_date, macro.end_date)} • {macro.mesocycles?.length || 0} mesociclos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Mesociclos */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      {macro.mesocycles && macro.mesocycles.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {macro.mesocycles.map(meso => {
                            const mesoExpanded = expandedCycles.has(meso.id);
                            const mesoMicros = microcyclesByCycle[meso.id] || [];

                            return (
                              <div key={meso.id}>
                                {/* Meso Header */}
                                <div
                                  onClick={() => toggleExpand(meso.id)}
                                  className="flex items-center justify-between pl-12 pr-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <button className="p-1">
                                      {mesoExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                      )}
                                    </button>
                                    
                                    <span className="text-lg">📅</span>
                                    
                                    <div>
                                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                                        {meso.objective || 'Mesociclo'}
                                      </h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatDateRange(meso.start_date, meso.end_date)} • {mesoMicros.length} microciclos
                                      </p>
                                    </div>
                                  </div>

                                  <Button
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                      e.stopPropagation();
                                      // TODO: Adicionar microciclo
                                    }}
                                    className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Microciclo
                                  </Button>
                                </div>

                                {/* Microciclos */}
                                {mesoExpanded && mesoMicros.length > 0 && (
                                  <div className="pl-20 pr-4 pb-3 space-y-2">
                                    {mesoMicros.map(micro => (
                                      <div
                                        key={micro.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Calendar className="w-4 h-4 text-slate-400" />
                                          <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                              Semana {new Date(micro.week_start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                              {micro.microcycle_type || 'Normal'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Barra de carga planejada */}
                                        {micro.planned_weekly_load && (
                                          <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${Math.min(micro.planned_weekly_load, 100)}%` }}
                                              />
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                              {micro.planned_weekly_load}%
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            Nenhum mesociclo neste macrociclo
                          </p>
                          <Button className="text-xs px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 rounded">
                            <Plus className="w-3 h-3 mr-1" />
                            Criar Mesociclo
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Copy Week */}
      {showCopyWeekModal && selectedTeam && (
        <CopyWeekModal
          isOpen={showCopyWeekModal}
          onClose={() => setShowCopyWeekModal(false)}
          onSuccess={() => {
            setShowCopyWeekModal(false);
            if (selectedTeam?.id) {
              fetchCycles({ team_id: selectedTeam.id });
              fetchMicrocycles({ team_id: selectedTeam.id });
            }
          }}
          teamId={selectedTeam.id}
        />
      )}

      {/* Modal Create Cycle Wizard */}
      {showCreateModal && selectedTeam && (
        <CreateCycleWizard
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            if (selectedTeam?.id) {
              fetchCycles({ team_id: selectedTeam.id });
              fetchMicrocycles({ team_id: selectedTeam.id });
            }
          }}
          teamId={selectedTeam.id}
        />
      )}
    </div>
  );
}
