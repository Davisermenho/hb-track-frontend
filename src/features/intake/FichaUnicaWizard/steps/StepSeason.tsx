'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Calendar, Info, Plus, Search } from 'lucide-react';
import { FormField } from '../components/FormField';
import { Autocomplete } from '../components/Autocomplete';
import { FichaUnicaPayload } from '../types';
import { useState } from 'react';

export function StepSeason() {
  const { watch, setValue } = useFormContext<FichaUnicaPayload>();
  const [mode, setMode] = useState<'create' | 'select'>('select');
  
  // Verificar papel do usuário (assumindo que está disponível no contexto)
  // TODO: Buscar do contexto de autenticação real
  const userRole = watch('user.role_id') || 4; // Default: Atleta
  const isDirigente = userRole === 1;

  const handleModeChange = (newMode: 'create' | 'select') => {
    setMode(newMode);
    setValue('season.mode', newMode);
    
    // Limpar campos ao trocar modo
    if (newMode === 'create') {
      setValue('season.season_id', undefined);
      setValue('season.year', new Date().getFullYear());
    } else {
      setValue('season.year', undefined);
      setValue('season.season_id', undefined);
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
        <Calendar className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Temporada
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione ou crie uma temporada para vincular esta pessoa
          </p>
        </div>
      </div>

      {/* Info sobre Dirigente (FASE 4.1) */}
      {isDirigente && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
        >
          <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300">
              FASE 4.1: Dirigente sem Organização
            </h4>
            <p className="text-sm text-blue-light-700 dark:text-blue-light-400 mt-1">
              Como Dirigente, você pode criar uma nova temporada que será automaticamente vinculada 
              à organização que você criar no próximo passo.
            </p>
          </div>
        </motion.div>
      )}

      {/* Seletor de Modo (apenas para Dirigente) */}
      {isDirigente && (
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
        </div>
      )}

      {/* Formulário: Criar Nova Temporada */}
      {mode === 'create' && isDirigente && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <FormField
            name="season.year"
            label="Ano da Temporada"
            type="number"
            placeholder={new Date().getFullYear().toString()}
            required
            helpText="Ano de início da temporada (ex: 2024)"
          />

          <div className="flex items-start gap-3 p-4 bg-success-50 dark:bg-success-950/30 rounded-lg border border-success-200 dark:border-success-900">
            <Info className="size-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-success-700 dark:text-success-400">
              A temporada será criada automaticamente quando você finalizar o cadastro. 
              Ela será vinculada à organização no próximo passo.
            </p>
          </div>
        </motion.div>
      )}

      {/* Formulário: Selecionar Temporada Existente */}
      {mode === 'select' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <Autocomplete
            name="season.season_id"
            label="Buscar Temporada"
            endpoint="/intake/seasons/autocomplete"
            placeholder="Digite o ano ou nome..."
            required
          />

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
            <Info className="size-5 text-gray-500 dark:text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isDirigente 
                ? 'Selecione uma temporada existente para vincular esta pessoa.'
                : 'Você só pode selecionar temporadas existentes vinculadas à sua organização.'
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Info para não-Dirigentes */}
      {!isDirigente && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
        >
          <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300">
              Coordenador/Treinador
            </h4>
            <p className="text-sm text-blue-light-700 dark:text-blue-light-400 mt-1">
              Você só pode selecionar temporadas existentes. Apenas Dirigentes podem criar novas temporadas.
            </p>
          </div>
        </motion.div>
      )}

      {/* Info sobre dependência (FASE 4.1) */}
      {(watch('organization.mode') === 'create' || watch('team.mode') === 'create') && (
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
              Você escolheu criar uma organização ou equipe. A temporada é obrigatória para vincular 
              essas entidades.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
