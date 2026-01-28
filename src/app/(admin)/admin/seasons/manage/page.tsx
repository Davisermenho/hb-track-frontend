"use client"

import { useState, useEffect, useCallback } from 'react'

interface Season {
  id: string
  year: number
  name: string
  start_date: string
  end_date: string
  status: string
  is_active: boolean
  canceled_at: string | null
  interrupted_at: string | null
  deleted_at: string | null
  created_at: string
}

export default function ManageSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Season>>({})
  const [actionReason, setActionReason] = useState('')
  const [showReasonModal, setShowReasonModal] = useState<{ type: 'cancel' | 'interrupt', seasonId: string } | null>(null)

  // Cookie HttpOnly enviado automaticamente via credentials: 'include'

  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons?limit=100`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Erro ao carregar temporadas')
      const data = await response.json()
      setSeasons(data.items || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSeasons()
  }, [fetchSeasons])

  const handleEdit = (season: Season) => {
    setEditingId(season.id)
    setEditForm({
      name: season.name,
      year: season.year,
      start_date: season.start_date,
      end_date: season.end_date,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveEdit = async (seasonId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail?.message || error.message || 'Erro ao atualizar')
      }

      setMessage({ type: 'success', text: 'Temporada atualizada com sucesso!' })
      setEditingId(null)
      setEditForm({})
      fetchSeasons()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const handleDelete = async (seasonId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta temporada?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons/${seasonId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok && response.status !== 204) {
        const error = await response.json()
        throw new Error(error.detail?.message || 'Erro ao excluir')
      }

      setMessage({ type: 'success', text: 'Temporada excluída com sucesso!' })
      fetchSeasons()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const handleCancelSeason = async () => {
    if (!showReasonModal || !actionReason.trim()) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons/${showReasonModal.seasonId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: actionReason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail?.message || 'Erro ao cancelar')
      }

      setMessage({ type: 'success', text: 'Temporada cancelada com sucesso!' })
      setShowReasonModal(null)
      setActionReason('')
      fetchSeasons()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const handleInterruptSeason = async () => {
    if (!showReasonModal || !actionReason.trim()) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons/${showReasonModal.seasonId}/interrupt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: actionReason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail?.message || 'Erro ao interromper')
      }

      setMessage({ type: 'success', text: 'Temporada interrompida com sucesso!' })
      setShowReasonModal(null)
      setActionReason('')
      fetchSeasons()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planejada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ativa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      interrompida: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      cancelada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      encerrada: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Temporadas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Edite, cancele ou exclua temporadas existentes
          </p>
        </div>
        <a
          href="/admin/seasons"
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          + Nova Temporada
        </a>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400">Nenhuma temporada encontrada</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {seasons.map((season) => (
                <tr key={season.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {editingId === season.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.year || ''}
                          onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={editForm.start_date || ''}
                            onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                            className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="date"
                            value={editForm.end_date || ''}
                            onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                            className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(season.status)}`}>
                          {season.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleSaveEdit(season.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {season.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {season.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(season.start_date).toLocaleDateString('pt-BR')} - {new Date(season.end_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(season.status)}`}>
                          {season.status}
                        </span>
                        {season.is_active && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-500 text-white">
                            ATIVA
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                        <button
                          onClick={() => handleEdit(season)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          disabled={season.status === 'interrompida'}
                        >
                          Editar
                        </button>
                        {season.status === 'planejada' && (
                          <button
                            onClick={() => setShowReasonModal({ type: 'cancel', seasonId: season.id })}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Cancelar
                          </button>
                        )}
                        {season.status === 'ativa' && (
                          <button
                            onClick={() => setShowReasonModal({ type: 'interrupt', seasonId: season.id })}
                            className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                          >
                            Interromper
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(season.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Excluir
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para motivo de cancelamento/interrupção */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {showReasonModal.type === 'cancel' ? 'Cancelar Temporada' : 'Interromper Temporada'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {showReasonModal.type === 'cancel'
                ? 'Informe o motivo do cancelamento (temporada planejada):'
                : 'Informe o motivo da interrupção (força maior):'}
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              placeholder="Digite o motivo..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowReasonModal(null); setActionReason(''); }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Voltar
              </button>
              <button
                onClick={showReasonModal.type === 'cancel' ? handleCancelSeason : handleInterruptSeason}
                disabled={!actionReason.trim()}
                className={`px-4 py-2 text-white rounded-lg ${
                  showReasonModal.type === 'cancel'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
