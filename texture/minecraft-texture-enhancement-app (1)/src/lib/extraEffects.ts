import type { EffectDef, ParamDef } from './effects';
import { Tex, cloneTex, clamp, fbm, hash2, hexToRgb, hslToRgb, lum, mod } from './tex';

type RGB = [number, number, number];
const amount: ParamDef = { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 55 };
const color = (value: string): ParamDef => ({ key: 'color', label: 'カラー', type: 'color', default: value });
const scale: ParamDef = { key: 'scale', label: '模様の密度', type: 'range', min: 2, max: 12, default: 5 };
const animate: ParamDef = { key: 'animate', label: 'アニメーション', type: 'bool', default: false };

function paint(src: Tex, fn: (rgb: RGB, x: number, y: number) => RGB): Tex {
  const out = cloneTex(src);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const i = (y * src.w + x) * 4;
    if (!src.d[i + 3]) continue;
    const c = fn([src.d[i], src.d[i + 1], src.d[i + 2]], x, y);
    out.d[i] = c[0]; out.d[i + 1] = c[1]; out.d[i + 2] = c[2];
  }
  return out;
}
const mix = (a: RGB, b: RGB, k: number): RGB => a.map((v, i) => v + (b[i] - v) * clamp(k, 0, 1)) as RGB;

