'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CoachProfileFormProps {
  initialData: {
    fullName: string
    email: string
  }
  onBack: () => void
  onSubmit: (data: CoachFormData) => Promise<void>
  isSubmitting: boolean
  error: string | null
}

export interface CoachFormData {
  full_name: string
  phone: string
  birth_date: string
  gender: string
  // Campos específicos de treinador
  certifications: string
  specialization: string
}

export default function CoachProfileForm({
  initialData,
  onBack,
  onSubmit,
  isSubmitting,
  error
}: CoachProfileFormProps) {
  const [fullName, setFullName] = useState(initialData.fullName)
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [certifications, setCertifications] = useState('')
  const [specialization, setSpecialization] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await onSubmit({
      full_name: fullName.trim(),
      phone: phone || '',
      birth_date: birthDate || '',
      gender: gender || '',
      certifications: certifications || '',
      specialization: specialization || '',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
          Complete seu perfil como <span className="font-semibold">Treinador</span>.
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

      {/* Campos específicos de treinador */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Informações Profissionais
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Certificações
            </label>
            <textarea
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
              placeholder="Ex: CBHb Nível 1, CBHb Nível 2, Curso de Goleiros..."
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-1">
              Liste suas certificações e cursos na área de handebol
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Especialização
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
            >
              <option value="">Selecione</option>
              <option value="treinador_principal">Treinador Principal</option>
              <option value="auxiliar_tecnico">Auxiliar Técnico</option>
              <option value="preparador_fisico">Preparador Físico</option>
              <option value="treinador_goleiros">Treinador de Goleiros</option>
              <option value="analista_desempenho">Analista de Desempenho</option>
              <option value="outro">Outro</option>
            </select>
          </div>
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
