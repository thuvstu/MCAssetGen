import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RARITIES, ELEMENTS, STAFF_TYPES, type Config } from "../engine/data";
import { renderFrame } from "../engine/render";
import { loreFor } from "../engine/generator";

/** Lazily renders and caches frames so large canvases never block the UI. */
export type FrameCache = ReturnType<typeof useFrameCache>;

export function useFrameCache(cfg: Config, mode: "normal" | "emissive" = "normal") {
  const cache = useMemo(() => new Map<number, ImageData>(), [cfg]);
  const get = useCallback((i: number) => {
    const key = ((i % Math.max(1, cfg.frames)) + Math.max(1, cfg.frames)) % Math.max(1, cfg.frames);
    let f = cache.get(key);
    if (!f) { f = renderFrame(cfg, key, mode); cache.set(key, f); }
    return f;
  }, [cache, cfg, mode]);
  return { get, total: Math.max(1, cfg.frames) };
}

export function AnimatedCanvas({ cache, frametime, playing, className }: { cache: ReturnType<typeof useFrameCache>; frametime: number; playing: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  const total = cache.total;
  useEffect(() => {
    if (!playing || total <= 1) { setFrame(0); return; }
    const ms = Math.max(1, frametime) * 50;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % total), ms);
    return () => window.clearInterval(id);
  }, [playing, total, frametime]);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const img = cache.get(frame);
    if (c.width !== img.width) { c.width = img.width; c.height = img.height; }
    c.getContext("2d")!.putImageData(img, 0, 0);
  }, [frame, cache, total]);
  return <canvas ref={ref} className={className} />;
}

export function StaticThumb({ cfg, className }: { cfg: Config; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const img = renderFrame(cfg, 0);
    c.width = img.width; c.height = img.height;
    c.getContext("2d")!.putImageData(img, 0, 0);
  }, [cfg]);
  return <canvas ref={ref} className={className} />;
}

export function Tooltip({ cfg }: { cfg: Config }) {
  const rar = RARITIES[cfg.rarity];
  const el = ELEMENTS[cfg.element];
  const lore = loreFor(cfg);
  return (
    <div className="mc-tooltip" style={{ ["--rc" as string]: rar.color }}>
      <div className="mc-name" style={{ color: rar.color }}>{cfg.name || STAFF_TYPES[cfg.type].label}</div>
      <div className="mc-line gray">ダメージ <span className="red">+{lore.dmg}</span></div>
      <div className="mc-line gray">知力 <span className="green">+{lore.mana}</span></div>
      <div className="mc-line gray">{lore.statName} <span className="aqua">+{lore.stat}</span></div>
      <div className="mc-line gray">攻撃速度 <span className="yellow">+{lore.speed}%</span></div>
      <div className="mc-gap" />
      <div className="mc-line"><span className="gold">◆ {lore.ability}</span> <span className="yellow">[右クリック]</span></div>
      <div className="mc-line darkgray">マナ {lore.cost} · CT {lore.cooldown}s</div>
      <div className="mc-gap" />
      <div className="mc-line italic">{lore.flavor}</div>
      <div className="mc-line darkgray">{el.icon} {el.label}属性 · {STAFF_TYPES[cfg.type].label}</div>
      <div className="mc-rarity" style={{ color: rar.color }}>{rar.label} STAFF</div>
    </div>
  );
}
