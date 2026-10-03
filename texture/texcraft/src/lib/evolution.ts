import { Params, applyStack, newLayer } from './effects';
import * as G from './geometry';
import { Tex, createTex, hexToRgb } from './tex';

export type GroupId = 'tier' | 'limit' | 'form' | 'element' | 'material' | 'mode' | 'attack';
export interface Group { id: GroupId; name: string; en: string; desc: string; itemOnly?: boolean }
export const GROUPS: Group[] = [
  { id: 'tier', name: '段階強化', en: 'SAME WEAPON · +0 to +5', desc: '輪郭は同じ。研ぎ、護拳の宝石、刃の伸長、ルーン、光…足していくだけ。' },
  { id: 'limit', name: '限界突破', en: 'LIMIT BREAK', desc: '同じ武器の覚醒体。本体は残し、オーラと亀裂だけが溢れる。' },
  { id: 'form', name: '形態変化', en: 'FORM CHANGE', desc: '双刃・大剣・短剣・鋸刃。ピクセルを複製・伸長してシルエットを変える。', itemOnly: true },
  { id: 'element', name: '属性違い', en: 'ELEMENTAL SET', desc: '陰影はそのまま、色だけ炎・氷・雷…に差し替えた同一モデル。' },
  { id: 'material', name: '素材違い', en: 'MATERIAL SET', desc: '木→石→鉄→金→ダイヤ→ネザライト。バニラの道具と同じ段階。' },
  { id: 'mode', name: '一時モード', en: 'STATUS OVERLAY', desc: '本体はそのまま。発光や粒子だけが乗った状態変化。' },
  { id: 'attack', name: '攻撃モーション', en: 'KEY POSES', desc: 'キーポーズ8枚。振りかぶり・到達・余韻が読み取れるアニメ。', itemOnly: true },
];

export interface Ctx { base: Tex; accent: string; seed: number; frames: number }
export interface Variant { id: string; group: GroupId; name: string; desc: string; animated: boolean; tag?: string; build: (c: Ctx) => Tex[] }

const fx = (t: Tex, layers: [string, Params?][], time = 0, seed = 7) => applyStack(t, layers.map(([type, p], i) => newLayer(type, p, seed + i * 31)), time);
const anim = (n: number, fn: (t: number, i: number) => Tex) => Array.from({ length: n }, (_, i) => fn(i / n, i));
const rgb = (hex: string) => hexToRgb(hex);
const item = (t: Tex) => !G.isOpaqueTex(t);
const keys = (c: Ctx) => Math.min(8, Math.max(6, c.frames));

/** Additive upgrade of THE SAME pixels. No full-image recolor. */
function enhance(c: Ctx, level: number, t = 0): Tex {
  let tex = c.base;
  const acc = rgb(c.accent);
  const gold: G.RGB = [232, 196, 74];
  const wrap: G.RGB = [90, 58, 28];
  if (level >= 1) {
    tex = G.outline1(tex, [12, 18, 16], true);
    tex = fx(tex, [['sharpen', { amount: 18 }], ['bevel', { strength: 16, width: 1 }]], 0, c.seed);
  }
  if (level >= 2 && item(c.base)) {
    tex = G.wrapHandle(tex, wrap, c.seed);
    tex = G.addGems(tex, 1, gold, c.seed);
  }
  if (level >= 3 && item(c.base)) {
    tex = G.extendBlade(tex, G.px(tex));
    tex = G.addGems(tex, 2, acc, c.seed + 2);
  }
  if (level >= 4 && item(c.base)) {
    tex = G.bladeRunes(tex, acc, c.seed, 3 + level);
    tex = G.addSpikes(tex, 2, acc, c.seed, 1);
  }
  if (level >= 4) tex = fx(tex, [['enchant', { color: c.accent, intensity: 28 + level * 4, width: 3 }], ['sparkle', { count: Math.min(4, level - 2), color: '#ffffff', style: 'cross', animate: level >= 5 }]], t, c.seed);
  if (level >= 5) tex = fx(tex, [['glow', { mode: item(c.base) ? 'outer' : 'bloom', color: c.accent, radius: 1, intensity: 38, pulse: true }]], t, c.seed);
  return tex;
}

function recolor(src: Tex, dark: string, mid: string, light: string, amount = 0.92): Tex {
  return G.remapLuma(src, rgb(dark), rgb(mid), rgb(light), amount);
}

function overlay(src: Tex, layers: [string, Params?][], t = 0, seed = 7): Tex {
  // Keep most of the original; effects sit on top at reduced strength.
  return fx(src, layers, t, seed);
}

