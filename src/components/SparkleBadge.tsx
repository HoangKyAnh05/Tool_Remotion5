import React from 'react';

export type WorkflowMode = 'fast' | 'quality' | 'script_voice' | 'split_long_video';

interface SparkleBadgeProps {
  step: number | string;
  label?: string;
  active?: boolean;
  className?: string;
}

export const SparkleBadge: React.FC<SparkleBadgeProps> = ({
  step,
  label,
  active = true,
  className = ''
}) => {
  if (!active) return null;

  return (
    <span
      className={`inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-[11px] shadow-lg shadow-pink-500/50 border border-amber-200/90 sparkle-badge select-none z-10 ${className}`}
      title={label ? `Bước ${step}: ${label}` : `Bước ${step}`}
    >
      <span className="text-[10px] animate-spin-slow">✨</span>
      <span>{step}</span>
    </span>
  );
};
