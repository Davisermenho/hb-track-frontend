'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Users, Info, Plus, Search } from 'lucide-react';
import { FormField } from '../components/FormField';
import { Autocomplete } from '../components/Autocomplete';
import { FichaUnicaPayload } from '../types';
import { useState } from 'react';

export function StepTeam() {
  const { watch, setValue } = useFormContext<FichaUnicaPayload>();
  const [linkToTeam, setLinkToTeam] = useState(false);
  const [mode, setMode] = useState<'create' | 'select'>('select');
  
  const userRole = watch('user.role_id') || 4;
  const isDirigente = userRole === 1;
  const isCoordinator = userRole === 2;
  const canCreateTeam = isDirigente || isCoordinator;

  const handleLinkToTeamToggle = (checked: boolean) => {
    setLinkToTeam(checked);
    
    if (!checked) {
      // Limpar dados da equipe
      setValue('team', undefined);
    } else {
      // Inicializar com select
      setValue('team.mode', 'select');
    }
  };

  const handleModeChange = (newMode: 'create' | 'select') => {
    setMode(newMode);
    setValue('team.mode', newMode);
    
    // Limpar campos ao trocar modo
    if (newMode === 'create') {
      setValue('team.team_id', undefined);
      setValue('team.name', '');
      setValue('team.category_id', undefined);
      setValue('team.gender', undefined);
      
      // Vincular à organização selecionada
      const orgId = watch('organization.organization_id');
      if (orgId) {
        setValue('team.organization_id', orgId);
      }
    } else {
      setValue('team.name', undefined);
      setValue('team.category_id', undefined);
      setValue('team.gender', undefined);
      setValue('team.team_id', undefined);
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
        <Users className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Equipe
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vincule esta pessoa a uma equipe (opcional)
          </p>
        </div>
      </div>

      {/* Checkbox para vincular a equipe */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
        <input
          type="checkbox"
          checked={linkToTeam}
          onChange={(e) => handleLinkToTeamToggle(e.target.checked)}
          className="mt-1 size-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
        />
        <div className="flex-1">
          <label className="text-base font-medium text-gray-900 dark:text-white cursor-pointer">
            Vincular a uma equipe
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Marque esta opção se a pessoa fará parte de uma equipe específica
          </p>
        </div>
      </div>

      {/* Formulário de equipe (condicional) */}
      {linkToTeam && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
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

            {canCreateTeam && (
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

          {/* Formulário: Criar Nova Equipe */}
          {mode === 'create' && canCreateTeam && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <FormField
                name="team.name"
                label="Nome da Equipe"
                type="text"
                placeholder="Ex: Sub-15 Masculino"
                required
                helpText="Nome descritivo da equipe"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="team.category_id"
                  label="Categoria"
                  type="select"
                  required
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: '1', label: 'Sub-8' },
                    { value: '2', label: 'Sub-10' },
                    { value: '3', label: 'Sub-12' },
                    { value: '4', label: 'Sub-14' },
                    { value: '5', label: 'Sub-16' },
                    { value: '6', label: 'Sub-18' },
                    { value: '7', label: 'Sub-20' },
                    { value: '8', label: 'Adulto' },
                    { value: '9', label: 'Master' },
                  ]}
                />

                <FormField
                  name="team.gender"
                  label="Gênero"
                  type="select"
                  required
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: 'masculino', label: 'Masculino' },
                    { value: 'feminino', label: 'Feminino' },
                    { value: 'misto', label: 'Misto' },
                  ]}
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-success-50 dark:bg-success-950/30 rounded-lg border border-success-200 dark:border-success-900">
                <Info className="size-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-success-800 dark:text-success-300">
                    Equipe vinculada à Organização e Temporada
                  </h4>
                  <p className="text-sm text-success-700 dark:text-success-400 mt-1">
                    A equipe será criada e vinculada à organização e temporada selecionadas.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Formulário: Selecionar Equipe Existente */}
          {mode === 'select' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <Autocomplete
                name="team.team_id"
                label="Buscar Equipe"
                endpoint="/teams/autocomplete"
                placeholder="Digite o nome da equipe..."
                queryParams={{
                  organization_id: watch('organization.organization_id'),
                  season_id: watch('season.season_id'),
                }}
                required
              />

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
                <Info className="size-5 text-gray-500 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selecione uma equipe existente da organização e temporada escolhidas.
                </p>
              </div>
            </motion.div>
          )}

          {/* Info para não-Dirigentes/Coordenadores tentando criar */}
          {!canCreateTeam && (
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
                  Apenas Dirigentes e Coordenadores podem criar novas equipes. Você pode selecionar equipes existentes.
                </p>
              </div>
            </motion.div>
          )}

          {/* Aviso: Temporada obrigatória quando cria equipe */}
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
                  Para criar uma equipe, você deve primeiro selecionar ou criar uma temporada.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Mensagem quando não vincular a equipe */}
      {!linkToTeam && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <Info className="size-5 text-gray-500 dark:text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esta pessoa não será vinculada a nenhuma equipe específica. 
            Você poderá fazer isso posteriormente, se necessário.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
