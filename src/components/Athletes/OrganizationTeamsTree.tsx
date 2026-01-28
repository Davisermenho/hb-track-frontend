'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { teamsService, type Team } from '@/lib/api/teams';
import { cn } from '@/lib/utils';

interface OrganizationTeamsTreeProps {
  onTeamSelect: (teamId: string, teamName: string) => void;
  selectedTeamId: string | null;
}

export function OrganizationTeamsTree({ onTeamSelect, selectedTeamId }: OrganizationTeamsTreeProps) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [organizationExpanded, setOrganizationExpanded] = useState(true);

  // Buscar equipes da organização do usuário
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user?.organization_id) {
        setError('Usuário sem organização vinculada');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Buscar equipes da organização (filtrar apenas is_our_team = true)
        const response = await teamsService.list({ limit: 100 });
        console.log('[OrganizationTeamsTree] Total de equipes retornadas:', response.items.length);
        console.log('[OrganizationTeamsTree] Organização do usuário:', user.organization_id);

        const ourTeams = response.items.filter(
          team => team.organization_id === user.organization_id && team.is_our_team
        );

        console.log('[OrganizationTeamsTree] Equipes filtradas (nossa org + is_our_team):', ourTeams.length);
        console.log('[OrganizationTeamsTree] Equipes:', ourTeams.map(t => ({ id: t.id, name: t.name, org: t.organization_id, isOurs: t.is_our_team })));

        setTeams(ourTeams);
      } catch (err) {
        console.error('Erro ao carregar equipes:', err);
        setError('Erro ao carregar equipes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [user?.organization_id]);

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const handleTeamClick = (teamId: string, teamName: string) => {
    onTeamSelect(teamId, teamName);
    // Expandir automaticamente ao selecionar
    if (!expandedTeams.has(teamId)) {
      setExpandedTeams(new Set([...expandedTeams, teamId]));
    }
  };

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

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">Usuário não autenticado</p>
      </div>
    );
  }

  // Buscar nome da organização das equipes ou usar padrão
  const organizationName = teams.length > 0 && teams[0].organization_name
    ? teams[0].organization_name
    : 'Minha Organização';

  return (
    <div className="space-y-1">
      {/* Organização */}
      <div className="space-y-1">
        <button
          onClick={() => setOrganizationExpanded(!organizationExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {organizationExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
          {organizationExpanded ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
          )}
          <span className="truncate">{organizationName}</span>
        </button>

        {/* Equipes */}
        {organizationExpanded && (
          <div className="ml-4 space-y-1 border-l border-gray-300 dark:border-gray-700 pl-2">
            {teams.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Nenhuma equipe cadastrada
              </div>
            ) : (
              teams.map((team) => {
                const isExpanded = expandedTeams.has(team.id);
                const isSelected = selectedTeamId === team.id;

                return (
                  <div key={team.id} className="space-y-1">
                    {/* Nome da Equipe */}
                    <button
                      onClick={() => toggleTeam(team.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                      <Folder className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'
                      )} />
                      <span className="truncate font-medium">{team.name}</span>
                    </button>

                    {/* Relação de Atletas */}
                    {isExpanded && (
                      <button
                        onClick={() => handleTeamClick(team.id, team.name)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg ml-6 transition-colors',
                          isSelected
                            ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Relação de Atletas – {team.name}</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
