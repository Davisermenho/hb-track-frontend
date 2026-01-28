"use client"

import { useState } from 'react'

interface SeasonFormData {
  year: number
  name: string
  startsAt: string
  endsAt: string
  isActive: boolean
}

export default function AdminSeasonsPage() {
  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState<SeasonFormData>({
    year: currentYear,
    name: `Temporada ${currentYear}`,
    startsAt: `${currentYear}-01-01`,
    endsAt: `${currentYear}-12-31`,
    isActive: true,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Cookie HttpOnly enviado automaticamente via credentials: 'include'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          year: formData.year,
          name: formData.name,
          start_date: formData.startsAt,
          end_date: formData.endsAt,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorDetail = typeof error.detail === 'object' 
          ? error.detail.message || JSON.stringify(error.detail)
          : error.detail
        throw new Error(errorDetail || `Erro ao criar temporada (${response.status})`)
      }

      const data = await response.json()
      setMessage({ type: 'success', text: `Temporada ${data.name} criada com sucesso!` })

      // Reset para próximo ano
      const nextYear = formData.year + 1
      setFormData({
        year: nextYear,
        name: `Temporada ${nextYear}`,
        startsAt: `${nextYear}-01-01`,
        endsAt: `${nextYear}-12-31`,
        isActive: false,
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro desconhecido' })
    } finally {
      setLoading(false)
    }
  }

  const handleYearChange = (newYear: number) => {
    setFormData({
      ...formData,
      year: newYear,
      name: `Temporada ${newYear}`,
      startsAt: `${newYear}-01-01`,
      endsAt: `${newYear}-12-31`,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Criar Nova Temporada
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Temporadas organizam equipes, atletas e eventos por ano esportivo
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ano da Temporada
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              min={2020}
              max={2050}
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ano único para cada temporada
            </p>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Temporada
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              placeholder="Temporada 2025"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Término
              </label>
              <input
                type="date"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Marcar como temporada ativa
            </label>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4 ml-8">
            Apenas uma temporada pode estar ativa por vez
          </p>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Temporada'}
            </button>
            <button
              type="button"
              onClick={() => {
                const nextYear = currentYear
                setFormData({
                  year: nextYear,
                  name: `Temporada ${nextYear}`,
                  startsAt: `${nextYear}-01-01`,
                  endsAt: `${nextYear}-12-31`,
                  isActive: true,
                })
                setMessage(null)
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Resetar
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          Regras de Temporadas (RF4, RF5)
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Dirigentes, Coordenadores e Treinadores podem criar temporadas (RF4)</li>
          <li>Temporadas futuras podem ser criadas</li>
          <li>Encerramento automático ao fim do período (RF5)</li>
          <li>Cada ano deve ter uma temporada única</li>
        </ul>
      </div>
    </div>
  )
}
