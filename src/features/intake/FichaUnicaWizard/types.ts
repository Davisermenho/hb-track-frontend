import { z } from 'zod';

// ============================================================================
// VALIDADORES CUSTOMIZADOS
// ============================================================================

const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;

  return parseInt(cleaned.charAt(9)) === digit1 && parseInt(cleaned.charAt(10)) === digit2;
};

const validateAge = (birthDate: string): boolean => {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 8 && age - 1 <= 60;
  }

  return age >= 8 && age <= 60;
};

// ============================================================================
// CONTACT SCHEMA
// ============================================================================

const contactSchema = z
  .object({
    contact_type: z.enum(['email', 'telefone']),
    contact_value: z.string().min(1, 'Contato obrigatório'),
    is_primary: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.contact_type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email inválido',
          path: ['contact_value'],
        });
      }
    }

    if (data.contact_type === 'telefone') {
      const digits = data.contact_value.replace(/\D/g, '');
      if (!/^\d{10,11}$/.test(digits)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Telefone inválido',
          path: ['contact_value'],
        });
      }
    }
  });

// ============================================================================
// DOCUMENT SCHEMA
// ============================================================================

const documentSchema = z
  .object({
    document_type: z.enum(['cpf', 'rg', 'cnh', 'certidao_nascimento']),
    document_number: z.string().min(1, 'Número do documento obrigatório'),
    issuing_authority: z.string().optional(),
    issue_date: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.document_type === 'cpf' && !validateCPF(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF inválido',
        path: ['document_number'],
      });
    }

    if (data.document_type === 'rg') {
      const rgDigits = data.document_number.replace(/\D/g, '');
      if (rgDigits.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'RG inválido',
          path: ['document_number'],
        });
      }
    }
  });

// ============================================================================
// ADDRESS SCHEMA
// ============================================================================

const addressSchema = z.object({
  address_type: z.literal('residencial_1').default('residencial_1'),
  street: z.string().min(3, 'Rua muito curta'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro muito curto'),
  city: z.string().min(2, 'Cidade muito curta'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)'),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  country: z.string().default('Brasil'),
});

// ============================================================================
// PERSON SCHEMA
// ============================================================================

export const personSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  last_name: z
    .string()
    .min(2, 'Sobrenome muito curto')
    .max(100, 'Sobrenome muito longo')
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),
  birth_date: z
    .string()
    .min(1, 'Data de nascimento obrigatória')
    .refine(validateAge, {
      message: 'Idade deve estar entre 8 e 60 anos',
    }),
  gender: z.enum(['masculino', 'feminino', 'outro']),
  nationality: z.string().default('Brasil'),
  notes: z.string().optional(),
  contacts: z
    .array(contactSchema)
    .min(2, 'Email e telefone principais são obrigatórios')
    .superRefine((contacts, ctx) => {
      const hasEmail = contacts.some((c) => c.contact_type === 'email' && !!c.contact_value);
      const hasPhone = contacts.some((c) => c.contact_type === 'telefone' && !!c.contact_value);

      if (!contacts[0] || contacts[0].contact_type !== 'email') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O primeiro contato deve ser o email principal',
          path: [0, 'contact_type'],
        });
      }

      if (!contacts[1] || contacts[1].contact_type !== 'telefone') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O segundo contato deve ser o telefone principal',
          path: [1, 'contact_type'],
        });
      }

      if (!hasEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe um email principal',
          path: [0, 'contact_value'],
        });
      }

      if (!hasPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe um telefone principal',
          path: [1, 'contact_value'],
        });
      }

      if (contacts[0] && contacts[0].is_primary === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Marque o email como principal',
          path: [0, 'is_primary'],
        });
      }

      if (contacts[1] && contacts[1].is_primary === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Marque o telefone como principal',
          path: [1, 'is_primary'],
        });
      }
    }),
  documents: z
    .array(documentSchema)
    .min(1, 'RG obrigatório')
    .superRefine((docs, ctx) => {
      if (!docs[0] || docs[0].document_type !== 'rg') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Documento principal deve ser RG',
          path: [0, 'document_type'],
        });
      }

      const seen = new Set<string>();
      docs.forEach((doc, index) => {
        if (seen.has(doc.document_type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Cada tipo de documento pode ser usado apenas uma vez',
            path: [index, 'document_type'],
          });
        } else {
          seen.add(doc.document_type);
        }
      });
    }),
  address: addressSchema.optional(),
  media: z
    .object({
      profile_photo_url: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
});

