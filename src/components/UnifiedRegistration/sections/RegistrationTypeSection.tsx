/**
 * Seção Tipo de Cadastro - Ficha Única
 * 
 * Permite selecionar o tipo de pessoa a ser cadastrada:
 * - Atleta
 * - Treinador
 * - Coordenador
 * - Dirigente
 * 
 * Baseado nas permissões do usuário logado (ROLE_CREATION_PERMISSIONS)
 */

'use client';

import { Users, ClipboardList, Building2, Medal } from 'lucide-react';
import type { RegistrationType } from '../../../types/unified-registration';

interface RegistrationTypeSectionProps {
  value?: RegistrationType;
  availableTypes: RegistrationType[];
  onChange: (type: RegistrationType) => void;
  userRole: string;
}

// Configuração dos tipos de cadastro
const TYPE_CONFIG: Record<RegistrationType, {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = {
  atleta: {
    label: 'Atleta',
    description: 'Pessoa que pratica o esporte',
    icon: Medal,
    color: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
  },
  treinador: {
    label: 'Treinador(a)',
    description: 'Responsável pelo treino das equipes',
    icon: ClipboardList,
    color: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
  },
  coordenador: {
    label: 'Coordenador(a)',
    description: 'Coordena as atividades técnicas',
    icon: Users,
    color: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
  },
  dirigente: {
    label: 'Dirigente',
    description: 'Administrador da organização',
    icon: Building2,
    color: 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400',
  },
};

export default function RegistrationTypeSection({
  value,
  availableTypes,
  onChange,
  userRole,
}: RegistrationTypeSectionProps) {
  if (availableTypes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Você não tem permissão para cadastrar novos usuários.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tipo de Cadastro
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Selecione o tipo de pessoa que você está cadastrando
          {!value && <span className="text-gray-400"> (opcional para salvar apenas dados pessoais)</span>}
        </p>
      </div>
      
      {/* Grid de opções */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableTypes.map((type) => {
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;
            const isSelected = value === type;
            
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange(type)}
                className={`
                  relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {/* Indicador de seleção */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Ícone */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                {/* Label */}
                <span className={`font-medium ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>
                  {config.label}
                </span>
                
                {/* Descrição */}
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {config.description}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Informação sobre permissões */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
          Tipos disponíveis baseados no seu perfil: {userRole}
        </p>
      </div>
    </div>
  );
}
