/**
 * CompetitionsContext - Contexto global para módulo de Competições
 * 
 * Gerencia:
 * - Competição selecionada
 * - Tab ativa (fases, tabela, regulamento)
 * - Filtros de listagem
 * - Modais
 * - Estado de UI
 */

'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  ReactNode, 
  useEffect 
} from 'react';
import { useTeamSeasonOptional } from './TeamSeasonContext';
import type { Competition, CompetitionSeason } from '@/lib/api/competitions';

// =============================================================================
// TYPES
// =============================================================================

export type CompetitionTab = 'phases' | 'standings' | 'rules';

export type CompetitionViewMode = 'cards' | 'table';

export interface CompetitionFilters {
  search?: string;
  kind?: string;
  seasonId?: string;
}

export interface CompetitionsContextType {
  // Competição selecionada
  selectedCompetitionId: string | null;
  setSelectedCompetitionId: (id: string | null) => void;
  selectedCompetition: Competition | null;
  setSelectedCompetition: (competition: Competition | null) => void;
  
  // Competition Season (vínculo com temporada ativa)
  selectedCompetitionSeasonId: string | null;
  setSelectedCompetitionSeasonId: (id: string | null) => void;
  selectedCompetitionSeason: CompetitionSeason | null;
  setSelectedCompetitionSeason: (season: CompetitionSeason | null) => void;
  
  // Tab ativa (para detalhe da competição)
  activeTab: CompetitionTab;
  setActiveTab: (tab: CompetitionTab) => void;
  
  // Filtros de listagem
  filters: CompetitionFilters;
  setFilters: (filters: CompetitionFilters) => void;
  updateFilter: (key: keyof CompetitionFilters, value: string | undefined) => void;
  clearFilters: () => void;
  
  // Modal de criação/edição
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  
  // Modal de edição
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  isEditMode: boolean;
  editingCompetitionId: string | null;
  openEditModal: (id: string) => void;
  closeEditModal: () => void;
  
  // Modal de vincular temporada
  isLinkSeasonModalOpen: boolean;
  setIsLinkSeasonModalOpen: (open: boolean) => void;
  
  // Modo de visualização (cards ou tabela)
  viewMode: CompetitionViewMode;
  setViewMode: (mode: CompetitionViewMode) => void;
  
  // Helpers
  clearSelection: () => void;
  clearSelectedCompetition: () => void;
  isDetailView: boolean;
}

const defaultFilters: CompetitionFilters = {};

const CompetitionsContext = createContext<CompetitionsContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface CompetitionsProviderProps {
  children: ReactNode;
}

export function CompetitionsProvider({ children }: CompetitionsProviderProps) {
  // State
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedCompetitionSeasonId, setSelectedCompetitionSeasonId] = useState<string | null>(null);
  const [selectedCompetitionSeason, setSelectedCompetitionSeason] = useState<CompetitionSeason | null>(null);
  const [activeTab, setActiveTab] = useState<CompetitionTab>('phases');
  const [filters, setFiltersState] = useState<CompetitionFilters>(defaultFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkSeasonModalOpen, setIsLinkSeasonModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CompetitionViewMode>('cards');
  const [editingCompetitionId, setEditingCompetitionId] = useState<string | null>(null);

  // Tenta acessar TeamSeasonContext (pode não estar disponível)
  const teamSeasonCtx = useTeamSeasonOptional();
  const activeSeason = teamSeasonCtx?.selectedSeason ?? null;

  // Atualiza filtro de season quando a temporada ativa mudar
  useEffect(() => {
    if (activeSeason?.id && !filters.seasonId) {
      const updateFilters = () => setFiltersState(prev => ({ ...prev, seasonId: activeSeason.id }));
      updateFilters();
    }
  }, [activeSeason?.id, filters.seasonId]);

  // Clear selection when competition changes
  useEffect(() => {
    if (!selectedCompetitionId) {
      const resetState = () => {
        setSelectedCompetition(null);
        setSelectedCompetitionSeasonId(null);
        setSelectedCompetitionSeason(null);
        setActiveTab('phases');
      };
      resetState();
    }
  }, [selectedCompetitionId]);

  // Callbacks
  const setFilters = useCallback((newFilters: CompetitionFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback((key: keyof CompetitionFilters, value: string | undefined) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCompetitionId(null);
    setSelectedCompetition(null);
    setSelectedCompetitionSeasonId(null);
    setSelectedCompetitionSeason(null);
    setActiveTab('phases');
  }, []);

  // Alias for backward compatibility
  const clearSelectedCompetition = clearSelection;

  // Modal helpers
  const openCreateModal = useCallback(() => {
    setEditingCompetitionId(null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingCompetitionId(null);
  }, []);

  const openEditModal = useCallback((id: string) => {
    setEditingCompetitionId(id);
    setIsCreateModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingCompetitionId(null);
  }, []);

  // Computed
  const isDetailView = selectedCompetitionId !== null;
  const isEditMode = editingCompetitionId !== null;

  // Context value
  const value: CompetitionsContextType = {
    selectedCompetitionId,
    setSelectedCompetitionId,
    selectedCompetition,
    setSelectedCompetition,
    selectedCompetitionSeasonId,
    setSelectedCompetitionSeasonId,
    selectedCompetitionSeason,
    setSelectedCompetitionSeason,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    isCreateModalOpen,
    setIsCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    setIsEditModalOpen,
    isEditMode,
    editingCompetitionId,
    openEditModal,
    closeEditModal,
    isLinkSeasonModalOpen,
    setIsLinkSeasonModalOpen,
    viewMode,
    setViewMode,
    clearSelection,
    clearSelectedCompetition,
    isDetailView,
  };

  return (
    <CompetitionsContext.Provider value={value}>
      {children}
    </CompetitionsContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useCompetitionsContext() {
  const context = useContext(CompetitionsContext);
  if (!context) {
    throw new Error('useCompetitionsContext must be used within CompetitionsProvider');
  }
  return context;
}

export default CompetitionsContext;
