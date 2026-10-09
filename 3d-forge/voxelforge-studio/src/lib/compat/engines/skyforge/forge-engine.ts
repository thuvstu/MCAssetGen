/**
 * PIXEL-ART ENGINE — geometry → labelled parts → height field → mixed
 * directional / form lighting → per-material quantised ramps → pixel-art rules
 * (selective outline, lit rim, contact shadow, orphan cleanup, glints) →
 * animation frames → palette reduced to the measured colour budget.
 */
import { newMask, distTo, closing, closeSpecks, hash2, type Mask } from './forge-raster';
import { ARCHES, Pen, embellish, transformPoint, type Design, type PartSpec, type Slot, type PartTransform } from './forge-archetypes';
import { buildRamp, type MatId, type Ramp, type Kind } from './forge-materials';
import { rgbToOklab } from './forge-color';
import type { StyleParams } from './forge-essence';
import { normalizeDesign } from './forge-designOps';
import { gradField, DEFAULT_GRAD, type PartBox } from './forge-gradient';

export type Anim =
  | 'none' | 'shimmer' | 'pulse' | 'flow' | 'twinkle'
  | 'flame' | 'embers' | 'orbit' | 'arcane' | 'lightning' | 'frost' | 'aurora' | 'water'
  /** mechanical / modern motion */
  | 'chain' | 'muzzle' | 'charge' | 'drip'
  /** arcane / special effects */
  | 'shockwave' | 'enchant' | 'smoke' | 'glitch' | 'scan' | 'sparks';
export type Mats = Record<Slot, MatId>;
export type Motion = { intensity: number; speed: number; density: number };
export type ForgeInput = {
  n: 16 | 32 | 64;
  design: Design;
  mats: Mats;
  style: StyleParams;
  light: number;
  anim: Anim;
  seed: number;
  motion?: Partial<Motion>;
};
export type Bounds = { x: number; y: number; w: number; h: number; clipped: boolean };
export type Forged = { n: number; frames: Uint8ClampedArray[]; frametime: number; palette: number; bounds: Bounds };

type Geo = {
  labels: Int16Array;
  specs: PartSpec[];
  details: { part: number; delta: number; cov: Float32Array }[];
  seeds: (number[][] | null)[];
  bounds: Bounds;
};
type Fit = { cx: number; cy: number; f: number };

const geoCache = new Map<string, Geo>();

function fitFor(specs: PartSpec[], design: Design): Fit {
  const N = 128;
  const m = newMask(N);
  for (const s of specs) s.draw(new Pen(m, N, 32, 32, 1, design.partTransforms?.[s.id]));
  let x0 = N, y0 = N, x1 = -1, y1 = -1;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (m[y * N + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return { cx: 32, cy: 32, f: 1 };
  const bx0 = x0 / 2, bx1 = (x1 + 1) / 2, by0 = y0 / 2, by1 = (y1 + 1) / 2;
  const w = bx1 - bx0;
  const h = by1 - by0;
  const gx = (design.scaleX ?? 1) * (design.flipX ? -1 : 1);
  const gy = (design.scaleY ?? 1) * (design.flipY ? -1 : 1);
  const a = ((design.rotation ?? 0) * Math.PI) / 180;
  const ca = Math.abs(Math.cos(a));
  const sa = Math.abs(Math.sin(a));
  const ex = ca * Math.abs(gx) * w + sa * Math.abs(gy) * h;
  const ey = sa * Math.abs(gx) * w + ca * Math.abs(gy) * h;
  const ox = Math.abs(design.offsetX ?? 0);
  const oy = Math.abs(design.offsetY ?? 0);
  const margin = 3.2;
  const availW = Math.max(1, 64 - margin * 2 - ox * 2);
  const availH = Math.max(1, 64 - margin * 2 - oy * 2);
  // Reserve a clear rim for the 1px outline and the optional adornment language.
  // The remaining 84% is intentionally consistent with the measured SkyBlock
  // icon coverage, while requested scale is still honoured until it would clip.
  const candidate = Math.min(availW / Math.max(1, ex), availH / Math.max(1, ey)) * 0.84;
  const f = design.autoFit === false ? 1 : candidate;
  return { cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2, f };
}

function rasterize(specs: PartSpec[], fit: Fit, n: number, design: Design) {
  const N = n * 4;
  const lab = new Int16Array(N * N).fill(-1);
  const pen = (m: Mask, part?: PartTransform) => new Pen(m, N, fit.cx, fit.cy, fit.f, part, design);
  const detailM: { part: number; delta: number; m: Mask }[] = [];
  specs.forEach((s, pi) => {
    const m = newMask(N);
    s.draw(pen(m, design.partTransforms?.[s.id]));
    if (s.cut) {
      const c = newMask(N);
      s.cut(pen(c, design.partTransforms?.[s.id]));
      for (let i = 0; i < N * N; i++) if (c[i]) m[i] = 0;
    }
    for (let i = 0; i < N * N; i++) if (m[i]) lab[i] = pi;
    s.details?.forEach((d) => {
      const dm = newMask(N);
      d.draw(pen(dm, design.partTransforms?.[s.id]));
      detailM.push({ part: pi, delta: d.delta, m: dm });
    });
  });
  const Pn = specs.length;
  const labels = new Int16Array(n * n).fill(-1);
  const cnt = new Int16Array(Pn);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      cnt.fill(0);
      let tot = 0;
      for (let dy = 0; dy < 4; dy++)
        for (let dx = 0; dx < 4; dx++) {
          const l = lab[(y * 4 + dy) * N + x * 4 + dx];
          if (l >= 0) {
            cnt[l]++;
            tot++;
          }
        }
      let best = -1;
      for (let p = Pn - 1; p >= 0; p--) if (specs[p].thin && cnt[p] >= 4 && (best < 0 || cnt[p] > cnt[best])) best = p;
      if (best < 0 && tot >= 8) for (let p = Pn - 1; p >= 0; p--) if (cnt[p] > 0 && (best < 0 || cnt[p] > cnt[best])) best = p;
      labels[y * n + x] = best;
    }
  // Merging parts makes their touching pixels share one height field and one
  // palette ramp. It is intentionally explicit; separate parts remain editable.
  const redirect = new Int16Array(Pn);
  for (let p = 0; p < Pn; p++) redirect[p] = p;
  for (const group of design.mergeParts ?? []) {
    const members = group.flatMap((id) => specs.map((s, i) => (s.id === id ? i : -1)).filter((i) => i >= 0));
    if (members.length < 2) continue;
    const root = Math.min(...members);
    for (const p of members) redirect[p] = root;
  }
  for (let i = 0; i < labels.length; i++) if (labels[i] >= 0) labels[i] = redirect[labels[i]];
  const body = newMask(n);
  for (let i = 0; i < n * n; i++) body[i] = labels[i] >= 0 ? 1 : 0;
  closing(body, n);
  closeSpecks(body, n, Math.max(2, Math.round(n / 16)));
  for (let pass = 0; pass < 4; pass++)
    for (let i = 0; i < n * n; i++) {
      if (!body[i] || labels[i] >= 0) continue;
      const x = i % n, y = (i / n) | 0;
      const votes = new Map<number, number>();
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
          const l = labels[yy * n + xx];
          if (l >= 0 && !specs[l].thin) votes.set(l, (votes.get(l) ?? 0) + 1);
        }
      let bl = -1, bv = 0;
      votes.forEach((v, l) => { if (v > bv) { bv = v; bl = l; } });
      if (bl < 0)
        for (let dy = -1; dy <= 1 && bl < 0; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < n && yy < n && labels[yy * n + xx] >= 0) { bl = labels[yy * n + xx]; break; }
          }
      if (bl >= 0) labels[i] = bl;
    }
  return { labels, detailM: detailM.map((d) => ({ ...d, part: redirect[d.part] })), N };
}

