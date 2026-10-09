import { useEffect, useRef } from "react";
import type { TierPalette } from "./renderer";
import type { ThemeId } from "./themes";
import { applyThemeToPalette, themePlusOptions } from "./themes";
import {
  renderVanillaLike,
  type VanillaPlusOptions,
  type VanillaRenderMode,
} from "./vanillaPlus";

interface VanillaCanvasProps {
  map: number[][];
  palette: TierPalette;
  /** intrinsic render resolution */
  size: number;
  /** CSS display size (defaults to `size`, capped for large textures) */
  displaySize?: number;
  mode?: VanillaRenderMode;
  plus?: VanillaPlusOptions;
  className?: string;
  title?: string;
  /** Optional theme ("系") applied to the palette before rendering */
  theme?: ThemeId;
}

/**
 * Shared canvas for every vanilla-family preview. Renders once per input
 * change with pixelated scaling — replaces the previously triplicated
 * SizePreview / ArsenalThumb / CustomPalettePreview implementations.
 */
export function VanillaCanvas({
  map,
  palette,
  size,
  displaySize,
  mode = "vanilla",
  plus,
  className = "rounded bg-[#1d242a]/50",
  title,
  theme = "simple",
}: VanillaCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const resolvedPalette = applyThemeToPalette(palette, theme);
    const resolvedPlus = themePlusOptions(theme, (plus ?? ({} as VanillaPlusOptions)));
    renderVanillaLike(ctx, map, resolvedPalette, size, mode, resolvedPlus);
  }, [map, palette, size, mode, plus, theme]);

  const px = displaySize ?? Math.min(size, 128);
  return (
    <canvas
      ref={ref}
      title={title}
      style={{ width: px, height: px, imageRendering: "pixelated" }}
      className={className}
    />
  );
}
