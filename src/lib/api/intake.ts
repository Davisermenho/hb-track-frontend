import { apiClient } from "./client";

// Ficha Única Types
export interface FichaUnicaPayload {
  person: {
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    nationality?: string;
    notes?: string;
    contacts: Array<{
      contact_type: string;
      contact_value: string;
      is_primary: boolean;
    }>;
    documents?: Array<{
      document_type: string;
      document_number: string;
    }>;
    address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      country?: string;
    };
    media?: {
      profile_photo_url?: string;
    };
  };
  create_user?: boolean;
  user?: {
    email: string;
    role_id: number;
  };
  season?: {
    mode: "create" | "select";
    season_id?: string;
    year?: number;
    competition_type?: string;
  };
  organization?: {
    mode: "create" | "select";
    organization_id?: string;
    name?: string;
  };
  membership?: {
    role_id: number;
    start_at: string;
  };
  team?: {
    mode?: "create" | "select";
    team_id?: string;
    name?: string;
    category_id?: number;
    gender?: string;
  };
  athlete?: {
    create: boolean;
    athlete_name?: string;
    athlete_nickname?: string;
    birth_date?: string;
    shirt_number?: number;
    schooling_id?: number;
    guardian_name?: string;
    guardian_phone?: string;
    main_defensive_position_id?: number;
    secondary_defensive_position_id?: number;
    main_offensive_position_id?: number;
    secondary_offensive_position_id?: number;
  };
  registration?: {
    start_at: string;
    end_at?: string;
  };
}

export interface FichaUnicaResponse {
  person_id: string;
  user_id?: string;
  season_id?: string;
  organization_id?: string;
  team_id?: string;
  athlete_id?: string;
  membership_id?: string;
  registration_id?: string;
  message?: string;
}

export interface OrganizationAutocomplete {
  id: string;
  name: string;
  active_memberships_count: number;
}

export interface TeamAutocomplete {
  id: string;
  name: string;
  category_name: string;
  gender: string;
  active_registrations_count: number;
}

export const intakeService = {
  async submitFichaUnica(
    payload: FichaUnicaPayload,
    options?: {
      validateOnly?: boolean;
      idempotencyKey?: string;
    }
  ): Promise<FichaUnicaResponse> {
    const headers: Record<string, string> = {};
    
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const params: Record<string, any> = {};
    if (options?.validateOnly) {
      params.validate_only = true;
    }

    return apiClient.post<FichaUnicaResponse>(
      '/intake/ficha-unica',
      payload,
      { headers, params }
    );
  },

  async searchOrganizations(query: string): Promise<OrganizationAutocomplete[]> {
    const response = await apiClient.get<{ items: OrganizationAutocomplete[] }>(
      '/intake/autocomplete/organizations',
      { params: { q: query, limit: 10 } }
    );
    return response.items || [];
  },

  async searchTeams(organizationId: string, query: string): Promise<TeamAutocomplete[]> {
    const response = await apiClient.get<{ items: TeamAutocomplete[] }>(
      '/intake/autocomplete/teams',
      {
        params: {
          organization_id: organizationId,
          q: query,
          limit: 10,
        },
      }
    );
    return response.items || [];
  },
};