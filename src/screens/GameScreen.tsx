import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmojiReactionButton,
  GlobalEmojiReactions,
} from "../components/ui/EmojiReaction";
import { useGameStore } from "../store/gameStore";
import { socketService } from "../services/socket.service";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥"];
const MAX_PHOTO_PX = 640;

async function resizeAndEncode(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(
        MAX_PHOTO_PX / img.width,
        MAX_PHOTO_PX / img.height,
        1,
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function GameScreen() {
  const navigate = useNavigate();
  const {
    rounds,
    currentRound,
    players,
    settings,
    currentPlayerId,
    setCurrentRound,
    updateRound,
    setPlayers,
  } = useGameStore();

  const [timeRemaining, setTimeRemaining] = useState<number>(
    settings.timePerRound,
  );
  const [latestReaction, setLatestReaction] = useState<{
    emoji: string;
    timestamp: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionMsg, setRejectionMsg] = useState<string | null>(null);

  const activeRoundIdRef = useRef<string | null>(null);

  const currentRoundData = rounds[currentRound];

  // wire up socket listeners
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleRoundUpdate = (round: typeof currentRoundData) => {
      updateRound(round);
      setTimeRemaining(round.timeRemaining);

      if (round.id !== activeRoundIdRef.current) {
        activeRoundIdRef.current = round.id;
        const { rounds: storeRounds } = useGameStore.getState();
        const roundIndex = storeRounds.findIndex((r) => r.id === round.id);
        if (roundIndex !== -1) {
          setCurrentRound(roundIndex);
        }
      }
    };

    const handleGameEnded = ({
      players: finalPlayers,
    }: {
      players: typeof players;
    }) => {
      setPlayers(finalPlayers);
      navigate("/results");
    };

    const handlePlayersUpdated = ({
      players: updatedPlayers,
    }: {
      players: typeof players;
    }) => {
      setPlayers(updatedPlayers);
    };

    const handleRejection = ({ reason }: { reason: string }) => {
      setRejectionMsg(reason);
      setSubmitting(false);
      setTimeout(() => setRejectionMsg(null), 3000);
    };

    socket.on("round:update", handleRoundUpdate);
    socket.on("game:ended", handleGameEnded);
    socket.on("players:updated", handlePlayersUpdated);
    socket.on("submission:rejected", handleRejection);

    return () => {
      socket.off("round:update", handleRoundUpdate);
      socket.off("game:ended", handleGameEnded);
      socket.off("players:updated", handlePlayersUpdated);
      socket.off("submission:rejected", handleRejection);
    };
  }, [updateRound, setCurrentRound, setPlayers, navigate]);

  if (!currentRoundData)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading game...
      </div>
    );

  const alreadySubmitted =
    currentPlayerId != null && currentPlayerId in currentRoundData.submissions;

  const handlePhotoSubmit = async (file: File) => {
    if (!currentRoundData || alreadySubmitted || submitting) return;
    setSubmitting(true);
    setRejectionMsg(null);
    try {
      const photoUrl = await resizeAndEncode(file);
      socketService.submitPhoto(currentRoundData.id, photoUrl);
    } catch {
      setSubmitting(false);
    }
  };

  const handleReaction = (emoji: string) => {
    setLatestReaction({ emoji, timestamp: Date.now() });
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden relative">
      <GlobalEmojiReactions
        reactions={latestReaction ? [latestReaction] : []}
      />

      <div className="bg-white border-b border-gray-300 px-6 py-3 shadow-sm animate-slide-up">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                Round
              </div>
              <div className="text-2xl font-display text-orange-primary">
                {currentRound + 1}/{rounds.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                Time
              </div>
              <div
                className={`text-2xl font-display ${timeRemaining <= 10 ? "text-red-600 animate-pulse-slow" : "text-gray-900"}`}
              >
                {timeRemaining}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold text-right uppercase tracking-wide">
              Your Score
            </div>
            <div className="text-2xl font-display text-gray-900">
              {players.find((p) => p.id === currentPlayerId)?.score ?? 0}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-200 h-1 relative overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-primary to-orange-light h-full transition-all duration-1000"
          style={{ width: `${(timeRemaining / settings.timePerRound) * 100}%` }}
        />
      </div>

      <div className="gradient-orange py-5 px-6 shadow-md relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-4xl font-display text-white text-center tracking-tight animate-scale-in">
            {currentRoundData.prompt}
          </h1>
        </div>
      </div>

      {rejectionMsg && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 font-bold text-sm shadow-xl animate-fade-in">
          {rejectionMsg}
        </div>
      )}

      <div className="flex-1 px-6 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-2 gap-4 h-full">
            {players.map((player, idx) => {
              const submittedUrl = currentRoundData.submissions[player.id];
              const isCurrentPlayer = player.id === currentPlayerId;
              const hasSubmitted = player.id in currentRoundData.submissions;

              return (
                <div
                  key={player.id}
                  className={`bg-navy-dark relative flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-scale-in ${
                    isCurrentPlayer
                      ? "ring-4 ring-orange-primary shadow-2xl"
                      : "hover:ring-2 hover:ring-gray-400"
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex-1 flex items-center justify-center relative overflow-hidden group">
                    {submittedUrl ? (
                      <img
                        src={submittedUrl}
                        alt={`${player.name}'s submission`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-9xl font-display text-white/20 transition-all group-hover:scale-110">
                        {player.initials}
                      </div>
                    )}

                    {isCurrentPlayer && !hasSubmitted && (
                      <label className="absolute bottom-4 left-1/2 -translate-x-1/2 cursor-pointer z-10">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoSubmit(file);
                            e.target.value = ""; // allow re-selecting same file
                          }}
                          disabled={submitting}
                        />
                        <div
                          className={`px-5 py-2 font-bold text-sm shadow-lg transition-all ${
                            submitting
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-orange-primary text-white hover:bg-orange-light active:scale-95"
                          }`}
                        >
                          {submitting ? "SUBMITTING..." : "SNAP IT"}
                        </div>
                      </label>
                    )}

                    {isCurrentPlayer && hasSubmitted && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 text-xs font-bold shadow-lg">
                        SUBMITTED
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-3 flex items-center justify-between border-t-2 border-gray-200">
                    <div className="font-bold text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-600 font-semibold">
                      {player.score} PTS
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-300 px-6 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              React
            </span>
            {REACTION_EMOJIS.map((emoji) => (
              <EmojiReactionButton
                key={emoji}
                emoji={emoji}
                onReact={handleReaction}
              />
            ))}
          </div>
          <div className="flex items-center gap-6 text-xs font-bold">
            <span className="text-gray-500 uppercase tracking-wide">
              Standings
            </span>
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={
                    idx === 0 ? "text-orange-primary" : "text-gray-700"
                  }
                >
                  {idx + 1}. {p.name}{" "}
                  <span className="text-gray-500">{p.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
