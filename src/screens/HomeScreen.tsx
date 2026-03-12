import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AsciiOrangeBackground } from "../components/ui/AsciiOrange";
import { useGameStore } from "../store/gameStore";
import { socketService } from "../services/socket.service";
import { useParallax } from "../hooks/useParallax";

export function HomeScreen() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();
  const {
    setRoomCode: setStoreRoomCode,
    setIsHost,
    setPlayers,
    updateSettings,
    setCurrentPlayerId,
    setHostId,
  } = useGameStore();
  const p = useParallax();
  const blueOverlayRef = useRef<HTMLHeadingElement>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("enter your name to continue");
      return;
    }
    if (mode === "join" && !roomCode.trim()) {
      setError("enter a room code to continue");
      return;
    }
    setError("");
    setIsConnecting(true);

    const socket = socketService.connect();

    if (mode === "create") {
      socket.once("room:created", (data) => {
        setStoreRoomCode(data.roomCode);
      });

      socket.once("room:joined", (data) => {
        setPlayers(data.players);
        updateSettings(data.settings);
        setCurrentPlayerId(data.playerId);
        setHostId(data.hostId);
        setIsHost(true);
        setIsConnecting(false);
        navigate("/lobby");
      });

      socketService.createRoom(name.trim());
    } else {
      socket.once("room:joined", (data) => {
        setStoreRoomCode(roomCode.trim().toUpperCase());
        setPlayers(data.players);
        updateSettings(data.settings);
        setCurrentPlayerId(data.playerId);
        setHostId(data.hostId);
        setIsHost(false);
        setIsConnecting(false);
        navigate("/lobby");
      });

      socketService.joinRoom(roomCode.trim(), name.trim());
    }

    socket.once("error", (data) => {
      setError(data.message);
      setIsConnecting(false);
      socketService.disconnect();
    });

    socket.once("connect_error", () => {
      setError("could not reach server. is the backend running?");
      setIsConnecting(false);
      socketService.disconnect();
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <AsciiOrangeBackground blueOverlayRef={blueOverlayRef} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div
          className="text-center mb-12"
          style={{ transform: `translate(${p.x * -15}px, ${p.y * -10}px)` }}
        >
          <div className="relative inline-block">
            <h1 className="text-7xl md:text-8xl xl:text-9xl font-bold leading-[0.9] tracking-tight text-[#FF6900] select-none">
              hullabaloo
            </h1>
            <h1
              ref={blueOverlayRef}
              className="absolute inset-0 text-7xl md:text-8xl xl:text-9xl font-bold leading-[0.9] tracking-tight text-[#2563eb] pointer-events-none select-none"
              aria-hidden="true"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              hullabaloo
            </h1>
          </div>
          <p className="text-base text-[#2563eb] tracking-widest mt-4">
            find it. snap it. win it.
          </p>
        </div>

        <div
          className="w-full max-w-md space-y-5 min-h-[280px]"
          style={{ transform: `translate(${p.x * -5}px, ${p.y * -4}px)` }}
        >
          <div className="flex bg-[#FF6900]/8 p-1 gap-1">
            <button
              onClick={() => {
                setMode("create");
                setError("");
              }}
              className={`flex-1 py-3 text-base font-bold tracking-wide transition-all duration-150 ${
                mode === "create"
                  ? "bg-[#FF6900] text-white"
                  : "text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70"
              }`}
            >
              create game
            </button>
            <button
              onClick={() => {
                setMode("join");
                setError("");
              }}
              className={`flex-1 py-3 text-base font-bold tracking-wide transition-all duration-150 ${
                mode === "join"
                  ? "bg-[#FF6900] text-white"
                  : "text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70"
              }`}
            >
              join game
            </button>
          </div>

          <input
            type="text"
            placeholder="your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full px-4 py-4 bg-transparent border-b-2 border-[#1a1a1a]/20 text-[#1a1a1a] placeholder-[#1a1a1a]/40 font-medium text-base focus:outline-none focus:border-[#FF6900] transition-all duration-150"
            autoComplete="off"
            maxLength={20}
            disabled={isConnecting}
          />

          {mode === "join" && (
            <input
              type="text"
              placeholder="room code"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                );
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-4 bg-transparent border-b-2 border-[#1a1a1a]/20 text-[#1a1a1a] placeholder-[#1a1a1a]/40 font-medium text-base focus:outline-none focus:border-[#FF6900] transition-all duration-150"
              maxLength={6}
              autoComplete="off"
              disabled={isConnecting}
            />
          )}

          {error && <p className="text-red-500/70 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isConnecting}
            className="w-full py-4 bg-[#FF6900] text-white font-bold text-base tracking-wide hover:bg-[#e05e00] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnecting
              ? "connecting..."
              : mode === "create"
                ? "create game"
                : "join game"}
          </button>
        </div>
      </main>
    </div>
  );
}
