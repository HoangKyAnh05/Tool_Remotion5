import React from 'react';

export type WorkflowMode = 'fast' | 'quality' | 'tiktok_capcut' | 'script_voice' | 'split_long_video';

interface SparkleBadgeProps {
  step: number | string;
  label?: string;
  active?: boolean;
  className?: string;
}

export const SparkleBadge: React.FC<SparkleBadgeProps> = () => {
  return null;
};
