/**
 * useDebouncedValue Hook
 * 
 * Retorna um valor debounced após um delay especificado
 * Útil para inputs de busca
 */

'use client';

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
