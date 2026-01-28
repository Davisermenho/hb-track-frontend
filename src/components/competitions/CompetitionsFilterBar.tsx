/**
 * CompetitionsFilterBar - Barra de filtros para lista de competições
 * 
 * Filtros disponíveis:
 * - Busca por nome
 * - Tipo (official, friendly, etc)
 * - Toggle de modo de visualização (cards/tabela)
 */

'use client';

import { useCompetitionsContext } from '@/context/CompetitionsContext';
import { Search, LayoutGrid, Table, X } from 'lucide-react';

const COMPETITION_KINDS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'official', label: 'Oficial' },
  { value: 'friendly', label: 'Amistoso' },
  { value: 'training-game', label: 'Jogo-Treino' },
];

export default function CompetitionsFilterBar() {
  const { 
    filters, 
    updateFilter, 
    clearFilters,
    viewMode, 
    setViewMode 
  } = useCompetitionsContext();

  const hasFilters = filters.search || filters.kind;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Left side - Filters */}
      <div className="flex flex-wrap gap-3 flex-1">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
          />
          <input
            type="text"
            placeholder="Buscar competição..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 
                     dark:border-gray-600 bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-white placeholder-gray-400
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     transition-colors"
          />
        </div>

        {/* Kind filter */}
        <select
          value={filters.kind || ''}
          onChange={(e) => updateFilter('kind', e.target.value || undefined)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-amber-500 focus:border-transparent
                   transition-colors cursor-pointer"
        >
          {COMPETITION_KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                     text-gray-500 dark:text-gray-400 hover:bg-gray-100 
                     dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Limpar</span>
          </button>
        )}
      </div>

      {/* Right side - View mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 
                    rounded-lg p-1">
        <button
          onClick={() => setViewMode('cards')}
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'cards'
              ? 'bg-white dark:bg-gray-600 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          title="Visualização em cards"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'table'
              ? 'bg-white dark:bg-gray-600 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          title="Visualização em tabela"
        >
          <Table className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
