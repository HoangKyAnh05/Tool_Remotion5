import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface HeaderBadgeProps {
  text?: string;
  variant?: 'purple' | 'gold' | 'cyan';
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({
  text,
  variant = 'purple'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text || text.trim() === '') {
    return null;
  }

  // Entrance spring
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200 }
  });

  const pulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.95, 1.05]);

  const variantStyles = {
    purple: 'bg-purple-950/60 border-purple-500/40 text-purple-200 shadow-purple-500/20',
    gold: 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-amber-500/20',
    cyan: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200 shadow-cyan-500/20'
  }[variant];

  return (
    <div
      className="flex justify-center items-center pointer-events-none"
      style={{ transform: `scale(${scale * pulse})` }}
    >
      <div
        className={`px-5 py-2 rounded-xl border backdrop-blur-md font-black text-sm tracking-wider uppercase shadow-xl flex items-center gap-2 ${variantStyles}`}
      >
        <span>{text}</span>
      </div>
    </div>
  );
};
