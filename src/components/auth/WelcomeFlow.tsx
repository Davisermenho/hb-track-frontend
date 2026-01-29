'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Lock, User, Loader2 } from 'lucide-react'
import AthleteProfileForm, { type AthleteFormData } from './forms/AthleteProfileForm'
import CoachProfileForm, { type CoachFormData } from './forms/CoachProfileForm'
import CoordinatorProfileForm, { type CoordinatorFormData } from './forms/CoordinatorProfileForm'
import GenericProfileForm, { type GenericFormData } from './forms/GenericProfileForm'

// API URL para chamadas ao backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface WelcomeFlowProps {
  token: string
}

interface WelcomeInfo {
  valid: boolean
  email: string
  full_name?: string
  role: string
  invitee_kind: string
  team_name?: string
  organization_name?: string
  expires_at: string
}

type Step = 'loading' | 'error' | 'password' | 'profile' | 'success'

export default function WelcomeFlow({ token }: WelcomeFlowProps) {
  const router = useRouter()
  
  // Estados
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)
  
  // Form fields - Step 1 (Senha)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const verification = useQuery<WelcomeInfo, Error & { code?: string }>({
    queryKey: ['welcome-verify', token],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch(`${API_URL}/auth/welcome/verify?token=${token}`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        const err = new Error(data.detail?.message || 'Token inválido') as Error & { code?: string }
        err.code = data.detail?.code || 'UNKNOWN'
        throw err
      }

      return data
    },
  })

  const welcomeInfo = verification.data ?? null
  const verificationError = verification.error as (Error & { code?: string }) | null
  const verificationErrorCode = verificationError?.code || 'UNKNOWN'
  const verificationErrorMessage = verificationError?.message || 'Token inválido'

  const effectiveStep: Step =
    step === 'loading'
      ? verification.isError
        ? 'error'
        : verification.isSuccess
          ? 'password'
          : 'loading'
      : step

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validações
    if (password.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres')
      return
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não conferem')
      return
    }
    
    // Avançar para step 2
    setStep('profile')
  }

  const handleProfileSubmit = async (data: AthleteFormData | CoachFormData | CoordinatorFormData | GenericFormData) => {
    setError(null)
    setIsSubmitting(true)
    
    // Validação
    if (!data.full_name.trim() || data.full_name.trim().length < 2) {
      setError('Nome completo é obrigatório')
      setIsSubmitting(false)
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/welcome/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          password,
          confirm_password: confirmPassword,
          ...data,
        }),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        setError(responseData.detail?.message || 'Erro ao completar cadastro')
        setIsSubmitting(false)
        return
      }
      
      // Sucesso!
      setStep('success')
      
      // Redirecionar após 2 segundos
      // Todos redirecionam para /inicio
      setTimeout(() => {
        router.replace('/inicio')
        router.refresh()
      }, 2000)
      
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  // ============================================================================
  // Render: Loading
  // ============================================================================
  if (effectiveStep === 'loading') {
    return (
      <div data-testid="welcome-loading" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Verificando convite...</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // Render: Error
  // ============================================================================
  if (effectiveStep === 'error') {
    const displayError = step === 'loading' ? verificationErrorMessage : (error || 'Este link de convite não é válido.')
    return (
      <div data-testid="welcome-error" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 data-testid="welcome-error-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {verificationErrorCode === 'TOKEN_EXPIRED' ? 'Convite Expirado' : 
             verificationErrorCode === 'TOKEN_USED' ? 'Convite Já Utilizado' : 
             'Convite Inválido'}
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            {displayError}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/signin')}
              className="w-full px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              Ir para Login
            </button>
            
            {verificationErrorCode === 'TOKEN_EXPIRED' && (
              <p className="text-sm text-slate-500">
                Entre em contato com quem enviou o convite para solicitar um novo.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // Render: Success
  // ============================================================================
  if (effectiveStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Bem-vindo(a)! 🎉
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Seu cadastro foi completado com sucesso.
          </p>
          
          <p className="text-sm text-slate-500">
            Redirecionando...
          </p>
          
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mt-4" />
        </div>
      </div>
    )
  }

  // ============================================================================
  // Render: Steps (Password & Profile)
  // ============================================================================
  const currentStep = effectiveStep === 'password' ? 1 : 2

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Complete seu cadastro
          </h1>
          {welcomeInfo && (
            <p className="text-slate-600 dark:text-slate-400">
              {welcomeInfo.organization_name && (
                <span className="font-medium">{welcomeInfo.organization_name}</span>
              )}
              {welcomeInfo.team_name && (
                <span> • Equipe {welcomeInfo.team_name}</span>
              )}
            </p>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentStep >= 1 
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            <Lock className="w-4 h-4" />
            Senha
          </div>
          
          <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700" />
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentStep >= 2 
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            <User className="w-4 h-4" />
            Perfil
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Password */}
          {effectiveStep === 'password' && (
            <form data-testid="welcome-password-form" onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  Olá, <span className="font-semibold">{welcomeInfo?.email}</span>!
                  <br />
                  Crie uma senha segura para acessar sua conta.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  data-testid="welcome-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                  placeholder="Repita a senha"
                  minLength={8}
                  required
                />
              </div>

              {/* Password Requirements */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Requisitos da senha:
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className={password.length >= 8 ? 'text-emerald-600' : ''}>
                    • Mínimo 8 caracteres {password.length >= 8 && '✓'}
                  </li>
                  <li className={password === confirmPassword && password.length > 0 ? 'text-emerald-600' : ''}>
                    • Senhas devem coincidir {password === confirmPassword && password.length > 0 && '✓'}
                  </li>
                </ul>
              </div>
              
              <button
                type="submit"
                className="w-full px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-all"
              >
                Continuar
              </button>
            </form>
          )}

          {/* Step 2: Profile - Formulário dinâmico baseado em invitee_kind */}
          {effectiveStep === 'profile' && welcomeInfo && (
            <>
              {welcomeInfo.invitee_kind === 'athlete' && (
                <AthleteProfileForm
                  initialData={{
                    fullName: welcomeInfo.full_name || '',
                    email: welcomeInfo.email
                  }}
                  onBack={() => setStep('password')}
                  onSubmit={handleProfileSubmit}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              )}
              
              {welcomeInfo.invitee_kind === 'coach' && (
                <CoachProfileForm
                  initialData={{
                    fullName: welcomeInfo.full_name || '',
                    email: welcomeInfo.email
                  }}
                  onBack={() => setStep('password')}
                  onSubmit={handleProfileSubmit}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              )}
              
              {welcomeInfo.invitee_kind === 'coordinator' && (
                <CoordinatorProfileForm
                  initialData={{
                    fullName: welcomeInfo.full_name || '',
                    email: welcomeInfo.email
                  }}
                  onBack={() => setStep('password')}
                  onSubmit={handleProfileSubmit}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              )}
              
              {(!welcomeInfo.invitee_kind || 
                !['athlete', 'coach', 'coordinator'].includes(welcomeInfo.invitee_kind)) && (
                <GenericProfileForm
                  initialData={{
                    fullName: welcomeInfo.full_name || '',
                    email: welcomeInfo.email
                  }}
                  role={welcomeInfo.role}
                  onBack={() => setStep('password')}
                  onSubmit={handleProfileSubmit}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Ao continuar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  )
}
