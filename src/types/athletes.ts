/**
 * Tipos para Atletas
 */

export type AthleteCategoryType = 'infantil' | 'cadete' | 'juvenil' | 'senior'
// R12: Estados são 'ativa' | 'dispensada' | 'arquivada' - lesão/afastamento são FLAGS (R13)
export type AthleteSportStatus = 'ativa' | 'dispensada' | 'arquivada'
export type AthleteOperationalStatus = 'disponível' | 'restrita' | 'em_caso_médico' | 'retorno'

export type OffensivePosition = 
  | 'Armadora Central' 
  | 'Lateral Esquerda' 
  | 'Lateral Direita' 
  | 'Pivô' 
  | 'Ponta Esquerda' 
  | 'Ponta Direita'

export type DefensivePosition = 
  | '1ª Defensora' 
  | '2ª Defensora' 
  | 'Defensora Base' 
  | 'Defensora Avançada' 
  | 'Goleira'

export interface AthletePositions {
  offensive_primary: OffensivePosition
  offensive_secondary?: OffensivePosition
  defensive_primary: DefensivePosition
  defensive_secondary?: DefensivePosition
}

export interface Athlete {
  id: string
  name: string
  birth_date: string
  category: AthleteCategoryType
  jersey_number?: string
  phone?: string
  email?: string
  sport_status: AthleteSportStatus
  operational_status: AthleteOperationalStatus
  positions: AthletePositions
  team_id: string
  team_name: string
  registration_number?: string
  has_history?: boolean // indica se tem treinos, presenças, wellness, casos médicos
  created_at?: string
  updated_at?: string
}

export interface AthletesFilters {
  team_ids?: string[]
  categories?: AthleteCategoryType[]
  sport_status?: AthleteSportStatus[]
  offensive_positions?: OffensivePosition[]
  defensive_positions?: DefensivePosition[]
  search?: string
}
