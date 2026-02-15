import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmojiReactionButton, GlobalEmojiReactions } from '../components/ui/EmojiReaction';
import { useGameStore } from '../store/gameStore';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥'];

export function GameScreen() {
  const navigate = useNavigate();
  const { rounds, currentRound, players, settings, currentPlayerId, setCurrentRound } = useGameStore();
  const [timeRemaining, setTimeRemaining] = useState<number>(settings.timePerRound);
  const [latestReaction, setLatestReaction] = useState<{ emoji: string; timestamp: number } | null>(null);

  const currentRoundData = rounds[currentRound];

  useEffect(() => {
    setTimeRemaining(settings.timePerRound);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimeout(() => {
            if (currentRound < rounds.length - 1) {
              setCurrentRound(currentRound + 1);
            } else {
              navigate('/results');
            }
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRound, rounds.length, settings.timePerRound, setCurrentRound, navigate]);

  if (!currentRoundData) return <div>Loading...</div>;

  const handleReaction = (emoji: string) => {
    setLatestReaction({ emoji, timestamp: Date.now() });
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden relative">
      <GlobalEmojiReactions reactions={latestReaction ? [latestReaction] : []} />

      <div className="bg-white border-b border-gray-300 px-6 py-3 shadow-sm animate-slide-up">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Round</div>
              <div className="text-2xl font-display text-orange-primary">
                {currentRound + 1}/{rounds.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Time</div>
              <div className={`text-2xl font-display ${timeRemaining <= 10 ? 'text-red-600 animate-pulse-slow' : 'text-gray-900'}`}>
                {timeRemaining}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold text-right uppercase tracking-wide">Score</div>
            <div className="text-2xl font-display text-gray-900">
              {players.reduce((sum, p) => sum + p.score, 0)}
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
        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="flex-1 px-6 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-2 gap-4 h-full">
            {players.map((player, idx) => (
              <div
                key={player.id}
                className={`bg-navy-dark relative flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-scale-in ${
                  player.id === currentPlayerId ? 'ring-4 ring-orange-primary shadow-2xl' : 'hover:ring-2 hover:ring-gray-400'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {player.id === currentPlayerId && (
                  <div className="absolute top-4 right-4 bg-orange-primary text-white px-3 py-1 text-sm font-bold shadow-lg z-10 animate-pulse-slow">
                    +50 PTS
                  </div>
                )}

                <div className="flex-1 flex items-center justify-center relative overflow-hidden group">
                  <div className="text-9xl font-display text-white/20 transition-all group-hover:scale-110">
                    {player.initials}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-darker/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className="bg-white p-3 flex items-center justify-between border-t-2 border-gray-200">
                  <div className="font-bold text-gray-900">{player.name}</div>
                  <div className="text-sm text-gray-600 font-semibold">{player.score} PTS</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-300 px-6 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">React</span>
            {REACTION_EMOJIS.map((emoji) => (
              <EmojiReactionButton key={emoji} emoji={emoji} onReact={handleReaction} />
            ))}
          </div>
          <div className="flex items-center gap-6 text-xs font-bold">
            <span className="text-gray-500 uppercase tracking-wide">Standings</span>
            {players
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div key={p.id} className={idx === 0 ? 'text-orange-primary' : 'text-gray-700'}>
                  {idx + 1}. {p.name} <span className="text-gray-500">{p.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
