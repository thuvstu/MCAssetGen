import { buildGeo } from '../src/lib/engine';
import { ARCHES, type Design } from '../src/lib/archetypes';
import { hash2 } from '../src/lib/raster';
let fails = 0, cases = 0;
const comps = (L: Int16Array, n: number) => {
  const seen = new Uint8Array(n * n); let c = 0;
  for (let s = 0; s < n * n; s++) { if (L[s] < 0 || seen[s]) continue; c++; const st = [s]; seen[s] = 1;
    while (st.length) { const j = st.pop()!; const x = j % n, y = (j / n) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue; const t = yy * n + xx; if (L[t] >= 0 && !seen[t]) { seen[t] = 1; st.push(t); } } } }
  return c;
};
for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) for (let r = 0; r < 4; r++) for (const n of [16, 32, 64] as const) {
  const base: Design = { arch: 'bow', a, b, len: hash2(a, r, 1), wid: hash2(a, r, 2), orn: hash2(b, r, 3), gem: r % 2 === 0, rune: false };
  const sb = buildGeo({ ...base, pull: 0 }, n);
  for (const pull of [1, 2, 3]) {
    cases++;
    const g = buildGeo({ ...base, pull }, n);
    const ids = new Set(Array.from(g.labels).filter((l) => l >= 0).map((l) => g.specs[l].id));
    let x0 = n, y0 = n, x1 = -1, y1 = -1;
    for (let i = 0; i < n * n; i++) if (g.labels[i] >= 0) { const x = i % n, y = (i / n) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const tag = `bow A${a} B${b} r${r} pull${pull} @${n}`;
    const c = comps(g.labels, n);
    if (c !== 1) { fails++; console.log(`  ✘ ${tag}: ${c} components`); }
    if (x0 < 1 || y0 < 1 || x1 > n - 2 || y1 > n - 2) { fails++; console.log(`  ✘ ${tag}: breaks the 1px outline margin x[${x0},${x1}] y[${y0},${y1}]`); }
    if (!ids.has('head') && !ids.has('shaft')) { fails++; console.log(`  ✘ ${tag}: arrow not visible`); }
    // same scale: the grip (fixed part) must sit at the same place as in standby
    const gc = (G: typeof g) => { let sx = 0, sy = 0, k = 0; for (let i = 0; i < n * n; i++) if (G.labels[i] >= 0 && G.specs[G.labels[i]].id === 'grip') { sx += i % n; sy += (i / n) | 0; k++; } return k ? [sx / k, sy / k] : [NaN, NaN]; };
    const [ax, ay] = gc(sb), [bx, by] = gc(g);
    if (Math.hypot(ax - bx, ay - by) > Math.max(1.5, n / 16)) { fails++; console.log(`  ✘ ${tag}: grip drifted ${Math.hypot(ax - bx, ay - by).toFixed(1)}px (scale/centre not shared)`); }
  }
}
console.log(`BOW STATES: ${cases} cases — ${fails ? `✘ ${fails}` : '✔ all pass'}`);
const show = (pull: number) => { const g = buildGeo({ arch: 'bow', a: 0, b: 0, len: 0.5, wid: 0.5, orn: 0.2, gem: false, rune: false, pull }, 32);
  return Array.from({ length: 32 }, (_, y) => Array.from({ length: 32 }, (_, x) => { const l = g.labels[y * 32 + x]; if (l < 0) return '.'; const id = g.specs[l].id; return id === 'limb' ? '#' : id === 'string' ? '|' : id === 'head' ? 'A' : id === 'shaft' ? '/' : id === 'fletch' ? 'v' : id === 'grip' ? '=' : 'o'; }).join('')); };
const cols = [0, 1, 2, 3].map(show);
console.log('\n  standby' + ' '.repeat(26) + 'pulling_0' + ' '.repeat(24) + 'pulling_1' + ' '.repeat(24) + 'pulling_2');
for (let y = 0; y < 32; y++) console.log('  ' + cols.map((c) => c[y]).join(' '));
process.exit(fails ? 1 : 0);
