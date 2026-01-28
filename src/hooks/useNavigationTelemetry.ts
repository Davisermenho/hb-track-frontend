'use client';

/**
 * useNavigationTelemetry - Hook para telemetria de navegação
 * 
 * Rastreia:
 * - Páginas visitadas
 * - Tempo de permanência
 * - Frequência de acesso
 * - Padrões de navegação
 * 
 * Pode ser integrado com:
 * - PostHog
 * - Segment
 * - Plausible
 * - Custom analytics
 * 
 * @version 1.0.0
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationEvent {
  pathname: string;
  timestamp: number;
  duration?: number; // Tempo na página anterior (ms)
  referrer?: string; // Página anterior
  sessionId: string;
}

interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string; // URL para enviar dados
  batchSize?: number; // Quantos eventos acumular antes de enviar
  flushInterval?: number; // Intervalo para flush automático (ms)
  debug?: boolean; // Log no console
}

// Configuração padrão
const defaultConfig: TelemetryConfig = {
  enabled: process.env.NODE_ENV === 'production',
  batchSize: 10,
  flushInterval: 30000, // 30 segundos
  debug: process.env.NODE_ENV === 'development',
};

// Gerar ID de sessão único
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Storage key para persistir eventos
const TELEMETRY_STORAGE_KEY = 'hbtrack-navigation-telemetry';
const SESSION_ID_KEY = 'hbtrack-session-id';

// Obter ou criar session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Classe para gerenciar telemetria
class NavigationTelemetryManager {
  private events: NavigationEvent[] = [];
  private config: TelemetryConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor(config: TelemetryConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = getSessionId();
    this.loadFromStorage();
    this.startFlushTimer();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(TELEMETRY_STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (e) {
      // Ignorar erro de parse
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(this.events));
    } catch (e) {
      // Ignorar erro de storage cheio
    }
  }

  private startFlushTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    
    if (this.config.flushInterval && this.config.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  track(event: Omit<NavigationEvent, 'sessionId'>) {
    if (!this.config.enabled && !this.config.debug) return;

    const fullEvent: NavigationEvent = {
      ...event,
      sessionId: this.sessionId,
    };

    this.events.push(fullEvent);
    this.saveToStorage();

    if (this.config.debug) {
      console.log('[Telemetry] Navigation:', fullEvent);
    }

    // Auto-flush se atingiu batch size
    if (this.config.batchSize && this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.events.length === 0) return;
    if (!this.config.enabled) {
      if (this.config.debug) {
        console.log('[Telemetry] Would flush events:', this.events);
      }
      return;
    }

    const eventsToSend = [...this.events];
    this.events = [];
    this.saveToStorage();

    if (this.config.endpoint) {
      try {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: eventsToSend }),
        });
        
        if (this.config.debug) {
          console.log('[Telemetry] Flushed events:', eventsToSend.length);
        }
      } catch (e) {
        // Re-adicionar eventos em caso de falha
        this.events = [...eventsToSend, ...this.events];
        this.saveToStorage();
        
        if (this.config.debug) {
          console.error('[Telemetry] Flush failed:', e);
        }
      }
    }
  }

  getAnalytics() {
    // Análise local dos eventos
    const pageVisits: Record<string, number> = {};
    const avgDuration: Record<string, number[]> = {};

    this.events.forEach(event => {
      pageVisits[event.pathname] = (pageVisits[event.pathname] || 0) + 1;
      
      if (event.duration) {
        if (!avgDuration[event.pathname]) {
          avgDuration[event.pathname] = [];
        }
        avgDuration[event.pathname].push(event.duration);
      }
    });

    const avgDurationByPage: Record<string, number> = {};
    Object.entries(avgDuration).forEach(([path, durations]) => {
      avgDurationByPage[path] = durations.reduce((a, b) => a + b, 0) / durations.length;
    });

    return {
      pageVisits,
      avgDurationByPage,
      totalEvents: this.events.length,
      sessionId: this.sessionId,
    };
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}

// Instância singleton
let telemetryManager: NavigationTelemetryManager | null = null;

function getTelemetryManager(config?: TelemetryConfig): NavigationTelemetryManager {
  if (!telemetryManager) {
    telemetryManager = new NavigationTelemetryManager(config);
  }
  return telemetryManager;
}

/**
 * Hook para rastrear navegação automaticamente
 */
export function useNavigationTelemetry(config?: Partial<TelemetryConfig>) {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Inicializar timestamp apenas na primeira utilização
  const getInitialTimestamp = useCallback(() => {
    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = Date.now();
    }
    return lastTimestampRef.current;
  }, []);

  // Função para rastrear manualmente (ex: cliques em sidebar)
  const trackNavigation = useCallback((path: string, extra?: Record<string, unknown>) => {
    const manager = getTelemetryManager(config as TelemetryConfig);
    const now = getInitialTimestamp();
    const duration = lastPathRef.current && lastTimestampRef.current ? now - lastTimestampRef.current : undefined;
    
    manager.track({
      pathname: path,
      timestamp: now,
      duration,
      referrer: lastPathRef.current || undefined,
      ...extra,
    });

    lastPathRef.current = path;
    lastTimestampRef.current = now;
  }, [config]);

  // Rastrear automaticamente mudanças de rota
  useEffect(() => {
    if (pathname && pathname !== lastPathRef.current) {
      trackNavigation(pathname);
    }
  }, [pathname, trackNavigation]);

  // Flush ao sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      const manager = getTelemetryManager();
      manager.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Retornar funções úteis
  return {
    trackNavigation,
    getAnalytics: () => getTelemetryManager().getAnalytics(),
    flush: () => getTelemetryManager().flush(),
  };
}

export default useNavigationTelemetry;
