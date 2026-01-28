/**
 * Serviço de API - Categories (Categorias)
 * 
 * Conforme REGRAS.md RDB11:
 * - Categorias globais apenas com max_age (sem min_age)
 * - Campos: id, name, max_age, is_active
 */

import { apiClient } from './client';

export interface Category {
  id: number;
  name: string;       // Nome da categoria (ex: Mirim, Infantil, Cadete)
  max_age: number;    // Idade máxima para a categoria
  is_active: boolean; // Se a categoria está ativa
}

export interface CategoryListResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
}

export const categoriesService = {
  /**
   * Lista todas as categorias
   */
  async list(): Promise<CategoryListResponse> {
    return apiClient.get<CategoryListResponse>('/categories', { limit: 100 });
  },

  /**
   * Busca uma categoria por ID
   */
  async getById(id: number): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  },
};
