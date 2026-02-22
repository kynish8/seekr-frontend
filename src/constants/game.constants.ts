import { GameSettings } from '../types/game.types';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const POINTS_OPTIONS = [3, 5, 10, 15] as const;
export const TIMEOUT_OPTIONS = [30, 60, 90, 120] as const;

export const DEFAULT_SETTINGS: GameSettings = {
  pointsToWin: 5,
  roundTimeout: 60,
};
