'use client'

import { useState } from 'react'
import { changePasswordAction } from '@/lib/auth/actions'

interface ChangePasswordFormProps {
  onSuccess?: () => void
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios')
      return
    }

    if (newPassword.length < 8) {
      setError('Nova senha deve ter no mínimo 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Nova senha e confirmação não coincidem')
      return
    }

    if (currentPassword === newPassword) {
      setError('Nova senha deve ser diferente da atual')
      return
    }

    setLoading(true)

    const result = await changePasswordAction(currentPassword, newPassword)

    if (result.success) {
      setSuccess(result.message || 'Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000)
      }
    } else {
      setError(result.error || 'Erro ao alterar senha')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Alterar Senha</h2>
        <p className="mt-1 text-sm text-gray-600">
          Use uma senha forte com no mínimo 8 caracteres
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

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha Atual *
          </label>
          <input
            id="current-password"
            name="current-password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Digite sua senha atual"
          />
        </div>

        <div>
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
            placeholder="Digite a nova senha (mín. 8 caracteres)"
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Nova Senha *
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Confirme a nova senha"
            minLength={8}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </form>
    </div>
  )
}
