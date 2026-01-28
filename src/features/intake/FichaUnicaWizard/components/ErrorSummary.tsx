'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { FieldErrors } from 'react-hook-form';
import { useState } from 'react';

interface ErrorSummaryProps {
  errors: FieldErrors;
}

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Extrair todos os erros de forma recursiva
  const extractErrors = (errors: FieldErrors, prefix = ''): Array<{ field: string; message: string }> => {
    const result: Array<{ field: string; message: string }> = [];
    
    Object.keys(errors).forEach((key) => {
      const error = errors[key];
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (error?.message) {
        result.push({
          field: fieldPath,
          message: error.message as string,
        });
      } else if (error && typeof error === 'object') {
        result.push(...extractErrors(error as FieldErrors, fieldPath));
      }
    });
    
    return result;
  };

  const errorList = extractErrors(errors);
  
  if (errorList.length === 0) return null;

  // Traduzir nomes de campos para português
  const translateField = (field: string): string => {
    const translations: Record<string, string> = {
      'person.first_name': 'Nome',
      'person.last_name': 'Sobrenome',
      'person.birth_date': 'Data de Nascimento',
      'person.gender': 'Gênero',
      'person.contacts.0.contact_value': 'Email Principal',
      'person.contacts.1.contact_value': 'Telefone Principal',
      'person.documents.0.document_number': 'Documento de Identidade',
      'person.documents': 'Documentos',
      'user.email': 'Email de Acesso',
      'user.role_id': 'Papel no Sistema',
      'organization.organization_id': 'Organização',
      'organization.name': 'Nome da Organização',
      'team.team_id': 'Equipe',
      'team.name': 'Nome da Equipe',
      'athlete.athlete_name': 'Nome do Atleta',
      'athlete.birth_date': 'Data de Nascimento do Atleta',
      'athlete.main_defensive_position_id': 'Posição Defensiva',
      'root.serverError': 'Erro do Servidor',
    };

    return translations[field] || field;
  };

  const scrollToField = (field: string) => {
    const element = document.querySelector(`[name="${field}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus no campo
      (element as HTMLElement).focus();
    }
  };

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 overflow-hidden"
        >
          <div className="bg-error-50 dark:bg-error-950/30 border-l-4 border-error-500 rounded-lg p-4 shadow-md">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-error-600 dark:text-error-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-error-800 dark:text-error-300">
                  {errorList.length === 1
                    ? '1 campo precisa de atenção'
                    : `${errorList.length} campos precisam de atenção`}
                </h3>
              </div>
              
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2">
              {errorList.map((error, index) => (
                <motion.button
                  key={error.field}
                  type="button"
                  onClick={() => scrollToField(error.field)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full text-left flex items-start gap-2 p-2 rounded hover:bg-error-100 dark:hover:bg-error-900/30 transition-colors group"
                >
                  <span className="inline-block size-1.5 rounded-full bg-error-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-error-700 dark:text-error-400 group-hover:underline">
                      {translateField(error.field)}
                    </p>
                    <p className="text-xs text-error-600 dark:text-error-500">
                      {error.message}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            <p className="text-xs text-error-600 dark:text-error-500 mt-3 italic">
              💡 Clique em um erro para ir direto ao campo
            </p>
          </div>
        </motion.div>
      )}
      
      {!isExpanded && errorList.length > 0 && (
        <motion.button
          type="button"
          onClick={() => setIsExpanded(true)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 w-full px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <AlertTriangle className="size-4" />
          Mostrar {errorList.length} {errorList.length === 1 ? 'erro' : 'erros'}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
