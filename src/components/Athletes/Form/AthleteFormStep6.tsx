'use client';

import React, { useState } from 'react';
import { Shield, Info, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { AthleteFormStepProps, ATHLETE_VALIDATION } from '../../../types/athlete-form';

export default function AthleteFormStep6({ data, onChange, errors }: AthleteFormStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <Shield className="w-5 h-5 text-pink-600" />
        <span>Acesso ao Sistema</span>
      </div>

      {/* Alerta R2 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            R2: Criação de usuário é opcional para atletas
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Atletas podem existir no sistema sem ter acesso de login. Você pode criar o acesso agora ou depois.
          </p>
        </div>
      </div>

      {/* Checkbox - Criar acesso */}
      <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
           onClick={() => onChange('create_user', !data.create_user)}>
        <input
          type="checkbox"
          checked={data.create_user}
          onChange={(e) => onChange('create_user', e.target.checked)}
          className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
        />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            Criar acesso ao sistema para esta atleta
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A atleta poderá fazer login e acessar seu perfil, estatísticas e agenda
          </p>
        </div>
      </div>

      {/* Formulário de acesso - Condicional */}
      {data.create_user && (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Dados de Acesso
          </h4>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                E-mail de Login *
              </span>
            </label>
            <input
              type="email"
              value={data.user_email || ''}
              onChange={(e) => onChange('user_email', e.target.value)}
              placeholder="atleta@exemplo.com"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.user_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.user_email && (
              <p className="text-sm text-red-500 mt-1">{errors.user_email}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Este será o login da atleta no sistema
            </p>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Senha *
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password || ''}
                onChange={(e) => onChange('password', e.target.value)}
                placeholder={`Mínimo ${ATHLETE_VALIDATION.MIN_PASSWORD_LENGTH} caracteres`}
                className={`w-full px-4 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Confirmar Senha *
              </span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={data.password_confirmation || ''}
                onChange={(e) => onChange('password_confirmation', e.target.value)}
                placeholder="Repita a senha"
                className={`w-full px-4 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.password_confirmation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-sm text-red-500 mt-1">{errors.password_confirmation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
