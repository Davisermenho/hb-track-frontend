/**
 * Helpers para manipulação de Search Params
 * Centraliza a lógica de atualização da URL
 */

import { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Atualiza um único search param preservando os demais
 */
export function updateSearchParam(
  searchParams: ReadonlyURLSearchParams,
  key: string,
  value: string
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set(key, value);
  return params.toString();
}

/**
 * Atualiza múltiplos search params de uma vez
 */
export function updateSearchParams(
  searchParams: ReadonlyURLSearchParams,
  updates: Record<string, string>
): string {
  const params = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    params.set(key, value);
  });
  return params.toString();
}

/**
 * Remove um ou mais search params
 */
export function removeSearchParams(
  searchParams: ReadonlyURLSearchParams,
  keys: string[]
): string {
  const params = new URLSearchParams(searchParams.toString());
  keys.forEach((key) => params.delete(key));
  return params.toString();
}

/**
 * Reseta search params mantendo apenas os especificados
 */
export function resetSearchParams(
  searchParams: ReadonlyURLSearchParams,
  keep: string[] = []
): string {
  const params = new URLSearchParams(searchParams.toString());
  const keysToDelete = Array.from(params.keys()).filter(
    (key) => !keep.includes(key)
  );
  keysToDelete.forEach((key) => params.delete(key));
  return params.toString();
}

/**
 * Obtém valor com fallback type-safe
 */
export function getSearchParam(
  searchParams: ReadonlyURLSearchParams,
  key: string,
  fallback: string
): string {
  return searchParams.get(key) ?? fallback;
}

/**
 * Verifica se um search param existe
 */
export function hasSearchParam(
  searchParams: ReadonlyURLSearchParams,
  key: string
): boolean {
  return searchParams.has(key);
}
