import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { socketService } from "../services/socket.service";
import { Round } from "../types/game.types";
import {
  EmojiReactionButton,
  GlobalEmojiReactions,
} from "../components/ui/EmojiReaction";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥"];
const FRAME_INTERVAL_MS = 200;

export function GameScreen() {
  const navigate = useNavigate();
  const { currentRound, players, settings, currentPlayerId, setCurrentRound, setPlayers } =
    useGameStore();

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [winnerOverlay, setWinnerOverlay] = useState<{
    name: string;
    isYou: boolean;
    objectName: string;
  } | null>(null);
  const [timeoutOverlay, setTimeoutOverlay] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [latestReaction, setLatestReaction] = useState<{
    emoji: string;
    timestamp: number;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Camera setup (once on mount) ─────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("[camera]", err);
        setCameraError("Camera access denied. Allow camera to play.");
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Frame capture loop (once on mount) ───────────────────────────────────
  useEffect(() => {
    frameIntervalRef.current = setInterval(() => {
      const round = useGameStore.getState().currentRound;
      if (!round || round.winnerId !== null) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(video, 0, 0, 224, 224);
      const frameData = canvas.toDataURL("image/jpeg", 0.7);

      socketService.submitFrame(frameData);
    }, FRAME_INTERVAL_MS);

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, []);

  // ── Socket event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on("round:start", (data) => {
      const round: Round = {
        id: String(data.roundNumber),
        roundNumber: data.roundNumber,
        objectId: data.objectId,
        displayName: data.displayName,
        winnerId: null,
        winnerName: null,
        timeoutSeconds: data.timeoutSeconds,
      };
      setCurrentRound(round);
      setPlayers(data.players);
      setConfidence(0);
      setWinnerOverlay(null);
      setTimeoutOverlay(null);
    });

    socket.on("frame:result", ({ confidence: c }) => {
      setConfidence(c);
    });

    socket.on("round:won", (data) => {
      setPlayers(data.players);
      setCurrentRound({
        ...useGameStore.getState().currentRound!,
        winnerId: data.winnerId,
        winnerName: data.winnerName,
      });
      setConfidence(0);
      setWinnerOverlay({
        name: data.winnerName,
        isYou: data.winnerId === useGameStore.getState().currentPlayerId,
        objectName: data.displayName,
      });
    });

    socket.on("round:timeout", (data) => {
      setTimeoutOverlay(data.displayName);
      setCurrentRound({
        ...useGameStore.getState().currentRound!,
        winnerId: "timeout",
        winnerName: null,
      });
      setConfidence(0);
    });

    socket.on("game:ended", (data) => {
      setPlayers(data.players);
      navigate("/results");
    });

    return () => {
      socket.off("round:start");
      socket.off("frame:result");
      socket.off("round:won");
      socket.off("round:timeout");
      socket.off("game:ended");
    };
  }, [setCurrentRound, setPlayers, navigate]);

  // ── Local countdown timer (resets per round) ──────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!currentRound || currentRound.winnerId !== null) return;

    setTimeRemaining(currentRound.timeoutSeconds);

    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound?.id]);

  const handleReaction = useCallback((emoji: string) => {
    setLatestReaction({ emoji, timestamp: Date.now() });
  }, []);

  const myScore = players.find((p) => p.id === currentPlayerId)?.score ?? 0;
  const timeout = currentRound?.timeoutSeconds ?? settings.roundTimeout;
  const timerPercent = timeout > 0 ? (timeRemaining / timeout) * 100 : 0;
  const timerRed = timeRemaining <= 10 && timeRemaining > 0;

  // ── Waiting for first round ───────────────────────────────────────────────
  if (!currentRound) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl font-display mb-3">GET READY</div>
          <div className="text-gray-400 animate-pulse">First round starting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden relative">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Emoji reactions */}
      <GlobalEmojiReactions reactions={latestReaction ? [latestReaction] : []} />

      {/* Winner overlay */}
      {winnerOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
          <div className="text-center px-8">
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-5xl font-display text-white mb-2">
              {winnerOverlay.isYou ? "YOU FOUND IT!" : `${winnerOverlay.name} WINS!`}
            </div>
            <div className="text-xl text-gray-300 mb-4">
              {winnerOverlay.objectName}
            </div>
            <div className="text-gray-400 animate-pulse text-sm">
              Next round starting...
            </div>
          </div>
        </div>
      )}

      {/* Timeout overlay */}
      {timeoutOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
          <div className="text-center px-8">
            <div className="text-6xl mb-4">⏰</div>
            <div className="text-4xl font-display text-white mb-2">TIME'S UP</div>
            <div className="text-xl text-gray-300 mb-4">
              Nobody found the {timeoutOverlay}
            </div>
            <div className="text-gray-400 animate-pulse text-sm">
              Next round starting...
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Round</div>
            <div className="text-xl font-display text-orange-400">
              {currentRound.roundNumber}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Time</div>
            <div
              className={`text-xl font-display ${
                timerRed ? "text-red-400 animate-pulse" : "text-white"
              }`}
            >
              {timeRemaining}s
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Your Score</div>
          <div className="text-xl font-display text-white">{myScore}</div>
        </div>
      </div>

      {/* Timer progress bar */}
      <div className="bg-gray-700 h-1 shrink-0">
        <div
          className={`h-full transition-all duration-1000 ${
            timerRed
              ? "bg-red-500"
              : "bg-gradient-to-r from-orange-500 to-orange-300"
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Object banner */}
      <div className="gradient-orange px-4 py-4 shrink-0">
        <div className="text-center">
          <div className="text-xs text-white/60 font-bold tracking-widest uppercase mb-1">
            Find This
          </div>
          <div className="text-3xl md:text-4xl font-display text-white tracking-tight">
            {currentRound.displayName}
          </div>
        </div>
      </div>

      {/* Main content: camera + players */}
      <div className="flex-1 flex gap-2 p-3 overflow-hidden min-h-0">

        {/* Camera — current player */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative flex-1 bg-black overflow-hidden ring-2 ring-orange-500">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center p-4 text-sm">
                {cameraError}
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="font-bold text-white text-sm">
                {players.find((p) => p.id === currentPlayerId)?.name ?? "YOU"}
                <span className="text-orange-400 ml-1 text-xs">(YOU)</span>
              </div>
              <div className="text-orange-300 text-xs font-bold">{myScore} PTS</div>
            </div>
          </div>
        </div>

        {/* All players panel */}
        <div className="flex flex-col gap-2 w-36 shrink-0">
          {[...players]
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => {
              const isMe = player.id === currentPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex-1 flex flex-col items-center justify-center text-center p-2 min-h-0 relative
                    ${isMe ? "ring-2 ring-orange-500 bg-gray-800" : "bg-gray-800/60"}`}
                >
                  {idx === 0 && (
                    <div className="absolute top-1 right-1 text-xs text-yellow-400">👑</div>
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-display mb-1
                      ${isMe ? "bg-orange-500 text-white" : "bg-gray-700 text-white/60"}`}
                  >
                    {player.initials}
                  </div>
                  <div className="text-xs font-bold text-white truncate w-full text-center">
                    {player.name}
                    {isMe && <span className="text-orange-400 ml-1">(you)</span>}
                  </div>
                  <div className="text-xs text-orange-400 font-bold mt-0.5">
                    {player.score} PTS
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm">❄️</span>
          <div className="flex-1 bg-gray-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${confidence * 100}%`,
                background: `linear-gradient(to right, #60a5fa, #f97316, #ef4444)`,
              }}
            />
          </div>
          <span className="text-sm">🔥</span>
          <span className="text-xs text-gray-400 w-8 text-right">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* Standings + reactions */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
            {REACTION_EMOJIS.map((emoji) => (
              <EmojiReactionButton key={emoji} emoji={emoji} onReact={handleReaction} />
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={idx === 0 ? "text-orange-400" : "text-gray-400"}
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
