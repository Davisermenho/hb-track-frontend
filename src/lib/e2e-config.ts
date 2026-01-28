/**
 * Configuração E2E - Flags para desativar funcionalidades não determinísticas
 * 
 * Conforme REGRAS TESTES.md - Regra 16, 23-flags, refinamento 2:
 * - Desativar analytics/Sentry em E2E
 * - Desativar polling/websockets
 * - Reduzir animações
 * - Desativar prefetch agressivo
 * 
 * USO:
 * ```ts
 * import { isE2E, E2E_CONFIG } from '@/lib/e2e-config';
 * 
 * if (!isE2E) {
 *   // código que não deve rodar em E2E
 * }
 * 
 * const pollingInterval = isE2E ? E2E_CONFIG.pollingInterval : 60000;
 * ```
 */

/**
 * Detecta se estamos em modo E2E
 * Pode ser setado via:
 * - Variável de ambiente NEXT_PUBLIC_E2E=1
 * - localStorage 'e2e_mode' = 'true'
 * - Cookie 'e2e_mode' = 'true'
 */
export const isE2E = 
  typeof window !== 'undefined' 
    ? (
        process.env.NEXT_PUBLIC_E2E === '1' ||
        localStorage.getItem('e2e_mode') === 'true' ||
        document.cookie.includes('e2e_mode=true')
      )
    : process.env.NEXT_PUBLIC_E2E === '1';

/**
 * Configurações E2E
 * Valores otimizados para testes determinísticos
 */
export const E2E_CONFIG = {
  /** Desabilitar polling (usar 0 ou valor muito alto) */
  pollingInterval: isE2E ? 0 : undefined,
  
  /** Desabilitar refetch automático */
  refetchInterval: isE2E ? false : undefined,
  
  /** Desabilitar animações */
  animationDuration: isE2E ? 0 : undefined,
  
  /** Desabilitar prefetch */
  prefetch: isE2E ? false : true,
  
  /** Desabilitar telemetria/analytics */
  telemetry: isE2E ? false : true,
  
  /** Desabilitar Sentry */
  sentry: isE2E ? false : true,
  
  /** Timeout mais curto para testes */
  toastDuration: isE2E ? 1000 : 5000,
} as const;

/**
 * Helper para criar intervalos que respeitam modo E2E
 * Em E2E, não cria interval (retorna undefined)
 */
export function createE2ESafeInterval(
  callback: () => void,
  intervalMs: number
): NodeJS.Timeout | undefined {
  if (isE2E) {
    // Em E2E, não criar intervals automáticos
    console.log('[E2E] Interval desabilitado');
    return undefined;
  }
  return setInterval(callback, intervalMs);
}

/**
 * Helper para criar timeouts que respeitam modo E2E
 */
export function createE2ESafeTimeout(
  callback: () => void,
  timeoutMs: number
): NodeJS.Timeout {
  const actualTimeout = isE2E ? Math.min(timeoutMs, 100) : timeoutMs;
  return setTimeout(callback, actualTimeout);
}

// Log em desenvolvimento
if (typeof window !== 'undefined' && isE2E) {
  console.log('🧪 [E2E] Modo E2E ativo - polling e animações desabilitados');
}
