export type GamePhase = 'home' | 'lobby' | 'game' | 'results';

export interface Player {
  id: string;
  name: string;
  score: number;
  initials: string;
  photoUrl?: string;
}

export interface GameSettings {
  rounds: 3 | 5 | 8;
  timePerRound: 30 | 60 | 120;
}

export interface Round {
  id: string;
  prompt: string;
  submissions: Record<string, string | null>;
  timeRemaining: number;
}

export interface GameState {
  roomCode: string | null;
  players: Player[];
  settings: GameSettings;
  currentRound: number;
  rounds: Round[];
  hostId: string | null;
  isHost: boolean;
  currentPhase: GamePhase;
}

export interface RankedPlayer extends Player {
  rank: number;
}
