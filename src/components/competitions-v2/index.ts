/**
 * Competitions V2 Components - Export central
 * 
 * Módulo de competições com IA Gemini
 */

// Context
export { CompetitionV2Provider, useCompetitionV2Context } from '@/context/CompetitionV2Context';
export type { WizardStep, CompetitionV2Tab } from '@/context/CompetitionV2Context';

// Wizard Components
export { 
  CreateCompetitionWizard,
  PDFUploadStep,
  ProcessingStep,
  ReviewStep,
  ConfirmStep,
} from './wizard';

// UI Components
export { default as AIConfidenceBadge, FieldConfidenceBadge, ConfidenceSummary } from './AIConfidenceBadge';
export { default as StandingsTable, MiniStandings } from './StandingsTable';
export { default as MatchesList, NextMatchCard } from './MatchesList';
