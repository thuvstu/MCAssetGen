import type { CSSProperties } from "react";

const paths = {
  sword: "m4 20 5-5m-3-3 6 6M8 14 18 4l3-1-1 3-10 10M3 19l2 2",
  shuffle: "M3 5h2c5 0 9 14 14 14h2m-4-4 4 4-4 4M3 19h2c2 0 4-3 6-7m3-5c2-2 3-2 5-2h2m-4-4 4 4-4 4",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3",
  unlock: "M7 10V7a5 5 0 0 1 9-3M5 10h14v11H5zM12 14v3",
  download: "M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6",
  undo: "M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12h-3",
  redo: "m16 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12h3",
  chevron: "m8 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  grid: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
  play: "m7 3 14 9-14 9V3Z",
  pause: "M8 4v16M16 4v16",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z",
  grip: "m7 3 10 2-3 15-10-2L7 3Zm-1 4 10 2M5 11l10 2m-11 2 10 2",
  spark: "m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z",
  palette: "M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4 2 2 0 0 1 0-4h3a4 4 0 0 0 4-4c0-4-5-6-9-6ZM7 9h.01M10 6h.01M15 6h.01",
  layers: "m12 2 10 5-10 5L2 7l10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5",
  crystal: "m7 3 10 0 5 7-10 12L2 10l5-7Zm-5 7h20M7 3l5 19 5-19",
  finish: "m5 18 12-12 3 3L8 21H3v-5L15 4l3 3M11 8l5 5",
  warning: "m12 3 10 18H2L12 3Zm0 6v5m0 3v.1",
  reset: "M4 9a8 8 0 1 1 0 6M4 3v6h6",
  close: "m6 6 12 12M6 18 18 6",
  save: "M4 3h13l4 4v14H3V3h1Zm3 0v7h9V3M7 21v-7h10v7",
  copy: "M9 9h12v12H9zM15 9V3H3v12h6",
  compare: "M3 4h7v16H3zM14 4h7v16h-7z",
  info: "M12 11v6m0-10v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  trident: "M6 3v7a6 6 0 0 0 12 0V3m-6 18V3",
  axe: "M14 4a6 6 0 0 1 6 6v3a6 6 0 0 1-6 6M4 20l10-10M9 5l3 3",
  pixel: "M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm12 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z",
} as const;
export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}><path d={paths[name]} /></svg>;
}