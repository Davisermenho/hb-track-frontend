/**
 * Validações para Ficha Única de Cadastro
 * 
 * Validações UX apenas - backend é a fonte de verdade
 */

import type {
  UnifiedRegistrationFormData,
  RegistrationType,
  ValidationErrors,
  SectionValidation,
} from '../../src/types/unified-registration';

// ============================================================================
// VALIDADORES DE CAMPO
// ============================================================================

/**
 * Valida CPF (formato e dígitos verificadores)
 */
export function validateCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

/**
 * Valida RG (formato básico - apenas números e X)
 */
export function validateRG(rg: string): boolean {
  const cleanRg = rg.replace(/\D/g, '').toUpperCase();
  // RG deve ter entre 5 e 14 caracteres
  return cleanRg.length >= 5 && cleanRg.length <= 14;
}

/**
 * Valida telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // Telefone deve ter 10 ou 11 dígitos (com DDD)
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida data de nascimento (8-70 anos)
 */
export function validateBirthDate(birthDate: string): { valid: boolean; age?: number; error?: string } {
  if (!birthDate) {
    return { valid: false, error: 'Data de nascimento é obrigatória' };
  }
  
  const date = new Date(birthDate);
  const today = new Date();
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Data inválida' };
  }
  
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  
  if (actualAge < 8) {
    return { valid: false, age: actualAge, error: 'Idade mínima é 8 anos' };
  }
  
  if (actualAge > 70) {
    return { valid: false, age: actualAge, error: 'Idade máxima é 70 anos' };
  }
  
  return { valid: true, age: actualAge };
}

/**
 * Valida CEP
 */
export function validateCEP(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8;
}

/**
 * Valida nome completo (mínimo 3 caracteres, pelo menos 2 palavras)
 */
export function validateFullName(name: string): boolean {
  const trimmedName = name.trim();
  if (trimmedName.length < 3) return false;
  
  const words = trimmedName.split(/\s+/).filter(w => w.length > 0);
  return words.length >= 2;
}

// ============================================================================
// FORMATADORES
// ============================================================================

/**
 * Formata CPF (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
}

/**
 * Formata telefone ((00) 00000-0000)
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
}

/**
 * Formata CEP (00000-000)
 */
export function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  return clean.replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);
}

/**
 * Formata RG (remove caracteres especiais exceto X)
 */
export function formatRG(rg: string): string {
  return rg.replace(/[^0-9Xx]/g, '').toUpperCase();
}

// ============================================================================
// VALIDAÇÃO POR SEÇÃO
// ============================================================================

/**
 * Valida seção Núcleo Obrigatório
 */
