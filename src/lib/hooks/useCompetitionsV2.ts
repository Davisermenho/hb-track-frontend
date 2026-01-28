/**
 * Hook: useCompetitionsV2
 * 
 * Gerencia estado de Competições V2 com integração IA Gemini
 * Base: competitions-v2.ts API Service
 * Data: 2026-01-08
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  competitionsV2Service,
  CompetitionV2,
  CompetitionV2Create,
  CompetitionV2Update,
  CompetitionV2WithRelations,
  CompetitionPhase,
  CompetitionPhaseCreate,
  CompetitionPhaseUpdate,
  CompetitionOpponentTeam,
  CompetitionOpponentTeamCreate,
  CompetitionOpponentTeamUpdate,
  CompetitionMatch,
  CompetitionMatchCreate,
  CompetitionMatchResultUpdate,
  CompetitionStanding,
  AIParseResponse,
  AIExtractedCompetition,
  CompetitionMatchListParams,
} from '@/lib/api/competitions-v2';

// ============================================================================
// TYPES
// ============================================================================

interface UseCompetitionV2State {
  competition: CompetitionV2WithRelations | null;
  isLoading: boolean;
  error: string | null;
}

interface UseCompetitionV2Return extends UseCompetitionV2State {
  fetchCompetition: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  updateCompetition: (data: CompetitionV2Update) => Promise<CompetitionV2 | null>;
  createCompetition: (data: CompetitionV2Create) => Promise<CompetitionV2 | null>;
}

interface UseAIParsePdfState {
  extractedData: AIExtractedCompetition | null;
  isProcessing: boolean;
  error: string | null;
  processingTimeMs: number | null;
}

interface UseAIParsePdfReturn extends UseAIParsePdfState {
  parsePdf: (file: File, ourTeamName: string, hints?: string) => Promise<void>;
  clearData: () => void;
  importToCompetition: (
    competitionId: string,
    options?: { createPhases?: boolean; createTeams?: boolean; createMatches?: boolean }
  ) => Promise<CompetitionV2WithRelations | null>;
}

interface UseCompetitionPhasesState {
  phases: CompetitionPhase[];
  isLoading: boolean;
  error: string | null;
}

interface UseCompetitionPhasesReturn extends UseCompetitionPhasesState {
  fetchPhases: () => Promise<void>;
  createPhase: (data: CompetitionPhaseCreate) => Promise<CompetitionPhase | null>;
  updatePhase: (phaseId: string, data: CompetitionPhaseUpdate) => Promise<CompetitionPhase | null>;
  deletePhase: (phaseId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

interface UseCompetitionOpponentTeamsState {
  opponentTeams: CompetitionOpponentTeam[];
  isLoading: boolean;
  error: string | null;
}

interface UseCompetitionOpponentTeamsReturn extends UseCompetitionOpponentTeamsState {
  fetchOpponentTeams: () => Promise<void>;
  createOpponentTeam: (data: CompetitionOpponentTeamCreate) => Promise<CompetitionOpponentTeam | null>;
  bulkCreateOpponentTeams: (teams: CompetitionOpponentTeamCreate[]) => Promise<CompetitionOpponentTeam[]>;
  updateOpponentTeam: (teamId: string, data: CompetitionOpponentTeamUpdate) => Promise<CompetitionOpponentTeam | null>;
  refetch: () => Promise<void>;
}

interface UseCompetitionMatchesState {
  matches: CompetitionMatch[];
  isLoading: boolean;
  error: string | null;
}

interface UseCompetitionMatchesReturn extends UseCompetitionMatchesState {
  fetchMatches: (params?: CompetitionMatchListParams) => Promise<void>;
  createMatch: (data: CompetitionMatchCreate) => Promise<CompetitionMatch | null>;
  bulkCreateMatches: (matches: CompetitionMatchCreate[]) => Promise<{ created: number; updated: number } | null>;
  updateMatchResult: (matchId: string, result: CompetitionMatchResultUpdate) => Promise<CompetitionMatch | null>;
  refetch: () => Promise<void>;
}

interface UseCompetitionStandingsState {
  standings: CompetitionStanding[];
  isLoading: boolean;
  error: string | null;
}

interface UseCompetitionStandingsReturn extends UseCompetitionStandingsState {
  fetchStandings: (phaseId?: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// ============================================================================
// HELPER - Error Handler
// ============================================================================

function handleError(err: unknown): string {
  const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
  
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }
  if (errorMessage.includes('401') || errorMessage.includes('UNAUTHORIZED')) {
    return 'Sessão expirada. Por favor, faça login novamente.';
  }
  if (errorMessage.includes('403') || errorMessage.includes('FORBIDDEN')) {
    return 'Você não tem permissão para esta ação.';
  }
  if (errorMessage.includes('404')) {
    return 'Recurso não encontrado.';
  }
  
  return errorMessage;
}

// ============================================================================
// HOOK: useCompetitionV2 (Competição individual)
// ============================================================================

/**
 * Hook para gerenciar uma competição V2 individual
 * 
 * @param competitionId - ID da competição (opcional)
 * 
 * @example
 * const { competition, isLoading, fetchCompetition } = useCompetitionV2();
 * useEffect(() => {
 *   if (id) fetchCompetition(id);
 * }, [id]);
 */
