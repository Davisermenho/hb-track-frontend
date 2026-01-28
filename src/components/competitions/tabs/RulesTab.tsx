/**
 * RulesTab - Tab de regulamento da competição
 * 
 * Exibe regras e regulamentos configurados para a competição
 */

'use client';

import { 
  FileText,
  Scale,
  Clock,
  Users,
  Trophy,
  AlertTriangle,
  Pencil
} from 'lucide-react';
import { Competition } from '@/lib/api/competitions';

interface RulesTabProps {
  competition: Competition;
}

interface RuleCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number | null;
  description?: string;
}

function RuleCard({ icon, title, value, description }: RuleCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border 
                  border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h4>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {value || 'Não definido'}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RulesTab({ competition }: RulesTabProps) {
  // These would come from competition.rules in real implementation
  const rules = {
    gameTime: 60, // minutes
    maxPlayersPerTeam: 14,
    minPlayersToStart: 5,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    tiebreakers: ['Confronto direto', 'Saldo de gols', 'Gols pró'],
    yellowCardsForSuspension: 3,
    redCardSuspension: 1,
  };

  return (
    <div className="space-y-6">
      {/* Header with edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Regulamento
          </h3>
        </div>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                   text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20
                   transition-colors text-sm font-medium"
        >
          <Pencil className="w-4 h-4" />
          Editar Regras
        </button>
      </div>

      {/* Rules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RuleCard
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          title="Tempo de Jogo"
          value={`${rules.gameTime} minutos`}
          description="Duração total da partida"
        />
        
        <RuleCard
          icon={<Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          title="Jogadores por Time"
          value={`Máximo ${rules.maxPlayersPerTeam}`}
          description={`Mínimo de ${rules.minPlayersToStart} para iniciar`}
        />

        <RuleCard
          icon={<Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          title="Pontos por Vitória"
          value={rules.pointsForWin}
        />

        <RuleCard
          icon={<Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          title="Pontos por Empate"
          value={rules.pointsForDraw}
        />

        <RuleCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          title="Cartões Amarelos p/ Suspensão"
          value={rules.yellowCardsForSuspension}
          description="Acumulados em toda competição"
        />

        <RuleCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
          title="Suspensão por Vermelho"
          value={`${rules.redCardSuspension} jogo(s)`}
          description="Automático por expulsão"
        />
      </div>

      {/* Tiebreakers */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border 
                    border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Critérios de Desempate (em ordem)
        </h4>
        <ol className="space-y-2">
          {rules.tiebreakers.map((criteria, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-amber-100 
                             dark:bg-amber-900/30 rounded-full text-xs font-medium 
                             text-amber-600 dark:text-amber-400">
                {index + 1}
              </span>
              <span className="text-gray-900 dark:text-white">
                {criteria}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Empty state for rules */}
      {!rules && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum regulamento definido
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Configure as regras da competição para manter as partidas organizadas
          </p>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-amber-500 hover:bg-amber-600 text-white font-medium
                     transition-colors"
          >
            <Pencil className="w-5 h-5" />
            Configurar Regras
          </button>
        </div>
      )}
    </div>
  );
}
