import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { useGameStore } from '../store/gameStore';
import { ROUND_OPTIONS, TIME_OPTIONS } from '../constants/game.constants';
import { mockPlayers, mockRounds } from '../utils/mockData';

export function LobbyScreen() {
  const navigate = useNavigate();
  const { roomCode, players, settings, isHost, currentPlayerId, updateSettings, removePlayer, setPlayers, setRounds } = useGameStore();

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      alert('Room code copied!');
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    if (playerId === currentPlayerId && !isHost) {
      alert('You cannot remove yourself from the game!');
      return;
    }

    if (players.length === 1) {
      alert('Cannot remove the last player! Leave the game instead.');
      return;
    }

    removePlayer(playerId);
  };

  const handleStartGame = () => {
    if (players.length < 2) setPlayers(mockPlayers);
    setRounds(mockRounds);
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="gradient-orange py-5 px-8 md:px-12 shadow-md animate-slide-up">
        <Logo size="md" />
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-8 py-10">
        <div className="mb-10 animate-scale-in">
          <div className="text-xs font-bold text-gray-500 mb-2 tracking-wider uppercase">Room Code</div>
          <div className="flex items-center gap-3 group">
            <div className="text-7xl font-display text-gray-900 tracking-tight select-all
                           transition-colors hover:text-orange-primary cursor-pointer">
              {roomCode}
            </div>
            <button
              onClick={handleCopyRoomCode}
              className="px-6 py-2.5 bg-white text-orange-primary font-bold text-sm
                         hover:bg-orange-primary hover:text-white active:scale-95
                         transition-all duration-150 shadow-md hover:shadow-lg"
            >
              COPY
            </button>
          </div>
        </div>

        <div className="mb-10 animate-slide-up delay-150">
          <div className="text-xs font-bold text-gray-500 mb-4 tracking-wider uppercase">Players ({players.length})</div>
          <div className="grid grid-cols-2 gap-4">
            {players.map((player, idx) => (
              <div
                key={player.id}
                className="card p-5 relative group hover:-translate-y-1 transition-all duration-150
                           animate-scale-in"
                style={{ animationDelay: `${150 + idx * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">
                      {player.name}
                      {player.id === currentPlayerId && (
                        <span className="text-xs text-orange-primary ml-2 font-normal">(YOU)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-slow"></span>
                      WAITING
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-orange-primary transition-transform group-hover:rotate-45"></div>
                </div>
                {isHost && players.length > 1 && (
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-gray-800 text-white
                               flex items-center justify-center text-sm font-bold
                               opacity-0 group-hover:opacity-100 transition-all
                               hover:bg-red-600 hover:scale-110 active:scale-95 shadow-lg"
                    title={player.id === currentPlayerId ? 'Leave game' : 'Remove player'}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="mb-10 animate-slide-up delay-225">
            <div className="text-xs font-bold text-gray-500 mb-4 tracking-wider uppercase">Game Settings</div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Rounds</label>
                <div className="flex gap-2">
                  {ROUND_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => updateSettings({ rounds: option })}
                      className={`flex-1 py-3 font-bold text-lg transition-all duration-150
                                  hover:scale-105 active:scale-95 ${
                        settings.rounds === option
                          ? 'bg-orange-primary text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Time Per Round</label>
                <div className="flex gap-2">
                  {TIME_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => updateSettings({ timePerRound: option })}
                      className={`flex-1 py-3 font-bold text-lg transition-all duration-150
                                  hover:scale-105 active:scale-95 ${
                        settings.timePerRound === option
                          ? 'bg-orange-primary text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                      }`}
                    >
                      {option}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={handleStartGame}
            className="w-full py-5 bg-white text-orange-primary font-display text-xl
                       hover:bg-orange-primary hover:text-white active:scale-98
                       transition-all duration-150 shadow-md hover:shadow-lg
                       animate-slide-up delay-300 group relative overflow-hidden"
          >
            <span className="relative z-10">START GAME</span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-light to-orange-primary
                            translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        ) : (
          <div className="text-center text-gray-600 py-8 text-sm font-medium animate-pulse-slow">
            <div className="inline-flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-primary rounded-full animate-pulse"></div>
              Waiting for host to start the game...
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
