import { hslToHex } from "./material-color";
import { FX_STYLES } from "./material-presets";
import type { MaterialSettings } from "./material-render";

const HEADS = ['vor', 'zan', 'kel', 'myr', 'tha', 'ori', 'lum', 'dra', 'nex', 'sol', 'ael', 'gri', 'bel', 'xen', 'cor', 'ul', 'fen', 'ska', 'vel', 'ith'];
const MIDS = ['', '', 'a', 'o', 'e', 'i', 'an', 'ar', 'en', 'or'];
const TAILS = ['ium', 'ite', 'ine', 'on', 'ar', 'il', 'yst', 'ium', 'ite', 'ore'];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const range = (a: number, b: number): number => a + Math.random() * (b - a);

export function randomName(): string {
  return `${pick(HEADS)}${pick(MIDS)}${pick(TAILS)}`;
}

/** ランダムな素材設定を生成する(色・名前・質感) */
export function randomMaterial(): Partial<MaterialSettings> {
  const style = pick(FX_STYLES);
  const h = range(0, 360);
  const isMetal = style.id === 'metal' || style.id === 'ancient';
  const s = isMetal ? range(10, 55) : range(45, 90);
  const l = isMetal ? range(45, 72) : range(35, 62);
  const rel = pick([30, -30, 150, 180, 210, 90]);
  const base = hslToHex([h, s, l]);
  const secondary = hslToHex([h + rel, Math.min(95, s + range(10, 35)), range(45, 75)]);
  return {
    name: randomName(),
    base,
    secondary,
    hueShift: Math.round(range(-14, 14)),
    contrast: Math.round(range(0.8, 1.35) * 20) / 20,
    saturationBoost: 0,
    seed: Math.floor(Math.random() * 99999),
    grain: Math.round(Math.max(0, Math.min(1, style.fx.grain + range(-0.1, 0.1))) * 20) / 20,
    brushed: style.fx.brushed,
    facet: style.fx.facet,
    patina: style.fx.patina > 0 ? Math.round(range(0.4, 0.9) * 20) / 20 : 0,
    glow: style.fx.glow,
  };
}
