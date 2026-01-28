/**
 * Selectors - Data-testid padrões para testes E2E
 * 
 * Este arquivo define os seletores que serão usados nos testes.
 * Os componentes ainda NÃO possuem estes data-testid - eles serão
 * adicionados gradualmente conforme os testes forem escritos.
 * 
 * CONVENÇÃO:
 * - Prefixo por módulo: teams-, training-, athletes-, etc.
 * - Sufixo por tipo: -root, -item, -btn, -input, -modal, -row
 * - IDs dinâmicos: (id: string) => `[data-testid="xxx-${id}"]`
 * 
 * IMPORTANTE:
 * Este arquivo é uma ESPECIFICAÇÃO. Os componentes devem ser
 * atualizados para incluir estes data-testid quando os testes
 * forem implementados.
 */

// ============================================================================
// NAVIGATION & LAYOUT
// ============================================================================

export const SELECTORS = {
  // ---------------------------------------------------------------------------
  // Sidebar & Navigation
  // ---------------------------------------------------------------------------
  nav: {
    sidebar: '[data-testid="sidebar-root"]',
    sidebarToggle: '[data-testid="sidebar-toggle"]',
    sidebarItem: (key: string) => `[data-testid="sidebar-item-${key}"]`,
    topBar: '[data-testid="topbar-root"]',
    userMenu: '[data-testid="user-menu"]',
    userMenuDropdown: '[data-testid="user-menu-dropdown"]',
    logoutBtn: '[data-testid="logout-btn"]',
    breadcrumb: '[data-testid="breadcrumb"]',
  },

  // ---------------------------------------------------------------------------
  // Auth Pages
  // ---------------------------------------------------------------------------
  auth: {
    signinForm: '[data-testid="signin-form"]',
    signupForm: '[data-testid="signup-form"]',
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    submitBtn: '[data-testid="auth-submit-btn"]',
    errorMessage: '[data-testid="auth-error"]',
    forgotPasswordLink: '[data-testid="forgot-password-link"]',
    signupLink: '[data-testid="signup-link"]',
  },

  // ---------------------------------------------------------------------------
  // Teams Module
  // ---------------------------------------------------------------------------
  teams: {
    // Lista de equipes
    list: '[data-testid="teams-list-root"]',
    listLoading: '[data-testid="teams-list-loading"]',
    listEmpty: '[data-testid="teams-list-empty"]',
    card: (id: string) => `[data-testid="team-card-${id}"]`,
    row: (id: string) => `[data-testid="team-row-${id}"]`,
    
    // Ações na lista
    createBtn: '[data-testid="teams-create-btn"]',
    searchInput: '[data-testid="teams-search-input"]',
    filterDropdown: '[data-testid="teams-filter-dropdown"]',
    
    // Detalhe da equipe
    detail: '[data-testid="team-detail-root"]',
    detailName: '[data-testid="team-detail-name"]',
    detailDescription: '[data-testid="team-detail-description"]',
    
    // Tabs
    tabOverview: '[data-testid="team-tab-overview"]',
    tabMembers: '[data-testid="team-tab-members"]',
    tabTrainings: '[data-testid="team-tab-trainings"]',
    tabStats: '[data-testid="team-tab-stats"]',
    tabSettings: '[data-testid="team-tab-settings"]',
    
    // Members tab
    membersList: '[data-testid="team-members-list"]',
    memberRow: (id: string) => `[data-testid="team-member-${id}"]`,
    memberInviteBtn: '[data-testid="team-member-invite-btn"]',
    memberRemoveBtn: (id: string) => `[data-testid="team-member-remove-${id}"]`,
    memberRoleSelect: (id: string) => `[data-testid="team-member-role-${id}"]`,
    
    // Settings tab
    settingsForm: '[data-testid="team-settings-form"]',
    settingsSaveBtn: '[data-testid="team-settings-save-btn"]',
    settingsDeleteBtn: '[data-testid="team-settings-delete-btn"]',
  },

  // ---------------------------------------------------------------------------
  // Training Module
  // ---------------------------------------------------------------------------
  training: {
    // Layout
    header: '[data-testid="training-header"]',
    teamSelector: '[data-testid="training-team-selector"]',
    tabs: '[data-testid="training-tabs"]',
    
    // Agenda
    agenda: '[data-testid="training-agenda-root"]',
    agendaWeekNav: '[data-testid="training-agenda-week-nav"]',
    agendaPrevWeek: '[data-testid="training-agenda-prev-week"]',
    agendaNextWeek: '[data-testid="training-agenda-next-week"]',
    agendaDay: (dayIndex: number) => `[data-testid="training-agenda-day-${dayIndex}"]`,
    
    // Sessões
    sessionCard: (id: string) => `[data-testid="training-session-${id}"]`,
    sessionStatus: (id: string) => `[data-testid="training-session-status-${id}"]`,
    sessionCreateBtn: '[data-testid="training-session-create-btn"]',
    
    // Calendário
    calendar: '[data-testid="training-calendar-root"]',
    calendarMonthNav: '[data-testid="training-calendar-month-nav"]',
    calendarPrevMonth: '[data-testid="training-calendar-prev-month"]',
    calendarNextMonth: '[data-testid="training-calendar-next-month"]',
    calendarDay: (date: string) => `[data-testid="training-calendar-day-${date}"]`,
    
    // Planejamento
    planning: '[data-testid="training-planning-root"]',
    cyclesList: '[data-testid="training-cycles-list"]',
    cycleCard: (id: string) => `[data-testid="training-cycle-${id}"]`,
    cycleCreateBtn: '[data-testid="training-cycle-create-btn"]',
    microcycleCard: (id: string) => `[data-testid="training-microcycle-${id}"]`,
    
    // Banco de exercícios
    exerciseBank: '[data-testid="training-exercise-bank-root"]',
    exerciseSearch: '[data-testid="training-exercise-search"]',
    exerciseCard: (id: string) => `[data-testid="training-exercise-${id}"]`,
    exerciseCreateBtn: '[data-testid="training-exercise-create-btn"]',
    
    // Avaliações
    evaluations: '[data-testid="training-evaluations-root"]',
    evaluationMetric: (key: string) => `[data-testid="training-evaluation-${key}"]`,
  },

  // ---------------------------------------------------------------------------
  // Athletes Module
  // ---------------------------------------------------------------------------
  athletes: {
    // Lista
    list: '[data-testid="athletes-list-root"]',
    listLoading: '[data-testid="athletes-list-loading"]',
    listEmpty: '[data-testid="athletes-list-empty"]',
    grid: '[data-testid="athletes-grid"]',
    card: (id: string) => `[data-testid="athlete-card-${id}"]`,
    row: (id: string) => `[data-testid="athlete-row-${id}"]`,
    
    // Ações
    createBtn: '[data-testid="athletes-create-btn"]',
    searchInput: '[data-testid="athletes-search-input"]',
    filterState: '[data-testid="athletes-filter-state"]',
    filterGender: '[data-testid="athletes-filter-gender"]',
    filterCategory: '[data-testid="athletes-filter-category"]',
    
    // Detalhe
    detail: '[data-testid="athlete-detail-root"]',
    detailName: '[data-testid="athlete-detail-name"]',
    detailPhoto: '[data-testid="athlete-detail-photo"]',
    detailEditBtn: '[data-testid="athlete-detail-edit-btn"]',
    detailDeleteBtn: '[data-testid="athlete-detail-delete-btn"]',
    
    // Form
    form: '[data-testid="athlete-form"]',
    formName: '[data-testid="athlete-form-name"]',
    formBirthDate: '[data-testid="athlete-form-birth-date"]',
    formGender: '[data-testid="athlete-form-gender"]',
    formPosition: '[data-testid="athlete-form-position"]',
    formSubmit: '[data-testid="athlete-form-submit"]',
    formCancel: '[data-testid="athlete-form-cancel"]',
  },

  // ---------------------------------------------------------------------------
  // Competitions Module
  // ---------------------------------------------------------------------------
  competitions: {
    list: '[data-testid="competitions-list-root"]',
    card: (id: string) => `[data-testid="competition-card-${id}"]`,
    createBtn: '[data-testid="competitions-create-btn"]',
    detail: '[data-testid="competition-detail-root"]',
    gamesList: '[data-testid="competition-games-list"]',
    gameRow: (id: string) => `[data-testid="competition-game-${id}"]`,
  },

  // ---------------------------------------------------------------------------
  // Games Module
  // ---------------------------------------------------------------------------
  games: {
    list: '[data-testid="games-list-root"]',
    card: (id: string) => `[data-testid="game-card-${id}"]`,
    createBtn: '[data-testid="games-create-btn"]',
    detail: '[data-testid="game-detail-root"]',
    scoutBtn: '[data-testid="game-scout-btn"]',
    statsTab: '[data-testid="game-stats-tab"]',
  },

  // ---------------------------------------------------------------------------
  // Statistics Module
  // ---------------------------------------------------------------------------
  statistics: {
    dashboard: '[data-testid="statistics-dashboard-root"]',
    chart: (key: string) => `[data-testid="statistics-chart-${key}"]`,
    periodSelector: '[data-testid="statistics-period-selector"]',
    exportBtn: '[data-testid="statistics-export-btn"]',
  },

  // ---------------------------------------------------------------------------
  // Wellness Module
  // ---------------------------------------------------------------------------
  wellness: {
    dashboard: '[data-testid="wellness-dashboard-root"]',
    athleteCard: (id: string) => `[data-testid="wellness-athlete-${id}"]`,
    checkInBtn: '[data-testid="wellness-checkin-btn"]',
    historyList: '[data-testid="wellness-history-list"]',
  },

  // ---------------------------------------------------------------------------
  // Modals (Shared)
  // ---------------------------------------------------------------------------
  modals: {
    root: '[data-testid="modal-root"]',
    backdrop: '[data-testid="modal-backdrop"]',
    closeBtn: '[data-testid="modal-close-btn"]',
    title: '[data-testid="modal-title"]',
    content: '[data-testid="modal-content"]',
    confirmBtn: '[data-testid="modal-confirm-btn"]',
    cancelBtn: '[data-testid="modal-cancel-btn"]',
    
    // Modals específicos
    createTeam: '[data-testid="modal-create-team"]',
    editTeam: '[data-testid="modal-edit-team"]',
    inviteMember: '[data-testid="modal-invite-member"]',
    createSession: '[data-testid="modal-create-session"]',
    confirmDelete: '[data-testid="modal-confirm-delete"]',
  },

  // ---------------------------------------------------------------------------
  // Forms (Shared)
  // ---------------------------------------------------------------------------
  forms: {
    input: (name: string) => `[data-testid="form-input-${name}"]`,
    select: (name: string) => `[data-testid="form-select-${name}"]`,
    checkbox: (name: string) => `[data-testid="form-checkbox-${name}"]`,
    radio: (name: string, value: string) => `[data-testid="form-radio-${name}-${value}"]`,
    textarea: (name: string) => `[data-testid="form-textarea-${name}"]`,
    error: (name: string) => `[data-testid="form-error-${name}"]`,
    submitBtn: '[data-testid="form-submit-btn"]',
    cancelBtn: '[data-testid="form-cancel-btn"]',
  },

  // ---------------------------------------------------------------------------
  // Toasts & Notifications
  // ---------------------------------------------------------------------------
  toast: {
    container: '[data-testid="toast-container"]',
    item: '[data-testid="toast-item"]',
    success: '[data-testid="toast-success"]',
    error: '[data-testid="toast-error"]',
    warning: '[data-testid="toast-warning"]',
    info: '[data-testid="toast-info"]',
    closeBtn: '[data-testid="toast-close-btn"]',
  },

  // ---------------------------------------------------------------------------
  // Loading States
  // ---------------------------------------------------------------------------
  loading: {
    spinner: '[data-testid="loading-spinner"]',
    skeleton: '[data-testid="loading-skeleton"]',
    overlay: '[data-testid="loading-overlay"]',
    progress: '[data-testid="loading-progress"]',
  },

  // ---------------------------------------------------------------------------
  // Empty States
  // ---------------------------------------------------------------------------
  empty: {
    root: '[data-testid="empty-state"]',
    icon: '[data-testid="empty-state-icon"]',
    title: '[data-testid="empty-state-title"]',
    description: '[data-testid="empty-state-description"]',
    actionBtn: '[data-testid="empty-state-action"]',
  },

  // ---------------------------------------------------------------------------
  // Error States
  // ---------------------------------------------------------------------------
  error: {
    root: '[data-testid="error-state"]',
    title: '[data-testid="error-state-title"]',
    message: '[data-testid="error-state-message"]',
    retryBtn: '[data-testid="error-state-retry"]',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retorna o seletor de texto para buscar elementos por texto visível
 * Útil quando não há data-testid
 */
export function byText(text: string): string {
  return `text=${text}`;
}

/**
 * Retorna o seletor de role ARIA
 */
export function byRole(role: string, options?: { name?: string }): string {
  if (options?.name) {
    return `role=${role}[name="${options.name}"]`;
  }
  return `role=${role}`;
}

/**
 * Retorna o seletor de label (para inputs associados a labels)
 */
export function byLabel(label: string): string {
  return `label=${label}`;
}

/**
 * Retorna o seletor de placeholder
 */
export function byPlaceholder(placeholder: string): string {
  return `[placeholder="${placeholder}"]`;
}

// Export default para uso simplificado
export default SELECTORS;