export function buildGeo(design: Design, n: number): Geo {
  const d = normalizeDesign(design);
  const key = JSON.stringify(d) + '@' + n;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const specs = embellish(ARCHES[d.arch]
    .build(d), d)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.z - b.s.z || a.i - b.i)
    .map((x) => x.s);
  // the fit (scale + centre) always comes from the standby pose, so the four bow
  // draw states — and any future pose variants — share one frame, as in vanilla
  const standby = d.pull ? { ...d, pull: 0 } : d;
  const fitSpecs = d.pull
    ? embellish(ARCHES[d.arch].build(standby), standby).map((s2, i) => ({ s: s2, i })).sort((a, b) => a.s.z - b.s.z || a.i - b.i).map((x) => x.s)
    : specs;
  const fit = fitFor(fitSpecs, d);
  const r = rasterize(specs, fit, n, d);
  const { labels, detailM, N } = r;
  let minX = n, minY = n, maxX = -1, maxY = -1;
  for (let i = 0; i < n * n; i++)
    if (labels[i] >= 0) {
      const x = i % n;
      const y = (i / n) | 0;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  const details = detailM.map((d) => {
    const cov = new Float32Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        let c = 0;
        for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) c += d.m[(y * 4 + dy) * N + x * 4 + dx];
        cov[y * n + x] = c / 16;
      }
    return { part: d.part, delta: d.delta, cov };
  });
  const toN = (x: number, y: number, part: PartTransform): [number, number] => {
    const [px, py] = transformPoint(x, y, part);
    const fx = 32 + (px - fit.cx) * fit.f;
    const fy = 32 + (py - fit.cy) * fit.f;
    const [gx, gy] = transformPoint(fx, fy, d);
    return [n / 2 + (gx - 32) * (n / 64), n / 2 + (gy - 32) * (n / 64)];
  };
  const seeds = specs.map((s) => (s.seeds ? s.seeds.map(([x, y]) => toN(x, y, d.partTransforms?.[s.id] ?? {})) : null));
  const bounds: Bounds = {
    x: maxX < 0 ? 0 : minX,
    y: maxY < 0 ? 0 : minY,
    w: maxX < 0 ? 0 : maxX - minX + 1,
    h: maxY < 0 ? 0 : maxY - minY + 1,
    clipped: maxX >= n - 1 || maxY >= n - 1 || minX <= 0 || minY <= 0,
  };
  const geo = { labels, specs, details, seeds, bounds };
  if (geoCache.size > 200) geoCache.clear();
  geoCache.set(key, geo);
  return geo;
}

/** Ward-style merge in OKLab down to the colour budget; representatives are real ramp colours. */
function reducePalette(frames: Uint8ClampedArray[], budget: number) {
  const w = new Map<number, number>();
  frames.forEach((fr, fi) => {
    for (let i = 0; i < fr.length; i += 4)
      if (fr[i + 3]) {
        const k = (fr[i] << 16) | (fr[i + 1] << 8) | fr[i + 2];
        w.set(k, (w.get(k) ?? 0) + (fi === 0 ? 1 : 0.2));
      }
  });
  if (w.size <= budget) return;
  type C = { lab: number[]; w: number; ks: number[] };
  const cl: C[] = [...w].map(([k, wt]) => {
    const lab = rgbToOklab((k >> 16) & 255, (k >> 8) & 255, k & 255);
    // keep glints & outlines alive: the brightest and darkest shades carry the
    // silhouette, so they get a heavy weight and are never the cheapest merge
    const extreme = lab[0] > 0.9 ? 8 : lab[0] < 0.26 ? 10 : 0;
    return { lab, w: wt + extreme, ks: [k] };
  });
  while (cl.length > budget) {
    let bi = 0, bj = 1, bc = Infinity;
    for (let i = 0; i < cl.length; i++)
      for (let j = i + 1; j < cl.length; j++) {
        const a = cl[i].lab, b = cl[j].lab;
        const d2 = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
        const c = ((cl[i].w * cl[j].w) / (cl[i].w + cl[j].w)) * d2;
        if (c < bc) { bc = c; bi = i; bj = j; }
      }
    const A = cl[bi], B = cl[bj];
    const W = A.w + B.w;
    A.lab = A.lab.map((v, t) => (v * A.w + B.lab[t] * B.w) / W);
    A.w = W;
    A.ks.push(...B.ks);
    cl.splice(bj, 1);
  }
  const rep = new Map<number, number>();
  for (const c of cl) {
    let best = c.ks[0], bw = -1;
    for (const k of c.ks) { const x = w.get(k)!; if (x > bw) { bw = x; best = k; } }
    for (const k of c.ks) rep.set(k, best);
  }
  for (const fr of frames)
    for (let i = 0; i < fr.length; i += 4)
      if (fr[i + 3]) {
        const r = rep.get((fr[i] << 16) | (fr[i + 1] << 8) | fr[i + 2]);
        if (r === undefined) continue;
        fr[i] = (r >> 16) & 255;
        fr[i + 1] = (r >> 8) & 255;
        fr[i + 2] = r & 255;
      }
}

