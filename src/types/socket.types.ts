import { Player, GameSettings, Round } from './game.types';

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
  'game:started': (data: { rounds: Round[] }) => void;
  'round:update': (round: Round) => void;
  'game:ended': (data: { players: Player[] }) => void;
  'settings:updated': (settings: GameSettings) => void;
  'players:updated': (data: { players: Player[] }) => void;
  'submission:rejected': (data: { reason: string }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (playerName: string) => void;
  'room:join': (data: { roomCode: string; playerName: string }) => void;
  'player:remove': (playerId: string) => void;
  'game:start': () => void;
  'settings:update': (settings: Partial<GameSettings>) => void;
  'photo:submit': (data: { roundId: string; photoUrl: string }) => void;
}
