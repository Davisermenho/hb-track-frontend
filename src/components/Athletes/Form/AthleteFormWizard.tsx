'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { AthleteFormData, ATHLETE_VALIDATION } from '../../../types/athlete-form';

// RD13: ID=5 é Goleira (constante local)
const GOALKEEPER_POSITION_ID = 5;
import AthleteFormStep1 from './AthleteFormStep1';
import AthleteFormStep2 from './AthleteFormStep2';
import AthleteFormStep3 from './AthleteFormStep3';
import AthleteFormStep4 from './AthleteFormStep4';
import AthleteFormStep5 from './AthleteFormStep5';
import AthleteFormStep6 from './AthleteFormStep6';
import AthleteFormStep7 from './AthleteFormStep7';
import { athletesService } from '@/lib/api';

interface AthleteFormWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: AthleteFormData;
}

const STEPS = [
  { number: 1, title: 'Dados Pessoais', description: 'Nome, nascimento e gênero' },
  { number: 2, title: 'Documentos', description: 'CPF e RG' },
  { number: 3, title: 'Contatos', description: 'Telefone, email e responsável' },
  { number: 4, title: 'Endereço', description: 'CEP e localização' },
  { number: 5, title: 'Dados Esportivos', description: 'Posições e escolaridade' },
  { number: 6, title: 'Acesso ao Sistema', description: 'Login opcional' },
  { number: 7, title: 'Vínculo com Equipe', description: 'Registro opcional' },
];

const initialFormData: AthleteFormData = {
  // Step 1
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: 'feminino',
  athlete_nickname: '',
  nationality: 'brasileira',
  // Step 2
  athlete_cpf: '',
  athlete_rg: '',
  // Step 3
  phone: '',
  email_contact: '',
  guardian_name: '',
  guardian_phone: '',
  // Step 4
  zip_code: '',
  street: '',
  address_number: '',
  address_complement: '',
  neighborhood: '',
  city: '',
  state_address: '',
  // Step 5
  shirt_number: undefined,
  main_defensive_position_id: undefined,
  secondary_defensive_position_id: undefined,
  main_offensive_position_id: undefined,
  secondary_offensive_position_id: undefined,
  schooling_id: undefined,
  // Step 6
  create_user: false,
  user_email: '',
  password: '',
  password_confirmation: '',
  // Step 7
  create_team_registration: false,
  team_id: undefined,
  registration_date: '',
};

