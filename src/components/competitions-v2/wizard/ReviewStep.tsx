/**
 * ReviewStep - Etapa de revisão dos dados extraídos pela IA
 * 
 * Features:
 * - Formulário pré-preenchido com badges de confiança
 * - Edição inline de campos
 * - Lista de equipes e jogos extraídos
 * - Warnings e sugestões da IA
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Users,
  Calendar,
  Trophy,
  Edit3,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompetitionV2Context } from '@/context/CompetitionV2Context';
import AIConfidenceBadge, { ConfidenceSummary } from '../AIConfidenceBadge';
import type { 
  AIExtractedCompetition, 
  AIExtractedTeam, 
  AIExtractedMatch,
  CompetitionType,
  Modality,
} from '@/lib/api/competitions-v2';

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

const COMPETITION_TYPES: { value: CompetitionType; label: string }[] = [
  { value: 'league', label: 'Liga/Campeonato' },
  { value: 'cup', label: 'Copa' },
  { value: 'tournament', label: 'Torneio' },
  { value: 'round_robin', label: 'Todos contra todos' },
  { value: 'knockout', label: 'Mata-mata' },
  { value: 'groups_knockout', label: 'Grupos + Mata-mata' },
  { value: 'friendly', label: 'Amistoso' },
];

const MODALITIES: { value: Modality; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'misto', label: 'Misto' },
  { value: 'beach_handball', label: 'Beach Handball' },
];

export default function ReviewStep({ onNext, onBack }: ReviewStepProps) {
  const { extractedData, setExtractedData, processingTimeMs } = useCompetitionV2Context();
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    teams: true,
    matches: false,
  });
  
  if (!extractedData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum dado extraído encontrado</p>
        <button
          onClick={onBack}
          className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = <K extends keyof AIExtractedCompetition>(
    field: K, 
    value: AIExtractedCompetition[K]
  ) => {
    setExtractedData({
      ...extractedData,
      [field]: value,
    });
  };

  const updateTeam = (index: number, updates: Partial<AIExtractedTeam>) => {
    const newTeams = [...extractedData.teams];
    newTeams[index] = { ...newTeams[index], ...updates };
    setExtractedData({ ...extractedData, teams: newTeams });
  };

  const removeTeam = (index: number) => {
    const newTeams = extractedData.teams.filter((_, i) => i !== index);
    setExtractedData({ ...extractedData, teams: newTeams });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Dados Extraídos
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Revise e ajuste os dados antes de salvar
          {processingTimeMs && (
            <span className="ml-2 text-xs text-gray-400">
              (processado em {(processingTimeMs / 1000).toFixed(1)}s)
            </span>
          )}
        </p>
      </div>

      {/* Confidence Summary */}
      <ConfidenceSummary scores={extractedData.confidence_scores} />

      {/* Warnings */}
      {extractedData.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                Atenção
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                {extractedData.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {extractedData.suggestions.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                Sugestões
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-400">
                {extractedData.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info Section */}
      <SectionCard
        title="Informações Básicas"
        icon={Trophy}
        isExpanded={expandedSections.basic}
        onToggle={() => toggleSection('basic')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="md:col-span-2">
            <FieldWithConfidence
              label="Nome da Competição"
              value={extractedData.name}
              confidence={extractedData.confidence_scores.name}
              onChange={(v) => updateField('name', v)}
            />
          </div>

          {/* Temporada */}
          <FieldWithConfidence
            label="Temporada"
            value={extractedData.season}
            confidence={extractedData.confidence_scores.overall}
            onChange={(v) => updateField('season', v)}
          />

          {/* Organização */}
          <FieldWithConfidence
            label="Organização"
            value={extractedData.organization || ''}
            confidence={extractedData.confidence_scores.overall}
            onChange={(v) => updateField('organization', v || undefined)}
          />

          {/* Tipo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tipo de Competição
            </label>
            <select
              value={extractedData.competition_type}
              onChange={(e) => updateField('competition_type', e.target.value as CompetitionType)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {COMPETITION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Modalidade */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Modalidade
            </label>
            <select
              value={extractedData.modality || 'masculino'}
              onChange={(e) => updateField('modality', e.target.value as Modality)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {MODALITIES.map(mod => (
                <option key={mod.value} value={mod.value}>{mod.label}</option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Teams Section */}
      <SectionCard
        title={`Equipes (${extractedData.teams.length})`}
        icon={Users}
        isExpanded={expandedSections.teams}
        onToggle={() => toggleSection('teams')}
        badge={<AIConfidenceBadge confidence={extractedData.confidence_scores.teams} size="sm" />}
      >
        <div className="space-y-2">
          {extractedData.teams.map((team, index) => (
            <TeamRow
              key={index}
              team={team}
              onUpdate={(updates) => updateTeam(index, updates)}
              onRemove={() => removeTeam(index)}
            />
          ))}
          {extractedData.teams.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhuma equipe extraída
            </p>
          )}
        </div>
      </SectionCard>

      {/* Matches Preview Section */}
      <SectionCard
        title={`Jogos Extraídos (${extractedData.phases.reduce((acc, p) => acc + p.matches.length, 0)})`}
        icon={Calendar}
        isExpanded={expandedSections.matches}
        onToggle={() => toggleSection('matches')}
        badge={<AIConfidenceBadge confidence={extractedData.confidence_scores.matches} size="sm" />}
      >
        <div className="space-y-4">
          {extractedData.phases.map((phase, phaseIndex) => (
            <div key={phaseIndex}>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {phase.name} ({phase.matches.length} jogos)
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {phase.matches.slice(0, 5).map((match, matchIndex) => (
                  <MatchPreviewRow key={matchIndex} match={match} />
                ))}
                {phase.matches.length > 5 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    + {phase.matches.length - 5} jogos...
                  </p>
                )}
              </div>
            </div>
          ))}
          {extractedData.phases.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum jogo extraído
            </p>
          )}
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
        >
          ← Voltar
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium
                   bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg transition-all"
        >
          Confirmar e Salvar
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, isExpanded, onToggle, badge, children }: SectionCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          {badge}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

interface FieldWithConfidenceProps {
  label: string;
  value: string;
  confidence: number;
  onChange: (value: string) => void;
}

function FieldWithConfidence({ label, value, confidence, onChange }: FieldWithConfidenceProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        <span>{label}</span>
        <AIConfidenceBadge confidence={confidence} size="sm" showLabel={false} />
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          className={cn(
            'w-full px-3 py-2 pr-8 rounded-lg border transition-colors',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
            'focus:ring-2 focus:ring-amber-500 focus:border-transparent',
            confidence < 0.5 
              ? 'border-yellow-300 dark:border-yellow-600' 
              : 'border-gray-300 dark:border-gray-600'
          )}
        />
        <Edit3 className={cn(
          'absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-opacity',
          isEditing ? 'opacity-0' : 'opacity-30'
        )} />
      </div>
    </div>
  );
}

interface TeamRowProps {
  team: AIExtractedTeam;
  onUpdate: (updates: Partial<AIExtractedTeam>) => void;
  onRemove: () => void;
}

function TeamRow({ team, onUpdate, onRemove }: TeamRowProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      team.is_our_team 
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
    )}>
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={team.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-2 py-1 text-sm rounded border border-transparent 
                   bg-transparent hover:border-gray-300 dark:hover:border-gray-600
                   focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                   text-gray-900 dark:text-white"
        />
      </div>
      {team.city && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {team.city}
        </span>
      )}
      {team.is_our_team && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded">
          Sua equipe
        </span>
      )}
      <AIConfidenceBadge confidence={team.confidence} size="sm" showLabel={false} />
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        title="Remover equipe"
      >
        ×
      </button>
    </div>
  );
}

interface MatchPreviewRowProps {
  match: AIExtractedMatch;
}

function MatchPreviewRow({ match }: MatchPreviewRowProps) {
  const hasScore = match.home_score !== undefined && match.away_score !== undefined;
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 rounded">
      <span className="flex-1 truncate text-right">{match.home_team}</span>
      <span className="flex-shrink-0 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-medium text-xs">
        {hasScore ? `${match.home_score} - ${match.away_score}` : 'vs'}
      </span>
      <span className="flex-1 truncate">{match.away_team}</span>
      {match.date && (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          {match.date}
        </span>
      )}
    </div>
  );
}
