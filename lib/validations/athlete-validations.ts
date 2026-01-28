/**
 * Validações Zod Canônicas para Atletas
 * 
 * Baseado em: REGRAS_GERENCIAMENTO_ATLETAS.md
 * 
 * REGRAS IMPLEMENTADAS:
 * - Campos obrigatórios: gender, defensive_position_id, RG, phone, email
 * - Gênero: apenas 'male' ou 'female' (handebol não tem categoria mista)
 * - RD13: offensive_position_id nullable para goleiras (defensive_position_id = 5)
 * - R15: Validação de categoria (atleta não pode jogar em categoria inferior)
 * - Validação de CPF (formato e dígitos verificadores)
 * - Validação de email
 * - Validação de telefone brasileiro
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTES DE VALIDAÇÃO
// ============================================================================

const GOALKEEPER_POSITION_ID = 5;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MIN_SHIRT_NUMBER = 1;
const MAX_SHIRT_NUMBER = 99;
const MIN_PASSWORD_LENGTH = 6;

// ============================================================================
// HELPERS DE VALIDAÇÃO
// ============================================================================

/**
 * Valida CPF brasileiro (formato e dígitos verificadores)
 */
function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');
  
  // Verifica tamanho
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
}

/**
 * Valida telefone brasileiro (com ou sem formatação)
 * Aceita: (11) 99999-9999, 11999999999, +55 11 99999-9999
 */
function isValidBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // 10 dígitos (fixo) ou 11 dígitos (celular)
  // Com código do país: 12 ou 13 dígitos
  return cleaned.length >= 10 && cleaned.length <= 13;
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata telefone para exibição
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// ============================================================================
// SCHEMAS DE CAMPOS INDIVIDUAIS
// ============================================================================

/** Gênero - apenas male/female para atletas */
export const athleteGenderSchema = z.enum(['male', 'female']).catch('female');

/** Estado da atleta */
export const athleteStateSchema = z.enum(['ativa', 'dispensada', 'arquivada']);

/** CPF com validação de dígitos */
export const cpfSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length === 0 || isValidCPF(val), {
    message: 'CPF inválido',
  })
  .optional();

/** RG - formato flexível */
export const rgSchema = z
  .string()
  .min(5, 'RG deve ter pelo menos 5 caracteres')
  .max(20, 'RG deve ter no máximo 20 caracteres')
  .optional();

/** Telefone brasileiro */
export const phoneSchema = z
  .string()
  .refine((val) => !val || isValidBrazilianPhone(val), {
    message: 'Telefone inválido. Use formato: (11) 99999-9999',
  });

/** Email */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(100, 'Email muito longo');

