'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initialSetupAction } from '@/lib/auth/actions'

interface InitialSetupWizardProps {
  onComplete?: () => void
}

export default function InitialSetupWizard({ onComplete }: InitialSetupWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<'org' | 'season'>('org')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados da organização
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState<'club' | 'federation' | 'association'>('club')
  const [orgAddress, setOrgAddress] = useState('')
  const [orgPhone, setOrgPhone] = useState('')

  // Dados da temporada
  const [seasonName, setSeasonName] = useState('')
  const [seasonStartDate, setSeasonStartDate] = useState('')
  const [seasonEndDate, setSeasonEndDate] = useState('')

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) {
      setError('Nome da organização é obrigatório')
      return
    }
    setError(null)
    setStep('season')
  }

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!seasonName.trim() || !seasonStartDate || !seasonEndDate) {
      setError('Todos os campos da temporada são obrigatórios')
      return
    }

    if (new Date(seasonStartDate) >= new Date(seasonEndDate)) {
      setError('Data de início deve ser anterior à data de término')
      return
    }

    setLoading(true)
    setError(null)

    const result = await initialSetupAction({
      org_name: orgName,
      org_type: orgType,
      org_address: orgAddress || undefined,
      org_phone: orgPhone || undefined,
      season_name: seasonName,
      season_start_date: seasonStartDate,
      season_end_date: seasonEndDate,
    })

    if (result.success) {
      if (onComplete) {
        onComplete()
      } else {
        router.push('/inicio')
      }
      router.refresh()
    } else {
      setError(result.error || 'Erro ao realizar configuração inicial')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configuração Inicial
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'org' 
              ? 'Configure sua organização' 
              : 'Configure a temporada inicial'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2">
          <div className={`h-2 w-16 rounded ${step === 'org' ? 'bg-blue-600' : 'bg-blue-400'}`} />
          <div className={`h-2 w-16 rounded ${step === 'season' ? 'bg-blue-600' : 'bg-gray-300'}`} />
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

        {/* Step 1: Organização */}
        {step === 'org' && (
          <form onSubmit={handleOrgSubmit} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Organização *
                </label>
                <input
                  id="org-name"
                  name="org-name"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Clube de Handebol ABC"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="org-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Organização *
                </label>
                <select
                  id="org-type"
                  name="org-type"
                  required
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as any)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="club">Clube</option>
                  <option value="federation">Federação</option>
                  <option value="association">Associação</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="org-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço (opcional)
                </label>
                <input
                  id="org-address"
                  name="org-address"
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="org-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (opcional)
                </label>
                <input
                  id="org-phone"
                  name="org-phone"
                  type="tel"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Próximo: Configurar Temporada
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Temporada */}
        {step === 'season' && (
          <form onSubmit={handleSeasonSubmit} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="season-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Temporada *
                </label>
                <input
                  id="season-name"
                  name="season-name"
                  type="text"
                  required
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Temporada 2024"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="season-start" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Início *
                </label>
                <input
                  id="season-start"
                  name="season-start"
                  type="date"
                  required
                  value={seasonStartDate}
                  onChange={(e) => setSeasonStartDate(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="season-end" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Término *
                </label>
                <input
                  id="season-end"
                  name="season-end"
                  type="date"
                  required
                  value={seasonEndDate}
                  onChange={(e) => setSeasonEndDate(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep('org')}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? 'Configurando...' : 'Finalizar Configuração'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
