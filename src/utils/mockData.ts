import { Player } from '../types/game.types';

export const mockPlayers: Player[] = [
  { id: '1', name: 'KYLIE', initials: 'K', score: 420 },
  { id: '2', name: 'ANISH', initials: 'A', score: 380 },
  { id: '3', name: 'VISV', initials: 'V', score: 340 },
  { id: '4', name: 'IZZY', initials: 'I', score: 310 },
];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
