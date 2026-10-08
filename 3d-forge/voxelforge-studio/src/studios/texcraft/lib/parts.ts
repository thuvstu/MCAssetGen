import { Tex, createTex, cloneTex, clamp, hexToRgb, hash2, lum } from './tex';

/* ============================================================
   Pixel overlay parts — blades, guards, gems, auras, etc.
   Stamps are 16×16 bitmaps, nearest-scaled onto any texture size.
   ============================================================ */

export type PartCategory = 'blade' | 'guard' | 'pommel' | 'gem' | 'aura' | 'wing' | 'chain' | 'rune' | 'eye' | 'flame';

export interface PartDef {
  id: string;
  name: string;
  icon: string;
  category: PartCategory;
  rows: string[];
  palette: Record<string, string>;
}

export const PART_CATEGORIES: { id: PartCategory; name: string; icon: string }[] = [
  { id: 'blade', name: '刃', icon: '🗡️' },
  { id: 'guard', name: '鍔', icon: '🛡️' },
  { id: 'pommel', name: '柄頭', icon: '🔘' },
  { id: 'gem', name: '宝石', icon: '💎' },
  { id: 'aura', name: 'オーラ', icon: '✨' },
  { id: 'wing', name: '翼', icon: '🪽' },
  { id: 'chain', name: '鎖', icon: '⛓️' },
  { id: 'rune', name: 'ルーン', icon: 'ᚱ' },
  { id: 'eye', name: '魔眼', icon: '👁' },
  { id: 'flame', name: '炎', icon: '🔥' },
];

const pal = {
  steel: { o: '#1a1a1e', l: '#e8e8f0', m: '#a0a8b8', d: '#5a6270' },
  gold: { o: '#3a2200', l: '#fff4b0', m: '#e0b040', d: '#8a5a10' },
  dark: { o: '#0a0810', l: '#6a6080', m: '#3a3050', d: '#1a1428' },
  ruby: { o: '#3a0610', l: '#ffe0e6', m: '#d8203c', d: '#8a0f22', w: '#ffffff' },
  sapph: { o: '#061830', l: '#d0f0ff', m: '#2080d8', d: '#104888', w: '#ffffff' },
  emer: { o: '#082018', l: '#d0ffe8', m: '#20c868', d: '#0c7040', w: '#ffffff' },
  ameth: { o: '#1a0830', l: '#f0d8ff', m: '#a040e0', d: '#582088', w: '#ffffff' },
  fire: { o: '#3a1000', l: '#ffe080', m: '#ff6020', d: '#a02008', w: '#ffffff' },
  ice: { o: '#082838', l: '#e8fbff', m: '#60d0f0', d: '#2080a8' },
  void: { o: '#100018', l: '#c080ff', m: '#6020a0', d: '#301050' },
  bone: { o: '#2a2218', l: '#f0e8d0', m: '#c8b890', d: '#7a6a48' },
  wood: { o: '#2a1808', l: '#d8a868', m: '#8a5a2b', d: '#4d3313' },
};