export const EXTRA_EFFECTS: EffectDef[] = [
  {
    id: 'crystalline', name: 'クリスタル', category: 'texture', icon: 'gem', isNew: true,
    desc: '結晶の面と光の反射を加え、宝石のような質感に。',
    params: [color('#a48aff'), amount, scale],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const n = fbm(ctx.seed, src.w, src.h, p.scale, 2);
      return paint(src, (rgb, x, y) => {
        const v = n(x, y), facet = Math.floor(v * 7) / 7;
        const edge = Math.abs(v * 7 - Math.round(v * 7)) < 0.13;
        const l = lum(...rgb) / 255;
        const target = c.map((q) => q * (0.25 + facet * 0.8 + l * 0.4) + (edge ? 75 : 0)) as RGB;
        return mix(rgb, target, p.amount / 100);
      });
    },
  },
  {
    id: 'neonEdge', name: 'ネオンエッジ', category: 'decor', icon: 'zap', isNew: true,
    desc: '明度の境界を検出して発光ラインを描きます。',
    params: [color('#77ffdb'), amount, { key: 'threshold', label: 'エッジ感度', type: 'range', min: 1, max: 100, default: 28 }],
    apply(src, p) {
      const c = hexToRgb(p.color);
      const L = (x: number, y: number) => { const i = (mod(y, src.h) * src.w + mod(x, src.w)) * 4; return lum(src.d[i], src.d[i + 1], src.d[i + 2]); };
      return paint(src, (rgb, x, y) => {
        const edge = Math.hypot(L(x + 1, y) - L(x - 1, y), L(x, y + 1) - L(x, y - 1));
        return mix(rgb, c, clamp((edge - p.threshold) / 90, 0, 1) * p.amount / 100);
      });
    },
  },
  {
    id: 'woodgrain', name: '木目ディテール', category: 'texture', icon: 'tree', isNew: true,
    desc: 'ゆるやかに曲がる木目を重ね、天然木の表情を追加。',
    params: [color('#a97e4f'), amount, scale],
    apply(src, p, ctx) {
      const n = fbm(ctx.seed, src.w, src.h, 3, 2), c = hexToRgb(p.color);
      return paint(src, (rgb, x, y) => {
        const grain = Math.pow(0.5 + 0.5 * Math.sin((x / src.w * p.scale + n(x, y) * 0.7) * Math.PI * 2), 5);
        return mix(rgb, c.map((v) => v * (0.7 + grain * 0.55)) as RGB, p.amount / 100);
      });
    },
  },
  {
    id: 'brushedMetal', name: 'ヘアラインメタル', category: 'texture', icon: 'layers', isNew: true,
    desc: '金属の細い研磨ラインと幅広い反射を表現。',
    params: [color('#a5b6c0'), amount, { key: 'vertical', label: '縦方向のライン', type: 'bool', default: false }],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      return paint(src, (rgb, x, y) => {
        const row = p.vertical ? x : y, column = p.vertical ? y : x;
        const streak = hash2(row, 0, ctx.seed) * 0.25 + hash2(row, Math.floor(column / 8), ctx.seed) * 0.08;
        const reflection = Math.pow(Math.sin(column / Math.max(src.w, src.h) * Math.PI), 5) * 0.4;
        return mix(rgb, c.map((v) => v * (0.4 + lum(...rgb) / 500 + streak + reflection)) as RGB, p.amount / 100);
      });
    },
  },
  {
    id: 'fabric', name: 'ファブリック', category: 'texture', icon: 'grid', isNew: true,
    desc: '縦糸と横糸を交互に織り込んだ布地のディテール。',
    params: [amount, { key: 'size', label: '糸の太さ', type: 'range', min: 1, max: 4, default: 1 }],
    apply(src, p) {
      return paint(src, (rgb, x, y) => {
        const u = Math.floor(x / p.size), v = Math.floor(y / p.size);
        const delta = ((u + v) % 2 ? -1 : 1) * 34 * p.amount / 100;
        return rgb.map((q) => q + delta) as RGB;
      });
    },
  },
  {
    id: 'pearl', name: 'パール光沢', category: 'color', icon: 'palette', isNew: true,
    desc: '淡い虹色の干渉光。真珠や魔法のアイテムに。',
    params: [amount, animate],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      return paint(src, (rgb, x, y) => {
        const l = lum(...rgb) / 255;
        const hue = (x / src.w - y / src.h) * 160 + l * 220 + (p.animate ? ctx.t * 360 : 0);
        return mix(rgb, hslToRgb(hue, 0.45, clamp(l * 0.65 + 0.28, 0, 0.95)), p.amount / 100);
      });
    },
  },
  {
    id: 'aurora', name: 'オーロラ', category: 'anim', icon: 'waves', isNew: true,
    desc: '緑から紫へ移ろう、ゆらめく光のカーテン。',
    params: [amount, scale, { ...animate, default: true }],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      return paint(src, (rgb, x, y) => {
        const u = x / src.w, v = y / src.h, t = p.animate ? ctx.t * Math.PI * 2 : 0;
        const wave = Math.sin(u * Math.PI * 2 * p.scale + Math.sin(v * 5 + t) * 2);
        const ribbon = Math.pow(Math.max(0, wave), 3) * (0.4 + v * 0.6);
        const c = hslToRgb(150 + v * 125 + Math.sin(t) * 20, 0.8, 0.65);
        return rgb.map((q, i) => q + c[i] * ribbon * p.amount / 100) as RGB;
      });
    },
  },
  {
    id: 'nebula', name: '星雲', category: 'decor', icon: 'sparkles', isNew: true,
    desc: '星屑が浮かぶ青紫の星雲をピクセルで描写。',
    params: [amount, scale, { key: 'stars', label: '星の密度', type: 'range', min: 0, max: 100, default: 35 }],
    apply(src, p, ctx) {
      const n = fbm(ctx.seed, src.w, src.h, p.scale, 3);
      return paint(src, (rgb, x, y) => {
        const v = n(x, y), c = hslToRgb(200 + v * 100, 0.8, 0.15 + v * 0.45);
        if (hash2(x, y, ctx.seed + 91) > 1 - p.stars / 6000) return mix(rgb, [234, 247, 255], p.amount / 100);
        return mix(rgb, c, p.amount / 100);
      });
    },
  },
  {
    id: 'magicCircle', name: '魔法陣', category: 'decor', icon: 'orbit', isNew: true,
    desc: '二重の魔法円と幾何学模様を発光色で刻印。',
    params: [color('#a2ffe8'), amount, { ...animate, label: '脈動させる' }],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), pulse = p.animate ? 0.65 + 0.35 * Math.sin(ctx.t * Math.PI * 2) : 1;
      return paint(src, (rgb, x, y) => {
        const u = (x + 0.5) / src.w - 0.5, v = (y + 0.5) / src.h - 0.5;
        const r = Math.hypot(u, v), a = Math.atan2(v, u), width = 0.7 / Math.min(src.w, src.h);
        const rings = Math.abs(r - 0.39) < width || Math.abs(r - 0.29) < width;
        const glyph = r > 0.31 && r < 0.37 && Math.abs(Math.sin(a * 8)) < 0.3;
        const diamond = Math.abs(Math.abs(u) + Math.abs(v) - 0.3) < width;
        return rings || glyph || diamond ? mix(rgb, c, p.amount / 100 * pulse) : rgb;
      });
    },
  },
  {
    id: 'hatching', name: 'クロスハッチ', category: 'texture', icon: 'pen', isNew: true,
    desc: '陰影に細い斜線を加えて手描きの雰囲気に。',
    params: [amount, { key: 'spacing', label: '線の間隔', type: 'range', min: 2, max: 8, default: 4 }],
    apply(src, p) {
      return paint(src, (rgb, x, y) => {
        const l = lum(...rgb), line = (l < 175 && (x + y) % p.spacing === 0) || (l < 85 && mod(x - y, p.spacing) === 0);
        return line ? mix(rgb, [18, 22, 24], p.amount / 100) : rgb;
      });
    },
  },
  {
    id: 'chromatic', name: '色収差', category: 'transform', icon: 'move', isNew: true,
    desc: 'RGBチャンネルをずらしてサイバーな色のにじみを追加。',
    params: [amount, { key: 'offset', label: 'ずらし幅 (px)', type: 'range', min: 1, max: 6, default: 1 }],
    apply(src, p) {
      return paint(src, (rgb, x, y) => {
        const left = (y * src.w + mod(x - p.offset, src.w)) * 4;
        const right = (y * src.w + mod(x + p.offset, src.w)) * 4;
        return mix(rgb, [src.d[right + 3] ? src.d[right] : rgb[0], rgb[1], src.d[left + 3] ? src.d[left + 2] : rgb[2]], p.amount / 100);
      });
    },
  },
  {
    id: 'glassSurface', name: 'ガラスコート', category: 'texture', icon: 'diamond', isNew: true,
    desc: '透明感のある斜めの反射光と、きれいなエッジ。',
    params: [color('#bde9f5'), amount, { key: 'frosted', label: 'すりガラス', type: 'bool', default: false }],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      return paint(src, (rgb, x, y) => {
        const u = x / src.w, v = y / src.h, d = u - v;
        const shine = Math.abs(d - 0.2) < 0.09 ? 0.6 : Math.abs(d - 0.4) < 0.025 ? 0.3 : 0.04;
        const edge = x === 0 || y === 0 || x === src.w - 1 || y === src.h - 1;
        const frost = p.frosted ? hash2(x, y, ctx.seed) * 0.28 : 0;
        return mix(rgb, c, (shine + (edge ? 0.3 : 0) + frost) * p.amount / 100);
      });
    },
  },
];