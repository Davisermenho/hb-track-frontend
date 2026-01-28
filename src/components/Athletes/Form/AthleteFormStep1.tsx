'use client';

import React from 'react';
import { User, Calendar, Globe } from 'lucide-react';
import { AthleteFormStepProps } from '../../../types/athlete-form';

export default function AthleteFormStep1({ data, onChange, errors }: AthleteFormStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <User className="w-5 h-5 text-pink-600" />
        <span>Dados Pessoais</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primeiro Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Primeiro Nome *
          </label>
          <input
            type="text"
            value={data.first_name}
            onChange={(e) => onChange('first_name', e.target.value)}
            placeholder="Ex: Maria"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
              errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.first_name && (
            <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
          )}
        </div>

        {/* Sobrenome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sobrenome *
          </label>
          <input
            type="text"
            value={data.last_name}
            onChange={(e) => onChange('last_name', e.target.value)}
            placeholder="Ex: Silva Santos"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
              errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.last_name && (
            <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data de Nascimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Data de Nascimento *
            </span>
          </label>
          <input
            type="date"
            value={data.birth_date}
            onChange={(e) => onChange('birth_date', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
              errors.birth_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.birth_date && (
            <p className="text-sm text-red-500 mt-1">{errors.birth_date}</p>
          )}
          {data.birth_date && (
            <p className="text-xs text-gray-500 mt-1">
              Idade: {new Date().getFullYear() - new Date(data.birth_date).getFullYear()} anos
            </p>
          )}
        </div>

        {/* Gênero */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gênero
          </label>
          <select
            value={data.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="outro">Outro</option>
            <option value="prefiro_nao_dizer">Prefiro não dizer</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apelido Esportivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Apelido Esportivo
          </label>
          <input
            type="text"
            value={data.athlete_nickname || ''}
            onChange={(e) => onChange('athlete_nickname', e.target.value)}
            placeholder="Ex: Má, Dani, Rô"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nome usado em súmulas e durante os jogos
          </p>
        </div>

        {/* Nacionalidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              Nacionalidade
            </span>
          </label>
          <input
            type="text"
            value={data.nationality}
            onChange={(e) => onChange('nationality', e.target.value)}
            placeholder="Ex: brasileira"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
