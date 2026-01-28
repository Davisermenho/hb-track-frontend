'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';

interface SessionOption {
  id: string;
  type: 'training' | 'match';
  team_name: string;
  date: string;
  time?: string;
}

interface SessionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string, sessionType: 'training' | 'match') => void;
}

/**
 * Modal de Seleção de Sessão
 * 
 * Conforme STATISTICS.TXT:
 * - Tipo + Sessão obrigatórios
 * - Confirmar desabilitado até ambos válidos
 * - Cancelar/ESC retorna ao empty state
 * - Trocar tipo limpa sessão
 * - Foco automático no campo Tipo
 */
export function SessionSelectorModal({
  isOpen,
  onClose,
  onConfirm,
}: SessionSelectorModalProps) {
  const [sessionType, setSessionType] = useState<'training' | 'match' | ''>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar sessões quando tipo muda
  useEffect(() => {
    if (!sessionType) {
      setSessions([]);
      return;
    }

    async function loadSessions() {
      setLoading(true);
      setError(null);
      setSelectedSession(''); // Limpa seleção ao trocar tipo
      
      try {
        const endpoint = sessionType === 'training' ? '/training-sessions' : '/matches';
        const response = await apiClient.get<{ items: any[] }>(endpoint, {
          params: { limit: 20, page: 1 },
        });
        
        const items = response.items || [];
        
        if (items.length === 0) {
          setError('Nenhuma sessão encontrada para este período.');
          setSessions([]);
          return;
        }

        const formatted = items.map((item) => ({
          id: item.id,
          type: sessionType as 'training' | 'match',
          team_name: item.team?.name || item.team_name || 'Equipe',
          date: sessionType === 'training' 
            ? item.session_at?.split('T')[0] 
            : item.match_date,
          time: sessionType === 'training' 
            ? item.session_at?.split('T')[1]?.substring(0, 5)
            : item.start_time,
        }));

        setSessions(formatted);
      } catch (err) {
        setError('Não foi possível carregar as sessões agora. Tente novamente.');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [sessionType]);

  const handleConfirm = () => {
    if (sessionType && selectedSession) {
      onConfirm(selectedSession, sessionType);
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state
    setSessionType('');
    setSelectedSession('');
    setSessions([]);
    setError(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && sessionType && selectedSession) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  const canConfirm = sessionType && selectedSession;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
            Selecionar treino ou jogo
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Escolha a sessão para visualizar o controle operacional. Os dados exibidos correspondem exatamente à seleção.
          </p>

          {/* Tipo de sessão */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de sessão <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSessionType('training')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  sessionType === 'training'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
                autoFocus
              >
                Treino
              </button>
              <button
                type="button"
                onClick={() => setSessionType('match')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  sessionType === 'match'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                Jogo
              </button>
            </div>
          </div>

          {/* Sessão */}
          {sessionType && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sessão <span className="text-red-500">*</span>
              </label>
              
              {loading && (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  Carregando...
                </div>
              )}

              {error && (
                <div className="text-sm text-amber-600 dark:text-amber-400 py-2">
                  {error}
                </div>
              )}

              {!loading && !error && sessions.length > 0 && (
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Selecione uma sessão</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.date} · {session.team_name} {session.time ? `· ${session.time}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
