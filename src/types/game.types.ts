export type GamePhase = 'home' | 'lobby' | 'game' | 'results';

export interface Player {
  id: string;
  name: string;
  score: number;
  initials: string;
}

export interface GameSettings {
  pointsToWin: number;
  roundTimeout: number;
}

export interface Round {
  id: string;
  roundNumber: number;
  objectId: string;
  displayName: string;
  winnerId: string | null;
  winnerName: string | null;
  timeoutSeconds: number;
}

export interface GameState {
  roomCode: string | null;
  players: Player[];
  settings: GameSettings;
  currentRound: Round | null;
  hostId: string | null;
  isHost: boolean;
  currentPhase: GamePhase;
}

export interface RankedPlayer extends Player {
  rank: number;
}
