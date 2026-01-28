'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setPasswordAction } from '@/lib/auth/actions'

interface SetPasswordFormProps {
  token: string
}

export default function SetPasswordForm({ token }: SetPasswordFormProps) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios')
      return
    }

    if (newPassword.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Senha e confirmação não coincidem')
      return
    }

    setLoading(true)

    const result = await setPasswordAction(token, newPassword)

    if (result.success) {
      // Backend já setou os cookies HttpOnly - redirecionar direto para /inicio
      // Não precisa de login manual!
      router.replace(result.redirect_to || '/inicio')
      router.refresh() // Força AuthContext a reconhecer a sessão
    } else {
      setError(result.error || 'Erro ao definir senha')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Definir Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Escolha uma senha segura para sua conta
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha *
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Digite sua nova senha (mín. 8 caracteres)"
                minLength={8}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha *
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirme sua nova senha"
                minLength={8}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Definindo senha...' : 'Definir Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
