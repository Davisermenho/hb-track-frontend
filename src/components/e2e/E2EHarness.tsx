'use client';

/**
 * E2E Harness Component
 * 
 * Instrumenta a página para testes E2E, expondo marcadores de hidratação
 * que permitem aos testes saber quando o React está pronto.
 * 
 * IMPORTANTE: Este componente só deve ser incluído quando E2E=1
 * 
 * Marcadores expostos em window:
 * - __E2E_PATHNAME: Pathname atual do Next.js (via usePathname)
 * - __E2E_HYDRATED_AT: Timestamp do momento da hidratação
 * - __E2E_HYDRATED_READY: Boolean indicando que hidratação está completa
 * 
 * @see tests/e2e/helpers/waits.ts - waitForHydration()
 * @see tests/e2e/helpers/debug.ts - captureClientDiagnostics()
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Declaração de tipos para window
declare global {
  interface Window {
    __E2E_PATHNAME?: string;
    __E2E_HYDRATED_AT?: number;
    __E2E_HYDRATED_READY?: boolean;
    __E2E_NAV_COUNT?: number;
    __E2E_LAST_NAV?: string;
  }
}

export function E2EHarness() {
  const pathname = usePathname();
  const hasHydrated = useRef(false);

  useEffect(() => {
    // Incrementar contador de navegação para debug
    if (typeof window !== 'undefined') {
      window.__E2E_NAV_COUNT = (window.__E2E_NAV_COUNT ?? 0) + 1;
      window.__E2E_LAST_NAV = pathname;
    }

    // Usar requestAnimationFrame para garantir que o paint aconteceu
    // Isso é importante para edge-cases onde o React pode fazer outro render
    const rafId = requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        // Setar pathname atual do Next.js
        window.__E2E_PATHNAME = pathname;

        // Setar timestamp de hidratação (apenas na primeira vez)
        if (!hasHydrated.current) {
          window.__E2E_HYDRATED_AT = Date.now();
          hasHydrated.current = true;
        }

        // Sinalizar que hidratação está completa
        window.__E2E_HYDRATED_READY = true;

        // Log para debug (visível no console do browser durante testes)
        if (process.env.NODE_ENV === 'development') {
          console.debug('[E2EHarness]', {
            pathname,
            hydrated: window.__E2E_HYDRATED_READY,
            navCount: window.__E2E_NAV_COUNT,
          });
        }
      }
    });

    // Cleanup: resetar ready flag antes de nova navegação
    return () => {
      cancelAnimationFrame(rafId);
      if (typeof window !== 'undefined') {
        window.__E2E_HYDRATED_READY = false;
      }
    };
  }, [pathname]);

  // Componente não renderiza nada visualmente
  return null;
}

/**
 * Wrapper condicional que só renderiza E2EHarness se NEXT_PUBLIC_E2E=1
 * 
 * Use este componente no layout para não impactar produção
 * 
 * @example
 * // No RootLayout:
 * import { E2EHarnessConditional } from '@/components/e2e/E2EHarness';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <E2EHarnessConditional />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 */
export function E2EHarnessConditional() {
  // Verifica variável de ambiente em tempo de build
  if (process.env.NEXT_PUBLIC_E2E !== '1') {
    return null;
  }

  return <E2EHarness />;
}

export default E2EHarness;
