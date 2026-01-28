'use client';

import { useState, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Save, Trash2 } from "lucide-react";
import { useFichaUnicaForm } from "./hooks/useFichaUnicaForm";
import { StepIndicator } from "./components/StepIndicator";
import { WizardSummary, ErrorSummary } from "./components/WizardSummary";
import { WIZARD_STEPS, STAFF_WIZARD_STEPS, USER_WIZARD_STEPS, STAFF_SEASON_FLOW, STAFF_ORG_FLOW, STAFF_TEAM_FLOW } from "./types";
import { StepPerson } from "./steps/StepPerson";
import { StepAccess } from "./steps/StepAccess";
import { StepSeason } from "./steps/StepSeason";
import { StepOrganization } from "./steps/StepOrganization";
import { StepTeam } from "./steps/StepTeam";
import { StepAthlete } from "./steps/StepAthlete";
import { StepReview } from "./steps/StepReview";
// NEW: Import refactored step components
import { StepChooseFlow } from "./steps/StepChooseFlow";
import { StepStaffChoice } from "./steps/StepStaffChoice";
import { StepStaffSeason } from "./steps/StepStaffSeason";
import { StepStaffOrganization } from "./steps/StepStaffOrganization";
import { StepStaffTeam } from "./steps/StepStaffTeam";
import { StepUserRole } from "./steps/StepUserRole";
import { StepUserSeasonOrg } from "./steps/StepUserSeasonOrg";
import { StepUserPersonalData } from "./steps/StepUserPersonalData";
import { StepSuccess } from "./steps/StepSuccess";

const stepComponents = [
  StepPerson,
  StepAccess,
  StepSeason,
  StepOrganization,
  StepTeam,
  StepAthlete,
  StepReview,
];

interface FichaUnicaWizardProps {
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export function FichaUnicaWizard({ onSuccess, onCancel }: FichaUnicaWizardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [shake, setShake] = useState(false);

  const {
    form,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit,
    handleDryRun,
    clearDraft,
    isSubmitting,
    totalSteps,
    idempotencyKey,
  } = useFichaUnicaForm({ onSuccess });

  // Evita mismatch de hidratacao com randomUUID (somente render no client)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Pré-selecionar flowType e userRole a partir da URL (ex: /admin/cadastro?flow=user&role=atleta)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const flow = params.get('flow');
    const role = params.get('role');

    if (flow === 'user' || flow === 'staff') {
      form.setValue('flowType', flow);
    }

    if (role === 'atleta' || role === 'treinador' || role === 'coordenador' || role === 'dirigente') {
      form.setValue('userRole', role);
    }
  }, [form]);

  // NEW: Conditional rendering based on flowType and staffChoice
  const flowType = form.watch('flowType');
  const staffChoice = form.watch('staffChoice');
  
  // Se flowType não foi escolhido ainda, forçar step de escolha
  let activeSteps = !flowType 
    ? [{ id: 'choose-flow', label: 'Tipo de Cadastro', description: 'Escolha entre Staff ou Usuário', fields: ['flowType'] }]
    : flowType === 'staff' && !staffChoice
      ? STAFF_WIZARD_STEPS
      : flowType === 'staff' && staffChoice === 'season'
        ? STAFF_SEASON_FLOW
        : flowType === 'staff' && staffChoice === 'organization'
          ? STAFF_ORG_FLOW
          : flowType === 'staff' && staffChoice === 'team'
            ? STAFF_TEAM_FLOW
            : flowType === 'user' 
              ? USER_WIZARD_STEPS 
              : WIZARD_STEPS;

  const renderStep = () => {
    const currentStepId = activeSteps[currentStep]?.id;

    switch (currentStepId) {
      // Shared step
      case 'choose-flow':
        return <StepChooseFlow />;

      // STAFF flow
      case 'staff-choice':
        return <StepStaffChoice />;
      case 'staff-season':
        return <StepStaffSeason />;
      case 'staff-organization':
        return <StepStaffOrganization />;
      case 'staff-team':
        return <StepStaffTeam />;

      // USER flow
      case 'user-role':
        return <StepUserRole />;
      case 'user-season-org':
        return <StepUserSeasonOrg />;
      case 'user-personal-data':
        return <StepUserPersonalData />;

      // Shared success step
      case 'success':
        return <StepSuccess />;

      // Legacy flow (fallback for old WIZARD_STEPS)
      default:
        const CurrentStepComponent = stepComponents[currentStep];
        return CurrentStepComponent ? <CurrentStepComponent /> : null;
    }
  };

  const isLastStep = currentStep === activeSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    const ok = await nextStep();
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <FormProvider {...form}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Layout principal: form + resumo lateral */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Cadastro Unico - Ficha Unica
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Preencha os dados para criar o cadastro completo no sistema
                  </p>
                </div>

                {/* Limpar Rascunho desktop */}
                <button
                  type="button"
                  onClick={clearDraft}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                  title="Limpar rascunho e recomeçar"
                >
                  <Trash2 className="size-4" />
                  Limpar
                </button>
              </div>
            </div>

            {/* Progress Indicator */}
            <StepIndicator steps={activeSteps} currentStep={currentStep} errors={form.formState.errors} />

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={
                    shake
                      ? { opacity: 1, x: [0, -10, 10, -6, 6, -3, 3, 0] }
                      : { opacity: 1, x: 0 }
                  }
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-800"
                >
                  {/* Step Title */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {activeSteps[currentStep]?.label}
                    </h2>
                    {activeSteps[currentStep]?.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {activeSteps[currentStep].description}
                      </p>
                    )}
                  </div>

                  {/* Step Component */}
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-6 gap-3">
                {/* Left Side Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {!isFirstStep && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                      Voltar
                    </button>
                  )}

                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancelar
                    </button>
                  )}

                  {/* Limpar no mobile */}
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="sm:hidden inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-danger-300 dark:border-danger-700 rounded-lg text-sm font-medium text-danger-700 dark:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Limpar rascunho e recomeçar"
                  >
                    <Trash2 className="size-4" />
                    Limpar Rascunho
                  </button>
                </div>

                {/* Right Side Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {isLastStep && (
                    <button
                      type="button"
                      onClick={handleDryRun}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-brand-500 rounded-lg text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="size-4" />
                      {isSubmitting ? "Validando..." : "Validar Dados"}
                    </button>
                  )}

                  {!isLastStep ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Proximo
                      <ChevronRight className="size-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-success-500 hover:bg-success-600 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="size-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Check className="size-4" />
                          Finalizar Cadastro
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Text */}
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Etapa {currentStep + 1} de {activeSteps.length}
              </div>
            </form>
          </div>

          {/* Summary aside */}
          <div className="lg:col-span-4">
            <WizardSummary currentStep={currentStep} totalSteps={activeSteps.length} goToStep={goToStep} />

            {/* Error Summary - Abaixo do resumo */}
            <div className="mt-4">
              <ErrorSummary errors={form.formState.errors} />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
