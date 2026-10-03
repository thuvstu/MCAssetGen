import React from "react";
import { cn } from "../utils/cn";

// ============================================================
//  アイコン (すべてインライン SVG / 24x24)
// ============================================================
const P: Record<string, string[]> = {
  sun: ["M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"],
  contrast: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M12 3v18a9 9 0 0 0 0-18Z"],
  droplet: ["M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z"],
  hue: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M5.6 18.4 18.4 5.6"],
  gamma: ["M3 19c5 0 6-14 11-14 3 0 4 3 7 3"],
  thermo: ["M14 14V5a2 2 0 1 0-4 0v9a4 4 0 1 0 4 0Z"],
  levels: ["M4 7h16M4 12h16M4 17h16", "M9 5v4M15 10v4M7 15v4"],
  gray: ["M4 5h16v14H4z", "M4 5h8v14H4z"],
  photo: ["M3 6h18v13H3z", "M3 15l5-4 4 3 3-2 6 5", "M8.5 9.5h.01"],
  invert: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M12 3a9 9 0 0 1 0 18Z", "M12 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"],
  poster: ["M4 18h4v-3h4v-3h4V9h4"],
  threshold: ["M4 5h16v14H4z", "M12 5h8v14h-8z"],
  brush: ["M4 20s2-1 3-3 1-4 3-6l4 4c-2 2-4 2-6 3s-4 2-4 2Z", "M14 6l4 4 3-3-4-4-3 3Z"],
  duotone: ["M9 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z", "M15 19a5 5 0 1 0 0-10"],
  gradient: ["M4 5h16v14H4z", "M4 5h4v14H4z", "M12 5h2v14h-2z"],
  swap: ["M7 4 3 8l4 4", "M3 8h14", "M17 20l4-4-4-4", "M21 16H7"],
  grid: ["M4 4h16v16H4z", "M9.3 4v16M14.6 4v16M4 9.3h16M4 14.6h16"],
  dither: ["M5 5h2v2H5zM9 5h2v2H9zM13 5h2v2h-2zM17 5h2v2h-2z", "M7 9h2v2H7zM11 9h2v2h-2zM15 9h2v2h-2z", "M5 13h2v2H5zM9 13h2v2H9zM13 13h2v2h-2zM17 13h2v2h-2z", "M7 17h2v2H7zM11 17h2v2h-2zM15 17h2v2h-2z"],
  wave: ["M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"],
  palette: ["M12 3a9 9 0 1 0 0 18c1.6 0 2-1.2 1.2-2-.9-1.2 0-2.5 1.4-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5Z", "M7.5 10.5h.01M12 7.5h.01M16 10h.01"],
  outline: ["M4 4h16v16H4z", "M7 7h10v10H7z"],
  cube: ["M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z", "M3 7.5 12 12l9-4.5", "M12 12v9"],
  shadow: ["M9 3h12v12", "M3 9h12v12H3z"],
  inset: ["M4 4h16v16H4z", "M8 8h8v8H8z"],
  glow: ["M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6 7.7 7.7M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"],
  noise: ["M5 5h2v2H5zM11 6h2v2h-2zM17 5h2v2h-2zM7 10h2v2H7zM13 11h2v2h-2zM18 12h2v2h-2zM5 16h2v2H5zM10 17h2v2h-2zM16 17h2v2h-2z"],
  blur: ["M6 14a6 6 0 0 1 12 0 4 4 0 0 1-3 6H9a5 5 0 0 1-3-6Z", "M9 6l1.5-2M14 6l1.5-2"],
  sharp: ["M12 4 4 20h16L12 4Z"],
  edge: ["M4 16c3-8 5 4 8-4s4 2 8-6"],
  scan: ["M3 6h18M3 10h18M3 14h18M3 18h18"],
  halftone: ["M6 6h2.5v2.5H6zM12 7h2v2h-2zM17.5 8h1.5v1.5h-1.5zM6 12h2v2H6zM12 12.5h1.5V14h-1.5zM6 17.5h1.5V19H6z"],
  hatch: ["M3 15 15 3M3 21 21 3M9 21 21 9M15 21l6-6"],
  mirror: ["M12 3v18", "M9 7 4 12l5 5V7Z", "M15 7l5 5-5 5V7Z"],
  frame: ["M3 3h18v18H3z", "M6.5 6.5h11v11h-11z"],
  corner: ["M4 10V4h6", "M20 14v6h-6", "M4 4l7 7", "M20 20l-7-7"],
  trim: ["M3 3h4M9 3h4M15 3h4M3 21h4M9 21h4M15 21h4M3 3v4M3 9v4M3 15v4M21 3v4M21 9v4M21 15v4"],
  gem: ["M12 3 4 9l8 12 8-12-8-6Z", "M4 9h16", "M12 3 8 9l4 12 4-12-4-6Z"],
  spark: ["M12 3v18M3 12h18", "M12 7l2 3 3 2-3 2-2 3-2-3-3-2 3-2 2-3Z"],
  fire: ["M12 22c4 0 6-2.6 6-6 0-4-4-5-4-9 0 0-3 1.5-3 5 0 1.5-1 2-1.7 1.2C8.6 12.4 8 11 8 10c-1.3 1.6-2 3.6-2 6 0 3.4 2 6 6 6Z"],
  snow: ["M12 2v20M4 6l16 12M20 6 4 18", "M12 6l-2-2M12 6l2-2M12 18l-2 2M12 18l2 2M7 9l-3 .5M17 9l3 .5M7 15l-3-.5M17 15l3-.5"],
  rain: ["M6 4a4 4 0 0 1 8 0 3.5 3.5 0 0 1 0 7H6a3.5 3.5 0 0 1 0-7Z", "M8 15l-1 4M12 15l-1 4M16 15l-1 4"],
  star: ["M12 3.5 14.3 9l5.7.5-4.3 3.8 1.3 5.7L12 16l-5 3 1.3-5.7L4 9.5 9.7 9 12 3.5Z"],
  rune: ["M6 4h12M6 20h12M12 4v16", "M6 9l6 3-6 3", "M18 9l-6 3 6 3"],
  sigil: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z", "M12 3v18M3 12h18"],
  rivet: ["M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01"],
  circuit: ["M4 8h6l2 2h8", "M4 16h8l2-2h6", "M10 8v-3M14 16v3", "M10 4h.01M14 20h.01"],
  hex: ["M9 3h6l4 6-4 6H9l-4-6 4-6Z", "M12 9v6M9.5 10.5h5"],
  crack: ["M4 12h4l2-5 3 10 2-5h5"],
  moss: ["M12 21c-5 0-8-3-8-7 3 0 4 1 5 3 0-5 3-9 8-10-1 3-1 5 0 7 2-1 4-1 6 0-1 5-5 7-11 7Z"],
  grime: ["M5 12a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z", "M13 8a4 4 0 1 1 7 3 4 4 0 0 1-7-3Z", "M9 18a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z"],
  scratch: ["M5 19 13 5M9 19l6-10M14 18l4-7"],
  rust: ["M4 14c2-6 5 2 8-3s4 1 8-2v9c-3 2-6 0-8 2s-6 0-8-6Z", "M9 11h.01M15 12h.01"],
  frost: ["M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11", "M12 6.5 9.5 4M12 6.5 14.5 4M12 17.5 9.5 20M12 17.5l2.5 2.5"],
  lava: ["M4 18c2-1 3-4 5-4s2 3 4 3 2-6 4-6 2 4 3 5v4H4v-2Z", "M8 9c1-2 0-4 2-5-1 2 1 3 0 5"],
  vine: ["M12 21V9", "M12 12c-4 0-6-2-6-5 3 0 6 1 6 5Z", "M12 16c4 0 6-2 6-5-3 0-6 1-6 5Z"],
  erode: ["M4 4h16v16H4z", "M4 9h3v3H4zM17 14h3v3h-3zM9 17h3v3H9z"],
  metal: ["M3 7h18M3 11h18M3 15h18M3 19h18", "M8 4v3M15 10v5"],
  wet: ["M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z", "M9.5 14a2.5 2.5 0 0 0 5 0"],
  speckle: ["M6 6h1.5v1.5H6zM12 5h1.5v1.5H12zM17 8h1.5v1.5H17zM8 11h1.5v1.5H8zM14 12h1.5v1.5H14zM5 16h1.5v1.5H5zM11 17h1.5v1.5H11zM17 16h1.5v1.5H17z"],
  bloom: ["M12 2v4M12 18v4M2 12h4M18 12h4", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z", "M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"],
  vignette: ["M3 3h18v18H3z", "M8 8h8v8H8z", "M3 3l5 5M21 3l-5 5M3 21l5-5M21 21l-5-5"],
  chroma: ["M9 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z", "M15 6a6 6 0 1 1 0 12", "M12 3v18"],
  enchant: ["M5 20 15 10", "M13 4l1.5 3L18 8.5 14.5 10 13 13l-1.5-3L8 8.5 11.5 7 13 4Z", "M19 15l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8.8-1.7Z"],
  rarity: ["M7 4h10v3a5 5 0 0 1-3.5 4.8V15H16v4H8v-4h2.5v-3.2A5 5 0 0 1 7 7V4Z"],
  holo: ["M3 15c3-6 6 6 9 0s6 6 9 0", "M3 19c3-6 6 6 9 0s6 6 9 0", "M3 11c3-6 6 6 9 0s6 6 9 0"],
  iris: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"],
  glitch: ["M3 7h11M17 7h4M3 12h5M11 12h10M3 17h14M19 17h2", "M14 4v6M8 14v6"],
  crt: ["M3 4h18v13H3z", "M8 20h8M12 17v3", "M6 8h6M6 11h4"],
  warp: ["M4 8c4-4 12 4 16 0M4 14c4-4 12 4 16 0M4 20c4-4 12 4 16 0"],
  swirl: ["M12 12c0-2 2-3 3.5-2S18 14 16 16s-6 1-8-2-1-8 4-9 9 2 10 6"],
  sort: ["M4 6h6M4 10h10M4 14h14M4 18h16"],
  sweep: ["M3 21 21 3", "M7 21 21 7M11 21 21 11", "M4 4h4v4"],
  trail: ["M3 12h6M11 12h4M17 12h4", "M5 8h4M13 8h4M7 16h4M15 16h4"],
  kaleido: ["M12 3 4 19h16L12 3Z", "M12 3v16M4 19l8-6 8 6"],
  foil: ["M4 8h16v9H4z", "M4 8l3-4h10l3 4", "M9 8v9M15 8v9"],
  soul: ["M8 21c-2-3-2-6 0-9s2-6 1-9c4 2 6 5 6 9s3 4 3 7c0 2-2 3-5 3s-4-1-5-1Z", "M10 15h.01M14 16h.01"],
  box: ["M3 7l9-4 9 4-9 4-9-4Z", "M3 7v10l9 4 9-4V7", "M12 11v10"],
  upload: ["M12 16V4", "M7 9l5-5 5 5", "M4 17v3h16v-3"],
  download: ["M12 4v12", "M7 11l5 5 5-5", "M4 18v2h16v-2"],
  undo: ["M4 9h11a5 5 0 0 1 0 10H9", "M8 5 4 9l4 4"],
  redo: ["M20 9H9a5 5 0 0 0 0 10h6", "M16 5l4 4-4 4"],
  plus: ["M12 5v14M5 12h14"],
  minus: ["M5 12h14"],
  trash: ["M4 7h16", "M9 7V4h6v3", "M6 7l1 13h10l1-13", "M10 11v6M14 11v6"],
  eye: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"],
  eyeOff: ["M4 4l16 16", "M9.5 5.6A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.3 4", "M6.3 7.9A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4-.8", "M9.9 10a3 3 0 0 0 4.2 4.2"],
  play: ["M7 4l13 8-13 8V4Z"],
  pause: ["M8 4v16M16 4v16"],
  dice: ["M4 4h16v16H4z", "M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"],
  layers: ["M12 3 3 8l9 5 9-5-9-5Z", "M3 13l9 5 9-5", "M3 17l9 5 9-5"],
  search: ["M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z", "M15.5 15.5 21 21"],
  arrowUp: ["M12 19V5", "M6 11l6-6 6 6"],
  arrowDown: ["M12 5v14", "M6 13l6 6 6-6"],
  copy: ["M8 8h12v12H8z", "M4 16V4h12"],
  compare: ["M12 3v18", "M4 7l4-4v14l-4-4H2V7h2Z", "M20 7l-4-4v14l4-4h2V7h-2Z"],
  wand: ["M4 20 14 10", "M17 3l1 2.5L20.5 6.5 18 7.5 17 10l-1-2.5L13.5 6.5 16 5.5 17 3Z", "M8 4l.7 1.8L10.5 6.5 8.7 7.2 8 9l-.7-1.8L5.5 6.5l1.8-.7L8 4Z"],
  settings: ["M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z", "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.1V4a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.2Z"],
};

const FILLED = new Set(["contrast", "gray", "threshold", "poster"]);

export function Icon({ name, className = "h-4 w-4", sw = 1.6 }: { name: string; className?: string; sw?: number }) {
  const paths = P[name] || P.box;
  const fillIdx = name === "contrast" || name === "gray" || name === "threshold" ? 1 : -1;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={i === fillIdx ? "currentColor" : FILLED.has(name) && i === 1 ? "currentColor" : "none"} fillOpacity={i === fillIdx ? 0.55 : 1} />
      ))}
    </svg>
  );
}

