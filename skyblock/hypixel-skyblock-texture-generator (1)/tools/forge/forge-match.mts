/**
 * VERIFICATION LOOP
 *  1. geometry audit: every archetype × every form × random knobs × 16/32/64
 *  2. essence match: render the whole catalogue in each pack style, measure it
 *     with the SAME analyser used on the 16k real textures, compare medians.
 */
import { ARCHES, type ArchId, type Design } from '../src/lib/forge-archetypes';
import { forge, buildGeo } from '../src/lib/forge-engine';
import { measure, type Metrics } from '../src/lib/forge-measure';
import { ESSENCE, PRESETS, colorTarget, type PackId } from '../src/lib/forge-essence';
import { CATALOG } from '../src/lib/forge-catalog';
import { hash2 } from '../src/lib/forge-raster';

const mode = process.argv[2] ?? 'all';
let fails = 0;

function comps(body: Uint8Array, n: number) {
  const seen = new Uint8Array(n * n);
  let c = 0;
  for (let s = 0; s < n * n; s++) {
    if (!body[s] || seen[s]) continue;
    c++;
    const st = [s];
    seen[s] = 1;
    while (st.length) {
      const j = st.pop()!;
      const x = j % n, y = (j / n) | 0;
      for (const [xx, yy] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]]) {
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const t = yy * n + xx;
        if (body[t] && !seen[t]) { seen[t] = 1; st.push(t); }
      }
    }
  }
  return c;
}

function explain(g: { labels: Int16Array; specs: { id: string }[] }, n: number) {
  const seen = new Int16Array(n * n).fill(-1);
  const groups: string[] = [];
  for (let s0 = 0; s0 < n * n; s0++) {
    if (g.labels[s0] < 0 || seen[s0] >= 0) continue;
    const ids = new Set<string>();
    const st = [s0];
    seen[s0] = groups.length;
    let size = 0;
    while (st.length) {
      const j = st.pop()!;
      size++;
      ids.add(g.specs[g.labels[j]].id);
      const x = j % n, y = (j / n) | 0;
      for (const [xx, yy] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]]) {
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const t = yy * n + xx;
        if (g.labels[t] >= 0 && seen[t] < 0) { seen[t] = groups.length; st.push(t); }
      }
    }
    groups.push(`{${[...ids].join('+')}:${size}px}`);
  }
  return groups.join(' ');
}

if (mode === 'all' || mode === 'geo') {
  const issues: string[] = [];
  let cases = 0;
  const t0 = Date.now();
  for (const id of Object.keys(ARCHES) as ArchId[]) {
    const A = ARCHES[id];
    for (let a = 0; a < A.A.length; a++)
      for (let b = 0; b < A.B.length; b++)
        for (let r = 0; r < 4; r++) {
          const adornments: NonNullable<Design['adornment']>[] = ['none', 'filigree', 'crest', 'petals', 'thorns', 'sigil', 'orbitals'];
          const des: Design = {
            arch: id, a, b,
            len: hash2(a, b * 7 + r, 1), wid: hash2(a, b * 7 + r, 2), orn: hash2(a, b * 7 + r, 3),
            gem: hash2(a, b + r, 4) > 0.5, rune: hash2(a, b + r, 5) > 0.5,
            adornment: adornments[(a * 5 + b * 3 + r) % adornments.length],
            offsetX: [-8, 0, 8, 0][r],
            offsetY: [0, -6, 0, 6][r],
            scaleX: [1.1, 0.82, 1.24, 0.94][r],
            scaleY: [0.9, 1.18, 0.78, 1.12][r],
            rotation: [-18, 0, 14, 32][r],
            flipX: r === 2,
            flipY: r === 3,
            autoFit: true,
            coreMode: r,
          };
          for (const n of [16, 32, 64] as const) {
            cases++;
            const g = buildGeo(des, n);
            const body = new Uint8Array(n * n);
            let x0 = n, y0 = n, x1 = -1, y1 = -1;
            for (let i = 0; i < n * n; i++)
              if (g.labels[i] >= 0) {
                // Detached thin aura/rune particles are deliberate visual
                // ornamentation. The structural silhouette itself must remain
                // one connected component.
                if (!g.specs[g.labels[i]].thin) body[i] = 1;
                const x = i % n, y = (i / n) | 0;
                x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
              }
            const c = comps(body, n);
            const ext = Math.max(x1 - x0 + 1, y1 - y0 + 1);
            const edge = g.bounds.clipped || x0 < 1 || y0 < 1 || x1 > n - 2 || y1 > n - 2;
            const visible = new Set(Array.from(g.labels).filter((l) => l >= 0)).size;
            const tag = `${id}[A${a}:${A.A[a]} B${b}:${A.B[b]} r${r}]@${n}`;
            if (c !== 1) issues.push(`${tag}: ${c} components ${explain(g, n)}`);
            if (ext < (n - 2) * 0.64) issues.push(`${tag}: extent ${ext}/${n - 2}`);
            if (edge) issues.push(`${tag}: body touches the 1px outline margin (bounds ${JSON.stringify(g.bounds)})`);
            if (visible < Math.min(2, g.specs.length)) issues.push(`${tag}: only ${visible} part(s) visible`);
          }
        }
  }
  console.log(`GEOMETRY: ${cases} cases in ${Date.now() - t0}ms — ${issues.length ? `✘ ${issues.length} issue(s)` : '✔ all pass'}`);
  issues.slice(0, 40).forEach((s) => console.log('  -', s));
  fails += issues.length;
}

