/**
 * Simple Cache Utility
 * 
 * FASE 6.4: Cache otimista para dados de atletas
 * 
 * Sistema de cache simples em memória com TTL (Time To Live)
 * para reduzir chamadas à API e melhorar UX
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  /** Tempo de vida do cache em milliseconds (default: 5 minutos) */
  ttl?: number;
  /** Tempo de stale em milliseconds - dados podem ser usados enquanto refetch acontece (default: 30s) */
  staleTime?: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const DEFAULT_STALE_TIME = 30 * 1000; // 30 segundos

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): { data: T | null; isStale: boolean; isExpired: boolean } {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return { data: null, isStale: true, isExpired: true };
    }

    const now = Date.now();
    const isExpired = now > entry.expiresAt;
    const staleTime = (entry.expiresAt - entry.timestamp) * 0.1; // 10% do TTL
    const isStale = now > entry.timestamp + staleTime;

    return {
      data: entry.data,
      isStale,
      isExpired,
    };
  }

  /**
   * Define um valor no cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? DEFAULT_TTL;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    this.cache.set(key, entry);
    this.notifyListeners(key, data);
  }

  /**
   * Remove uma entrada do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida entradas que correspondem a um padrão
   */
  invalidate(pattern: string | RegExp): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      } else if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Atualiza otimisticamente um item no cache
   */
  optimisticUpdate<T>(
    key: string,
    updater: (current: T | null) => T,
    options: CacheOptions = {}
  ): { rollback: () => void } {
    const { data: current } = this.get<T>(key);
    const backup = current ? { ...current as object } as T : null;
    
    const newData = updater(current);
    this.set(key, newData, options);

    return {
      rollback: () => {
        if (backup) {
          this.set(key, backup, options);
        } else {
          this.delete(key);
        }
      },
    };
  }

  /**
   * Registra um listener para mudanças em uma chave
   */
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback as (data: unknown) => void);

    // Retorna função de unsubscribe
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback as (data: unknown) => void);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  private notifyListeners(key: string, data: unknown): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instância singleton do cache
export const athleteCache = new SimpleCache();

// ============================================================================
// CACHE KEYS
// ============================================================================

export const CACHE_KEYS = {
  /** Lista de atletas com filtros */
  athletesList: (filters: Record<string, unknown> = {}) => 
    `athletes:list:${JSON.stringify(filters)}`,
  
  /** Atleta individual */
  athlete: (id: string) => `athletes:${id}`,
  
  /** Estatísticas de atletas */
  athleteStats: (orgId?: string) => `athletes:stats:${orgId || 'all'}`,
  
  /** Contagem de captação */
  captacaoCount: () => 'athletes:captacao:count',
  
  /** Categorias */
  categories: () => 'categories:list',
  
  /** Posições */
  positions: (type: 'offensive' | 'defensive') => `positions:${type}`,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wrapper para fetch com cache
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = athleteCache.get<T>(key);
  
  // Se não expirou, retorna do cache
  if (!cached.isExpired && cached.data !== null) {
    // Se está stale, faz refetch em background
    if (cached.isStale) {
      fetcher().then(data => athleteCache.set(key, data, options)).catch(() => {});
    }
    return cached.data;
  }

  // Se expirou ou não existe, busca da API
  const data = await fetcher();
  athleteCache.set(key, data, options);
  return data;
}

/**
 * Hook helper para usar cache com state React
 */
export function useCacheSubscription<T>(
  key: string,
  initialValue: T | null = null
): T | null {
  // Este hook seria usado com useState para reagir a mudanças no cache
  // Implementação simplificada - em produção usaria useSyncExternalStore
  return initialValue;
}

export default athleteCache;
