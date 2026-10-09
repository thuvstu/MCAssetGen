import type { Ramps, Sampler } from './generator';

// ===================== public types =====================
export type BaseForm =
  | 'auto' | 'straight' | 'katana' | 'claymore' | 'scimitar' | 'dagger' | 'rapier'
  | 'cleaver' | 'spear' | 'trident' | 'scythe' | 'warhammer' | 'greataxe'
  | 'chakram' | 'heaterShield' | 'roundShield' | 'towerShield' | 'amorphous';

export type Decoration =
  | 'halo' | 'orbit' | 'wings' | 'ribbon' | 'chain' | 'runering'
  | 'thorns' | 'crystal' | 'skull' | 'flame' | 'shard' | 'tendril'
  | 'crown' | 'moons' | 'feathers' | 'gears' | 'banner' | 'lightning' | 'roots' | 'eyes';

export const BASE_FORMS: { id: BaseForm; jp: string; en: string; desc: string }[] = [
  { id: 'auto', jp: 'アイテム既定', en: 'Auto', desc: 'アイテム固有の形状をそのまま使う' },
  { id: 'straight', jp: '直剣', en: 'Straight', desc: '両刃のオーソドックスな直剣。基本形の基準' },
  { id: 'katana', jp: '刀', en: 'Katana', desc: '片刃・反りあり。刃文を焼き入れる' },
  { id: 'claymore', jp: '大剣', en: 'Claymore', desc: '幅広・長鍔のツーハンデッド' },
  { id: 'scimitar', jp: '曲刀', en: 'Scimitar', desc: '先端が広がる強い反りの片刃' },
  { id: 'dagger', jp: '短剣', en: 'Dagger', desc: '刀身が短く柄と宝珠が大きい' },
  { id: 'rapier', jp: '細剣', en: 'Rapier', desc: '極細の刺突剣＋リングガード' },
  { id: 'cleaver', jp: '肉断ち', en: 'Cleaver', desc: '矩形の重量刃。先端は断ち切り' },
  { id: 'spear', jp: '槍', en: 'Spear', desc: '長柄＋木の葉型の穂先' },
  { id: 'trident', jp: '三叉', en: 'Trident', desc: '長柄＋三又の穂先' },
  { id: 'scythe', jp: '大鎌', en: 'Scythe', desc: '長柄に直交する巨大な湾曲刃' },
  { id: 'warhammer', jp: '戦槌', en: 'Warhammer', desc: '角型の鎚頭＋背面スパイク' },
  { id: 'greataxe', jp: '大斧', en: 'Greataxe', desc: '長柄＋巨大な扇形の刃' },
  { id: 'chakram', jp: '輪刃', en: 'Chakram', desc: '柄を持たない環状の刃' },
  { id: 'heaterShield', jp: '騎士盾', en: 'Heater Shield', desc: '上辺が広く下端が尖る紋章盾' },
  { id: 'roundShield', jp: '円盾', en: 'Round Shield', desc: '中央ボスを持つ多層の円盾' },
  { id: 'towerShield', jp: '大盾', en: 'Tower Shield', desc: '全身を覆う縦長の重装盾' },
  { id: 'amorphous', jp: '混沌鍛造', en: 'Chaos Forged', desc: '武器の芯を保ちながら非対称な刃・裂け目・浮遊片をシード生成' },
];

export const DECORATIONS: { id: Decoration; jp: string; en: string; layer: 'back' | 'front' }[] = [
  { id: 'halo', jp: '光輪', en: 'Halo', layer: 'back' },
  { id: 'orbit', jp: '周回粒子', en: 'Orbit', layer: 'back' },
  { id: 'wings', jp: '翼', en: 'Wings', layer: 'back' },
  { id: 'ribbon', jp: '布帯', en: 'Ribbon', layer: 'back' },
  { id: 'chain', jp: '鎖', en: 'Chain', layer: 'back' },
  { id: 'runering', jp: '魔法陣', en: 'Rune Ring', layer: 'back' },
  { id: 'thorns', jp: '棘', en: 'Thorns', layer: 'front' },
  { id: 'crystal', jp: '結晶', en: 'Crystal', layer: 'front' },
  { id: 'skull', jp: '髑髏', en: 'Skull', layer: 'front' },
  { id: 'flame', jp: '炎', en: 'Flame', layer: 'front' },
  { id: 'shard', jp: '破片', en: 'Shard', layer: 'front' },
  { id: 'tendril', jp: '触手', en: 'Tendril', layer: 'front' },
  { id: 'crown', jp: '王冠', en: 'Crown', layer: 'back' },
  { id: 'moons', jp: '月相', en: 'Moon Phases', layer: 'back' },
  { id: 'feathers', jp: '羽飾り', en: 'Feathers', layer: 'back' },
  { id: 'gears', jp: '歯車', en: 'Gears', layer: 'back' },
  { id: 'banner', jp: '戦旗', en: 'Banner', layer: 'back' },
  { id: 'lightning', jp: '放電', en: 'Lightning', layer: 'front' },
  { id: 'roots', jp: '根蔦', en: 'Roots', layer: 'front' },
  { id: 'eyes', jp: '魔眼', en: 'Eyes', layer: 'front' },
];

