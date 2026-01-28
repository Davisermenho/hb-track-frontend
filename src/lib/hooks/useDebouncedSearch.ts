/**
 * useDebouncedSearch Hook
 * 
 * Debounces search input para evitar atualizações excessivas
 * durante digitação rápida.
 * 
 * @param value - Valor a ser debounced
 * @param delay - Delay em millisegundos (padrão: 300ms)
 * @returns Valor debounced
 */

import { useState, useEffect } from 'react';

export function useDebouncedSearch<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout para atualizar debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancela timeout anterior se value mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
