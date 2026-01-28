"use client";

/**
 * CPFField - Campo de CPF com validação de dígitos verificadores
 * 
 * Funcionalidades:
 * - Máscara de input: 999.999.999-99
 * - Validação de dígitos verificadores em tempo real
 * - Bloqueio de CPFs inválidos (000.000.000-00, etc)
 * - Estados de erro e sucesso
 */

import React, { useState, useMemo } from "react";
import { AlertCircle, CheckCircle, User } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

interface CPFFieldProps {
  /** Valor do CPF */
  value?: string;
  /** Callback ao mudar CPF */
  onChange: (cpf: string) => void;
  /** Desabilitar campo */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Label */
  label?: string;
  /** Se é obrigatório */
  required?: boolean;
  /** Erro externo */
  error?: string;
  /** Placeholder */
  placeholder?: string;
  /** Validar em tempo real */
  validateOnChange?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formata CPF para exibição
 */
function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

/**
 * Remove formatação do CPF
 */
function cleanCPF(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida CPF brasileiro (dígitos verificadores)
 */
function isValidCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf);
  
  // Verifica tamanho
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
}

/**
 * Verifica se CPF está completo (11 dígitos)
 */
function isCompleteCPF(value: string): boolean {
  return cleanCPF(value).length === 11;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function CPFField({
  value = "",
  onChange,
  disabled = false,
  className = "",
  label = "CPF",
  required = false,
  error,
  placeholder = "000.000.000-00",
  validateOnChange = true,
}: CPFFieldProps) {
  const [touched, setTouched] = useState(false);

  // Validação
  const validation = useMemo(() => {
    const cleaned = cleanCPF(value);
    
    if (cleaned.length === 0) {
      return { isValid: true, message: null }; // Vazio não é erro
    }
    
    if (!isCompleteCPF(value)) {
      return { isValid: false, message: "CPF incompleto" };
    }
    
    if (!isValidCPF(value)) {
      return { isValid: false, message: "CPF inválido" };
    }
    
    return { isValid: true, message: null };
  }, [value]);

  /**
   * Handler de mudança de valor
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCPF(rawValue);
    
    // Limitar a 14 caracteres (000.000.000-00)
    if (formatted.length > 14) return;
    
    onChange(formatted);
  };

  /**
   * Handler de blur
   */
  const handleBlur = () => {
    setTouched(true);
  };

  const showError = (touched || validateOnChange) && !validation.isValid && cleanCPF(value).length > 0;
  const showSuccess = validation.isValid && isCompleteCPF(value);
  const displayError = error || (showError ? validation.message : null);

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Ícone à esquerda */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <User className="h-4 w-4 text-gray-400" />
        </div>

        {/* Input */}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full pl-9 pr-9 py-2 text-sm rounded-lg border
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed
            ${displayError 
              ? "border-red-500 focus:ring-red-500" 
              : showSuccess 
                ? "border-green-500 focus:ring-green-500"
                : "border-gray-300 dark:border-gray-600"
            }
          `}
        />

        {/* Ícone de status à direita */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {displayError && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {!displayError && showSuccess && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Mensagens */}
      {displayError && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {displayError}
        </p>
      )}

      {showSuccess && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          CPF válido
        </p>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export { formatCPF, cleanCPF, isValidCPF, isCompleteCPF };
