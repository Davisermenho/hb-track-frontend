"use client"

import { useState } from 'react'

export default function AdminUsersPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'coordenador',
    birthDate: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Cookie HttpOnly enviado automaticamente via credentials: 'include'
      const jsonHeaders: HeadersInit = { "Content-Type": "application/json" }
      // Criar pessoa primeiro
      const personResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/persons`, {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify({
          full_name: formData.fullName,
          birth_date: formData.birthDate || null,
        }),
      })

      if (!personResponse.ok) {
        throw new Error('Erro ao criar pessoa')
      }

      const person = await personResponse.json()

      // Criar usuário
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify({
          person_id: person.id,
          email: formData.email,
          full_name: formData.fullName,
          password: formData.password,
          role: formData.role,
        }),
      })

      if (!userResponse.ok) {
        const error = await userResponse.json()
        throw new Error(error.detail || 'Erro ao criar usuário')
      }

      setMessage({ type: 'success', text: `Usuário ${formData.email} cadastrado com sucesso!` })

      // Limpar formulário
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'coordenador',
        birthDate: '',
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao cadastrar usuário' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Cadastrar Novo Usuário
      </h1>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        {/* Papel */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Papel *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="dirigente">Dirigente</option>
            <option value="coordenador">Coordenador</option>
            <option value="treinador">Treinador</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            RF1: Dirigente cria Coordenador • Coordenador cria Treinador • Treinador cria Atleta
          </p>
        </div>

        {/* Nome Completo */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Nome completo do usuário"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="email@exemplo.com"
            required
          />
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Senha *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
        </div>

        {/* Data de Nascimento */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Data de Nascimento
          </label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
        </button>
      </form>

      {/* Info */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <strong>Regras (RF1):</strong> Super Admin pode criar todos os tipos.
          Dirigente cria Coordenador • Coordenador cria Treinador • Treinador cria Atleta.
        </p>
      </div>
    </div>
  )
}