// ===================== local helpers (kept local to avoid import cycles) =====================
const dist = (x: number, y: number, cx: number, cy: number) => Math.hypot(x - cx, y - cy);

function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function fbm(x: number, y: number, seed: number): number {
  let sum = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 4; o++) { sum += vnoise(x * f, y * f, seed + o * 1013) * amp; amp *= 0.5; f *= 2; }
  return sum;
}
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

export interface FormArgs {
  R: Ramps;
  lv: (i: number) => number;
  detail: number;
  seed: number;
  runes: number;
  gems: number;
  wear: number;
  decorationScale?: number;
  decorationSpread?: number;
  phase?: number;
}

// shared diagonal axis: hilt at lower-left, tip at upper-right
const OX = 11.5, OY = 52.5;
const AX = Math.SQRT1_2, AY = -Math.SQRT1_2;   // along
const NX = Math.SQRT1_2, NY = Math.SQRT1_2;    // perpendicular (+ = lower-right = shadow side)
const axis = (x: number, y: number) => {
  const rx = x - OX, ry = y - OY;
  return { s: rx * AX + ry * AY, t: rx * NX + ry * NY };
};
const atAxis = (s: number, t = 0) => ({ x: OX + AX * s + NX * t, y: OY + AY * s + NY * t });

/** canonical 5-step blade shading across the width */
function bladeLevel(n: number): number {
  if (n < -0.80) return 2;
  if (n < -0.26) return 4;
  if (n < 0.22) return 3;
  if (n < 0.60) return 2;
  if (n < 0.86) return 1;
  return 0;
}

interface FormCfg {
  gripStart: number; gripEnd: number; gripW: number;
  guard: number; guardStyle: 'cross' | 'round' | 'ring' | 'collar' | 'none';
  bladeStart: number; bladeEnd: number;
  width: (u: number) => number;
  curve: number;
  single: boolean;
  backW: number;
  pommel: number;
  head: 'blade' | 'spear' | 'trident' | 'scythe' | 'hammer' | 'axe' | 'ring' | 'heaterShield' | 'roundShield' | 'towerShield';
}

