/**
 * Seção Contatos - Ficha Única
 * 
 * Campos:
 * - Telefone (obrigatório para atletas)
 * - WhatsApp (opcional)
 */

'use client';

import { Phone, MessageCircle } from 'lucide-react';
import CollapsibleSection from '@/components/form/CollapsibleSection';
import { formatPhone } from '@/lib/validations/unified-registration';
import type { RegistrationType } from '../../../types/unified-registration';

interface ContactsData {
  phone?: string;
  whatsapp?: string;
}

interface ContactsSectionProps {
  data: ContactsData;
  errors: Record<string, string>;
  touched: Set<string>;
  registrationType?: RegistrationType;
  onFieldChange: (field: keyof ContactsData, value: string | undefined) => void;
  onBlur: (field: keyof ContactsData) => void;
}

export default function ContactsSection({
  data,
  errors,
  touched,
  registrationType,
  onFieldChange,
  onBlur,
}: ContactsSectionProps) {
  const isAthlete = registrationType === 'atleta';
  
  const showError = (field: keyof ContactsData) => {
    return touched.has(`contacts.${field}`) && errors[`contacts.${field}`];
  };
  
  const handlePhoneChange = (field: keyof ContactsData, value: string) => {
    const formatted = formatPhone(value);
    onFieldChange(field, formatted || undefined);
  };
  
  return (
    <CollapsibleSection
      title="Contatos"
      defaultOpen={false}
      badge={isAthlete ? 'Obrigatório' : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Telefone */}
        <div>
          <label 
            htmlFor="phone" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Telefone {isAthlete && <span className="text-error-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              id="phone"
              value={data.phone || ''}
              onChange={(e) => handlePhoneChange('phone', e.target.value)}
              onBlur={() => onBlur('phone')}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={`
                w-full h-11 pl-10 pr-4 rounded-lg border text-sm
                placeholder:text-gray-400 focus:outline-none focus:ring-3
                dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
                ${showError('phone')
                  ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10'
                  : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10'
                }
              `}
            />
          </div>
          {showError('phone') && (
            <p className="mt-1.5 text-xs text-error-500">{errors['contacts.phone']}</p>
          )}
        </div>
        
        {/* WhatsApp */}
        <div>
          <label 
            htmlFor="whatsapp" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            WhatsApp
            <span className="ml-2 text-xs text-gray-500 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageCircle className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              id="whatsapp"
              value={data.whatsapp || ''}
              onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
              onBlur={() => onBlur('whatsapp')}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={`
                w-full h-11 pl-10 pr-4 rounded-lg border text-sm
                placeholder:text-gray-400 focus:outline-none focus:ring-3
                dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
                ${showError('whatsapp')
                  ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10'
                  : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10'
                }
              `}
            />
          </div>
          {showError('whatsapp') && (
            <p className="mt-1.5 text-xs text-error-500">{errors['contacts.whatsapp']}</p>
          )}
        </div>
      </div>
      
      {isAthlete && (
        <p className="mt-3 text-xs text-warning-600 dark:text-warning-400">
          * Telefone é obrigatório para cadastro de atletas
        </p>
      )}
    </CollapsibleSection>
  );
}
