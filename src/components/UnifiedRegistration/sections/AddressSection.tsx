/**
 * Seção Endereço - Ficha Única
 * 
 * Campos:
 * - CEP (com autocomplete ViaCEP)
 * - Logradouro
 * - Número
 * - Complemento
 * - Bairro
 * - Cidade
 * - Estado
 */

'use client';

import { useState } from 'react';
import { MapPin, Home, Hash, Building, Map } from 'lucide-react';
import CollapsibleSection from '@/components/form/CollapsibleSection';
import CEPField from '@/components/form/CEPField';

interface AddressData {
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface AddressSectionProps {
  data: AddressData;
  errors: Record<string, string>;
  touched: Set<string>;
  onFieldChange: (field: keyof AddressData, value: string | undefined) => void;
  onBlur: (field: keyof AddressData) => void;
}

// Lista de estados brasileiros
const ESTADOS_BR = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export default function AddressSection({
  data,
  errors,
  touched,
  onFieldChange,
  onBlur,
}: AddressSectionProps) {
  const [addressFound, setAddressFound] = useState(false);
  
  const showError = (field: keyof AddressData) => {
    return touched.has(`address.${field}`) && errors[`address.${field}`];
  };
  
  const handleAddressFound = (address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => {
    onFieldChange('street', address.street);
    onFieldChange('neighborhood', address.neighborhood);
    onFieldChange('city', address.city);
    onFieldChange('state', address.state);
    setAddressFound(true);
  };
  
  const inputBaseClass = `
    w-full h-11 px-4 rounded-lg border text-sm
    placeholder:text-gray-400 focus:outline-none focus:ring-3
    dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
  `;
  
  const inputNormalClass = `${inputBaseClass} border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10`;
  
  const inputErrorClass = `${inputBaseClass} border-error-500 focus:border-error-500 focus:ring-error-500/10`;
  
  return (
    <CollapsibleSection
      title="Endereço"
      defaultOpen={false}
    >
      <div className="space-y-4">
        {/* CEP */}
        <div className="max-w-xs">
          <CEPField
            label="CEP"
            value={data.zip_code || ''}
            onChange={(value) => {
              onFieldChange('zip_code', value || undefined);
              setAddressFound(false);
            }}
            onAddressFound={handleAddressFound}
            error={touched.has('address.zip_code') ? errors['address.zip_code'] : undefined}
            placeholder="00000-000"
          />
        </div>
        
        {/* Logradouro e Número */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Logradouro */}
          <div className="md:col-span-3">
            <label 
              htmlFor="street" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Logradouro
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Home className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="street"
                value={data.street || ''}
                onChange={(e) => onFieldChange('street', e.target.value || undefined)}
                onBlur={() => onBlur('street')}
                placeholder="Rua, Avenida, etc."
                readOnly={addressFound}
                className={`
                  pl-10 
                  ${showError('street') ? inputErrorClass : inputNormalClass}
                  ${addressFound ? 'bg-gray-50 dark:bg-gray-800' : ''}
                `}
              />
            </div>
          </div>
          
          {/* Número */}
          <div>
            <label 
              htmlFor="number" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Número
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="number"
                value={data.number || ''}
                onChange={(e) => onFieldChange('number', e.target.value || undefined)}
                onBlur={() => onBlur('number')}
                placeholder="123"
                className={`pl-10 ${showError('number') ? inputErrorClass : inputNormalClass}`}
              />
            </div>
          </div>
        </div>
        
        {/* Complemento e Bairro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Complemento */}
          <div>
            <label 
              htmlFor="complement" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Complemento
              <span className="ml-2 text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              id="complement"
              value={data.complement || ''}
              onChange={(e) => onFieldChange('complement', e.target.value || undefined)}
              onBlur={() => onBlur('complement')}
              placeholder="Apto, Bloco, etc."
              className={inputNormalClass}
            />
          </div>
          
          {/* Bairro */}
          <div>
            <label 
              htmlFor="neighborhood" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Bairro
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="neighborhood"
                value={data.neighborhood || ''}
                onChange={(e) => onFieldChange('neighborhood', e.target.value || undefined)}
                onBlur={() => onBlur('neighborhood')}
                placeholder="Bairro"
                readOnly={addressFound}
                className={`
                  pl-10 
                  ${showError('neighborhood') ? inputErrorClass : inputNormalClass}
                  ${addressFound ? 'bg-gray-50 dark:bg-gray-800' : ''}
                `}
              />
            </div>
          </div>
        </div>
        
        {/* Cidade e Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cidade */}
          <div>
            <label 
              htmlFor="city" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Cidade
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Map className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="city"
                value={data.city || ''}
                onChange={(e) => onFieldChange('city', e.target.value || undefined)}
                onBlur={() => onBlur('city')}
                placeholder="Cidade"
                readOnly={addressFound}
                className={`
                  pl-10 
                  ${showError('city') ? inputErrorClass : inputNormalClass}
                  ${addressFound ? 'bg-gray-50 dark:bg-gray-800' : ''}
                `}
              />
            </div>
            {showError('city') && (
              <p className="mt-1.5 text-xs text-error-500">{errors['address.city']}</p>
            )}
          </div>
          
          {/* Estado */}
          <div>
            <label 
              htmlFor="state" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Estado
            </label>
            <select
              id="state"
              value={data.state || ''}
              onChange={(e) => onFieldChange('state', e.target.value || undefined)}
              onBlur={() => onBlur('state')}
              disabled={addressFound}
              className={`
                ${showError('state') ? inputErrorClass : inputNormalClass}
                ${addressFound ? 'bg-gray-50 dark:bg-gray-800' : ''}
                ${!data.state ? 'text-gray-400' : ''}
              `}
            >
              <option value="">Selecione o estado</option>
              {ESTADOS_BR.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
            {showError('state') && (
              <p className="mt-1.5 text-xs text-error-500">{errors['address.state']}</p>
            )}
          </div>
        </div>
        
        {addressFound && (
          <p className="text-xs text-success-600 dark:text-success-400">
            ✓ Endereço encontrado pelo CEP. Alguns campos foram preenchidos automaticamente.
          </p>
        )}
      </div>
    </CollapsibleSection>
  );
}
