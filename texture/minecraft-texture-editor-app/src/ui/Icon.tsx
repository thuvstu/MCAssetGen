import type { ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  pixel: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /><path d="M10 7h4M7 10v4m10-4v4m-3 3h-4" /></>,
  upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" /></>,
  download: <><path d="M12 4v12m0 0 5-5m-5 5-5-5" /><path d="M5 19h14" /></>,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h9a6 6 0 0 1 0 12h-2" /></>,
  redo: <><path d="m15 14 5-5-5-5" /><path d="M20 9h-9a6 6 0 0 0 0 12h2" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" /><path d="M3 3v5h5" /></>,
  eye: <><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  minus: <path d="M5 12h14" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  play: <path d="M7 4v16l13-8z" />,
  pause: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
  sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /><path d="m5 16 .6 1.4L7 18l-1.4.6L5 20l-.6-1.4L3 18l1.4-.6L5 16Z" /></>,
  rune: <><path d="M5 5h5M5 5v5m14-5h-5m5 0v5M5 19h5m-5 0v-5m14 5h-5m5 0v-5" /><path d="m9 15 6-6m-6 0 6 6" /></>,
  outline: <><path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3" /><path d="M8 8h8v8H8z" /></>,
  flare: <><path d="M12 2v20M2 12h20" /><path d="m5 5 14 14M19 5 5 19" /><circle cx="12" cy="12" r="3" /></>,
  sliders: <><path d="M4 7h9m4 0h3M4 17h3m4 0h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  book: <><path d="M5 5h9a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H5z" /><path d="M19 5v14" /><path d="m9 9 3 3m0-3-3 3m4 0 3-3m-3 3 3 3" /></>,
  shadow: <><path d="M6 6h9v9H6z" /><path d="M9 18h9V9" /><path d="M9 18 18 9" /></>,
  glow: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" /></>,
  shine: <><path d="M4 14s3-8 8-8 8 8 8 8-3-2-8-2-8 2-8 2Z" /><path d="m9 10 3-3 3 3" /><circle cx="12" cy="15" r="1.5" /></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></>,
  vignette: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 12c3-3 6-5 9-5s6 2 9 5" /><path d="M3 12c3 3 6 4 9 4s6-1 9-4" /></>,
  snow: <><path d="M12 2v20M4.5 7.5l15 9m0-9-15 9" /><path d="M12 5 9.8 2.8M12 5l2.2-2.2M12 19l-2.2 2.2M12 19l2.2 2.2" /></>,
  flame: <><path d="M12 21c3.3 0 5.5-2.3 5.5-5 0-3.1-3.3-5.2-5.5-9-2.2 3.8-5.5 5.9-5.5 9 0 2.7 2.2 5 5.5 5Z" /></>,
  lava: <><path d="M5 19c2-2 3-4 3-7 0-4 3-6 7-8 0 3 3 4 3 8 0 3.7-1.8 7-6 7H8Z" /></>,
  leaf: <><path d="M19 5c-7 0-12 4-12 10 0 2 2 4 4 4 6 0 9-7 8-14Z" /><path d="M8 19c4-3 7-6 9-11" /></>,
  crumb: <><circle cx="7" cy="7" r="1.5" /><circle cx="17" cy="9" r="1" /><circle cx="11" cy="16" r="1.5" /><circle cx="18" cy="17" r="1" /></>,
  circuit: <><path d="M6 3v6h4v5H5M13 3v4h5v5h4M9 21v-4h6v4" /><circle cx="10" cy="14" r="1.5" /><circle cx="18" cy="12" r="1.5" /></>,
  flower: <><circle cx="12" cy="8" r="2.5" /><path d="M12 3.5V2M5 8H3m18 0h-2M7 3 5.5 1.5M17 3l1.5-1.5" /><path d="M12 13c-2 2-3 5-3 8h6c0-3-1-6-3-8Z" /></>,
  scan: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 8h16M4 12h16M4 16h16" /></>,
  wave: <><path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></>,
  crack: <><path d="M5 4 9 8l-3 3 5 5-2 4" /><path d="M14 3 9 8m0 0 5 2-2 4" /><path d="M13 14l6 4-6 3" /></>,
  // model systems
  tier: <><path d="m12 3 2.4 5 5.6.5-4.3 3.7 1.4 5.5L12 20l-5.1 3.2 1.4-5.5L4 8.5 9.6 8z" /></>,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  sword: <><path d="M14.5 3.5 21 3l-.5 6.5-9 9L8 20l-1.5-1.5 2-2z" /><path d="m5 15 4 4M3 21l3-1 1-3-3 1z" /></>,
  blade: <><path d="M18 3 6 15l-1 4 4-1L21 6z" /><path d="m6 15 3 3" /></>,
  hammer: <><rect x="5" y="4" width="10" height="6" rx="1" /><path d="M10 10v4l-2 6h2l3-6" /></>,
  twin: <><path d="M8 3 4 15l3-1 4-11z" /><path d="M16 3 12 15l3-1 4-11z" /><path d="M6 16 4 21M18 16l2 5" /></>,
  bow: <><path d="M6 3c8 3 8 15 0 18" /><path d="M6 3 18 12 6 21" /></>,
  ghost: <><path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-1.6L14 20l-2-1.6L10 20l-2.7-1.6z" /><circle cx="9.5" cy="10" r="1" /><circle cx="14.5" cy="10" r="1" /></>,
  star: <path d="m12 3 2.4 5 5.6.5-4.3 3.7 1.4 5.5L12 20l-5.1 3.2 1.4-5.5L4 8.5 9.6 8z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
  toxin: <><circle cx="12" cy="13" r="6" /><path d="M12 7V3M9 4l1 3m4-3-1 3" /><circle cx="10" cy="12" r="1" /><circle cx="14" cy="14" r="1" /></>,
  void: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
  circle: <circle cx="12" cy="12" r="7" />,
  shield: <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>,
  skull: <><path d="M6 10a6 6 0 0 1 12 0v4l-1 2h-2v2h-6v-2H7l-1-2z" /><circle cx="9.5" cy="11" r="1.3" /><circle cx="14.5" cy="11" r="1.3" /></>,
  burst: <><path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l3.5 3.5M15.5 15.5 19 19M19 5l-3.5 3.5M8.5 15.5 5 19" /><circle cx="12" cy="12" r="2" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  wand: <><path d="M4 20 14 10" /><path d="M14 4v3m0 0 2-1m-2 1-2-1m2 4V7m4 3h3m-3 0-1 2m1-2-1-2" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.5 1-2.5 2.5-2.5H18a3 3 0 0 0 3-3c0-5-4-8-9-8Z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16" cy="10" r="1" /></>,
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? ICONS.sparkle}
    </svg>
  );
}
