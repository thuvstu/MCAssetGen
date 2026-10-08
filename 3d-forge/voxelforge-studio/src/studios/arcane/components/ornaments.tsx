import React from 'react';
import { cn } from '../utils/cn';

/* Elegant double-line corner flourish with a small diamond accent. */
function Corner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" className={cn('h-9 w-9', className)} aria-hidden>
        <defs>
          <linearGradient id="cornerGold" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f4e3b0" />
            <stop offset="1" stopColor="#a67c2a" />
          </linearGradient>
        </defs>
        <path d="M2 34 V10 a8 8 0 0 1 8 -8 H34" stroke="url(#cornerGold)" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M7 28 V14 a7 7 0 0 1 7 -7 H28" stroke="url(#cornerGold)" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
        <rect x="2" y="2" width="5" height="5" transform="rotate(45 4.5 4.5)" fill="url(#cornerGold)" />
      </svg>
  );
}

/** Four elegant corner flourishes framing a container (absolute positioned). */
export function OrnamentFrame({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-2 z-10', className)} aria-hidden>
      <Corner className="absolute left-0 top-0" />
      <Corner className="absolute right-0 top-0 rotate-90" />
      <Corner className="absolute bottom-0 right-0 rotate-180" />
      <Corner className="absolute bottom-0 left-0 -rotate-90" />
    </div>
  );
}

/** Elegant thin divider with a centered diamond. */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)} aria-hidden>
      <span className="hairline h-px flex-1 opacity-60" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gradient-to-br from-amber-200 to-amber-600/70" />
      <span className="hairline h-px flex-1 opacity-60" />
    </div>
  );
}

/** Refined section heading used across panels. */
export function PanelTitle({ title, icon, right }: { title: string; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <span className="truncate font-display text-[12.5px] font-semibold tracking-[0.18em] text-stone-100/90">{title}</span>
      </div>
      {right}
    </div>
  );
}
