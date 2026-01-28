/**
 * E2E Test Helpers Index
 * 
 * Re-exporta todos os helpers para facilitar importação
 * 
 * @example
 * import { loginViaAPI, createTeamViaAPI, SELECTORS } from './helpers';
 */

// API Helpers
export * from './api';

// Selectors (data-testid)
export { SELECTORS, byText, byRole, byLabel, byPlaceholder } from './selectors';
export { default as selectors } from './selectors';

// Redirect Debug (legacy)
export * from './redirectDebug';
