'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Users, UserPlus, Building2, User } from 'lucide-react';
import { FichaUnicaPayload } from '../types';

export function StepChooseFlow() {
  const { watch, setValue } = useFormContext<FichaUnicaPayload>();
  const flowType = watch('flowType');

  const handleFlowSelection = (flow: 'staff' | 'user') => {
    setValue('flowType', flow);
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
          Bem-vindo ao Cadastro Único
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o tipo de cadastro que deseja realizar
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Cadastro de Staff */}
        <motion.button
          type="button"
          onClick={() => handleFlowSelection('staff')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            relative p-8 rounded-2xl border-2 transition-all duration-300 text-left
            ${
              flowType === 'staff'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 shadow-lg'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }
          `}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className={`
              size-16 rounded-full flex items-center justify-center
              ${
                flowType === 'staff'
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
            `}
            >
              <Building2 className="size-8" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Cadastro de Staff
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure estrutura organizacional: temporadas, clubes e equipes
              </p>
            </div>

            <div className="mt-4 space-y-2 text-left w-full">
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="size-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-brand-600 dark:text-brand-400 font-bold">1</span>
                </div>
                <span>Criar Temporada</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="size-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-brand-600 dark:text-brand-400 font-bold">2</span>
                </div>
                <span>Criar Organização (Clube)</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="size-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-brand-600 dark:text-brand-400 font-bold">3</span>
                </div>
                <span>Criar Equipe</span>
              </div>
            </div>
          </div>

          {flowType === 'staff' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 size-8 bg-success-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Users className="size-5 text-white" />
            </motion.div>
          )}
        </motion.button>

        {/* Cadastro de Usuário */}
        <motion.button
          type="button"
          onClick={() => handleFlowSelection('user')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            relative p-8 rounded-2xl border-2 transition-all duration-300 text-left
            ${
              flowType === 'user'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 shadow-lg'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }
          `}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className={`
              size-16 rounded-full flex items-center justify-center
              ${
                flowType === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
            `}
            >
              <UserPlus className="size-8" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cadastro de Usuário</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cadastre atletas, treinadores, coordenadores ou dirigentes
              </p>
            </div>

            <div className="mt-4 space-y-2 text-left w-full">
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="size-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-brand-600 dark:text-brand-400 font-bold">1</span>
                </div>
                <span>Escolher papel do usuário</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="size-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-brand-600 dark:text-brand-400 font-bold">2</span>
                </div>
                <span>Selecionar temporada e organização</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="size-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-brand-600 dark:text-brand-400 font-bold">3</span>
                </div>
                <span>Preencher dados pessoais</span>
              </div>
            </div>
          </div>

          {flowType === 'user' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 size-8 bg-success-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <User className="size-5 text-white" />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Help text */}
      {flowType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
        >
          <p className="text-sm text-blue-light-700 dark:text-blue-light-400 text-center">
            {flowType === 'staff'
              ? 'Você selecionou o cadastro de Staff. Configure a estrutura da organização.'
              : 'Você selecionou o cadastro de Usuário. Preencha os dados da pessoa.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
