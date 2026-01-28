
export type ViewState = 'DASHBOARD' | 'TEAM_DETAIL';
export type DetailTab = 'OVERVIEW' | 'MEMBERS' | 'TRAININGS' | 'STATS' | 'SETTINGS';

export interface Team {
  id: string;
  name: string;
  code: string;
  role: string;
  lastActivity: string;
  activityTime: string;
  status: 'active' | 'archived';
  initial: string;
  category?: string;
  category_id?: number; // Adicionado para compatibilidade com API
  gender?: string;
  club?: string;
  season?: string;
  description?: string | null;
  organization_id?: string;
  alert_threshold_multiplier?: number; // Step 15: Multiplicador de threshold para alertas (1.0-3.0)
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBRO' | 'OWNER';
  status: 'Ativo' | 'Pendente';
  initials: string;
}

export interface Training {
  id: string;
  name: string;
  date: string;
  time: string;
  type: 'Tático' | 'Físico' | 'Técnico' | 'Jogo-Treino';
  status: 'Agendado' | 'Concluído' | 'Cancelado';
}
