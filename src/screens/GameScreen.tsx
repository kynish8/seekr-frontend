import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { socketService } from "../services/socket.service";
import { Round } from "../types/game.types";

const FRAME_INTERVAL_MS = 200;

function getGridStyle(count: number): React.CSSProperties {
  if (count === 1) {
    return { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" };
  }
  if (count <= 4) {
    return {
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: `repeat(${Math.ceil(count / 2)}, 1fr)`,
    };
  }
  return {
    gridTemplateColumns: "1fr 1fr 1fr",
    gridTemplateRows: `repeat(${Math.ceil(count / 3)}, 1fr)`,
  };
}

export function GameScreen() {
  const navigate = useNavigate();
  const {
    currentRound,
    players,
    settings,
    currentPlayerId,
    setCurrentRound,
    setPlayers,
  } = useGameStore();

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | "GO!" | null>(3);
  const [winnerOverlay, setWinnerOverlay] = useState<{
    name: string;
    isYou: boolean;
    objectName: string;
  } | null>(null);
  const [timeoutOverlay, setTimeoutOverlay] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [playerFrames, setPlayerFrames] = useState<Record<string, string>>({});
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // camera setup
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("[camera]", err);
        setCameraError("Camera access denied. Allow camera to play.");
      });
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // If videoRef mounts after the stream is ready, attach it
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  // pre game countdown
  useEffect(() => {
    const steps: Array<number | "GO!"> = [3, 2, 1, "GO!"];
    let i = 0;
    const tick = () => {
      setCountdown(steps[i]);
      i++;
      if (i < steps.length) setTimeout(tick, 650);
      else setTimeout(() => setCountdown(null), 650);
    };
    tick();
  }, []);

  // frame capture loop
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
      socketService.submitFrame(canvas.toDataURL("image/jpeg", 0.7));
    }, FRAME_INTERVAL_MS);
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, []);

  // socket events
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

    socket.on("frame:result", ({ confidence: c }) => setConfidence(c));

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

    socket.on(
      "player:frame",
      ({ playerId, frameData }: { playerId: string; frameData: string }) => {
        setPlayerFrames((prev) => ({ ...prev, [playerId]: frameData }));
      },
    );

    const handleDisconnect = () => setIsDisconnected(true);
    const handleReconnect = () => {
      setIsDisconnected(false);
      setReconnectFailed(false);
    };
    const handleReconnectFailed = () => {
      setIsDisconnected(false);
      setReconnectFailed(true);
    };

    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleReconnect);
    socket.io.on("reconnect_failed", handleReconnectFailed);

    return () => {
      socket.off("round:start");
      socket.off("frame:result");
      socket.off("round:won");
      socket.off("round:timeout");
      socket.off("game:ended");
      socket.off("player:frame");
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleReconnect);
      socket.io.off("reconnect_failed", handleReconnectFailed);
    };
  }, [setCurrentRound, setPlayers, navigate]);

  // round timer
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

  const myScore = players.find((p) => p.id === currentPlayerId)?.score ?? 0;
  const timeout = currentRound?.timeoutSeconds ?? settings.roundTimeout;
  const timerPercent = timeout > 0 ? (timeRemaining / timeout) * 100 : 0;
  const timerRed = timeRemaining <= 10 && timeRemaining > 0;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // countdown screen
  if (!currentRound) {
    return (
      <div className="h-screen bg-white flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        <div className="text-center select-none">
          {countdown !== null ? (
            <div
              key={String(countdown)}
              className="animate-count-pop font-display font-bold leading-none"
              style={{
                fontSize:
                  countdown === "GO!"
                    ? "clamp(3rem,15vw,8rem)"
                    : "clamp(5rem,25vw,14rem)",
                color: countdown === "GO!" ? "#FF6900" : "#111111",
              }}
            >
              {countdown}
            </div>
          ) : (
            <div className="animate-pulse">
              <div className="text-3xl font-display font-bold text-gray-900 mb-2">
                GET READY
              </div>
              <div className="text-gray-400 text-sm tracking-widest uppercase">
                First round starting...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F5F4F1] flex flex-col overflow-hidden relative">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {winnerOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center px-8">
            <div className="text-5xl mb-3">🏆</div>
            <div className="text-4xl font-display font-bold text-gray-900 mb-1">
              {winnerOverlay.isYou
                ? "YOU FOUND IT!"
                : `${winnerOverlay.name} WINS!`}
            </div>
            <div className="text-base text-gray-500 mb-4">
              {winnerOverlay.objectName}
            </div>
            <div className="text-gray-400 animate-pulse text-xs tracking-[0.15em] uppercase">
              Next round starting...
            </div>
          </div>
        </div>
      )}

      {timeoutOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center px-8">
            <div className="text-5xl mb-3">⏰</div>
            <div className="text-4xl font-display font-bold text-gray-900 mb-1">
              TIME'S UP
            </div>
            <div className="text-base text-gray-500 mb-4">
              Nobody found the {timeoutOverlay}
            </div>
            <div className="text-gray-400 animate-pulse text-xs tracking-[0.15em] uppercase">
              Next round starting...
            </div>
          </div>
        </div>
      )}

      {isDisconnected && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-fade-in">
          <div className="text-center px-8">
            <div className="text-4xl mb-3">📡</div>
            <div className="text-2xl font-display font-bold text-gray-900 mb-1">
              CONNECTION LOST
            </div>
            <div className="text-gray-400 text-sm animate-pulse">
              Reconnecting...
            </div>
          </div>
        </div>
      )}

      {reconnectFailed && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-fade-in">
          <div className="text-center px-8">
            <div className="text-4xl mb-3">❌</div>
            <div className="text-2xl font-display font-bold text-gray-900 mb-2">
              DISCONNECTED
            </div>
            <div className="text-gray-500 text-sm mb-5">
              Could not reconnect to the server.
            </div>
            <button
              onClick={() => {
                socketService.disconnect();
                navigate("/");
              }}
              className="px-6 py-2.5 bg-gray-900 text-white font-bold text-xs tracking-widest uppercase hover:bg-gray-700 active:scale-95 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.12em] uppercase">
              Round
            </span>
            <span className="text-sm font-bold text-[#FF6900]">
              {currentRound.roundNumber}
            </span>
          </div>
          <div className="w-px h-3.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.12em] uppercase">
              Time
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                timerRed ? "text-red-500 animate-pulse" : "text-gray-900"
              }`}
            >
              {timeRemaining}s
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.12em] uppercase">
            Score
          </span>
          <span className="text-sm font-bold text-[#FF6900]">{myScore}</span>
        </div>
      </div>

      <div className="h-[2px] bg-gray-100 shrink-0">
        <div
          className="h-full transition-all duration-1000"
          style={{
            width: `${timerPercent}%`,
            background: timerRed ? "#ef4444" : "#FF6900",
          }}
        />
      </div>

      <div className="bg-[#FF6900] px-4 py-3 shrink-0 text-center">
        <div className="text-[9px] font-bold text-white/60 tracking-[0.25em] uppercase mb-0.5">
          Find This
        </div>
        <div className="text-xl md:text-2xl font-display font-bold text-white tracking-wide">
          {currentRound.displayName}
        </div>
      </div>

      <div
        className="flex-1 grid gap-2 p-3 min-h-0 overflow-hidden"
        style={getGridStyle(sortedPlayers.length)}
      >
        {sortedPlayers.map((player) => {
          const isMe = player.id === currentPlayerId;
          const isWinner = currentRound.winnerId === player.id;
          const frame = playerFrames[player.id];
          const isLeader =
            sortedPlayers[0].id === player.id && player.score > 0;

          return (
            <div
              key={player.id}
              className="relative flex flex-col min-h-0 overflow-hidden"
              style={{
                outline: isWinner
                  ? "3px solid #FF6900"
                  : "2px solid transparent",
                outlineOffset: "-1px",
                boxShadow: isWinner
                  ? "0 0 0 3px #FF6900, 0 4px 24px rgba(255,105,0,0.25)"
                  : "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <div className="flex-1 bg-[#16192A] relative overflow-hidden min-h-0">
                {isMe ? (
                  cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs text-center px-4">
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
                  )
                ) : frame ? (
                  <img
                    src={frame}
                    className="w-full h-full object-cover scale-x-[-1]"
                    alt={player.name}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white/15 select-none">
                      {player.initials}
                    </span>
                  </div>
                )}

                {/* Winner badge */}
                {isWinner && (
                  <div className="absolute top-2 right-2 bg-[#FF6900] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider">
                    +1 PT
                  </div>
                )}

                {/* Leading crown */}
                {isLeader && !isWinner && (
                  <div className="absolute top-1.5 right-2 text-sm leading-none">
                    👑
                  </div>
                )}
              </div>

              {/* Name / score bar */}
              <div className="bg-white border-t border-gray-100 px-3 py-1.5 flex items-center justify-between shrink-0">
                <span className="font-bold text-gray-900 text-sm truncate leading-none">
                  {player.name}
                  {isMe && (
                    <span className="text-gray-400 font-normal text-[11px] ml-1.5">
                      (you)
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold text-[#FF6900] shrink-0 ml-2 leading-none tabular-nums">
                  {player.score} PTS
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Confidence bar + standings ───────────────────────────────────── */}
      <div className="bg-white border-t border-gray-200 px-5 py-2.5 shrink-0">
        {/* Detection meter */}
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.12em] uppercase w-14 shrink-0">
            Detect
          </span>
          <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${confidence * 100}%`,
                background: "linear-gradient(to right, #93c5fd, #FF6900)",
              }}
            />
          </div>
          <span className="text-[11px] font-bold text-gray-500 tabular-nums w-8 text-right shrink-0">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* Live standings */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.12em] uppercase w-14 shrink-0">
            Rank
          </span>
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
            {sortedPlayers.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] text-gray-400">{idx + 1}.</span>
                <span
                  className={`text-[11px] font-bold ${
                    p.id === currentPlayerId
                      ? "text-[#FF6900]"
                      : "text-gray-700"
                  }`}
                >
                  {p.name}
                </span>
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {p.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
