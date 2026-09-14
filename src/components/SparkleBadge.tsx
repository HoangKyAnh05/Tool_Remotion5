import React from 'react';

export type WorkflowMode = 'fast' | 'quality' | 'tiktok_capcut' | 'script_voice' | 'split_long_video';

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
      className={`inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] tracking-tight shadow-sm select-none border border-amber-600/30 ${className}`}
      title={label ? `Bước ${step}: ${label}` : `Bước ${step}`}
    >
      <span>Bước {step}</span>
    </span>
  );
};
