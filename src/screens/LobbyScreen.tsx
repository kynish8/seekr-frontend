import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGameStore } from "../store/gameStore";
import { POINTS_OPTIONS, TIMEOUT_OPTIONS } from "../constants/game.constants";
import { socketService } from "../services/socket.service";
import { GameSettings } from "../types/game.types";
import { AsciiBotanical } from "../components/ui/AsciiBotanical";
import { useParallax } from "../hooks/useParallax";

const PLAYER_COLORS = [
  "#FF6900",
  "#2563eb",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
];

export function LobbyScreen() {
  const navigate = useNavigate();
  const {
    roomCode,
    players,
    settings,
    isHost,
    currentPlayerId,
    updateSettings,
    addPlayer,
    removePlayer,
  } = useGameStore();
  const p = useParallax();

  useEffect(() => {
    if (!roomCode) navigate("/");
  }, [roomCode, navigate]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on("player:joined", (player) => addPlayer(player));

    socket.on("player:left", (playerId) => {
      if (playerId === currentPlayerId) {
        socketService.disconnect();
        navigate("/");
      } else {
        removePlayer(playerId);
      }
    });

    socket.on("settings:updated", (newSettings) => updateSettings(newSettings));
    socket.on("game:started", () => navigate("/game"));

    return () => {
      socket.off("player:joined");
      socket.off("player:left");
      socket.off("settings:updated");
      socket.off("game:started");
    };
  }, [addPlayer, removePlayer, updateSettings, navigate, currentPlayerId]);

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      toast("copied!");
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    if (players.length === 1) return;
    socketService.removePlayer(playerId);
  };

  const handleSettingsChange = (patch: Partial<GameSettings>) => {
    updateSettings(patch);
    socketService.updateSettings(patch);
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      toast.error("need at least 2 players to start");
      return;
    }
    socketService.startGame();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden relative">
      <AsciiBotanical />

      <main className="flex-1 flex flex-col items-center px-6 pt-14 pb-12 relative z-10">
        <div
          className="text-center mb-14"
          style={{ transform: `translate(${p.x * -12}px, ${p.y * -8}px)` }}
        >
          <div className="text-sm font-bold text-[#1a1a1a]/60 tracking-widest mb-3">
            room code
          </div>
          <button
            onClick={handleCopyRoomCode}
            className="text-7xl md:text-8xl font-bold leading-none tracking-tight text-[#FF6900] hover:opacity-70 active:scale-95 transition-all duration-150 select-none"
            data-no-trail
          >
            {roomCode}
          </button>
          <div className="text-xs text-[#1a1a1a]/45 mt-2 tracking-wide">
            tap to copy
          </div>
        </div>

        <div
          className="w-full max-w-sm mb-10"
          style={{ transform: `translate(${p.x * -7}px, ${p.y * -5}px)` }}
        >
          <div className="text-xs font-bold text-[#1a1a1a]/50 tracking-widest mb-4 text-center">
            players ({players.length})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player, i) => (
              <div
                key={player.id}
                className="relative px-4 py-4 font-bold text-base group text-white"
                style={{
                  backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
                }}
              >
                <div className="truncate">
                  {player.name}
                  {player.id === currentPlayerId && (
                    <span className="font-normal opacity-70"> (you)</span>
                  )}
                </div>
                {isHost &&
                  players.length > 1 &&
                  player.id !== currentPlayerId && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1a1a1a] text-white
                               text-xs font-bold flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                      title="remove player"
                    >
                      ×
                    </button>
                  )}
              </div>
            ))}
          </div>

          {players.length < 2 && (
            <p className="text-xs text-[#1a1a1a]/35 mt-4 text-center">
              share the code — need at least 2 players to start
            </p>
          )}
        </div>

        {/* Settings — host only */}
        {isHost && (
          <div
            className="w-full max-w-sm mb-10"
            style={{ transform: `translate(${p.x * -4}px, ${p.y * -3}px)` }}
          >
            <div className="text-xs font-bold text-[#1a1a1a]/50 tracking-widest mb-4 text-center">
              settings
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-[#1a1a1a]/45 mb-2">
                  points to win
                </div>
                <div className="flex gap-2">
                  {POINTS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        handleSettingsChange({ pointsToWin: option })
                      }
                      className={`flex-1 py-3 font-bold text-base transition-all duration-150 active:scale-95 ${
                        settings.pointsToWin === option
                          ? "bg-[#FF6900] text-white"
                          : "bg-[#1a1a1a]/6 text-[#1a1a1a] hover:bg-[#1a1a1a]/10"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-[#1a1a1a]/45 mb-2">
                  round timeout
                </div>
                <div className="flex gap-2">
                  {TIMEOUT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        handleSettingsChange({ roundTimeout: option })
                      }
                      className={`flex-1 py-3 font-bold text-base transition-all duration-150 active:scale-95 ${
                        settings.roundTimeout === option
                          ? "bg-[#FF6900] text-white"
                          : "bg-[#1a1a1a]/6 text-[#1a1a1a] hover:bg-[#1a1a1a]/10"
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

        {/* Start / wait */}
        <div
          className="w-full max-w-sm"
          style={{ transform: `translate(${p.x * -2}px, ${p.y * -1.5}px)` }}
        >
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full py-4 bg-[#FF6900] text-white font-bold text-base tracking-wide
                         hover:bg-[#e05e00] active:scale-[0.98] transition-all duration-150
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              start game
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#1a1a1a]/40">
              <div className="w-1.5 h-1.5 bg-[#FF6900] rounded-full animate-pulse" />
              waiting for host to start...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
