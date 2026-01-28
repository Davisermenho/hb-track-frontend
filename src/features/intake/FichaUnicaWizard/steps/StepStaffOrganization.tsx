'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Building2, Info } from 'lucide-react';
import { FormField } from '../components/FormField';
import { Autocomplete } from '../components/Autocomplete';
import { PhotoUpload } from '../components/PhotoUpload';
import { FichaUnicaPayload } from '../types';

export function StepStaffOrganization() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <Building2 className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cadastro de Organização</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Crie um novo clube ou associação</p>
        </div>
      </div>

      <div className="space-y-4">
        <FormField name="staffOrganization.name" label="Nome do Clube" type="text" required />
        <FormField name="staffOrganization.acronym" label="Sigla do Clube" type="text" />
        <FormField name="staffOrganization.address" label="Endereço" type="text" />
        <Autocomplete
          name="staffOrganization.season_id"
          label="Temporada"
          endpoint="/intake/seasons/autocomplete"
          placeholder="Busque a temporada criada..."
          required
        />
        <PhotoUpload name="staffOrganization.logo_url" label="Logomarca do Clube" />
        <FormField name="staffOrganization.notes" label="Observações" type="textarea" rows={4} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
      >
        <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-light-700 dark:text-blue-light-400">
          A organização será vinculada à temporada selecionada. No próximo passo você poderá criar equipes para este
          clube.
        </p>
      </motion.div>
    </motion.div>
  );
}