// ============================================================================
// USER SCHEMA
// ============================================================================

export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  role_id: z.number().min(1, 'Selecione um papel'),
});

// ============================================================================
// SEASON SCHEMA
// ============================================================================

export const seasonSchema = z
  .object({
    mode: z.enum(['select', 'create']),
    season_id: z.string().uuid().optional(),
    year: z.number().min(2020).max(2050).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'select' && !data.season_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione uma temporada',
        path: ['season_id'],
      });
    }
    if (data.mode === 'create' && !data.year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ano da temporada é obrigatório',
        path: ['year'],
      });
    }
  });

// ============================================================================
// ORGANIZATION SCHEMA
// ============================================================================

export const organizationSchema = z
  .object({
    mode: z.enum(['select', 'create']),
    organization_id: z.string().uuid().optional(),
    name: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'select' && !data.organization_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione uma organização',
        path: ['organization_id'],
      });
    }
    if (data.mode === 'create') {
      if (!data.name || data.name.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nome da organização é obrigatório (mín. 3 caracteres)',
          path: ['name'],
        });
      }
    }
  });

// ============================================================================
// TEAM SCHEMA
// ============================================================================

export const teamSchema = z
  .object({
    mode: z.enum(['select', 'create']),
    team_id: z.string().uuid().optional(),
    name: z.string().optional(),
    category_id: z.number().optional(),
    gender: z.enum(['masculino', 'feminino', 'misto']).optional(),
    organization_id: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'select' && !data.team_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione uma equipe',
        path: ['team_id'],
      });
    }
    if (data.mode === 'create') {
      if (!data.name || !data.category_id || !data.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Todos os campos da equipe são obrigatórios',
          path: ['name'],
        });
      }
    }
  });

// ============================================================================
// ATHLETE SCHEMA (COM REGRA DO GOLEIRO - RD13)
// ============================================================================

export const athleteSchema = z
  .object({
    create: z.boolean(),
    athlete_name: z.string().optional(),
    athlete_nickname: z.string().optional(),
    birth_date: z.string().optional(),
    shirt_number: z.number().min(1).max(99).optional(),
    schooling_id: z.number().optional(),
    guardian_name: z.string().optional(),
    guardian_phone: z.string().optional(),
    main_defensive_position_id: z.number().optional(),
    secondary_defensive_position_id: z.number().optional(),
    main_offensive_position_id: z.number().optional(),
    secondary_offensive_position_id: z.number().optional(),
  })
  .refine(
    (data) => {
      if (!data.create) return true;
      return !!data.athlete_name && !!data.birth_date && !!data.main_defensive_position_id;
    },
    {
      message: 'Nome, data de nascimento e posição defensiva são obrigatórios',
      path: ['athlete_name'],
    }
  )
  .refine(
    (data) => {
      const GOALKEEPER_POSITION_ID = 1;

      if (data.main_defensive_position_id === GOALKEEPER_POSITION_ID) {
        return !data.main_offensive_position_id && !data.secondary_offensive_position_id;
      } else if (data.create && data.main_defensive_position_id) {
        return !!data.main_offensive_position_id;
      }
      return true;
    },
    {
      message:
        'Goleiro não pode ter posições ofensivas. Outros jogadores devem ter posição ofensiva principal.',
      path: ['main_offensive_position_id'],
    }
  );

