import { Box, Blend, Circle, Diamond, Droplets, Flame, Frame, Gem, Grid2X2, Layers, Maximize, Moon, Move, Orbit, Palette, Paintbrush, ScanLine, Shuffle, SlidersHorizontal, Snowflake, Sparkles, Sun, TreePine, WandSparkles, Waves, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const effectIcons: Record<string, LucideIcon> = {
  adjust: SlidersHorizontal, tint: Paintbrush, gradmap: Blend, gradient: Blend, posterize: Layers,
  palette: Palette, replace: Shuffle, filter: Sun, rainbow: Blend, noise: ScanLine, dither: Grid2X2,
  bevel: Diamond, autoshade: Box, emboss: Layers, sharpen: Maximize, blur: Droplets,
  weather: TreePine, cracks: Zap, metal: Circle, frost: Snowflake, ore: Gem, pattern: Grid2X2,
  outline: Frame, glow: Sun, sparkle: Sparkles, frame: Frame, emblem: Diamond, runes: Orbit,
  shadow: Moon, extrude: Box, vignette: Circle, enchant: WandSparkles, shimmer: Sparkles,
  pulse: Sun, wave: Waves, flow: Waves, embers: Flame, huecycle: Palette, flicker: Flame,
  upscale: Maximize, transform: Move, mirror: Layers, offset: Move, seamless: Grid2X2,
  crystalline: Gem, neonEdge: Zap, woodgrain: TreePine, brushedMetal: Layers, fabric: Grid2X2,
  pearl: Blend, aurora: Waves, nebula: Sparkles, magicCircle: Orbit, hatching: Paintbrush,
  chromatic: Move, glassSurface: Diamond,
};

export function EffectIcon({ type, size = 17 }: { type: string; size?: number }) {
  const Icon = effectIcons[type] || WandSparkles;
  return <Icon size={size} strokeWidth={1.65} />;
}

export function BrandMark({ size = 31 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <path d="M18 2 33 10.5V26L18 34 3 26V10.5L18 2Z" fill="#b9ed80" />
    <path d="m18 7 10 5.5L18 18 8 12.5 18 7Z" fill="#18251b" />
    <path d="M8 16.5 15.5 21v7.5L8 24v-7.5ZM20.5 21 28 16.5V24l-7.5 4.5V21Z" fill="#18251b" />
  </svg>;
}