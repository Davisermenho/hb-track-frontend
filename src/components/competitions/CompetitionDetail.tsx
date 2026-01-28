/**
 * CompetitionDetail - Visualização detalhada de uma competição
 * 
 * Features:
 * - Header com informações da competição
 * - Tabs para navegação (Fases, Classificação, Regulamento)
 * - Ações de editar/excluir
 */

'use client';

import { useState } from 'react';
import { useCompetitionsContext } from '@/context/CompetitionsContext';
import { useCompetition } from '@/hooks/useCompetitions';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2,
  Trophy,
  Calendar,
  Tag
} from 'lucide-react';
import PhasesTab from './tabs/PhasesTab';
import StandingsTab from './tabs/StandingsTab';
import RulesTab from './tabs/RulesTab';

const TABS = [
  { id: 'phases', label: 'Fases' },
  { id: 'standings', label: 'Classificação' },
  { id: 'rules', label: 'Regulamento' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function CompetitionDetail() {
  const { 
    selectedCompetitionId, 
    clearSelectedCompetition,
    activeTab,
    setActiveTab,
    openEditModal
  } = useCompetitionsContext();
  
  const { data: competition, isLoading, error } = useCompetition(selectedCompetitionId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getKindLabel = (kind?: string) => {
    if (!kind) return 'Não definido';
    const labels: Record<string, string> = {
      'official': 'Oficial',
      'friendly': 'Amistoso',
      'training-game': 'Jogo-Treino',
    };
    return labels[kind] || kind;
  };

  const getKindColor = (kind?: string) => {
    if (!kind) return 'bg-gray-100 text-gray-700';
    const colors: Record<string, string> = {
      'official': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'friendly': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'training-game': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[kind] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-gray-500 dark:text-gray-400">
          Competição não encontrada
        </p>
        <button
          onClick={clearSelectedCompetition}
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
                    border-gray-200 dark:border-gray-700 p-6">
        {/* Back button and actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={clearSelectedCompetition}
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 
                     hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para lista</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditModal(competition.id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                       text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                       dark:hover:bg-gray-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                       text-red-600 dark:text-red-400 hover:bg-red-50 
                       dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          </div>
        </div>

        {/* Competition info */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {competition.name}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full 
                            text-xs font-medium ${getKindColor(competition.kind)}`}>
                {getKindLabel(competition.kind)}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Criado em {new Date(competition.created_at).toLocaleDateString('pt-BR')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Tag className="w-4 h-4" />
                ID: {competition.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
                    border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors
                          ${activeTab === tab.id
                            ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'phases' && <PhasesTab competitionId={competition.id} />}
          {activeTab === 'standings' && <StandingsTab competitionId={competition.id} />}
          {activeTab === 'rules' && <RulesTab competition={competition} />}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setShowDeleteConfirm(false)} 
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 
                        shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Excluir Competição
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir <strong>{competition.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                         dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // TODO: Implement delete mutation
                  setShowDeleteConfirm(false);
                  clearSelectedCompetition();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 
                         text-white font-medium transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
