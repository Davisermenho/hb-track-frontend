"use client";

/**
 * CEPField - Campo de CEP com autocomplete via ViaCEP
 * 
 * Funcionalidades:
 * - Máscara de input: 99999-999
 * - Busca automática no ViaCEP quando CEP completo
 * - Preenche campos de endereço automaticamente
 * - Fallback para preenchimento manual
 * - Estados de loading e erro
 */

import React, { useState, useCallback } from "react";
import { Loader2, MapPin, AlertCircle, CheckCircle } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface AddressFields {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CEPFieldProps {
  /** Valor do CEP */
  value?: string;
  /** Callback ao mudar CEP */
  onChange: (cep: string) => void;
  /** Callback ao encontrar endereço */
  onAddressFound?: (address: AddressFields) => void;
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
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formata CEP para exibição
 */
function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
}

/**
 * Remove formatação do CEP
 */
function cleanCEP(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida se CEP está completo
 */
function isCompleteCEP(value: string): boolean {
  return cleanCEP(value).length === 8;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function CEPField({
  value = "",
  onChange,
  onAddressFound,
  disabled = false,
  className = "",
  label = "CEP",
  required = false,
  error,
  placeholder = "00000-000",
}: CEPFieldProps) {
  const [loading, setLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Busca endereço no ViaCEP
   */
  const fetchAddress = useCallback(
    async (cep: string) => {
      const cleanedCEP = cleanCEP(cep);
      
      if (!isCompleteCEP(cep)) return;

      setLoading(true);
      setInternalError(null);
      setSuccess(false);

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanedCEP}/json/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar CEP");
        }

        const data: ViaCEPResponse = await response.json();

        if (data.erro) {
          setInternalError("CEP não encontrado");
          return;
        }

        // CEP encontrado - preencher campos
        const address: AddressFields = {
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        };

        onAddressFound?.(address);
        setSuccess(true);

        // Limpar sucesso após 3 segundos
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
        setInternalError("Erro ao buscar CEP. Preencha o endereço manualmente.");
      } finally {
        setLoading(false);
      }
    },
    [onAddressFound]
  );

  /**
   * Handler de mudança de valor
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCEP(rawValue);
    
    // Limitar a 9 caracteres (00000-000)
    if (formatted.length > 9) return;
    
    onChange(formatted);
    setInternalError(null);
    setSuccess(false);

    // Buscar endereço quando CEP estiver completo
    if (isCompleteCEP(formatted)) {
      fetchAddress(formatted);
    }
  };

  /**
   * Handler de blur - tenta buscar se completo
   */
  const handleBlur = () => {
    if (isCompleteCEP(value) && !success && !loading) {
      fetchAddress(value);
    }
  };

  const displayError = error || internalError;

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
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>

        {/* Input */}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled || loading}
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
              : success 
                ? "border-green-500 focus:ring-green-500"
                : "border-gray-300 dark:border-gray-600"
            }
          `}
        />

        {/* Ícone de status à direita */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading && (
            <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />
          )}
          {!loading && displayError && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {!loading && !displayError && success && (
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

      {success && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Endereço preenchido automaticamente
        </p>
      )}

      {loading && (
        <p className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Buscando endereço...
        </p>
      )}
    </div>
  );
}
