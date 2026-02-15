import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { useGameStore } from "../store/gameStore";
import { generateRoomCode } from "../utils/mockData";

export function HomeScreen() {
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const navigate = useNavigate();
  const {
    setRoomCode: setStoreRoomCode,
    setIsHost,
    addPlayer,
    setCurrentPlayerId,
    setHostId,
  } = useGameStore();

  const handleCreateGame = () => {
    if (!createName.trim()) {
      setCreateError("Enter your name to continue");
      return;
    }
    setCreateError("");
    const code = generateRoomCode();
    const playerId = "1";
    setStoreRoomCode(code);
    setIsHost(true);
    setHostId(playerId);
    setCurrentPlayerId(playerId);
    addPlayer({
      id: playerId,
      name: createName.trim().toUpperCase(),
      initials: createName.charAt(0).toUpperCase(),
      score: 0,
    });
    navigate("/lobby");
  };

  const handleJoinGame = () => {
    if (!joinName.trim()) {
      setJoinError("Enter your name to continue");
      return;
    }
    if (!roomCode.trim()) {
      setJoinError("Enter a room code to continue");
      return;
    }
    setJoinError("");
    const playerId = "2";
    setStoreRoomCode(roomCode);
    setIsHost(false);
    setCurrentPlayerId(playerId);
    addPlayer({
      id: playerId,
      name: joinName.trim().toUpperCase(),
      initials: joinName.charAt(0).toUpperCase(),
      score: 0,
    });
    navigate("/lobby");
  };

  return (
    <div className="min-h-screen gradient-orange text-white flex flex-col relative noise-overlay overflow-hidden">
      <header className="px-8 md:px-16 py-6 relative z-10 animate-fade-in">
        <Logo size="md" />
      </header>

      <main className="flex-1 flex items-center px-8 md:px-16 relative z-10">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 py-8">
          <div className="flex flex-col justify-center animate-slide-up">
            <h1 className="text-6xl md:text-7xl xl:text-8xl font-bold mb-6 leading-[0.92] tracking-tight">
              FIND IT.
              <br />
              SNAP IT.
              <br />
              WIN IT.
            </h1>
            <p className="text-lg opacity-80 font-medium leading-relaxed max-w-sm mb-10">
              Multiplayer scavenger hunt. Real-time competition. Turn your world
              into a game.
            </p>

            <div className="space-y-6 animate-slide-up delay-150">
              {[
                {
                  num: "01",
                  title: "GATHER PLAYERS",
                  desc: "Create a room and share the code with friends.",
                },
                {
                  num: "02",
                  title: "FIND & SNAP",
                  desc: "Race to find objects. First to submit wins the round.",
                },
                {
                  num: "03",
                  title: "WIN & CELEBRATE",
                  desc: "Earn points each round. Most points takes the crown.",
                },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <span className="text-2xl font-bold opacity-30 w-10 shrink-0">
                    {step.num}
                  </span>
                  <div>
                    <div className="font-bold text-sm tracking-wider mb-0.5">
                      {step.title}
                    </div>
                    <div className="text-sm opacity-70">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-center animate-slide-up delay-150">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-7">
              <div className="text-xs font-bold tracking-widest uppercase opacity-60 mb-4">
                Create Game
              </div>
              <input
                type="text"
                placeholder="Your name"
                value={createName}
                onChange={(e) => {
                  setCreateName(e.target.value);
                  setCreateError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGame()}
                className="w-full px-4 py-3 bg-white/15 border border-white/25 text-white placeholder-white/50 font-medium text-base focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all duration-150 mb-3"
                autoComplete="off"
              />
              {createError && (
                <p className="text-white/80 text-xs mb-3 -mt-1">
                  {createError}
                </p>
              )}
              <button
                onClick={handleCreateGame}
                className="w-full py-4 bg-white text-orange-primary font-bold text-base tracking-wide hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 shadow-lg hover:shadow-xl"
              >
                CREATE GAME
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-transparent text-white/40 text-xs font-medium tracking-wider">
                  OR
                </span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-7">
              <div className="text-xs font-bold tracking-widest uppercase opacity-60 mb-4">
                Join Game
              </div>
              <input
                type="text"
                placeholder="Your name"
                value={joinName}
                onChange={(e) => {
                  setJoinName(e.target.value);
                  setJoinError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                className="w-full px-4 py-3 bg-white/15 border border-white/25 text-white placeholder-white/50 font-medium text-base focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all duration-150 mb-3"
                autoComplete="off"
              />
              <input
                type="text"
                placeholder="Room code (e.g. ABC123)"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setJoinError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                className="w-full px-4 py-3 bg-white/15 border border-white/25 text-white placeholder-white/50 font-medium text-base focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all duration-150 mb-3"
                maxLength={6}
                autoComplete="off"
              />
              {joinError && (
                <p className="text-white/80 text-xs mb-3 -mt-1">{joinError}</p>
              )}
              <button
                onClick={handleJoinGame}
                className="w-full py-4 bg-orange-dark text-white font-bold text-base tracking-wide hover:bg-orange-primary active:scale-[0.98] transition-all duration-150 shadow-lg hover:shadow-xl"
              >
                JOIN GAME
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
