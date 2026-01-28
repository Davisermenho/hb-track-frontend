'use client';

import { useEffect, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Plus, Trash2, User, Mail, FileText, MapPin, Camera } from 'lucide-react';
import { FormField } from '../components/FormField';
import { MaskedInput } from '../components/MaskedInput';
import { PhotoUpload } from '../components/PhotoUpload';
import { FichaUnicaPayload } from '../types';

const secondaryContactOptions = [
  { value: 'email', label: 'Email' },
  { value: 'telefone', label: 'Telefone' },
];

const secondaryDocumentOptions = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnh', label: 'CNH' },
  { value: 'certidao_nascimento', label: 'Certidão de Nascimento' },
];

export function StepPerson() {
  const { control, watch, setValue } = useFormContext<FichaUnicaPayload>();
  const [showAddress, setShowAddress] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: 'person.contacts',
  });

  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control,
    name: 'person.documents',
  });

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

  // Garante documento principal (Documento de Identidade)
  useEffect(() => {
    if (documentFields.length === 0) {
      appendDocument({ document_type: 'rg', document_number: '' });
    } else {
      setValue('person.documents.0.document_type', 'rg');
    }
  }, [appendDocument, documentFields, setValue]);

  // Buscar endereço por CEP
  const handleCEPSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setValue('person.address.street', data.logradouro);
        setValue('person.address.neighborhood', data.bairro);
        setValue('person.address.city', data.localidade);
        setValue('person.address.state', data.uf);
        setShowAddress(true);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  const secondaryContacts = contactFields.slice(2);
  const documents = watch('person.documents');
  const secondaryDocuments = documentFields.slice(1);
  const usedDocumentTypes = new Set<string>((documents || []).map((d) => d.document_type).filter(Boolean));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Dados Básicos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <User className="size-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dados Básicos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="person.first_name"
            label="Nome"
            type="text"
            placeholder="Ex: João"
            required
          />

          <FormField
            name="person.last_name"
            label="Sobrenome"
            type="text"
            placeholder="Ex: Silva"
            required
          />

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

          <FormField
            name="person.nationality"
            label="Nacionalidade"
            type="text"
            placeholder="Ex: Brasil"
          />
        </div>
      </section>

      {/* Contatos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contatos
            </h3>
          </div>
        </div>

        {/* Contato principal: Email e Telefone fixos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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

        {/* Contatos secundários */}
        <div className="space-y-3">
          {secondaryContacts.map((field, idx) => {
            const actualIndex = idx + 2;
            const type = watch(`person.contacts.${actualIndex}.contact_type`);
            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    name={`person.contacts.${actualIndex}.contact_type`}
                    label="Tipo"
                    type="select"
                    options={secondaryContactOptions}
                  />

                  {type === 'telefone' ? (
                    <MaskedInput
                      name={`person.contacts.${actualIndex}.contact_value`}
                      label="Telefone"
                      mask="telefone"
                      placeholder="(00) 00000-0000"
                    />
                  ) : (
                    <FormField
                      name={`person.contacts.${actualIndex}.contact_value`}
                      label="Email"
                      type="email"
                      placeholder="email@exemplo.com"
                    />
                  )}

                  <div className="flex items-end">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Contato secundário (opcional)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeContact(actualIndex)}
                  className="self-start p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => appendContact({ contact_type: 'email', contact_value: '', is_primary: false })}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="size-4" />
            Adicionar Contato Secundário
          </button>
        </div>
      </section>

      {/* Documentos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documentos
            </h3>
          </div>
        </div>

        {/* Documento de Identidade principal */}
        {documentFields[0] && (
          <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Documento
                </label>
                <input
                  type="text"
                  value="Documento de Identidade (RG)"
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <MaskedInput
                name="person.documents.0.document_number"
                label="Número do Documento"
                mask="rg"
                placeholder="00.000.000-0"
                required
              />
            </div>
          </div>
        )}

        {/* Documentos secundários */}
        <div className="space-y-3 mt-3">
          {secondaryDocuments.map((field, idx) => {
            const actualIndex = idx + 1;
            const type = watch(`person.documents.${actualIndex}.document_type`) as string;
            const availableOptions = secondaryDocumentOptions.filter(
              (opt) => !usedDocumentTypes.has(opt.value as string) || opt.value === type
            );

            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    name={`person.documents.${actualIndex}.document_type`}
                    label="Tipo de Documento"
                    type="select"
                    options={[{ value: '', label: 'Selecione...' }, ...availableOptions]}
                  />

                  {type === 'cpf' ? (
                    <MaskedInput
                      name={`person.documents.${actualIndex}.document_number`}
                      label="CPF"
                      mask="cpf"
                      placeholder="000.000.000-00"
                    />
                  ) : (
                    <FormField
                      name={`person.documents.${actualIndex}.document_number`}
                      label="Número"
                      type="text"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeDocument(actualIndex)}
                  className="self-start p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => appendDocument({ document_type: 'cpf', document_number: '' })}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="size-4" />
            Adicionar Documento Secundário
          </button>
        </div>
      </section>

      {/* Endereço */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Endereço
            </h3>
          </div>

          {!showAddress && (
            <button
              type="button"
              onClick={() => setShowAddress(true)}
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
            >
              + Adicionar Endereço
            </button>
          )}
        </div>

        {showAddress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MaskedInput
                name="person.address.postal_code"
                label="CEP"
                mask="cep"
                placeholder="00000-000"
                onBlur={(e) => handleCEPSearch(e.target.value)}
              />

              <div className="md:col-span-2">
                <FormField
                  name="person.address.street"
                  label="Rua"
                  type="text"
                  placeholder="Nome da rua"
                  disabled={cepLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="person.address.number"
                label="Número"
                type="text"
                placeholder="123"
              />

              <FormField
                name="person.address.complement"
                label="Complemento"
                type="text"
                placeholder="Apto 45"
              />

              <FormField
                name="person.address.neighborhood"
                label="Bairro"
                type="text"
                placeholder="Centro"
                disabled={cepLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="person.address.city"
                label="Cidade"
                type="text"
                placeholder="São Paulo"
                disabled={cepLoading}
              />

              <FormField
                name="person.address.state"
                label="Estado"
                type="text"
                placeholder="SP"
                disabled={cepLoading}
              />

              <FormField
                name="person.address.country"
                label="País"
                type="text"
                placeholder="Brasil"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddress(false)}
              className="text-sm text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300 font-medium"
            >
              Remover Endereço
            </button>
          </motion.div>
        )}

        {!showAddress && (
          <p className="text-xs text-gray-500 dark:text-gray-600">
            Opcional
          </p>
        )}
      </section>

      {/* Notas */}
      <section>
        <FormField
          name="person.notes"
          label="Observações"
          type="textarea"
          placeholder="Informações adicionais (opcional)"
          rows={3}
        />
      </section>

      {/* Foto de Perfil no final do step */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Camera className="size-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Foto de Perfil</h3>
        </div>
        <PhotoUpload name="person.media.profile_photo_url" label="Foto de Perfil" />
      </section>
    </motion.div>
  );
}
