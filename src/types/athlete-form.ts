/**
 * Tipos e interfaces para o formulário de cadastro de atletas
 * Conforme REGRAS.md V1.2
 */

export interface AthleteFormData {
  // Etapa 1: Dados Pessoais
  first_name: string;
  last_name: string;
  birth_date: string;
  // Gênero: apenas 'masculino' | 'feminino' (handebol não tem categoria mista)
  gender: 'masculino' | 'feminino';
  athlete_nickname?: string;
  nationality: string;

  // Etapa 2: Documentos
  athlete_cpf?: string;
  athlete_rg?: string;

  // Etapa 3: Contatos
  phone?: string;
  email_contact?: string;
  guardian_name?: string;
  guardian_phone?: string;

  // Etapa 4: Endereço
  zip_code?: string;
  street?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state_address?: string;

  // Etapa 5: Dados Esportivos
  shirt_number?: number;
  main_defensive_position_id?: number;
  secondary_defensive_position_id?: number;
  main_offensive_position_id?: number;
  secondary_offensive_position_id?: number;
  schooling_id?: number;

  // Etapa 6: Acesso ao Sistema (R2: opcional para atletas)
  create_user: boolean;
  user_email?: string;
  password?: string;
  password_confirmation?: string;

  // Etapa 7: Vínculo com Equipe (RF1.1: opcional)
  create_team_registration: boolean;
  team_id?: string;
  registration_date?: string;
}

export const initialAthleteFormData: AthleteFormData = {
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: 'feminino',
  nationality: 'brasileira',
  create_user: false,
  create_team_registration: false,
};

export interface AthleteFormStepProps {
  data: AthleteFormData;
  onChange: (field: keyof AthleteFormData, value: unknown) => void;
  errors: Record<string, string>;
}

// Constantes para validação
export const ATHLETE_VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 6,
  MIN_SHIRT_NUMBER: 1,
  MAX_SHIRT_NUMBER: 99,
  GOALKEEPER_POSITION_ID: 5, // RD13: ID=5 é Goleira
};
