/**
 * Seção Equipe - Ficha Única
 * 
 * Permite selecionar uma equipe existente ou criar uma nova.
 * Usada para: Atleta, Treinador
 * 
 * Regras:
 * - RD10: Gênero do atleta deve ser compatível com o da equipe
 * - Validação de categoria pela idade
 */

'use client';

import { useState, useMemo } from 'react';
import { Users, Plus, Search, AlertTriangle } from 'lucide-react';
import CollapsibleSection from '@/components/form/CollapsibleSection';
import type { Team, Category, Gender } from '../../../types/unified-registration';

interface TeamData {
  existing_team_id?: number;
  create_team?: {
    name: string;
    category_id: number;
    gender: Gender;
  };
}

interface TeamSectionProps {
  data?: TeamData;
  teams: Team[];
  categories: Category[];
  errors: Record<string, string>;
  touched: Set<string>;
  hasOrganization: boolean;
  personGender?: Gender;
  onSelectTeam: (id: number | undefined) => void;
  onCreateTeam: (data: { name: string; category_id: number; gender: Gender } | undefined) => void;
  onBlur: (field: string) => void;
}

export default function TeamSection({
  data,
  teams,
  categories,
  errors,
  touched,
  hasOrganization,
  personGender,
  onSelectTeam,
  onCreateTeam,
  onBlur,
}: TeamSectionProps) {
  const [mode, setMode] = useState<'select' | 'create'>(
    data?.create_team ? 'create' : 'select'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [newTeamData, setNewTeamData] = useState({
    name: data?.create_team?.name || '',
    category_id: data?.create_team?.category_id || 0,
    gender: data?.create_team?.gender || personGender || 'feminino' as Gender,
  });
  
  // Filtrar equipes compatíveis com o gênero da pessoa (RD10)
  const compatibleTeams = useMemo(() => {
    if (!personGender) return teams;
    return teams.filter(team => team.gender === personGender);
  }, [teams, personGender]);
  
  // Filtrar equipes pelo termo de busca
  const filteredTeams = compatibleTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleModeChange = (newMode: 'select' | 'create') => {
    setMode(newMode);
    if (newMode === 'select') {
      onCreateTeam(undefined);
    } else {
      onSelectTeam(undefined);
    }
  };
  
  const handleTeamSelect = (teamId: number) => {
    onSelectTeam(teamId);
    onCreateTeam(undefined);
  };
  
  const handleNewTeamChange = (field: string, value: string | number) => {
    const updated = { ...newTeamData, [field]: value };
    setNewTeamData(updated);
    if (updated.name && updated.category_id && updated.gender) {
      onCreateTeam(updated as { name: string; category_id: number; gender: Gender });
    } else {
      onCreateTeam(undefined);
    }
  };
  
  const showError = (field: string) => {
    return touched.has(`team.${field}`) && errors[`team.${field}`];
  };
  
  const inputClass = `
    w-full h-11 px-4 rounded-lg border text-sm
    placeholder:text-gray-400 focus:outline-none focus:ring-3
    dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500
    border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/10
  `;
  
  const selectedTeam = teams.find(t => t.id === data?.existing_team_id);
  
  // Verificar se precisa selecionar organização primeiro
  if (!hasOrganization && teams.length === 0) {
    return (
      <CollapsibleSection
        title="Equipe"
        defaultOpen={true}
      >
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                Organização não selecionada
              </p>
              <p className="text-sm text-warning-600 dark:text-warning-400 mt-1">
                Selecione uma organização primeiro para ver as equipes disponíveis.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    );
  }
  
  return (
    <CollapsibleSection
      title="Equipe"
      defaultOpen={true}
      badge={selectedTeam?.name || (data?.create_team?.name ? 'Nova' : undefined)}
    >
      <div className="space-y-4">
        {/* Aviso sobre compatibilidade de gênero */}
        {personGender && teams.length > 0 && compatibleTeams.length < teams.length && (
          <div className="p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg text-sm text-brand-700 dark:text-brand-300">
            Exibindo apenas equipes do gênero {personGender} (RD10)
          </div>
        )}
        
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
                placeholder="Buscar equipe..."
                className={`pl-10 ${inputClass}`}
              />
            </div>
            
            {/* Lista de equipes */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTeams.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe disponível'}
                </div>
              ) : (
                filteredTeams.map((team) => {
                  const category = categories.find(c => c.id === team.category_id);
                  
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleTeamSelect(team.id)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                        flex items-center gap-3
                        ${data?.existing_team_id === team.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''}
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${data?.existing_team_id === team.id
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }
                      `}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          data?.existing_team_id === team.id
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {team.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {category && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {category.name}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            team.gender === 'feminino'
                              ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {team.gender === 'feminino' ? 'Feminino' : 'Masculino'}
                          </span>
                        </div>
                      </div>
                      {data?.existing_team_id === team.id && (
                        <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })
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
                htmlFor="team_name" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Nome da Equipe <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="team_name"
                value={newTeamData.name}
                onChange={(e) => handleNewTeamChange('name', e.target.value)}
                onBlur={() => onBlur('create_team.name')}
                placeholder="Ex: Equipe Sub-15"
                className={inputClass}
              />
              {showError('create_team.name') && (
                <p className="mt-1.5 text-xs text-error-500">{errors['team.create_team.name']}</p>
              )}
            </div>
            
            {/* Categoria */}
            <div>
              <label 
                htmlFor="team_category" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Categoria <span className="text-error-500">*</span>
              </label>
              <select
                id="team_category"
                value={newTeamData.category_id || ''}
                onChange={(e) => handleNewTeamChange('category_id', parseInt(e.target.value))}
                onBlur={() => onBlur('create_team.category_id')}
                className={inputClass}
              >
                <option value="">Selecione a categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (até {cat.max_age} anos)
                  </option>
                ))}
              </select>
              {showError('create_team.category_id') && (
                <p className="mt-1.5 text-xs text-error-500">{errors['team.create_team.category_id']}</p>
              )}
            </div>
            
            {/* Gênero */}
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Gênero da Equipe <span className="text-error-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className={`
                  flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border
                  ${newTeamData.gender === 'feminino'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-300 dark:border-gray-700'
                  }
                `}>
                  <input
                    type="radio"
                    name="team_gender"
                    value="feminino"
                    checked={newTeamData.gender === 'feminino'}
                    onChange={(e) => handleNewTeamChange('gender', e.target.value)}
                    className="w-4 h-4 text-pink-500"
                  />
                  <span className="text-sm">Feminino</span>
                </label>
                <label className={`
                  flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border
                  ${newTeamData.gender === 'masculino'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-700'
                  }
                `}>
                  <input
                    type="radio"
                    name="team_gender"
                    value="masculino"
                    checked={newTeamData.gender === 'masculino'}
                    onChange={(e) => handleNewTeamChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-sm">Masculino</span>
                </label>
              </div>
              {personGender && newTeamData.gender !== personGender && (
                <p className="mt-2 text-xs text-warning-600 dark:text-warning-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Atenção: o gênero da equipe é diferente do gênero da pessoa
                </p>
              )}
              {showError('create_team.gender') && (
                <p className="mt-1.5 text-xs text-error-500">{errors['team.create_team.gender']}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
