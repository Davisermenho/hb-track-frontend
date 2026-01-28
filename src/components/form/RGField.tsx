"use client";

/**
 * RGField - Campo de RG com formatação flexível
 * 
 * Funcionalidades:
 * - Aceita formatos variados de RG (cada estado tem formato diferente)
 * - Validação básica de tamanho
 * - Remove caracteres especiais para armazenamento
 */

import React, { useState, useMemo } from "react";
import { AlertCircle, CheckCircle, CreditCard } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

interface RGFieldProps {
  /** Valor do RG */
  value?: string;
  /** Callback ao mudar RG */
  onChange: (rg: string) => void;
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
  /** Tamanho mínimo */
  minLength?: number;
  /** Tamanho máximo */
  maxLength?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Remove caracteres especiais do RG, mantendo apenas alfanuméricos
 */
function cleanRG(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Verifica se RG é válido (tamanho mínimo)
 */
function isValidRG(rg: string, minLength: number = 5, maxLength: number = 15): boolean {
  const cleaned = cleanRG(rg);
  return cleaned.length >= minLength && cleaned.length <= maxLength;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function RGField({
  value = "",
  onChange,
  disabled = false,
  className = "",
  label = "RG",
  required = false,
  error,
  placeholder = "00.000.000-0",
  minLength = 5,
  maxLength = 15,
}: RGFieldProps) {
  const [touched, setTouched] = useState(false);

  // Validação
  const validation = useMemo(() => {
    const cleaned = cleanRG(value);
    
    if (cleaned.length === 0) {
      return { isValid: true, message: null }; // Vazio não é erro
    }
    
    if (cleaned.length < minLength) {
      return { isValid: false, message: `RG deve ter no mínimo ${minLength} caracteres` };
    }
    
    if (cleaned.length > maxLength) {
      return { isValid: false, message: `RG deve ter no máximo ${maxLength} caracteres` };
    }
    
    return { isValid: true, message: null };
  }, [value, minLength, maxLength]);

  /**
   * Handler de mudança de valor
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Limitar tamanho máximo (com margem para formatação)
    if (rawValue.length > maxLength + 5) return;
    
    onChange(rawValue);
  };

  /**
   * Handler de blur
   */
  const handleBlur = () => {
    setTouched(true);
  };

  const showError = touched && !validation.isValid && cleanRG(value).length > 0;
  const showSuccess = validation.isValid && cleanRG(value).length >= minLength;
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
          <CreditCard className="h-4 w-4 text-gray-400" />
        </div>

        {/* Input */}
        <input
          type="text"
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

      {/* Dica */}
      {!displayError && !showSuccess && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Formato varia por estado (ex: SP: 00.000.000-0)
        </p>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export { cleanRG, isValidRG };