const FORM_CFG: Record<Exclude<BaseForm, 'auto' | 'amorphous'>, FormCfg> = {
  straight: { gripStart: 5.5, gripEnd: 22, gripW: 2.5, guard: 11, guardStyle: 'cross', bladeStart: 26.5, bladeEnd: 58.5, width: (u) => (u > 0.76 ? 4.7 * (1 - u) / 0.24 : 4.7), curve: 0, single: false, backW: 0, pommel: 3.4, head: 'blade' },
  katana: { gripStart: 4, gripEnd: 24, gripW: 2.4, guard: 5.4, guardStyle: 'round', bladeStart: 27, bladeEnd: 59, width: (u) => (u > 0.74 ? 3.4 * (1 - u) / 0.26 : 3.4), curve: 3.4, single: true, backW: 1.1, pommel: 2.4, head: 'blade' },
  claymore: { gripStart: 3, gripEnd: 22, gripW: 3.0, guard: 15, guardStyle: 'cross', bladeStart: 26, bladeEnd: 59, width: (u) => (u > 0.80 ? 6.6 * (1 - u) / 0.20 : u < 0.10 ? 6.6 + 1.6 : 6.6), curve: 0, single: false, backW: 0, pommel: 4.0, head: 'blade' },
  scimitar: { gripStart: 5, gripEnd: 22, gripW: 2.5, guard: 8, guardStyle: 'cross', bladeStart: 26, bladeEnd: 58, width: (u) => (u > 0.88 ? (3.6 + 3.8 * 0.88) * (1 - u) / 0.12 : 3.6 + 3.8 * u), curve: 5.0, single: true, backW: 1.8, pommel: 3.0, head: 'blade' },
  dagger: { gripStart: 8, gripEnd: 24, gripW: 2.6, guard: 8, guardStyle: 'cross', bladeStart: 28, bladeEnd: 45, width: (u) => (u > 0.55 ? 4.2 * (1 - u) / 0.45 : 4.2), curve: 0, single: false, backW: 0, pommel: 4.2, head: 'blade' },
  rapier: { gripStart: 5, gripEnd: 21, gripW: 2.2, guard: 7, guardStyle: 'ring', bladeStart: 25, bladeEnd: 60, width: (u) => (u > 0.88 ? 2.0 * (1 - u) / 0.12 : 2.0 - u * 0.7), curve: 0, single: false, backW: 0, pommel: 2.8, head: 'blade' },
  cleaver: { gripStart: 6, gripEnd: 24, gripW: 2.8, guard: 6, guardStyle: 'collar', bladeStart: 27, bladeEnd: 55, width: (u) => (u < 0.12 ? 4.4 + u * 23 : 7.2), curve: 0, single: true, backW: 3.4, pommel: 3.0, head: 'blade' },
  spear: { gripStart: 2, gripEnd: 44, gripW: 2.2, guard: 4.6, guardStyle: 'collar', bladeStart: 45, bladeEnd: 60, width: (u) => Math.sin(Math.min(1, u) * Math.PI) * 3.8 + 0.5, curve: 0, single: false, backW: 0, pommel: 2.4, head: 'spear' },
  trident: { gripStart: 2, gripEnd: 42, gripW: 2.3, guard: 5.4, guardStyle: 'collar', bladeStart: 44, bladeEnd: 60, width: () => 1.6, curve: 0, single: false, backW: 0, pommel: 2.4, head: 'trident' },
  scythe: { gripStart: 2, gripEnd: 48, gripW: 2.3, guard: 5.0, guardStyle: 'collar', bladeStart: 0, bladeEnd: 0, width: () => 0, curve: 0, single: true, backW: 0, pommel: 2.6, head: 'scythe' },
  warhammer: { gripStart: 2, gripEnd: 44, gripW: 2.6, guard: 5.2, guardStyle: 'collar', bladeStart: 0, bladeEnd: 0, width: () => 0, curve: 0, single: false, backW: 0, pommel: 3.0, head: 'hammer' },
  greataxe: { gripStart: 2, gripEnd: 46, gripW: 2.6, guard: 5.0, guardStyle: 'collar', bladeStart: 0, bladeEnd: 0, width: () => 0, curve: 0, single: false, backW: 0, pommel: 3.0, head: 'axe' },
  chakram: { gripStart: 0, gripEnd: 0, gripW: 0, guard: 0, guardStyle: 'none', bladeStart: 0, bladeEnd: 0, width: () => 0, curve: 0, single: false, backW: 0, pommel: 0, head: 'ring' },
  heaterShield: { gripStart: 0, gripEnd: 0, gripW: 0, guard: 0, guardStyle: 'none', bladeStart: 0, bladeEnd: 0, width: () => 0, curve: 0, single: false, backW: 0, pommel: 0, head: 'heaterShield' },
  roundShield: { gripStart: 0, gripEnd: 0, gripW: 0, guard: 0, guardStyle: 'none', bladeStart: 0, bladeEnd: 0, width: () => 0, curve: 0, single: false, backW: 0, pommel: 0, head: 'roundShield' },
  towerShield: { gripStart: 0, gripEnd: 0, gripW: 0, guard: 0, guardStyle: 'none', bladeStart: 0, bladeEnd: 0, width: () => 0, curve: 0, single: false, backW: 0, pommel: 0, head: 'towerShield' },
};

