// Placeholder positions API; replace with real endpoints.
export interface DefensivePosition {
  id: string;
  name: string;
  code?: string;
  abbreviation?: string;
  is_active?: boolean;
}

export interface OffensivePosition {
  id: string;
  name: string;
  code?: string;
  abbreviation?: string;
  is_active?: boolean;
}

export interface SchoolingLevel {
  id: string;
  name: string;
  code?: string;
  is_active?: boolean;
}

export const defensivePositionsService = {
  async list(): Promise<DefensivePosition[]> {
    return [];
  },
};

export const offensivePositionsService = {
  async list(): Promise<OffensivePosition[]> {
    return [];
  },
};

export const schoolingLevelsService = {
  async list(): Promise<SchoolingLevel[]> {
    return [];
  },
};
