'use client';

/**
 * CancelGameModal - Modal de confirmação para cancelar jogo
 */

import { useState } from 'react';
import { Match } from '@/context/GamesContext';
import AppModal from '@/components/ui/AppModal';
import { AlertTriangle } from 'lucide-react';

interface CancelGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Match;
  onSuccess: () => void;
}

export default function CancelGameModal({ isOpen, onClose, game, onSuccess }: CancelGameModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      // TODO: Substituir por chamada real à API
      // await fetch(`/api/matches/${game.id}/cancel`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason }),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
      setReason('');
    } catch (err) {
      setError('Erro ao cancelar jogo. Tente novamente.');
      console.error('Erro ao cancelar jogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancelar Jogo"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Aviso */}
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <h4 className="font-medium text-red-800 dark:text-red-300">
              Tem certeza que deseja cancelar este jogo?
            </h4>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              Esta ação não pode ser desfeita. O jogo contra <strong>{game.opponent_name}</strong> será marcado como cancelado.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Motivo do cancelamento */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo do cancelamento (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Informe o motivo do cancelamento..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
