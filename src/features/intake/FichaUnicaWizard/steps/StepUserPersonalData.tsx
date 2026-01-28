'use client';

import { useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Mail, Phone, FileText, Camera, Trophy, Briefcase, Info, Shield } from 'lucide-react';
import { FormField } from '../components/FormField';
import { MaskedInput } from '../components/MaskedInput';
import { PhotoUpload } from '../components/PhotoUpload';
import { FichaUnicaPayload } from '../types';

const GOALKEEPER_POSITION_ID = 1;

export function StepUserPersonalData() {
  const { control, watch, setValue } = useFormContext<FichaUnicaPayload>();
  const userRole = watch('userRole');

  const { fields: contactFields, append: appendContact } = useFieldArray({
    control,
    name: 'person.contacts',
  });

  const { fields: documentFields, append: appendDocument } = useFieldArray({
    control,
    name: 'person.documents',
  });

  const defensivePositionId = watch('athlete.main_defensive_position_id');
  const isGoalkeeper = defensivePositionId === GOALKEEPER_POSITION_ID;

  // Garante que email e telefone principais existam
  useEffect(() => {
    if (contactFields.length < 2) {
      const missing = 2 - contactFields.length;
      for (let i = 0; i < missing; i++) {
        appendContact({
          contact_type: i === 0 ? 'email' : 'telefone',
          contact_value: '',
          is_primary: true,
        });
      }
    }
    if (contactFields[0]) {
      setValue('person.contacts.0.contact_type', 'email');
      setValue('person.contacts.0.is_primary', true);
    }
    if (contactFields[1]) {
      setValue('person.contacts.1.contact_type', 'telefone');
      setValue('person.contacts.1.is_primary', true);
    }
  }, [appendContact, contactFields, setValue]);

  // Garante documento principal (RG)
  useEffect(() => {
    if (documentFields.length === 0) {
      appendDocument({ document_type: 'rg', document_number: '' });
    } else {
      setValue('person.documents.0.document_type', 'rg');
    }
  }, [appendDocument, documentFields, setValue]);

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
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <User className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dados Pessoais</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {userRole === 'atleta' && 'Preencha os dados pessoais e posições do atleta'}
            {userRole === 'treinador' && 'Preencha os dados pessoais do treinador'}
            {userRole === 'coordenador' && 'Preencha os dados pessoais do coordenador'}
            {userRole === 'dirigente' && 'Preencha os dados pessoais do dirigente'}
          </p>
        </div>
      </div>

      {/* Dados Básicos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <User className="size-5 text-brand-600 dark:text-brand-400" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Dados Básicos</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="person.first_name" label="Nome" type="text" placeholder="Ex: João" required />

          <FormField name="person.last_name" label="Sobrenome" type="text" placeholder="Ex: Silva" required />

          <FormField
            name="person.birth_date"
            label="Data de Nascimento"
            type="date"
            required
            helpText="Idade deve estar entre 8 e 60 anos"
          />

          <FormField
            name="person.gender"
            label="Gênero"
            type="select"
            required
            options={[
              { value: '', label: 'Selecione...' },
              { value: 'masculino', label: 'Masculino' },
              { value: 'feminino', label: 'Feminino' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
        </div>
      </section>

      {/* Contatos Principais */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="size-5 text-brand-600 dark:text-brand-400" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Contatos</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="person.contacts.0.contact_value"
            label="Email Principal"
            type="email"
            placeholder="exemplo@email.com"
            required
          />

          <MaskedInput
            name="person.contacts.1.contact_value"
            label="Telefone Principal"
            mask="telefone"
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </section>

      {/* Documentos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="size-5 text-brand-600 dark:text-brand-400" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Documentos</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="person.documents.0.document_number"
            label="Documento de Identidade (RG)"
            type="text"
            placeholder="000000000"
            required
            helpText="Apenas números"
          />

          <MaskedInput
            name="person.documents.1.document_number"
            label="CPF"
            mask="cpf"
            placeholder="000.000.000-00"
            helpText="Opcional"
          />
        </div>
      </section>

      {/* Foto de Perfil */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Camera className="size-5 text-brand-600 dark:text-brand-400" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Foto de Perfil</h4>
        </div>

        <PhotoUpload name="person.photo_url" label="Foto de Perfil" />
      </section>

      {/* Campos específicos para ATLETA */}
      {userRole === 'atleta' && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-brand-600 dark:text-brand-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Posições em Campo</h4>
          </div>

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

          {/* Alerta RD13 - Goleiro não pode ter posição ofensiva */}
          {isGoalkeeper && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
            >
              <Shield className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300">
                  REGRA RD13: Goleiro
                </h4>
                <p className="text-sm text-blue-light-700 dark:text-blue-light-400 mt-1">
                  Goleiros não podem ter posições ofensivas definidas. Os campos de posição ofensiva foram
                  desabilitados automaticamente.
                </p>
              </div>
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Campos específicos para TREINADOR/COORDENADOR/DIRIGENTE */}
      {(userRole === 'treinador' || userRole === 'coordenador' || userRole === 'dirigente') && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="size-5 text-brand-600 dark:text-brand-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Vínculo com a Organização</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="staff.start_date"
              label="Data de Início do Vínculo"
              type="date"
              required
              helpText="Quando começou a atuar nesta função"
            />

            <FormField
              name="staff.end_date"
              label="Data de Término do Vínculo"
              type="date"
              helpText="Deixe em branco se ainda ativo"
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900 mt-4">
            <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-light-700 dark:text-blue-light-400">
              O período de vínculo define quando você está ativo na organização. Se não informar data de término,
              você será considerado ativo indefinidamente.
            </p>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
