import { io, Socket } from 'socket.io-client';
import { GameSettings } from '../types/game.types';
import { ServerToClientEvents, ClientToServerEvents } from '../types/socket.types';
import { SOCKET_URL } from '../constants/game.constants';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;

  connect(): TypedSocket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    }) as TypedSocket;

    this.socket.on('connect', () => {
      console.log('[socket] connected', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[socket] connection error', err.message);
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  // ---------------------------------------------------------------------------
  // Emit helpers (Client → Server)
  // ---------------------------------------------------------------------------

  createRoom(playerName: string) {
    this.socket?.emit('room:create', playerName);
  }

  joinRoom(roomCode: string, playerName: string) {
    this.socket?.emit('room:join', { roomCode, playerName });
  }

  removePlayer(playerId: string) {
    this.socket?.emit('player:remove', playerId);
  }

  startGame() {
    this.socket?.emit('game:start');
  }

  updateSettings(settings: Partial<GameSettings>) {
    this.socket?.emit('settings:update', settings);
  }

  submitPhoto(roundId: string, photoUrl: string) {
    this.socket?.emit('photo:submit', { roundId, photoUrl });
  }
}

export const socketService = new SocketService();
