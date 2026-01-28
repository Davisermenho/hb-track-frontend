/**
 * Hook para gerenciamento do estado da Ficha Única de Cadastro
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  UnifiedRegistrationFormData,
  RegistrationType,
  ValidationErrors,
  OffensivePosition,
  DefensivePosition,
  Category,
  SchoolingLevel,
  Organization,
  Team,
} from '../../types/unified-registration';
import {
  validateForm,
  validateCoreSection,
  canSaveWithCoreOnly,
  validateCPF,
  validateRG,
  validatePhone,
  validateEmail,
  validateCEP,
  validateBirthDate,
} from '@/lib/validations/unified-registration';

// Estado inicial do formulário
const INITIAL_FORM_STATE: UnifiedRegistrationFormData = {
  registration_type: undefined,
  create_user: false,
  core: {
    full_name: '',
    birth_date: '',
    gender: undefined,
    email: undefined,
  },
  documents: {
    rg: undefined,
    cpf: undefined,
  },
  contacts: {
    phone: '',
    whatsapp: undefined,
  },
  address: {
    zip_code: undefined,
    street: undefined,
    number: undefined,
    complement: undefined,
    neighborhood: undefined,
    city: undefined,
    state: undefined,
  },
  athlete: undefined,
  organization: undefined,
  team: undefined,
  photo: undefined,
};

// Estado inicial para dados de atleta
const INITIAL_ATHLETE_STATE = {
  main_offensive_position_id: undefined,
  secondary_offensive_position_id: undefined,
  main_defensive_position_id: undefined,
  secondary_defensive_position_id: undefined,
  schooling_level_id: undefined,
  shirt_number: undefined,
  guardian_name: undefined,
  guardian_phone: undefined,
};

type LookupState = {
  offensivePositions: any[];
  defensivePositions: any[];
  categories: any[];
  schoolingLevels: any[];
  organizations: any[];
  teams: any[];
};

interface UseUnifiedRegistrationFormReturn {
  // Estado
  formData: UnifiedRegistrationFormData;
  errors: ValidationErrors;
  touched: Set<string>;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Dados de lookup
  lookupData: LookupState;
  setLookupData: React.Dispatch<React.SetStateAction<LookupState>>;
  
  // Ações
  updateField: <K extends keyof UnifiedRegistrationFormData>(
    section: K,
    field: string,
    value: unknown
  ) => void;
  updateNestedField: (path: string, value: unknown) => void;
  setRegistrationType: (type: RegistrationType) => void;
  setTouched: (field: string) => void;
  resetForm: () => void;
  setSubmitting: (value: boolean) => void;
  
  // Validação
  validateField: (path: string) => string | undefined;
  validateSection: (section: string) => boolean;
  isFormValid: () => boolean;
  canSave: () => boolean;
  
  // Helpers
  isGoalkeeper: boolean;
  shouldShowAthleteSection: boolean;
  shouldShowOrganizationSection: boolean;
  shouldShowTeamSection: boolean;
  willCreateUser: boolean;
  availableRegistrationTypes: RegistrationType[];
}

/**
 * Hook principal para Ficha Única
 */
