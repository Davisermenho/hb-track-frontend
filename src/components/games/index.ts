/**
 * Games Components - Barrel Export
 * 
 * Centraliza exports de todos os componentes do módulo de jogos
 */

// Main components
export { default as GamesHeader } from './GamesHeader';
export { default as GamesDashboard } from './GamesDashboard';
export { default as GameDetail } from './GameDetail';
export { default as GameCard } from './GameCard';
export { default as GamesFilterBar } from './GamesFilterBar';

// Tab components
export { default as GameOverviewTab } from './tabs/GameOverviewTab';
export { default as GameLineupTab } from './tabs/GameLineupTab';
export { default as GameEventsTab } from './tabs/GameEventsTab';
export { default as GameStatsTab } from './tabs/GameStatsTab';
export { default as GameReportTab } from './tabs/GameReportTab';

// Modal components
export { default as CreateGameModal } from './modals/CreateGameModal';
export { default as GameEventModal } from './modals/GameEventModal';
export { default as CancelGameModal } from './modals/CancelGameModal';
export { default as EditGameDrawer } from './modals/EditGameDrawer';
