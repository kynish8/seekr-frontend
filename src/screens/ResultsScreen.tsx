import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { useGameStore } from '../store/gameStore';
import { RankedPlayer } from '../types/game.types';

export function ResultsScreen() {
  const navigate = useNavigate();
  const { players, resetGame } = useGameStore();

  const rankedPlayers: RankedPlayer[] = useMemo(() => {
    return [...players]
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [players]);

  const podiumPlayers = rankedPlayers.slice(0, 3);
  const [first, second, third] = podiumPlayers;

  const handlePlayAgain = () => {
    resetGame();
    navigate('/');
  };

  const handleShareResults = () => {
    const resultsText = `SEEKR Game Results!\n${rankedPlayers
      .map((p) => `${p.rank}. ${p.name} - ${p.score} PTS`)
      .join('\n')}`;
    navigator.clipboard.writeText(resultsText);
    alert('Results copied to clipboard!');
  };

  return (
    <div className="min-h-screen gradient-orange text-white relative noise-overlay overflow-hidden">
      <header className="py-5 px-8 md:px-12 relative z-10 animate-fade-in">
        <Logo size="md" />
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-8 py-8 relative z-10">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-6xl md:text-7xl font-display mb-2 tracking-tight">GAME OVER</h1>
          <p className="text-lg opacity-80 font-medium">Final Results</p>
        </div>

        <div className="mb-12 animate-scale-in delay-150">
          <div className="flex items-end justify-center gap-6 h-64">
            {second && (
              <div className="flex flex-col items-center" style={{ width: '28%' }}>
                <div className="bg-white text-orange-primary w-16 h-16 flex items-center justify-center mb-3 shadow-lg hover:scale-110 transition-transform">
                  <span className="font-display text-3xl">2</span>
                </div>
                <div className="w-full bg-white/20 backdrop-blur-sm flex flex-col items-center justify-end pb-4 hover:bg-white/30 transition-all shadow-lg" style={{ height: '55%' }}>
                  <div className="text-xl font-bold">{second.name}</div>
                  <div className="text-sm opacity-80">{second.score} PTS</div>
                </div>
              </div>
            )}

            {first && (
              <div className="flex flex-col items-center" style={{ width: '28%' }}>
                <div className="bg-white text-orange-primary w-20 h-20 flex items-center justify-center mb-3 shadow-xl hover:scale-110 transition-transform animate-pulse-slow">
                  <span className="font-display text-4xl">1</span>
                </div>
                <div className="w-full bg-white flex flex-col items-center justify-end pb-4 text-orange-primary hover:shadow-2xl transition-all shadow-xl" style={{ height: '75%' }}>
                  <div className="text-2xl font-display">{first.name}</div>
                  <div className="text-lg font-bold">{first.score} PTS</div>
                </div>
              </div>
            )}

            {third && (
              <div className="flex flex-col items-center" style={{ width: '28%' }}>
                <div className="bg-white text-orange-primary w-16 h-16 flex items-center justify-center mb-3 shadow-lg hover:scale-110 transition-transform">
                  <span className="font-display text-3xl">3</span>
                </div>
                <div className="w-full bg-white/20 backdrop-blur-sm flex flex-col items-center justify-end pb-4 hover:bg-white/30 transition-all shadow-lg" style={{ height: '40%' }}>
                  <div className="text-xl font-bold">{third.name}</div>
                  <div className="text-sm opacity-80">{third.score} PTS</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 animate-slide-up delay-225">
          <div className="text-xs font-bold opacity-60 mb-4 tracking-wider uppercase">Final Stats</div>
          <div className="space-y-3">
            {rankedPlayers.map((player, idx) => (
              <div key={player.id} className="bg-white/10 backdrop-blur-sm p-4 flex items-center justify-between hover:bg-white/20 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg animate-slide-up" style={{ animationDelay: `${225 + idx * 50}ms` }}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center font-display text-lg ${player.rank === 1 ? 'bg-white text-orange-primary shadow-lg' : 'bg-white/80 text-orange-primary'}`}>
                    {player.rank}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{player.name}</div>
                    <div className="text-xs opacity-70 uppercase tracking-wide">
                      {player.rank === 1 ? '🏆 Winner' : `${player.rank === 2 ? '2nd' : player.rank === 3 ? '3rd' : '4th'} Place`}
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-display">{player.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 animate-slide-up delay-300">
          <button onClick={handlePlayAgain} className="flex-1 py-5 bg-white text-orange-primary font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all duration-150 shadow-lg hover:shadow-xl group relative overflow-hidden">
            <span className="relative z-10">PLAY AGAIN</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-100/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
          </button>
          <button onClick={handleShareResults} className="flex-1 py-5 bg-orange-dark text-white font-bold text-lg hover:bg-orange-primary active:scale-95 transition-all duration-150 shadow-lg hover:shadow-xl">
            SHARE RESULTS
          </button>
        </div>
      </main>
    </div>
  );
}
