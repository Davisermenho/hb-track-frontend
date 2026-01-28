'use client';

import React, { useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { AthleteFormStepProps } from '../../../types/athlete-form';

// Helper para formatação de CEP
const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
};

// Estados brasileiros
const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export default function AthleteFormStep4({ data, onChange, errors }: AthleteFormStepProps) {
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    onChange('zip_code', formatted);
    setCepError(null);
  };

  const searchCEP = async () => {
    const cep = data.zip_code?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setLoadingCEP(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const result = await response.json();

      if (result.erro) {
        setCepError('CEP não encontrado');
        return;
      }

      onChange('street', result.logradouro || '');
      onChange('neighborhood', result.bairro || '');
      onChange('city', result.localidade || '');
      onChange('state_address', result.uf || '');
    } catch (err) {
      setCepError('Erro ao buscar CEP');
    } finally {
      setLoadingCEP(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <MapPin className="w-5 h-5 text-pink-600" />
        <span>Endereço</span>
      </div>

      {/* CEP com busca automática */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CEP
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={data.zip_code || ''}
              onChange={(e) => handleCEPChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={`flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                cepError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <button
              type="button"
              onClick={searchCEP}
              disabled={loadingCEP}
              className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              {loadingCEP ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
          {cepError && (
            <p className="text-sm text-red-500 mt-1">{cepError}</p>
          )}
        </div>
      </div>

      {/* Logradouro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Logradouro
          </label>
          <input
            type="text"
            value={data.street || ''}
            onChange={(e) => onChange('street', e.target.value)}
            placeholder="Rua, Avenida, etc."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número
          </label>
          <input
            type="text"
            value={data.address_number || ''}
            onChange={(e) => onChange('address_number', e.target.value)}
            placeholder="Nº"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Complemento e Bairro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Complemento
          </label>
          <input
            type="text"
            value={data.address_complement || ''}
            onChange={(e) => onChange('address_complement', e.target.value)}
            placeholder="Apto, Bloco, etc."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bairro
          </label>
          <input
            type="text"
            value={data.neighborhood || ''}
            onChange={(e) => onChange('neighborhood', e.target.value)}
            placeholder="Bairro"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cidade
          </label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Cidade"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={data.state_address || ''}
            onChange={(e) => onChange('state_address', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Selecione</option>
            {BRAZILIAN_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
