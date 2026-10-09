/**
 * The essence metrics — ONE implementation shared by the offline pack analyser
 * (tools/essence.mts, run over 18k real SkyBlock textures) and the in-app
 * "essence match" panel that scores every generated texture live.
 */
import { rgbToLch, hueDelta, circMean } from './forge-color';

export type Metrics = {
  res: number;
  cover: number;
  colors: number;
  partial: number;
  darker: number;
  black: number;
  colored: number;
  lightTL: number;
  shift: number;
  warm: number;
  rampLen: number;
  cDark: number;
  cMid: number;
  cLight: number;
  Lmin: number;
  Lmax: number;
  contrast: number;
  meanL: number;
  meanC: number;
  iso: number;
  cluster: number;
};

const q = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
};

/** d = RGBA of the first animation frame (n×n). Returns null for non-icon art. */
export function measure(d: ArrayLike<number>, n: number): Metrics | null {
  const op = new Uint8Array(n * n);
  let opq = 0;
  let semi = 0;
  let vis = 0;
  for (let i = 0; i < n * n; i++) {
    const a = d[i * 4 + 3];
    if (a > 0) vis++;
    if (a > 0 && a < 255) semi++;
    if (a >= 128) {
      op[i] = 1;
      opq++;
    }
  }
  const cover = opq / (n * n);
  if (cover < 0.05 || cover > 0.9) return null;
  // Player-head skins (64×64 UV layout) are not item icons: the head top/bottom
  // strip [8,24)×[0,8) and head sides [0,32)×[8,16) are solid while the corner
  // [0,8)×[0,8) is empty. Excluding them removed a contamination the first
  // analysis run had (SkyBlock Legacy's "64x icons" were almost all skins).
  if (n === 64) {
    let top = 0, side = 0, corner = 0;
    for (let y = 0; y < 8; y++) for (let x = 8; x < 24; x++) top += op[y * n + x];
    for (let y = 8; y < 16; y++) for (let x = 0; x < 32; x++) side += op[y * n + x];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) corner += op[y * n + x];
    if (top >= 115 && side >= 230 && corner === 0) return null;
  }

  const lch: { L: number; C: number; h: number }[] = new Array(n * n);
  const cols = new Set<number>();
  const key = (i: number) => (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2];
  for (let i = 0; i < n * n; i++) {
    if (!op[i]) continue;
    cols.add(key(i));
    lch[i] = rgbToLch(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  }
  const isOut = (x: number, y: number) => x < 0 || y < 0 || x >= n || y >= n || !op[y * n + x];
  const boundary = new Uint8Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (op[i] && (isOut(x - 1, y) || isOut(x + 1, y) || isOut(x, y - 1) || isOut(x, y + 1))) boundary[i] = 1;
    }

  let bN = 0;
  let darker = 0;
  let black = 0;
  let colored = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!boundary[i]) continue;
      let s = 0;
      let c = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
          const j = yy * n + xx;
          if (op[j] && !boundary[j]) {
            s += lch[j].L;
            c++;
          }
        }
      if (!c) continue;
      bN++;
      if (lch[i].L < s / c - 0.04) {
        darker++;
        if (lch[i].L < 0.2 && lch[i].C < 0.04) black++;
        else if (lch[i].C >= 0.04) colored++;
      }
    }

  let tl = 0;
  let tlN = 0;
  let br = 0;
  let brN = 0;
  for (let y = 1; y < n - 1; y++)
    for (let x = 1; x < n - 1; x++) {
      const i = y * n + x;
      if (!op[i] || boundary[i]) continue;
      const up = boundary[i - n] || isOut(x, y - 1);
      const lf = boundary[i - 1] || isOut(x - 1, y);
      const dn = boundary[i + n] || isOut(x, y + 1);
      const rt = boundary[i + 1] || isOut(x + 1, y);
      if ((up || lf) && !(dn || rt)) {
        tl += lch[i].L;
        tlN++;
      }
      if ((dn || rt) && !(up || lf)) {
        br += lch[i].L;
        brN++;
      }
    }

  const hist = new Array(24).fill(0);
  const sat: number[] = [];
  for (let i = 0; i < n * n; i++) {
    if (!op[i] || boundary[i]) continue;
    if (lch[i].C > 0.035) {
      hist[Math.floor(lch[i].h / 15) % 24]++;
      sat.push(i);
    }
  }
  let bin = 0;
  for (let k = 1; k < 24; k++) if (hist[k] > hist[bin]) bin = k;
  const centre = bin * 15 + 7.5;
  const fam = sat.filter((i) => Math.abs(hueDelta(centre, lch[i].h)) <= 32);
  let shift = 0;
  let warm = 0;
  let rampLen = 0;
  let cDark = 0;
  let cMid = 0;
  let cLight = 0;
  if (fam.length >= 6) {
    fam.sort((a, b) => lch[a].L - lch[b].L);
    const k = Math.max(1, Math.floor(fam.length / 4));
    const dk = fam.slice(0, k);
    const lt = fam.slice(-k);
    const md = fam.slice(k, fam.length - k);
    const hD = circMean(dk.map((i) => lch[i].h));
    const hL = circMean(lt.map((i) => lch[i].h));
    shift = hueDelta(hD, hL);
    warm = Math.abs(hueDelta(hD, 85)) - Math.abs(hueDelta(hL, 85));
    rampLen = new Set(fam.map(key)).size;
    const avg = (a: number[]) => a.reduce((s, i) => s + lch[i].C, 0) / Math.max(1, a.length);
    cDark = avg(dk);
    cMid = avg(md.length ? md : fam);
    cLight = avg(lt);
  }

  const Ls: number[] = [];
  let Csum = 0;
  for (let i = 0; i < n * n; i++)
    if (op[i]) {
      Ls.push(lch[i].L);
      Csum += lch[i].C;
    }
  let inner = 0;
  let iso = 0;
  for (let y = 1; y < n - 1; y++)
    for (let x = 1; x < n - 1; x++) {
      const i = y * n + x;
      if (!op[i] || boundary[i]) continue;
      inner++;
      const kk = key(i);
      if (key(i - 1) !== kk && key(i + 1) !== kk && key(i - n) !== kk && key(i + n) !== kk) iso++;
    }
  const seen = new Uint8Array(n * n);
  let clusters = 0;
  for (let i = 0; i < n * n; i++) {
    if (!op[i] || seen[i]) continue;
    clusters++;
    const kk = key(i);
    const st = [i];
    seen[i] = 1;
    while (st.length) {
      const j = st.pop()!;
      const x = j % n;
      const y = (j / n) | 0;
      const nb = [x > 0 ? j - 1 : -1, x < n - 1 ? j + 1 : -1, y > 0 ? j - n : -1, y < n - 1 ? j + n : -1];
      for (const t of nb)
        if (t >= 0 && op[t] && !seen[t] && key(t) === kk) {
          seen[t] = 1;
          st.push(t);
        }
    }
  }

  return {
    res: n,
    cover,
    colors: cols.size,
    partial: vis ? semi / vis : 0,
    darker: bN ? darker / bN : 0,
    black: bN ? black / bN : 0,
    colored: bN ? colored / bN : 0,
    lightTL: tlN && brN ? tl / tlN - br / brN : 0,
    shift,
    warm,
    rampLen,
    cDark,
    cMid,
    cLight,
    Lmin: q(Ls, 0.03),
    Lmax: q(Ls, 0.97),
    contrast: q(Ls, 0.95) - q(Ls, 0.05),
    meanL: Ls.reduce((a, b) => a + b, 0) / Ls.length,
    meanC: Csum / Ls.length,
    iso: inner ? iso / inner : 0,
    cluster: opq / Math.max(1, clusters),
  };
}
