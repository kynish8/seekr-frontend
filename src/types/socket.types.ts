import { Player, GameSettings } from './game.types';

export interface ServerToClientEvents {
  'room:created': (data: { roomCode: string }) => void;
  'room:joined': (data: {
    players: Player[];
    settings: GameSettings;
    playerId: string;
    hostId: string;
  }) => void;
  'player:joined': (player: Player) => void;
  'player:left': (playerId: string) => void;
  'game:started': (data: { players: Player[]; settings: GameSettings }) => void;
  'round:start': (data: {
    roundNumber: number;
    objectId: string;
    displayName: string;
    timeoutSeconds: number;
    players: Player[];
    scores: Record<string, number>;
  }) => void;
  'frame:result': (data: {
    label: string;
    score: number;
    confidence: number;
  }) => void;
  'round:won': (data: {
    winnerId: string;
    winnerName: string;
    objectId: string;
    displayName: string;
    players: Player[];
    scores: Record<string, number>;
  }) => void;
  'round:timeout': (data: {
    objectId: string;
    displayName: string;
    scores: Record<string, number>;
  }) => void;
  'game:ended': (data: {
    winnerId: string;
    winnerName: string;
    players: Player[];
    scores: Record<string, number>;
  }) => void;
  'player:frame': (data: { playerId: string; frameData: string }) => void;
  'settings:updated': (settings: GameSettings) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (playerName: string) => void;
  'room:join': (data: { roomCode: string; playerName: string }) => void;
  'player:remove': (playerId: string) => void;
  'game:start': () => void;
  'settings:update': (settings: Partial<GameSettings>) => void;
  'frame:submit': (data: { frameData: string }) => void;
}