// ===================== base-form sampler =====================
export function formSampler(form: Exclude<BaseForm, 'auto' | 'amorphous'>, a: FormArgs): Sampler {
  const { R, lv, detail, seed, runes, gems } = a;
  const cfg = FORM_CFG[form];

  // rune studs along the blade
  const studs: number[] = [];
  if (detail >= 1 && runes > 0.04 && cfg.head === 'blade') {
    const n = Math.max(1, Math.round((detail >= 2 ? 3 : 2) * runes));
    const span = cfg.bladeEnd - cfg.bladeStart;
    for (let i = 0; i < n; i++) studs.push(cfg.bladeStart + span * (0.18 + (i * 0.5) / Math.max(1, n - 1 || 1)));
  }

  return (x, y) => {
    const { s, t } = axis(x, y);

    // ---------------- shields ----------------
    if (cfg.head === 'heaterShield' || cfg.head === 'roundShield' || cfg.head === 'towerShield') {
      const cx = 32, cy = cfg.head === 'towerShield' ? 32 : 31;
      let inside = false;
      let edgeDistance = 0;
      if (cfg.head === 'roundShield') {
        const d = dist(x, y, cx, cy);
        inside = d <= 23.5;
        edgeDistance = 23.5 - d;
      } else if (cfg.head === 'heaterShield') {
        const nx = Math.abs(x - cx) / 21;
        const yy = (y - 10) / 45;
        const half = yy < 0.34 ? 1 - yy * 0.22 : Math.max(0, 1 - (yy - 0.34) * 1.36);
        inside = yy >= 0 && yy <= 1 && nx <= half;
        edgeDistance = Math.min((half - nx) * 21, (1 - yy) * 20, yy * 20);
      } else {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        const rounded = Math.max(dx - 18, dy - 25);
        inside = rounded <= 0 && !(y > 54 && dx > 13);
        edgeDistance = Math.min(18 - dx, 25 - dy);
      }
      if (!inside) return null;

      const nx = (x - cx) / (cfg.head === 'towerShield' ? 18 : 22);
      const ny = (y - cy) / (cfg.head === 'towerShield' ? 25 : 23);
      if (edgeDistance < 2.1) return R.metal[lv(x + y < 62 ? 4 : 0)];
      if (edgeDistance < 4.3) return R.accent[lv(x < cx ? 3 : 1)];

      // central boss and heraldic gem
      const bossR = cfg.head === 'towerShield' ? 6.2 : 7.5;
      const bd = dist(x, y, cx, cy - (cfg.head === 'heaterShield' ? 2 : 0));
      if (bd < bossR) {
        if (gems > 0.12 && bd < 2.2 + gems * 2.0) return R.gem[lv(x + y < cx + cy ? 4 : 2)];
        const l = ((x - cx) + (y - cy)) / (bossR * 2);
        return R.accent[lv(l < -0.42 ? 4 : l < -0.05 ? 3 : l < 0.34 ? 2 : l < 0.68 ? 1 : 0)];
      }

      // radial plate segments break the large surface into readable armour planes
      const ang = Math.atan2(y - cy, x - cx);
      const segment = Math.abs(Math.sin(ang * (cfg.head === 'roundShield' ? 6 : 4)));
      if (detail >= 1 && segment < 0.085 && bd > bossR + 1.5) return R.accent[lv(1)];
      if (detail >= 1 && runes > 0.18 && Math.abs(ny) < 0.055 && Math.abs(nx) > 0.38) return R.gem[lv(nx < 0 ? 3 : 1)];
      let level = nx + ny < -0.35 ? 4 : nx + ny < 0.1 ? 3 : nx + ny < 0.55 ? 2 : 1;
      if (detail >= 2 && hash2(Math.floor(x), Math.floor(y), seed) > 0.955) level = Math.max(0, level - 1);
      return R.metal[lv(level)];
    }

    // ---------------- ring form (no hilt) ----------------
    if (cfg.head === 'ring') {
      const d = dist(x, y, 32, 32);
      if (d <= 24 && d >= 15) {
        const n = (d - 19.5) / 4.5;                    // -1 inner .. 1 outer
        let i = bladeLevel(n * (y < 32 ? -1 : 1) * 0.9);
        if (d > 22.6 || d < 16.4) i = Math.max(0, i - 1);
        if (x + y < 56) i = Math.min(4, i + 1);
        if (detail >= 1 && runes > 0.15) {
          const ang = Math.atan2(y - 32, x - 32);
          if (Math.abs(Math.sin(ang * 6)) > 0.93) return R.gem[lv(4)];
        }
        return R.metal[lv(i)];
      }
      // inner grip bars
      if (detail >= 1 && d < 16.4 && d > 8 && Math.abs(Math.abs(x - 32) - Math.abs(y - 32)) < 2.2) {
        return R.grip[lv(x < 32 ? 3 : 1)];
      }
      if (gems > 0.1 && d < 4.4) return R.gem[lv(x + y < 64 ? 4 : 2)];
      return null;
    }

    // ---------------- special heads ----------------
    if (cfg.head === 'scythe') {
      // huge curved blade sweeping from the top of the shaft
      const anchor = atAxis(48);
      const cx = anchor.x - 16, cy = anchor.y - 3;
      const d = dist(x, y, cx, cy);
      const ang = Math.atan2(y - cy, x - cx);
      if (ang > -1.62 && ang < 0.32) {
        const taper = Math.min(1, (ang + 1.62) / 1.94);
        const th = 5.6 * (0.30 + 0.70 * Math.sin(Math.min(1, taper + 0.08) * Math.PI * 0.86));
        if (Math.abs(d - 19.5) <= th) {
          const n = (d - 19.5) / th;                  // -1 = inner cutting edge
          let i = n < -0.55 ? 4 : n < -0.05 ? 3 : n < 0.45 ? 2 : n < 0.8 ? 1 : 0;
          if (detail >= 2 && hash2(Math.floor(x), Math.floor(y), seed) > 0.93) i = Math.max(0, i - 1);
          if (detail >= 1 && runes > 0.2 && Math.abs(n - 0.35) < 0.10 && Math.floor(ang * 12) % 3 === 0) return R.gem[lv(3)];
          return R.metal[lv(i)];
        }
      }
      if (dist(x, y, anchor.x, anchor.y) < 4.2) return R.accent[lv(x < anchor.x ? 3 : 1)];
    }

    if (cfg.head === 'hammer') {
      const head = atAxis(50);
      // rotated box: use axis coordinates around the head
      const hs = s - 50, ht = t;
      if (hs > -7 && hs < 7 && Math.abs(ht) < 8.4) {
        const n = ht / 8.4;
        let i = n < -0.55 ? 4 : n < -0.1 ? 3 : n < 0.4 ? 2 : n < 0.78 ? 1 : 0;
        if (Math.abs(hs) > 5.4) i = Math.max(0, i - 1);              // struck faces
        if (detail >= 1 && Math.abs(Math.abs(hs) - 4.4) < 0.8) i = Math.max(0, i - 2);
        if (detail >= 1 && gems > 0.15 && dist(x, y, head.x, head.y) < 2.4) return R.gem[lv(4)];
        if (detail >= 2 && hash2(Math.floor(x), Math.floor(y), seed) > 0.92) i = Math.max(0, i - 1);
        return R.metal[lv(i)];
      }
      // rear spike
      if (hs > -13 && hs <= -7 && Math.abs(ht) < (13 + hs) * 0.85) return R.metal[lv(ht < 0 ? 3 : 1)];
    }

    if (cfg.head === 'axe') {
      const anchor = atAxis(49);
      const cx = anchor.x - 9, cy = anchor.y + 5;
      const d = dist(x, y, cx, cy);
      const ang = Math.atan2(y - cy, x - cx);
      if (ang > -1.85 && ang < -0.05 && d <= 19 && d >= 8.5) {
        const e = (19 - d) / 10.5;                     // 0 = cutting edge
        let i = e < 0.16 ? 4 : e < 0.40 ? 3 : e < 0.72 ? 2 : 1;
        if (ang < -1.35 || ang > -0.42) i = Math.max(0, i - 1);
        if (detail >= 1 && gems > 0.15 && Math.abs(d - 11.5) < 1.7 && Math.abs(ang + 0.95) < 0.12) return R.gem[lv(4)];
        if (detail >= 2 && hash2(Math.floor(x), Math.floor(y), seed) > 0.93) i = Math.max(0, i - 1);
        return R.metal[lv(i)];
      }
    }

    if (cfg.head === 'trident') {
      for (const off of [-4.8, 0, 4.8]) {
        const ps = s - 44, pt = t - off;
        const len = off === 0 ? 16 : 12.5;
        if (ps > 0 && ps < len) {
          const w = off === 0 ? 2.1 : 1.8;
          const taper = ps > len - 4 ? w * ((len - ps) / 4) : w;
          if (Math.abs(pt) < taper) {
            const n = pt / Math.max(0.4, taper);
            return R.metal[lv(n < -0.3 ? 4 : n < 0.25 ? 3 : n < 0.7 ? 2 : 0)];
          }
        }
        // crossbar that joins the outer prongs
        if (off !== 0 && ps > -1.8 && ps < 2.0 && Math.abs(t) < 5.8) return R.metal[lv(t < 0 ? 3 : 1)];
      }
    }

    // ---------------- blade ----------------
    if (cfg.bladeEnd > cfg.bladeStart && s >= cfg.bladeStart && s <= cfg.bladeEnd) {
      const u = (s - cfg.bladeStart) / (cfg.bladeEnd - cfg.bladeStart);
      const bend = cfg.curve * u * u;
      const tc = t - bend;
      const w = Math.max(0.35, cfg.width(u));
      const lo = cfg.single ? -cfg.backW : -w;
      if (tc >= lo && tc <= w) {
        const span = w - lo;
        const n = span > 0.001 ? ((tc - lo) / span) * 2 - 1 : 0;
        for (const gs of studs) {
          const r = (detail >= 2 ? 0.9 : 0.7) + (detail >= 2 ? 1.6 : 1.0) * gems;
          if (Math.abs(s - gs) + Math.abs(tc) * 1.1 < r) return R.gem[lv(Math.abs(s - gs) + Math.abs(tc) < 0.9 ? 4 : 3)];
        }
        let i = bladeLevel(n);
        // temper line on single-edged blades
        if (cfg.single && detail >= 1) {
          const wob = Math.sin(s * 0.8) * 0.1;
          if (n > 0.20 + wob && n < 0.36 + wob) i = 4;
        }
        // squared-off cleaver tip highlight
        if (form === 'cleaver' && s > cfg.bladeEnd - 2.4) i = 4;
        if (u > 0.82) i = Math.min(4, i + 1);
        if (detail >= 2 && runes > 0.08 && Math.abs(n + 0.5) < 0.16 && Math.floor(s) % Math.max(3, Math.round(8 - runes * 5)) === 0) i = Math.min(4, i + 1);
        if (detail >= 2 && hash2(Math.floor(s * 2), Math.floor(tc * 2), seed) > 0.94) i = Math.max(0, i - 1);
        return R.metal[lv(i)];
      }
    }

    // ---------------- guard ----------------
    if (cfg.guardStyle !== 'none') {
      const g0 = cfg.gripEnd, g1 = cfg.bladeStart > 0 ? Math.max(cfg.bladeStart, g0 + 3.2) : g0 + 3.6;
      if (s >= g0 && s <= g1) {
        const u = (s - g0) / Math.max(0.6, g1 - g0);
        let gw: number;
        if (cfg.guardStyle === 'round' || cfg.guardStyle === 'collar') gw = cfg.guard * (0.62 + 0.38 * Math.sin(Math.min(1, u) * Math.PI));
        else if (cfg.guardStyle === 'ring') gw = cfg.guard * (0.45 + 0.55 * Math.sin(Math.min(1, u) * Math.PI));
        else gw = cfg.guard * (0.55 + 0.45 * Math.sin(Math.min(1, u) * Math.PI));
        // rapier: hollow ring guard
        if (cfg.guardStyle === 'ring' && Math.abs(t) < gw - 1.8 && u > 0.18 && u < 0.86) return null;
        if (Math.abs(t) <= gw) {
          const edge = 1 - Math.abs(t) / gw;
          let i = u < 0.32 ? 1 : u < 0.62 ? 3 : 2;
          if (u < 0.15) i = 0;
          if (edge < 0.16) i = Math.max(0, i - 2);
          if (detail >= 1 && gems > 0.12 && cfg.guardStyle === 'cross' && Math.abs(Math.abs(t) - (gw - 1.6)) < 1.5 && u > 0.3 && u < 0.75) return R.gem[lv(3)];
          return R.accent[lv(i)];
        }
      }
    }

    // ---------------- grip ----------------
    if (cfg.gripEnd > cfg.gripStart && s >= cfg.gripStart && s <= cfg.gripEnd && Math.abs(t) <= cfg.gripW) {
      const n = t / cfg.gripW;
      let i = n < -0.45 ? 3 : n < 0.25 ? 2 : n < 0.7 ? 1 : 0;
      if (detail >= 1) {
        const wrap = Math.floor((s - cfg.gripStart) / (detail >= 2 ? 2.4 : 3.4)) % 2;
        i = wrap === 0 ? Math.min(4, i + 1) : Math.max(0, i - 1);
      }
      // metal ferrules on polearms
      if (detail >= 1 && cfg.gripEnd - cfg.gripStart > 30) {
        const band = (s - cfg.gripStart) % 12;
        if (band < 1.8) return R.accent[lv(n < 0 ? 3 : 1)];
      }
      return R.grip[lv(i)];
    }

    // ---------------- pommel ----------------
    if (cfg.pommel > 0 && s < cfg.gripStart + 1.4) {
      const p = atAxis(Math.max(1.6, cfg.gripStart - 2.4));
      const d = dist(x, y, p.x, p.y);
      if (d <= cfg.pommel) {
        const l = (x - p.x + y - p.y) / (cfg.pommel * 2);
        let i = l < -0.42 ? 4 : l < -0.05 ? 3 : l < 0.3 ? 2 : l < 0.62 ? 1 : 0;
        if (d > cfg.pommel - 1.0) i = Math.max(0, i - 1);
        return R.gem[lv(i)];
      }
    }
    return null;
  };
}

