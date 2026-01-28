/**
 * Componentes de Atletas - Exportações centralizadas
 * 
 * FASE 3 - Validações e Regras de Negócio
 * FASE 5 - Features Avançadas
 * 
 * Componentes disponíveis:
 * - StateManager: Gerenciamento de estados (ativa, lesionada, dispensada)
 * - TeamRegistrations: Gerenciamento de vínculos com equipes
 * - AdvancedFilters: Filtros avançados para busca de atletas
 * - AthleteTimeline: Timeline visual do histórico da atleta
 */

export { default as StateManager } from "./StateManager";
export { default as TeamRegistrations } from "./TeamRegistrations";
export { AdvancedFilters, AdvancedFiltersButton } from "./AdvancedFilters";
export { AthleteTimeline, useAthleteHistory } from "./AthleteTimeline";

// Re-export types
export type { AthleteState, StateHistory, StateManagerProps } from "./StateManager";
export type { 
  Team, 
  Season, 
  Category, 
  TeamRegistration, 
  TeamRegistrationsProps 
} from "./TeamRegistrations";
export type { AdvancedFiltersType } from "./AdvancedFilters";
export type { TimelineEvent, TimelineEventType } from "./AthleteTimeline";
