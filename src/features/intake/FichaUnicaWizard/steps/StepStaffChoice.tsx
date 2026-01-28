'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Calendar, Building2, Users, Info } from 'lucide-react';
import { FichaUnicaPayload } from '../types';

const STAFF_OPTIONS = [
  {
    value: 'season',
    label: 'Temporada',
    description: 'Criar uma nova temporada esportiva',
    icon: Calendar,
    color: 'text-brand-600 dark:text-brand-400',
    bgColor: 'bg-brand-50 dark:bg-brand-950/30',
    borderColor: 'border-brand-500',
  },
  {
    value: 'organization',
    label: 'Organização',
    description: 'Cadastrar clube ou entidade esportiva',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-500',
  },
  {
    value: 'team',
    label: 'Equipe',
    description: 'Criar time de uma categoria específica',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-500',
  },
] as const;

export function StepStaffChoice() {
  const { watch, setValue } = useFormContext<FichaUnicaPayload>();
  const staffChoice = watch('staffChoice');

  const handleStaffSelection = (choice: 'season' | 'organization' | 'team') => {
    setValue('staffChoice', choice);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cadastro de Estrutura
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o que deseja cadastrar no sistema
        </p>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {STAFF_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = staffChoice === option.value;

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleStaffSelection(option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                ${
                  isSelected
                    ? `${option.borderColor} ${option.bgColor} shadow-lg`
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }
              `}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className={`
                  size-14 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? option.bgColor : 'bg-gray-100 dark:bg-gray-800'}
                `}
                >
                  <Icon className={`size-7 ${isSelected ? option.color : 'text-gray-600 dark:text-gray-400'}`} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{option.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 size-6 bg-success-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <svg
                    className="size-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Info Box */}
      {staffChoice && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
        >
          <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-light-700 dark:text-blue-light-400">
            {staffChoice === 'season' && (
              <>
                Você selecionou <strong>Temporada</strong>. No próximo passo, você preencherá o título, ano e
                observações da temporada.
              </>
            )}
            {staffChoice === 'organization' && (
              <>
                Você selecionou <strong>Organização</strong>. No próximo passo, você cadastrará nome, sigla,
                endereço e poderá fazer upload do logo da organização.
              </>
            )}
            {staffChoice === 'team' && (
              <>
                Você selecionou <strong>Equipe</strong>. No próximo passo, você preencherá nome, categoria e
                gênero da equipe. É necessário ter uma temporada e organização já cadastradas.
              </>
            )}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
