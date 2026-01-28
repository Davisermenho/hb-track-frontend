'use client';

import React, { useEffect, useState } from 'react';
import { Target, AlertCircle, Shirt, GraduationCap } from 'lucide-react';
import { AthleteFormStepProps, ATHLETE_VALIDATION } from '../../../types/athlete-form';
import { 
  defensivePositionsService, 
  offensivePositionsService, 
  schoolingLevelsService, 
  DefensivePosition, 
  OffensivePosition, 
  SchoolingLevel 
} from '@/lib/api/positions';

/**
 * Step 5: Dados Esportivos
 * 
 * Campos:
 * - Posição defensiva principal (OBRIGATÓRIA)
 * - Posição defensiva secundária (opcional)
 * - Posição ofensiva principal (OBRIGATÓRIA, exceto goleiras - RD13)
 * - Posição ofensiva secundária (opcional)
 * - Número da camisa
 * - Escolaridade
 * 
 * RD13: Goleiras (defensive_position_id = 5) não possuem posição ofensiva
 * pois não atuam como jogadoras de linha.
 */

// RD13: ID=5 é Goleira
const GOALKEEPER_POSITION_ID = 5;

export default function AthleteFormStep5({ data, onChange, errors }: AthleteFormStepProps) {
  const [defensivePositions, setDefensivePositions] = useState<DefensivePosition[]>([]);
  const [offensivePositions, setOffensivePositions] = useState<OffensivePosition[]>([]);
  const [schoolingLevels, setSchoolingLevels] = useState<SchoolingLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // RD13: Verificar se a posição selecionada é goleira
  const isGoalkeeper = data.main_defensive_position_id === GOALKEEPER_POSITION_ID;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [defPos, offPos, schooling] = await Promise.all([
          defensivePositionsService.list(),
          offensivePositionsService.list(),
          schoolingLevelsService.list(),
        ]);
        setDefensivePositions(defPos);
        setOffensivePositions(offPos);
        setSchoolingLevels(schooling);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        // Fallback com dados padrão conforme seed do banco (0001-neondb.sql)
        setDefensivePositions([
          { id: '1', code: 'base_defender', name: 'Defensora Base', abbreviation: 'DB', is_active: true },
          { id: '2', code: 'advanced_defender', name: 'Defensora Avançada', abbreviation: 'DA', is_active: true },
          { id: '3', code: 'first_defender', name: '1ª Defensora', abbreviation: '1D', is_active: true },
          { id: '4', code: 'second_defender', name: '2ª Defensora', abbreviation: '2D', is_active: true },
          { id: '5', code: 'goalkeeper', name: 'Goleira', abbreviation: 'GOL', is_active: true },
        ]);
        setOffensivePositions([
          { id: '1', code: 'center_back', name: 'Armadora Central', abbreviation: 'AC', is_active: true },
          { id: '2', code: 'left_back', name: 'Lateral Esquerda', abbreviation: 'LE', is_active: true },
          { id: '3', code: 'right_back', name: 'Lateral Direita', abbreviation: 'LD', is_active: true },
          { id: '4', code: 'left_wing', name: 'Ponta Esquerda', abbreviation: 'PE', is_active: true },
          { id: '5', code: 'right_wing', name: 'Ponta Direita', abbreviation: 'PD', is_active: true },
          { id: '6', code: 'pivot', name: 'Pivô', abbreviation: 'PI', is_active: true },
        ]);
        setSchoolingLevels([
          { id: '1', code: 'elementary_incomplete', name: 'Ensino Fundamental Incompleto', is_active: true },
          { id: '2', code: 'elementary_complete', name: 'Ensino Fundamental Completo', is_active: true },
          { id: '3', code: 'high_school_incomplete', name: 'Ensino Médio Incompleto', is_active: true },
          { id: '4', code: 'high_school_complete', name: 'Ensino Médio Completo', is_active: true },
          { id: '5', code: 'higher_education_incomplete', name: 'Ensino Superior Incompleto', is_active: true },
          { id: '6', code: 'higher_education_complete', name: 'Ensino Superior Completo', is_active: true },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /**
   * Handler para mudança de posição defensiva principal
   * Se mudar para goleira, limpa posições ofensivas automaticamente (RD13)
   */
  const handleDefensivePositionChange = (newPositionId: number | undefined) => {
    onChange('main_defensive_position_id', newPositionId);
    
    // RD13: Se mudou para goleira, limpar posições ofensivas
    if (newPositionId === GOALKEEPER_POSITION_ID) {
      onChange('main_offensive_position_id', undefined);
      onChange('secondary_offensive_position_id', undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <Target className="w-5 h-5 text-pink-600" />
        <span>Dados Esportivos</span>
      </div>

      {/* Alerta RD13 - Goleira */}
      {isGoalkeeper && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Posição de Goleira selecionada
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Goleiras não possuem posição ofensiva pois não atuam como jogadoras de linha (RD13).
            </p>
          </div>
        </div>
      )}

      {/* Número da Camisa e Escolaridade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="flex items-center gap-1">
              <Shirt className="w-4 h-4" />
              Número da Camisa
            </span>
          </label>
          <input
            type="number"
            min={ATHLETE_VALIDATION.MIN_SHIRT_NUMBER}
            max={ATHLETE_VALIDATION.MAX_SHIRT_NUMBER}
            value={data.shirt_number || ''}
            onChange={(e) => onChange('shirt_number', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="1-99"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
              errors.shirt_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.shirt_number && (
            <p className="text-sm text-red-500 mt-1">{errors.shirt_number}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              Escolaridade
            </span>
          </label>
          <select
            value={data.schooling_id || ''}
            onChange={(e) => onChange('schooling_id', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Selecione</option>
            {schoolingLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posições Defensivas */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Posições Defensivas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Posição Principal <span className="text-red-500">*</span>
            </label>
            <select
              value={data.main_defensive_position_id || ''}
              onChange={(e) => handleDefensivePositionChange(e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.main_defensive_position_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Selecione</option>
              {defensivePositions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
            {errors.main_defensive_position_id && (
              <p className="text-sm text-red-500 mt-1">{errors.main_defensive_position_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Posição Secundária
            </label>
            <select
              value={data.secondary_defensive_position_id || ''}
              onChange={(e) => onChange('secondary_defensive_position_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Nenhuma</option>
              {defensivePositions
                .filter((pos) => String(pos.id) !== String(data.main_defensive_position_id ?? ''))
                .map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posições Ofensivas */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Posições Ofensivas {isGoalkeeper && '(N/A - Goleira)'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Posição Principal {!isGoalkeeper && <span className="text-red-500">*</span>}
            </label>
            <select
              value={data.main_offensive_position_id || ''}
              onChange={(e) => onChange('main_offensive_position_id', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isGoalkeeper}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.main_offensive_position_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${isGoalkeeper ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900' : ''}`}
            >
              <option value="">{isGoalkeeper ? 'N/A (Goleira)' : 'Selecione'}</option>
              {!isGoalkeeper && offensivePositions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
            {errors.main_offensive_position_id && (
              <p className="text-sm text-red-500 mt-1">{errors.main_offensive_position_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Posição Secundária
            </label>
            <select
              value={data.secondary_offensive_position_id || ''}
              onChange={(e) => onChange('secondary_offensive_position_id', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isGoalkeeper}
              className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                isGoalkeeper ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900' : ''
              }`}
            >
              <option value="">{isGoalkeeper ? 'N/A (Goleira)' : 'Nenhuma'}</option>
              {!isGoalkeeper && offensivePositions
                .filter((pos) => String(pos.id) !== String(data.main_offensive_position_id ?? ''))
                .map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
