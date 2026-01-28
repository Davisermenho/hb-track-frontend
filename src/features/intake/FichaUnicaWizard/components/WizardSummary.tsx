'use client';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, User, Shield, Building, Users, Trophy, Mail } from 'lucide-react';
import { ErrorSummary } from './ErrorSummary';
import { FichaUnicaPayload } from '../types';

interface WizardSummaryProps {
  currentStep: number;
  totalSteps: number;
  goToStep?: (step: number) => void;
}

export function WizardSummary({ currentStep, totalSteps, goToStep }: WizardSummaryProps) {
  const { control, formState } = useFormContext<FichaUnicaPayload>();
  const values = useWatch({ control });

  const sections = useMemo(
    () => [
      {
        id: 0,
        title: 'Pessoa',
        icon: <User className="size-4" />,
        filled: !!values?.person?.first_name && !!values?.person?.last_name,
        detail: values?.person ? `${values.person.first_name} ${values.person.last_name}`.trim() : 'Pendentes',
      },
      {
        id: 1,
        title: 'Acesso',
        icon: <Shield className="size-4" />,
        filled: !!values?.create_user && !!values?.user?.email,
        detail: values?.create_user ? values?.user?.email || 'Sem email' : 'Apenas pessoa',
      },
      {
        id: 2,
        title: 'Temporada',
        icon: <CalendarSmall />,
        filled: !!values?.season,
        detail: values?.season?.mode === 'create' ? `Nova ${values.season?.year || ''}` : 'Selecionar',
      },
      {
        id: 3,
        title: 'Organização',
        icon: <Building className="size-4" />,
        filled: !!values?.organization,
        detail:
          values?.organization?.mode === 'create'
            ? values?.organization?.name || 'Nova'
            : values?.organization?.organization_id || 'Selecionar',
      },
      {
        id: 4,
        title: 'Equipe',
        icon: <Users className="size-4" />,
        filled: !!values?.team,
        detail:
          values?.team?.mode === 'create'
            ? values?.team?.name || 'Nova'
            : values?.team?.team_id || 'Opcional',
      },
      {
        id: 5,
        title: 'Atleta',
        icon: <Trophy className="size-4" />,
        filled: !!values?.athlete?.create,
        detail: values?.athlete?.create ? values?.athlete?.athlete_name || 'Em edição' : 'Opcional',
      },
      {
        id: 6,
        title: 'Revisão',
        icon: <CheckCircle2 className="size-4" />,
        filled: currentStep === totalSteps - 1,
        detail: 'Conferir e enviar',
      },
    ],
    [currentStep, totalSteps, values]
  );

  const hasErrors = Object.keys(formState.errors || {}).length > 0;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm sticky top-4"
      aria-label="Resumo do cadastro"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Resumo</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Etapa {currentStep + 1} de {totalSteps}
          </p>
        </div>
        {hasErrors ? (
          <div className="inline-flex items-center gap-1 text-xs text-warning-700 dark:text-warning-400">
            <AlertCircle className="size-4" />
            Erros pendentes
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 text-xs text-success-700 dark:text-success-400">
            <CheckCircle2 className="size-4" />
            Em dia
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {sections.map((section) => {
          const isActive = section.id === currentStep;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => section.id <= currentStep && goToStep?.(section.id)}
                disabled={section.id > currentStep}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800'
                    : section.id > currentStep
                    ? 'text-gray-400 dark:text-gray-600 border border-transparent cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`size-7 rounded-lg flex items-center justify-center ${
                      section.filled ? 'bg-success-100 dark:bg-success-950/40' : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    {section.icon}
                  </span>
                  <span className="text-left">
                    <span className="block font-semibold">{section.title}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{section.detail}</span>
                  </span>
                </span>
                {section.filled && <CheckCircle2 className="size-4 text-success-500" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </motion.aside>
  );
}

// Exportar ErrorSummary separadamente para usar fora do aside
export { ErrorSummary };

function CalendarSmall() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