export function forge(inp: ForgeInput): Forged {
  const { n, style } = inp;
  const g = buildGeo(inp.design, n);
  const L = g.labels;
  const size = n * n;
  const Pn = g.specs.length;
  const s4 = n / 16;
  const Kmax = style.ramp[n];
  // gradient lives on the design so an item carries its own mapping; the pack
  // style provides the default when the design has none
  const gspec = inp.design.grad ?? style.grad ?? DEFAULT_GRAD;

  const area = new Int32Array(Pn);
  const boxX = new Float32Array(Pn);
  const boxY = new Float32Array(Pn);
  const boxRX = new Float32Array(Pn);
  const boxRY = new Float32Array(Pn);
  {
    const minX = new Float32Array(Pn).fill(1e9);
    const maxX = new Float32Array(Pn).fill(-1e9);
    const minY = new Float32Array(Pn).fill(1e9);
    const maxY = new Float32Array(Pn).fill(-1e9);
    for (let i = 0; i < size; i++) {
      const p = L[i];
      if (p < 0) continue;
      area[p]++;
      const x = (i % n) + 0.5, y = ((i / n) | 0) + 0.5;
      if (x < minX[p]) minX[p] = x;
      if (x > maxX[p]) maxX[p] = x;
      if (y < minY[p]) minY[p] = y;
      if (y > maxY[p]) maxY[p] = y;
    }
    for (let p = 0; p < Pn; p++) {
      boxX[p] = (minX[p] + maxX[p]) / 2;
      boxY[p] = (minY[p] + maxY[p]) / 2;
      boxRX[p] = Math.max(0.5, (maxX[p] - minX[p]) / 2);
      boxRY[p] = Math.max(0.5, (maxY[p] - minY[p]) / 2);
    }
  }
  // Per-part ramp length: proportional to √area so small parts don't waste
  // budget, but gems/facets always get ≥3 (table / crown / pavilion) and the
  // largest 'main' part always gets the full ramp so the hero surface reads.
  let mainP = -1, mainA = -1;
  g.specs.forEach((s, p) => { if (s.slot === 'main' && area[p] > mainA) { mainA = area[p]; mainP = p; } });
  const K = Array.from(area, (a, p) => {
    const s = g.specs[p];
    if (p === mainP) return Kmax;
    const base = Math.round(Math.sqrt(a) / 1.25);
    const floor = s.prof === 'facet' || s.slot === 'gem' ? 3 : 2;
    return Math.max(floor, Math.min(Kmax, base));
  });
  const ramps: Ramp[] = g.specs.map((s, p) => buildRamp(inp.mats[s.slot], K[p], style));
  const kind: Kind[] = ramps.map((r) => r.kind);

  const dist = new Float32Array(size);
  const dmax = new Float32Array(Pn);
  for (let p = 0; p < Pn; p++) {
    if (!area[p]) continue;
    const notP = newMask(n);
    for (let i = 0; i < size; i++) notP[i] = L[i] === p ? 0 : 1;
    const d = distTo(notP, n);
    for (let i = 0; i < size; i++)
      if (L[i] === p) {
        dist[i] = d[i];
        if (d[i] > dmax[p]) dmax[p] = d[i];
      }
  }

  /**
   * Height profiles — the single most visible quality factor. Each profile is
   * chosen to mimic how real SkyBlock packs shade that kind of part:
   *  blade : a true chisel — flat ridge line, steep bevel toward both edges
   *  cyl   : a rounded rod with a soft core (reads as wrapped grip / haft)
   *  round : a dome, but with a wide flat crown so big discs don't look inflated
   *  flat  : plate armour — flat with a short bevel, so face stays even
   *  facet : handled by Voronoi facet normals below
   *  glow  : radial energy falloff
   */
  const H = new Float32Array(size);
  const form = new Float32Array(size);
  const bev = Math.max(1, n / 32);
  for (let i = 0; i < size; i++) {
    const p = L[i];
    if (p < 0) continue;
    const d = dist[i];
    const r = Math.max(1, dmax[p]);
    const t = Math.min(1, d / r);
    const prof = g.specs[p].prof;
    if (prof === 'blade') {
      // chisel: rise quickly to a ridge at ~60% of half-width, flat on top
      const ridge = Math.min(1, t / 0.6);
      H[i] = r * ridge;
      form[i] = 0.3 + 0.7 * ridge;
    } else if (prof === 'flat') {
      const bt = Math.min(1, d / (bev * 1.5));
      H[i] = bev * 1.5 * Math.sin((bt * Math.PI) / 2);
      form[i] = 0.62 + 0.38 * bt;
    } else if (prof === 'glow') {
      H[i] = d;
      form[i] = 1;
    } else if (prof === 'cyl') {
      // half-cylinder: circular cross-section
      H[i] = r * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
      form[i] = 0.28 + 0.72 * Math.pow(H[i] / r, 0.8);
    } else {
      // dome with a flattened crown (superellipse exponent 1.6)
      const u = 1 - t;
      H[i] = r * Math.pow(Math.max(0, 1 - Math.pow(u, 1.6)), 1 / 1.6);
      form[i] = 0.3 + 0.7 * (H[i] / r);
    }
  }

  const th = (inp.light * Math.PI) / 180;
  let lx = Math.cos(th), ly = -Math.sin(th), lz = 0.8;
  const ll = Math.hypot(lx, ly, lz);
  lx /= ll; ly /= ll; lz /= ll;
  const hl = Math.hypot(lx, ly, lz + 1);
  const hx = lx / hl, hy = ly / hl, hz = (lz + 1) / hl;

  const facet = new Int16Array(size).fill(-1);
  const facetN: Record<number, number[][]> = {};
  for (let p = 0; p < Pn; p++) {
    if (g.specs[p].prof !== 'facet' || !area[p]) continue;
    let cx = 0, cy = 0;
    for (let i = 0; i < size; i++) if (L[i] === p) { cx += (i % n) + 0.5; cy += ((i / n) | 0) + 0.5; }
    cx /= area[p]; cy /= area[p];
    let R = 1;
    for (let i = 0; i < size; i++) if (L[i] === p) R = Math.max(R, Math.hypot((i % n) + 0.5 - cx, ((i / n) | 0) + 0.5 - cy));
    let seeds = g.seeds[p];
    if (!seeds || !seeds.length) {
      seeds = [[cx, cy]];
      for (let k = 0; k < 6; k++) seeds.push([cx + Math.cos((k * Math.PI) / 3 + 0.4) * R * 0.55, cy + Math.sin((k * Math.PI) / 3 + 0.4) * R * 0.55]);
    }
    facetN[p] = seeds.map(([sx, sy]) => {
      const vx = (sx - cx) / R, vy = (sy - cy) / R;
      const rad = Math.hypot(vx, vy);
      // central table facet faces the viewer and tilts a hair toward the light
      if (rad < 0.2) {
        const q = Math.hypot(lx * 0.18, ly * 0.18, 1);
        return [(lx * 0.18) / q, (ly * 0.18) / q, 1 / q];
      }
      // crown facets: steeper the further from centre (a cut stone, not a dome)
      const tilt = 0.7 + 0.5 * Math.min(1, rad);
      const q = Math.hypot(vx * tilt, vy * tilt, 0.72);
      return [(vx * tilt) / q, (vy * tilt) / q, 0.72 / q];
    });
    for (let i = 0; i < size; i++) {
      if (L[i] !== p) continue;
      const x = (i % n) + 0.5, y = ((i / n) | 0) + 0.5;
      let best = 0, bd = Infinity;
      seeds.forEach(([sx, sy], k) => { const dd = (x - sx) ** 2 + (y - sy) ** 2; if (dd < bd) { bd = dd; best = k; } });
      facet[i] = best;
    }
  }

  const S = new Float32Array(size);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const p = L[i];
      if (p < 0) continue;
      let nx: number, ny: number, nz: number;
      if (facet[i] >= 0) [nx, ny, nz] = facetN[p][facet[i]];
      else {
        // Sobel over the part's own height field. Pixels outside the part
        // clamp to the current height instead of 0, so part borders do not
        // produce a fake cliff — the outline ring handles the silhouette.
        const h0 = H[i];
        const h = (xx: number, yy: number) => (xx < 0 || yy < 0 || xx >= n || yy >= n || L[yy * n + xx] !== p ? h0 * 0.35 : H[yy * n + xx]);
        const gx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) / -8;
        const gy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) / -8;
        const steep = g.specs[p].prof === 'blade' ? 1.6 : g.specs[p].prof === 'flat' ? 1.2 : 1;
        const q = Math.hypot(gx * steep, gy * steep, 1);
        nx = (gx * steep) / q; ny = (gy * steep) / q; nz = 1 / q;
      }
      const dif = Math.max(0, nx * lx + ny * ly + nz * lz);
      const dir = facet[i] >= 0 ? Math.max(style.dir, style.facetDir ?? 0.3) : style.dir;
      const shape = facet[i] >= 0 ? 0.75 : form[i] * 0.78;
      let s = style.ambient + style.light * (dir * dif + (1 - dir) * shape);
      const sp = Math.max(0, nx * hx + ny * hy + nz * hz);
      const ks = (style.spec ?? 1) * ramps[p].sheen;
      // metals: tight bright lobe; gems: broader, softer; stone: a faint wide sheen
      if (kind[p] === 'metal') s += 0.26 * ks * Math.pow(sp, 18);
      else if (kind[p] === 'gem') s += 0.2 * ks * Math.pow(sp, 9);
      else if (kind[p] === 'stone') s += 0.08 * ks * Math.pow(sp, 6);
      if (kind[p] === 'energy' || g.specs[p].prof === 'glow') {
        // energy: hot white-ish core, saturated mid, dim rim — plus a subtle
        // cross-hatch so the glow reads as "magical" rather than a flat gradient
        const tt = dist[i] / Math.max(1, dmax[p]);
        const core = Math.pow(tt, 0.55);
        const hatch = ((x + y) & 1) && tt > 0.25 && tt < 0.75 ? 0.06 : 0;
        s = 0.3 + 0.72 * core + hatch + 0.06 * dif;
      }
      s += style.tl * 2 * (((x + 0.5) / n - 0.5) * lx + ((y + 0.5) / n - 0.5) * ly);
      let shade = 0.5 + (s - 0.56) * style.contrast;
      // gradient field: how the ramp is *mapped* across the part, independent
      // of where the light comes from. Blended after lighting so the two read
      // as separate layers, the way a painter layers a wash over a model.
      const gm = style.gradMix ?? (gspec.mode === 'shaded' ? 0 : 0.8);
      if (gm > 0 && gspec.mode !== 'shaded') {
        const box: PartBox = { cx: boxX[p], cy: boxY[p], rx: boxRX[p], ry: boxRY[p] };
        const gf = gradField(x, y, n, gspec, box, dist[i] / Math.max(1, dmax[p]));
        shade += (gf - 0.5) * gspec.contrast * gm;
      }
      S[i] = shade;
    }

  /**
   * Quantise with a 4×4 ordered (Bayer) threshold at the band boundaries.
   * This is the classic pixel-art technique for making a 4–5 colour ramp read
   * as a smooth curved surface: only pixels whose fractional position falls
   * within `ditherBand` of a step get dithered, so flat areas stay clean and
   * only the transitions interlock. Faceted gems are left crisp.
   */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const ditherBand = style.dither ?? 0.28;
  const idx = new Int16Array(size).fill(-1);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const p = L[i];
      if (p < 0) continue;
      const v = S[i] * K[p];
      let q = Math.floor(v);
      const frac = v - q;
      if (facet[i] < 0 && kind[p] !== 'energy' && ditherBand > 0) {
        const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        const lo = 0.5 - ditherBand / 2;
        const hi = 0.5 + ditherBand / 2;
        if (frac > lo && frac < hi) q = (frac - lo) / (hi - lo) > th ? q + 1 : q;
        else if (frac >= hi) q += 1;
      } else if (frac >= 0.5) q += 1;
      idx[i] = Math.max(0, Math.min(K[p] - 1, q));
    }

  // orphan cleanup — a lone pixel more than 1 step away from all 4 neighbours
  // is noise; a pixel exactly 1 step off is a legitimate dither checker and kept.
  const cleaned = Int16Array.from(idx);
  for (let y = 1; y < n - 1; y++)
    for (let x = 1; x < n - 1; x++) {
      const i = y * n + x;
      const p = L[i];
      if (p < 0 || facet[i] >= 0) continue;
      const nb = [i - 1, i + 1, i - n, i + n];
      if (nb.some((j) => L[j] !== p)) continue;
      const v = nb.map((j) => idx[j]);
      if (v.every((q) => Math.abs(q - idx[i]) >= 2)) {
        const tally = new Map<number, number>();
        v.forEach((q) => tally.set(q, (tally.get(q) ?? 0) + 1));
        tally.forEach((c, q) => { if (c >= 3) cleaned[i] = q; });
      }
    }
  idx.set(cleaned);
  const add = (i: number, dlt: number) => { idx[i] = Math.max(0, Math.min(K[L[i]] - 1, idx[i] + dlt)); };

  for (const d of g.details) for (let i = 0; i < size; i++) if (L[i] === d.part && d.cov[i] >= 0.35) add(i, d.delta);

  const det = style.detail;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const p = L[i];
      if (p < 0) continue;
      const sp = g.specs[p];
      const [ax, ay] = sp.axis ?? [Math.SQRT1_2, -Math.SQRT1_2];
      const u = x * ax + y * ay;
      const v = -x * ay + y * ax;
      switch (sp.pat) {
        case 'wrap': {
          // leather wrap: diagonal windings, each with a 1px shadow seam on the
          // lower edge and a 1px highlight on the upper edge of the winding
          const period = Math.max(2, s4 * 1.6);
          const ph = ((u + v * 0.55) / period) % 1;
          const f = ph < 0 ? ph + 1 : ph;
          if (f < 0.18) add(i, -1);
          else if (f > 0.62 && f < 0.78 && n >= 32) add(i, 1);
          break;
        }
        case 'grain': if (hash2(Math.floor(v / s4 + 0.5), Math.floor(u / (3 * s4)), inp.seed) < 0.22 * det) add(i, -1); break;
        case 'spiral': if (Math.floor((u + v * 0.9) / (1.6 * s4)) & 1) add(i, -1); break;
        case 'pages': if (y % Math.max(2, Math.round(2 * s4)) === 0) add(i, -1); break;
        case 'rivets': {
          // domed rivet: bright crown pixel, dark shadow pixel diagonally below-right
          const c = Math.max(4, Math.round(6 * s4));
          const rx = x % c, ry = y % c;
          if (dist[i] >= 2) {
            if (rx === 2 && ry === 2) idx[i] = K[p] - 1;
            else if (n >= 32 && ((rx === 3 && ry === 2) || (rx === 2 && ry === 3))) add(i, -1);
            else if (rx === 3 && ry === 3) add(i, -2);
          }
          break;
        }
        case 'scales': {
          // overlapping scales: each scale has a dark lower arc and a lit crown
          const c = Math.max(3, Math.round(3 * s4));
          const row = Math.floor(y / c);
          const lx2 = (x + (row % 2) * Math.floor(c / 2)) % c;
          const ly2 = y % c;
          const cx = (c - 1) / 2;
          const arc = Math.abs(lx2 - cx) / Math.max(1, cx);
          if (ly2 === c - 1 || (ly2 === c - 2 && arc > 0.6)) add(i, -1);
          else if (ly2 === 0 && arc < 0.4 && n >= 32) add(i, 1);
          break;
        }
        case 'speckle': if (hash2(x, y, inp.seed + 3) < 0.12 * det) add(i, hash2(y, x, inp.seed) < 0.5 ? -1 : 1); break;
        case 'teeth': {
          // chain links: a repeating bright/dark pair running along the axis
          const c = Math.max(2, Math.round(2.4 * s4));
          const f = ((u % c) + c) % c;
          if (f < 1) add(i, 1);
          else if (f < 2) add(i, -1);
          break;
        }
        case 'vents': {
          // louvre slots: dark slot with a lit lip above it, grouped in a block
          const c = Math.max(3, Math.round(3 * s4));
          const f = ((v % c) + c) % c;
          if (dist[i] >= 1.5) {
            if (f < 1) add(i, -2);
            else if (f < 1.9) add(i, 1);
          }
          break;
        }
        case 'circuit': {
          // etched traces: axis-aligned runs with occasional via pads
          const gx2 = Math.floor(u / Math.max(2, 2.6 * s4));
          const gy2 = Math.floor(v / Math.max(2, 2.6 * s4));
          const run = hash2(gx2, gy2, inp.seed + 71) < 0.45;
          const onLine = ((v % Math.max(2, Math.round(2.6 * s4))) + 99) % Math.max(2, Math.round(2.6 * s4)) < 1;
          if (run && onLine) add(i, 1);
          else if (run && hash2(gx2 * 3, gy2 * 5, inp.seed + 72) < 0.1) add(i, -1);
          break;
        }
        case 'knurl': {
          // diamond knurling on grips — a fine diagonal cross-hatch
          const c = Math.max(2, Math.round(1.8 * s4));
          const a1 = Math.floor((u + v) / c) & 1;
          const b1 = Math.floor((u - v) / c) & 1;
          if (a1 && b1) add(i, 1);
          else if (!a1 && !b1) add(i, -1);
          break;
        }
        case 'veins': {
          // pulsing organic veins: branching dark lines, denser near the spine
          const wob = v + Math.sin(u * 0.42 + hash2(p, 1, inp.seed) * 6.3) * 2.6;
          const c = Math.max(3, 3.4 * s4);
          const f = ((wob % c) + c) % c;
          if (f < 1 && hash2(Math.floor(wob / c), Math.floor(u / (3 * s4)), inp.seed + 81) < 0.8) add(i, -1);
          break;
        }
        case 'bone': {
          // bone: lengthwise striations plus pitted texture
          const c = Math.max(2, Math.round(2.6 * s4));
          if (((Math.floor(v / c) & 1) === 0) && hash2(Math.floor(v / c), Math.floor(u / (4 * s4)), inp.seed + 91) < 0.5) add(i, -1);
          if (hash2(x * 5, y * 3, inp.seed + 92) < 0.05 * det) add(i, -1);
          break;
        }
      }
      if (kind[p] === 'stone' && hash2(x, y, inp.seed + 9) < 0.1 * det) add(i, -1);
      if (kind[p] === 'wood' && !sp.pat && hash2(Math.floor(v / s4), Math.floor(u / (3 * s4)), inp.seed) < 0.2 * det) add(i, -1);

      /**
       * Mid-frequency micro-detail — only at 64px, where a 16px-style surface
       * would look empty. Each kind gets the texture a hand-painter would add
       * at this scale, kept to ±1 step and only inside the part (dist ≥ 2) so
       * it never fights the outline or the bevel.
       */
      if (n >= 64 && det > 0.4 && dist[i] >= 2 && facet[i] < 0 && sp.prof !== 'glow') {
        const microAmt = (det - 0.4) / 0.6;
        if (kind[p] === 'metal' && !sp.pat) {
          // hammer / planish marks: sparse soft dents, each a 2px dark + 1px light pair
          const cell = 7;
          const cx0 = Math.floor(x / cell), cy0 = Math.floor(y / cell);
          const hx0 = cx0 * cell + Math.floor(hash2(cx0, cy0, inp.seed + 21) * (cell - 2)) + 1;
          const hy0 = cy0 * cell + Math.floor(hash2(cy0, cx0, inp.seed + 22) * (cell - 2)) + 1;
          if (hash2(cx0, cy0, inp.seed + 23) < 0.55 * microAmt) {
            if (x === hx0 && y === hy0) add(i, -1);
            else if (x === hx0 + 1 && y === hy0) add(i, -1);
            else if (x === hx0 - 1 && y === hy0 - 1) add(i, 1);
          }
        } else if (kind[p] === 'wood') {
          // growth-ring arcs: thin dark lines following the part axis with slow wobble
          const ring = (v + Math.sin(u * 0.18 + hash2(p, 0, inp.seed) * 6) * 1.8) / 3.2;
          const f = ring - Math.floor(ring);
          if (f < 0.16 && hash2(Math.floor(ring), Math.floor(u / 9), inp.seed + 31) < 0.85 * microAmt) add(i, -1);
        } else if (kind[p] === 'cloth' || kind[p] === 'string') {
          // weave: a faint 2px checker, very sparse so it reads as fabric not noise
          if (((x >> 1) + (y >> 1)) & 1 && hash2(x >> 1, y >> 1, inp.seed + 41) < 0.35 * microAmt) add(i, -1);
        } else if (kind[p] === 'bone') {
          // porous pits
          if (hash2(x, y, inp.seed + 51) < 0.07 * microAmt) add(i, -1);
        } else if (kind[p] === 'stone') {
          // flecks: occasional bright mineral speck
          if (hash2(x * 7, y * 3, inp.seed + 61) < 0.03 * microAmt) add(i, 1);
        }
      }
      // surface grain — the measured "isolated pixel" rate of each pack
      if (kind[p] !== 'energy' && sp.prof !== 'glow' && facet[i] < 0 && hash2(x * 3, y * 7, inp.seed + 5) < style.noise) add(i, hash2(x, y * 5, inp.seed) < 0.5 ? -1 : 1);
    }

  // lit rim for metal/gem + contact shadow under higher parts
  const dxl = lx < -0.2 ? -1 : lx > 0.2 ? 1 : 0;
  const dyl = ly < -0.2 ? -1 : ly > 0.2 ? 1 : 0;
  const inBody = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && L[y * n + x] >= 0;
  const base = Int16Array.from(idx);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const p = L[i];
      if (p < 0 || g.specs[p].prof === 'glow') continue;
      let v = base[i];
      const litEdge = (dxl && !inBody(x + dxl, y)) || (dyl && !inBody(x, y + dyl));
      if (litEdge && style.rim > 0 && (kind[p] === 'metal' || kind[p] === 'gem')) v += style.rim;
      const tx = x + dxl, ty = y + dyl;
      if (inBody(tx, ty)) {
        const q = L[ty * n + tx];
        if (q !== p && g.specs[q].z > g.specs[p].z && !g.specs[q].thin) v -= style.contact ?? 1;
      }
      // Material seam ink: where this (lower) part touches a different non-thin
      // part, drop one step along the shared edge. This is the dark hairline
      // every hand-drawn pack uses between blade/guard, gem/bezel, cuff/boot.
      const ink = style.seamInk ?? 1;
      if (ink > 0 && !g.specs[p].thin) {
        let seam = false;
        for (const [sx, sy] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (!inBody(sx, sy)) continue;
          const q = L[sy * n + sx];
          if (q !== p && !g.specs[q].thin && g.specs[q].z >= g.specs[p].z && g.specs[q].prof !== 'glow') { seam = true; break; }
        }
        if (seam) v -= ink;
      }
      idx[i] = Math.max(0, Math.min(K[p] - 1, v));
    }

  /**
   * Pixel-scale ambient occlusion. Count how many of the 8 neighbours belong to
   * a *higher-z* part or lie outside the body. A pixel tucked in a concave
   * corner (guard meets blade, bezel meets gem) has many such neighbours and
   * drops a step; open surfaces are untouched. This is cheap and reads as
   * "hand-painted depth" at every resolution.
   */
  if ((style.ao ?? 1) > 0)
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const i = y * n + x;
        const p = L[i];
        if (p < 0 || g.specs[p].prof === 'glow' || g.specs[p].thin) continue;
        let occ = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
            const q = L[yy * n + xx];
            if (q >= 0 && q !== p && g.specs[q].z > g.specs[p].z && !g.specs[q].thin) occ++;
          }
        // ≥3 higher neighbours = genuine concave corner, not a straight seam
        if (occ >= 3) idx[i] = Math.max(0, idx[i] - Math.round(style.ao ?? 1));
      }

  /**
   * Blade edge treatment. A chisel blade read at pixel scale has three bands:
   * a bright cutting edge (1px in from the outline), the bevel slope, and a
   * dark ridge/fuller line down the spine. Applied only to prof 'blade' parts
   * of metal/gem kind. The lit side gets the bright edge; the shadow side gets
   * a 1-step drop so the two edges differ — exactly how FurfSky draws swords.
   */
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const p = L[i];
      if (p < 0 || g.specs[p].prof !== 'blade') continue;
      if (!(kind[p] === 'metal' || kind[p] === 'gem')) continue;
      const r = Math.max(1, dmax[p]);
      const d = dist[i];
      // edge band: within ~1px of the silhouette on the lit side
      if (d >= 1 && d < 2 && n >= 32) {
        const [ax, ay] = g.specs[p].axis ?? [Math.SQRT1_2, -Math.SQRT1_2];
        // perpendicular to the blade axis; sign tells which edge we're on
        const px = -ay, py = ax;
        const side = (lx * px + ly * py);
        if (side > 0.15) idx[i] = Math.min(K[p] - 1, idx[i] + 1);
        else if (side < -0.15) idx[i] = Math.max(0, idx[i] - 1);
      } else if (d >= 1 && n < 32) {
        const [ax, ay] = g.specs[p].axis ?? [Math.SQRT1_2, -Math.SQRT1_2];
        const side = lx * -ay + ly * ax;
        if (side > 0.15 && d < 1.5) idx[i] = Math.min(K[p] - 1, idx[i] + 1);
      }
      // spine / fuller: a 1px-ish dark line along the ridge for wide blades
      if (r >= 2.6 && Math.abs(d - r) < 0.55 && n >= 32) idx[i] = Math.max(0, idx[i] - 1);
    }

  const GL = 99;
  if (style.glint)
    for (let p = 0; p < Pn; p++) {
      if (!(kind[p] === 'metal' || kind[p] === 'gem') || area[p] < 5) continue;
      const count = n >= 64 && area[p] > 400 ? 2 : 1;
      const used: number[] = [];
      for (let c = 0; c < count; c++) {
        let bi = -1, bs = -Infinity;
        for (let i = 0; i < size; i++) {
          if (L[i] !== p || dist[i] < 1) continue;
          // prefer pixels that are bright AND near (not on) the lit silhouette
          // edge — that is where a highlight physically sits on a bevel
          const edgeBias = dist[i] <= 2.5 ? 0.12 : 0;
          const score = S[i] + edgeBias;
          if (score > bs && used.every((u) => Math.abs((u % n) - (i % n)) + Math.abs(((u / n) | 0) - ((i / n) | 0)) > n / 6)) { bs = score; bi = i; }
        }
        if (bi < 0) break;
        used.push(bi);
        idx[bi] = GL;
        const bx = bi % n, by = (bi / n) | 0;
        const put = (xx: number, yy: number, v: number) => {
          if (xx < 0 || yy < 0 || xx >= n || yy >= n) return;
          const j = yy * n + xx;
          if (L[j] === p && idx[j] !== GL) idx[j] = v;
        };
        if (kind[p] === 'gem' && n >= 32) {
          // four-point star sparkle on gems
          put(bx - 1, by, GL); put(bx + 1, by, GL); put(bx, by - 1, GL); put(bx, by + 1, GL);
          if (n >= 64) { put(bx - 2, by, K[p] - 1); put(bx + 2, by, K[p] - 1); put(bx, by - 2, K[p] - 1); put(bx, by + 2, K[p] - 1); }
        } else if (n >= 32) {
          // metal: a short diagonal streak toward the light, plus a bright halo
          const sx = lx > 0 ? -1 : 1, sy = ly > 0 ? -1 : 1;
          put(bx + sx, by + sy, GL);
          if (n >= 64) put(bx + 2 * sx, by + 2 * sy, K[p] - 1);
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(bx + dx, by + dy, K[p] - 1);
        }
      }
    }

  // ---- selective outline ring ----
  // Each transparent pixel adjacent to the body becomes an outline pixel whose
  // colour is derived from the *dominant* neighbouring part (vote over the 4
  // cardinals, falling back to diagonals so outside corners are filled and the
  // silhouette reads 8-connected — the "sealed" look every real pack has).
  const ringCol: (number[] | null)[] = new Array(size).fill(null);
  const CARD: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const DIAG4: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (L[i] >= 0) continue;
      const votes = new Map<number, { count: number; sumIdx: number; litDot: number }>();
      let cardinalHit = false;
      for (const [dx, dy] of CARD) {
        const bx = x + dx, by = y + dy;
        if (!inBody(bx, by)) continue;
        cardinalHit = true;
        const b = by * n + bx;
        const p = L[b];
        const v = votes.get(p) ?? { count: 0, sumIdx: 0, litDot: 0 };
        v.count++;
        v.sumIdx += idx[b] === GL ? K[p] - 1 : idx[b];
        v.litDot += (x - bx) * lx + (y - by) * ly;
        votes.set(p, v);
      }
      // outside-corner fill: no cardinal body neighbour but ≥2 diagonal ones
      if (!cardinalHit) {
        let diagCount = 0;
        for (const [dx, dy] of DIAG4) {
          const bx = x + dx, by = y + dy;
          if (!inBody(bx, by)) continue;
          diagCount++;
          const b = by * n + bx;
          const p = L[b];
          const v = votes.get(p) ?? { count: 0, sumIdx: 0, litDot: 0 };
          v.count++;
          v.sumIdx += idx[b] === GL ? K[p] - 1 : idx[b];
          v.litDot += ((x - bx) * lx + (y - by) * ly) * 0.7;
          votes.set(p, v);
        }
        if (diagCount < 2) continue;
      }
      if (!votes.size) continue;
      let best = -1, bc = -1;
      votes.forEach((v, p) => { if (v.count > bc) { bc = v.count; best = p; } });
      const vv = votes.get(best)!;
      const p = best;
      const r = ramps[p];
      const nb = Math.round(vv.sumIdx / vv.count);
      const lit = vv.litDot / vv.count > 0.3;
      if (lit) {
        const dl = Math.round(Math.max(0, 1 - style.selout) * (K[p] - 1));
        ringCol[i] = dl >= K[p] - 1 ? r.outline : r.cols[Math.max(0, nb - dl)];
      } else if (style.selout <= 1) {
        ringCol[i] = r.outline;
      } else {
        const q = Math.max(0, Math.min(1, 2 - style.selout));
        const t = ((x * 5 + y * 3) % 8) / 8 + 1 / 16;
        ringCol[i] = r.cols[Math.max(0, nb - (t < q ? 1 : 0))];
      }
    }

  const F = inp.anim === 'none' ? 1 : Math.max(2, style.frames);
  const frames: Uint8ClampedArray[] = [];
  const motion: Motion = { intensity: 0.75, speed: 1, density: 0.55, ...inp.motion };
  const effectRamp = ramps[g.specs.findIndex((s) => s.slot === 'aura')]
    ?? ramps[g.specs.findIndex((s) => s.slot === 'gem')]
    ?? ramps[0];
  const fxColor = (level: number) => effectRamp.cols[Math.max(0, Math.min(effectRamp.cols.length - 1, level))];
  const fxSet = (pixels: Uint8ClampedArray, x: number, y: number, level: number, strength = 1) => {
    if (x < 0 || y < 0 || x >= n || y >= n || hash2(x + inp.seed, y + level, 71) > strength) return;
    const i = (y * n + x) * 4;
    const c = fxColor(level);
    pixels[i] = c[0]; pixels[i + 1] = c[1]; pixels[i + 2] = c[2]; pixels[i + 3] = 255;
  };
  const fxLine = (pixels: Uint8ClampedArray, x0: number, y0: number, x1: number, y1: number, level: number) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) fxSet(pixels, Math.round(x0 + (x1 - x0) * s / steps), Math.round(y0 + (y1 - y0) * s / steps), level);
  };
  const bounds = g.bounds;
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const phaseAt = (f: number) => ((f * Math.max(0.05, motion.speed)) % F) / F;
  for (let f = 0; f < F; f++) {
    const cur = Int16Array.from(idx);
    const ph = f / F;
    if (inp.anim !== 'none')
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const i = y * n + x;
          const p = L[i];
          if (p < 0 || cur[i] === GL) continue;
          const sl = g.specs[p].slot;
          const energy = kind[p] === 'energy' || sl === 'aura';
          const clamp = (v: number) => Math.max(0, Math.min(K[p] - 1, v));
          if (inp.anim === 'shimmer' && (sl === 'main' || sl === 'trim' || sl === 'gem')) {
            const dd = Math.abs(x + (n - 1 - y) - (-0.3 * n + ph * 2.6 * n));
            const w = Math.max(1, n / 16) * 1.3;
            if (dd < w * 0.5 && (kind[p] === 'metal' || kind[p] === 'gem')) cur[i] = GL;
            else if (dd < w) cur[i] = clamp(cur[i] + 2);
          } else if (inp.anim === 'pulse' && energy) {
            cur[i] = clamp(cur[i] + Math.round(1.5 * Math.sin(2 * Math.PI * ph) + 0.5));
          } else if (inp.anim === 'flow' && energy) {
            const [ax, ay] = g.specs[p].axis ?? [Math.SQRT1_2, -Math.SQRT1_2];
            const uu = (x * ax + y * ay) / Math.max(1, s4) + ph * 4;
            cur[i] = clamp(cur[i] + ((((uu % 4) + 4) % 4) < 2 ? 1 : -1));
          } else if (inp.anim === 'twinkle' && (kind[p] === 'gem' || kind[p] === 'metal') && cur[i] >= K[p] - 2) {
            if (hash2(x, y, inp.seed * 31 + f) < 0.12) cur[i] = GL;
          } else if (inp.anim === 'aurora' && (sl === 'main' || sl === 'gem' || energy)) {
            const wave = Math.sin((x + y * 0.72) / Math.max(1.6, s4 * 1.4) - ph * Math.PI * 2 * motion.speed);
            if (wave > 0.55 && hash2(x, y, inp.seed + 19) < motion.intensity) cur[i] = clamp(cur[i] + 1);
          } else if (inp.anim === 'frost' && (kind[p] === 'gem' || kind[p] === 'metal' || energy)) {
            const sparkle = hash2(Math.floor(x / Math.max(1, s4)), Math.floor(y / Math.max(1, s4)), inp.seed + f * 17);
            if (sparkle > 0.91 - motion.intensity * 0.12) cur[i] = GL;
          } else if (inp.anim === 'water' && (energy || sl === 'main')) {
            const wave = Math.sin((x * 0.75 + y) / Math.max(1, s4) - ph * Math.PI * 2 * motion.speed);
            if (wave > 0.65) cur[i] = clamp(cur[i] + 1);
          } else if (inp.anim === 'chain') {
            // the chain/teeth band scrolls along the part axis
            const spec = g.specs[p];
            if (spec.pat === 'teeth' || spec.id === 'teeth' || spec.id === 'chain' || spec.id === 'bar') {
              const [ax, ay] = spec.axis ?? [Math.SQRT1_2, -Math.SQRT1_2];
              const uu = (x * ax + y * ay) / Math.max(1, s4 * 1.2) + ph * 4 * motion.speed;
              const f2 = ((uu % 2) + 2) % 2;
              cur[i] = clamp(cur[i] + (f2 < 1 ? 1 : -1));
            }
          } else if (inp.anim === 'charge') {
            // energy builds from the breech to the muzzle, then discharges
            if (energy || kind[p] === 'gem') {
              const [ax, ay] = g.specs[p].axis ?? [Math.SQRT1_2, -Math.SQRT1_2];
              const uu = (x * ax + y * ay) / Math.max(1, n * 0.5);
              const front = ph * 1.5 * motion.speed;
              const hot = uu < front && uu > front - 0.45;
              if (ph > 0.82) cur[i] = GL;
              else if (hot) cur[i] = clamp(cur[i] + 2);
            }
          } else if (inp.anim === 'drip' && energy) {
            const fall = ((y / Math.max(1, n) + ph * motion.speed) % 1);
            if (fall > 0.55 && fall < 0.78) cur[i] = clamp(cur[i] + 1);
          } else if (inp.anim === 'shockwave') {
            // a bright ring sweeping outward from the part centre
            const dx = x - cx, dy = y - cy;
            const rr = Math.hypot(dx / Math.max(1, bounds.w / 2), dy / Math.max(1, bounds.h / 2));
            const front = ((ph * motion.speed) % 1) * 1.35;
            const dd = Math.abs(rr - front);
            if (dd < 0.07) cur[i] = clamp(cur[i] + 2);
            else if (dd < 0.16) cur[i] = clamp(cur[i] + 1);
          } else if (inp.anim === 'enchant') {
            // glyphs rising from the base: a stepped, ramp-lit stair
            const step = ((y / Math.max(1, n) + ph * motion.speed * 1.6) % 1) * 8;
            const isGlyph = ((x >> 1) + Math.floor(step)) % 5 === 0 && hash2(x >> 1, y >> 1, inp.seed + 313) < 0.22;
            if (isGlyph && energy) cur[i] = GL;
            else if (isGlyph) cur[i] = clamp(cur[i] + 1);
          } else if (inp.anim === 'smoke' && (energy || sl === 'main')) {
            const band = (y / Math.max(1, n) + ph * motion.speed * 0.7) % 1;
            const k = Math.sin((x * 0.4 + band * 9) + Math.sin(y * 0.3) * 1.4);
            if (k > 0.72) cur[i] = clamp(cur[i] - 1);
            else if (k < -0.8) cur[i] = clamp(cur[i] + 1);
          } else if (inp.anim === 'glitch') {
            // occasional horizontal tear bands
            const row = Math.floor(y / Math.max(1, Math.round(n / 12)));
            const active = hash2(row, Math.floor(ph * motion.speed * 3), inp.seed + 411) < 0.16 * motion.intensity;
            if (active) cur[i] = clamp(cur[i] + (hash2(x, row, inp.seed + 412) < 0.5 ? 2 : -2));
          } else if (inp.anim === 'scan') {
            const bandY = ((ph * motion.speed) % 1) * (n + 4) - 2;
            const d = Math.abs(y - bandY);
            if (d < 1) cur[i] = clamp(cur[i] + 2);
            else if (d < 2.5 && kind[p] === 'metal') cur[i] = clamp(cur[i] + 1);
          } else if (inp.anim === 'sparks' && (kind[p] === 'metal' || kind[p] === 'gem')) {
            if (hash2(x * 3, y * 5, inp.seed + f * 51) < 0.055 * motion.intensity) cur[i] = GL;
          }
        }
    const out = new Uint8ClampedArray(size * 4);
    const hueDrift = style.hueDrift ?? 0;
    const driftDeg = hueDrift > 0 ? ph * 360 * hueDrift : 0;
    const punch = style.highlightPunch ?? 1;
    for (let i = 0; i < size; i++) {
      const p = L[i];
      const c = p >= 0 ? (cur[i] === GL ? ramps[p].glint : ramps[p].cols[Math.max(0, cur[i])]) : ringCol[i];
      if (!c) continue;
      let r = c[0], g2 = c[1], b = c[2];
      if (punch !== 1) {
        const l = 0.299 * r + 0.587 * g2 + 0.114 * b;
        if (l > 128) {
          const k = 1 + (punch - 1) * ((l - 128) / 127);
          r *= k; g2 *= k; b *= k;
        }
      }
      if (driftDeg !== 0) {
        // YIQ hue rotation — cheap enough to run per pixel per frame
        const a = (driftDeg * Math.PI) / 180;
        const cs = Math.cos(a), sn = Math.sin(a);
        const y0 = 0.299 * r + 0.587 * g2 + 0.114 * b;
        const i0 = 0.596 * r - 0.274 * g2 - 0.322 * b;
        const q0 = 0.211 * r - 0.523 * g2 + 0.312 * b;
        const i1 = i0 * cs - q0 * sn;
        const q1 = i0 * sn + q0 * cs;
        r = y0 + 0.956 * i1 + 0.621 * q1;
        g2 = y0 - 0.272 * i1 - 0.647 * q1;
        b = y0 - 1.106 * i1 + 1.703 * q1;
      }
      out[i * 4] = r < 0 ? 0 : r > 255 ? 255 : r;
      out[i * 4 + 1] = g2 < 0 ? 0 : g2 > 255 ? 255 : g2;
      out[i * 4 + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      out[i * 4 + 3] = 255;
    }
    // Pixel-cluster effects. These are hard-edged palette pixels rather than
    // blurred alpha glow so the texture remains crisp at native resolution.
    if (motion.intensity > 0 && bounds.w > 0 && bounds.h > 0) {
      const phase = phaseAt(f);
      const count = Math.max(1, Math.round((n / 16) * motion.density * 2));
      if (inp.anim === 'flame' || inp.anim === 'embers') {
        for (let j = 0; j < count; j++) {
          const x = Math.round(bounds.x + 2 + hash2(j, inp.seed, 201) * Math.max(1, bounds.w - 4));
          const travel = ((phase * motion.speed + hash2(j, inp.seed, 202)) % 1) * Math.max(2, bounds.h * 0.5);
          const y = Math.round(bounds.y + bounds.h - 1 - travel);
          const level = Math.min(effectRamp.cols.length - 1, 1 + Math.floor(hash2(j, f, 203) * Math.max(1, effectRamp.cols.length - 1)));
          fxSet(out, x, y, level, motion.intensity);
          if (inp.anim === 'flame') {
            fxSet(out, x, y + 1, Math.max(0, level - 1), motion.intensity * 0.7);
            if (j % 3 === 0) fxSet(out, x + 1, y, level, motion.intensity * 0.45);
          } else if (j % 2 === 0) fxSet(out, x, y - 1, level, motion.intensity * 0.55);
        }
      } else if (inp.anim === 'orbit' || inp.anim === 'arcane') {
        const orbitCount = inp.anim === 'arcane' ? 4 : 2;
        const radius = Math.max(2, Math.min(bounds.w, bounds.h) * (inp.anim === 'arcane' ? 0.36 : 0.44));
        for (let j = 0; j < orbitCount; j++) {
          const angle = phase * Math.PI * 2 * motion.speed + (j * Math.PI * 2) / orbitCount;
          const x = Math.round(cx + Math.cos(angle) * radius);
          const y = Math.round(cy + Math.sin(angle) * radius * 0.62);
          const hi = effectRamp.cols.length - 1;
          fxSet(out, x, y, hi, motion.intensity);
          if (inp.anim === 'arcane') fxSet(out, x + (j % 2 ? 1 : -1), y, Math.max(0, hi - 1), motion.intensity * 0.7);
        }
      } else if (inp.anim === 'lightning') {
        const angle = -Math.PI / 2 + (hash2(inp.seed, 0, 211) - 0.5) * 1.2;
        const len = Math.max(4, Math.min(bounds.w, bounds.h) * 0.82);
        const tipX = Math.round(cx + Math.cos(angle) * len);
        const tipY = Math.round(cy + Math.sin(angle) * len);
        let px = Math.round(cx), py = Math.round(cy);
        const steps = Math.max(Math.abs(tipX - px), Math.abs(tipY - py), 1);
        for (let j = 1; j <= steps; j++) {
          const t = j / steps;
          const tx = Math.round(cx + (tipX - cx) * t + (hash2(j, f, inp.seed + 212) - 0.5) * 2.5);
          const ty = Math.round(cy + (tipY - cy) * t);
          fxLine(out, px, py, tx, ty, effectRamp.cols.length - 1);
          px = tx; py = ty;
        }
      } else if (inp.anim === 'frost') {
        const spots = [[bounds.x + 2, bounds.y + 2], [bounds.x + bounds.w - 3, bounds.y + 3], [bounds.x + 3, bounds.y + bounds.h - 3], [bounds.x + bounds.w - 3, bounds.y + bounds.h - 4]];
        spots.forEach(([x, y], j) => {
          if (hash2(j, f, inp.seed + 221) < motion.intensity) {
            const hi = effectRamp.cols.length - 1;
            fxSet(out, Math.round(x), Math.round(y), hi);
            fxSet(out, Math.round(x + 1), Math.round(y), Math.max(0, hi - 1), 0.75);
            fxSet(out, Math.round(x), Math.round(y + 1), Math.max(0, hi - 1), 0.75);
          }
        });
      } else if (inp.anim === 'muzzle') {
        /**
         * Muzzle flash: fires in the first ~35% of the loop, from the muzzle
         * end of the body outward along the item axis. A 4-point star plus a
         * couple of ejected sparks, all in hard palette pixels.
         */
        const fire = phase < 0.35;
        if (fire) {
          const grow = 1 - phase / 0.35;
          const hi = effectRamp.cols.length - 1;
          // the muzzle sits at the far end along the diagonal tool axis
          const mx = bounds.x + bounds.w - 1;
          const my = bounds.y;
          const rad = Math.max(1.5, Math.min(bounds.w, bounds.h) * 0.3 * grow * (0.6 + motion.intensity));
          fxSet(out, Math.round(mx), Math.round(my), hi);
          for (let j = 1; j <= Math.round(rad); j++) {
            fxSet(out, Math.round(mx + j), Math.round(my - j), hi, 1);
            fxSet(out, Math.round(mx + j), Math.round(my), Math.max(0, hi - 1), 0.8);
            fxSet(out, Math.round(mx), Math.round(my - j), Math.max(0, hi - 1), 0.8);
          }
          for (let j = 0; j < Math.round(3 * motion.density); j++) {
            const a = hash2(j, f, inp.seed + 231) * Math.PI * 2;
            const dr = rad * (0.7 + hash2(j, f, inp.seed + 232) * 0.8);
            fxSet(out, Math.round(mx + Math.cos(a) * dr), Math.round(my + Math.sin(a) * dr), Math.max(0, hi - 1), motion.intensity * 0.8);
          }
        }
      } else if (inp.anim === 'charge') {
        // a ring of converging sparks that collapses into the core
        const hi = effectRamp.cols.length - 1;
        const conv = 1 - phase;
        const rad = Math.max(1.5, Math.min(bounds.w, bounds.h) * 0.46 * conv);
        const k = Math.max(3, Math.round(5 * motion.density));
        for (let j = 0; j < k; j++) {
          const a = (j / k) * Math.PI * 2 + phase * 3 * motion.speed;
          fxSet(out, Math.round(cx + Math.cos(a) * rad), Math.round(cy + Math.sin(a) * rad * 0.7), hi, motion.intensity);
        }
      } else if (inp.anim === 'drip') {
        // blood droplets falling off the lower edge of the silhouette
        const hi = effectRamp.cols.length - 1;
        const k = Math.max(1, Math.round(3 * motion.density));
        for (let j = 0; j < k; j++) {
          const dx = Math.round(bounds.x + 2 + hash2(j, inp.seed, 241) * Math.max(1, bounds.w - 4));
          const t = (phase * motion.speed + hash2(j, inp.seed, 242)) % 1;
          const dy = Math.round(bounds.y + bounds.h - 1 + t * Math.max(2, bounds.h * 0.28));
          fxSet(out, dx, dy, hi, motion.intensity);
          if (t > 0.4) fxSet(out, dx, dy - 1, Math.max(0, hi - 1), motion.intensity * 0.6);
        }
      } else if (inp.anim === 'shockwave') {
        // dense ring outline drawn just outside the silhouette
        const hi = effectRamp.cols.length - 1;
        const front = ((phase * motion.speed) % 1) * 1.35;
        const steps = Math.round(22 * motion.density) + 12;
        for (let j = 0; j < steps; j++) {
          const a = (j / steps) * Math.PI * 2;
          const rx = (bounds.w / 2) * front * 1.06;
          const ry = (bounds.h / 2) * front * 1.06;
          fxSet(out, Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), hi, motion.intensity * 0.85);
        }
      } else if (inp.anim === 'enchant') {
        // small rune chips drifting upward
        const hi = effectRamp.cols.length - 1;
        const k = Math.max(2, Math.round(5 * motion.density));
        for (let j = 0; j < k; j++) {
          const t = (phase * motion.speed + hash2(j, inp.seed, 511)) % 1;
          const x = Math.round(bounds.x + 2 + hash2(j, inp.seed, 512) * Math.max(1, bounds.w - 4));
          const y = Math.round(bounds.y + bounds.h - 1 - t * bounds.h * 1.05);
          fxSet(out, x, y, hi, motion.intensity);
          fxSet(out, x + 1, y, Math.max(0, hi - 1), motion.intensity * 0.5);
        }
      } else if (inp.anim === 'smoke') {
        // soft puffs creeping up off the silhouette
        const hi = effectRamp.cols.length - 1;
        const k = Math.max(2, Math.round(6 * motion.density));
        for (let j = 0; j < k; j++) {
          const t = (phase * motion.speed * 0.6 + hash2(j, inp.seed, 611)) % 1;
          const x = Math.round(bounds.x + 2 + hash2(j, inp.seed, 612) * Math.max(1, bounds.w - 4));
          const y = Math.round(bounds.y + bounds.h - 1 - t * bounds.h * 1.1);
          const spread = Math.round(1 + t * 3);
          for (let d = -spread; d <= spread; d++)
            fxSet(out, x + d, y + (Math.abs(d) & 1), Math.max(0, hi - 2), motion.intensity * 0.5);
        }
      } else if (inp.anim === 'glitch') {
        // displaced blocks that sit outside the silhouette
        const hi = effectRamp.cols.length - 1;
        const k = Math.max(1, Math.round(3 * motion.density));
        for (let j = 0; j < k; j++) {
          const y = Math.round(bounds.y + hash2(j, Math.floor(phase * motion.speed * 3), inp.seed + 711) * bounds.h);
          const x = Math.round(bounds.x + hash2(j, y, inp.seed + 712) * bounds.w);
          const w = 3 + Math.round(hash2(j, y, inp.seed + 713) * 6);
          for (let d = 0; d < w; d++) fxSet(out, x + d, y, hi - (d & 1), motion.intensity * 0.9);
        }
      } else if (inp.anim === 'scan') {
        // thin scan line crossing the whole frame
        const hi = effectRamp.cols.length - 1;
        const bandY = Math.round(((phase * motion.speed) % 1) * (n + 4) - 2);
        for (let x = 0; x < n; x++) fxSet(out, x, bandY, hi, motion.intensity * 0.6);
      } else if (inp.anim === 'sparks') {
        // hard 1-2px sparkles scattered over the body
        const hi = effectRamp.cols.length - 1;
        const k = Math.max(2, Math.round(8 * motion.density));
        for (let j = 0; j < k; j++) {
          const x = Math.round(bounds.x + hash2(j, f, inp.seed + 811) * bounds.w);
          const y = Math.round(bounds.y + hash2(j, f + 1, inp.seed + 812) * bounds.h);
          fxSet(out, x, y, hi, motion.intensity);
          if (j % 2 === 0) fxSet(out, x + 1, y, hi, motion.intensity * 0.5);
        }
      }
    }
    frames.push(out);
  }
  reducePalette(frames, style.colors[n]);
  const pal = new Set<number>();
  const f0 = frames[0];
  for (let i = 0; i < f0.length; i += 4) if (f0[i + 3]) pal.add((f0[i] << 16) | (f0[i + 1] << 8) | f0[i + 2]);
  return { n, frames, frametime: style.frametime, palette: pal.size, bounds: g.bounds };
}

/** Stack frames into the vertical strip Minecraft expects for .png.mcmeta animation. */
export function toStrip(fg: Forged): Uint8ClampedArray {
  const out = new Uint8ClampedArray(fg.n * fg.n * 4 * fg.frames.length);
  fg.frames.forEach((fr, k) => out.set(fr, k * fg.n * fg.n * 4));
  return out;
}
