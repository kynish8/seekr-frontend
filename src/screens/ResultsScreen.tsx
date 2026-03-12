import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGameStore } from "../store/gameStore";
import { RankedPlayer } from "../types/game.types";
import { socketService } from "../services/socket.service";
import { AsciiBotanical } from "../components/ui/AsciiBotanical";
import { useParallax } from "../hooks/useParallax";

// Podium columns: left=2nd, center=1st, right=3rd
const PODIUM_COLS = [
  {
    rankIndex: 1,
    label: "2",
    blockH: "clamp(70px, 16vw, 110px)",
    blockBg: "#2563eb",
    numSize: "clamp(2rem, 6vw, 3.5rem)",
  },
  {
    rankIndex: 0,
    label: "1",
    blockH: "clamp(105px, 24vw, 165px)",
    blockBg: "#FF6900",
    numSize: "clamp(3rem, 9vw, 5rem)",
  },
  {
    rankIndex: 2,
    label: "3",
    blockH: "clamp(48px, 11vw, 75px)",
    blockBg: "#10b981",
    numSize: "clamp(1.75rem, 5vw, 3rem)",
  },
];

const RANK_SUBLABEL: Record<number, string> = {
  1: "winner",
  2: "2nd place",
  3: "3rd place",
};

export function ResultsScreen() {
  const navigate = useNavigate();
  const { players, resetGame } = useGameStore();
  const p = useParallax();

  const ranked: RankedPlayer[] = useMemo(
    () =>
      [...players]
        .sort((a, b) => b.score - a.score)
        .map((pl, i) => ({ ...pl, rank: i + 1 })),
    [players],
  );

  const top3 = [ranked[0] ?? null, ranked[1] ?? null, ranked[2] ?? null];

  const handlePlayAgain = () => {
    socketService.disconnect();
    resetGame();
    navigate("/");
  };

  const buildShareText = () => {
    const medals = ["🥇", "🥈", "🥉"];
    const lines = ranked.map(
      (pl, i) => `${medals[i] ?? `${pl.rank}.`} ${pl.name} — ${pl.score} pts`,
    );
    return ["hullabaloo.", "find it. snap it. win it.", "", ...lines].join(
      "\n",
    );
  };

  const handleShareResults = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "hullabaloo results", text });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("copied to clipboard!");
    }
  };

  const handleShareX = () => {
    const medals = ["🥇", "🥈", "🥉"];
    const lines = ranked.map(
      (pl, i) => `${medals[i] ?? `${pl.rank}.`} ${pl.name} — ${pl.score} pts`,
    );
    const tweet = [
      "hullabaloo results 🎮",
      "",
      ...lines,
      "",
      "find it. snap it. win it.",
    ].join("\n");
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden relative">
      <AsciiBotanical />

      <main className="flex-1 flex flex-col items-center px-6 pt-14 pb-6 relative z-10">
        <div
          className="text-center mb-10"
          style={{ transform: `translate(${p.x * -12}px, ${p.y * -8}px)` }}
        >
          <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tight text-[#FF6900]">
            game over
          </h1>
        </div>

        <div
          className="w-full max-w-sm mb-8"
          style={{ transform: `translate(${p.x * -7}px, ${p.y * -5}px)` }}
        >
          <div className="flex items-end justify-center gap-2">
            {PODIUM_COLS.map((col) => {
              const player = top3[col.rankIndex];
              return (
                <div
                  key={col.label}
                  className="flex flex-col items-center"
                  style={{ flex: "1 1 0", maxWidth: 160 }}
                >
                  <div
                    className="w-full mb-2 flex flex-col items-center justify-center px-3 py-3"
                    style={{
                      background: "#f4f3f1",
                      minHeight: "clamp(60px, 12vw, 80px)",
                    }}
                  >
                    {player ? (
                      <>
                        <span
                          className="font-bold text-center leading-tight truncate w-full text-[#1a1a1a]"
                          style={{
                            fontSize:
                              col.rankIndex === 0
                                ? "clamp(0.9rem, 3.5vw, 1.25rem)"
                                : "clamp(0.75rem, 2.8vw, 1rem)",
                          }}
                        >
                          {player.name}
                        </span>
                        <span className="text-xs font-semibold mt-0.5 tabular-nums text-[#1a1a1a]/45">
                          {player.score} pts
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-[#1a1a1a]/20">
                        —
                      </span>
                    )}
                  </div>

                  <div
                    className="w-full flex items-center justify-center"
                    style={{ height: col.blockH, background: col.blockBg }}
                  >
                    <span
                      className="font-bold select-none"
                      style={{
                        fontSize: col.numSize,
                        color: "#ffffff",
                        opacity: 0.45,
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

        <div
          className="w-full max-w-sm mb-8"
          style={{ transform: `translate(${p.x * -4}px, ${p.y * -3}px)` }}
        >
          <div className="text-sm font-bold text-[#1a1a1a]/60 tracking-widest mb-3 text-center">
            final stats
          </div>
          <div>
            {ranked.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center gap-4 px-4 py-3.5 bg-[#1a1a1a]/5"
                style={{ marginTop: idx === 0 ? 0 : 2 }}
              >
                <div className="w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 bg-[#FF6900] text-white">
                  {player.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm leading-tight truncate text-[#1a1a1a]">
                    {player.name}
                  </div>
                  <div className="text-xs font-semibold tracking-wider mt-0.5 text-[#1a1a1a]/40">
                    {RANK_SUBLABEL[player.rank] ?? `${player.rank}th place`}
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums shrink-0 text-[#FF6900]">
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play again — centered, content width */}
        <div
          className="flex justify-center mb-2"
          style={{ transform: `translate(${p.x * -2}px, ${p.y * -1.5}px)` }}
        >
          <button
            onClick={handlePlayAgain}
            className="px-10 py-4 font-bold text-base tracking-wide bg-[#FF6900] text-white hover:bg-[#e05e00] active:scale-[0.98] transition-all duration-150"
          >
            play again
          </button>
        </div>

        {/* Share buttons — centered, content width */}
        <div
          className="flex justify-center gap-2"
          style={{ transform: `translate(${p.x * -1}px, ${p.y * -0.5}px)` }}
        >
          <button
            onClick={handleShareResults}
            className="px-5 py-2.5 font-bold text-sm tracking-wide bg-[#2563eb] text-white hover:bg-[#1d4ed8] active:scale-[0.98] transition-all duration-150 flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            share results
          </button>
          <button
            onClick={handleShareX}
            className="px-5 py-2.5 font-bold text-sm tracking-wide bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-[0.98] transition-all duration-150 flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            share on x
          </button>
        </div>
      </main>

      <footer
        className="pb-10 flex justify-center relative z-10"
        style={{ transform: `translate(${p.x * -3}px, ${p.y * -2}px)` }}
      >
        <div className="text-2xl font-bold tracking-tight text-[#FF6900]">
          hullabaloo.
        </div>
      </footer>
    </div>
  );
}
