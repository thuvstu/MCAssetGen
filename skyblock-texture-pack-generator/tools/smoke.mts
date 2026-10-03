import { forge } from '../src/lib/engine';
import { CATALOG } from '../src/lib/catalog';
import { PRESETS, type PackId } from '../src/lib/essence';
import type { Anim } from '../src/lib/engine';
import { createThemedItem } from '../src/lib/forgeThemes';
let runs = 0, bad = 0, maxMs = 0, frames = 0; const t0 = Date.now();
const anims: Anim[] = ['none', 'shimmer', 'pulse', 'flow', 'twinkle', 'flame', 'embers', 'orbit', 'arcane', 'lightning', 'frost', 'aurora', 'water'];
const themed = Array.from({ length: 12 }, () => createThemedItem());
const items = [...CATALOG, ...themed];
for (const pid of Object.keys(PRESETS) as PackId[]) for (const n of [16, 32, 64] as const) for (const anim of anims) for (const [ix, it] of items.entries()) {
  const s = Date.now();
  try {
    const design = {
      ...it.design,
      offsetX: [-6, 0, 6, 0][ix % 4],
      offsetY: [0, -5, 0, 5][ix % 4],
      scaleX: [0.78, 0.96, 1.12, 0.9][ix % 4],
      scaleY: [1.1, 0.84, 0.94, 1.18][ix % 4],
      rotation: [-14, 0, 13, 28][ix % 4],
      flipX: ix % 5 === 0,
      flipY: ix % 7 === 0,
      autoFit: true,
    };
    const fg = forge({ n, design, mats: it.mats, style: PRESETS[pid], light: 135, anim, seed: 7, motion: { intensity: 0.9, speed: 1.35, density: 0.8 } });
    runs++; frames += fg.frames.length;
    const f0 = fg.frames[0]; let op = 0, semi = 0;
    for (let i = 3; i < f0.length; i += 4) { if (f0[i] === 255) op++; else if (f0[i] !== 0) semi++; }
    if (op < n * n * 0.05 || semi > 0 || fg.palette > PRESETS[pid].colors[n] || fg.frames.some((f) => f.length !== n * n * 4) || fg.bounds.clipped) { bad++; if (bad < 5) console.log('BAD', pid, n, anim, it.id, op, semi, fg.palette, fg.bounds); }
  } catch (e) { bad++; console.log('THROW', pid, n, anim, it.id, String(e)); }
  maxMs = Math.max(maxMs, Date.now() - s);
}
console.log(`SMOKE: ${runs} forges · ${frames} frames · ${bad} bad · ${Date.now() - t0}ms total · slowest ${maxMs}ms`);
console.log('checks: ≥5% opaque, zero semi-transparent px (measured essence), palette ≤ budget, frame sizes exact, auto-fit margin unbroken');
