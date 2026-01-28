'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import { FichaUnicaPayload } from '../types';

export function StepSuccess() {
  const router = useRouter();
  const { reset, watch } = useFormContext<FichaUnicaPayload>();
  const flowType = watch('flowType');

  const handleNewRegistration = () => {
    reset();
    window.location.reload(); // Force reload to reset wizard state
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8"
    >
      {/* Success Icon with Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
      >
        <div className="relative">
          {/* Outer pulse ring */}
          <motion.div
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 bg-success-500 rounded-full"
          />

          {/* Success icon */}
          <div className="relative size-24 bg-success-500 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="size-16 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Parabéns!</h2>
        <p className="text-xl text-gray-700 dark:text-gray-300">Cadastro efetuado com sucesso</p>

        {flowType === 'staff' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mt-4">
            A estrutura organizacional (Temporada, Organização e Equipe) foi criada com sucesso. Agora você pode
            cadastrar atletas, treinadores e outros membros.
          </p>
        )}

        {flowType === 'user' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mt-4">
            O cadastro do usuário foi concluído com sucesso. Os dados foram salvos e já estão disponíveis no
            sistema.
          </p>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
      >
        <button
          type="button"
          onClick={handleNewRegistration}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <RefreshCw className="size-5" />
          <span>Novo Cadastro</span>
        </button>

        <button
          type="button"
          onClick={handleBackToDashboard}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <Home className="size-5" />
          <span>Voltar ao Dashboard</span>
        </button>
      </motion.div>

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8"
      >
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-600">
          <div className="size-2 bg-success-500 rounded-full animate-pulse" />
          <span>Sistema pronto para novos cadastros</span>
          <div className="size-2 bg-success-500 rounded-full animate-pulse" />
        </div>
      </motion.div>
    </motion.div>
  );
}