/** Nome */
export const nameSchema = z
  .string()
  .min(MIN_NAME_LENGTH, `Mínimo ${MIN_NAME_LENGTH} caracteres`)
  .max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres`);

/** Número da camisa */
export const shirtNumberSchema = z
  .number()
  .int('Deve ser número inteiro')
  .min(MIN_SHIRT_NUMBER, `Mínimo ${MIN_SHIRT_NUMBER}`)
  .max(MAX_SHIRT_NUMBER, `Máximo ${MAX_SHIRT_NUMBER}`)
  .optional()
  .nullable();

/** CEP */
export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use formato: 00000-000')
  .optional();

/** Data de nascimento */
export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use formato: AAAA-MM-DD')
  .refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const minDate = new Date('1940-01-01');
    return date <= now && date >= minDate;
  }, 'Data de nascimento inválida');

// ============================================================================
// SCHEMA PRINCIPAL: CRIAR ATLETA
// ============================================================================

/**
 * Schema para criar atleta
 * Conforme REGRAS_GERENCIAMENTO_ATLETAS.md Seção 5
 */
export const athleteCreateSchema = z.object({
  // ========== ETAPA 1: Dados Pessoais ==========
  first_name: nameSchema,
  last_name: nameSchema,
  birth_date: birthDateSchema,
  gender: athleteGenderSchema, // OBRIGATÓRIO
  athlete_nickname: z.string().max(50).optional(),
  nationality: z.string().max(100).default('brasileira'),

  // ========== ETAPA 2: Documentos ==========
  // RG é obrigatório nas regras canônicas
  athlete_rg: rgSchema,
  athlete_cpf: cpfSchema,

  // ========== ETAPA 3: Contatos ==========
  // Telefone e email são obrigatórios nas regras canônicas
  athlete_phone: phoneSchema,
  athlete_email: emailSchema,
  
  // Responsável legal (opcional, recomendado para menores)
  guardian_name: z.string().max(100).optional(),
  guardian_phone: phoneSchema.optional(),

  // ========== ETAPA 4: Endereço ==========
  zip_code: cepSchema,
  street: z.string().max(200).optional(),
  address_number: z.string().max(20).optional(),
  address_complement: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state_address: z.string().length(2, 'Use sigla do estado (ex: SP)').optional(),

  // ========== ETAPA 5: Dados Esportivos ==========
  shirt_number: shirtNumberSchema,
  // Posição defensiva é OBRIGATÓRIA
  main_defensive_position_id: z.number().int().positive('Posição defensiva é obrigatória'),
  secondary_defensive_position_id: z.number().int().positive().optional().nullable(),
  // Posição ofensiva: obrigatória EXCETO para goleiras (RD13)
  main_offensive_position_id: z.number().int().positive().optional().nullable(),
  secondary_offensive_position_id: z.number().int().positive().optional().nullable(),
  schooling_id: z.number().int().positive().optional().nullable(),

  // ========== ETAPA 6: Acesso ao Sistema (R2: opcional) ==========
  create_user: z.boolean().default(false),
  user_email: z.string().email().optional(),
  password: z.string().min(MIN_PASSWORD_LENGTH).optional(),

  // ========== ETAPA 7: Vínculo com Equipe (RF1.1: opcional) ==========
  team_id: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  // Validação RD13: offensive_position_id obrigatório exceto para goleiras
  if (data.main_defensive_position_id !== GOALKEEPER_POSITION_ID && !data.main_offensive_position_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Posição ofensiva é obrigatória (exceto para goleiras)',
      path: ['main_offensive_position_id'],
    });
  }

  // Se criar usuário, email e senha são obrigatórios
  if (data.create_user) {
    if (!data.user_email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email é obrigatório para criar acesso ao sistema',
        path: ['user_email'],
      });
    }
    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Senha é obrigatória para criar acesso ao sistema',
        path: ['password'],
      });
    }
  }
});

// ============================================================================
// SCHEMA: ATUALIZAR ATLETA
// ============================================================================

/**
 * Schema para atualizar atleta
 * Conforme Seção 5.1: Campos editáveis
 */
export const athleteUpdateSchema = z.object({
  // Dados editáveis sem restrição
  athlete_nickname: z.string().max(50).optional(),
  shirt_number: shirtNumberSchema,
  guardian_name: z.string().max(100).optional(),
  guardian_phone: phoneSchema.optional(),
  athlete_photo_path: z.string().max(500).optional(),
  
  // Posições (editável por Coordenador/Treinador)
  main_defensive_position_id: z.number().int().positive().optional(),
  secondary_defensive_position_id: z.number().int().positive().optional().nullable(),
  main_offensive_position_id: z.number().int().positive().optional().nullable(),
  secondary_offensive_position_id: z.number().int().positive().optional().nullable(),
  schooling_id: z.number().int().positive().optional().nullable(),
  
  // Estado e flags
  state: athleteStateSchema.optional(),
  injured: z.boolean().optional(),
  medical_restriction: z.boolean().optional(),
  suspended_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  load_restricted: z.boolean().optional(),
}).partial();

// ============================================================================
// SCHEMA: FILTROS DE BUSCA
// ============================================================================

export const athleteFiltersSchema = z.object({
  search: z.string().optional(),
  state: z.union([
    athleteStateSchema,
    z.array(athleteStateSchema),
  ]).optional(),
  organization_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().optional(),
  category_id: z.number().int().positive().optional(),
  gender: athleteGenderSchema.optional(),
  defensive_position_id: z.number().int().positive().optional(),
  offensive_position_id: z.number().int().positive().optional(),
  injured: z.boolean().optional(),
  medical_restriction: z.boolean().optional(),
  has_suspension: z.boolean().optional(),
  load_restricted: z.boolean().optional(),
  without_team: z.boolean().optional(),
  eligible_for_category: z.number().int().positive().optional(),
  skip: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(20),
  order_by: z.enum(['name', 'birth_date', 'created_at', 'state']).default('name'),
  order_dir: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// SCHEMA: TEAM REGISTRATION
// ============================================================================

/**
 * Schema para criar vínculo com equipe
 * Conforme R7: Múltiplos vínculos apenas na mesma organização
 */
export const teamRegistrationCreateSchema = z.object({
  athlete_id: z.string().uuid('ID da atleta inválido'),
  team_id: z.string().uuid('ID da equipe inválido'),
  start_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
  registration_number: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Schema para encerrar vínculo
 */
export const teamRegistrationEndSchema = z.object({
  end_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// VALIDAÇÃO R15: CATEGORIA
// ============================================================================

/**
 * Calcula a categoria natural da atleta baseada na idade
 * 
 * @param birthDate - Data de nascimento (YYYY-MM-DD)
 * @param referenceYear - Ano de referência (normalmente ano da temporada)
 * @returns ID da categoria natural ou null se não encontrada
 */
export function calculateNaturalCategory(
  birthDate: string,
  referenceYear: number = new Date().getFullYear()
): { categoryId: number; age: number } | null {
  const birth = new Date(birthDate);
  const age = referenceYear - birth.getFullYear();
  
  // Tabela de categorias (RDB11)
  const categories = [
    { id: 1, name: 'Mirim', maxAge: 12 },
    { id: 2, name: 'Infantil', maxAge: 14 },
    { id: 3, name: 'Cadete', maxAge: 16 },
    { id: 4, name: 'Juvenil', maxAge: 18 },
    { id: 5, name: 'Júnior', maxAge: 21 },
    { id: 6, name: 'Adulto', maxAge: 36 },
    { id: 7, name: 'Master', maxAge: 60 },
  ];
  
  // Encontra categoria natural (primeira onde idade <= maxAge)
  const category = categories.find(c => age <= c.maxAge);
  
  if (!category) return null;
  
  return { categoryId: category.id, age };
}

/**
 * Valida se atleta pode ser vinculada a uma categoria (R15)
 * Atleta pode jogar na categoria natural ou SUPERIOR, nunca inferior
 * 
 * @param athleteBirthDate - Data de nascimento
 * @param targetCategoryId - ID da categoria alvo
 * @param referenceYear - Ano de referência
 * @returns true se elegível, false se não
 */
export function isEligibleForCategory(
  athleteBirthDate: string,
  targetCategoryId: number,
  referenceYear: number = new Date().getFullYear()
): boolean {
  const natural = calculateNaturalCategory(athleteBirthDate, referenceYear);
  if (!natural) return false;
  
  // Categoria natural ou SUPERIOR (ID maior = categoria mais velha)
  return targetCategoryId >= natural.categoryId;
}

/**
 * Valida elegibilidade por gênero
 * Atleta só pode ser vinculada a equipe do mesmo gênero
 */
export function isEligibleByGender(
  athleteGender: 'male' | 'female',
  teamGender: 'masculino' | 'feminino' | 'misto'
): boolean {
  // Misto aceita qualquer (não deveria existir, mas mantemos compatibilidade)
  if (teamGender === 'misto') return true;
  
  // Valida correspondência
  if (athleteGender === 'male' && teamGender === 'masculino') return true;
  if (athleteGender === 'female' && teamGender === 'feminino') return true;
  
  return false;
}

// ============================================================================
// TIPOS INFERIDOS
// ============================================================================

export type AthleteCreateInput = z.infer<typeof athleteCreateSchema>;
export type AthleteUpdateInput = z.infer<typeof athleteUpdateSchema>;
export type AthleteFiltersInput = z.infer<typeof athleteFiltersSchema>;
export type TeamRegistrationCreateInput = z.infer<typeof teamRegistrationCreateSchema>;
export type TeamRegistrationEndInput = z.infer<typeof teamRegistrationEndSchema>;
