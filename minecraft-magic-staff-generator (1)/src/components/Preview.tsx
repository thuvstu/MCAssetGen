import React from 'react';
import type { StaffConfig } from '../lib/core';
import { renderStaff } from '../lib/render';
import { cn } from '../utils/cn';

export type BgMode = 'checker' | 'dark' | 'light' | 'arcane' | 'gold';

export const BG_STYLES: Record<BgMode, { label: string; className: string; style?: React.CSSProperties }> = {
  checker: { label: 'Alpha', className: 'checker-bg' },
  dark: { label: 'Obsidian', className: '', style: { background: '#0c0a14' } },
  light: { label: 'Parchment', className: '', style: { background: '#ece5d3' } },
  arcane: { label: 'Arcane', className: '', style: { background: 'radial-gradient(circle at 50% 40%, #2b1a5e 0%, #150f2e 55%, #0a0718 100%)' } },
  gold: { label: 'Royal', className: '', style: { background: 'radial-gradient(circle at 50% 35%, #3a2c12 0%, #1c1508 60%, #0e0b04 100%)' } },
};

export function StaffCanvas({ config, className, style, id }: { config: StaffConfig; className?: string; style?: React.CSSProperties; id?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      try { renderStaff(config, ref.current); } catch (e) { console.error(e); }
    }
  }, [config]);
  return <canvas id={id} ref={ref} className={cn('pixelated', className)} style={style} />;
}

export function MinecraftSlots({ config }: { config: StaffConfig }) {
  return (
    <div className="flex items-end justify-center gap-5">
      {/* inventory slot */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="mc-slot flex h-16 w-16 items-center justify-center">
          <StaffCanvas config={config} className="h-12 w-12" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Inventory</span>
      </div>
      {/* hotbar */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-0.5 rounded-sm border-2 border-[#1a1a1a] bg-[#1a1a1a]/80 p-0.5 shadow-lg">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('flex h-12 w-12 items-center justify-center', i === 1 ? 'bg-[#ffffff22] outline outline-2 outline-white/70' : 'bg-[#2b2b2b]/60')}>
              {i === 1 && <StaffCanvas config={config} className="h-9 w-9" />}
            </div>
          ))}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Hotbar</span>
      </div>
      {/* item frame */}
      <div className="hidden flex-col items-center gap-1.5 sm:flex">
        <div className="flex h-16 w-16 items-center justify-center rounded-[4px] border-[5px] border-[#6b4226] bg-[#c9b896] shadow-lg">
          <StaffCanvas config={config} className="h-11 w-11 drop-shadow" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Item Frame</span>
      </div>
      {/* sizes */}
      <div className="hidden flex-col items-center gap-1.5 md:flex">
        <div className="flex h-16 items-end gap-2 rounded-xl border border-white/8 bg-black/40 px-3 pb-2 pt-2">
          <StaffCanvas config={config} className="h-4 w-4 opacity-90" />
          <StaffCanvas config={config} className="h-6 w-6 opacity-90" />
          <StaffCanvas config={config} className="h-9 w-9" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Scales</span>
      </div>
    </div>
  );
}
