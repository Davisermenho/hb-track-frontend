'use client';

import React from 'react';
import { Phone, Mail, Users } from 'lucide-react';
import { AthleteFormStepProps } from '../../../types/athlete-form';

// Helper para formatação de telefone
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

export default function AthleteFormStep3({ data, onChange, errors }: AthleteFormStepProps) {
  const handlePhoneChange = (field: 'phone' | 'guardian_phone', value: string) => {
    onChange(field, formatPhone(value));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <Phone className="w-5 h-5 text-pink-600" />
        <span>Contatos</span>
      </div>

      {/* Contatos da Atleta */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Contatos da Atleta
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Telefone / WhatsApp
              </span>
            </label>
            <input
              type="text"
              value={data.phone || ''}
              onChange={(e) => handlePhoneChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email de Contato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                E-mail de Contato
              </span>
            </label>
            <input
              type="email"
              value={data.email_contact || ''}
              onChange={(e) => onChange('email_contact', e.target.value)}
              placeholder="atleta@exemplo.com"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.email_contact ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.email_contact && (
              <p className="text-sm text-red-500 mt-1">{errors.email_contact}</p>
            )}
          </div>
        </div>
      </div>

      {/* Responsável */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4" />
          Responsável Legal (para menores de 18 anos)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome do Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Responsável
            </label>
            <input
              type="text"
              value={data.guardian_name || ''}
              onChange={(e) => onChange('guardian_name', e.target.value)}
              placeholder="Nome completo do responsável"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Telefone do Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone do Responsável
            </label>
            <input
              type="text"
              value={data.guardian_phone || ''}
              onChange={(e) => handlePhoneChange('guardian_phone', e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
