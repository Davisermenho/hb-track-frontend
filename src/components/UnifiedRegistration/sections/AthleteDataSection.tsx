/**
 * Seção Dados de Atleta - Ficha Única
 * 
 * Campos específicos para atletas:
 * - Posição defensiva principal (obrigatório)
 * - Posição defensiva secundária
 * - Posição ofensiva principal (obrigatório, exceto goleiras)
 * - Posição ofensiva secundária
 * - Nível de escolaridade
 * - Número da camisa
 * - Nome do responsável (menores)
 * - Telefone do responsável (menores)
 * 
 * Regras:
 * - RD13: Goleira (defensive_position_id=5) não pode ter posição ofensiva
 */

'use client';

import { useMemo } from 'react';
import { Shield, Target, GraduationCap, Hash, UserCheck, Phone } from 'lucide-react';
import CollapsibleSection from '@/components/form/CollapsibleSection';
import { formatPhone } from '@/lib/validations/unified-registration';
import type { 
  OffensivePosition, 
  DefensivePosition, 
  SchoolingLevel,
  Gender 
} from '../../../types/unified-registration';

interface AthleteData {
  main_offensive_position_id?: number;
  secondary_offensive_position_id?: number;
  main_defensive_position_id?: number;
  secondary_defensive_position_id?: number;
  schooling_level_id?: number;
  shirt_number?: number;
  guardian_name?: string;
  guardian_phone?: string;
}

interface AthleteDataSectionProps {
  data?: AthleteData;
  errors: Record<string, string>;
  touched: Set<string>;
  isGoalkeeper: boolean;
  offensivePositions: OffensivePosition[];
  defensivePositions: DefensivePosition[];
  schoolingLevels: SchoolingLevel[];
  personGender?: Gender;
  onFieldChange: (field: keyof AthleteData, value: number | string | undefined) => void;
  onBlur: (field: keyof AthleteData) => void;
}

