/**
 * API Layer - Exercises
 * Step 20: Frontend de Exercícios
 * 
 * Endpoints:
 * - GET /exercises - Lista exercícios com filtros
 * - GET /exercises/:id - Detalhes de um exercício
 * - POST /exercises - Criar exercício (staff)
 * - PATCH /exercises/:id - Atualizar exercício (staff)
 * - DELETE /exercises/:id - Deletar exercício (staff)
 * - GET /exercise-tags - Lista tags hierárquicas
 * - POST /exercise-favorites - Adicionar favorito
 * - DELETE /exercise-favorites/:id - Remover favorito
 */

import { apiClient } from './client';

// ==================== TYPES ====================

export interface ExerciseTag {
  id: string;
  name: string;
  description: string | null;
  parent_tag_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  children?: ExerciseTag[];
}

export interface Exercise {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  tag_ids: string[];
  category: string | null;
  media_url: string | null; // YouTube URL
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Computed
  tags?: ExerciseTag[];
  is_favorite?: boolean;
  youtube_embed_url?: string;
}

export interface ExerciseFavorite {
  id: string;
  user_id: string;
  exercise_id: string;
  created_at: string;
}

export interface ExerciseFilters {
  tag_ids?: string[];
  tag_operator?: 'AND' | 'OR'; // AND = tem TODAS as tags, OR = tem PELO MENOS UMA
  search?: string;
  category?: string;
  favorites_only?: boolean;
  created_by_user_id?: string;
}

export interface ExerciseInput {
  name: string;
  description?: string;
  tag_ids: string[];
  category?: string;
  media_url?: string; // YouTube URL
}

export interface ExerciseListResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  per_page: number;
}

// ==================== API FUNCTIONS ====================

/**
 * Lista exercícios com filtros opcionais
 */
export async function getExercises(
  filters?: ExerciseFilters,
  page: number = 1,
  perPage: number = 20
): Promise<ExerciseListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (filters?.tag_ids && filters.tag_ids.length > 0) {
    params.append('tag_ids', filters.tag_ids.join(','));
  }
  if (filters?.tag_operator) {
    params.append('tag_operator', filters.tag_operator);
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }
  if (filters?.category) {
    params.append('category', filters.category);
  }
  if (filters?.favorites_only) {
    params.append('favorites_only', 'true');
  }
  if (filters?.created_by_user_id) {
    params.append('created_by_user_id', filters.created_by_user_id);
  }

  const response = await apiClient.get<ExerciseListResponse>(
    `/exercises?${params.toString()}`
  );
  
  return response;
}

/**
 * Busca um exercício por ID
 */
export async function getExerciseById(id: string): Promise<Exercise> {
  const response = await apiClient.get<Exercise>(`/exercises/${id}`);
  return response;
}

/**
 * Cria um novo exercício (staff apenas)
 */
export async function createExercise(data: ExerciseInput): Promise<Exercise> {
  const response = await apiClient.post<Exercise>('/exercises', data);
  return response;
}

/**
 * Atualiza um exercício existente (staff apenas)
 */
export async function updateExercise(id: string, data: Partial<ExerciseInput>): Promise<Exercise> {
  const response = await apiClient.patch<Exercise>(`/exercises/${id}`, data);
  return response;
}

/**
 * Deleta um exercício (staff apenas)
 */
export async function deleteExercise(id: string): Promise<void> {
  await apiClient.delete(`/exercises/${id}`);
}

/**
 * Lista todas as tags hierárquicas
 */
export async function getExerciseTags(): Promise<ExerciseTag[]> {
  const response = await apiClient.get<ExerciseTag[]>('/exercise-tags');
  return buildTagHierarchy(response);
}

/**
 * Adiciona um exercício aos favoritos
 */
export async function addFavorite(exerciseId: string): Promise<ExerciseFavorite> {
  const response = await apiClient.post<ExerciseFavorite>('/exercise-favorites', {
    exercise_id: exerciseId,
  });
  return response;
}

/**
 * Remove um exercício dos favoritos
 */
export async function removeFavorite(exerciseId: string): Promise<void> {
  await apiClient.delete(`/exercise-favorites/${exerciseId}`);
}

/**
 * Lista favoritos do usuário
 */
export async function getFavorites(): Promise<ExerciseFavorite[]> {
  const response = await apiClient.get<ExerciseFavorite[]>('/exercise-favorites');
  return response;
}

// ==================== HELPERS ====================

/**
 * Constrói hierarquia de tags (pais → filhos)
 */
function buildTagHierarchy(tags: ExerciseTag[]): ExerciseTag[] {
  const tagMap = new Map<string, ExerciseTag>();
  const rootTags: ExerciseTag[] = [];

  // Primeiro passo: criar mapa de todas as tags
  tags.forEach(tag => {
    tagMap.set(tag.id, { ...tag, children: [] });
  });

  // Segundo passo: construir hierarquia
  tags.forEach(tag => {
    const tagWithChildren = tagMap.get(tag.id);
    if (!tagWithChildren) return;

    if (tag.parent_tag_id) {
      const parent = tagMap.get(tag.parent_tag_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(tagWithChildren);
      }
    } else {
      rootTags.push(tagWithChildren);
    }
  });

  // Ordenar por display_order
  const sortByDisplayOrder = (a: ExerciseTag, b: ExerciseTag) => 
    a.display_order - b.display_order;

  rootTags.sort(sortByDisplayOrder);
  rootTags.forEach(tag => {
    if (tag.children && tag.children.length > 0) {
      tag.children.sort(sortByDisplayOrder);
    }
  });

  return rootTags;
}

/**
 * Extrai ID do vídeo do YouTube de uma URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Converte URL do YouTube para embed URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Valida se URL é do YouTube
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Filtra tags apenas ativas
 */
export function getActiveTags(tags: ExerciseTag[]): ExerciseTag[] {
  return tags
    .filter(tag => tag.is_active)
    .map(tag => ({
      ...tag,
      children: tag.children ? getActiveTags(tag.children) : [],
    }));
}

/**
 * Busca tag por ID em hierarquia
 */
export function findTagById(tags: ExerciseTag[], tagId: string): ExerciseTag | null {
  for (const tag of tags) {
    if (tag.id === tagId) return tag;
    if (tag.children && tag.children.length > 0) {
      const found = findTagById(tag.children, tagId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Retorna todos os IDs de tags (incluindo filhas recursivamente)
 */
export function getAllTagIds(tags: ExerciseTag[]): string[] {
  const ids: string[] = [];
  tags.forEach(tag => {
    ids.push(tag.id);
    if (tag.children && tag.children.length > 0) {
      ids.push(...getAllTagIds(tag.children));
    }
  });
  return ids;
}

/**
 * Valida input de exercício
 */
export function validateExerciseInput(data: ExerciseInput): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push('Nome do exercício deve ter pelo menos 3 caracteres');
  }

  if (data.name && data.name.length > 200) {
    errors.push('Nome do exercício não pode ter mais de 200 caracteres');
  }

  if (!data.tag_ids || data.tag_ids.length === 0) {
    errors.push('Selecione pelo menos uma tag');
  }

  if (data.tag_ids && data.tag_ids.length > 10) {
    errors.push('Máximo de 10 tags por exercício');
  }

  if (data.media_url && !isValidYouTubeUrl(data.media_url)) {
    errors.push('URL do YouTube inválida');
  }

  return errors;
}
