'use client';

/**
 * EditGameDrawer - Drawer lateral para editar informações do jogo
 */

import { useState, useEffect } from 'react';
import { Match } from '@/context/GamesContext';
import AppDrawer from '@/components/ui/AppDrawer';

interface EditGameDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  game: Match;
  onSuccess: (updatedGame: Match) => void;
}

export default function EditGameDrawer({ isOpen, onClose, game, onSuccess }: EditGameDrawerProps) {
  const [formData, setFormData] = useState({
    opponent_name: '',
    match_date: '',
    match_time: '',
    is_home: true,
    venue: '',
    competition: '',
    notes: '',
    home_score: '',
    away_score: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche form com dados do jogo quando abre
  useEffect(() => {
    if (isOpen && game) {
      const matchDate = game.match_date ? new Date(game.match_date) : null;
      
      setFormData({
        opponent_name: game.opponent_name || '',
        match_date: matchDate ? matchDate.toISOString().split('T')[0] : '',
        match_time: matchDate ? matchDate.toTimeString().slice(0, 5) : '',
        is_home: game.is_home ?? true,
        venue: game.venue || '',
        competition: game.competition || '',
        notes: game.notes || '',
        home_score: game.home_score?.toString() || '',
        away_score: game.away_score?.toString() || '',
      });
    }
  }, [isOpen, game]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // await fetch(`/api/matches/${game.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({...}),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedGame: Match = {
        ...game,
        opponent_name: formData.opponent_name,
        match_date: matchDateTime,
        is_home: formData.is_home,
        venue: formData.venue || undefined,
        competition: formData.competition || undefined,
        notes: formData.notes || undefined,
        home_score: formData.home_score ? parseInt(formData.home_score) : undefined,
        away_score: formData.away_score ? parseInt(formData.away_score) : undefined,
      };

      onSuccess(updatedGame);
    } catch (err) {
      setError('Erro ao atualizar jogo. Tente novamente.');
      console.error('Erro ao atualizar jogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Jogo"
      position="right"
    >
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Mando de campo */}
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
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Casa</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="is_home"
                  checked={formData.is_home === false}
                  onChange={() => setFormData({ ...formData, is_home: false })}
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Fora</span>
              </label>
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Local / Ginásio
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Placar (apenas para jogos finalizados) */}
          {game.status === 'Finalizado' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Placar
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="home_score"
                  value={formData.home_score}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <span className="text-gray-500">×</span>
                <input
                  type="number"
                  name="away_score"
                  value={formData.away_score}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas / Observações
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Botões fixos no footer */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>
    </AppDrawer>
  );
}
