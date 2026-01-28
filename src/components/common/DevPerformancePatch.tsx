'use client';

import { useEffect } from 'react';

/**
 * Workaround para bug conhecido do Next.js 16 com Turbopack
 * GitHub Issue: https://github.com/vercel/next.js/issues/86060
 *
 * O erro "Failed to execute 'measure' on 'Performance': '[ComponentName]'
 * cannot have a negative time stamp" ocorre devido a uma condição de corrida
 * no sistema de medição de performance do Turbopack.
 *
 * Este patch intercepta chamadas ao performance.measure() e suprime
 * erros de timestamp negativo apenas em desenvolvimento.
 */
export function DevPerformancePatch() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const originalMeasure = performance.measure.bind(performance);

    performance.measure = (
      measureName: string,
      startOrMeasureOptions?: string | PerformanceMeasureOptions,
      endMark?: string
    ): PerformanceMeasure => {
      try {
        return originalMeasure(measureName, startOrMeasureOptions as string, endMark);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('negative time stamp')
        ) {
          // Suprime o erro de timestamp negativo do Turbopack
          return {
            name: measureName,
            entryType: 'measure',
            startTime: 0,
            duration: 0,
            detail: null,
            toJSON: () => ({}),
          } as PerformanceMeasure;
        }
        throw error;
      }
    };

    // Cleanup: restaura o método original quando o componente é desmontado
    return () => {
      performance.measure = originalMeasure;
    };
  }, []);

  return null;
}