if (mode === 'all' || mode === 'match') {
  const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const rows: string[] = [];
  let bad = 0;
  for (const pid of Object.keys(PRESETS) as PackId[]) {
    const e = ESSENCE[pid];
    const st = PRESETS[pid];
    const n = e.nativeRes;
    const ms: Metrics[] = [];
    for (const it of CATALOG) {
      const fg = forge({ n, design: it.design, mats: it.mats, style: st, light: 135, anim: 'none', seed: 7 });
      const mm = measure(fg.frames[0], n);
      if (mm) ms.push(mm);
    }
    const get = (f: (m: Metrics) => number) => med(ms.map(f));
    const withRamp = ms.filter((m) => m.rampLen >= 3);
    const checks: [string, number, number, number][] = [
      ['colors', get((m) => m.colors), colorTarget(e, n), Math.max(2, colorTarget(e, n) * 0.25)],
      ['rampLen', med(withRamp.map((m) => m.rampLen)), e.rampLen, Math.max(1, e.rampLen * 0.25)],
      ['contrast', get((m) => m.contrast), e.contrast, 0.08],
      ['Lmin', get((m) => m.Lmin), e.L[0], 0.07],
      ['Lmax', get((m) => m.Lmax), e.L[1], 0.07],
      ['darker', get((m) => m.darker), e.darker, 0.12],
      ['black', get((m) => m.black), e.black, 0.02],
      ['colored', get((m) => m.colored), e.colored, 0.15],
      ['lightShare', ms.filter((m) => m.lightTL > 0.01).length / ms.length, e.lightShare, 0.15],
      ['lightDL', get((m) => m.lightTL), e.lightDL, 0.035],
      ['warm', med(withRamp.map((m) => m.warm)), e.warm, 4],
      ['iso', get((m) => m.iso), e.iso, 0.1],
      ['partial', get((m) => m.partial), e.partial, 0.01],
    ];
    const line = checks.map(([k, v, t, tol]) => {
      const ok = Math.abs(v - t) <= tol;
      if (!ok) bad++;
      return `${ok ? '✓' : '✘'}${k} ${v.toFixed(k === 'colors' || k === 'rampLen' ? 0 : 3)}/${t}`;
    });
    const score = checks.filter(([, v, t, tol]) => Math.abs(v - t) <= tol).length;
    rows.push(`${e.name.padEnd(22)} @${n}  ${score}/${checks.length}  ${line.join('  ')}`);
  }
  console.log(`\nESSENCE MATCH (catalogue of ${CATALOG.length} × 5 packs, same analyser as the 16k real icons):`);
  rows.forEach((r) => console.log(r));
  console.log(bad ? `✘ ${bad} metric(s) outside tolerance` : '✔ every metric inside tolerance');
  fails += bad;
}
process.exit(fails ? 1 : 0);
