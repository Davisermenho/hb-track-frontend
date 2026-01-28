'use client';

/**
 * CreateGameModal - Modal para criar novo jogo
 * 
 * Campos:
 * - Adversário
 * - Data e horário
 * - Local (Casa/Fora)
 * - Competição
 * - Notas
 */

import { useState } from 'react';
import { useGamesContext, Match } from '@/context/GamesContext';
import AppModal from '@/components/ui/AppModal';
import AppToast from '@/components/ui/AppToast';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (game: Match) => void;
}

export default function CreateGameModal({ isOpen, onClose, onSuccess }: CreateGameModalProps) {
  const { selectedTeam } = useGamesContext();
  
  const [formData, setFormData] = useState({
    opponent_name: '',
    match_date: '',
    match_time: '',
    is_home: true,
    venue: '',
    competition: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam?.id) {
      setError('Nenhuma equipe selecionada');
      return;
    }

    if (!formData.opponent_name || !formData.match_date) {
      setError('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Combina data e hora
      const matchDateTime = formData.match_time 
        ? `${formData.match_date}T${formData.match_time}:00`
        : `${formData.match_date}T00:00:00`;

      // TODO: Substituir por chamada real à API
      // const response = await fetch(`/api/teams/${activeTeam.id}/matches`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     opponent_name: formData.opponent_name,
      //     match_date: matchDateTime,
      //     is_home: formData.is_home,
      //     venue: formData.venue || null,
      //     competition: formData.competition || null,
      //     notes: formData.notes || null,
      //   }),
      // });
      // const newGame = await response.json();

      // Mock
      await new Promise(resolve => setTimeout(resolve, 500));
      const newGame: Match = {
        id: `game-${Date.now()}`,
        team_id: selectedTeam.id,
        opponent_id: `opp-${Date.now()}`,
        opponent_name: formData.opponent_name,
        status: 'Agendado',
        match_date: matchDateTime,
        is_home: formData.is_home,
        venue: formData.venue || undefined,
        competition: formData.competition || undefined,
        notes: formData.notes || undefined,
      };

      onSuccess(newGame);
      resetForm();
    } catch (err) {
      setError('Erro ao criar jogo. Tente novamente.');
      console.error('Erro ao criar jogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      opponent_name: '',
      match_date: '',
      match_time: '',
      is_home: true,
      venue: '',
      competition: '',
      notes: '',
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agendar Novo Jogo"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Adversário */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Adversário <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="opponent_name"
            value={formData.opponent_name}
            onChange={handleChange}
            placeholder="Nome do time adversário"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Data e Hora */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="match_date"
              value={formData.match_date}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Horário
            </label>
            <input
              type="time"
              name="match_time"
              value={formData.match_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Local (Casa/Fora) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mando de Campo
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="is_home"
                checked={formData.is_home === true}
                onChange={() => setFormData({ ...formData, is_home: true })}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Casa</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="is_home"
                checked={formData.is_home === false}
                onChange={() => setFormData({ ...formData, is_home: false })}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Fora</span>
            </label>
          </div>
        </div>

        {/* Local/Ginásio */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Local / Ginásio
          </label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="Ex: Ginásio Municipal"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Competição */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Competição
          </label>
          <input
            type="text"
            name="competition"
            value={formData.competition}
            onChange={handleChange}
            placeholder="Ex: Campeonato Estadual"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notas / Observações
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Informações adicionais sobre o jogo..."
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
            {loading ? 'Agendando...' : 'Agendar Jogo'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
