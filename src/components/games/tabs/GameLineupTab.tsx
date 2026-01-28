'use client';

/**
 * GameLineupTab - Tab de escalação do jogo
 * 
 * Permite:
 * - Definir titulares e reservas
 * - Arrastar jogadores entre posições
 * - Visualizar formação tática
 */

import { useState } from 'react';
import { Match } from '@/context/GamesContext';
import AppCard from '@/components/ui/AppCard';
import AppEmptyState from '@/components/ui/AppEmptyState';
import AppTag from '@/components/ui/AppTag';
import { Users, Plus, X, ArrowUpDown } from 'lucide-react';

interface GameLineupTabProps {
  game: Match;
}

// Mock de jogadores
const MOCK_PLAYERS = [
  { id: '1', name: 'João Silva', position: 'Goleiro', number: 1 },
  { id: '2', name: 'Pedro Santos', position: 'Pivô', number: 9 },
  { id: '3', name: 'Lucas Oliveira', position: 'Armador Central', number: 10 },
  { id: '4', name: 'Marcos Costa', position: 'Ponta Esquerda', number: 7 },
  { id: '5', name: 'André Lima', position: 'Ponta Direita', number: 11 },
  { id: '6', name: 'Rafael Souza', position: 'Armador Direito', number: 4 },
  { id: '7', name: 'Bruno Alves', position: 'Armador Esquerdo', number: 6 },
  { id: '8', name: 'Carlos Neto', position: 'Reserva', number: 12 },
  { id: '9', name: 'Diego Martins', position: 'Reserva', number: 13 },
  { id: '10', name: 'Eduardo Rocha', position: 'Reserva', number: 14 },
];

interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
}

export default function GameLineupTab({ game }: GameLineupTabProps) {
  const [starters, setStarters] = useState<Player[]>(MOCK_PLAYERS.slice(0, 7));
  const [reserves, setReserves] = useState<Player[]>(MOCK_PLAYERS.slice(7));
  const [isEditing, setIsEditing] = useState(false);

  const handleMoveToReserves = (player: Player) => {
    setStarters(starters.filter(p => p.id !== player.id));
    setReserves([...reserves, player]);
  };

  const handleMoveToStarters = (player: Player) => {
    if (starters.length >= 7) {
      alert('Máximo de 7 titulares permitidos');
      return;
    }
    setReserves(reserves.filter(p => p.id !== player.id));
    setStarters([...starters, player]);
  };

  const canEdit = game.status === 'Agendado';

  return (
    <div className="p-6">
      {/* Header com ações */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Escalação
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {starters.length}/7 titulares • {reserves.length} reservas
          </p>
        </div>
        
        {canEdit && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? 'Salvar Escalação' : 'Editar Escalação'}
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Titulares */}
        <AppCard>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <Users className="h-5 w-5 text-green-500" />
              Titulares
            </h4>
            <AppTag label={`${starters.length}/7`} color="green" size="sm" />
          </div>
          
          {starters.length === 0 ? (
            <AppEmptyState
              icon={<Users className="h-10 w-10" />}
              title="Sem titulares"
              description="Adicione jogadores à escalação titular"
              size="sm"
            />
          ) : (
            <div className="space-y-2">
              {starters.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900/50 dark:text-green-400">
                      {player.number}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {player.position}
                      </p>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <button
                      onClick={() => handleMoveToReserves(player)}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-600"
                      title="Mover para reservas"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </AppCard>

        {/* Reservas */}
        <AppCard>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <ArrowUpDown className="h-5 w-5 text-blue-500" />
              Reservas
            </h4>
            <AppTag label={`${reserves.length}`} color="blue" size="sm" />
          </div>
          
          {reserves.length === 0 ? (
            <AppEmptyState
              icon={<Users className="h-10 w-10" />}
              title="Sem reservas"
              description="Todos os jogadores estão escalados como titulares"
              size="sm"
            />
          ) : (
            <div className="space-y-2">
              {reserves.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                      {player.number}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {player.position}
                      </p>
                    </div>
                  </div>
                  
                  {isEditing && starters.length < 7 && (
                    <button
                      onClick={() => handleMoveToStarters(player)}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-green-500 dark:hover:bg-gray-600"
                      title="Mover para titulares"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>

      {/* Visualização do campo (opcional) */}
      <AppCard className="mt-6">
        <h4 className="mb-4 font-medium text-gray-900 dark:text-white">
          Formação Tática
        </h4>
        <div className="relative mx-auto h-64 w-full max-w-md rounded-lg bg-gradient-to-b from-green-600 to-green-700 p-4">
          {/* Campo simplificado */}
          <div className="absolute inset-4 rounded border-2 border-white/30">
            {/* Linha central */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/30" />
            {/* Círculo central */}
            <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
            
            {/* Posições dos jogadores (simplificado) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-gray-900">
                1
              </div>
            </div>
            
            {/* Linha de defesa/armação */}
            <div className="absolute bottom-16 left-0 right-0 flex justify-around px-4">
              {[6, 4].map((num) => (
                <div key={num} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900">
                  {num}
                </div>
              ))}
            </div>
            
            {/* Pontas e armador central */}
            <div className="absolute top-1/3 left-0 right-0 flex justify-between px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900">
                7
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900">
                10
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900">
                11
              </div>
            </div>
            
            {/* Pivô */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900">
                9
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Formação 6-0 (padrão)
        </p>
      </AppCard>
    </div>
  );
}
