"use client";

import { useEffect, useRef } from "react";

export function drawPixels(
  canvas: HTMLCanvasElement,
  pixels: number[],
  width: number,
  height: number,
) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const img = ctx.createImageData(width, height);
  const src = pixels.length === width * height * 4 ? pixels : [];
  for (let i = 0; i < img.data.length; i++) {
    img.data[i] = src[i] ?? 0;
  }
  ctx.putImageData(img, 0, 0);
}

export function PixelImage({
  pixels,
  width,
  height,
  scale = 4,
  className = "",
  glint = false,
}: {
  pixels: number[];
  width: number;
  height: number;
  scale?: number;
  className?: string;
  glint?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) drawPixels(ref.current, pixels, width, height);
  }, [pixels, width, height]);

  return (
    <span className={`relative inline-grid ${className}`}>
      <canvas
        ref={ref}
        className="pixelated"
        style={{ width: width * scale, height: height * scale }}
      />
      {glint ? <span className="glint absolute inset-0" /> : null}
    </span>
  );
}