export default function AthleteDataSection({
  data,
  errors,
  touched,
  isGoalkeeper,
  offensivePositions,
  defensivePositions,
  schoolingLevels,
  personGender,
  onFieldChange,
  onBlur,
}: AthleteDataSectionProps) {
  const showError = (field: keyof AthleteData) => {
    return touched.has(`athlete.${field}`) && errors[`athlete.${field}`];
  };
  
  // Filtra posições secundárias (diferente da principal)
  const availableSecondaryDefensive = useMemo(() => {
    return defensivePositions.filter(p => p.id !== data?.main_defensive_position_id);
  }, [defensivePositions, data?.main_defensive_position_id]);
  
  const availableSecondaryOffensive = useMemo(() => {
    return offensivePositions.filter(p => p.id !== data?.main_offensive_position_id);
  }, [offensivePositions, data?.main_offensive_position_id]);
  
  // Formata nome da posição baseado no gênero
  const formatPositionName = (name: string) => {
    if (personGender === 'masculino') {
      // Converte termos femininos para masculinos
      return name
        .replace('Armadora', 'Armador')
        .replace('Lateral', 'Lateral')
        .replace('Ponta', 'Ponta')
        .replace('Pivô', 'Pivô')
        .replace('Defensora', 'Defensor')
        .replace('Goleira', 'Goleiro');
    }
    return name;
  };
  
  const inputBaseClass = `
    w-full h-11 px-4 rounded-lg border text-sm
    placeholder:text-gray-400 focus:outline-none focus:ring-3
    dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
  `;
  
  const selectClass = (hasError: boolean) => `
    ${inputBaseClass}
    ${hasError 
      ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' 
      : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10'
    }
  `;
  
  return (
    <CollapsibleSection
      title="Dados de Atleta"
      required
      defaultOpen={true}
    >
      <div className="space-y-6">
        {/* Posições Defensivas */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-500" />
            Posições Defensivas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Posição Defensiva Principal */}
            <div>
              <label 
                htmlFor="main_defensive_position_id" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Principal <span className="text-error-500">*</span>
              </label>
              <select
                id="main_defensive_position_id"
                value={data?.main_defensive_position_id || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  onFieldChange('main_defensive_position_id', value);
                  // Se selecionou goleira, limpa posições ofensivas
                  if (value === 5) {
                    onFieldChange('main_offensive_position_id', undefined);
                    onFieldChange('secondary_offensive_position_id', undefined);
                  }
                }}
                onBlur={() => onBlur('main_defensive_position_id')}
                className={selectClass(Boolean(showError('main_defensive_position_id')))}
              >
                <option value="">Selecione a posição</option>
                {defensivePositions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {formatPositionName(pos.name)}
                  </option>
                ))}
              </select>
              {showError('main_defensive_position_id') && (
                <p className="mt-1.5 text-xs text-error-500">{errors['athlete.main_defensive_position_id']}</p>
              )}
            </div>
            
            {/* Posição Defensiva Secundária */}
            <div>
              <label 
                htmlFor="secondary_defensive_position_id" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Secundária <span className="text-xs text-gray-500 font-normal">(opcional)</span>
              </label>
              <select
                id="secondary_defensive_position_id"
                value={data?.secondary_defensive_position_id || ''}
                onChange={(e) => onFieldChange('secondary_defensive_position_id', e.target.value ? parseInt(e.target.value) : undefined)}
                onBlur={() => onBlur('secondary_defensive_position_id')}
                disabled={!data?.main_defensive_position_id}
                className={selectClass(false)}
              >
                <option value="">Selecione a posição</option>
                {availableSecondaryDefensive.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {formatPositionName(pos.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Posições Ofensivas - Oculto para goleiras */}
        {!isGoalkeeper && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-success-500" />
              Posições Ofensivas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Posição Ofensiva Principal */}
              <div>
                <label 
                  htmlFor="main_offensive_position_id" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Principal <span className="text-error-500">*</span>
                </label>
                <select
                  id="main_offensive_position_id"
                  value={data?.main_offensive_position_id || ''}
                  onChange={(e) => onFieldChange('main_offensive_position_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  onBlur={() => onBlur('main_offensive_position_id')}
                  className={selectClass(Boolean(showError('main_offensive_position_id')))}
                >
                  <option value="">Selecione a posição</option>
                  {offensivePositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {formatPositionName(pos.name)}
                    </option>
                  ))}
                </select>
                {showError('main_offensive_position_id') && (
                  <p className="mt-1.5 text-xs text-error-500">{errors['athlete.main_offensive_position_id']}</p>
                )}
              </div>
              
              {/* Posição Ofensiva Secundária */}
              <div>
                <label 
                  htmlFor="secondary_offensive_position_id" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Secundária <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                </label>
                <select
                  id="secondary_offensive_position_id"
                  value={data?.secondary_offensive_position_id || ''}
                  onChange={(e) => onFieldChange('secondary_offensive_position_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  onBlur={() => onBlur('secondary_offensive_position_id')}
                  disabled={!data?.main_offensive_position_id}
                  className={selectClass(false)}
                >
                  <option value="">Selecione a posição</option>
                  {availableSecondaryOffensive.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {formatPositionName(pos.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Aviso para goleiras */}
        {isGoalkeeper && (
          <div className="p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
            <p className="text-sm text-brand-700 dark:text-brand-300">
              <Shield className="w-4 h-4 inline-block mr-1" />
              {personGender === 'masculino' ? 'Goleiros' : 'Goleiras'} não possuem posições ofensivas (RD13)
            </p>
          </div>
        )}
        
        {/* Escolaridade e Camisa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nível de Escolaridade */}
          <div>
            <label 
              htmlFor="schooling_level_id" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              <GraduationCap className="w-4 h-4 inline-block mr-1" />
              Escolaridade
            </label>
            <select
              id="schooling_level_id"
              value={data?.schooling_level_id || ''}
              onChange={(e) => onFieldChange('schooling_level_id', e.target.value ? parseInt(e.target.value) : undefined)}
              onBlur={() => onBlur('schooling_level_id')}
              className={selectClass(false)}
            >
              <option value="">Selecione a escolaridade</option>
              {schoolingLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Número da Camisa */}
          <div>
            <label 
              htmlFor="shirt_number" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              <Hash className="w-4 h-4 inline-block mr-1" />
              Número da Camisa
              <span className="text-xs text-gray-500 font-normal ml-1">(1-99)</span>
            </label>
            <input
              type="number"
              id="shirt_number"
              value={data?.shirt_number || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                if (value === undefined || (value >= 1 && value <= 99)) {
                  onFieldChange('shirt_number', value);
                }
              }}
              onBlur={() => onBlur('shirt_number')}
              min={1}
              max={99}
              placeholder="Ex: 10"
              className={selectClass(Boolean(showError('shirt_number')))}
            />
            {showError('shirt_number') && (
              <p className="mt-1.5 text-xs text-error-500">{errors['athlete.shirt_number']}</p>
            )}
          </div>
        </div>
        
        {/* Dados do Responsável */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-warning-500" />
            Responsável (para menores de 18 anos)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Responsável */}
            <div>
              <label 
                htmlFor="guardian_name" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Nome do Responsável
              </label>
              <input
                type="text"
                id="guardian_name"
                value={data?.guardian_name || ''}
                onChange={(e) => onFieldChange('guardian_name', e.target.value || undefined)}
                onBlur={() => onBlur('guardian_name')}
                placeholder="Nome completo do responsável"
                className={selectClass(false)}
              />
            </div>
            
            {/* Telefone do Responsável */}
            <div>
              <label 
                htmlFor="guardian_phone" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Telefone do Responsável
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="guardian_phone"
                  value={data?.guardian_phone || ''}
                  onChange={(e) => onFieldChange('guardian_phone', formatPhone(e.target.value) || undefined)}
                  onBlur={() => onBlur('guardian_phone')}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className={`pl-10 ${selectClass(Boolean(showError('guardian_phone')))}`}
                />
              </div>
              {showError('guardian_phone') && (
                <p className="mt-1.5 text-xs text-error-500">{errors['athlete.guardian_phone']}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
