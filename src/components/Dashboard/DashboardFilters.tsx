'use client'

import { useState } from 'react'

interface DashboardFiltersProps {
  organizationName?: string
  onFilterChange?: (filters: { seasonId?: string; teamId?: string; period?: string }) => void
}

export default function DashboardFilters({ organizationName = "HB Club", onFilterChange }: DashboardFiltersProps) {
  const [seasonId, setSeasonId] = useState<string>('')
  const [teamId, setTeamId] = useState<string>('')
  const [period, setPeriod] = useState<string>('4weeks')

  const handleSeasonChange = (value: string) => {
    setSeasonId(value)
    onFilterChange?.({ seasonId: value, teamId, period })
  }

  const handleTeamChange = (value: string) => {
    setTeamId(value)
    onFilterChange?.({ seasonId, teamId: value, period })
  }

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    onFilterChange?.({ seasonId, teamId, period: value })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {organizationName}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Temporada
          </label>
          <select
            value={seasonId}
            onChange={(e) => handleSeasonChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">2024/2025</option>
            {/* TODO: Popular com temporadas do banco */}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Equipe
          </label>
          <select
            value={teamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Sub-16 Feminino</option>
            {/* TODO: Popular com equipes do usuário */}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Período
          </label>
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="1week">Última semana</option>
            <option value="2weeks">Últimas 2 semanas</option>
            <option value="4weeks">Últimas 4 semanas</option>
            <option value="month">Mês atual</option>
            <option value="season">Temporada completa</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Todos os dados abaixo refletem os filtros selecionados</span>
      </div>
    </div>
  )
}