export function useCompetitionV2(competitionId?: string): UseCompetitionV2Return {
  const [state, setState] = useState<UseCompetitionV2State>({
    competition: null,
    isLoading: false,
    error: null,
  });

  const [currentId, setCurrentId] = useState<string | null>(competitionId || null);

  const fetchCompetition = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setCurrentId(id);

    try {
      const data = await competitionsV2Service.getFullById(id);
      setState({
        competition: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching competition:', err);
      setState({
        competition: null,
        isLoading: false,
        error: handleError(err),
      });
    }
  }, []);

  const refetch = useCallback(async () => {
    if (currentId) {
      await fetchCompetition(currentId);
    }
  }, [currentId, fetchCompetition]);

  const updateCompetition = useCallback(async (data: CompetitionV2Update): Promise<CompetitionV2 | null> => {
    if (!currentId) return null;

    try {
      const updated = await competitionsV2Service.update(currentId, data);
      // Atualiza estado local
      setState(prev => ({
        ...prev,
        competition: prev.competition ? { ...prev.competition, ...updated } : null,
      }));
      return updated;
    } catch (err) {
      console.error('Error updating competition:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [currentId]);

  const createCompetition = useCallback(async (data: CompetitionV2Create): Promise<CompetitionV2 | null> => {
    try {
      const created = await competitionsV2Service.create(data);
      setCurrentId(created.id);
      // Busca competição completa após criar
      await fetchCompetition(created.id);
      return created;
    } catch (err) {
      console.error('Error creating competition:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [fetchCompetition]);

  // Auto-fetch se competitionId foi fornecido
  useEffect(() => {
    if (competitionId && competitionId !== currentId) {
      fetchCompetition(competitionId);
    }
  }, [competitionId, currentId, fetchCompetition]);

  return {
    competition: state.competition,
    isLoading: state.isLoading,
    error: state.error,
    fetchCompetition,
    refetch,
    updateCompetition,
    createCompetition,
  };
}

// ============================================================================
// HOOK: useAIParsePdf (Processamento de PDF com IA)
// ============================================================================

/**
 * Hook para processar PDF de regulamento com IA Gemini
 * 
 * @example
 * const { extractedData, isProcessing, parsePdf, importToCompetition } = useAIParsePdf();
 * 
 * // Processar PDF
 * await parsePdf(file, 'Minha Equipe', 'Categoria Sub-18');
 * 
 * // Importar para competição
 * await importToCompetition(competitionId);
 */
export function useAIParsePdf(): UseAIParsePdfReturn {
  const [state, setState] = useState<UseAIParsePdfState>({
    extractedData: null,
    isProcessing: false,
    error: null,
    processingTimeMs: null,
  });

  const parsePdf = useCallback(async (file: File, ourTeamName: string, hints?: string) => {
    setState({
      extractedData: null,
      isProcessing: true,
      error: null,
      processingTimeMs: null,
    });

    try {
      // Converter arquivo para base64
      const base64 = await competitionsV2Service.fileToBase64(file);
      
      // Enviar para IA
      const response = await competitionsV2Service.parsePdfWithAI(base64, ourTeamName, hints);

      if (response.success && response.data) {
        setState({
          extractedData: response.data,
          isProcessing: false,
          error: null,
          processingTimeMs: response.processing_time_ms,
        });
      } else {
        setState({
          extractedData: null,
          isProcessing: false,
          error: response.error || 'Erro ao processar PDF',
          processingTimeMs: response.processing_time_ms,
        });
      }
    } catch (err) {
      console.error('Error parsing PDF with AI:', err);
      setState({
        extractedData: null,
        isProcessing: false,
        error: handleError(err),
        processingTimeMs: null,
      });
    }
  }, []);

  const clearData = useCallback(() => {
    setState({
      extractedData: null,
      isProcessing: false,
      error: null,
      processingTimeMs: null,
    });
  }, []);

  const importToCompetition = useCallback(async (
    competitionId: string,
    options?: { createPhases?: boolean; createTeams?: boolean; createMatches?: boolean }
  ): Promise<CompetitionV2WithRelations | null> => {
    if (!state.extractedData) {
      setState(prev => ({ ...prev, error: 'Nenhum dado extraído para importar' }));
      return null;
    }

    try {
      const result = await competitionsV2Service.importFromAI(
        competitionId,
        state.extractedData,
        options
      );
      return result;
    } catch (err) {
      console.error('Error importing AI data:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [state.extractedData]);

  return {
    extractedData: state.extractedData,
    isProcessing: state.isProcessing,
    error: state.error,
    processingTimeMs: state.processingTimeMs,
    parsePdf,
    clearData,
    importToCompetition,
  };
}

// ============================================================================
// HOOK: useCompetitionPhases
// ============================================================================

/**
 * Hook para gerenciar fases de uma competição
 * 
 * @param competitionId - ID da competição
 */
export function useCompetitionPhases(competitionId: string): UseCompetitionPhasesReturn {
  const [state, setState] = useState<UseCompetitionPhasesState>({
    phases: [],
    isLoading: false,
    error: null,
  });

  const fetchPhases = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await competitionsV2Service.listPhases(competitionId);
      setState({
        phases: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching phases:', err);
      setState({
        phases: [],
        isLoading: false,
        error: handleError(err),
      });
    }
  }, [competitionId]);

  const createPhase = useCallback(async (data: CompetitionPhaseCreate): Promise<CompetitionPhase | null> => {
    try {
      const created = await competitionsV2Service.createPhase(competitionId, data);
      setState(prev => ({
        ...prev,
        phases: [...prev.phases, created],
      }));
      return created;
    } catch (err) {
      console.error('Error creating phase:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [competitionId]);

  const updatePhase = useCallback(async (
    phaseId: string,
    data: CompetitionPhaseUpdate
  ): Promise<CompetitionPhase | null> => {
    try {
      const updated = await competitionsV2Service.updatePhase(competitionId, phaseId, data);
      setState(prev => ({
        ...prev,
        phases: prev.phases.map(p => p.id === phaseId ? updated : p),
      }));
      return updated;
    } catch (err) {
      console.error('Error updating phase:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [competitionId]);

  const deletePhase = useCallback(async (phaseId: string): Promise<boolean> => {
    try {
      await competitionsV2Service.deletePhase(competitionId, phaseId);
      setState(prev => ({
        ...prev,
        phases: prev.phases.filter(p => p.id !== phaseId),
      }));
      return true;
    } catch (err) {
      console.error('Error deleting phase:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return false;
    }
  }, [competitionId]);

  // Auto-fetch ao montar
  useEffect(() => {
    if (competitionId) {
      fetchPhases();
    }
  }, [competitionId, fetchPhases]);

  return {
    phases: state.phases,
    isLoading: state.isLoading,
    error: state.error,
    fetchPhases,
    createPhase,
    updatePhase,
    deletePhase,
    refetch: fetchPhases,
  };
}

// ============================================================================
// HOOK: useCompetitionOpponentTeams
// ============================================================================

/**
 * Hook para gerenciar equipes adversárias de uma competição
 * 
 * @param competitionId - ID da competição
 */
export function useCompetitionOpponentTeams(competitionId: string): UseCompetitionOpponentTeamsReturn {
  const [state, setState] = useState<UseCompetitionOpponentTeamsState>({
    opponentTeams: [],
    isLoading: false,
    error: null,
  });

  const fetchOpponentTeams = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await competitionsV2Service.listOpponentTeams(competitionId);
      setState({
        opponentTeams: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching opponent teams:', err);
      setState({
        opponentTeams: [],
        isLoading: false,
        error: handleError(err),
      });
    }
  }, [competitionId]);

  const createOpponentTeam = useCallback(async (
    data: CompetitionOpponentTeamCreate
  ): Promise<CompetitionOpponentTeam | null> => {
    try {
      const created = await competitionsV2Service.createOpponentTeam(competitionId, data);
      setState(prev => ({
        ...prev,
        opponentTeams: [...prev.opponentTeams, created],
      }));
      return created;
    } catch (err) {
      console.error('Error creating opponent team:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [competitionId]);

  const bulkCreateOpponentTeams = useCallback(async (
    teams: CompetitionOpponentTeamCreate[]
  ): Promise<CompetitionOpponentTeam[]> => {
    try {
      const created = await competitionsV2Service.bulkCreateOpponentTeams(competitionId, teams);
      setState(prev => ({
        ...prev,
        opponentTeams: [...prev.opponentTeams, ...created],
      }));
      return created;
    } catch (err) {
      console.error('Error bulk creating opponent teams:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return [];
    }
  }, [competitionId]);

  const updateOpponentTeam = useCallback(async (
    teamId: string,
    data: CompetitionOpponentTeamUpdate
  ): Promise<CompetitionOpponentTeam | null> => {
    try {
      const updated = await competitionsV2Service.updateOpponentTeam(competitionId, teamId, data);
      setState(prev => ({
        ...prev,
        opponentTeams: prev.opponentTeams.map(t => t.id === teamId ? updated : t),
      }));
      return updated;
    } catch (err) {
      console.error('Error updating opponent team:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [competitionId]);

  // Auto-fetch ao montar
  useEffect(() => {
    if (competitionId) {
      fetchOpponentTeams();
    }
  }, [competitionId, fetchOpponentTeams]);

  return {
    opponentTeams: state.opponentTeams,
    isLoading: state.isLoading,
    error: state.error,
    fetchOpponentTeams,
    createOpponentTeam,
    bulkCreateOpponentTeams,
    updateOpponentTeam,
    refetch: fetchOpponentTeams,
  };
}

// ============================================================================
// HOOK: useCompetitionMatches
// ============================================================================

/**
 * Hook para gerenciar jogos de uma competição
 * 
 * @param competitionId - ID da competição
 */
export function useCompetitionMatches(competitionId: string): UseCompetitionMatchesReturn {
  const [state, setState] = useState<UseCompetitionMatchesState>({
    matches: [],
    isLoading: false,
    error: null,
  });

  const [currentParams, setCurrentParams] = useState<CompetitionMatchListParams | undefined>();

  const fetchMatches = useCallback(async (params?: CompetitionMatchListParams) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setCurrentParams(params);

    try {
      const data = await competitionsV2Service.listMatches(competitionId, params);
      setState({
        matches: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching matches:', err);
      setState({
        matches: [],
        isLoading: false,
        error: handleError(err),
      });
    }
  }, [competitionId]);

  const createMatch = useCallback(async (data: CompetitionMatchCreate): Promise<CompetitionMatch | null> => {
    try {
      const created = await competitionsV2Service.createMatch(competitionId, data);
      setState(prev => ({
        ...prev,
        matches: [...prev.matches, created],
      }));
      return created;
    } catch (err) {
      console.error('Error creating match:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [competitionId]);

  const bulkCreateMatches = useCallback(async (
    matches: CompetitionMatchCreate[]
  ): Promise<{ created: number; updated: number } | null> => {
    try {
      const result = await competitionsV2Service.bulkCreateMatches(competitionId, matches);
      // Refetch para pegar lista atualizada
      await fetchMatches(currentParams);
      return { created: result.created, updated: result.updated };
    } catch (err) {
      console.error('Error bulk creating matches:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [competitionId, fetchMatches, currentParams]);

  const updateMatchResult = useCallback(async (
    matchId: string,
    result: CompetitionMatchResultUpdate
  ): Promise<CompetitionMatch | null> => {
    try {
      const updated = await competitionsV2Service.updateMatchResult(competitionId, matchId, result);
      setState(prev => ({
        ...prev,
        matches: prev.matches.map(m => m.id === matchId ? updated : m),
      }));
      return updated;
    } catch (err) {
      console.error('Error updating match result:', err);
      setState(prev => ({ ...prev, error: handleError(err) }));
      return null;
    }
  }, [competitionId]);

  const refetch = useCallback(async () => {
    await fetchMatches(currentParams);
  }, [fetchMatches, currentParams]);

  // Auto-fetch ao montar
  useEffect(() => {
    if (competitionId) {
      fetchMatches();
    }
  }, [competitionId, fetchMatches]);

  return {
    matches: state.matches,
    isLoading: state.isLoading,
    error: state.error,
    fetchMatches,
    createMatch,
    bulkCreateMatches,
    updateMatchResult,
    refetch,
  };
}

// ============================================================================
// HOOK: useCompetitionStandings
// ============================================================================

/**
 * Hook para obter classificação de uma competição
 * 
 * @param competitionId - ID da competição
 * @param phaseId - ID da fase (opcional)
 */
export function useCompetitionStandings(
  competitionId: string,
  phaseId?: string
): UseCompetitionStandingsReturn {
  const [state, setState] = useState<UseCompetitionStandingsState>({
    standings: [],
    isLoading: false,
    error: null,
  });

  const [currentPhaseId, setCurrentPhaseId] = useState<string | undefined>(phaseId);

  const fetchStandings = useCallback(async (newPhaseId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    const targetPhaseId = newPhaseId ?? currentPhaseId;
    setCurrentPhaseId(targetPhaseId);

    try {
      const data = await competitionsV2Service.getStandings(competitionId, targetPhaseId);
      setState({
        standings: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching standings:', err);
      setState({
        standings: [],
        isLoading: false,
        error: handleError(err),
      });
    }
  }, [competitionId, currentPhaseId]);

  const refetch = useCallback(async () => {
    await fetchStandings(currentPhaseId);
  }, [fetchStandings, currentPhaseId]);

  // Auto-fetch ao montar
  useEffect(() => {
    if (competitionId) {
      const fetchData = () => fetchStandings(phaseId);
      fetchData();
    }
  }, [competitionId, phaseId, fetchStandings]);

  return {
    standings: state.standings,
    isLoading: state.isLoading,
    error: state.error,
    fetchStandings,
    refetch,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  UseCompetitionV2Return,
  UseAIParsePdfReturn,
  UseCompetitionPhasesReturn,
  UseCompetitionOpponentTeamsReturn,
  UseCompetitionMatchesReturn,
  UseCompetitionStandingsReturn,
};
