class SocketService {
  connect() {
    console.log('Socket.io: Connect (placeholder)');
  }

  disconnect() {
    console.log('Socket.io: Disconnect (placeholder)');
  }

  createRoom(_playerName: string) {
    console.log('Socket.io: Create room (placeholder)');
  }

  joinRoom(_roomCode: string, _playerName: string) {
    console.log('Socket.io: Join room (placeholder)');
  }

  removePlayer(_playerId: string) {
    console.log('Socket.io: Remove player (placeholder)');
  }

  startGame() {
    console.log('Socket.io: Start game (placeholder)');
  }

  updateSettings(_settings: Record<string, unknown>) {
    console.log('Socket.io: Update settings (placeholder)');
  }

  submitPhoto(_roundId: string, _photoUrl: string) {
    console.log('Socket.io: Submit photo (placeholder)');
  }
}

export const socketService = new SocketService();
