/**
 * Seção Organização - Ficha Única
 * 
 * Permite selecionar uma organização existente ou criar uma nova.
 * Usada para: Dirigente, Coordenador, Treinador
 */

'use client';

import { useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import CollapsibleSection from '@/components/form/CollapsibleSection';
import type { Organization } from '../../../types/unified-registration';

interface OrganizationData {
  existing_organization_id?: number;
  create_organization?: {
    name: string;
    legal_name?: string;
    document?: string;
  };
}

interface OrganizationSectionProps {
  data?: OrganizationData;
  organizations: Organization[];
  errors: Record<string, string>;
  touched: Set<string>;
  onSelectOrganization: (id: number | undefined) => void;
  onCreateOrganization: (data: { name: string; legal_name?: string; document?: string } | undefined) => void;
  onBlur: (field: string) => void;
}

export default function OrganizationSection({
  data,
  organizations,
  errors,
  touched,
  onSelectOrganization,
  onCreateOrganization,
  onBlur,
}: OrganizationSectionProps) {
  const [mode, setMode] = useState<'select' | 'create'>(
    data?.create_organization ? 'create' : 'select'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [newOrgData, setNewOrgData] = useState({
    name: data?.create_organization?.name || '',
    legal_name: data?.create_organization?.legal_name || '',
    document: data?.create_organization?.document || '',
  });
  
  // Filtrar organizações pelo termo de busca
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleModeChange = (newMode: 'select' | 'create') => {
    setMode(newMode);
    if (newMode === 'select') {
      onCreateOrganization(undefined);
    } else {
      onSelectOrganization(undefined);
    }
  };
  
  const handleOrgSelect = (orgId: number) => {
    onSelectOrganization(orgId);
    onCreateOrganization(undefined);
  };
  
  const handleNewOrgChange = (field: string, value: string) => {
    const updated = { ...newOrgData, [field]: value };
    setNewOrgData(updated);
    if (updated.name) {
      onCreateOrganization(updated);
    } else {
      onCreateOrganization(undefined);
    }
  };
  
  const showError = (field: string) => {
    return touched.has(`organization.${field}`) && errors[`organization.${field}`];
  };
  
  const inputClass = `
    w-full h-11 px-4 rounded-lg border text-sm
    placeholder:text-gray-400 focus:outline-none focus:ring-3
    dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
    border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10
  `;
  
  const selectedOrg = organizations.find(o => o.id === data?.existing_organization_id);
  
  return (
    <CollapsibleSection
      title="Organização"
      defaultOpen={true}
      badge={selectedOrg?.name || (data?.create_organization?.name ? 'Nova' : undefined)}
    >
      <div className="space-y-4">
        {/* Toggle entre selecionar e criar */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => handleModeChange('select')}
            className={`
              flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2
              ${mode === 'select'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <Search className="w-4 h-4" />
            Selecionar Existente
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('create')}
            className={`
              flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2
              ${mode === 'create'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            Criar Nova
          </button>
        </div>
        
        {/* Modo: Selecionar existente */}
        {mode === 'select' && (
          <div className="space-y-3">
            {/* Campo de busca */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar organização..."
                className={`pl-10 ${inputClass}`}
              />
            </div>
            
            {/* Lista de organizações */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrganizations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nenhuma organização encontrada' : 'Nenhuma organização disponível'}
                </div>
              ) : (
                filteredOrganizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleOrgSelect(org.id)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                      flex items-center gap-3
                      ${data?.existing_organization_id === org.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${data?.existing_organization_id === org.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }
                    `}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        data?.existing_organization_id === org.id
                          ? 'text-brand-700 dark:text-brand-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {org.name}
                      </p>
                      {org.city && org.state && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {org.city} - {org.state}
                        </p>
                      )}
                    </div>
                    {data?.existing_organization_id === org.id && (
                      <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Modo: Criar nova */}
        {mode === 'create' && (
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label 
                htmlFor="org_name" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Nome da Organização <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="org_name"
                value={newOrgData.name}
                onChange={(e) => handleNewOrgChange('name', e.target.value)}
                onBlur={() => onBlur('create_organization.name')}
                placeholder="Ex: Clube Esportivo Municipal"
                className={inputClass}
              />
              {showError('create_organization.name') && (
                <p className="mt-1.5 text-xs text-error-500">{errors['organization.create_organization.name']}</p>
              )}
            </div>
            
            {/* Razão Social */}
            <div>
              <label 
                htmlFor="org_legal_name" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Razão Social
                <span className="ml-2 text-xs text-gray-500 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                id="org_legal_name"
                value={newOrgData.legal_name}
                onChange={(e) => handleNewOrgChange('legal_name', e.target.value)}
                placeholder="Razão social da organização"
                className={inputClass}
              />
            </div>
            
            {/* CNPJ */}
            <div>
              <label 
                htmlFor="org_document" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                CNPJ
                <span className="ml-2 text-xs text-gray-500 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                id="org_document"
                value={newOrgData.document}
                onChange={(e) => handleNewOrgChange('document', e.target.value)}
                placeholder="00.000.000/0000-00"
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
