'use client';

/**
 * GameOverviewTab - Tab de resumo do jogo
 * 
 * Exibe:
 * - Informações gerais do jogo
 * - Último confronto (head-to-head)
 * - Próximas ações
 */

import { Match } from '@/context/GamesContext';
import AppCard from '@/components/ui/AppCard';
import AppHighlight from '@/components/ui/AppHighlight';
import { Calendar, MapPin, Trophy, Clock, Users, FileText } from 'lucide-react';

interface GameOverviewTabProps {
  game: Match;
}

export default function GameOverviewTab({ game }: GameOverviewTabProps) {
  // Mock de histórico de confrontos
  const headToHead = {
    wins: 3,
    draws: 1,
    losses: 2,
    lastMatch: {
      date: '2024-01-15',
      score: '28-25',
      result: 'win',
    },
  };

  return (
    <div className="p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informações do jogo */}
        <AppCard>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
            <FileText className="h-5 w-5 text-blue-500" />
            Informações do Jogo
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Data e Hora
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.match_date 
                    ? new Date(game.match_date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Data não definida'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Local
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.venue || (game.is_home ? 'Casa' : 'Fora')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {game.is_home ? 'Mando de campo próprio' : 'Mando de campo adversário'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Competição
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.competition || 'Não especificada'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Adversário
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.opponent_name || 'Não definido'}
                </p>
              </div>
            </div>
          </div>
        </AppCard>

        {/* Histórico de confrontos */}
        <AppCard>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
            <Clock className="h-5 w-5 text-purple-500" />
            Histórico de Confrontos
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {headToHead.wins}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vitórias</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {headToHead.draws}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Empates</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {headToHead.losses}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Derrotas</p>
            </div>
          </div>
          
          {headToHead.lastMatch && (
            <div className="mt-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Último confronto
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(headToHead.lastMatch.date).toLocaleDateString('pt-BR')}
                </p>
                <AppHighlight 
                  variant={headToHead.lastMatch.result === 'win' ? 'success' : headToHead.lastMatch.result === 'loss' ? 'error' : 'warning'}
                >
                  {headToHead.lastMatch.score}
                </AppHighlight>
              </div>
            </div>
          )}
        </AppCard>

        {/* Notas e observações */}
        {game.notes && (
          <AppCard className="lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-yellow-500" />
              Notas e Observações
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {game.notes}
            </p>
          </AppCard>
        )}

        {/* Checklist pré-jogo (para jogos agendados) */}
        {game.status === 'Agendado' && (
          <AppCard className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Checklist Pré-Jogo
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Escalação definida', completed: false },
                { label: 'Treino tático realizado', completed: true },
                { label: 'Uniforme separado', completed: false },
                { label: 'Transporte confirmado', completed: false },
              ].map((item, index) => (
                <label 
                  key={index}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <input 
                    type="checkbox" 
                    defaultChecked={item.completed}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </AppCard>
        )}
      </div>
    </div>
  );
}
