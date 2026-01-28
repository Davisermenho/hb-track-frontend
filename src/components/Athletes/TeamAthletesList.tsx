'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Eye, Loader2, Users } from 'lucide-react';
import { teamsService, type TeamRegistration } from '@/lib/api/teams';
import { cn } from '@/lib/utils';

interface TeamAthletesListProps {
  teamId: string | null;
  teamName: string;
  onAthleteSelect: (athleteId: string) => void;
  selectedAthleteId: string | null;
}

export function TeamAthletesList({ teamId, teamName, onAthleteSelect, selectedAthleteId }: TeamAthletesListProps) {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      if (!teamId) {
        setRegistrations([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await teamsService.getAthletes(teamId, {
          active_only: true,
          limit: 100,
        });

        setRegistrations(response.items || []);
      } catch (err) {
        console.error('Erro ao carregar atletas:', err);
        setError('Erro ao carregar atletas da equipe');
        setRegistrations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAthletes();
  }, [teamId]);

  if (!teamId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Users className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Selecione uma equipe na árvore ao lado para visualizar os atletas
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Users className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          Nenhuma atleta vinculada
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          A equipe "{teamName}" não possui atletas vinculadas no momento
        </p>
        <div className="flex gap-3">
          <a
            href="/admin/cadastro?flow=user&role=atleta"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            + Cadastrar Atleta
          </a>
          <a
            href="/admin/athletes/import"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Importar Planilha
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {teamName}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {registrations.length} {registrations.length === 1 ? 'atleta' : 'atletas'}
        </p>
      </div>

      <div className="space-y-1 px-2">
        {registrations.map((registration) => {
          const athlete = registration.athlete;
          if (!athlete) return null;

          const isSelected = selectedAthleteId === registration.athlete_id;
          const athleteName = athlete.athlete_nickname || athlete.athlete_name || 'Atleta sem nome';
          const athletePhoto = null; // TODO: adicionar foto quando disponível na API

          return (
            <div
              key={registration.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer',
                isSelected
                  ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
              )}
              onClick={() => onAthleteSelect(registration.athlete_id)}
            >
              {/* Foto do Perfil */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                  {athletePhoto ? (
                    <Image
                      src={athletePhoto}
                      alt={athleteName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                      {athleteName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Nome da Atleta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isSelected
                      ? 'text-brand-900 dark:text-brand-100'
                      : 'text-gray-900 dark:text-white'
                  )}>
                    {athleteName}
                  </p>
                  {/* Badge de status do vínculo */}
                  {!registration.end_at && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500" title="Vínculo ativo" />
                  )}
                </div>
                {registration.role && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {registration.role}
                  </p>
                )}
              </div>

              {/* Ícone Visualizar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAthleteSelect(registration.athlete_id);
                }}
                className={cn(
                  'flex-shrink-0 p-1.5 rounded-lg transition-colors',
                  isSelected
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400'
                    : 'text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                title="Visualizar ficha completa"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
