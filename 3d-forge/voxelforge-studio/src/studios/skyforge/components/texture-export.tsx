"use client";

import { useState } from "react";

/**
 * Single-texture export: PNG at any resolution, or a one-item CIT pack ZIP.
 * Works from the pack page so users can grab just one icon without the pack.
 */
export function TextureExport({
  textureId,
  itemId,
  name,
  resolution,
}: {
  textureId: string;
  itemId: string;
  name: string;
  resolution: number;
}) {
  const [size, setSize] = useState(resolution);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <select
        value={size}
        onChange={(e) => setSize(Number(e.target.value))}
        className="border border-line bg-ink px-1 py-0.5 text-[10px] text-paper/70"
        aria-label={`${name} 出力解像度`}
      >
        {[16, 32, 64].map((s) => (
          <option key={s} value={s}>
            {s}px
          </option>
        ))}
      </select>
      <a
        href={`/api/textures/${textureId}/png?size=${size}`}
        download={`${itemId}_${size}.png`}
        className="border border-line px-1.5 py-0.5 text-[10px] text-aqua hover:border-aqua/60"
      >
        PNG
      </a>
      <a
        href={`/api/textures/${textureId}/zip?size=${size}`}
        className="border border-line px-1.5 py-0.5 text-[10px] text-gold-2 hover:border-gold/60"
      >
        単体ZIP
      </a>
    </div>
  );
}
