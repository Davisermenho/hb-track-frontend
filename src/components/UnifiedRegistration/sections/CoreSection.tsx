/**
 * Seção Núcleo Obrigatório - Ficha Única
 * 
 * Campos sempre visíveis:
 * - Nome completo (obrigatório)
 * - Data de nascimento (obrigatório)
 * - Gênero (obrigatório)
 * - Email (opcional - se preenchido, cria usuário)
 */

'use client';

import { User, Calendar, Mail } from 'lucide-react';
import CollapsibleSection from '@/components/form/CollapsibleSection';
import type { Gender } from '../../../types/unified-registration';

interface CoreData {
  full_name: string;
  birth_date: string;
  gender?: Gender;
  email?: string;
}

interface CoreSectionProps {
  data: CoreData;
  errors: Record<string, string>;
  touched: Set<string>;
  onFieldChange: (field: keyof CoreData, value: string | Gender | undefined) => void;
  onBlur: (field: keyof CoreData) => void;
}

export default function CoreSection({
  data,
  errors,
  touched,
  onFieldChange,
  onBlur,
}: CoreSectionProps) {
  const showError = (field: keyof CoreData) => {
    return touched.has(`core.${field}`) && errors[`core.${field}`];
  };
  
  return (
    <CollapsibleSection
      title="Dados Pessoais"
      required
      defaultOpen={true}
    >
      <div className="space-y-4">
        {/* Nome Completo */}
        <div>
          <label 
            htmlFor="full_name" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Nome Completo <span className="text-error-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="full_name"
              value={data.full_name}
              onChange={(e) => onFieldChange('full_name', e.target.value)}
              onBlur={() => onBlur('full_name')}
              placeholder="Nome e sobrenome"
              className={`
                w-full h-11 pl-10 pr-4 rounded-lg border text-sm
                placeholder:text-gray-400 focus:outline-none focus:ring-3
                dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
                ${showError('full_name')
                  ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10'
                  : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10'
                }
              `}
            />
          </div>
          {showError('full_name') && (
            <p className="mt-1.5 text-xs text-error-500">{errors['core.full_name']}</p>
          )}
        </div>
        
        {/* Data de Nascimento e Gênero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data de Nascimento */}
          <div>
            <label 
              htmlFor="birth_date" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Data de Nascimento <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="birth_date"
                value={data.birth_date}
                onChange={(e) => onFieldChange('birth_date', e.target.value)}
                onBlur={() => onBlur('birth_date')}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 8)).toISOString().split('T')[0]}
                min={new Date(new Date().setFullYear(new Date().getFullYear() - 70)).toISOString().split('T')[0]}
                className={`
                  w-full h-11 pl-10 pr-4 rounded-lg border text-sm
                  focus:outline-none focus:ring-3
                  dark:bg-gray-900 dark:text-white
                  ${showError('birth_date')
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10'
                    : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10'
                  }
                `}
              />
            </div>
            {showError('birth_date') && (
              <p className="mt-1.5 text-xs text-error-500">{errors['core.birth_date']}</p>
            )}
          </div>
          
          {/* Gênero */}
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Gênero <span className="text-error-500">*</span>
            </label>
            <div className="flex gap-4 h-11 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="feminino"
                  checked={data.gender === 'feminino'}
                  onChange={(e) => onFieldChange('gender', e.target.value as Gender)}
                  onBlur={() => onBlur('gender')}
                  className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Feminino</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="masculino"
                  checked={data.gender === 'masculino'}
                  onChange={(e) => onFieldChange('gender', e.target.value as Gender)}
                  onBlur={() => onBlur('gender')}
                  className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Masculino</span>
              </label>
            </div>
            {showError('gender') && (
              <p className="mt-1.5 text-xs text-error-500">{errors['core.gender']}</p>
            )}
          </div>
        </div>
        
        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Email
            <span className="ml-2 text-xs text-gray-500 font-normal">
              (preencha para criar acesso ao sistema)
            </span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              value={data.email || ''}
              onChange={(e) => onFieldChange('email', e.target.value || undefined)}
              onBlur={() => onBlur('email')}
              placeholder="email@exemplo.com"
              className={`
                w-full h-11 pl-10 pr-4 rounded-lg border text-sm
                placeholder:text-gray-400 focus:outline-none focus:ring-3
                dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
                ${showError('email')
                  ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10'
                  : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10'
                }
              `}
            />
          </div>
          {showError('email') && (
            <p className="mt-1.5 text-xs text-error-500">{errors['core.email']}</p>
          )}
          {data.email && !showError('email') && (
            <p className="mt-1.5 text-xs text-brand-500">
              ✓ Um usuário será criado e receberá email de boas-vindas
            </p>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
