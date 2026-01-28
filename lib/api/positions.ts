/**
 * Serviço de API - Positions (Posições Defensivas e Ofensivas)
 * 
 * Conforme REGRAS.md V1.2:
 * - RDB17: Tabelas de lookup são globais
 * - RD13: Goleiras (defensive_position_id=5) não podem ter posição ofensiva
 */

import { apiClient } from './client';

export interface DefensivePosition {
  id: number;
  code: string;
  name: string;
  abbreviation?: string;
  is_active: boolean;
}

export interface OffensivePosition {
  id: number;
  code: string;
  name: string;
  abbreviation?: string;
  is_active: boolean;
}

export interface SchoolingLevel {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export const defensivePositionsService = {
  /**
   * Lista todas as posições defensivas
   */
  async list(): Promise<DefensivePosition[]> {
    // Backend retorna array direto, não { items: [...] }
    return apiClient.get<DefensivePosition[]>('/defensive-positions');
  },

  async getById(id: number): Promise<DefensivePosition> {
    return apiClient.get<DefensivePosition>(`/defensive-positions/${id}`);
  },
};

export const offensivePositionsService = {
  /**
   * Lista todas as posições ofensivas
   */
  async list(): Promise<OffensivePosition[]> {
    // Backend retorna array direto, não { items: [...] }
    return apiClient.get<OffensivePosition[]>('/offensive-positions');
  },

  async getById(id: number): Promise<OffensivePosition> {
    return apiClient.get<OffensivePosition>(`/offensive-positions/${id}`);
  },
};

export const schoolingLevelsService = {
  /**
   * Lista todos os níveis de escolaridade
   */
  async list(): Promise<SchoolingLevel[]> {
    // Backend retorna array direto, não { items: [...] }
    return apiClient.get<SchoolingLevel[]>('/schooling-levels');
  },

  async getById(id: number): Promise<SchoolingLevel> {
    return apiClient.get<SchoolingLevel>(`/schooling-levels/${id}`);
  },
};