// ===================== fully amorphous weapon =====================
export function amorphousSampler(a: FormArgs, intensity: number): Sampler {
  const { R, lv, detail, seed, runes, gems } = a;
  const amount = Math.max(0.15, intensity);

  // 破砕大刀: a sword silhouette that stays legible. Randomness drives
  // jagged edge teeth, a spine canyon and a few broken shards — never a blob.
  const knotCount = 9;
  interface Knot { s: number; upper: number; lower: number }
  const knots: Knot[] = Array.from({ length: knotCount }, (_, i) => {
    const u = i / (knotCount - 1);
    const taper = clamp01(1 - Math.max(0, (u - 0.82) / 0.22));
    const seeded = hash2(i, 41, seed);
    // edge-side (+t) gains sparse triangular teeth; spine-side (–t) is bulkier
    const tooth = hash2(i, 89, seed) > 0.62 && detail >= 1 ? 1.6 + hash2(i, 93, seed) * 2.4 : 0;
    return {
      s: 22 + u * 35,
      upper: ((2.6 + hash2(i, 77, seed) * 3.2) * (0.55 + amount * 0.5)) * taper,
      lower: ((2.4 + seeded * 2.6 + tooth) * (0.55 + amount * 0.45)) * taper,
    };
  });

  // ONE spine canyon (negative space), placed mid-blade
  const canyonK = 2 + Math.floor(hash2(7, 151, seed) * (knotCount - 4));
  const canyonS = knots[canyonK].s;
  const canyonT = -knots[canyonK].upper * 0.42;
  const canyonR = (1.7 + amount * 1.8) * (knots[canyonK].upper > 4 ? 1 : 0.55);

  // broken shards that stay close to the blade so they read as debris
  const shards: [number, number, number][] = detail >= 1
    ? Array.from({ length: Math.min(4, 1 + Math.floor(amount * 3)) }, (_, i) => {
        const idx = Math.floor(hash2(i, 5, seed) * knotCount);
        const side = hash2(i, 23, seed) > 0.5 ? 1 : -1;
        const k = knots[idx];
        return [
          k.s + (hash2(i, 31, seed) - 0.5) * 4,
          side > 0 ? k.lower * side + 2.6 + hash2(i, 37, seed) * 4 : k.upper * side - 2.6 - hash2(i, 37, seed) * 4,
          1.1 + hash2(i, 61, seed) * 1.6,
        ];
      })
    : [];

  return (x, y) => {
    const { s, t } = axis(x, y);

    // hilt
    if (s >= 2 && s <= 16 && Math.abs(t) < 2.6) {
      const wrap = detail >= 1 ? Math.floor(s / 2.6) % 2 : 0;
      return R.grip[lv(t < -0.4 ? 3 : wrap ? 1 : 2)];
    }
    // broken crescent guard (one tip intentionally missing)
    if (s > 16 && s < 22.5) {
      const u = (s - 16) / 6.5;
      const reach = 4 + Math.sin(u * Math.PI) * (6.5 + amount * 2);
      const missingTip = hash2(3, 17, seed) > 0.5;
      if (Math.abs(t) < reach && !(missingTip && t > reach - 2.6 && s > 20.4) && !(t < -1.6 && t > -4.6 && u > 0.5)) {
        return R.accent[lv(t < 0 ? 3 : 1)];
      }
    }

    // jagged blade: straight-line interpolation between facets
    if (s >= knots[0].s && s <= knots[knotCount - 1].s) {
      let index = 0;
      while (index < knots.length - 2 && s > knots[index + 1].s) index++;
      const a0 = knots[index], a1 = knots[index + 1];
      const u = (s - a0.s) / Math.max(0.001, a1.s - a0.s);
      const upper = a0.upper + (a1.upper - a0.upper) * u;
      const lower = a0.lower + (a1.lower - a0.lower) * u;
      if (t >= -upper && t <= lower) {
        // canyon negative space
        if (amount > 0.25 && Math.abs(s - canyonS) + Math.abs(t - canyonT) * 1.25 < canyonR) return null;
        const n = t < 0 ? t / Math.max(0.1, upper) : t / Math.max(0.1, lower);
        let level = bladeLevel(n);
        // crisp facet seams
        if (detail >= 1 && Math.abs(s - a0.s) < 1.0 && index > 0) level = Math.max(0, level - 1);
        // thin crystal veins along the blade spine
        if (detail >= 1 && runes > 0.2 && Math.abs(n + 0.18) < 0.08 && index % 2 === 0) return R.gem[lv(3)];
        if (gems > 0.2 && detail >= 1 && hash2(index, 5, seed) > 0.6 && Math.abs(s - (a0.s + a1.s) * 0.5) + Math.abs(t) < 1.8 + gems * 1.6) return R.gem[lv(n < -0.2 ? 4 : 2)];
        if (detail >= 2 && hash2(Math.floor(s * 2), Math.floor(t * 2), seed) > 0.955) level = Math.max(0, level - 1);
        return R.metal[lv(level)];
      }
    }

    // debris shards (few, close, diamond-shaped — reads as broken metal)
    for (const [sx, sy, sr] of shards) {
      if (Math.abs(s - sx) + Math.abs(t - sy) * 1.2 < sr) {
        if (Math.abs(s - sx) + Math.abs(t - sy) > sr - 0.7) return R.metal[lv(0)];
        return R.accent[lv(s + t < sx + sy ? 3 : 1)];
      }
    }
    return null;
  };
}

