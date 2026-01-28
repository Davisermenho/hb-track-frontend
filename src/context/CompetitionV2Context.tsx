/**
 * CompetitionV2Context - Contexto para módulo de Competições V2 com IA
 * 
 * Gerencia:
 * - Estado do wizard de criação
 * - Dados extraídos pela IA
 * - Competição sendo editada
 * - Modais específicos V2
 */

'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  ReactNode,
} from 'react';
import type { 
  CompetitionV2WithRelations, 
  AIExtractedCompetition,
  CompetitionPhase,
  CompetitionOpponentTeam,
  CompetitionMatch,
} from '@/lib/api/competitions-v2';

// =============================================================================
// TYPES
// =============================================================================

export type WizardStep = 
  | 'upload'      // Upload do PDF
  | 'processing'  // IA processando
  | 'review'      // Usuário revisa dados extraídos
  | 'confirm'     // Confirmação final
  | 'done';       // Concluído

export type CompetitionV2Tab = 'overview' | 'phases' | 'teams' | 'matches' | 'standings';

export interface CompetitionV2ContextType {
  // Wizard de criação
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  resetWizard: () => void;
  
  // Dados extraídos pela IA
  extractedData: AIExtractedCompetition | null;
  setExtractedData: (data: AIExtractedCompetition | null) => void;
  
  // PDF e configurações do upload
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  ourTeamName: string;
  setOurTeamName: (name: string) => void;
  hints: string;
  setHints: (hints: string) => void;
  
  // Processamento
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  processingError: string | null;
  setProcessingError: (error: string | null) => void;
  processingTimeMs: number | null;
  setProcessingTimeMs: (time: number | null) => void;
  
  // Competição selecionada/criada
  competition: CompetitionV2WithRelations | null;
  setCompetition: (competition: CompetitionV2WithRelations | null) => void;
  competitionId: string | null;
  setCompetitionId: (id: string | null) => void;
  
  // Tab ativa
  activeTab: CompetitionV2Tab;
  setActiveTab: (tab: CompetitionV2Tab) => void;
  
  // Edição de itens
  editingPhase: CompetitionPhase | null;
  setEditingPhase: (phase: CompetitionPhase | null) => void;
  editingTeam: CompetitionOpponentTeam | null;
  setEditingTeam: (team: CompetitionOpponentTeam | null) => void;
  editingMatch: CompetitionMatch | null;
  setEditingMatch: (match: CompetitionMatch | null) => void;
  
  // Modais
  isWizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
  isPhaseModalOpen: boolean;
  setIsPhaseModalOpen: (open: boolean) => void;
  isTeamModalOpen: boolean;
  setIsTeamModalOpen: (open: boolean) => void;
  isMatchModalOpen: boolean;
  setIsMatchModalOpen: (open: boolean) => void;
  isResultModalOpen: boolean;
  setIsResultModalOpen: (open: boolean) => void;
  
  // Helpers
  clearAll: () => void;
}

const CompetitionV2Context = createContext<CompetitionV2ContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface CompetitionV2ProviderProps {
  children: ReactNode;
}

export function CompetitionV2Provider({ children }: CompetitionV2ProviderProps) {
  // Wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>('upload');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  // Dados extraídos
  const [extractedData, setExtractedData] = useState<AIExtractedCompetition | null>(null);
  
  // Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ourTeamName, setOurTeamName] = useState('');
  const [hints, setHints] = useState('');
  
  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  
  // Competição
  const [competition, setCompetition] = useState<CompetitionV2WithRelations | null>(null);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  
  // Tab
  const [activeTab, setActiveTab] = useState<CompetitionV2Tab>('overview');
  
  // Edição
  const [editingPhase, setEditingPhase] = useState<CompetitionPhase | null>(null);
  const [editingTeam, setEditingTeam] = useState<CompetitionOpponentTeam | null>(null);
  const [editingMatch, setEditingMatch] = useState<CompetitionMatch | null>(null);
  
  // Modais
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Handlers
  const resetWizard = useCallback(() => {
    setWizardStep('upload');
    setExtractedData(null);
    setUploadedFile(null);
    setOurTeamName('');
    setHints('');
    setIsProcessing(false);
    setProcessingError(null);
    setProcessingTimeMs(null);
  }, []);

  const openWizard = useCallback(() => {
    resetWizard();
    setIsWizardOpen(true);
  }, [resetWizard]);

  const closeWizard = useCallback(() => {
    setIsWizardOpen(false);
    resetWizard();
  }, [resetWizard]);

  const clearAll = useCallback(() => {
    resetWizard();
    setCompetition(null);
    setCompetitionId(null);
    setActiveTab('overview');
    setEditingPhase(null);
    setEditingTeam(null);
    setEditingMatch(null);
    setIsPhaseModalOpen(false);
    setIsTeamModalOpen(false);
    setIsMatchModalOpen(false);
    setIsResultModalOpen(false);
  }, [resetWizard]);

  const value: CompetitionV2ContextType = {
    // Wizard
    wizardStep,
    setWizardStep,
    resetWizard,
    
    // Dados extraídos
    extractedData,
    setExtractedData,
    
    // Upload
    uploadedFile,
    setUploadedFile,
    ourTeamName,
    setOurTeamName,
    hints,
    setHints,
    
    // Processing
    isProcessing,
    setIsProcessing,
    processingError,
    setProcessingError,
    processingTimeMs,
    setProcessingTimeMs,
    
    // Competição
    competition,
    setCompetition,
    competitionId,
    setCompetitionId,
    
    // Tab
    activeTab,
    setActiveTab,
    
    // Edição
    editingPhase,
    setEditingPhase,
    editingTeam,
    setEditingTeam,
    editingMatch,
    setEditingMatch,
    
    // Modais
    isWizardOpen,
    openWizard,
    closeWizard,
    isPhaseModalOpen,
    setIsPhaseModalOpen,
    isTeamModalOpen,
    setIsTeamModalOpen,
    isMatchModalOpen,
    setIsMatchModalOpen,
    isResultModalOpen,
    setIsResultModalOpen,
    
    // Helpers
    clearAll,
  };

  return (
    <CompetitionV2Context.Provider value={value}>
      {children}
    </CompetitionV2Context.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useCompetitionV2Context() {
  const context = useContext(CompetitionV2Context);
  if (!context) {
    throw new Error('useCompetitionV2Context must be used within CompetitionV2Provider');
  }
  return context;
}

export default CompetitionV2Context;
