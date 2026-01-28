'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { AthleteFormStepProps } from '../../../types/athlete-form';

// Helpers para formatação
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

const formatRG = (value: string): string => {
  // Formato básico de RG: XX.XXX.XXX-X
  const cleaned = value.replace(/[^\dXx]/g, '').slice(0, 9);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
};

export default function AthleteFormStep2({ data, onChange, errors }: AthleteFormStepProps) {
  const handleCPFChange = (value: string) => {
    onChange('athlete_cpf', formatCPF(value));
  };

  const handleRGChange = (value: string) => {
    onChange('athlete_rg', formatRG(value));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <FileText className="w-5 h-5 text-pink-600" />
        <span>Documentos</span>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Os documentos são importantes para identificação oficial em competições e federações.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CPF
          </label>
          <input
            type="text"
            value={data.athlete_cpf || ''}
            onChange={(e) => handleCPFChange(e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
              errors.athlete_cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.athlete_cpf && (
            <p className="text-sm text-red-500 mt-1">{errors.athlete_cpf}</p>
          )}
        </div>

        {/* RG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            RG
          </label>
          <input
            type="text"
            value={data.athlete_rg || ''}
            onChange={(e) => handleRGChange(e.target.value)}
            placeholder="00.000.000-0"
            maxLength={12}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
              errors.athlete_rg ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.athlete_rg && (
            <p className="text-sm text-red-500 mt-1">{errors.athlete_rg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