function poses(c: Ctx, degrees: number[], extras?: (tex: Tex, i: number, n: number) => Tex): Tex[] {
  const n = degrees.length;
  const frames = degrees.map((d) => G.poseItem(c.base, d, 0.78));
  return frames.map((f, i) => {
    let out = f;
    if (i > 0) {
      const prev = G.poseItem(c.base, degrees[i - 1], 0.78);
      out = G.composite(G.silhouette(prev, rgb(c.accent), 0.28), out);
    }
    return extras ? extras(out, i, n) : out;
  });
}

const ELEMENTS: { id: string; name: string; desc: string; pal: [string, string, string]; extra?: (t: Tex, i: number, n: number) => Tex; animated?: boolean }[] = [
  { id: 'fire', name: '炎', desc: '同じ剣の、火属性版', pal: ['#3a0a00', '#e25822', '#ffe08a'], animated: true, extra: (t, i, n) => overlay(t, [['embers', { type: 'ember', count: 5 }], ['flicker', { amount: 22 }]], i / n) },
  { id: 'ice', name: '氷', desc: '同じ剣の、氷属性版', pal: ['#08243a', '#5ec8e8', '#eefcff'], animated: true, extra: (t, i, n) => overlay(t, [['frost', { amount: 28, crystals: 5 }], ['sparkle', { count: 3, color: '#ffffff', animate: true }]], i / n) },
  { id: 'thunder', name: '雷', desc: '同じ剣の、雷属性版', pal: ['#2a2400', '#e8d024', '#fffde0'], animated: true, extra: (t, i, n) => overlay(t, [['pulse', { color: '#fff3a0', amount: 35, threshold: 130 }]], i / n) },
  { id: 'dark', name: '闇', desc: '同じ剣の、闇属性版', pal: ['#0a0014', '#6a28b0', '#e0c0ff'], extra: (t) => G.outline1(t, [88, 32, 160], true) },
  { id: 'holy', name: '聖', desc: '同じ剣の、聖属性版', pal: ['#3a2a00', '#f0c04a', '#fff8dc'], extra: (t) => overlay(t, [['sparkle', { count: 3, color: '#fff4c8', animate: false }]]) },
  { id: 'poison', name: '毒', desc: '同じ剣の、毒属性版', pal: ['#08200a', '#4cb828', '#d8ff9a'] },
  { id: 'water', name: '水', desc: '同じ剣の、水属性版', pal: ['#04203c', '#2a7ac8', '#d0f4ff'] },
  { id: 'blood', name: '血', desc: '同じ剣の、血属性版', pal: ['#1a0000', '#b01818', '#ffb0a0'] },
];

const MATERIALS: { id: string; name: string; pal: [string, string, string] }[] = [
  { id: 'wood', name: '木', pal: ['#3a2410', '#8a5a2b', '#e0b070'] },
  { id: 'stone', name: '石', pal: ['#2a2a2a', '#7a7a7a', '#d0d0d0'] },
  { id: 'iron', name: '鉄', pal: ['#2a2a30', '#9a9aa4', '#f0f0f4'] },
  { id: 'gold', name: '金', pal: ['#3a2000', '#d9a000', '#fff4b0'] },
  { id: 'diamond', name: 'ダイヤ', pal: ['#062a33', '#2ec4c0', '#eafffd'] },
  { id: 'netherite', name: 'ネザライト', pal: ['#120e10', '#4a4044', '#c0b4b0'] },
];

