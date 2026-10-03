import { clamp01, hashNoise, hexToRgb, mix, shade } from "./color";
import type { Surface } from "./geometry";
import { applySurface } from "./surfaces";
import type { SurfaceCtx } from "./surfaces";
import { defaultLighting } from "./lighting";
import { ELEMENT_COLORS } from "./elements";
import type { RGB, SwordOptions } from "./types";

export function createShader(o: SwordOptions, scale: number) {
  const p = Object.fromEntries(Object.entries(o.palette).map(([key, value]) => [key, hexToRgb(value)])) as Record<keyof SwordOptions["palette"], RGB>;
  const rune = hexToRgb(o.runeColor);
  const tip = hexToRgb(o.tipColor);
  const mid = hexToRgb(o.midGradientColor);
  const bladePx = (0.38 + o.bladeWidth * 0.4) * 2 * scale;
  const surfaceCtx: SurfaceCtx = {
    seed: o.surfaceSeed, scale, bladePx, fine: bladePx >= 12, edge: p.bladeEdge, core: p.bladeCore, accent: rune,
    glow: ELEMENT_COLORS[o.element === "none" ? "flame" : o.element].glow, shading: o.shading,
  };
  const lighting = defaultLighting(o.shading);
  const glyphs = [0b101010111010101, 0b111101010101111, 0b010111101111010, 0b101111010111101];
  const isBlade = (s: Surface) => ["blade", "edge", "bevel", "core"].includes(s.part);
  const quantize = o.detailLevel === "anime" || o.detailLevel === "minecraft";

  const runeAt = (s: Surface) => {
    if (!o.runeInlay || !isBlade(s) || s.progress < 0.13 || s.progress > 0.78) return false;
    if (bladePx < 7) return Math.abs(s.across) < 0.3 && ((s.progress * 9) % 1) < 0.55;
    if (Math.abs(s.across) > 0.4) return false;
    const position = (s.progress - 0.13) * 6;
    const local = position % 1;
    if (local > 0.72) return false;
    const y = Math.min(4, Math.floor(local / 0.72 * 5));
    const x = Math.min(2, Math.floor((s.across + 0.4) / 0.8 * 3));
    return !!(glyphs[Math.floor(position) % glyphs.length] & (1 << (y * 3 + x)));
  };

  const color = (s: Surface, x: number, y: number): RGB => {
    const across = s.across, t = clamp01(s.progress);
    const noise = o.noise > 0.001 && o.detailLevel !== "minecraft"
      ? hashNoise(Math.floor(x * 5) + o.surfaceSeed, Math.floor(y * 5)) * o.noise * 0.14
      : 0;
    // Image-space shading: lit edge is around across = -0.6 (upper-left of the diagonal sword).
    // For curved blades, the geometry.sample reports across relative to the spine centre.
    const shadeFactor = 1 + (across + 0.2) * 0.32 * lighting.intensity + noise;
    let f = quantize ? Math.round(shadeFactor * 5) / 5 : shadeFactor;
    let col: RGB;

    if (isBlade(s)) {
      col = p.blade;
      if (o.gradientBlade) col = mix(col, t < 0.5 ? mid : tip, t < 0.5 ? t * 0.3 : (t - 0.5) * 0.95);
      // Spine-to-edge gradient (the Rengoku essence): the spine cools toward the core
      // colour while the cutting edge ignites toward the edge colour.
      if (o.edgeGradient) {
        const k = (1 - across) / 2;          // 0 at the spine, 1 at the cutting edge
        col = k < 0.5
          ? mix(col, p.bladeCore, (0.5 - k) * 2 * 0.45)
          : mix(col, p.bladeEdge, (k - 0.5) * 2 * 0.5);
      }
      col = shade(col, f);
      col = applySurface(o.surface, col, s, surfaceCtx);
      if (o.fuller && t > 0.08 && t < o.fullerLength && bladePx >= 5) {
        if (Math.abs(across) < 0.18) col = mix(col, p.bladeCore, 0.68);
        else if (across < -0.18 && across > -0.27) col = mix(col, p.bladeEdge, 0.4);
      }
      // Directional edge highlight (upper-left rim of the blade), with a specular dot just inward.
      const highlight = Math.exp(-Math.pow((across + 0.62) / 0.14, 2));
      const spec = Math.exp(-Math.pow((across + 0.35) / 0.10, 2)) * 0.5;
      const shadow = Math.exp(-Math.pow((across - 0.55) / 0.18, 2));
      if (o.edgeHighlight) {
        col = mix(col, p.bladeEdge, highlight * 0.75);
        col = mix(col, p.bladeEdge, spec * lighting.intensity);
      }
      if (s.part === "edge") col = mix(col, p.bladeEdge, o.edgeHighlight ? 0.72 : 0.3);
      if (s.part === "bevel") col = mix(col, p.bladeCore, 0.58);
      col = mix(col, shade(col, 0.65), shadow * 0.55);
      if (runeAt(s)) col = mix(rune, p.bladeEdge, 0.15);
      // ricasso: an unsharpened, squared shoulder just above the guard
      if (o.ricasso && t > 0.04 && t < 0.17) {
        col = mix(col, p.bladeCore, 0.35);
        if (t < 0.06 || t > 0.15) col = shade(col, 0.78);
      }
      // horimono: a carved decorative groove just inside the spine
      if (o.horimono && bladePx >= 7 && t > 0.18 && t < 0.72 && across > 0.25 && across < 0.55) {
        col = shade(col, Math.abs(((t * 7) % 1) - 0.5) < 0.22 ? 0.68 : 0.86);
      }
      // Ambient occlusion where the blade meets the guard
      if (t < 0.06) col = shade(col, 0.72 + t * 4.5);
      return col;
    }

    if (s.part === "handle") {
      col = p.handle;
      const cross = Math.sin(t * 44 + across * 3) * Math.sin(t * 44 - across * 3);
      let accent = 0;
      switch (o.handleStyle) {
        case "leather": accent = cross > 0.5 ? 0.48 : 0.12; break;
        case "wire": accent = Math.sin(t * 70 + across * 3) > 0.4 ? 0.65 : 0.05; break;
        case "dragon_scale": accent = Math.cos(t * 38 + Math.floor(across * 3) % 2 * Math.PI) > 0.3 ? 0.5 : 0; break;
        case "gold_ribbon": return shade(mix(col, p.guardAccent, Math.sin(t * 30 + across * 4) > 0.3 ? 0.8 : 0), f);
        case "bone": return shade(mix(p.handleAccent, p.bladeEdge, 0.55), ((t * 7) % 1 < 0.15 ? 0.6 : 1) * f);
        case "wrapped_parchment": accent = Math.abs(Math.sin(t * 38)) > 0.45 + Math.abs(across) * 0.4 ? 0.9 : 0.05; break;
        case "ribbed": accent = ((t * 8) % 1) < 0.35 ? 0.55 : 0; f *= ((t * 8) % 1) < 0.35 ? 1.08 : 0.92; break;
        case "cord": accent = Math.sin(t * 52 + across * 6) > 0.2 ? 0.5 : 0.1; break;
        case "studded": accent = Math.hypot(((t * 6) % 1) - 0.5, across * 0.6) < 0.16 ? 0.9 : 0.08; break;
        case "chain": { const ring = Math.abs(Math.hypot(((t * 7) % 1) - 0.5, across * 0.55) - 0.3) < 0.09; accent = ring ? 0.85 : 0.05; break; }
        default: f *= 0.98;
      }
      col = mix(col, p.handleAccent, accent);
      if (o.pommelBand && (t > 0.9 || t < 0.08)) col = p.guard;
      return shade(col, f);
    }

    if (s.part === "guard") {
      col = p.guard;
      if (o.filigree) {
        const studs = Math.abs(((Math.abs(s.v) * 1.6 + 0.2) % 1) - 0.5) < 0.17 && Math.abs(s.v) > 0.35;
        const groove = Math.abs(Math.sin(s.v * 2.6)) < 0.12 && Math.abs(s.v) > 0.25;
        if (studs) col = mix(col, p.guardAccent, 0.6);
        else if (groove) col = shade(col, 0.8);
      }
      // Guard lit side (upper-left rim) gets the accent, opposite side darkened
      if (across < -0.45) col = mix(col, p.guardAccent, 0.45);
      if (across > 0.55) col = shade(col, 0.78);
      return shade(col, f);
    }

    if (s.part === "shard") return shade(hexToRgb(o.shardColor), across < 0 ? 1.22 : 0.68);
    if (s.part === "spur") return shade(o.boneSpurs ? mix(p.spur, [232, 222, 200], 0.6) : p.spur, f);
    // pommel: lit side gets the guard accent ring, dark side is shadow
    col = p.pommel;
    if (o.pommelStyle === "orb" || o.pommelStyle === "round") col = mix(col, p.guardAccent, across < -0.5 ? 0.35 : 0);
    return shade(col, f);
  };
  return { color, runeAt };
}
