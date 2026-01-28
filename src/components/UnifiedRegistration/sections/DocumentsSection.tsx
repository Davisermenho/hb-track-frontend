/**
 * Seção Documentos - Ficha Única
 * 
 * Campos:
 * - RG (obrigatório para atletas)
 * - CPF (opcional)
 */

'use client';

import CollapsibleSection from '@/components/form/CollapsibleSection';
import CPFField from '@/components/form/CPFField';
import RGField from '@/components/form/RGField';
import type { RegistrationType } from '../../../types/unified-registration';

interface DocumentsData {
  rg?: string;
  cpf?: string;
}

interface DocumentsSectionProps {
  data: DocumentsData;
  errors: Record<string, string>;
  touched: Set<string>;
  registrationType?: RegistrationType;
  onFieldChange: (field: keyof DocumentsData, value: string | undefined) => void;
  onBlur: (field: keyof DocumentsData) => void;
}

export default function DocumentsSection({
  data,
  errors,
  touched,
  registrationType,
  onFieldChange,
  onBlur,
}: DocumentsSectionProps) {
  const isAthlete = registrationType === 'atleta';
  
  return (
    <CollapsibleSection
      title="Documentos"
      defaultOpen={false}
      badge={isAthlete ? 'Obrigatório' : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RG */}
        <RGField
          label={`RG${isAthlete ? ' *' : ''}`}
          value={data.rg || ''}
          onChange={(value) => onFieldChange('rg', value || undefined)}
          error={touched.has('documents.rg') ? errors['documents.rg'] : undefined}
          required={isAthlete}
          placeholder="0000000000"
        />
        
        {/* CPF */}
        <CPFField
          label="CPF"
          value={data.cpf || ''}
          onChange={(value) => onFieldChange('cpf', value || undefined)}
          error={touched.has('documents.cpf') ? errors['documents.cpf'] : undefined}
          placeholder="000.000.000-00"
        />
      </div>
      
      {isAthlete && (
        <p className="mt-3 text-xs text-warning-600 dark:text-warning-400">
          * RG é obrigatório para cadastro de atletas
        </p>
      )}
    </CollapsibleSection>
  );
}
