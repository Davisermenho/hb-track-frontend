/**
 * Utilidades para busca e filtro
 * 
 * Funções auxiliares para normalização de strings e busca em pt-BR.
 */

/**
 * Normaliza string para busca: lowercase + remove acentos
 * 
 * @param str - String a ser normalizada
 * @returns String normalizada
 * 
 * @example
 * normalizeSearchString('Treino de Transição Ofensiva') // 'treino de transicao ofensiva'
 */
export function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos
}

/**
 * Verifica se uma string contém a query de busca (normalizada)
 * 
 * @param text - Texto a ser buscado
 * @param query - Query de busca
 * @returns true se encontrar match
 * 
 * @example
 * matchesSearch('Treino de Transição Ofensiva', 'transicao') // true
 * matchesSearch('Campo 1', 'campo 2') // false
 */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  if (!text || !query) return true;
  return normalizeSearchString(text).includes(normalizeSearchString(query));
}
