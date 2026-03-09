import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGameStore } from "../store/gameStore";
import { RankedPlayer } from "../types/game.types";
import { socketService } from "../services/socket.service";

// Podium columns: left=2nd, center=1st, right=3rd
// blockH uses clamp(min, preferred-vw, max) so the podium scales with window width
const PODIUM_COLS = [
  {
    rankIndex: 1,
    label: "2",
    blockH: "clamp(70px, 16vw, 110px)",
    blockBg: "#FDDCB5",
    numColor: "#FF6900",
    numSize: "clamp(2rem, 6vw, 3.5rem)",
  },
  {
    rankIndex: 0,
    label: "1",
    blockH: "clamp(105px, 24vw, 165px)",
    blockBg: "#ffffff",
    numColor: "#FF6900",
    numSize: "clamp(3rem, 9vw, 5rem)",
  },
  {
    rankIndex: 2,
    label: "3",
    blockH: "clamp(48px, 11vw, 75px)",
    blockBg: "#FDDCB5",
    numColor: "#FF6900",
    numSize: "clamp(1.75rem, 5vw, 3rem)",
  },
];

const RANK_SUBLABEL: Record<number, string> = {
  1: "🏆 WINNER",
  2: "2ND PLACE",
  3: "3RD PLACE",
};

export function ResultsScreen() {
  const navigate = useNavigate();
  const { players, resetGame } = useGameStore();

  const ranked: RankedPlayer[] = useMemo(
    () =>
      [...players]
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    [players],
  );

  // Always pad to 3 so we always render all 3 podium slots
  const top3 = [ranked[0] ?? null, ranked[1] ?? null, ranked[2] ?? null];

  const handlePlayAgain = () => {
    socketService.disconnect();
    resetGame();
    navigate("/");
  };

  const handleShareResults = () => {
    const text = `SEEKR Results!\n${ranked.map((p) => `${p.rank}. ${p.name} — ${p.score} PTS`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Results copied!");
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: "#FF6900" }}
    >
      <header
        className="px-6 py-4 shrink-0 animate-rise"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.3)" }}
      >
        <span className="text-sm font-bold text-white tracking-[0.22em] uppercase">
          Seekr
        </span>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-5 pb-10 flex flex-col gap-8">
        <div className="pt-6 animate-rise" style={{ animationDelay: "60ms" }}>
          <h1
            className="font-display font-bold text-white leading-none tracking-tight"
            style={{ fontSize: "clamp(3rem, 12vw, 5rem)" }}
          >
            GAME OVER
          </h1>
        </div>

        <div className="animate-rise" style={{ animationDelay: "160ms" }}>
          <div className="flex items-end justify-center gap-3">
            {PODIUM_COLS.map((col) => {
              const player = top3[col.rankIndex];
              return (
                <div
                  key={col.label}
                  className="flex flex-col items-center"
                  style={{ flex: "1 1 0", maxWidth: 160 }}
                >
                  <div
                    className="w-full mb-3 flex flex-col items-center justify-center px-3 py-3"
                    style={{
                      background: "#ffffff",
                      minHeight: "clamp(60px, 12vw, 80px)",
                    }}
                  >
                    {player ? (
                      <>
                        <span
                          className="font-bold text-center leading-tight truncate w-full text-center"
                          style={{
                            color: "#FF6900",
                            fontSize:
                              col.rankIndex === 0
                                ? "clamp(0.9rem, 3.5vw, 1.25rem)"
                                : "clamp(0.75rem, 2.8vw, 1rem)",
                          }}
                        >
                          {player.name}
                        </span>
                        <span
                          className="text-xs font-semibold mt-0.5 tabular-nums"
                          style={{ color: "#555555" }}
                        >
                          {player.score} PTS
                        </span>
                      </>
                    ) : (
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#e0c8b8" }}
                      >
                        —
                      </span>
                    )}
                  </div>

                  <div
                    className="w-full flex items-center justify-center"
                    style={{ height: col.blockH, background: col.blockBg }}
                  >
                    <span
                      className="font-display font-bold select-none"
                      style={{
                        fontSize: col.numSize,
                        color: col.numColor,
                        opacity: 0.35,
                        lineHeight: 1,
                      }}
                    >
                      {col.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="animate-rise" style={{ animationDelay: "280ms" }}>
          <div
            className="text-xs font-bold tracking-[0.2em] uppercase mb-3"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Final Stats
          </div>

          <div className="bg-white overflow-hidden">
            {ranked.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center gap-4 px-4 py-3.5"
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid #F0EDE8",
                }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "#FF6900", color: "#ffffff" }}
                >
                  {player.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-sm leading-tight truncate"
                    style={{ color: "#FF6900" }}
                  >
                    {player.name}
                  </div>
                  <div
                    className="text-[10px] font-semibold tracking-wider uppercase mt-0.5"
                    style={{ color: "#AAAAAA" }}
                  >
                    {RANK_SUBLABEL[player.rank] ?? `${player.rank}TH PLACE`}
                  </div>
                </div>

                <div
                  className="text-2xl font-bold tabular-nums shrink-0"
                  style={{ color: "#FF6900" }}
                >
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex gap-3 animate-rise"
          style={{ animationDelay: "380ms" }}
        >
          <button
            onClick={handlePlayAgain}
            className="flex-1 py-4 font-bold text-sm tracking-widest uppercase active:scale-95 transition-all hover:brightness-95"
            style={{ background: "#ffffff", color: "#FF6900" }}
          >
            Play Again
          </button>
          <button
            onClick={handleShareResults}
            className="flex-1 py-4 font-bold text-sm tracking-widest uppercase active:scale-95 transition-all hover:brightness-95"
            style={{ background: "#CC5400", color: "#ffffff" }}
          >
            Share Results
          </button>
        </div>
      </main>
    </div>
  );
}
