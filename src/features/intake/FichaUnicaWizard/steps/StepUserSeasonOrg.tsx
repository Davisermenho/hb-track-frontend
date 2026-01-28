'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Calendar, Building2, Info } from 'lucide-react';
import { Autocomplete } from '../components/Autocomplete';
import { FichaUnicaPayload } from '../types';

export function StepUserSeasonOrg() {
  const { watch } = useFormContext<FichaUnicaPayload>();
  const userRole = watch('userRole');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <div className="flex items-center gap-2">
          <Calendar className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          <Building2 className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Temporada e Organização</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione a temporada e a organização em que você atuará
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <Autocomplete
          name="season.season_id"
          label="Temporada"
          endpoint="/intake/seasons/autocomplete"
          placeholder="Digite o ano ou nome da temporada..."
          required
          helpText="Busque e selecione a temporada em que você participará"
        />

        <Autocomplete
          name="organization.organization_id"
          label="Organização"
          endpoint="/intake/organizations/autocomplete"
          placeholder="Digite o nome do clube ou organização..."
          required
          helpText="Busque e selecione a organização (clube) em que você atuará"
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
            Sobre Temporada e Organização
          </h4>
          <p className="text-sm text-blue-light-700 dark:text-blue-light-400">
            {userRole === 'atleta' ? (
              <>
                A temporada e organização que você selecionar determinarão o contexto em que você atuará como{' '}
                <strong>atleta</strong>. No próximo passo, você preencherá seus dados pessoais incluindo as posições
                que joga.
              </>
            ) : (
              <>
                A temporada e organização que você selecionar determinarão o contexto do seu vínculo como{' '}
                <strong>{userRole}</strong>. No próximo passo, você preencherá seus dados pessoais incluindo a data
                de início do vínculo.
              </>
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
