/**
 * ESSENCE EXTRACTOR — measures real Hypixel SkyBlock packs pixel by pixel.
 * Only derived statistics leave this script; no artwork is copied.
 *
 *   npx tsx tools/essence.mts <label>=<dir> ...  [--json out.json]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { measure } from '../src/lib/forge-measure';

type Stat = {
  res: number; frames: number; cover: number; colors: number; partial: number;
  darker: number; black: number; colored: number; outL: number;
  lightTL: number; shift: number; warm: number; cool: number; rampLen: number;
  cDark: number; cMid: number; cLight: number; Lmin: number; Lmax: number;
  contrast: number; meanL: number; meanC: number; iso: number; cluster: number;
  domHue: number;
};

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (f.toLowerCase().endsWith('.png')) out.push(p);
  }
  return out;
}

const med = (a: number[]) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const q = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
};

function analyse(file: string): Stat | null {
  let png: PNG;
  try { png = PNG.sync.read(readFileSync(file)); } catch { return null; }
  const w = png.width, h = png.height;
  if (![16, 32, 64, 128].includes(w) || h % w !== 0 || h / w > 64) return null;
  if (process.env.RES && w !== Number(process.env.RES)) return null;
  const m = measure(png.data, w);
  if (!m) return null;
  return { ...m, frames: h / w, outL: 0, cool: 0, domHue: 0 } as unknown as Stat;
}

const args = process.argv.slice(2);
const jsonAt = args.indexOf('--json');
const jsonOut = jsonAt >= 0 ? args[jsonAt + 1] : null;
const packs = args.filter((a, i) => a.includes('=') && (jsonAt < 0 || i !== jsonAt + 1));
const report: Record<string, unknown> = {};

for (const spec of packs) {
  const [label, dir] = spec.split('=');
  const files = walk(dir);
  const stats = files.map(analyse).filter((s): s is Stat => !!s);
  const by = (r: number) => stats.filter((s) => s.res === r).length;
  const pick = (f: (s: Stat) => number, xs = stats) => med(xs.map(f));
  const colorsBy: Record<number, number> = {};
  for (const r of [16, 32, 64, 128]) {
    const xs = stats.filter((s) => s.res === r);
    if (xs.length >= 5) colorsBy[r] = pick((s) => s.colors, xs);
  }
  const shifted = stats.filter((s) => s.rampLen >= 3);
  const out = {
    files: files.length,
    items: stats.length,
    res: { 16: by(16), 32: by(32), 64: by(64), 128: by(128) },
    animated: stats.filter((s) => s.frames > 1).length,
    framesMedian: med(stats.filter((s) => s.frames > 1).map((s) => s.frames)),
    colorsByRes: colorsBy,
    rampLen: pick((s) => s.rampLen, shifted),
    outlineDarker: pick((s) => s.darker),
    outlineBlack: pick((s) => s.black),
    outlineColored: pick((s) => s.colored),
    outlineL: pick((s) => s.outL),
    lightTL: pick((s) => s.lightTL),
    lightTLshare: stats.filter((s) => s.lightTL > 0.01).length / Math.max(1, stats.length),
    hueShift: pick((s) => s.shift, shifted),
    warmShift: pick((s) => s.warm, shifted),
    coolShift: pick((s) => s.cool, shifted),
    chromaDarkMidLight: [pick((s) => s.cDark, shifted), pick((s) => s.cMid, shifted), pick((s) => s.cLight, shifted)],
    Lrange: [pick((s) => s.Lmin), pick((s) => s.Lmax)],
    contrast: pick((s) => s.contrast),
    meanL: pick((s) => s.meanL),
    meanC: pick((s) => s.meanC),
    isolation: pick((s) => s.iso),
    clusterPx: pick((s) => s.cluster),
    partialAlpha: pick((s) => s.partial),
    coverage: pick((s) => s.cover),
    usesPartialAlpha: stats.filter((s) => s.partial > 0.02).length / Math.max(1, stats.length),
  };
  report[label] = out;
  const f2 = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : '—');
  console.log(`\n■ ${label}  files=${out.files} item-icons=${out.items}  res16/32/64/128=${out.res[16]}/${out.res[32]}/${out.res[64]}/${out.res[128]}  animated=${out.animated} (median ${out.framesMedian} frames)`);
  console.log(`  colors/res ${JSON.stringify(colorsBy)}  rampLen ${out.rampLen}  contrast ${f2(out.contrast)}  meanL ${f2(out.meanL)}  meanC ${f2(out.meanC)}  L[${f2(out.Lrange[0])},${f2(out.Lrange[1])}]`);
  console.log(`  outline: darker ${f2(out.outlineDarker)} black ${f2(out.outlineBlack)} colored ${f2(out.outlineColored)} L ${f2(out.outlineL)}`);
  console.log(`  light TL−BR ${f2(out.lightTL)} (TL-lit share ${(out.lightTLshare * 100).toFixed(0)}%)  hueShift ${f2(out.hueShift)}°  warm ${f2(out.warmShift)}° cool ${f2(out.coolShift)}°  chroma D/M/L ${out.chromaDarkMidLight.map(f2).join('/')}`);
  console.log(`  isolation ${f2(out.isolation)}  clusterPx ${f2(out.clusterPx)}  partialα ${f2(out.partialAlpha)} (uses: ${(out.usesPartialAlpha * 100).toFixed(0)}%)  coverage ${f2(out.coverage)}`);
}
if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify(report, null, 2));
  console.log('\nwrote', jsonOut);
}
