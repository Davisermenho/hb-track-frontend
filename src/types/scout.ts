/**
 * Tipos para o sistema de Scout ao Vivo
 */

export type EventType = 
  | 'goal'
  | 'shot_miss'
  | 'save'
  | 'turnover'
  | 'foul'
  | 'seven_meter'
  | 'timeout'
  | 'substitution'
  | 'yellow_card'
  | 'red_card'
  | 'two_min_suspension';

export type EventPhase = 
  | 'defense'
  | 'counter_attack'
  | 'positional_attack'
  | 'defensive_transition';

export interface ScoutEvent {
  id: string;
  timestamp: Date;
  gameTime: number; // em segundos
  type: EventType;
  phase?: EventPhase;
  zone?: string; // ID da zona na quadra
  playerId?: string;
  playerName?: string;
  playerNumber?: number;
  team: 'home' | 'away';
  success?: boolean;
  details?: string;
}

export interface GameState {
  homeScore: number;
  awayScore: number;
  currentTime: number; // em segundos
  period: 1 | 2; // 1º ou 2º tempo
  isRunning: boolean;
  isPaused: boolean;
}

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  color: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  number: number;
  position: string;
  isGoalkeeper: boolean;
}

export interface ScoutStats {
  shots: number;
  goals: number;
  saves: number;
  turnovers: number;
  fouls: number;
  sevenMeters: { attempts: number; conversions: number };
  shotAccuracy: number;
  possessionTime?: number;
}

export interface GameInfo {
  id: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homePlayers: PlayerInfo[];
  awayPlayers: PlayerInfo[];
  venue?: string;
  date: Date;
  competition?: string;
}