export const PARTS: PartDef[] = [
  /* ---- blades ---- */
  { id: 'blade_long', name: '長剣の刃', icon: '🗡️', category: 'blade',
    palette: pal.steel,
    rows: [
      '..............lo', '.............lmo', '............lmdo', '...........lmdo.',
      '..........lmdo..', '.........lmdo...', '........lmdo....', '.......lmdo.....',
      '......lmdo......', '.....lmdo.......', '....lmdo........', '...lmdo.........',
      '..lmdo..........', '.lmdo...........', 'lmdo............', 'ooo.............',
    ] },
  { id: 'blade_broad', name: '大剣の刃', icon: '⚔️', category: 'blade',
    palette: pal.steel,
    rows: [
      '............lmoo', '...........lmmdo', '..........lmmddo', '.........lmmddo.',
      '........lmmddo..', '.......lmmddo...', '......lmmddo....', '.....lmmddo.....',
      '....lmmddo......', '...lmmddo.......', '..lmmddo........', '.lmmddo.........',
      'lmmddo..........', 'mmddo...........', 'oddo............', 'ooo.............',
    ] },
  { id: 'blade_dagger', name: '短剣の刃', icon: '🔪', category: 'blade',
    palette: pal.steel,
    rows: [
      '................', '................', '................', '.............lo.',
      '............lmo.', '...........lmdo.', '..........lmdo..', '.........lmdo...',
      '........lmdo....', '.......lmdo.....', '......lmdo......', '.....ooo........',
      '................', '................', '................', '................',
    ] },
  { id: 'blade_scythe', name: '鎌の刃', icon: '🌙', category: 'blade',
    palette: pal.dark,
    rows: [
      '......lllllmoooo', '.....lmmmmmddddo', '....lmddddoooo..', '...lmdo.........',
      '..lmdo..........', '.lmdo...........', 'lmdo............', 'mdo.............',
      'do..............', 'o...............', '................', '................',
      '................', '................', '................', '................',
    ] },
  { id: 'blade_axe', name: '斧の刃', icon: '🪓', category: 'blade',
    palette: pal.steel,
    rows: [
      '................', '....oooooooo....', '...ollllllmmo...', '..olmmmmmmddo...',
      '.olmmmmmmmdddo..', '.olmmmmmmddddo..', '..olmmmmmdddo...', '...olmmmdddo....',
      '....oooooo......', '......oo........', '......oo........', '......oo........',
      '......oo........', '......oo........', '......oo........', '................',
    ] },
  { id: 'blade_spear', name: '槍先', icon: '🔱', category: 'blade',
    palette: pal.steel,
    rows: [
      '.......lo.......', '......lmdo......', '.....lmmddo.....', '....lmmmdddo....',
      '.....lmmddo.....', '......lmdo......', '.......oo.......', '.......oo.......',
      '.......oo.......', '.......oo.......', '.......oo.......', '.......oo.......',
      '.......oo.......', '.......oo.......', '.......oo.......', '................',
    ] },

  /* ---- guards ---- */
  { id: 'guard_cross', name: '十字鍔', icon: '✝️', category: 'guard',
    palette: pal.gold,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '................', '................', '..oooooooooooo..', '.ollllllllllmmo.',
      '.olmmmmmmmmmddo.', '..oooooooooooo..', '................', '................',
    ] },
  { id: 'guard_wing', name: '翼鍔', icon: '🪽', category: 'guard',
    palette: pal.gold,
    rows: [
      '................', '................', '................', '................',
      '................', '................', 'lmo..........lmo', 'lmdo........lmdo',
      '.lmdo......lmdo.', '..lmdoooooomdo..', '...lmmmmmmmdo...', '....oooooooo....',
      '................', '................', '................', '................',
    ] },
  { id: 'guard_skull', name: 'ドクロ鍔', icon: '💀', category: 'guard',
    palette: pal.bone,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '....oooooooo....',
      '...ollllllmmo...', '..ol.ll.ll.mdo..', '..ollllllllmddo.', '...olmmmmmmdo...',
      '....ol.mm.do....', '.....oooooo.....', '................', '................',
    ] },
  { id: 'guard_crescent', name: '三日月鍔', icon: '🌙', category: 'guard',
    palette: pal.sapph,
    rows: [
      '................', '................', '................', '................',
      '................', 'lmo..........lmo', 'lmdo........lmdo', '.lmdo......lmdo.',
      '..lmdo....lmdo..', '...lmoooooldo...', '....oooooooo....', '................',
      '................', '................', '................', '................',
    ] },

  /* ---- pommels ---- */
  { id: 'pommel_orb', name: '宝珠柄頭', icon: '⚪', category: 'pommel',
    palette: pal.gold,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '................', '................', '................', '......oooo......',
      '.....olllmo.....', '.....olmmdo.....', '......oooo......', '................',
    ] },
  { id: 'pommel_spike', name: 'スパイク柄頭', icon: '🔻', category: 'pommel',
    palette: pal.dark,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '................', '................', '................', '......oooo......',
      '.....olmmdo.....', '......lmdo......', '.......lo.......', '................',
    ] },
  { id: 'pommel_skull', name: '髑髏柄頭', icon: '☠️', category: 'pommel',
    palette: pal.bone,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '................', '................', '.....oooooo.....', '....olllllmo....',
      '...ol.ll.lmdo...', '....ollllldo....', '.....olmmdo.....', '......oooo......',
    ] },

  /* ---- gems ---- */
  { id: 'gem_center', name: '中央の宝石', icon: '💠', category: 'gem',
    palette: pal.ruby,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '......oooo......', '.....olllmo.....',
      '....olwllmdo....', '.....olmmdo.....', '......oooo......', '................',
      '................', '................', '................', '................',
    ] },
  { id: 'gem_hilt', name: '柄の宝石', icon: '🔹', category: 'gem',
    palette: pal.sapph,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '................', '................', '......oooo......', '.....olllmo.....',
      '.....olmmdo.....', '......oooo......', '................', '................',
    ] },
  { id: 'gem_triple', name: '三連宝石', icon: '💎', category: 'gem',
    palette: pal.ameth,
    rows: [
      '................', '................', '................', '................',
      '................', '..ooo......ooo..', '.olmo......olmo.', '.omdo......omdo.',
      '..ooo..oo..ooo..', '......olmo......', '......omdo......', '.......oo.......',
      '................', '................', '................', '................',
    ] },

  /* ---- auras (drawn around silhouette) ---- */
  { id: 'aura_ring', name: '光輪', icon: '⭕', category: 'aura',
    palette: pal.gold,
    rows: [
      '....oooooooo....', '...o........o...', '..o..........o..', '.o............o.',
      'o..............o', 'o..............o', 'o..............o', 'o..............o',
      'o..............o', 'o..............o', 'o..............o', 'o..............o',
      '.o............o.', '..o..........o..', '...o........o...', '....oooooooo....',
    ] },
  { id: 'aura_spark', name: '火花の輪', icon: '✨', category: 'aura',
    palette: pal.fire,
    rows: [
      'l..o........o..l', '.l..........l...', '................', 'o..............o',
      '................', '................', '................', 'o..............o',
      'o..............o', '................', '................', '................',
      'o..............o', '................', '.l..........l...', 'l..o........o..l',
    ] },
  { id: 'aura_void', name: '虚無の輪', icon: '🕳️', category: 'aura',
    palette: pal.void,
    rows: [
      '................', '...oooooooooo...', '..o..........o..', '.o............o.',
      '.o............o.', 'o..............o', 'o..............o', 'o..............o',
      'o..............o', 'o..............o', 'o..............o', '.o............o.',
      '.o............o.', '..o..........o..', '...oooooooooo...', '................',
    ] },

  /* ---- wings ---- */
  { id: 'wing_angel', name: '天使の翼', icon: '😇', category: 'wing',
    palette: pal.bone,
    rows: [
      'lmo..........lmo', 'lmdo........lmdo', 'lmmdo......lmmdo', '.lmmdo....lmmdo.',
      '..lmdo....lmdo..', '...lmo....lmo...', '....lo....lo....', '................',
      '................', '................', '................', '................',
      '................', '................', '................', '................',
    ] },
  { id: 'wing_demon', name: '悪魔の翼', icon: '😈', category: 'wing',
    palette: pal.dark,
    rows: [
      'l..............l', 'ml............lm', 'dml..........lmd', 'odml........lmdo',
      '.odml......lmdo.', '..odml....lmdo..', '...odml..lmdo...', '....odoooooo....',
      '................', '................', '................', '................',
      '................', '................', '................', '................',
    ] },
  { id: 'wing_bat', name: 'コウモリ翼', icon: '🦇', category: 'wing',
    palette: pal.void,
    rows: [
      '................', 'l..............l', 'ml.l........l.lm', 'dmlml......lmlmd',
      'odmmmdo..odmmmdo', '.odmdo....odmdo.', '..ooo......ooo..', '................',
      '................', '................', '................', '................',
      '................', '................', '................', '................',
    ] },

  /* ---- chains ---- */
  { id: 'chain_side', name: '側面の鎖', icon: '⛓️', category: 'chain',
    palette: pal.steel,
    rows: [
      'o..............o', 'lo............ol', 'mo............om', 'do............od',
      'o..............o', 'lo............ol', 'mo............om', 'do............od',
      'o..............o', 'lo............ol', 'mo............om', 'do............od',
      'o..............o', 'lo............ol', 'mo............om', 'o..............o',
    ] },
  { id: 'chain_hang', name: '垂れ鎖', icon: '🔗', category: 'chain',
    palette: pal.gold,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '..o..........o..', '..lo........ol..', '..mo........om..', '..do........od..',
      '..o..........o..', '..lo........ol..', '..o..........o..', '................',
    ] },

  /* ---- runes ---- */
  { id: 'rune_blade', name: '刃のルーン', icon: 'ᚱ', category: 'rune',
    palette: pal.ameth,
    rows: [
      '................', '.............l..', '............lml.', '...........l.m..',
      '..........lml...', '.........l.m....', '........lml.....', '.......l.m......',
      '......lml.......', '.....l.m........', '....lml.........', '...l.m..........',
      '..lml...........', '.l.m............', 'lml.............', '................',
    ] },
  { id: 'rune_circle', name: '円形ルーン', icon: '🔮', category: 'rune',
    palette: pal.ice,
    rows: [
      '................', '....oooooooo....', '...o.l....l.o...', '..o..ml..lm..o..',
      '.o....oooo....o.', '.o.l........l.o.', '.oml........lmo.', '.o............o.',
      '.o............o.', '.oml........lmo.', '.o.l........l.o.', '.o....oooo....o.',
      '..o..ml..lm..o..', '...o.l....l.o...', '....oooooooo....', '................',
    ] },

  /* ---- eyes ---- */
  { id: 'eye_center', name: '中央の魔眼', icon: '👁', category: 'eye',
    palette: pal.emer,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '.....oooooo.....', '....olllllmo....',
      '...ol..ww..mdo..', '....ollllldo....', '.....oooooo.....', '................',
      '................', '................', '................', '................',
    ] },
  { id: 'eye_pair', name: '双眸', icon: '👀', category: 'eye',
    palette: pal.fire,
    rows: [
      '................', '................', '................', '................',
      '..oooo....oooo..', '.olllmo..olllmo.', '.ol.w.do.ol.w.do', '.olllmo..olllmo.',
      '..oooo....oooo..', '................', '................', '................',
      '................', '................', '................', '................',
    ] },

  /* ---- flames ---- */
  { id: 'flame_tip', name: '刃先の炎', icon: '🔥', category: 'flame',
    palette: pal.fire,
    rows: [
      '.............l..', '............lml.', '...........lmmd.', '..........lmmdo.',
      '.........lmdo...', '........lmo.....', '................', '................',
      '................', '................', '................', '................',
      '................', '................', '................', '................',
    ] },
  { id: 'flame_wrap', name: '巻き炎', icon: '🌋', category: 'flame',
    palette: pal.fire,
    rows: [
      'l..............l', '.l............l.', '..l..........l..', 'l.ml........lm.l',
      '.lmd........dml.', '..ld........dl..', '................', '................',
      '................', '................', '................', '................',
      '..ld........dl..', '.lmd........dml.', 'l.ml........lm.l', 'l..............l',
    ] },
  { id: 'flame_trail', name: '炎の尾', icon: '☄️', category: 'flame',
    palette: pal.fire,
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '................', '................', 'l...............', 'ml..............',
      'dml.............', 'odml............', '.odml...........', '..ooo...........',
    ] },
];

