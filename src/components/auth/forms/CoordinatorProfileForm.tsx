'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CoordinatorProfileFormProps {
  initialData: {
    fullName: string
    email: string
  }
  onBack: () => void
  onSubmit: (data: CoordinatorFormData) => Promise<void>
  isSubmitting: boolean
  error: string | null
}

export interface CoordinatorFormData {
  full_name: string
  phone: string
  birth_date: string
  gender: string
  // Campos específicos de coordenador
  area_of_expertise: string
}

export default function CoordinatorProfileForm({
  initialData,
  onBack,
  onSubmit,
  isSubmitting,
  error
}: CoordinatorProfileFormProps) {
  const [fullName, setFullName] = useState(initialData.fullName)
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [areaOfExpertise, setAreaOfExpertise] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await onSubmit({
      full_name: fullName.trim(),
      phone: phone || '',
      birth_date: birthDate || '',
      gender: gender || '',
      area_of_expertise: areaOfExpertise || '',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
          Complete seu perfil como <span className="font-semibold">Coordenador</span>.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Campos básicos */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Nome Completo *
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
          placeholder="Seu nome completo"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Telefone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
          placeholder="(00) 00000-0000"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Data de Nascimento
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Gênero
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
          >
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
        </div>
      </div>

      {/* Campos específicos de coordenador */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Informações de Coordenação
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Área de Atuação
          </label>
          <select
            value={areaOfExpertise}
            onChange={(e) => setAreaOfExpertise(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
          >
            <option value="">Selecione</option>
            <option value="coordenacao_tecnica">Coordenação Técnica</option>
            <option value="coordenacao_categorias">Coordenação de Categorias</option>
            <option value="coordenacao_administrativa">Coordenação Administrativa</option>
            <option value="coordenacao_esportiva">Coordenação Esportiva</option>
            <option value="coordenacao_metodologica">Coordenação Metodológica</option>
            <option value="coordenacao_base">Coordenação de Base</option>
            <option value="outro">Outro</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Selecione a área principal de coordenação
          </p>
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          Voltar
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Concluir Cadastro'
          )}
        </button>
      </div>
    </form>
  )
}
