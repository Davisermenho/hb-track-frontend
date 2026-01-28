/**
 * CompetitionsDashboard - Dashboard principal de competições
 * 
 * Exibe:
 * - Barra de filtros
 * - Lista de competições (cards ou tabela)
 * - Estado vazio
 * - Paginação
 * - Wizard de criação com IA (V2)
 */

'use client';

import { useState } from 'react';
import { useCompetitionsContext, CompetitionTab } from '@/context/CompetitionsContext';
import { useCompetitionV2Context } from '@/context/CompetitionV2Context';
import { useCompetitions } from '@/hooks/useCompetitions';
import CompetitionCard from './CompetitionCard';
import CompetitionsFilterBar from './CompetitionsFilterBar';
import CreateCompetitionModal from './modals/CreateCompetitionModal';
import { CreateCompetitionWizard } from '@/components/competitions-v2/wizard';
import { Plus, Trophy, Sparkles } from 'lucide-react';
import AppSkeleton from '@/components/ui/AppSkeleton';

interface CompetitionsDashboardProps {
  onSelectCompetition: (id: string, tab?: CompetitionTab) => void;
  onCreateClick?: () => void;
}

export default function CompetitionsDashboard({ 
  onSelectCompetition,
  onCreateClick 
}: CompetitionsDashboardProps) {
  const { 
    filters, 
    viewMode,
    isCreateModalOpen,
    openCreateModal 
  } = useCompetitionsContext();
  
  const { isWizardOpen, openWizard, closeWizard } = useCompetitionV2Context();
  
  const [page, setPage] = useState(1);
  const limit = 12;

  // Buscar competições
  const { data, isLoading, error } = useCompetitions({
    page,
    limit,
    name: filters.search,
    kind: filters.kind,
  });

  const competitions = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <AppSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                      rounded-lg p-4 text-red-700 dark:text-red-400">
          <p className="font-medium">Erro ao carregar competições</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (competitions.length === 0 && !filters.search && !filters.kind) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma competição cadastrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
            Crie sua primeira competição para começar a organizar seus torneios e campeonatos.
          </p>
          
          {/* Botões de criação */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Botão IA - Destacado */}
            <button
              onClick={openWizard}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 
                       bg-gradient-to-r from-amber-500 to-orange-500 
                       hover:from-amber-600 hover:to-orange-600 
                       text-white font-medium rounded-lg 
                       transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              Importar com IA
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/20 rounded">NOVO</span>
            </button>
            
            {/* Botão Manual */}
            <button
              onClick={onCreateClick || openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 
                       bg-white dark:bg-gray-800 
                       border border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 font-medium rounded-lg 
                       transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Plus className="w-5 h-5" />
              Criar manualmente
            </button>
          </div>
        </div>

        {/* Modal de criação */}
        <CreateCompetitionModal />
        
        {/* Wizard de criação com IA */}
        <CreateCompetitionWizard 
          isOpen={isWizardOpen}
          onClose={closeWizard}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filter bar */}
      <CompetitionsFilterBar />

      {/* Empty search results */}
      {competitions.length === 0 && (filters.search || filters.kind) && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma competição encontrada com os filtros selecionados.
          </p>
        </div>
      )}

      {/* Competitions grid */}
      {viewMode === 'cards' && competitions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {competitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              onClick={() => onSelectCompetition(competition.id)}
            />
          ))}
        </div>
      )}

      {/* Competitions table */}
      {viewMode === 'table' && competitions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
                      dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 
                             dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {competitions.map((competition) => (
                <tr 
                  key={competition.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => onSelectCompetition(competition.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {competition.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 
                               dark:text-gray-400">
                    {competition.kind === 'official' ? 'Oficial' :
                     competition.kind === 'friendly' ? 'Amistoso' :
                     competition.kind || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 
                               dark:text-gray-400">
                    {new Date(competition.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCompetition(competition.id);
                      }}
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 
                      dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} competições
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 
                       text-sm disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 
                       text-sm disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Modal de criação */}
      <CreateCompetitionModal />
      
      {/* Wizard de criação com IA */}
      <CreateCompetitionWizard 
        isOpen={isWizardOpen}
        onClose={closeWizard}
      />
    </div>
  );
}
