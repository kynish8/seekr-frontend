import { useEffect, useState } from 'react';

interface EmojiParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface EmojiReactionProps {
  emoji: string;
  onReact: (emoji: string) => void;
}

let particleId = 0;

export function EmojiReactionButton({ emoji, onReact }: EmojiReactionProps) {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);

  const handleClick = () => {
    onReact(emoji);

    const newParticles: EmojiParticle[] = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        id: particleId++,
        emoji,
        x: Math.random() * 60 - 30,
        y: 0,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="w-10 h-10 bg-orange-primary hover:bg-orange-dark transition-all hover:scale-110 active:scale-95 flex items-center justify-center text-xl"
      >
        {emoji}
      </button>

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bottom-0 left-1/2 pointer-events-none text-2xl"
          style={{
            transform: `translate(-50%, 0) translateX(${particle.x}px)`,
            animation: 'floatUp 1s ease-out forwards',
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
}

interface GlobalEmojiReaction {
  id: number;
  emoji: string;
  x: number;
}

export function GlobalEmojiReactions({ reactions }: { reactions: { emoji: string; timestamp: number }[] }) {
  const [displayReactions, setDisplayReactions] = useState<GlobalEmojiReaction[]>([]);

  useEffect(() => {
    if (reactions.length === 0) return;

    const latestReaction = reactions[reactions.length - 1];
    const newReaction: GlobalEmojiReaction = {
      id: Date.now(),
      emoji: latestReaction.emoji,
      x: Math.random() * 80 + 10,
    };

    setDisplayReactions((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setDisplayReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {displayReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-0 text-6xl"
          style={{
            left: `${reaction.x}%`,
            animation: 'floatGlobal 3s ease-out forwards',
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
}