export default function AthleteFormWizard({ isOpen, onClose, onSuccess, editData }: AthleteFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AthleteFormData>(editData || initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof AthleteFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário digita
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Dados Pessoais
        if (!formData.first_name?.trim()) {
          newErrors.first_name = 'Nome é obrigatório';
        } else if (formData.first_name.length < ATHLETE_VALIDATION.MIN_NAME_LENGTH) {
          newErrors.first_name = `Nome deve ter pelo menos ${ATHLETE_VALIDATION.MIN_NAME_LENGTH} caracteres`;
        }
        if (!formData.last_name?.trim()) {
          newErrors.last_name = 'Sobrenome é obrigatório';
        }
        if (!formData.birth_date) {
          newErrors.birth_date = 'Data de nascimento é obrigatória';
        }
        if (!formData.gender) {
          newErrors.gender = 'Gênero é obrigatório';
        }
        break;

      case 2: // Documentos
        // CPF e RG são opcionais, mas se preenchidos devem ter formato válido
        if (formData.athlete_cpf && formData.athlete_cpf.replace(/\D/g, '').length !== 11) {
          newErrors.athlete_cpf = 'CPF deve ter 11 dígitos';
        }
        break;

      case 3: // Contatos
        // Email deve ser válido se preenchido
        if (formData.email_contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contact)) {
          newErrors.email_contact = 'E-mail inválido';
        }
        break;

      case 4: // Endereço
        // Campos opcionais
        break;

      case 5: // Dados Esportivos
        // main_defensive_position_id é obrigatório
        if (!formData.main_defensive_position_id) {
          newErrors.main_defensive_position_id = 'Posição defensiva é obrigatória';
        }
        // RD13: Goleira não pode ter posições ofensivas
        else if (formData.main_defensive_position_id === GOALKEEPER_POSITION_ID) {
          if (formData.main_offensive_position_id || formData.secondary_offensive_position_id) {
            newErrors.main_offensive_position_id = 'Goleiras não podem ter posições ofensivas';
          }
        }
        // RD13: Atletas de linha DEVEM ter posição ofensiva
        else {
          if (!formData.main_offensive_position_id) {
            newErrors.main_offensive_position_id = 'Atletas de linha devem ter uma posição ofensiva';
          }
        }
        break;

      case 6: // Acesso ao Sistema
        if (formData.create_user) {
          if (!formData.user_email?.trim()) {
            newErrors.user_email = 'E-mail de login é obrigatório';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_email)) {
            newErrors.user_email = 'E-mail inválido';
          }
          if (!formData.password) {
            newErrors.password = 'Senha é obrigatória';
          } else if (formData.password.length < ATHLETE_VALIDATION.MIN_PASSWORD_LENGTH) {
            newErrors.password = `Senha deve ter pelo menos ${ATHLETE_VALIDATION.MIN_PASSWORD_LENGTH} caracteres`;
          }
          if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Senhas não conferem';
          }
        }
        break;

      case 7: // Vínculo com Equipe
        if (formData.create_team_registration) {
          if (!formData.team_id) {
            newErrors.team_id = 'Selecione uma equipe';
          }
          if (!formData.registration_date) {
            newErrors.registration_date = 'Data de registro é obrigatória';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Validar último step
    if (!validateStep(currentStep)) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Preparar dados para envio no formato do backend (AthleteCreate)
      const athleteData: any = {
        // Nome completo (concatenado)
        athlete_name: `${formData.first_name} ${formData.last_name}`.trim(),
        birth_date: formData.birth_date,
        
        // Documentos - OBRIGATÓRIOS (remover formatação)
        athlete_cpf: formData.athlete_cpf?.replace(/\D/g, '') || '',
        athlete_rg: formData.athlete_rg?.replace(/\D/g, '') || '',
        
        // Contatos
        athlete_phone: formData.phone?.replace(/\D/g, '') || '',
        athlete_email: formData.email_contact || null,
        
        // Posições - main_defensive_position_id é OBRIGATÓRIO
        main_defensive_position_id: formData.main_defensive_position_id || 1, // Default se não selecionado
        secondary_defensive_position_id: formData.secondary_defensive_position_id || null,
        main_offensive_position_id: formData.main_offensive_position_id || null,
        secondary_offensive_position_id: formData.secondary_offensive_position_id || null,
        
        // Opcionais
        athlete_nickname: formData.athlete_nickname || null,
        shirt_number: formData.shirt_number || null,
        guardian_name: formData.guardian_name || null,
        guardian_phone: formData.guardian_phone?.replace(/\D/g, '') || null,
        schooling_id: formData.schooling_id || null,
        
        // Endereço
        zip_code: formData.zip_code?.replace(/\D/g, '') || null,
        street: formData.street || null,
        address_number: formData.address_number || null,
        address_complement: formData.address_complement || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        address_state: formData.state_address || null,
      };

      // RF1.1: Se criar vínculo com equipe
      if (formData.create_team_registration && formData.team_id) {
        athleteData.team_id = formData.team_id;
      }

      await athletesService.create(athleteData);
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData(initialFormData);
      setCurrentStep(1);
    } catch (error: any) {
      console.error('Erro ao salvar atleta:', JSON.stringify(error, null, 2));
      // O erro vem do ApiClient com estrutura { message, status, detail }
      const errorMessage = error?.detail || error?.message || 'Erro ao salvar atleta. Tente novamente.';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepProps = { data: formData, onChange: handleChange, errors };

    switch (currentStep) {
      case 1: return <AthleteFormStep1 {...stepProps} />;
      case 2: return <AthleteFormStep2 {...stepProps} />;
      case 3: return <AthleteFormStep3 {...stepProps} />;
      case 4: return <AthleteFormStep4 {...stepProps} />;
      case 5: return <AthleteFormStep5 {...stepProps} />;
      case 6: return <AthleteFormStep6 {...stepProps} />;
      case 7: return <AthleteFormStep7 {...stepProps} />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cadastrar Nova Atleta
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Passo {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : currentStep === step.number
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 rounded ${
                        currentStep > step.number
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
              </div>
            )}
            {renderStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>

              {currentStep < STEPS.length ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Finalizar Cadastro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
