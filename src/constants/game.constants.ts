import { GameSettings } from '../types/game.types';

export const SOCKET_URL = 'http://localhost:3001';

export const ROUND_OPTIONS = [3, 5, 8] as const;
export const TIME_OPTIONS = [30, 60, 120] as const;

export const DEFAULT_SETTINGS: GameSettings = {
  rounds: 5,
  timePerRound: 60,
};

export const SAMPLE_PROMPTS = [
  'FIND SOMETHING RED',
  'FIND SOMETHING SOFT',
  'FIND SOMETHING WITH WHEELS',
  'FIND SOMETHING YOU WEAR',
  'FIND SOMETHING SHINY',
  'FIND SOMETHING GREEN',
  'FIND SOMETHING ROUND',
  'FIND SOMETHING MADE OF WOOD',
];
