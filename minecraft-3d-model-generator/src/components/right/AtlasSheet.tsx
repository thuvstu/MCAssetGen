"use client";
import { useEffect, useRef, useState } from "react";
import type { Cell, FaceKey } from "@/lib/forge/types";
import { useForge } from "@/lib/store";
import { useDerived } from "../ForgeProvider";

const PX = 512;
const FACE_TAG: Record<FaceKey, string> = { up: "U", down: "D", north: "N", east: "E", south: "S", west: "W" };

export default function AtlasSheet() {
  const { atlas, canvas, texVersion } = useDerived();
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const setHoverCell = useForge((s) => s.setHoverCell);
  const hoverCell = useForge((s) => s.hoverCell);
  const say = useForge((s) => s.say);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = PX;
    c.height = PX;
    const o = c.getContext("2d");
    if (!o) return;
    const S = atlas.size;
    const k = PX / S;
    o.clearRect(0, 0, PX, PX);
    o.imageSmoothingEnabled = false;
    if (canvas) o.drawImage(canvas, 0, 0, S, S, 0, 0, PX, PX);

    // 16px ごとの定規
    o.lineWidth = 1;
    o.font = "600 10px ui-monospace, monospace";
    const step = S >= 128 ? 32 : S >= 64 ? 16 : 8;
    for (let t = step; t < S; t += step) {
      const p = Math.round(t * k) + 0.5;
      o.strokeStyle = "rgba(21,19,15,0.12)";
      o.beginPath();
      o.moveTo(p, 0);
      o.lineTo(p, PX);
      o.moveTo(0, p);
      o.lineTo(PX, p);
      o.stroke();
      o.fillStyle = "rgba(21,19,15,0.5)";
      o.fillText(String(t), p + 2, 10);
    }

    const focus = hover ?? atlas.cells.find((c) => c.key === hoverCell) ?? null;
    atlas.cells.forEach((cell) => {
      const [x0, y0, x1, y1] = cell.rect;
      const isH = hover?.key === cell.key;
      const pinned = !isH && hoverCell === cell.key;
      o.strokeStyle = isH || pinned ? "#D9482B" : "rgba(184,145,47,0.9)";
      o.lineWidth = isH || pinned ? 2 : 1;
      o.strokeRect(x0 * k + 0.5, y0 * k + 0.5, (x1 - x0) * k - 1, (y1 - y0) * k - 1);
      if (pinned) {
        o.fillStyle = "rgba(217,72,43,0.12)";
        o.fillRect(x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);
      }
    });

    if (focus) {
      (Object.keys(focus.faces) as FaceKey[]).forEach((f) => {
        const [u0, v0, u1, v1] = focus.faces[f];
        const w = (u1 - u0) * k;
        const h = (v1 - v0) * k;
        o.fillStyle = "rgba(217,72,43,0.16)";
        o.fillRect(u0 * k, v0 * k, w, h);
        o.strokeStyle = "rgba(255,255,255,0.8)";
        o.lineWidth = 1;
        o.strokeRect(u0 * k + 0.5, v0 * k + 0.5, w - 1, h - 1);
        if (w >= 10 && h >= 10) {
          o.fillStyle = "#15130F";
          o.fillRect(u0 * k + 1, v0 * k + 1, 10, 11);
          o.fillStyle = "#fff";
          o.font = "700 9px ui-monospace, monospace";
          o.fillText(FACE_TAG[f], u0 * k + 3, v0 * k + 10);
        }
      });
      const [, , x1, y1] = focus.rect;
      o.strokeStyle = hover ? "rgba(217,72,43,0.45)" : "rgba(217,72,43,0.25)";
      o.setLineDash([3, 3]);
      o.beginPath();
      o.moveTo(x1 * k, 0);
      o.lineTo(x1 * k, PX);
      o.moveTo(0, y1 * k);
      o.lineTo(PX, y1 * k);
      o.stroke();
      o.setLineDash([]);
    }
    o.strokeStyle = "#15130F";
    o.lineWidth = 2;
    o.strokeRect(1, 1, PX - 2, PX - 2);
  }, [atlas, canvas, texVersion, hover, hoverCell, pinned]);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[9px] tracking-[0.24em] text-ink/65">TEXTURE ATLAS · BOX-UV NET</span>
        <span className="font-mono text-[10px] tabular-nums text-ink/80">
          {atlas.size}×{atlas.size}px
        </span>
      </div>
      <div
        role="img"
        aria-label="UVアトラスのプレビュー。セルをクリックすると 3D 側の該当要素が光り続けます"
        className="relative aspect-square w-full cursor-crosshair border border-ink/70 shadow-[3px_3px_0_rgba(21,19,15,0.2)]"
        style={{ backgroundColor: "#F4EFE4", backgroundImage: "repeating-conic-gradient(#E4DCCB 0% 25%, #F6F1E6 0% 50%)", backgroundSize: "14px 14px" }}
        onMouseLeave={() => {
          setHover(null);
          setHoverCell(pinned);
        }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const u = ((e.clientX - r.left) / r.width) * atlas.size;
          const v = ((e.clientY - r.top) / r.height) * atlas.size;
          const hit = atlas.cells.find((c) => u >= c.rect[0] && u < c.rect[2] && v >= c.rect[1] && v < c.rect[3]) ?? null;
          if (hit?.key !== hover?.key) {
            setHover(hit);
            setHoverCell(hit?.key ?? pinned);
          }
        }}
        onClick={() => {
          const key = hover?.key ?? null;
          const next = key === pinned ? null : key;
          setPinned(next);
          setHoverCell(next);
          if (next) say(hover ? `「${hover.sample.name}」を固定しました` : "固定を解きました");
        }}
      >
        <canvas ref={ref} className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} aria-label="UVアトラスのプレビュー" />
      </div>
      <div className="mt-1.5 flex min-h-[16px] items-baseline justify-between gap-2">
        {hover ? (
          <>
            <span className="truncate text-[11px] text-ink">
              {hover.sample.name}
              {hover.count > 1 && <span className="ml-1 font-mono text-[10px] text-vermilion">×{hover.count} 共有</span>}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-ink/60">{hover.rect.join(",")}</span>
          </>
        ) : (
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink/60">
            {atlas.cells.length} NETS ／ FILL {Math.round(atlas.fill * 100)}% ／ {atlas.scale ? `${atlas.scale.toFixed(2)} px/unit` : "UNIFORM"} ／ CLICK＝3Dで固定
          </span>
        )}
      </div>
    </div>
  );
}