function stampToTex(part: PartDef): Tex {
  const rows = part.rows;
  const h = rows.length, w = rows[0].length;
  const t = createTex(w, h);
  const palMap: Record<string, string> = { w: '#ffffff', ...part.palette };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === '.' || !palMap[ch]) continue;
    const [r, g, b] = hexToRgb(palMap[ch]);
    const i = (y * w + x) * 4;
    t.d[i] = r; t.d[i + 1] = g; t.d[i + 2] = b; t.d[i + 3] = 255;
  }
  return t;
}

function nearestOnto(src: Tex, dstW: number, dstH: number): Tex {
  const out = createTex(dstW, dstH);
  for (let y = 0; y < dstH; y++) for (let x = 0; x < dstW; x++) {
    const sx = Math.min(src.w - 1, Math.floor((x * src.w) / dstW));
    const sy = Math.min(src.h - 1, Math.floor((y * src.h) / dstH));
    const si = (sy * src.w + sx) * 4;
    if (!src.d[si + 3]) continue;
    out.d.set(src.d.subarray(si, si + 4), (y * dstW + x) * 4);
  }
  return out;
}

export type BlendMode = 'over' | 'under' | 'add' | 'multiply' | 'screen';

export function stampPart(base: Tex, part: PartDef, blend: BlendMode = 'over', amount = 100, recolor?: string): Tex {
  const stamp = nearestOnto(stampToTex(part), base.w, base.h);
  const out = cloneTex(base);
  const k = amount / 100;
  let rec: [number, number, number] | null = null;
  if (recolor) rec = hexToRgb(recolor);
  for (let i = 0; i < stamp.d.length; i += 4) {
    const sa = stamp.d[i + 3] / 255;
    if (sa < 0.02) continue;
    let sr = stamp.d[i], sg = stamp.d[i + 1], sb = stamp.d[i + 2];
    if (rec) {
      const l = lum(sr, sg, sb) / 255;
      sr = rec[0] * l; sg = rec[1] * l; sb = rec[2] * l;
    }
    const da = out.d[i + 3] / 255;
    const a = sa * k;
    if (blend === 'under' && da > 0.5) continue;
    if (blend === 'over' || blend === 'under') {
      const oa = a + da * (1 - a);
      if (oa < 0.01) continue;
      out.d[i] = (sr * a + out.d[i] * da * (1 - a)) / oa;
      out.d[i + 1] = (sg * a + out.d[i + 1] * da * (1 - a)) / oa;
      out.d[i + 2] = (sb * a + out.d[i + 2] * da * (1 - a)) / oa;
      out.d[i + 3] = clamp(oa * 255);
    } else if (blend === 'add') {
      out.d[i] = clamp(out.d[i] + sr * a);
      out.d[i + 1] = clamp(out.d[i + 1] + sg * a);
      out.d[i + 2] = clamp(out.d[i + 2] + sb * a);
      out.d[i + 3] = Math.max(out.d[i + 3], a * 255);
    } else if (blend === 'multiply') {
      out.d[i] = mix(out.d[i], (out.d[i] * sr) / 255, a);
      out.d[i + 1] = mix(out.d[i + 1], (out.d[i + 1] * sg) / 255, a);
      out.d[i + 2] = mix(out.d[i + 2], (out.d[i + 2] * sb) / 255, a);
    } else if (blend === 'screen') {
      out.d[i] = mix(out.d[i], 255 - ((255 - out.d[i]) * (255 - sr)) / 255, a);
      out.d[i + 1] = mix(out.d[i + 1], 255 - ((255 - out.d[i + 1]) * (255 - sg)) / 255, a);
      out.d[i + 2] = mix(out.d[i + 2], 255 - ((255 - out.d[i + 2]) * (255 - sb)) / 255, a);
    }
  }
  return out;
}
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

export const PART_MAP: Record<string, PartDef> = Object.fromEntries(PARTS.map((p) => [p.id, p]));

/** jitter overlay pixels slightly so auras feel alive */
export function animatePart(base: Tex, part: PartDef, t: number, seed: number): Tex {
  const stamped = stampPart(base, part, part.category === 'aura' || part.category === 'flame' ? 'add' : 'over', 100);
  if (part.category !== 'aura' && part.category !== 'flame' && part.category !== 'eye') return stamped;
  const out = cloneTex(stamped);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
    const i = (y * out.w + x) * 4;
    if (!out.d[i + 3]) continue;
    const n = hash2(x, y, seed);
    const pulse = 0.7 + 0.3 * Math.sin((t + n) * Math.PI * 2);
    if (part.category === 'eye') {
      const blink = Math.abs(Math.sin(t * Math.PI * 4 + n)) < 0.08;
      if (blink) out.d[i + 3] = 0;
    } else {
      out.d[i] = clamp(out.d[i] * pulse);
      out.d[i + 1] = clamp(out.d[i + 1] * pulse);
      out.d[i + 2] = clamp(out.d[i + 2] * pulse);
    }
  }
  return out;
}
