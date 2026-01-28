import { z } from 'zod';

// Validação de CPF
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};

// Step 1: Dados Pessoais
export const personalDataSchema = z.object({
  first_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  last_name: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['masculino', 'feminino', 'outro']).refine((val) => val !== undefined, {
    message: 'Gênero é obrigatório',
  }),
});

// Step 2: Contatos
export const contactsSchema = z.object({
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  whatsapp: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
});

// Step 3: Documentos
export const documentsSchema = z.object({
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  rg: z.string().min(5, 'RG inválido').optional(),
  rg_issuer: z.string().optional(),
  rg_issue_date: z.string().optional(),
});

// Step 4: Endereço
export const addressSchema = z.object({
  postal_code: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
});

// Step 5: Organização/Equipe
export const organizationSchema = z.object({
  organization_mode: z.enum(['select', 'create']),
  organization_id: z.string().optional(),
  organization_name: z.string().optional(),
  team_mode: z.enum(['select', 'create']),
  team_id: z.string().optional(),
  team_name: z.string().optional(),
  team_category_id: z.string().optional(),
  team_gender: z.enum(['masculino', 'feminino', 'misto']).optional(),
}).superRefine((data, ctx) => {
  if (data.organization_mode === 'select' && !data.organization_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione uma organização',
      path: ['organization_id'],
    });
  }
  if (data.organization_mode === 'create' && !data.organization_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nome da organização é obrigatório',
      path: ['organization_name'],
    });
  }
  if (data.team_mode === 'select' && !data.team_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione uma equipe',
      path: ['team_id'],
    });
  }
  if (data.team_mode === 'create' && !data.team_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nome da equipe é obrigatório',
      path: ['team_name'],
    });
  }
});

// Step 6: Dados de Atleta
export const athleteDataSchema = z.object({
  create_athlete: z.boolean(),
  athlete_name: z.string().optional(),
  main_defensive_position_id: z.string().optional(),
  main_offensive_position_id: z.string().optional(),
  secondary_defensive_position_id: z.string().optional(),
  secondary_offensive_position_id: z.string().optional(),
  preferred_hand: z.enum(['direita', 'esquerda', 'ambidestra']).optional(),
  start_date: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.create_athlete) {
    if (!data.athlete_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome do atleta é obrigatório',
        path: ['athlete_name'],
      });
    }
    if (!data.main_defensive_position_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Posição defensiva principal é obrigatória',
        path: ['main_defensive_position_id'],
      });
    }
  }
});

// Step 7: Upload de Foto
export const photoSchema = z.object({
  photo_url: z.string().optional(),
  photo_public_id: z.string().optional(),
});

// Schema completo
export const fichaUnicaSchema = z.object({
  personal_data: personalDataSchema,
  contacts: contactsSchema,
  documents: documentsSchema,
  address: addressSchema,
  organization: organizationSchema,
  athlete_data: athleteDataSchema,
  photo: photoSchema,
  create_user: z.boolean().default(false),
  user_role_id: z.number().optional(),
});

export type FichaUnicaFormData = z.infer<typeof fichaUnicaSchema>;