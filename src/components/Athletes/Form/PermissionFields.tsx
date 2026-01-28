/**
 * Permission-aware Form Field Component
 * 
 * FASE 6.4: Integração de permissões nos formulários
 * 
 * Componente de campo de formulário que respeita as permissões do atleta
 */

import React from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';

interface PermissionFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number';
  placeholder?: string;
  disabled?: boolean;
  blockedReason?: string | null;
  requiresJustification?: boolean;
  className?: string;
}

/**
 * Campo de formulário com suporte a permissões e tooltips
 */
export function PermissionField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  blockedReason,
  requiresJustification = false,
  className = '',
}: PermissionFieldProps) {
  const isBlocked = disabled || !!blockedReason;
  
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Label>{label}</Label>
        
        {/* Indicador de campo que requer justificativa */}
        {requiresJustification && !isBlocked && (
          <span 
            className="inline-flex items-center justify-center w-4 h-4 text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-full"
            title="Alteração requer justificativa"
          >
            !
          </span>
        )}
        
        {/* Indicador de campo bloqueado */}
        {isBlocked && (
          <span 
            className="inline-flex items-center justify-center w-4 h-4 text-gray-400 cursor-help"
            title={blockedReason || 'Campo bloqueado'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
        )}
      </div>
      
      <div className="relative">
        <Input
          type={type}
          name={name}
          placeholder={placeholder}
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isBlocked}
          className={isBlocked ? 'opacity-60 cursor-not-allowed' : ''}
        />
        
        {/* Tooltip de bloqueio */}
        {isBlocked && blockedReason && (
          <div className="absolute inset-0 group cursor-not-allowed">
            <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg z-10">
              {blockedReason}
              <div className="absolute bottom-0 left-4 transform translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PermissionSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
  blockedReason?: string | null;
  requiresJustification?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}

/**
 * Select com suporte a permissões
 */
export function PermissionSelect({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
  blockedReason,
  requiresJustification = false,
  allowEmpty = false,
  emptyLabel = 'Selecione',
  className = '',
}: PermissionSelectProps) {
  const isBlocked = disabled || !!blockedReason;
  
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Label>{label}</Label>
        
        {requiresJustification && !isBlocked && (
          <span 
            className="inline-flex items-center justify-center w-4 h-4 text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-full"
            title="Alteração requer justificativa"
          >
            !
          </span>
        )}
        
        {isBlocked && (
          <span 
            className="inline-flex items-center justify-center w-4 h-4 text-gray-400 cursor-help"
            title={blockedReason || 'Campo bloqueado'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
        )}
      </div>
      
      <div className="relative group">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isBlocked}
          className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
            isBlocked ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {allowEmpty && <option value="">{emptyLabel}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        
        {isBlocked && blockedReason && (
          <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg z-10">
            {blockedReason}
            <div className="absolute bottom-0 left-4 transform translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de justificativa para alterações sensíveis
 */
interface JustificationInputProps {
  value: string;
  onChange: (value: string) => void;
  fieldName: string;
  required?: boolean;
}

export function JustificationInput({
  value,
  onChange,
  fieldName,
  required = true,
}: JustificationInputProps) {
  return (
    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Justificativa para alteração de {fieldName}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            {required ? 'Obrigatório' : 'Opcional'} - Esta alteração será registrada no histórico
          </p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Descreva o motivo da alteração..."
            required={required}
            className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

const PermissionFields = {
  PermissionField,
  PermissionSelect,
  JustificationInput,
};

export default PermissionFields;