export const VARIANTS: Variant[] = [
  ...[0, 1, 2, 3, 4, 5].map((lv): Variant => ({
    id: `tier${lv}`, group: 'tier', name: lv === 0 ? '+0 原型' : `+${lv}`, tag: `+${lv}`, animated: lv >= 5,
    desc: ['手を加えていない元のテクスチャ', '輪郭を引き、刃を研いだだけ', '柄巻きと護拳の宝石', '刃を一段階伸ばす', '刃にルーン、弱いエンチャント', '完成形。光をまとった最終強化'][lv],
    build: (c) => (lv >= 5 ? anim(keys(c), (t) => enhance(c, lv, t)) : [enhance(c, lv)]),
  })),

  { id: 'break1', group: 'limit', name: '限界突破', tag: 'LB', animated: true, desc: '同じ+4に、刃から漏れる光の亀裂',
    build: (c) => anim(keys(c), (t) => overlay(enhance(c, 4, t), [['cracks', { count: 3, length: 7, glow: true, depth: 85 }], ['glow', { mode: 'bloom', color: '#ff8c30', radius: 1, intensity: 32, pulse: true }]], t, c.seed)) },
  { id: 'awaken', group: 'limit', name: '覚醒', tag: 'AW', animated: true, desc: '本体はそのまま、残像が翼のように開く',
    build: (c) => {
      const body = enhance(c, 5);
      return anim(keys(c), (t) => {
        const k = 0.7 + 0.3 * Math.sin(t * Math.PI * 2);
        const wing = G.ghostCopies(body, [[-2, 1, 0.22 * k], [2, -1, 0.22 * k], [-3, 2, 0.12 * k], [3, -2, 0.12 * k]], rgb(c.accent));
        return overlay(wing, [['sparkle', { count: 3, color: '#ffffff', style: 'cross', animate: true }]], t, c.seed);
      });
    } },

  { id: 'dual', group: 'form', name: '双刃', animated: false, desc: '中点で折り返した両刃。同じピクセル',
    build: (c) => [G.dualBlade(c.base)] },
  { id: 'great', group: 'form', name: '大剣', animated: false, desc: '刃だけ太く、長くした重量型',
    build: (c) => [G.outline1(G.extendBlade(G.thickenBlade(c.base, 1), G.px(c.base) + 1), [16, 16, 18])] },
  { id: 'dagger', group: 'form', name: '短剣', animated: false, desc: '柄を残して刃を短くした小型',
    build: (c) => { const [hx, hy] = G.handleOf(c.base); return [G.outline1(G.scaleAbout(c.base, 0.72, hx, hy), [16, 16, 18])]; } },
  { id: 'serrated', group: 'form', name: '鋸刃', animated: false, desc: '刃の縁にだけ棘を足した形態',
    build: (c) => [G.addSpikes(c.base, 6, rgb(c.accent), c.seed, 1)] },
  { id: 'broken', group: 'form', name: '欠けた刃', animated: false, desc: '切っ先が欠け、同じ武器の破損状態',
    build: (c) => [G.chipTip(c.base, c.seed, 0.55)] },
  { id: 'twin', group: 'form', name: '二刀', animated: false, desc: '同じ剣を少しずらして二振り',
    build: (c) => {
      const a = G.axis(c.base), s = G.px(c.base) * 2;
      const a1 = G.translateTex(c.base, Math.round(a.px * s), Math.round(a.py * s));
      const a2 = G.translateTex(c.base, Math.round(-a.px * s), Math.round(-a.py * s));
      return [G.composite(G.withAlpha(a1, 0.9), a2)];
    } },

  ...ELEMENTS.map((e): Variant => ({
    id: `el_${e.id}`, group: 'element', name: e.name, tag: e.name, animated: !!e.animated, desc: e.desc,
    build: (c) => {
      const body = recolor(c.base, ...e.pal);
      if (!e.extra) return [body];
      const n = e.animated ? keys(c) : 1;
      return anim(n, (_t, i) => e.extra!(body, i, n));
    },
  })),
  ...MATERIALS.map((m): Variant => ({
    id: `mat_${m.id}`, group: 'material', name: `${m.name}製`, tag: m.name, animated: false, desc: `同じ形の${m.name}バージョン`,
    build: (c) => [recolor(c.base, ...m.pal)],
  })),

  { id: 'charged', group: 'mode', name: 'チャージ', animated: true, desc: '本体はそのまま、輪郭だけ発光',
    build: (c) => anim(keys(c), (t) => overlay(c.base, [['glow', { mode: item(c.base) ? 'outer' : 'bloom', color: c.accent, radius: 1, intensity: 40 + 25 * Math.sin(t * Math.PI * 2), pulse: false }]], t, c.seed)) },
  { id: 'enchanted', group: 'mode', name: 'エンチャント中', animated: true, desc: 'バニラのエンチャントグリント',
    build: (c) => anim(keys(c), (t) => overlay(c.base, [['enchant', { color: '#b070ff', intensity: 50, width: 3 }]], t, c.seed)) },
  { id: 'stealth', group: 'mode', name: 'ステルス', animated: true, desc: '本体を残したまま半透明に',
    build: (c) => anim(keys(c), (t) => G.withAlpha(c.base, 0.4 + 0.12 * Math.sin(t * Math.PI * 2))) },
  { id: 'frozenmode', group: 'mode', name: '凍結', animated: true, desc: '霜を乗せる。色は大きく変えない',
    build: (c) => anim(keys(c), (t) => overlay(c.base, [['frost', { amount: 40, crystals: 6 }], ['sparkle', { count: 2, color: '#ffffff', animate: true }]], t, c.seed)) },
  { id: 'overheat', group: 'mode', name: '過熱', animated: true, desc: '刃のハイライトだけ赤熱',
    build: (c) => anim(keys(c), (t) => overlay(c.base, [['flicker', { amount: 28, color: '#ff8030' }], ['embers', { type: 'ember', count: 4 }]], t, c.seed)) },
  { id: 'blessed', group: 'mode', name: '祝福', animated: true, desc: '金色のアウトラインと星',
    build: (c) => anim(keys(c), (t) => overlay(G.outline1(c.base, [255, 228, 140], true), [['sparkle', { count: 3, style: 'star', color: '#fff4c0', animate: true }]], t, c.seed)) },

  { id: 'slash', group: 'attack', name: '斬撃', animated: true, desc: '振りかぶり → 到達 → 余韻',
    build: (c) => poses(c, [-38, -28, -8, 18, 36, 22, 8, 0], (f, i) => {
      if (i < 2 || i > 4) return f;
      const a = G.axis(c.base);
      const hx = c.base.w * 0.38, hy = c.base.h * 0.72;
      return G.drawArc(f, hx, hy, a.len * 0.55, -Math.PI * 0.9, -Math.PI * 0.15, rgb(c.accent), 0.55, Math.max(1, G.px(c.base)), true);
    }) },
  { id: 'smash', group: 'attack', name: '振り下ろし', animated: true, desc: '振り上げ、叩きつけ、着弾',
    build: (c) => poses(c, [-42, -48, -20, 10, 38, 34, 16, 0], (f, i) => {
      if (i !== 4 && i !== 5) return f;
      const hx = c.base.w * 0.38, hy = c.base.h * 0.72, a = G.axis(c.base);
      return G.drawSparks(f, hx + a.ax * a.len * 0.5, hy + a.ay * a.len * 0.5, 6, G.px(c.base) * 3, [230, 220, 200], c.seed + i, 0.8);
    }) },
  { id: 'thrust', group: 'attack', name: '突き', animated: true, desc: '引いて、一直線に出す',
    build: (c) => {
      const a = G.axis(c.base), s = a.len * 0.22;
      const offsets = [0, -0.35, -0.5, 0.15, 0.85, 1, 0.4, 0];
      return offsets.map((k) => {
        const posed = G.poseItem(c.base, 0, 0.78);
        const moved = G.translateTex(posed, Math.round(a.ax * s * k), Math.round(a.ay * s * k));
        if (k < 0.5) return moved;
        const ghost = G.translateTex(posed, Math.round(a.ax * s * (k - 0.45)), Math.round(a.ay * s * (k - 0.45)));
        return G.composite(G.silhouette(ghost, rgb(c.accent), 0.3), moved);
      });
    } },
  { id: 'guardpose', group: 'attack', name: '防御', animated: true, desc: '横に構えるキーポーズ',
    build: (c) => {
      const hold = G.poseItem(c.base, 55, 0.8, 0.42, 0.62);
      return anim(keys(c), (t) => t < 0.25 ? G.poseItem(c.base, 55 * (t / 0.25), 0.8, 0.42, 0.62) : hold);
    } },
  { id: 'cast', group: 'attack', name: '詠唱', animated: true, desc: '掲げて、周囲に魔法陣',
    build: (c) => {
      const raised = G.poseItem(c.base, -50, 0.72, 0.5, 0.62);
      return anim(keys(c), (t) => {
        const b = G.bounds(raised);
        let ring = G.drawArc(createTex(c.base.w, c.base.h), b.cx, b.cy, Math.min(c.base.w, c.base.h) * 0.36, t * Math.PI * 2, t * Math.PI * 2 + Math.PI * 1.2, rgb(c.accent), 0.5, G.px(c.base), true);
        const itemTex = G.translateTex(raised, 0, Math.round(-Math.sin(t * Math.PI * 2) * G.px(c.base)));
        return G.composite(ring, itemTex);
      });
    } },
  { id: 'idle', group: 'attack', name: '待機', animated: true, desc: '元の向きのまま、1〜2px浮く',
    build: (c) => anim(keys(c), (t) => G.translateTex(c.base, 0, Math.round(-Math.sin(t * Math.PI * 2)))) },
];

export const variantsOf = (g: GroupId) => VARIANTS.filter((v) => v.group === g);
export const VARIANT_MAP: Record<string, Variant> = Object.fromEntries(VARIANTS.map((v) => [v.id, v]));
export const familyLine = (g: GroupId) => variantsOf(g).map((v) => v.id);