/** Warps an existing silhouette toward the irregular, and lets growths bud off it. */
export function amorphize(base: Sampler, a: FormArgs, amount: number): Sampler {
  const { R, lv, seed, detail } = a;
  const growths: [number, number, number][] = [];
  if (amount > 0.28 && detail >= 1) {
    const n = 2 + Math.floor(amount * 4);
    for (let i = 0; i < n; i++) {
      const p = atAxis(12 + hash2(i, 31, seed) * 42, (hash2(i, 87, seed) - 0.5) * 20 * amount);
      growths.push([p.x, p.y, (2.0 + hash2(i, 53, seed) * 4.0) * amount]);
    }
  }
  return (x, y) => {
    const w = 5.0 * amount;
    const wx = x + (fbm(x * 0.09, y * 0.09, seed + 21) - 0.5) * w * 2;
    const wy = y + (fbm(x * 0.09 + 8.3, y * 0.09 + 2.7, seed + 64) - 0.5) * w * 2;
    const c = base(wx, wy);
    if (c) return c;
    for (const [gx, gy, gr] of growths) {
      const d = dist(x, y, gx, gy) + (fbm(x * 0.2, y * 0.2, seed + 5) - 0.5) * 2.4;
      if (d < gr) {
        const l = (x - gx + y - gy) / (gr * 2);
        return R.metal[lv(d > gr - 1 ? 0 : l < -0.3 ? 4 : l < 0.2 ? 2 : 1)];
      }
    }
    return null;
  };
}
