'use client';

/**
 * GameReportTab - Tab de relatório do jogo
 * 
 * Permite:
 * - Visualizar relatório completo do jogo
 * - Gerar PDF do relatório
 * - Adicionar anotações e observações
 */

import { useState } from 'react';
import { Match } from '@/context/GamesContext';
import AppCard from '@/components/ui/AppCard';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { FileText, Download, SquarePen, Check } from 'lucide-react';

interface GameReportTabProps {
  game: Match;
}

export default function GameReportTab({ game }: GameReportTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [report, setReport] = useState({
    summary: 'Partida disputada com grande intensidade por ambas as equipes. Nossa equipe apresentou boa movimentação ofensiva, com destaque para o pivô Pedro Santos que marcou 8 gols. A defesa se manteve sólida durante a maior parte do jogo.',
    strengths: 'Contra-ataques rápidos, finalização de longa distância, goleiro seguro.',
    improvements: 'Marcação individual no pivô adversário, reposição de bola após gols sofridos.',
    observations: 'Jogador Lucas Oliveira apresentou sinais de fadiga no segundo tempo. Considerar substituição mais cedo na próxima partida.',
    nextActions: 'Trabalhar posicionamento defensivo no próximo treino. Revisar marcação em situações de superioridade numérica.',
  });

  // Se o jogo ainda não foi realizado
  if (game.status === 'Agendado') {
    return (
      <div className="p-6">
        <AppEmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Relatório indisponível"
          description="O relatório será disponibilizado após a realização do jogo"
        />
      </div>
    );
  }

  if (game.status === 'Cancelado') {
    return (
      <div className="p-6">
        <AppEmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Jogo cancelado"
          description="Este jogo foi cancelado, não há relatório disponível"
        />
      </div>
    );
  }

  const handleExportPDF = () => {
    // TODO: Implementar exportação de PDF
    alert('Funcionalidade de exportação de PDF será implementada');
  };

  const handleSaveReport = () => {
    // TODO: Salvar alterações do relatório na API
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com ações */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Relatório da Partida
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Análise completa do jogo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSaveReport}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Salvar
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <SquarePen className="h-4 w-4" />
              Editar
            </button>
          )}
          
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Informações básicas */}
      <AppCard>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {game.match_date 
                ? new Date(game.match_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Adversário</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {game.opponent_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Resultado</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {game.home_score} x {game.away_score}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Local</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {game.venue || (game.is_home ? 'Casa' : 'Fora')}
            </p>
          </div>
        </div>
      </AppCard>

      {/* Resumo */}
      <AppCard>
        <h4 className="mb-3 font-medium text-gray-900 dark:text-white">
          Resumo da Partida
        </h4>
        {isEditing ? (
          <textarea
            value={report.summary}
            onChange={(e) => setReport({ ...report, summary: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">{report.summary}</p>
        )}
      </AppCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pontos fortes */}
        <AppCard>
          <h4 className="mb-3 font-medium text-green-600 dark:text-green-400">
            ✓ Pontos Fortes
          </h4>
          {isEditing ? (
            <textarea
              value={report.strengths}
              onChange={(e) => setReport({ ...report, strengths: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">{report.strengths}</p>
          )}
        </AppCard>

        {/* Pontos a melhorar */}
        <AppCard>
          <h4 className="mb-3 font-medium text-orange-600 dark:text-orange-400">
            ⚠ Pontos a Melhorar
          </h4>
          {isEditing ? (
            <textarea
              value={report.improvements}
              onChange={(e) => setReport({ ...report, improvements: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">{report.improvements}</p>
          )}
        </AppCard>
      </div>

      {/* Observações */}
      <AppCard>
        <h4 className="mb-3 font-medium text-gray-900 dark:text-white">
          📝 Observações
        </h4>
        {isEditing ? (
          <textarea
            value={report.observations}
            onChange={(e) => setReport({ ...report, observations: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">{report.observations}</p>
        )}
      </AppCard>

      {/* Próximas ações */}
      <AppCard>
        <h4 className="mb-3 font-medium text-blue-600 dark:text-blue-400">
          🎯 Próximas Ações
        </h4>
        {isEditing ? (
          <textarea
            value={report.nextActions}
            onChange={(e) => setReport({ ...report, nextActions: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">{report.nextActions}</p>
        )}
      </AppCard>
    </div>
  );
}