export function validateCoreSection(data: UnifiedRegistrationFormData): SectionValidation {
  const errors: ValidationErrors = {};
  
  // Nome completo
  if (!data.core.full_name || !validateFullName(data.core.full_name)) {
    errors['core.full_name'] = 'Nome completo é obrigatório (nome e sobrenome)';
  }
  
  // Data de nascimento
  const birthValidation = validateBirthDate(data.core.birth_date);
  if (!birthValidation.valid) {
    errors['core.birth_date'] = birthValidation.error || 'Data inválida';
  }
  
  // Gênero
  if (!data.core.gender) {
    errors['core.gender'] = 'Gênero é obrigatório';
  }
  
  // Email (opcional, mas se preenchido deve ser válido)
  if (data.core.email && !validateEmail(data.core.email)) {
    errors['core.email'] = 'Email inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida seção Documentos
 */
export function validateDocumentsSection(
  data: UnifiedRegistrationFormData,
  registrationType?: RegistrationType
): SectionValidation {
  const errors: ValidationErrors = {};
  
  // RG é obrigatório para atletas
  if (registrationType === 'atleta') {
    if (!data.documents.rg) {
      errors['documents.rg'] = 'RG é obrigatório para atletas';
    } else if (!validateRG(data.documents.rg)) {
      errors['documents.rg'] = 'RG inválido';
    }
  } else if (data.documents.rg && !validateRG(data.documents.rg)) {
    errors['documents.rg'] = 'RG inválido';
  }
  
  // CPF é opcional, mas se preenchido deve ser válido
  if (data.documents.cpf && !validateCPF(data.documents.cpf)) {
    errors['documents.cpf'] = 'CPF inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida seção Contatos
 */
export function validateContactsSection(
  data: UnifiedRegistrationFormData,
  registrationType?: RegistrationType
): SectionValidation {
  const errors: ValidationErrors = {};
  
  // Telefone é obrigatório para atletas
  if (registrationType === 'atleta') {
    if (!data.contacts.phone) {
      errors['contacts.phone'] = 'Telefone é obrigatório para atletas';
    } else if (!validatePhone(data.contacts.phone)) {
      errors['contacts.phone'] = 'Telefone inválido';
    }
  } else if (data.contacts.phone && !validatePhone(data.contacts.phone)) {
    errors['contacts.phone'] = 'Telefone inválido';
  }
  
  // WhatsApp é opcional, mas se preenchido deve ser válido
  if (data.contacts.whatsapp && !validatePhone(data.contacts.whatsapp)) {
    errors['contacts.whatsapp'] = 'WhatsApp inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida seção Endereço
 */
export function validateAddressSection(data: UnifiedRegistrationFormData): SectionValidation {
  const errors: ValidationErrors = {};
  
  // CEP é opcional, mas se preenchido deve ser válido
  if (data.address.zip_code && !validateCEP(data.address.zip_code)) {
    errors['address.zip_code'] = 'CEP inválido';
  }
  
  // Se CEP preenchido, cidade e estado são obrigatórios
  if (data.address.zip_code && validateCEP(data.address.zip_code)) {
    if (!data.address.city) {
      errors['address.city'] = 'Cidade é obrigatória';
    }
    if (!data.address.state) {
      errors['address.state'] = 'Estado é obrigatório';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida seção Dados de Atleta
 */
export function validateAthleteSection(data: UnifiedRegistrationFormData): SectionValidation {
  const errors: ValidationErrors = {};
  
  if (!data.athlete) {
    return { isValid: true, errors: {} };
  }
  
  // Posição defensiva principal é obrigatória
  if (!data.athlete.main_defensive_position_id) {
    errors['athlete.main_defensive_position_id'] = 'Posição defensiva principal é obrigatória';
  }
  
  // RD13: Goleira (id=5) não pode ter posição ofensiva
  const isGoalkeeper = data.athlete.main_defensive_position_id === 5;
  
  if (isGoalkeeper) {
    if (data.athlete.main_offensive_position_id) {
      errors['athlete.main_offensive_position_id'] = 'Goleiras não podem ter posição ofensiva';
    }
  } else {
    // Não-goleiras devem ter posição ofensiva principal
    if (!data.athlete.main_offensive_position_id) {
      errors['athlete.main_offensive_position_id'] = 'Posição ofensiva principal é obrigatória (exceto goleiras)';
    }
  }
  
  // Número da camisa (1-99)
  if (data.athlete.shirt_number !== undefined && data.athlete.shirt_number !== null) {
    if (data.athlete.shirt_number < 1 || data.athlete.shirt_number > 99) {
      errors['athlete.shirt_number'] = 'Número da camisa deve ser entre 1 e 99';
    }
  }
  
  // Telefone do responsável (se preenchido)
  if (data.athlete.guardian_phone && !validatePhone(data.athlete.guardian_phone)) {
    errors['athlete.guardian_phone'] = 'Telefone do responsável inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida seção Nova Equipe
 */
export function validateNewTeamSection(data: UnifiedRegistrationFormData): SectionValidation {
  const errors: ValidationErrors = {};
  
  if (!data.team?.create_team) {
    return { isValid: true, errors: {} };
  }
  
  const { create_team } = data.team;
  
  if (!create_team.name || create_team.name.trim().length < 2) {
    errors['team.create_team.name'] = 'Nome da equipe é obrigatório (mínimo 2 caracteres)';
  }
  
  if (!create_team.category_id) {
    errors['team.create_team.category_id'] = 'Categoria é obrigatória';
  }
  
  if (!create_team.gender) {
    errors['team.create_team.gender'] = 'Gênero da equipe é obrigatório';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida seção Nova Organização
 */
export function validateNewOrganizationSection(data: UnifiedRegistrationFormData): SectionValidation {
  const errors: ValidationErrors = {};
  
  if (!data.organization?.create_organization) {
    return { isValid: true, errors: {} };
  }
  
  const { create_organization } = data.organization;
  
  if (!create_organization.name || create_organization.name.trim().length < 2) {
    errors['organization.create_organization.name'] = 'Nome da organização é obrigatório';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// VALIDAÇÃO COMPLETA
// ============================================================================

/**
 * Valida formulário completo
 */
export function validateForm(data: UnifiedRegistrationFormData): {
  isValid: boolean;
  errors: ValidationErrors;
  sections: {
    core: SectionValidation;
    documents: SectionValidation;
    contacts: SectionValidation;
    address: SectionValidation;
    athlete: SectionValidation;
    newTeam: SectionValidation;
    newOrganization: SectionValidation;
  };
} {
  const sections = {
    core: validateCoreSection(data),
    documents: validateDocumentsSection(data, data.registration_type),
    contacts: validateContactsSection(data, data.registration_type),
    address: validateAddressSection(data),
    athlete: data.registration_type === 'atleta' 
      ? validateAthleteSection(data) 
      : { isValid: true, errors: {} },
    newTeam: validateNewTeamSection(data),
    newOrganization: validateNewOrganizationSection(data),
  };
  
  const allErrors = {
    ...sections.core.errors,
    ...sections.documents.errors,
    ...sections.contacts.errors,
    ...sections.address.errors,
    ...sections.athlete.errors,
    ...sections.newTeam.errors,
    ...sections.newOrganization.errors,
  };
  
  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    sections,
  };
}

/**
 * Verifica se pode salvar com apenas núcleo obrigatório
 */
export function canSaveWithCoreOnly(data: UnifiedRegistrationFormData): boolean {
  const coreValidation = validateCoreSection(data);
  return coreValidation.isValid;
}
