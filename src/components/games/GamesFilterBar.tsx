'use client';

/**
 * GamesFilterBar - Barra de filtros do dashboard de jogos
 * 
 * Permite filtrar jogos por:
 * - Status (Agendado, Finalizado, Cancelado)
 * - Período (data início/fim)
 * - Tipo de jogo (Casa/Fora)
 * - Toggle de view (cards/tabela)
 */

import { useState } from 'react';
import { Filter, LayoutGrid, List, X, Search } from 'lucide-react';
import { useGamesContext, GameFilters, GameViewMode } from '@/context/GamesContext';
import AppTag from '@/components/ui/AppTag';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos', color: 'gray' as const },
  { value: 'Agendado', label: 'Agendados', color: 'blue' as const },
  { value: 'Finalizado', label: 'Finalizados', color: 'green' as const },
  { value: 'Cancelado', label: 'Cancelados', color: 'red' as const },
];

const LOCATION_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'home', label: 'Casa' },
  { value: 'away', label: 'Fora' },
];

export default function GamesFilterBar() {
  const { filters, setFilters, viewMode, setViewMode } = useGamesContext();
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusChange = (status: string) => {
    setFilters({
      ...filters,
      status: status === 'all' ? undefined : status as GameFilters['status'],
    });
  };

  const handleSearchChange = (search: string) => {
    setFilters({
      ...filters,
      search: search || undefined,
    });
  };

  const handleDateFromChange = (date: string) => {
    setFilters({
      ...filters,
      dateFrom: date || undefined,
    });
  };

  const handleDateToChange = (date: string) => {
    setFilters({
      ...filters,
      dateTo: date || undefined,
    });
  };

  const handleLocationChange = (location: string) => {
    setFilters({
      ...filters,
      location: location === 'all' ? undefined : location as 'home' | 'away',
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = filters.status || filters.dateFrom || filters.dateTo || filters.location || filters.search;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Linha principal */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por adversário..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                (filters.status === option.value) || (!filters.status && option.value === 'all')
                  ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Botão de filtros avançados */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                !
              </span>
            )}
          </button>

          {/* Toggle de visualização */}
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('cards')}
              className={`rounded-l-lg p-2 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              title="Visualização em cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-r-lg p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              title="Visualização em tabela"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros avançados (collapsible) */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          {/* Data início */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Data início
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Data fim */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Data fim
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Local */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Local
            </label>
            <select
              value={filters.location || 'all'}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {LOCATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Tags de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Filtros ativos:</span>
          
          {filters.status && (
            <AppTag
              label={STATUS_OPTIONS.find(s => s.value === filters.status)?.label || filters.status}
              color={STATUS_OPTIONS.find(s => s.value === filters.status)?.color || 'gray'}
              onRemove={() => handleStatusChange('all')}
            />
          )}
          
          {filters.dateFrom && (
            <AppTag
              label={`Desde: ${new Date(filters.dateFrom).toLocaleDateString('pt-BR')}`}
              color="gray"
              onRemove={() => handleDateFromChange('')}
            />
          )}
          
          {filters.dateTo && (
            <AppTag
              label={`Até: ${new Date(filters.dateTo).toLocaleDateString('pt-BR')}`}
              color="gray"
              onRemove={() => handleDateToChange('')}
            />
          )}
          
          {filters.location && (
            <AppTag
              label={filters.location === 'home' ? 'Casa' : 'Fora'}
              color="gray"
              onRemove={() => handleLocationChange('all')}
            />
          )}
          
          {filters.search && (
            <AppTag
              label={`Busca: "${filters.search}"`}
              color="gray"
              onRemove={() => handleSearchChange('')}
            />
          )}
        </div>
      )}
    </div>
  );
}
