'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Calendar, Info } from 'lucide-react';
import { FormField } from '../components/FormField';
import { FichaUnicaPayload } from '../types';

export function StepStaffSeason() {
  const { watch } = useFormContext<FichaUnicaPayload>();
  const currentYear = new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <Calendar className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cadastro de Temporada</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Crie uma nova temporada para sua organização</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <FormField
          name="staffSeason.title"
          label="Título da Temporada"
          type="text"
          placeholder="Ex: Temporada 2025"
          required
          helpText="Nome descritivo para identificar a temporada"
        />

        <FormField
          name="staffSeason.year"
          label="Ano"
          type="select"
          required
          helpText="Ano de início da temporada"
          options={[
            { value: 2025, label: '2025' },
            { value: 2026, label: '2026' },
            { value: 2027, label: '2027' },
          ]}
        />

        <FormField
          name="staffSeason.notes"
          label="Observações"
          type="textarea"
          placeholder="Informações adicionais sobre a temporada (opcional)"
          rows={4}
        />
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
      >
        <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300 mb-1">
            Sobre a Temporada
          </h4>
          <p className="text-sm text-blue-light-700 dark:text-blue-light-400">
            A temporada será vinculada à organização (clube) que você criar no próximo passo. Ela servirá para
            organizar equipes, jogos e treinamentos ao longo do ano.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
