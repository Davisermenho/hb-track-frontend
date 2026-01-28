'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Building, Info, Plus, Search } from 'lucide-react';
import { FormField } from '../components/FormField';
import { Autocomplete } from '../components/Autocomplete';
import { FichaUnicaPayload } from '../types';
import { useState } from 'react';

export function StepOrganization() {
  const { watch, setValue } = useFormContext<FichaUnicaPayload>();
  const [mode, setMode] = useState<'create' | 'select'>('select');
  
  const userRole = watch('user.role_id') || 4;
  const isDirigente = userRole === 1;

  const handleModeChange = (newMode: 'create' | 'select') => {
    setMode(newMode);
    setValue('organization.mode', newMode);
    
    // Limpar campos ao trocar modo
    if (newMode === 'create') {
      setValue('organization.organization_id', undefined);
      setValue('organization.name', '');
      // Definir membership padrão
      if (!watch('membership.role_id')) {
        setValue('membership.role_id', userRole);
        setValue('membership.start_at', new Date().toISOString().split('T')[0]);
      }
    } else {
      setValue('organization.name', undefined);
      setValue('organization.organization_id', undefined);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <Building className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organização
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vincule esta pessoa a uma organização ou crie uma nova
          </p>
        </div>
      </div>

      {/* Seletor de Modo */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleModeChange('select')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
            ${mode === 'select'
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'
            }
          `}
        >
          <Search className="size-5" />
          <span className="font-medium">Selecionar Existente</span>
        </button>

        {isDirigente && (
          <button
            type="button"
            onClick={() => handleModeChange('create')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
              ${mode === 'create'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'
              }
            `}
          >
            <Plus className="size-5" />
            <span className="font-medium">Criar Nova</span>
          </button>
        )}
      </div>

      {/* Formulário: Criar Nova Organização */}
      {mode === 'create' && isDirigente && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <FormField
            name="organization.name"
            label="Nome da Organização"
            type="text"
            placeholder="Ex: Clube Atlético Exemplo"
            required
            helpText="Nome completo da organização (mínimo 3 caracteres)"
          />

          {/* Membership */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Vínculo com a Organização
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="membership.role_id"
                label="Papel na Organização"
                type="select"
                required
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: '1', label: 'Dirigente' },
                  { value: '2', label: 'Coordenador' },
                  { value: '3', label: 'Treinador' },
                  { value: '4', label: 'Atleta' },
                ]}
              />

              <FormField
                name="membership.start_at"
                label="Data de Início"
                type="date"
                required
                helpText="Data de início do vínculo"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-success-50 dark:bg-success-950/30 rounded-lg border border-success-200 dark:border-success-900">
            <Info className="size-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-success-800 dark:text-success-300">
                FASE 4.1: Organização vinculada à Temporada
              </h4>
              <p className="text-sm text-success-700 dark:text-success-400 mt-1">
                A organização será criada e automaticamente vinculada à temporada 
                {watch('season.mode') === 'create' 
                  ? ` do ano ${watch('season.year')}`
                  : ' selecionada'
                }.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Formulário: Selecionar Organização Existente */}
      {mode === 'select' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <Autocomplete
            name="organization.organization_id"
            label="Buscar Organização"
            endpoint="/intake/organizations/autocomplete"
            placeholder="Digite o nome da organização..."
            required
          />

          {/* Membership (quando seleciona organização existente) */}
          {watch('organization.organization_id') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 space-y-4"
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Vínculo com a Organização
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="membership.role_id"
                  label="Papel na Organização"
                  type="select"
                  required
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: '1', label: 'Dirigente' },
                    { value: '2', label: 'Coordenador' },
                    { value: '3', label: 'Treinador' },
                    { value: '4', label: 'Atleta' },
                  ]}
                />

                <FormField
                  name="membership.start_at"
                  label="Data de Início"
                  type="date"
                  required
                />
              </div>
            </motion.div>
          )}

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
            <Info className="size-5 text-gray-500 dark:text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecione uma organização existente para vincular esta pessoa. 
              {!isDirigente && ' Você só pode ver organizações às quais já está vinculado.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Info para não-Dirigentes tentando criar */}
      {!isDirigente && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
        >
          <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300">
              Apenas Seleção
            </h4>
            <p className="text-sm text-blue-light-700 dark:text-blue-light-400 mt-1">
              Apenas Dirigentes podem criar novas organizações. Você pode selecionar organizações existentes.
            </p>
          </div>
        </motion.div>
      )}

      {/* Aviso: Temporada obrigatória quando cria organização */}
      {mode === 'create' && !watch('season') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-950/30 rounded-lg border border-warning-200 dark:border-warning-900"
        >
          <Info className="size-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-warning-800 dark:text-warning-300">
              Temporada Obrigatória
            </h4>
            <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
              Para criar uma organização, você deve primeiro selecionar ou criar uma temporada no passo anterior.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