// ============================================================
//  操作パーツ
// ============================================================
export function Btn({
  children, onClick, active, accent = "#f5a63c", size = "md", className, title, disabled,
}: {
  children: React.ReactNode; onClick?: () => void; active?: boolean; accent?: string;
  size?: "sm" | "md"; className?: string; title?: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-[3px] border transition-all duration-150 select-none",
        size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
        active
          ? "border-transparent text-[#0c0f15]"
          : "border-[var(--line2)] bg-[#1b212b] text-[var(--ink2)] hover:border-[var(--ink3)] hover:bg-[#232b37] hover:text-[var(--ink)]",
        disabled && "pointer-events-none opacity-35",
        className,
      )}
      style={active ? { background: accent, boxShadow: `0 0 18px -6px ${accent}` } : undefined}
    >
      {children}
    </button>
  );
}

export function Slider({
  label, value, min, max, step, onChange, accent = "#f5a63c", unit, format,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; accent?: string; unit?: string; format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="group block select-none">
      <div className="mb-0.5 flex items-baseline justify-between gap-2">
        <span className="text-[10.5px] tracking-wide text-[var(--ink3)] group-hover:text-[var(--ink2)] transition-colors">{label}</span>
        <span className="tabular font-bit text-[10px] text-[var(--ink2)]">
          {format ? format(value) : Number.isInteger(step) ? value : value.toFixed(2)}
          {unit ? <span className="ml-0.5 text-[var(--ink3)]">{unit}</span> : null}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        style={{ ["--fill" as any]: `${pct}%`, ["--acc" as any]: accent }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

export function Toggle({ label, value, onChange, accent = "#37d6c4" }: { label: string; value: boolean; onChange: (v: boolean) => void; accent?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-2 rounded-[3px] py-1 text-left transition-colors hover:bg-white/5"
    >
      <span className="text-[10.5px] tracking-wide text-[var(--ink3)]">{label}</span>
      <span
        className="relative h-[15px] w-[30px] shrink-0 rounded-[3px] border transition-colors"
        style={{ borderColor: value ? accent : "var(--line2)", background: value ? `${accent}33` : "#151a23" }}
      >
        <span
          className="absolute top-[1.5px] h-[10px] w-[12px] rounded-[2px] transition-all duration-200"
          style={{ left: value ? 15 : 2, background: value ? accent : "#4a5566", boxShadow: value ? `0 0 8px -1px ${accent}` : "none" }}
        />
      </span>
    </button>
  );
}

export function Select({ label, value, options, onChange, accent = "#59a7ff" }: {
  label?: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void; accent?: string;
}) {
  return (
    <label className="block">
      {label && <div className="mb-0.5 text-[10.5px] tracking-wide text-[var(--ink3)]">{label}</div>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-[3px] border border-[var(--line2)] bg-[#151a23] px-2 py-1.5 pr-6 text-[11px] text-[var(--ink)] outline-none transition-colors hover:border-[var(--ink3)] focus:border-[var(--acc,#59a7ff)]"
          style={{ ["--acc" as any]: accent }}
        >
          {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--ink3)]" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M6 9l6 6 6-6" /></svg>
      </div>
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-[10.5px] tracking-wide text-[var(--ink3)]">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="font-bit text-[9.5px] uppercase text-[var(--ink3)]">{value}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-5 w-7 rounded-[3px]" />
      </span>
    </label>
  );
}

export function Chip({ children, accent = "#f5a63c", active, onClick, title }: { children: React.ReactNode; accent?: string; active?: boolean; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button" title={title} onClick={onClick}
      className={cn(
        "rounded-[3px] border px-2 py-[3px] text-[10.5px] tracking-wide transition-all",
        active ? "text-[#0c0f15]" : "border-[var(--line)] bg-[#171d27] text-[var(--ink2)] hover:text-[var(--ink)] hover:border-[var(--line2)]",
      )}
      style={active ? { background: accent, borderColor: accent } : undefined}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-3">
      <h3 className="font-bit text-[10px] uppercase tracking-[0.18em] text-[var(--ink3)]">{children}</h3>
      {right}
    </div>
  );
}