// ============================================================================
// MEMBERSHIP SCHEMA
// ============================================================================

export const membershipSchema = z.object({
  role_id: z.number(),
  start_at: z.string(),
});

// ============================================================================
// REGISTRATION SCHEMA
// ============================================================================

export const registrationSchema = z.object({
  start_at: z.string(),
  end_at: z.string().optional(),
});

// ============================================================================
// STAFF SCHEMAS (Fluxo de criação de estrutura organizacional)
// ============================================================================

export const staffSeasonSchema = z.object({
  title: z.string().min(3, 'Título da temporada obrigatório (mín. 3 caracteres)'),
  year: z.number().min(2025).max(2027, 'Ano deve estar entre 2025 e 2027'),
  notes: z.string().optional(),
});

export const staffOrganizationSchema = z.object({
  name: z.string().min(3, 'Nome do clube obrigatório (mín. 3 caracteres)'),
  acronym: z.string().optional(),
  address: z.string().optional(),
  season_id: z.string().uuid('Selecione uma temporada'),
  logo_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const staffTeamSchema = z.object({
  name: z.string().min(2, 'Nome da equipe obrigatório (mín. 2 caracteres)'),
  category_id: z.coerce.number().min(1, 'Selecione uma categoria'),
  gender: z.enum(['masculino', 'feminino'] as const, {
    message: 'Selecione o gênero da equipe'
  }),
  season_id: z.string().uuid('Selecione uma temporada'),
  organization_id: z.string().uuid('Selecione uma organização'),
  notes: z.string().optional(),
});

// ============================================================================
// MAIN PAYLOAD SCHEMA
// ============================================================================

export const fichaUnicaSchema = z
  .object({
    flowType: z.enum(['staff', 'user']),
    // Staff fields
    staffChoice: z.enum(['season', 'organization', 'team']).optional(),
    staffSeason: staffSeasonSchema.optional(),
    staffOrganization: staffOrganizationSchema.optional(),
    staffTeam: staffTeamSchema.optional(),
    // User fields
    userRole: z.enum(['atleta', 'treinador', 'coordenador', 'dirigente']).optional(),
    person: personSchema.optional(),
    create_user: z.boolean().optional(),
    user: userSchema.optional(),
    season: seasonSchema.optional(),
    organization: organizationSchema.optional(),
    membership: membershipSchema.optional(),
    team: teamSchema.optional(),
    athlete: athleteSchema.optional(),
    registration: registrationSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.create_user) return !!data.user;
      return true;
    },
    {
      message: 'Dados de usuário obrigatórios quando criar acesso estiver marcado',
      path: ['user'],
    }
  )
  .refine(
    (data) => {
      if (data.organization?.mode === 'create') {
        return !!data.season;
      }
      return true;
    },
    {
      message: 'Temporada é obrigatória ao criar organização',
      path: ['season'],
    }
  )
  .refine(
    (data) => {
      if (data.team?.mode === 'create') {
        return !!data.season;
      }
      return true;
    },
    {
      message: 'Temporada é obrigatória ao criar equipe',
      path: ['season'],
    }
  );

export type FichaUnicaPayload = z.infer<typeof fichaUnicaSchema>;

// ============================================================================
// RESPONSE TYPE
// ============================================================================

export interface FichaUnicaResponse {
  person_id: string;
  user_id?: string;
  season_id?: string;
  organization_id?: string;
  team_id?: string;
  athlete_id?: string;
  membership_id?: string;
  registration_id?: string;
}

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

export interface StepDefinition {
  id: string;
  label: string;
  description: string;
  fields: string[];
}

// Steps para fluxo STAFF
export const STAFF_WIZARD_STEPS: StepDefinition[] = [
  {
    id: 'choose-flow',
    label: 'Tipo de Cadastro',
    description: 'Escolha entre Staff ou Usuário',
    fields: ['flowType'],
  },
  {
    id: 'staff-choice',
    label: 'Escolha',
    description: 'Temporada, Organização ou Equipe',
    fields: ['staffChoice'],
  },
];

// Fluxos condicionais baseados em staffChoice
export const STAFF_SEASON_FLOW: StepDefinition[] = [
  ...STAFF_WIZARD_STEPS,
  {
    id: 'staff-season',
    label: 'Temporada',
    description: 'Criar nova temporada',
    fields: ['staffSeason.title', 'staffSeason.year'],
  },
  {
    id: 'success',
    label: 'Concluído',
    description: 'Cadastro finalizado',
    fields: [],
  },
];

export const STAFF_ORG_FLOW: StepDefinition[] = [
  ...STAFF_WIZARD_STEPS,
  {
    id: 'staff-organization',
    label: 'Organização',
    description: 'Criar novo clube',
    fields: ['staffOrganization.name', 'staffOrganization.season_id'],
  },
  {
    id: 'success',
    label: 'Concluído',
    description: 'Cadastro finalizado',
    fields: [],
  },
];

export const STAFF_TEAM_FLOW: StepDefinition[] = [
  ...STAFF_WIZARD_STEPS,
  {
    id: 'staff-team',
    label: 'Equipe',
    description: 'Criar nova equipe',
    fields: ['staffTeam.name', 'staffTeam.season_id', 'staffTeam.organization_id', 'staffTeam.category_id', 'staffTeam.gender'],
  },
  {
    id: 'success',
    label: 'Concluído',
    description: 'Cadastro finalizado',
    fields: [],
  },
];

// Steps para fluxo USER
export const USER_WIZARD_STEPS: StepDefinition[] = [
  {
    id: 'choose-flow',
    label: 'Tipo de Cadastro',
    description: 'Escolha entre Staff ou Usuário',
    fields: ['flowType'],
  },
  {
    id: 'user-role',
    label: 'Papel',
    description: 'Escolha o papel do usuário',
    fields: ['userRole'],
  },
  {
    id: 'user-season-org',
    label: 'Temporada e Organização',
    description: 'Selecione temporada e organização',
    fields: ['season.season_id', 'organization.organization_id'],
  },
  {
    id: 'user-personal-data',
    label: 'Dados Pessoais',
    description: 'Preencha os dados da pessoa',
    fields: [
      'person.first_name',
      'person.last_name',
      'person.birth_date',
      'person.gender',
      'person.contacts.0.contact_value',
      'person.contacts.1.contact_value',
      'person.documents.0.document_number',
    ],
  },
  {
    id: 'success',
    label: 'Concluído',
    description: 'Cadastro finalizado',
    fields: [],
  },
];

// DEPRECATED - manter por compatibilidade temporária
export const WIZARD_STEPS: StepDefinition[] = [
  {
    id: 'person',
    label: 'Dados Pessoais',
    description: 'Informações básicas da pessoa',
    fields: [
      'person.first_name',
      'person.last_name',
      'person.birth_date',
      'person.gender',
      'person.contacts.0.contact_value',
      'person.contacts.1.contact_value',
      'person.documents',
    ],
  },
  {
    id: 'access',
    label: 'Acesso ao Sistema',
    description: 'Criar usuário e definir permissões',
    fields: ['user.email', 'user.role_id', 'create_user'],
  },
  {
    id: 'season',
    label: 'Temporada',
    description: 'Criar ou selecionar temporada',
    fields: ['season'],
  },
  {
    id: 'organization',
    label: 'Organização',
    description: 'Criar ou selecionar organização',
    fields: ['organization', 'membership'],
  },
  {
    id: 'team',
    label: 'Equipe',
    description: 'Vincular a uma equipe (opcional)',
    fields: [],
  },
  {
    id: 'athlete',
    label: 'Atleta',
    description: 'Cadastrar como atleta (opcional)',
    fields: [],
  },
  {
    id: 'review',
    label: 'Revisão',
    description: 'Revisar e confirmar dados',
    fields: [],
  },
];
