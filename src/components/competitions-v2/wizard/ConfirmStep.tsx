/**
 * ConfirmStep - Etapa final de confirmação e salvamento
 * 
 * Features:
 * - Opções do que importar (equipes, jogos, fases)
 * - Resumo final
 * - Feedback de salvamento
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  CheckCircle, 
  Loader2, 
  Users, 
  Calendar, 
  Layers,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompetitionV2Context } from '@/context/CompetitionV2Context';
import { useCompetitionV2 } from '@/lib/hooks/useCompetitionsV2';
import { competitionsV2Service } from '@/lib/api/competitions-v2';
import type { CompetitionV2Create } from '@/lib/api/competitions-v2';

interface ConfirmStepProps {
  teamId: string;
  onSuccess: (competitionId: string) => void;
  onBack: () => void;
}

export default function ConfirmStep({ teamId, onSuccess, onBack }: ConfirmStepProps) {
  const { extractedData, setCompetition, setCompetitionId } = useCompetitionV2Context();
  
  const [importOptions, setImportOptions] = useState({
    createPhases: true,
    createTeams: true,
    createMatches: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCompetitionId, setSavedCompetitionId] = useState<string | null>(null);

  if (!extractedData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum dado para salvar</p>
        <button
          onClick={onBack}
          className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
        >
          Voltar
        </button>
      </div>
    );
  }

  const totalTeams = extractedData.teams.length;
  const totalMatches = extractedData.phases.reduce((acc, p) => acc + p.matches.length, 0);
  const totalPhases = extractedData.phases.length;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // 1. Criar competição
      const competitionData: CompetitionV2Create = {
        team_id: teamId,
        name: extractedData.name,
        season: extractedData.season,
        organization: extractedData.organization,
        modality: extractedData.modality,
        competition_type: extractedData.competition_type,
        format_details: extractedData.format_details,
        tiebreaker_criteria: extractedData.tiebreaker_criteria,
        status: 'draft',
      };
      
      const created = await competitionsV2Service.create(competitionData);
      setSavedCompetitionId(created.id);
      
      // 2. Importar dados da IA (equipes, fases, jogos)
      const fullCompetition = await competitionsV2Service.importFromAI(
        created.id,
        extractedData,
        importOptions
      );
      
      setCompetition(fullCompetition);
      setCompetitionId(created.id);
      
      // 3. Aguardar um pouco para mostrar sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(created.id);
    } catch (err) {
      console.error('Error saving competition:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar competição');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOption = (option: keyof typeof importOptions) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  if (isSaving) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Salvando competição...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Aguarde enquanto criamos tudo para você
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
          <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Confirmar Importação
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Escolha o que deseja importar e confirme
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">Erro ao salvar</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          {extractedData.name}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalTeams}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Equipes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalPhases}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Fases</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalMatches}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Jogos</p>
          </div>
        </div>
      </div>

      {/* Import Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          O que importar?
        </h4>
        
        <ImportOption
          icon={Layers}
          label="Fases da competição"
          description={`${totalPhases} fase(s) encontrada(s)`}
          checked={importOptions.createPhases}
          onChange={() => toggleOption('createPhases')}
          disabled={totalPhases === 0}
        />
        
        <ImportOption
          icon={Users}
          label="Equipes adversárias"
          description={`${totalTeams} equipe(s) encontrada(s)`}
          checked={importOptions.createTeams}
          onChange={() => toggleOption('createTeams')}
          disabled={totalTeams === 0}
        />
        
        <ImportOption
          icon={Calendar}
          label="Jogos/Tabela"
          description={`${totalMatches} jogo(s) encontrado(s)`}
          checked={importOptions.createMatches}
          onChange={() => toggleOption('createMatches')}
          disabled={totalMatches === 0 || !importOptions.createTeams}
        />
        
        {!importOptions.createTeams && totalMatches > 0 && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 ml-9">
            ⚠️ Para importar jogos, é necessário importar as equipes
          </p>
        )}
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <p>
          💡 Você poderá editar todos os dados após a importação. 
          A competição será criada com status "Rascunho".
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          disabled={isSaving}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium
                   bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg 
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          Criar Competição
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface ImportOptionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function ImportOption({ 
  icon: Icon, 
  label, 
  description, 
  checked, 
  onChange, 
  disabled 
}: ImportOptionProps) {
  return (
    <label className={cn(
      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
      disabled 
        ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
        : checked
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700'
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 text-amber-600 
                 focus:ring-amber-500 disabled:opacity-50"
      />
      <Icon className={cn(
        'w-5 h-5',
        checked ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
      )} />
      <div className="flex-1">
        <p className={cn(
          'font-medium text-sm',
          checked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
        )}>
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">{description}</p>
      </div>
    </label>
  );
}