export function useUnifiedRegistrationForm(
  userRole: string,
  initialData?: Partial<UnifiedRegistrationFormData>
): UseUnifiedRegistrationFormReturn {
  // Estado do formulário
  const [formData, setFormData] = useState<UnifiedRegistrationFormData>(() => ({
    ...INITIAL_FORM_STATE,
    ...initialData,
  }));
  
  // Estado de erros
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Campos tocados (para mostrar erros apenas após interação)
  const [touched, setTouchedState] = useState<Set<string>>(new Set());
  
  // Estado de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dados de lookup
  const [lookupData, setLookupData] = useState<LookupState>({
    offensivePositions: [],
    defensivePositions: [],
    categories: [],
    schoolingLevels: [],
    organizations: [],
    teams: [],
  });
  
  // Verifica se o formulário foi modificado
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify({ ...INITIAL_FORM_STATE, ...initialData });
  }, [formData, initialData]);
  
  // Tipos de cadastro disponíveis baseado no papel do usuário
  const availableRegistrationTypes = useMemo((): RegistrationType[] => {
    const permissions: Record<string, RegistrationType[]> = {
      super_admin: ['atleta', 'treinador', 'coordenador', 'dirigente'],
      dirigente: ['atleta', 'treinador', 'coordenador'],
      coordenador: ['atleta', 'treinador'],
      treinador: ['atleta'],
    };
    
    return permissions[userRole] || [];
  }, [userRole]);
  
  // Verifica se é goleira (posição defensiva id=5)
  const isGoalkeeper = useMemo(() => {
    return formData.athlete?.main_defensive_position_id === 5;
  }, [formData.athlete?.main_defensive_position_id]);
  
  // Verifica se deve mostrar seção de atleta
  const shouldShowAthleteSection = useMemo(() => {
    return formData.registration_type === 'atleta';
  }, [formData.registration_type]);
  
  // Verifica se deve mostrar seção de organização
  const shouldShowOrganizationSection = useMemo(() => {
    const type = formData.registration_type;
    return type === 'dirigente' || type === 'coordenador' || type === 'treinador';
  }, [formData.registration_type]);
  
  // Verifica se deve mostrar seção de equipe
  const shouldShowTeamSection = useMemo(() => {
    const type = formData.registration_type;
    return type === 'atleta' || type === 'treinador';
  }, [formData.registration_type]);
  
  // Verifica se vai criar usuário (email preenchido)
  const willCreateUser = useMemo(() => {
    return Boolean(formData.core.email && validateEmail(formData.core.email));
  }, [formData.core.email]);
  
  // Atualizar email e flag de criação de usuário
  const updateCoreEmail = useCallback((email: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      create_user: Boolean(email && validateEmail(email)),
      core: {
        ...prev.core,
        email,
      },
    }));
  }, []);
  
  // Atualizar campo de uma seção
  const updateField = useCallback(<K extends keyof UnifiedRegistrationFormData>(
    section: K,
    field: string,
    value: unknown
  ) => {
    // Tratamento especial para email (afeta create_user)
    if (section === 'core' && field === 'email') {
      updateCoreEmail(value as string | undefined);
      return;
    }
    
    setFormData(prev => {
      const sectionData = prev[section];
      
      if (typeof sectionData === 'object' && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value,
          },
        };
      }
      
      return {
        ...prev,
        [section]: value,
      };
    });
  }, [updateCoreEmail]);
  
  // Atualizar campo aninhado por path (ex: "athlete.shirt_number")
  const updateNestedField = useCallback((path: string, value: unknown) => {
    const parts = path.split('.');
    
    setFormData(prev => {
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        }
        current[part] = { ...(current[part] as Record<string, unknown>) };
        current = current[part] as Record<string, unknown>;
      }
      
      current[parts[parts.length - 1]] = value;
      
      return newData as UnifiedRegistrationFormData;
    });
  }, []);
  
  // Definir tipo de cadastro
  const setRegistrationType = useCallback((type: RegistrationType) => {
    setFormData(prev => {
      const newData = { ...prev, registration_type: type };
      
      // Inicializar seção de atleta se for atleta
      if (type === 'atleta' && !prev.athlete) {
        newData.athlete = { ...INITIAL_ATHLETE_STATE };
      }
      
      // Limpar seção de atleta se não for atleta
      if (type !== 'atleta') {
        newData.athlete = undefined;
      }
      
      // Inicializar seção de organização se necessário
      if (['dirigente', 'coordenador', 'treinador'].includes(type) && !prev.organization) {
        newData.organization = {
          existing_organization_id: undefined,
          create_organization: undefined,
        };
      }
      
      // Inicializar seção de equipe se necessário
      if (['atleta', 'treinador'].includes(type) && !prev.team) {
        newData.team = {
          existing_team_id: undefined,
          create_team: undefined,
        };
      }
      
      return newData;
    });
  }, []);
  
  // Marcar campo como tocado
  const setTouched = useCallback((field: string) => {
    setTouchedState(prev => {
      const newSet = new Set(prev);
      newSet.add(field);
      return newSet;
    });
  }, []);
  
  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormData({ ...INITIAL_FORM_STATE, ...initialData });
    setErrors({});
    setTouchedState(new Set());
    setIsSubmitting(false);
  }, [initialData]);
  
  // Definir estado de submissão
  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);
  
  // Validar campo individual
  const validateField = useCallback((path: string): string | undefined => {
    const parts = path.split('.');
    const section = parts[0];
    const field = parts.slice(1).join('.');
    
    // Obter valor do campo
    let value: unknown = formData;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      }
    }
    
    // Validações específicas por campo
    switch (path) {
      case 'core.full_name':
        if (!value || (typeof value === 'string' && value.trim().length < 3)) {
          return 'Nome completo é obrigatório (mínimo 3 caracteres)';
        }
        break;
        
      case 'core.birth_date':
        const birthResult = validateBirthDate(value as string);
        if (!birthResult.valid) return birthResult.error;
        break;
        
      case 'core.gender':
        if (!value) return 'Gênero é obrigatório';
        break;
        
      case 'core.email':
        if (value && !validateEmail(value as string)) {
          return 'Email inválido';
        }
        break;
        
      case 'documents.cpf':
        if (value && !validateCPF(value as string)) {
          return 'CPF inválido';
        }
        break;
        
      case 'documents.rg':
        if (formData.registration_type === 'atleta' && !value) {
          return 'RG é obrigatório para atletas';
        }
        if (value && !validateRG(value as string)) {
          return 'RG inválido';
        }
        break;
        
      case 'contacts.phone':
        if (formData.registration_type === 'atleta' && !value) {
          return 'Telefone é obrigatório para atletas';
        }
        if (value && !validatePhone(value as string)) {
          return 'Telefone inválido';
        }
        break;
        
      case 'contacts.whatsapp':
        if (value && !validatePhone(value as string)) {
          return 'WhatsApp inválido';
        }
        break;
        
      case 'address.zip_code':
        if (value && !validateCEP(value as string)) {
          return 'CEP inválido';
        }
        break;
        
      case 'athlete.main_defensive_position_id':
        if (formData.registration_type === 'atleta' && !value) {
          return 'Posição defensiva principal é obrigatória';
        }
        break;
        
      case 'athlete.main_offensive_position_id':
        if (formData.registration_type === 'atleta' && !isGoalkeeper && !value) {
          return 'Posição ofensiva principal é obrigatória (exceto goleiras)';
        }
        if (isGoalkeeper && value) {
          return 'Goleiras não podem ter posição ofensiva';
        }
        break;
    }
    
    return undefined;
  }, [formData, isGoalkeeper]);
  
  // Validar seção
  const validateSection = useCallback((section: string): boolean => {
    const validation = validateForm(formData);
    const sectionKey = section as keyof typeof validation.sections;
    return validation.sections[sectionKey]?.isValid ?? true;
  }, [formData]);
  
  // Verificar se formulário é válido
  const isFormValid = useCallback((): boolean => {
    const validation = validateForm(formData);
    // Converter array de erros em objeto ValidationErrors
    const errorsObj: ValidationErrors = {};
    validation.errors.forEach((err, idx) => {
      errorsObj[`error_${idx}`] = err;
    });
    setErrors(errorsObj);
    return validation.isValid;
  }, [formData]);
  
  // Verificar se pode salvar (núcleo obrigatório válido)
  const canSave = useCallback((): boolean => {
    return canSaveWithCoreOnly(formData);
  }, [formData]);
  
  return {
    // Estado
    formData,
    errors,
    touched,
    isSubmitting,
    isDirty,
    
    // Dados de lookup
    lookupData,
    setLookupData,
    
    // Ações
    updateField,
    updateNestedField,
    setRegistrationType,
    setTouched,
    resetForm,
    setSubmitting,
    
    // Validação
    validateField,
    validateSection,
    isFormValid,
    canSave,
    
    // Helpers
    isGoalkeeper,
    shouldShowAthleteSection,
    shouldShowOrganizationSection,
    shouldShowTeamSection,
    willCreateUser,
    availableRegistrationTypes,
  };
}

/**
 * Hook para buscar dados de lookup
 */
export function useUnifiedRegistrationLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchLookupData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [
        offensivePositions,
        defensivePositions,
        categories,
        schoolingLevels,
        organizations,
      ] = await Promise.all([
        import('@/lib/api/unified-registration').then(m => m.getOffensivePositions()),
        import('@/lib/api/unified-registration').then(m => m.getDefensivePositions()),
        import('@/lib/api/unified-registration').then(m => m.getCategories()),
        import('@/lib/api/unified-registration').then(m => m.getSchoolingLevels()),
        import('@/lib/api/unified-registration').then(m => m.getOrganizations()),
      ]);
      
      return {
        offensivePositions,
        defensivePositions,
        categories,
        schoolingLevels,
        organizations,
        teams: [] as Team[],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const fetchTeamsByOrganization = useCallback(async (organizationId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { getTeamsByOrganization } = await import('@/lib/api/unified-registration');
      return await getTeamsByOrganization(organizationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar equipes';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    isLoading,
    error,
    fetchLookupData,
    fetchTeamsByOrganization,
  };
}
