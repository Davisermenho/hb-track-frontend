/**
 * AgendaHeader
 *
 * Cabeçalho compacto da agenda semanal/mensal:
 * - Titulo + faixa de controles em uma linha
 * - Densidade alta e botao principal escuro
 */

'use client';

import React from 'react';
import { Icons } from '@/design-system/icons';
import type { Team } from '@/lib/api/teams';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AgendaViewMode = 'week' | 'month';

interface AgendaHeaderProps {
  viewMode: AgendaViewMode;
  onViewModeChange: (view: AgendaViewMode) => void;
  rangeLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onClearFilters?: () => void;
  teams: Team[];
  selectedTeam: Team | null;
  teamDropdownOpen?: boolean;
  onToggleTeamDropdown?: () => void;
  onCloseTeamDropdown?: () => void;
  onSelectTeam: (team: Team) => void;
  onCreateSession: () => void;
  onImportLegacy?: () => void;
  createButtonLabel?: string;
}

const focusRingClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2463eb]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111621]';

export function AgendaHeader({
  viewMode,
  onViewModeChange,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearFilters,
  teams,
  selectedTeam,
  onSelectTeam,
  onCreateSession,
  createButtonLabel = 'Novo treino',
}: AgendaHeaderProps) {
  return (
    <div className="mb-3 flex flex-row items-end justify-between gap-4 py-3">
      <div className="flex shrink-0 flex-col">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-white">
          Agenda de treinos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gerencie o cronograma técnico da sua equipe.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-nowrap overflow-visible">
        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm dark:bg-[#1a1f2e] dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            className={`p-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 border-r border-slate-200 dark:border-gray-800 ${focusRingClasses}`}
            aria-label="Semana anterior"
          >
            <Icons.Navigation.Left className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-slate-700 dark:text-gray-200 ${focusRingClasses}`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={onNext}
            className={`p-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 border-l border-slate-200 dark:border-gray-800 ${focusRingClasses}`}
            aria-label="Próxima semana"
          >
            <Icons.Navigation.Right className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
          {rangeLabel}
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 dark:bg-gray-800 dark:border-gray-700 shrink-0">
          <button
            type="button"
            aria-pressed={viewMode === 'week'}
            onClick={() => onViewModeChange('week')}
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${focusRingClasses} ${
              viewMode === 'week'
                ? 'bg-white shadow-sm text-slate-800 dark:bg-gray-100 dark:text-gray-900'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-300 dark:hover:text-gray-100'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'month'}
            onClick={() => onViewModeChange('month')}
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${focusRingClasses} ${
              viewMode === 'month'
                ? 'bg-white shadow-sm text-slate-800 dark:bg-gray-100 dark:text-gray-900'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-300 dark:hover:text-gray-100'
            }`}
          >
            Mês
          </button>
        </div>

        {teams.length > 0 && (
          <Select
            value={selectedTeam?.id ?? ''}
            onValueChange={(value) => {
              const team = teams.find((item) => item.id === value);
              if (team) {
                onSelectTeam(team);
              }
            }}
          >
            <SelectTrigger
              className={`w-[180px] max-w-[180px] truncate bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 dark:bg-[#1a1f2e] dark:border-gray-800 dark:text-gray-200 ${focusRingClasses}`}
              data-testid="training-team-selector"
            >
              <SelectValue placeholder="Selecionar equipe" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
          className="relative shrink-0"
        >
          <Icons.Actions.Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar..."
            className={`pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] w-36 outline-none transition-none dark:bg-[#1a1f2e] dark:border-gray-800 dark:text-gray-100 ${focusRingClasses}`}
          />
        </form>

        <button
          type="button"
          onClick={onCreateSession}
          className={`flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-all shadow-sm shrink-0 uppercase tracking-wider ${focusRingClasses}`}
        >
          <Icons.Actions.Add className="h-3.5 w-3.5" />
          <span>{createButtonLabel}</span>
        </button>
      </div>
    </div>
  );
}
