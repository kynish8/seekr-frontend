import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AsciiOrangeBackground } from "../components/ui/AsciiOrange";
import { useGameStore } from "../store/gameStore";
import { socketService } from "../services/socket.service";

function useParallax() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const raf = useRef(0);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;
      setOffset({ x: current.current.x, y: current.current.y });
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return offset;
}

export function HomeScreen() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [createName, setCreateName] = useState("");
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

  const handleSubmit = () => {
    if (!createName.trim()) {
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

      socketService.createRoom(createName.trim());
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

      socketService.joinRoom(roomCode.trim(), createName.trim());
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
    <div className="min-h-screen bg-white text-[#1a1a2e] flex flex-col relative overflow-hidden">
      <AsciiOrangeBackground />
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div
          className="text-center mb-12 transition-transform duration-100 bg-white px-6 py-4"
          style={{ transform: `translate(${p.x * -15}px, ${p.y * -10}px)` }}
        >
          <h1 className="text-7xl md:text-8xl xl:text-9xl font-bold leading-[0.9] tracking-tight mb-4 text-[#2563eb]">
            seekr
          </h1>
          <p className="text-base text-[#1a1a2e]/60 tracking-widest">
            find it. snap it. win it.
          </p>
        </div>

        <div
          className="w-full max-w-md space-y-5 transition-transform duration-100 bg-white p-8"
          style={{ transform: `translate(${p.x * -5}px, ${p.y * -4}px)` }}
        >
          <div className="flex bg-[#1a1a2e]/5 p-1 gap-1">
            <button
              onClick={() => { setMode("create"); setError(""); }}
              className={`flex-1 py-3 text-base font-bold tracking-wide transition-all duration-150 ${
                mode === "create"
                  ? "bg-[#2563eb] text-white"
                  : "text-[#1a1a2e]/50 hover:text-[#1a1a2e]/70"
              }`}
            >
              create game
            </button>
            <button
              onClick={() => { setMode("join"); setError(""); }}
              className={`flex-1 py-3 text-base font-bold tracking-wide transition-all duration-150 ${
                mode === "join"
                  ? "bg-[#2563eb] text-white"
                  : "text-[#1a1a2e]/50 hover:text-[#1a1a2e]/70"
              }`}
            >
              join game
            </button>
          </div>

          <input
            type="text"
            placeholder="your name"
            value={createName}
            onChange={(e) => {
              setCreateName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full px-4 py-4 bg-transparent border-b-2 border-[#1a1a2e]/20 text-[#1a1a2e] placeholder-[#1a1a2e]/40 font-medium text-base focus:outline-none focus:border-[#2563eb] transition-all duration-150"
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
                setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-4 bg-transparent border-b-2 border-[#1a1a2e]/20 text-[#1a1a2e] placeholder-[#1a1a2e]/40 font-medium text-base focus:outline-none focus:border-[#2563eb] transition-all duration-150"
              maxLength={6}
              autoComplete="off"
              disabled={isConnecting}
            />
          )}

          {error && (
            <p className="text-red-500/70 text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isConnecting}
            className="w-full py-4 bg-[#2563eb] text-white font-bold text-base tracking-wide hover:bg-[#1d4ed8] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnecting ? "connecting..." : mode === "create" ? "create game" : "join game"}
          </button>
        </div>
      </main>
    </div>
  );
}
