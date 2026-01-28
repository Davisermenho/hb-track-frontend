'use client';

import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  onSelectSession: () => void;
}

/**
 * Empty State para /statistics
 * 
 * Conforme STATISTICS.TXT:
 * - Estado default e seguro da rota
 * - Copy fechado e definitivo
 * - Nenhum skeleton, loading ou erro
 * - CTA primário abre modal de seleção
 */
export function StatisticsEmptyState({ onSelectSession }: EmptyStateProps) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Ícone neutro e semântico */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        {/* Copy fechado */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Selecione um treino ou jogo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Para visualizar o controle operacional, escolha um treino ou jogo.
            Os dados exibidos sempre correspondem à sessão selecionada.
          </p>
        </div>

        {/* CTA primário */}
        <div className="pt-4">
          <Button
            onClick={onSelectSession}
            size="lg"
            className="w-full sm:w-auto"
          >
            Selecionar treino ou jogo
          </Button>
        </div>
      </div>
    </div>
  );
}
