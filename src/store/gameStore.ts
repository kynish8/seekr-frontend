import { create } from 'zustand';
import { GameState, Player, GameSettings, Round, GamePhase } from '../types/game.types';
import { DEFAULT_SETTINGS } from '../constants/game.constants';

interface GameStore extends GameState {
  currentPlayerId: string | null;
  setPhase: (phase: GamePhase) => void;
  setRoomCode: (code: string) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setRounds: (rounds: Round[]) => void;
  updateRound: (round: Round) => void;
  setCurrentRound: (roundIndex: number) => void;
  setHostId: (hostId: string) => void;
  setIsHost: (isHost: boolean) => void;
  setCurrentPlayerId: (playerId: string) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  roomCode: null,
  players: [],
  settings: DEFAULT_SETTINGS,
  currentRound: 0,
  rounds: [],
  hostId: null,
  isHost: false,
  currentPhase: 'home',
};

const initialExtendedState = {
  ...initialState,
  currentPlayerId: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialExtendedState,

  setPhase: (phase) => set({ currentPhase: phase }),

  setRoomCode: (code) => set({ roomCode: code }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({ players: [...state.players, player] })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updateSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),

  setRounds: (rounds) => set({ rounds }),

  updateRound: (round) =>
    set((state) => ({
      rounds: state.rounds.map((r) => (r.id === round.id ? round : r)),
    })),

  setCurrentRound: (roundIndex) => set({ currentRound: roundIndex }),

  setHostId: (hostId) => set({ hostId }),

  setIsHost: (isHost) => set({ isHost }),

  setCurrentPlayerId: (playerId) => set({ currentPlayerId: playerId }),

  resetGame: () => set(initialExtendedState),
}));
