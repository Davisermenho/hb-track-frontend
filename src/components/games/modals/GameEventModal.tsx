'use client';

/**
 * GameEventModal - Modal para adicionar evento ao jogo
 * 
 * Tipos de evento:
 * - Gol
 * - Cartão amarelo
 * - Cartão vermelho
 * - Substituição
 * - Timeout
 * - Outro
 */

import { useState } from 'react';
import { MatchEvent } from '@/context/GamesContext';
import AppModal from '@/components/ui/AppModal';

interface GameEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onSuccess: (event: MatchEvent) => void;
}

const EVENT_TYPES = [
  { value: 'goal', label: 'Gol', icon: '⚽' },
  { value: 'yellow_card', label: 'Cartão Amarelo', icon: '🟨' },
  { value: 'red_card', label: 'Cartão Vermelho', icon: '🟥' },
  { value: 'substitution', label: 'Substituição', icon: '🔄' },
  { value: 'timeout', label: 'Timeout', icon: '⏱️' },
  { value: 'other', label: 'Outro', icon: '📝' },
];

// Mock de jogadores
const MOCK_PLAYERS = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Pedro Santos' },
  { id: '3', name: 'Lucas Oliveira' },
  { id: '4', name: 'Marcos Costa' },
  { id: '5', name: 'André Lima' },
  { id: '6', name: 'Rafael Souza' },
  { id: '7', name: 'Bruno Alves' },
];

export default function GameEventModal({ isOpen, onClose, matchId, onSuccess }: GameEventModalProps) {
  const [formData, setFormData] = useState({
    event_type: 'goal',
    minute: '',
    player_id: '',
    player_name: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Se for seleção de jogador, atualiza também o nome
    if (name === 'player_id') {
      const player = MOCK_PLAYERS.find(p => p.id === value);
      setFormData({ 
        ...formData, 
        player_id: value,
        player_name: player?.name || '',
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      // TODO: Substituir por chamada real à API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newEvent: MatchEvent = {
        id: `event-${Date.now()}`,
        match_id: matchId,
        event_type: formData.event_type as MatchEvent['event_type'],
        minute: formData.minute ? parseInt(formData.minute) : undefined,
        player_id: formData.player_id || undefined,
        player_name: formData.player_name || undefined,
        description: formData.description || undefined,
      };

      onSuccess(newEvent);
      resetForm();
    } catch (err) {
      setError('Erro ao adicionar evento. Tente novamente.');
      console.error('Erro ao adicionar evento:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      event_type: 'goal',
      minute: '',
      player_id: '',
      player_name: '',
      description: '',
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Verifica se o tipo de evento requer jogador
  const requiresPlayer = ['goal', 'yellow_card', 'red_card', 'substitution'].includes(formData.event_type);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Evento"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Tipo de evento */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de Evento <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, event_type: type.value })}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                  formData.event_type === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Minuto */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Minuto
          </label>
          <input
            type="number"
            name="minute"
            value={formData.minute}
            onChange={handleChange}
            min="0"
            max="60"
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Jogador (condicional) */}
        {requiresPlayer && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Jogador
            </label>
            <select
              name="player_id"
              value={formData.player_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione um jogador</option>
              {MOCK_PLAYERS.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Descrição */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descrição
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder="Detalhes do evento..."
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
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
