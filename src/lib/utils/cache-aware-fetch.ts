/**
 * Cache-aware fetch utility
 * Extrai metadata de cache dos headers HTTP do backend
 */

export interface CacheMetadata {
  ttl: number;
  generatedAt: Date;
  cacheAge: number;
}

export interface FetchWithCacheResult<T> {
  data: T;
  cache: CacheMetadata;
}

/**
 * Realiza fetch com extração automática de metadata de cache
 * 
 * Headers esperados do backend:
 * - X-Cache-TTL: TTL em milissegundos
 * - X-Generated-At: ISO timestamp de quando foi gerado
 */
export async function fetchWithCacheHeaders<T>(
  url: string,
  options?: RequestInit
): Promise<FetchWithCacheResult<T>> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Extrair metadata de cache dos headers
  const ttlHeader = response.headers.get('X-Cache-TTL');
  const generatedAtHeader = response.headers.get('X-Generated-At');
  
  const ttl = ttlHeader ? parseInt(ttlHeader, 10) : 60_000; // Default: 60s
  const generatedAt = generatedAtHeader 
    ? new Date(generatedAtHeader) 
    : new Date();
  
  const cacheAge = Date.now() - generatedAt.getTime();
  
  return {
    data,
    cache: {
      ttl,
      generatedAt,
      cacheAge
    }
  };
}

/**
 * Calcula se o cache ainda é válido
 */
export function isCacheValid(metadata: CacheMetadata): boolean {
  return metadata.cacheAge < metadata.ttl;
}

/**
 * Formata cache age para exibição
 */
export function formatCacheAge(cacheAge: number): string {
  if (cacheAge < 1000) return `${cacheAge}ms`;
  if (cacheAge < 60_000) return `${Math.floor(cacheAge / 1000)}s`;
  return `${Math.floor(cacheAge / 60_000)}m`;
}
