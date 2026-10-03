"use client";
import { createContext, useContext, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { generate, layoutAtlas, paintAtlas, type Atlas, type Generated } from "@/lib/forge";
import { useForge } from "@/lib/store";

interface Derived {
  gen: Generated;
  atlas: Atlas & { scale: number };
  canvas: HTMLCanvasElement | null;
  texVersion: number;
}

const Ctx = createContext<Derived | null>(null);

export function useDerived() {
  const v = useContext(Ctx);
  if (!v) throw new Error("ForgeProvider missing");
  return v;
}

export default function ForgeProvider({ children }: { children: ReactNode }) {
  const live = useForge((s) => s.params);
  // 重いモデルでもスライダー操作を止めない：生成は遅延値で行う
  const params = useDeferredValue(live);

  // 造形に関わる値だけをキー化（表示・アニメ設定の変更では再生成しない）
  const shapeKey = JSON.stringify([
    params.kind,
    params.style,
    params.seed,
    params.length,
    params.width,
    params.detail,
    params.runes,
    params.palette,
    params.effects,
    params.snap,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gen = useMemo(() => generate(params), [shapeKey]);
  const atlas = useMemo(
    () => layoutAtlas(gen.boxes, params.tex, params.layout, params.share),
    [gen, params.tex, params.layout, params.share]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [texVersion, setTexVersion] = useState(0);

  useEffect(() => {
    // サイズが変わったら新しいキャンバス（GPU側テクスチャも作り直すため）
    let c = canvasRef.current;
    if (!c || c.width !== atlas.size) {
      c = document.createElement("canvas");
      c.width = atlas.size;
      c.height = atlas.size;
      canvasRef.current = c;
    }
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, c.width, c.height);
      paintAtlas(ctx, atlas, params.seed, {
        mode: params.grad.mode,
        power: params.grad.power,
        glow: params.palette.glow,
        minY: gen.bounds.min[1],
        maxY: gen.bounds.max[1],
      });
    }
    setCanvas(c);
    setTexVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas, params.grad.mode, params.grad.power]);

  const value = useMemo(() => ({ gen, atlas, canvas, texVersion }), [gen, atlas, canvas, texVersion]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
