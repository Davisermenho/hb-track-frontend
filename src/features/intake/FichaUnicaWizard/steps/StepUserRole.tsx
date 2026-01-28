'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Dumbbell, GraduationCap, UserCog, Briefcase, Info } from 'lucide-react';
import { FichaUnicaPayload } from '../types';

const ROLE_OPTIONS = [
  {
    value: 'atleta',
    label: 'Atleta',
    description: 'Jogador(a) que participa dos treinos e competições',
    icon: Dumbbell,
    color: 'text-brand-600 dark:text-brand-400',
    bgColor: 'bg-brand-50 dark:bg-brand-950/30',
    borderColor: 'border-brand-500',
  },
  {
    value: 'treinador',
    label: 'Treinador',
    description: 'Responsável técnico pela equipe e treinamentos',
    icon: GraduationCap,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-500',
  },
  {
    value: 'coordenador',
    label: 'Coordenador',
    description: 'Responsável pela coordenação e gestão esportiva',
    icon: UserCog,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-500',
  },
  {
    value: 'dirigente',
    label: 'Dirigente',
    description: 'Responsável administrativo da organização',
    icon: Briefcase,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-500',
  },
] as const;

export function StepUserRole() {
  const { watch, setValue } = useFormContext<FichaUnicaPayload>();
  const userRole = watch('userRole');

  const handleRoleSelection = (role: 'atleta' | 'treinador' | 'coordenador' | 'dirigente') => {
    setValue('userRole', role);
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
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className="size-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Qual é o seu papel?</h2>
        <p className="text-gray-600 dark:text-gray-400">Selecione a função que você desempenha na organização</p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {ROLE_OPTIONS.map((role) => {
          const Icon = role.icon;
          const isSelected = userRole === role.value;

          return (
            <motion.button
              key={role.value}
              type="button"
              onClick={() => handleRoleSelection(role.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                ${
                  isSelected
                    ? `${role.borderColor} ${role.bgColor} shadow-lg`
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                  size-12 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? role.bgColor : 'bg-gray-100 dark:bg-gray-800'}
                `}
                >
                  <Icon className={`size-6 ${isSelected ? role.color : 'text-gray-600 dark:text-gray-400'}`} />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{role.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
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
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info Box */}
      {userRole && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
        >
          <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-light-700 dark:text-blue-light-400">
            {userRole === 'atleta' && (
              <>
                Você selecionou <strong>Atleta</strong>. No próximo passo, você selecionará a temporada e
                organização, e depois preencherá seus dados pessoais incluindo posições que joga.
              </>
            )}
            {(userRole === 'treinador' || userRole === 'coordenador' || userRole === 'dirigente') && (
              <>
                Você selecionou <strong>{ROLE_OPTIONS.find((r) => r.value === userRole)?.label}</strong>. No
                próximo passo, você selecionará a temporada e organização, e depois preencherá seus dados pessoais
                incluindo a data de início do vínculo.
              </>
            )}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
