import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { fichaUnicaSchema, FichaUnicaPayload, FichaUnicaResponse, WIZARD_STEPS, STAFF_WIZARD_STEPS, USER_WIZARD_STEPS, STAFF_SEASON_FLOW, STAFF_ORG_FLOW, STAFF_TEAM_FLOW } from "../types";
import { intakeService } from "@/lib/api/intake";
import { apiClient } from "@/lib/api/client";

interface UseFichaUnicaFormOptions {
  onSuccess?: (data: FichaUnicaResponse) => void;
}

export function useFichaUnicaForm({ onSuccess }: UseFichaUnicaFormOptions = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  type SubmitVariables = { payload: FichaUnicaPayload; validateOnly?: boolean };

  // Default form values memoized to keep stable refs in effects/callbacks
  const defaultValues = useMemo<Partial<FichaUnicaPayload>>(
    () => ({
      flowType: undefined as any, // Will be set in Step 1
      // Staff fields
      staffChoice: undefined,
      staffSeason: undefined,
      staffOrganization: undefined,
      staffTeam: undefined,
      // User fields
      userRole: undefined,
      person: {
        first_name: "",
        last_name: "",
        birth_date: "",
        gender: "masculino",
        nationality: "Brasil",
        notes: "",
        contacts: [
          {
            contact_type: "email",
            contact_value: "",
            is_primary: true,
          },
          {
            contact_type: "telefone",
            contact_value: "",
            is_primary: true,
          },
        ],
        documents: [
          {
            document_type: "rg",
            document_number: "",
          },
        ],
        address: undefined,
        media: {
          profile_photo_url: "",
        },
      },
      create_user: false,
      user: undefined,
      season: undefined,
      organization: undefined,
      membership: undefined,
      team: undefined,
      athlete: {
        create: false,
      },
      registration: undefined,
    }),
    []
  );

  const form = useForm<FichaUnicaPayload>({
    resolver: zodResolver(fichaUnicaSchema) as any,
    defaultValues,
    mode: "onChange",
  });

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem("ficha_unica_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.reset(draft);
        console.log("Rascunho recuperado: Seu formulario foi restaurado");
      } catch (error) {
        console.error("Erro ao carregar rascunho:", error);
      }
    }
  }, [form]);

  // Autosave draft (debounced)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch((value) => {
      const timer = setTimeout(() => {
        localStorage.setItem("ficha_unica_draft", JSON.stringify(value));
      }, 1000);

      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async ({ payload, validateOnly }: SubmitVariables) => {
      try {
        // Type assertion: garantir que payload tem person definido quando é user flow
        return await intakeService.submitFichaUnica(payload as any, {
          validateOnly,
          idempotencyKey,
        });
      } catch (error: any) {
        const errorMessage = error.message || "Erro ao processar cadastro";

        if (errorMessage.includes("409")) {
          throw new Error(`Duplicata encontrada: ${errorMessage}`);
        } else if (errorMessage.includes("422")) {
          throw new Error(`Erro de validacao: ${errorMessage}`);
        } else if (errorMessage.includes("403")) {
          throw new Error(`Sem permissao: ${errorMessage}`);
        }

        throw error;
      }
    },
    onSuccess: (data, variables) => {
      const isDryRun = variables?.validateOnly;

      if (!isDryRun) {
        localStorage.removeItem("ficha_unica_draft");
        console.log(
          "Cadastro realizado com sucesso!",
          data.user_id ? "E-mail de ativacao enviado para o usuario" : "Pessoa cadastrada no sistema"
        );
        onSuccess?.(data);
      } else {
        console.log("Validacao concluida: Todos os dados estao corretos. Pronto para finalizar!");
      }
    },
    onError: (error: Error) => {
      console.error("Erro no cadastro:", error.message);

      // Extrair erros do backend e adicionar aos erros do formulário
      try {
        const errorMessage = error.message;

        // Procurar por array de erros no formato: "errors":[...]
        const errorsMatch = errorMessage.match(/"errors":\[(.*?)\]/);

        if (errorsMatch) {
          const errorsString = errorsMatch[1];
          // Parse dos erros individuais
          const errorArray = errorsString.match(/"([^"]+)"/g)?.map(e => e.replace(/"/g, '')) || [];

          errorArray.forEach(errorText => {
            // Identificar o campo com erro (ex: "RG 203812888 já cadastrado")
            if (errorText.includes('RG') && errorText.includes('já cadastrado')) {
              form.setError('person.documents.0.document_number', {
                type: 'server',
                message: errorText
              });
            } else if (errorText.includes('Email') && errorText.includes('já cadastrado')) {
              form.setError('user.email', {
                type: 'server',
                message: errorText
              });
            } else if (errorText.includes('CPF') && errorText.includes('já cadastrado')) {
              form.setError('person.documents', {
                type: 'server',
                message: errorText
              });
            } else {
              // Erro genérico - adicionar como erro global
              form.setError('root.serverError', {
                type: 'server',
                message: errorText
              });
            }
          });
        } else {
          // Se não conseguir parsear, adicionar como erro global
          form.setError('root.serverError', {
            type: 'server',
            message: errorMessage
          });
        }
      } catch (parseError) {
        console.error('Erro ao parsear erros do backend:', parseError);
        form.setError('root.serverError', {
          type: 'server',
          message: error.message
        });
      }
    },
  });

  // Get active steps based on flowType and staffChoice
  const getActiveSteps = useCallback(() => {
    const flowType = form.getValues('flowType');
    const staffChoice = form.getValues('staffChoice');
    
    if (flowType === 'staff') {
      if (staffChoice === 'season') return STAFF_SEASON_FLOW;
      if (staffChoice === 'organization') return STAFF_ORG_FLOW;
      if (staffChoice === 'team') return STAFF_TEAM_FLOW;
      return STAFF_WIZARD_STEPS; // Ainda sem escolha
    }
    
    if (flowType === 'user') return USER_WIZARD_STEPS;
    return WIZARD_STEPS; // Default/legacy flow
  }, [form]);

  // Step navigation
  const goToStep = useCallback((step: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep(step);
  }, []);

  const getFirstErrorPath = useCallback((errors: any): string | null => {
    const entries = Object.entries(errors || {});
    if (!entries.length) return null;
    const [key, value] = entries[0];
    if (value && typeof value === "object" && "message" in value === false) {
      const child = getFirstErrorPath(value as any);
      return child ? `${key}.${child}` : key;
    }
    return key;
  }, []);

  const nextStep = useCallback(async () => {
    const activeSteps = getActiveSteps();
    const fieldsToValidate = activeSteps[currentStep]?.fields || [];
    const getFieldError = (path: string) =>
      path.split('.').reduce((acc, key) => (acc as any)?.[key], form.formState.errors as any);

    // 1. Validação de campos obrigatórios
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any);
      const hasStepErrors = fieldsToValidate.some((field) => !!getFieldError(field));

      if (!isValid || hasStepErrors) {
        const firstErrorPath = getFirstErrorPath(form.formState.errors);
        const element = firstErrorPath
          ? document.querySelector(`[name="${firstErrorPath}"]`)
          : null;
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (element instanceof HTMLElement) {
          element.focus({ preventScroll: true });
        }
        return false;
      }
    }

    // Avançar para próximo step
    goToStep(currentStep + 1);
    return true;
  }, [currentStep, form, getFirstErrorPath, goToStep, getActiveSteps]);

  const canNavigateTo = (step: number) => step <= currentStep;

  const prevStep = useCallback(() => {
    goToStep(Math.max(0, currentStep - 1));
  }, [currentStep, goToStep]);

  // Função auxiliar para fazer upload da foto ao Cloudinary
  const uploadPhotoToCloudinary = async (base64Photo: string): Promise<string> => {
    // Obter assinatura do backend
    const signature = await apiClient.get<{
      timestamp: number;
      signature: string;
      api_key: string;
      cloud_name: string;
      upload_preset: string;
      folder: string;
    }>('/media/sign-upload?media_type=photo&entity_type=person');

    // Converter base64 para File
    const response = await fetch(base64Photo);
    const blob = await response.blob();
    const file = new File([blob], 'profile-photo.jpg', { type: blob.type });

    // Criar FormData para upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('api_key', signature.api_key);
    formData.append('upload_preset', signature.upload_preset);
    formData.append('folder', signature.folder);

    // Fazer upload para Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Falha no upload da foto');
    }

    const result = await uploadResponse.json();
    return result.secure_url;
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      let finalData = { ...data } as FichaUnicaPayload;

      // Check flow type
      const flowType = data.flowType;
      const staffChoice = data.staffChoice;

      if (flowType === 'staff') {
        // Staff Team Flow - Create Team
        if (staffChoice === 'team' && data.staffTeam) {
          console.log('🏆 Staff Team Flow - Criando equipe:', data.staffTeam);
          
          try {
            // Note: O endpoint /teams requer autenticação e usa organization_id do contexto
            // Para uso no wizard, precisamos de um endpoint específico ou ajustar permissões
            const response = await apiClient.post('/teams', {
              name: data.staffTeam.name,
              category_id: data.staffTeam.category_id,
              gender: data.staffTeam.gender,
              is_our_team: true,
              coach_membership_id: null,
            });
            
            console.log('✅ Equipe criada com sucesso:', (response as any).data);
            localStorage.removeItem("ficha_unica_draft");
            onSuccess?.((response as any).data);
            return;
          } catch (error: any) {
            console.error('❌ Erro ao criar equipe:', error);
            
            // Mensagem de erro mais detalhada
            let errorMessage = 'Erro ao criar equipe';
            if (error.response?.status === 401) {
              errorMessage = 'Você precisa estar autenticado para criar equipes';
            } else if (error.response?.status === 403) {
              errorMessage = 'Você não tem permissão para criar equipes nesta organização';
            } else if (error.response?.data?.detail) {
              errorMessage = typeof error.response.data.detail === 'string' 
                ? error.response.data.detail 
                : JSON.stringify(error.response.data.detail);
            }
            
            form.setError('root.serverError', {
              type: 'manual',
              message: errorMessage,
            });
            return;
          }
        }

        // Staff Season Flow - Create Season
        if (staffChoice === 'season' && data.staffSeason) {
          console.log('📅 Staff Season Flow - Dados:', data.staffSeason);
          alert('Criação de temporada ainda não implementada.');
          return;
        }

        // Staff Organization Flow - Create Organization
        if (staffChoice === 'organization' && data.staffOrganization) {
          console.log('🏢 Staff Organization Flow - Dados:', data.staffOrganization);
          alert('Criação de organização ainda não implementada.');
          return;
        }

        // Fallback
        alert('Selecione uma opção de cadastro (Temporada, Organização ou Equipe).');
        return;
      }

      // User flow - existing logic
      // Garantir que person existe antes de prosseguir
      if (!data.person) {
        form.setError('root.serverError', {
          type: 'manual',
          message: 'Dados da pessoa são obrigatórios',
        });
        return;
      }

      // Se houver foto em base64, fazer upload ao Cloudinary primeiro
      const photoValue = data.person.media?.profile_photo_url;
      if (photoValue && photoValue.startsWith('data:image')) {
        console.log('📸 Enviando foto ao Cloudinary...');
        const cloudinaryUrl = await uploadPhotoToCloudinary(photoValue);
        console.log('✅ Foto enviada com sucesso:', cloudinaryUrl);

        // Substituir base64 pela URL do Cloudinary
        finalData = {
          ...finalData,
          person: {
            ...finalData.person,
            media: {
              profile_photo_url: cloudinaryUrl,
            },
          } as any,
        };
      }

      // Logo upload for organization (if present in Staff flow)
      const logoValue = data.staffOrganization?.logo_url;
      if (logoValue && logoValue.startsWith('data:image')) {
        console.log('🏢 Enviando logo ao Cloudinary...');
        const cloudinaryUrl = await uploadPhotoToCloudinary(logoValue);
        console.log('✅ Logo enviado com sucesso:', cloudinaryUrl);

        finalData = {
          ...finalData,
          staffOrganization: {
            ...finalData.staffOrganization!,
            logo_url: cloudinaryUrl,
          },
        };
      }

      // Enviar dados ao backend
      submitMutation.mutate({ payload: finalData, validateOnly: false });
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      form.setError('root.serverError', {
        type: 'manual',
        message: 'Falha no upload. Tente novamente.',
      });
    }
  });

  const handleDryRun = useCallback(async () => {
    const isValid = await form.trigger();

    if (isValid) {
      const data = form.getValues();
      submitMutation.mutate({ payload: data, validateOnly: true });
    } else {
      const firstErrorPath = getFirstErrorPath(form.formState.errors);
      const element = firstErrorPath ? document.querySelector(`[name="${firstErrorPath}"]`) : null;
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (element instanceof HTMLElement) {
        element.focus({ preventScroll: true });
      }
      console.error("Corrija os erros antes de validar: Verifique os campos destacados");
    }
  }, [form, getFirstErrorPath, submitMutation]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem("ficha_unica_draft");
    form.reset(defaultValues);
    setCurrentStep(0);
    console.log("Rascunho limpo: Formulario resetado");
  }, [form, defaultValues]);

  // Calculate totalSteps dynamically based on current flowType
  const totalSteps = useMemo(() => {
    const activeSteps = getActiveSteps();
    return activeSteps.length;
  }, [getActiveSteps]);

  return {
    form,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    handleSubmit,
    handleDryRun,
    clearDraft,
    isSubmitting: submitMutation.isPending,
    totalSteps,
    idempotencyKey,
    canNavigateTo,
    getActiveSteps,
  };
}

