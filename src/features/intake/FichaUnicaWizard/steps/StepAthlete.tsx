'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Trophy, Info, AlertTriangle, Shield } from 'lucide-react';
import { FormField } from '../components/FormField';
import { MaskedInput } from '../components/MaskedInput';
import { FichaUnicaPayload } from '../types';
import { useState, useEffect } from 'react';

const GOALKEEPER_POSITION_ID = 1;

export function StepAthlete() {
  const { watch, setValue } = useFormContext<FichaUnicaPayload>();
  const [registerAsAthlete, setRegisterAsAthlete] = useState(false);
  
  const defensivePositionId = watch('athlete.main_defensive_position_id');
  const isGoalkeeper = defensivePositionId === GOALKEEPER_POSITION_ID;
  const birthDate = watch('person.birth_date');
  const isMinor = birthDate ? calculateAge(birthDate) < 18 : false;

  const handleRegisterAsAthleteToggle = (checked: boolean) => {
    setRegisterAsAthlete(checked);
    setValue('athlete.create', checked);
    
    if (checked) {
      // Pré-preencher nome do atleta com nome da pessoa
      const firstName = watch('person.first_name');
      const lastName = watch('person.last_name');
      if (firstName && lastName) {
        setValue('athlete.athlete_name', `${firstName} ${lastName}`);
      }
      
      // Pré-preencher data de nascimento
      if (birthDate) {
        setValue('athlete.birth_date', birthDate);
      }

      // Inicializar datas de registro
      setValue('registration.start_at', new Date().toISOString().split('T')[0]);
    } else {
      // Limpar dados do atleta
      setValue('athlete', { create: false });
      setValue('registration', undefined);
    }
  };

  // Efeito para limpar posições ofensivas quando goleiro é selecionado (REGRA RD13)
  useEffect(() => {
    if (isGoalkeeper) {
      setValue('athlete.main_offensive_position_id', undefined);
      setValue('athlete.secondary_offensive_position_id', undefined);
    }
  }, [isGoalkeeper, setValue]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <Trophy className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dados do Atleta
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cadastre esta pessoa como atleta (opcional)
          </p>
        </div>
      </div>

      {/* Checkbox para cadastrar como atleta */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
        <input
          type="checkbox"
          checked={registerAsAthlete}
          onChange={(e) => handleRegisterAsAthleteToggle(e.target.checked)}
          className="mt-1 size-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
        />
        <div className="flex-1">
          <label className="text-base font-medium text-gray-900 dark:text-white cursor-pointer">
            Cadastrar como atleta
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Marque esta opção se a pessoa vai competir como atleta
          </p>
        </div>
      </div>

      {/* Formulário de atleta (condicional) */}
      {registerAsAthlete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          {/* Dados Básicos */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Dados Básicos do Atleta
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="athlete.athlete_name"
                label="Nome do Atleta"
                type="text"
                placeholder="Nome completo"
                required
                helpText="Nome como aparecerá em competições"
              />

              <FormField
                name="athlete.athlete_nickname"
                label="Apelido"
                type="text"
                placeholder="Ex: Neymar"
                helpText="Nome de camisa (opcional)"
              />

              <FormField
                name="athlete.birth_date"
                label="Data de Nascimento"
                type="date"
                required
                helpText="Usada para definir categoria"
              />

              <FormField
                name="athlete.shirt_number"
                label="Número da Camisa"
                type="number"
                placeholder="Ex: 10"
                helpText="Número de 1 a 99 (opcional)"
              />

              <FormField
                name="athlete.schooling_id"
                label="Escolaridade"
                type="select"
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: '1', label: 'Ensino Fundamental Incompleto' },
                  { value: '2', label: 'Ensino Fundamental Completo' },
                  { value: '3', label: 'Ensino Médio Incompleto' },
                  { value: '4', label: 'Ensino Médio Completo' },
                  { value: '5', label: 'Ensino Superior Incompleto' },
                  { value: '6', label: 'Ensino Superior Completo' },
                ]}
              />
            </div>
          </section>

          {/* Responsável (se menor de idade) */}
          {isMinor && (
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-950/30 rounded-lg border border-warning-200 dark:border-warning-900 mb-3">
                <AlertTriangle className="size-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-warning-800 dark:text-warning-300">
                    Menor de Idade
                  </h4>
                  <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
                    É obrigatório informar os dados do responsável legal
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="athlete.guardian_name"
                  label="Nome do Responsável"
                  type="text"
                  placeholder="Nome completo do responsável"
                  required={isMinor}
                />

                <MaskedInput
                  name="athlete.guardian_phone"
                  label="Telefone do Responsável"
                  mask="telefone"
                  placeholder="(00) 00000-0000"
                  required={isMinor}
                />
              </div>
            </motion.section>
          )}

          {/* Posições (COM REGRA RD13) */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Posições em Campo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="athlete.main_defensive_position_id"
                label="Posição Defensiva Principal"
                type="select"
                required
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: '1', label: 'Goleiro' },
                  { value: '2', label: 'Zagueiro Central' },
                  { value: '3', label: 'Lateral Direito' },
                  { value: '4', label: 'Lateral Esquerdo' },
                  { value: '5', label: 'Volante' },
                ]}
                helpText="Posição principal na defesa"
              />

              <FormField
                name="athlete.secondary_defensive_position_id"
                label="Posição Defensiva Secundária"
                type="select"
                options={[
                  { value: '', label: 'Nenhuma' },
                  { value: '1', label: 'Goleiro' },
                  { value: '2', label: 'Zagueiro Central' },
                  { value: '3', label: 'Lateral Direito' },
                  { value: '4', label: 'Lateral Esquerdo' },
                  { value: '5', label: 'Volante' },
                ]}
                helpText="Opcional"
              />

              <FormField
                name="athlete.main_offensive_position_id"
                label="Posição Ofensiva Principal"
                type="select"
                required={!isGoalkeeper}
                disabled={isGoalkeeper}
                options={[
                  { value: '', label: isGoalkeeper ? 'N/A (Goleiro)' : 'Selecione...' },
                  { value: '6', label: 'Meia Central' },
                  { value: '7', label: 'Meia Direita' },
                  { value: '8', label: 'Meia Esquerda' },
                  { value: '9', label: 'Atacante' },
                  { value: '10', label: 'Centroavante' },
                ]}
                helpText={isGoalkeeper ? 'Goleiro não pode ter posição ofensiva' : 'Obrigatória para não-goleiros'}
              />

              <FormField
                name="athlete.secondary_offensive_position_id"
                label="Posição Ofensiva Secundária"
                type="select"
                disabled={isGoalkeeper}
                options={[
                  { value: '', label: isGoalkeeper ? 'N/A (Goleiro)' : 'Nenhuma' },
                  { value: '6', label: 'Meia Central' },
                  { value: '7', label: 'Meia Direita' },
                  { value: '8', label: 'Meia Esquerda' },
                  { value: '9', label: 'Atacante' },
                  { value: '10', label: 'Centroavante' },
                ]}
                helpText="Opcional"
              />
            </div>

            {/* Alerta RD13 */}
            {isGoalkeeper && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900 mt-4"
              >
                <Shield className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300">
                    REGRA RD13: Goleiro
                  </h4>
                  <p className="text-sm text-blue-light-700 dark:text-blue-light-400 mt-1">
                    Goleiros não podem ter posições ofensivas definidas. 
                    Os campos de posição ofensiva foram desabilitados automaticamente.
                  </p>
                </div>
              </motion.div>
            )}
          </section>

          {/* Período de Registro */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Período de Registro
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="registration.start_at"
                label="Data de Início"
                type="date"
                required
                helpText="Quando o atleta se registrou"
              />

              <FormField
                name="registration.end_at"
                label="Data de Término"
                type="date"
                helpText="Deixe em branco se ainda ativo"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 mt-3">
              <Info className="size-5 text-gray-500 dark:text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O período de registro define quando o atleta está ativo na equipe. 
                Se não informar data de término, o atleta será considerado ativo indefinidamente.
              </p>
            </div>
          </section>
        </motion.div>
      )}

      {/* Mensagem quando não cadastrar como atleta */}
      {!registerAsAthlete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <Info className="size-5 text-gray-500 dark:text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esta pessoa não será cadastrada como atleta. Ideal para dirigentes, coordenadores 
            e treinadores que não competem. Você poderá cadastrá-la como atleta posteriormente, se necessário.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Helper para calcular idade
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  
  return age;
}
