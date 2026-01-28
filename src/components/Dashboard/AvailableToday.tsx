"use client";

import Image from 'next/image';

/**
 * AvailableToday - Card "Quem Pode Jogar Hoje"
 * 
 * FASE 5.5 - FLUXO_GERENCIAMENTO_ATLETAS.md
 * 
 * Funcionalidades:
 * - Lista de atletas disponíveis para jogo
 * - Filtro por equipe
 * - Exclui: injured=true, suspended_until >= hoje, state != 'ativa'
 * - Cache de 5 minutos
 * 
 * Regras RAG:
 * - R12/R13: Estados e flags de restrição
 * - R15: Validação de categoria
 */

import React, { useState, useEffect, useCallback } from "react";
import { 
  Target, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Filter
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export interface AvailableAthlete {
  id: string;
  full_name: string;
  nickname?: string;
  photo_url?: string;
  defensive_position: string;
  offensive_position?: string;
  category: string;
  age: number;
  has_medical_restriction?: boolean;
  has_load_restriction?: boolean;
}

export interface Team {
  id: string;
  name: string;
  category: string;
  gender: string;
  athlete_count?: number;
}

interface AvailableTodayProps {
  teams?: Team[];
  onFetchAthletes?: (teamId: string | null) => Promise<AvailableAthlete[]>;
  onFetchTeams?: () => Promise<Team[]>;
  cacheTime?: number; // em ms (default: 5min)
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TEAMS: Team[] = [
  { id: '1', name: 'Infantil Feminino', category: 'Infantil', gender: 'feminino', athlete_count: 15 },
  { id: '2', name: 'Cadete Feminino', category: 'Cadete', gender: 'feminino', athlete_count: 18 },
  { id: '3', name: 'Juvenil Feminino', category: 'Juvenil', gender: 'feminino', athlete_count: 16 },
];

const MOCK_ATHLETES: AvailableAthlete[] = [
  {
    id: '1',
    full_name: 'Maria Silva Santos',
    nickname: 'Mari',
    defensive_position: 'Goleira',
    category: 'Infantil',
    age: 13,
  },
  {
    id: '2',
    full_name: 'Ana Carolina Oliveira',
    nickname: 'Carol',
    defensive_position: 'Armadora',
    offensive_position: 'Central',
    category: 'Infantil',
    age: 12,
  },
  {
    id: '3',
    full_name: 'Juliana Costa',
    defensive_position: 'Pivô',
    offensive_position: 'Pivô',
    category: 'Infantil',
    age: 13,
    has_medical_restriction: true,
  },
  {
    id: '4',
    full_name: 'Beatriz Lima',
    nickname: 'Bia',
    defensive_position: 'Ponta',
    offensive_position: 'Ponta Esquerda',
    category: 'Infantil',
    age: 12,
  },
  {
    id: '5',
    full_name: 'Camila Ferreira',
    defensive_position: 'Armadora',
    offensive_position: 'Lateral Direita',
    category: 'Infantil',
    age: 13,
    has_load_restriction: true,
  },
  {
    id: '6',
    full_name: 'Larissa Souza',
    defensive_position: 'Ponta',
    offensive_position: 'Ponta Direita',
    category: 'Infantil',
    age: 12,
  },
];

// ============================================================================
// UTILS
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function AvailableToday({
  teams: propTeams,
  onFetchAthletes,
  onFetchTeams,
  cacheTime = 5 * 60 * 1000, // 5 minutos
}: AvailableTodayProps) {
  const [teams, setTeams] = useState<Team[]>(propTeams || MOCK_TEAMS);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<AvailableAthlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Carregar equipes
  useEffect(() => {
    if (propTeams) {
      setTeams(propTeams);
      return;
    }

    if (onFetchTeams) {
      onFetchTeams()
        .then(data => setTeams(data))
        .catch(err => console.error('Erro ao carregar equipes:', err));
    }
  }, [propTeams, onFetchTeams]);

  // Carregar atletas quando equipe selecionada
  useEffect(() => {
    if (!selectedTeam) {
      setAthletes([]);
      return;
    }

    const fetchAthletes = async () => {
      setIsLoading(true);
      try {
        if (onFetchAthletes) {
          const data = await onFetchAthletes(selectedTeam);
          setAthletes(data);
        } else {
          // Mock data
          await new Promise(resolve => setTimeout(resolve, 300));
          setAthletes(MOCK_ATHLETES);
        }
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Erro ao carregar atletas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAthletes();

    // Cache refresh
    const interval = setInterval(fetchAthletes, cacheTime);
    return () => clearInterval(interval);
  }, [selectedTeam, onFetchAthletes, cacheTime]);

  // Equipe selecionada
  const currentTeam = teams.find(t => t.id === selectedTeam);

  // Contadores
  const totalAvailable = athletes.filter(a => !a.has_medical_restriction && !a.has_load_restriction).length;
  const withRestrictions = athletes.filter(a => a.has_medical_restriction || a.has_load_restriction).length;

  const handleRefresh = () => {
    if (selectedTeam) {
      setIsLoading(true);
      // Re-fetch
      if (onFetchAthletes) {
        onFetchAthletes(selectedTeam)
          .then(data => {
            setAthletes(data);
            setLastUpdated(new Date());
          })
          .finally(() => setIsLoading(false));
      } else {
        setTimeout(() => {
          setAthletes(MOCK_ATHLETES);
          setLastUpdated(new Date());
          setIsLoading(false);
        }, 300);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                🎯 Quem Pode Jogar Hoje
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Atletas disponíveis sem restrições
              </p>
            </div>
          </div>

          {/* Refresh */}
          {selectedTeam && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                       rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                       disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Seletor de Equipe */}
        <div className="mt-4 relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 
                     bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
                     rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-600 
                     transition-colors"
          >
            <span className={currentTeam ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
              {currentTeam ? currentTeam.name : 'Selecione uma equipe'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform 
                                   ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 
                          border border-gray-200 dark:border-gray-700 rounded-lg 
                          shadow-lg overflow-hidden">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeam(team.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 
                            text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                            transition-colors ${
                              selectedTeam === team.id 
                                ? 'bg-brand-50 dark:bg-brand-900/20' 
                                : ''
                            }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {team.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {team.category} • {team.gender}
                    </p>
                  </div>
                  {team.athlete_count && (
                    <span className="text-xs text-gray-400">
                      {team.athlete_count} atletas
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {!selectedTeam ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Selecione uma equipe para ver atletas disponíveis</p>
          </div>
        ) : isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent 
                          rounded-full animate-spin" />
          </div>
        ) : athletes.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma atleta disponível</p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totalAvailable}
                  </span> sem restrições
                </span>
              </div>
              {withRestrictions > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {withRestrictions}
                    </span> com restrições
                  </span>
                </div>
              )}
            </div>

            {/* Lista de Atletas */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {athletes.map(athlete => {
                const hasRestriction = athlete.has_medical_restriction || athlete.has_load_restriction;
                
                return (
                  <div
                    key={athlete.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors
                              ${hasRestriction 
                                ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' 
                                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full 
                                  flex items-center justify-center text-white font-medium overflow-hidden relative
                                  ${athlete.photo_url ? '' : getAvatarColor(athlete.full_name)}`}>
                      {athlete.photo_url ? (
                        <Image 
                          src={athlete.photo_url} 
                          alt={athlete.full_name}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        getInitials(athlete.full_name)
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {athlete.nickname || athlete.full_name.split(' ')[0]}
                        </p>
                        {hasRestriction && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {athlete.defensive_position}
                        {athlete.offensive_position && ` • ${athlete.offensive_position}`}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {hasRestriction ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full 
                                       bg-yellow-100 dark:bg-yellow-900/30 
                                       text-yellow-700 dark:text-yellow-400">
                          {athlete.has_medical_restriction ? '⚕️ Médica' : '⚡ Carga'}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Última atualização */}
            <p className="mt-4 text-xs text-center text-gray-400">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAvailableAthletes(teamId: string | null) {
  const [athletes, setAthletes] = useState<AvailableAthlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAthletes = useCallback(async () => {
    if (!teamId) {
      setAthletes([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // TODO: Chamar API real
      // const response = await apiClient.get<AvailableAthlete[]>(
      //   `/athletes/available-today?team_id=${teamId}`
      // );
      // setAthletes(response);
      
      // Mock
      await new Promise(resolve => setTimeout(resolve, 300));
      setAthletes(MOCK_ATHLETES);
    } catch (err) {
      setError('Erro ao carregar atletas disponíveis');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  return {
    athletes,
    isLoading,
    error,
    refetch: fetchAthletes,
  };
}
