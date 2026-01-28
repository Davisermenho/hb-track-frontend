export * from './client';
export * from './users';
export * from './teams';
export * from './athletes';
export * from './seasons';
export * from './categories';
export * from './statistics';
export * from './intake';
export * from './trainings';
export * from './competitions';

// Competitions V2 - Re-export apenas o que não conflita
// Os tipos que conflitam (PhaseType, PaginatedResponse) devem ser importados diretamente de './competitions-v2'
export { 
  competitionsV2Service,
  // Types V2 únicos (sem conflito)
  type CompetitionV2,
  type CompetitionV2Create,
  type CompetitionV2Update,
  type CompetitionPhase,
  type CompetitionPhaseCreate,
  type CompetitionPhaseUpdate,
  type CompetitionOpponentTeam,
  type CompetitionOpponentTeamCreate,
  type CompetitionOpponentTeamUpdate,
  type OpponentTeamStats,
  type CompetitionMatch,
  type CompetitionMatchCreate,
  type CompetitionMatchUpdate,
  type CompetitionMatchResultUpdate,
  type CompetitionStanding,
  type AIExtractedTeam,
  type AIExtractedMatch,
  type AIExtractedPhase,
  type AIExtractedCompetition,
  type AIParseRequest,
  type AIParseResponse,
  type AIImportRequest,
  type CompetitionV2WithRelations,
  type CompetitionV2ListParams,
  type CompetitionMatchListParams,
} from './competitions-v2';