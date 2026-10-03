// src/lib/tex.ts
var createTex = (w, h) => ({ w, h, d: new Uint8ClampedArray(w * h * 4) });
var cloneTex = (t) => ({ w: t.w, h: t.h, d: new Uint8ClampedArray(t.d) });
var clamp = (v, a = 0, b = 255) => v < a ? a : v > b ? b : v;
var lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
var fract = (v) => v - Math.floor(v);
var mod = (v, m) => (v % m + m) % m;
function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653) | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function tileNoise(seed, period) {
  return (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const m = (v) => mod(v, period);
    const a = hash2(m(x0), m(y0), seed), b = hash2(m(x0 + 1), m(y0), seed), c = hash2(m(x0), m(y0 + 1), seed), d = hash2(m(x0 + 1), m(y0 + 1), seed);
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(seed, w, h, scale2, octaves = 3) {
  const layers = Array.from({ length: octaves }, (_, o) => ({
    n: tileNoise(seed + o * 101, Math.max(1, Math.round(scale2 * 2 ** o))),
    f: Math.max(1, Math.round(scale2 * 2 ** o)),
    a: 0.5 ** o
  }));
  const total = layers.reduce((s, l) => s + l.a, 0);
  return (x, y) => {
    let s = 0;
    for (const l of layers) s += l.n(x / w * l.f, y / h * l.f) * l.a;
    return s / total;
  };
}
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16) || 0;
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  h = mod(h, 360) / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = mod(t, 1);
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

// src/lib/extraEffects.ts
var amount = { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 55 };
var color = (value) => ({ key: "color", label: "\u30AB\u30E9\u30FC", type: "color", default: value });
var scale = { key: "scale", label: "\u6A21\u69D8\u306E\u5BC6\u5EA6", type: "range", min: 2, max: 12, default: 5 };
var animate = { key: "animate", label: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3", type: "bool", default: false };
function paint(src, fn) {
  const out = cloneTex(src);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const i = (y * src.w + x) * 4;
    if (!src.d[i + 3]) continue;
    const c = fn([src.d[i], src.d[i + 1], src.d[i + 2]], x, y);
    out.d[i] = c[0];
    out.d[i + 1] = c[1];
    out.d[i + 2] = c[2];
  }
  return out;
}
var mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * clamp(k, 0, 1));
var EXTRA_EFFECTS = [
  {
    id: "crystalline",
    name: "\u30AF\u30EA\u30B9\u30BF\u30EB",
    category: "texture",
    icon: "gem",
    isNew: true,
    desc: "\u7D50\u6676\u306E\u9762\u3068\u5149\u306E\u53CD\u5C04\u3092\u52A0\u3048\u3001\u5B9D\u77F3\u306E\u3088\u3046\u306A\u8CEA\u611F\u306B\u3002",
    params: [color("#a48aff"), amount, scale],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const n = fbm(ctx.seed, src.w, src.h, p.scale, 2);
      return paint(src, (rgb, x, y) => {
        const v = n(x, y), facet = Math.floor(v * 7) / 7;
        const edge = Math.abs(v * 7 - Math.round(v * 7)) < 0.13;
        const l = lum(...rgb) / 255;
        const target = c.map((q) => q * (0.25 + facet * 0.8 + l * 0.4) + (edge ? 75 : 0));
        return mix(rgb, target, p.amount / 100);
      });
    }
  },
  {
    id: "neonEdge",
    name: "\u30CD\u30AA\u30F3\u30A8\u30C3\u30B8",
    category: "decor",
    icon: "zap",
    isNew: true,
    desc: "\u660E\u5EA6\u306E\u5883\u754C\u3092\u691C\u51FA\u3057\u3066\u767A\u5149\u30E9\u30A4\u30F3\u3092\u63CF\u304D\u307E\u3059\u3002",
    params: [color("#77ffdb"), amount, { key: "threshold", label: "\u30A8\u30C3\u30B8\u611F\u5EA6", type: "range", min: 1, max: 100, default: 28 }],
    apply(src, p) {
      const c = hexToRgb(p.color);
      const L = (x, y) => {
        const i = (mod(y, src.h) * src.w + mod(x, src.w)) * 4;
        return lum(src.d[i], src.d[i + 1], src.d[i + 2]);
      };
      return paint(src, (rgb, x, y) => {
        const edge = Math.hypot(L(x + 1, y) - L(x - 1, y), L(x, y + 1) - L(x, y - 1));
        return mix(rgb, c, clamp((edge - p.threshold) / 90, 0, 1) * p.amount / 100);
      });
    }
  },
  {
    id: "woodgrain",
    name: "\u6728\u76EE\u30C7\u30A3\u30C6\u30FC\u30EB",
    category: "texture",
    icon: "tree",
    isNew: true,
    desc: "\u3086\u308B\u3084\u304B\u306B\u66F2\u304C\u308B\u6728\u76EE\u3092\u91CD\u306D\u3001\u5929\u7136\u6728\u306E\u8868\u60C5\u3092\u8FFD\u52A0\u3002",
    params: [color("#a97e4f"), amount, scale],
    apply(src, p, ctx) {
      const n = fbm(ctx.seed, src.w, src.h, 3, 2), c = hexToRgb(p.color);
      return paint(src, (rgb, x, y) => {
        const grain = Math.pow(0.5 + 0.5 * Math.sin((x / src.w * p.scale + n(x, y) * 0.7) * Math.PI * 2), 5);
        return mix(rgb, c.map((v) => v * (0.7 + grain * 0.55)), p.amount / 100);
      });
    }
  },
  {
    id: "brushedMetal",
    name: "\u30D8\u30A2\u30E9\u30A4\u30F3\u30E1\u30BF\u30EB",
    category: "texture",
    icon: "layers",
    isNew: true,
    desc: "\u91D1\u5C5E\u306E\u7D30\u3044\u7814\u78E8\u30E9\u30A4\u30F3\u3068\u5E45\u5E83\u3044\u53CD\u5C04\u3092\u8868\u73FE\u3002",
    params: [color("#a5b6c0"), amount, { key: "vertical", label: "\u7E26\u65B9\u5411\u306E\u30E9\u30A4\u30F3", type: "bool", default: false }],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      return paint(src, (rgb, x, y) => {
        const row = p.vertical ? x : y, column = p.vertical ? y : x;
        const streak = hash2(row, 0, ctx.seed) * 0.25 + hash2(row, Math.floor(column / 8), ctx.seed) * 0.08;
        const reflection = Math.pow(Math.sin(column / Math.max(src.w, src.h) * Math.PI), 5) * 0.4;
        return mix(rgb, c.map((v) => v * (0.4 + lum(...rgb) / 500 + streak + reflection)), p.amount / 100);
      });
    }
  },
  {
    id: "fabric",
    name: "\u30D5\u30A1\u30D6\u30EA\u30C3\u30AF",
    category: "texture",
    icon: "grid",
    isNew: true,
    desc: "\u7E26\u7CF8\u3068\u6A2A\u7CF8\u3092\u4EA4\u4E92\u306B\u7E54\u308A\u8FBC\u3093\u3060\u5E03\u5730\u306E\u30C7\u30A3\u30C6\u30FC\u30EB\u3002",
    params: [amount, { key: "size", label: "\u7CF8\u306E\u592A\u3055", type: "range", min: 1, max: 4, default: 1 }],
    apply(src, p) {
      return paint(src, (rgb, x, y) => {
        const u = Math.floor(x / p.size), v = Math.floor(y / p.size);
        const delta = ((u + v) % 2 ? -1 : 1) * 34 * p.amount / 100;
        return rgb.map((q) => q + delta);
      });
    }
  },
  {
    id: "pearl",
    name: "\u30D1\u30FC\u30EB\u5149\u6CA2",
    category: "color",
    icon: "palette",
    isNew: true,
    desc: "\u6DE1\u3044\u8679\u8272\u306E\u5E72\u6E09\u5149\u3002\u771F\u73E0\u3084\u9B54\u6CD5\u306E\u30A2\u30A4\u30C6\u30E0\u306B\u3002",
    params: [amount, animate],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      return paint(src, (rgb, x, y) => {
        const l = lum(...rgb) / 255;
        const hue = (x / src.w - y / src.h) * 160 + l * 220 + (p.animate ? ctx.t * 360 : 0);
        return mix(rgb, hslToRgb(hue, 0.45, clamp(l * 0.65 + 0.28, 0, 0.95)), p.amount / 100);
      });
    }
  },
  {
    id: "aurora",
    name: "\u30AA\u30FC\u30ED\u30E9",
    category: "anim",
    icon: "waves",
    isNew: true,
    desc: "\u7DD1\u304B\u3089\u7D2B\u3078\u79FB\u308D\u3046\u3001\u3086\u3089\u3081\u304F\u5149\u306E\u30AB\u30FC\u30C6\u30F3\u3002",
    params: [amount, scale, { ...animate, default: true }],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      return paint(src, (rgb, x, y) => {
        const u = x / src.w, v = y / src.h, t = p.animate ? ctx.t * Math.PI * 2 : 0;
        const wave = Math.sin(u * Math.PI * 2 * p.scale + Math.sin(v * 5 + t) * 2);
        const ribbon = Math.pow(Math.max(0, wave), 3) * (0.4 + v * 0.6);
        const c = hslToRgb(150 + v * 125 + Math.sin(t) * 20, 0.8, 0.65);
        return rgb.map((q, i) => q + c[i] * ribbon * p.amount / 100);
      });
    }
  },
  {
    id: "nebula",
    name: "\u661F\u96F2",
    category: "decor",
    icon: "sparkles",
    isNew: true,
    desc: "\u661F\u5C51\u304C\u6D6E\u304B\u3076\u9752\u7D2B\u306E\u661F\u96F2\u3092\u30D4\u30AF\u30BB\u30EB\u3067\u63CF\u5199\u3002",
    params: [amount, scale, { key: "stars", label: "\u661F\u306E\u5BC6\u5EA6", type: "range", min: 0, max: 100, default: 35 }],
    apply(src, p, ctx) {
      const n = fbm(ctx.seed, src.w, src.h, p.scale, 3);
      return paint(src, (rgb, x, y) => {
        const v = n(x, y), c = hslToRgb(200 + v * 100, 0.8, 0.15 + v * 0.45);
        if (hash2(x, y, ctx.seed + 91) > 1 - p.stars / 6e3) return mix(rgb, [234, 247, 255], p.amount / 100);
        return mix(rgb, c, p.amount / 100);
      });
    }
  },
  {
    id: "magicCircle",
    name: "\u9B54\u6CD5\u9663",
    category: "decor",
    icon: "orbit",
    isNew: true,
    desc: "\u4E8C\u91CD\u306E\u9B54\u6CD5\u5186\u3068\u5E7E\u4F55\u5B66\u6A21\u69D8\u3092\u767A\u5149\u8272\u3067\u523B\u5370\u3002",
    params: [color("#a2ffe8"), amount, { ...animate, label: "\u8108\u52D5\u3055\u305B\u308B" }],
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
    }
  },
  {
    id: "hatching",
    name: "\u30AF\u30ED\u30B9\u30CF\u30C3\u30C1",
    category: "texture",
    icon: "pen",
    isNew: true,
    desc: "\u9670\u5F71\u306B\u7D30\u3044\u659C\u7DDA\u3092\u52A0\u3048\u3066\u624B\u63CF\u304D\u306E\u96F0\u56F2\u6C17\u306B\u3002",
    params: [amount, { key: "spacing", label: "\u7DDA\u306E\u9593\u9694", type: "range", min: 2, max: 8, default: 4 }],
    apply(src, p) {
      return paint(src, (rgb, x, y) => {
        const l = lum(...rgb), line = l < 175 && (x + y) % p.spacing === 0 || l < 85 && mod(x - y, p.spacing) === 0;
        return line ? mix(rgb, [18, 22, 24], p.amount / 100) : rgb;
      });
    }
  },
  {
    id: "chromatic",
    name: "\u8272\u53CE\u5DEE",
    category: "transform",
    icon: "move",
    isNew: true,
    desc: "RGB\u30C1\u30E3\u30F3\u30CD\u30EB\u3092\u305A\u3089\u3057\u3066\u30B5\u30A4\u30D0\u30FC\u306A\u8272\u306E\u306B\u3058\u307F\u3092\u8FFD\u52A0\u3002",
    params: [amount, { key: "offset", label: "\u305A\u3089\u3057\u5E45 (px)", type: "range", min: 1, max: 6, default: 1 }],
    apply(src, p) {
      return paint(src, (rgb, x, y) => {
        const left = (y * src.w + mod(x - p.offset, src.w)) * 4;
        const right = (y * src.w + mod(x + p.offset, src.w)) * 4;
        return mix(rgb, [src.d[right + 3] ? src.d[right] : rgb[0], rgb[1], src.d[left + 3] ? src.d[left + 2] : rgb[2]], p.amount / 100);
      });
    }
  },
  {
    id: "glassSurface",
    name: "\u30AC\u30E9\u30B9\u30B3\u30FC\u30C8",
    category: "texture",
    icon: "diamond",
    isNew: true,
    desc: "\u900F\u660E\u611F\u306E\u3042\u308B\u659C\u3081\u306E\u53CD\u5C04\u5149\u3068\u3001\u304D\u308C\u3044\u306A\u30A8\u30C3\u30B8\u3002",
    params: [color("#bde9f5"), amount, { key: "frosted", label: "\u3059\u308A\u30AC\u30E9\u30B9", type: "bool", default: false }],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      return paint(src, (rgb, x, y) => {
        const u = x / src.w, v = y / src.h, d = u - v;
        const shine = Math.abs(d - 0.2) < 0.09 ? 0.6 : Math.abs(d - 0.4) < 0.025 ? 0.3 : 0.04;
        const edge = x === 0 || y === 0 || x === src.w - 1 || y === src.h - 1;
        const frost = p.frosted ? hash2(x, y, ctx.seed) * 0.28 : 0;
        return mix(rgb, c, (shine + (edge ? 0.3 : 0) + frost) * p.amount / 100);
      });
    }
  }
];

// src/lib/parts.ts
var pal = {
  steel: { o: "#1a1a1e", l: "#e8e8f0", m: "#a0a8b8", d: "#5a6270" },
  gold: { o: "#3a2200", l: "#fff4b0", m: "#e0b040", d: "#8a5a10" },
  dark: { o: "#0a0810", l: "#6a6080", m: "#3a3050", d: "#1a1428" },
  ruby: { o: "#3a0610", l: "#ffe0e6", m: "#d8203c", d: "#8a0f22", w: "#ffffff" },
  sapph: { o: "#061830", l: "#d0f0ff", m: "#2080d8", d: "#104888", w: "#ffffff" },
  emer: { o: "#082018", l: "#d0ffe8", m: "#20c868", d: "#0c7040", w: "#ffffff" },
  ameth: { o: "#1a0830", l: "#f0d8ff", m: "#a040e0", d: "#582088", w: "#ffffff" },
  fire: { o: "#3a1000", l: "#ffe080", m: "#ff6020", d: "#a02008", w: "#ffffff" },
  ice: { o: "#082838", l: "#e8fbff", m: "#60d0f0", d: "#2080a8" },
  void: { o: "#100018", l: "#c080ff", m: "#6020a0", d: "#301050" },
  bone: { o: "#2a2218", l: "#f0e8d0", m: "#c8b890", d: "#7a6a48" },
  wood: { o: "#2a1808", l: "#d8a868", m: "#8a5a2b", d: "#4d3313" }
};
var PARTS = [
  /* ---- blades ---- */
  {
    id: "blade_long",
    name: "\u9577\u5263\u306E\u5203",
    icon: "\u{1F5E1}\uFE0F",
    category: "blade",
    palette: pal.steel,
    rows: [
      "..............lo",
      ".............lmo",
      "............lmdo",
      "...........lmdo.",
      "..........lmdo..",
      ".........lmdo...",
      "........lmdo....",
      ".......lmdo.....",
      "......lmdo......",
      ".....lmdo.......",
      "....lmdo........",
      "...lmdo.........",
      "..lmdo..........",
      ".lmdo...........",
      "lmdo............",
      "ooo............."
    ]
  },
  {
    id: "blade_broad",
    name: "\u5927\u5263\u306E\u5203",
    icon: "\u2694\uFE0F",
    category: "blade",
    palette: pal.steel,
    rows: [
      "............lmoo",
      "...........lmmdo",
      "..........lmmddo",
      ".........lmmddo.",
      "........lmmddo..",
      ".......lmmddo...",
      "......lmmddo....",
      ".....lmmddo.....",
      "....lmmddo......",
      "...lmmddo.......",
      "..lmmddo........",
      ".lmmddo.........",
      "lmmddo..........",
      "mmddo...........",
      "oddo............",
      "ooo............."
    ]
  },
  {
    id: "blade_dagger",
    name: "\u77ED\u5263\u306E\u5203",
    icon: "\u{1F52A}",
    category: "blade",
    palette: pal.steel,
    rows: [
      "................",
      "................",
      "................",
      ".............lo.",
      "............lmo.",
      "...........lmdo.",
      "..........lmdo..",
      ".........lmdo...",
      "........lmdo....",
      ".......lmdo.....",
      "......lmdo......",
      ".....ooo........",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "blade_scythe",
    name: "\u938C\u306E\u5203",
    icon: "\u{1F319}",
    category: "blade",
    palette: pal.dark,
    rows: [
      "......lllllmoooo",
      ".....lmmmmmddddo",
      "....lmddddoooo..",
      "...lmdo.........",
      "..lmdo..........",
      ".lmdo...........",
      "lmdo............",
      "mdo.............",
      "do..............",
      "o...............",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "blade_axe",
    name: "\u65A7\u306E\u5203",
    icon: "\u{1FA93}",
    category: "blade",
    palette: pal.steel,
    rows: [
      "................",
      "....oooooooo....",
      "...ollllllmmo...",
      "..olmmmmmmddo...",
      ".olmmmmmmmdddo..",
      ".olmmmmmmddddo..",
      "..olmmmmmdddo...",
      "...olmmmdddo....",
      "....oooooo......",
      "......oo........",
      "......oo........",
      "......oo........",
      "......oo........",
      "......oo........",
      "......oo........",
      "................"
    ]
  },
  {
    id: "blade_spear",
    name: "\u69CD\u5148",
    icon: "\u{1F531}",
    category: "blade",
    palette: pal.steel,
    rows: [
      ".......lo.......",
      "......lmdo......",
      ".....lmmddo.....",
      "....lmmmdddo....",
      ".....lmmddo.....",
      "......lmdo......",
      ".......oo.......",
      ".......oo.......",
      ".......oo.......",
      ".......oo.......",
      ".......oo.......",
      ".......oo.......",
      ".......oo.......",
      ".......oo.......",
      ".......oo.......",
      "................"
    ]
  },
  /* ---- guards ---- */
  {
    id: "guard_cross",
    name: "\u5341\u5B57\u9354",
    icon: "\u271D\uFE0F",
    category: "guard",
    palette: pal.gold,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "..oooooooooooo..",
      ".ollllllllllmmo.",
      ".olmmmmmmmmmddo.",
      "..oooooooooooo..",
      "................",
      "................"
    ]
  },
  {
    id: "guard_wing",
    name: "\u7FFC\u9354",
    icon: "\u{1FABD}",
    category: "guard",
    palette: pal.gold,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "lmo..........lmo",
      "lmdo........lmdo",
      ".lmdo......lmdo.",
      "..lmdoooooomdo..",
      "...lmmmmmmmdo...",
      "....oooooooo....",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "guard_skull",
    name: "\u30C9\u30AF\u30ED\u9354",
    icon: "\u{1F480}",
    category: "guard",
    palette: pal.bone,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "....oooooooo....",
      "...ollllllmmo...",
      "..ol.ll.ll.mdo..",
      "..ollllllllmddo.",
      "...olmmmmmmdo...",
      "....ol.mm.do....",
      ".....oooooo.....",
      "................",
      "................"
    ]
  },
  {
    id: "guard_crescent",
    name: "\u4E09\u65E5\u6708\u9354",
    icon: "\u{1F319}",
    category: "guard",
    palette: pal.sapph,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "lmo..........lmo",
      "lmdo........lmdo",
      ".lmdo......lmdo.",
      "..lmdo....lmdo..",
      "...lmoooooldo...",
      "....oooooooo....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  /* ---- pommels ---- */
  {
    id: "pommel_orb",
    name: "\u5B9D\u73E0\u67C4\u982D",
    icon: "\u26AA",
    category: "pommel",
    palette: pal.gold,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "......oooo......",
      ".....olllmo.....",
      ".....olmmdo.....",
      "......oooo......",
      "................"
    ]
  },
  {
    id: "pommel_spike",
    name: "\u30B9\u30D1\u30A4\u30AF\u67C4\u982D",
    icon: "\u{1F53B}",
    category: "pommel",
    palette: pal.dark,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "......oooo......",
      ".....olmmdo.....",
      "......lmdo......",
      ".......lo.......",
      "................"
    ]
  },
  {
    id: "pommel_skull",
    name: "\u9AD1\u9ACF\u67C4\u982D",
    icon: "\u2620\uFE0F",
    category: "pommel",
    palette: pal.bone,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      ".....oooooo.....",
      "....olllllmo....",
      "...ol.ll.lmdo...",
      "....ollllldo....",
      ".....olmmdo.....",
      "......oooo......"
    ]
  },
  /* ---- gems ---- */
  {
    id: "gem_center",
    name: "\u4E2D\u592E\u306E\u5B9D\u77F3",
    icon: "\u{1F4A0}",
    category: "gem",
    palette: pal.ruby,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "......oooo......",
      ".....olllmo.....",
      "....olwllmdo....",
      ".....olmmdo.....",
      "......oooo......",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "gem_hilt",
    name: "\u67C4\u306E\u5B9D\u77F3",
    icon: "\u{1F539}",
    category: "gem",
    palette: pal.sapph,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "......oooo......",
      ".....olllmo.....",
      ".....olmmdo.....",
      "......oooo......",
      "................",
      "................"
    ]
  },
  {
    id: "gem_triple",
    name: "\u4E09\u9023\u5B9D\u77F3",
    icon: "\u{1F48E}",
    category: "gem",
    palette: pal.ameth,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "..ooo......ooo..",
      ".olmo......olmo.",
      ".omdo......omdo.",
      "..ooo..oo..ooo..",
      "......olmo......",
      "......omdo......",
      ".......oo.......",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  /* ---- auras (drawn around silhouette) ---- */
  {
    id: "aura_ring",
    name: "\u5149\u8F2A",
    icon: "\u2B55",
    category: "aura",
    palette: pal.gold,
    rows: [
      "....oooooooo....",
      "...o........o...",
      "..o..........o..",
      ".o............o.",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      ".o............o.",
      "..o..........o..",
      "...o........o...",
      "....oooooooo...."
    ]
  },
  {
    id: "aura_spark",
    name: "\u706B\u82B1\u306E\u8F2A",
    icon: "\u2728",
    category: "aura",
    palette: pal.fire,
    rows: [
      "l..o........o..l",
      ".l..........l...",
      "................",
      "o..............o",
      "................",
      "................",
      "................",
      "o..............o",
      "o..............o",
      "................",
      "................",
      "................",
      "o..............o",
      "................",
      ".l..........l...",
      "l..o........o..l"
    ]
  },
  {
    id: "aura_void",
    name: "\u865A\u7121\u306E\u8F2A",
    icon: "\u{1F573}\uFE0F",
    category: "aura",
    palette: pal.void,
    rows: [
      "................",
      "...oooooooooo...",
      "..o..........o..",
      ".o............o.",
      ".o............o.",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      "o..............o",
      ".o............o.",
      ".o............o.",
      "..o..........o..",
      "...oooooooooo...",
      "................"
    ]
  },
  /* ---- wings ---- */
  {
    id: "wing_angel",
    name: "\u5929\u4F7F\u306E\u7FFC",
    icon: "\u{1F607}",
    category: "wing",
    palette: pal.bone,
    rows: [
      "lmo..........lmo",
      "lmdo........lmdo",
      "lmmdo......lmmdo",
      ".lmmdo....lmmdo.",
      "..lmdo....lmdo..",
      "...lmo....lmo...",
      "....lo....lo....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "wing_demon",
    name: "\u60AA\u9B54\u306E\u7FFC",
    icon: "\u{1F608}",
    category: "wing",
    palette: pal.dark,
    rows: [
      "l..............l",
      "ml............lm",
      "dml..........lmd",
      "odml........lmdo",
      ".odml......lmdo.",
      "..odml....lmdo..",
      "...odml..lmdo...",
      "....odoooooo....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "wing_bat",
    name: "\u30B3\u30A6\u30E2\u30EA\u7FFC",
    icon: "\u{1F987}",
    category: "wing",
    palette: pal.void,
    rows: [
      "................",
      "l..............l",
      "ml.l........l.lm",
      "dmlml......lmlmd",
      "odmmmdo..odmmmdo",
      ".odmdo....odmdo.",
      "..ooo......ooo..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  /* ---- chains ---- */
  {
    id: "chain_side",
    name: "\u5074\u9762\u306E\u9396",
    icon: "\u26D3\uFE0F",
    category: "chain",
    palette: pal.steel,
    rows: [
      "o..............o",
      "lo............ol",
      "mo............om",
      "do............od",
      "o..............o",
      "lo............ol",
      "mo............om",
      "do............od",
      "o..............o",
      "lo............ol",
      "mo............om",
      "do............od",
      "o..............o",
      "lo............ol",
      "mo............om",
      "o..............o"
    ]
  },
  {
    id: "chain_hang",
    name: "\u5782\u308C\u9396",
    icon: "\u{1F517}",
    category: "chain",
    palette: pal.gold,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "..o..........o..",
      "..lo........ol..",
      "..mo........om..",
      "..do........od..",
      "..o..........o..",
      "..lo........ol..",
      "..o..........o..",
      "................"
    ]
  },
  /* ---- runes ---- */
  {
    id: "rune_blade",
    name: "\u5203\u306E\u30EB\u30FC\u30F3",
    icon: "\u16B1",
    category: "rune",
    palette: pal.ameth,
    rows: [
      "................",
      ".............l..",
      "............lml.",
      "...........l.m..",
      "..........lml...",
      ".........l.m....",
      "........lml.....",
      ".......l.m......",
      "......lml.......",
      ".....l.m........",
      "....lml.........",
      "...l.m..........",
      "..lml...........",
      ".l.m............",
      "lml.............",
      "................"
    ]
  },
  {
    id: "rune_circle",
    name: "\u5186\u5F62\u30EB\u30FC\u30F3",
    icon: "\u{1F52E}",
    category: "rune",
    palette: pal.ice,
    rows: [
      "................",
      "....oooooooo....",
      "...o.l....l.o...",
      "..o..ml..lm..o..",
      ".o....oooo....o.",
      ".o.l........l.o.",
      ".oml........lmo.",
      ".o............o.",
      ".o............o.",
      ".oml........lmo.",
      ".o.l........l.o.",
      ".o....oooo....o.",
      "..o..ml..lm..o..",
      "...o.l....l.o...",
      "....oooooooo....",
      "................"
    ]
  },
  /* ---- eyes ---- */
  {
    id: "eye_center",
    name: "\u4E2D\u592E\u306E\u9B54\u773C",
    icon: "\u{1F441}",
    category: "eye",
    palette: pal.emer,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      ".....oooooo.....",
      "....olllllmo....",
      "...ol..ww..mdo..",
      "....ollllldo....",
      ".....oooooo.....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "eye_pair",
    name: "\u53CC\u7738",
    icon: "\u{1F440}",
    category: "eye",
    palette: pal.fire,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "..oooo....oooo..",
      ".olllmo..olllmo.",
      ".ol.w.do.ol.w.do",
      ".olllmo..olllmo.",
      "..oooo....oooo..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  /* ---- flames ---- */
  {
    id: "flame_tip",
    name: "\u5203\u5148\u306E\u708E",
    icon: "\u{1F525}",
    category: "flame",
    palette: pal.fire,
    rows: [
      ".............l..",
      "............lml.",
      "...........lmmd.",
      "..........lmmdo.",
      ".........lmdo...",
      "........lmo.....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  },
  {
    id: "flame_wrap",
    name: "\u5DFB\u304D\u708E",
    icon: "\u{1F30B}",
    category: "flame",
    palette: pal.fire,
    rows: [
      "l..............l",
      ".l............l.",
      "..l..........l..",
      "l.ml........lm.l",
      ".lmd........dml.",
      "..ld........dl..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "..ld........dl..",
      ".lmd........dml.",
      "l.ml........lm.l",
      "l..............l"
    ]
  },
  {
    id: "flame_trail",
    name: "\u708E\u306E\u5C3E",
    icon: "\u2604\uFE0F",
    category: "flame",
    palette: pal.fire,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "l...............",
      "ml..............",
      "dml.............",
      "odml............",
      ".odml...........",
      "..ooo..........."
    ]
  }
];
function stampToTex(part) {
  const rows = part.rows;
  const h = rows.length, w = rows[0].length;
  const t = createTex(w, h);
  const palMap = { w: "#ffffff", ...part.palette };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === "." || !palMap[ch]) continue;
    const [r, g, b] = hexToRgb(palMap[ch]);
    const i = (y * w + x) * 4;
    t.d[i] = r;
    t.d[i + 1] = g;
    t.d[i + 2] = b;
    t.d[i + 3] = 255;
  }
  return t;
}
function nearestOnto(src, dstW, dstH) {
  const out = createTex(dstW, dstH);
  for (let y = 0; y < dstH; y++) for (let x = 0; x < dstW; x++) {
    const sx = Math.min(src.w - 1, Math.floor(x * src.w / dstW));
    const sy = Math.min(src.h - 1, Math.floor(y * src.h / dstH));
    const si = (sy * src.w + sx) * 4;
    if (!src.d[si + 3]) continue;
    out.d.set(src.d.subarray(si, si + 4), (y * dstW + x) * 4);
  }
  return out;
}
function stampPart(base, part, blend = "over", amount2 = 100, recolor) {
  const stamp = nearestOnto(stampToTex(part), base.w, base.h);
  const out = cloneTex(base);
  const k = amount2 / 100;
  let rec = null;
  if (recolor) rec = hexToRgb(recolor);
  for (let i = 0; i < stamp.d.length; i += 4) {
    const sa = stamp.d[i + 3] / 255;
    if (sa < 0.02) continue;
    let sr = stamp.d[i], sg = stamp.d[i + 1], sb = stamp.d[i + 2];
    if (rec) {
      const l = lum(sr, sg, sb) / 255;
      sr = rec[0] * l;
      sg = rec[1] * l;
      sb = rec[2] * l;
    }
    const da = out.d[i + 3] / 255;
    const a = sa * k;
    if (blend === "under" && da > 0.5) continue;
    if (blend === "over" || blend === "under") {
      const oa = a + da * (1 - a);
      if (oa < 0.01) continue;
      out.d[i] = (sr * a + out.d[i] * da * (1 - a)) / oa;
      out.d[i + 1] = (sg * a + out.d[i + 1] * da * (1 - a)) / oa;
      out.d[i + 2] = (sb * a + out.d[i + 2] * da * (1 - a)) / oa;
      out.d[i + 3] = clamp(oa * 255);
    } else if (blend === "add") {
      out.d[i] = clamp(out.d[i] + sr * a);
      out.d[i + 1] = clamp(out.d[i + 1] + sg * a);
      out.d[i + 2] = clamp(out.d[i + 2] + sb * a);
      out.d[i + 3] = Math.max(out.d[i + 3], a * 255);
    } else if (blend === "multiply") {
      out.d[i] = mix2(out.d[i], out.d[i] * sr / 255, a);
      out.d[i + 1] = mix2(out.d[i + 1], out.d[i + 1] * sg / 255, a);
      out.d[i + 2] = mix2(out.d[i + 2], out.d[i + 2] * sb / 255, a);
    } else if (blend === "screen") {
      out.d[i] = mix2(out.d[i], 255 - (255 - out.d[i]) * (255 - sr) / 255, a);
      out.d[i + 1] = mix2(out.d[i + 1], 255 - (255 - out.d[i + 1]) * (255 - sg) / 255, a);
      out.d[i + 2] = mix2(out.d[i + 2], 255 - (255 - out.d[i + 2]) * (255 - sb) / 255, a);
    }
  }
  return out;
}
var mix2 = (a, b, k) => a + (b - a) * k;
var PART_MAP = Object.fromEntries(PARTS.map((p) => [p.id, p]));

// src/lib/effects.ts
function map(src, fn, skipClear = true) {
  const out = cloneTex(src);
  const d = out.d;
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      if (skipClear && d[i + 3] === 0) continue;
      const r = fn(d[i], d[i + 1], d[i + 2], d[i + 3], x, y);
      if (r) {
        d[i] = r[0];
        d[i + 1] = r[1];
        d[i + 2] = r[2];
        if (r[3] !== void 0) d[i + 3] = r[3];
      }
    }
  return out;
}
var A = (t, x, y) => x < 0 || y < 0 || x >= t.w || y >= t.h ? 0 : t.d[(y * t.w + x) * 4 + 3];
var I = (t, x, y) => (y * t.w + x) * 4;
var IW = (t, x, y) => (mod(y, t.h) * t.w + mod(x, t.w)) * 4;
var mix3 = (a, b, k) => a + (b - a) * k;
function blendAt(t, x, y, c, k, wrap = false) {
  if (!wrap && (x < 0 || y < 0 || x >= t.w || y >= t.h)) return;
  const i = wrap ? IW(t, x, y) : I(t, x, y);
  const d = t.d;
  const a = d[i + 3] / 255;
  if (a === 0) {
    d[i] = c[0];
    d[i + 1] = c[1];
    d[i + 2] = c[2];
    d[i + 3] = k * 255;
    return;
  }
  d[i] = mix3(d[i], c[0], k);
  d[i + 1] = mix3(d[i + 1], c[1], k);
  d[i + 2] = mix3(d[i + 2], c[2], k);
  d[i + 3] = Math.max(d[i + 3], k * 255);
}
var lighten = (v, k) => v + (255 - v) * k;
var darken = (v, k) => v * (1 - k);
var isOpaqueTex = (t) => {
  for (let i = 3; i < t.d.length; i += 4) if (t.d[i] < 128) return false;
  return true;
};
function distanceField(t, target, boundsAsTarget = false) {
  const W = t.w + 2, H = t.h + 2;
  const D = new Float32Array(W * H).fill(1e9);
  for (let y = -1; y <= t.h; y++)
    for (let x = -1; x <= t.w; x++) {
      const inb = x >= 0 && y >= 0 && x < t.w && y < t.h;
      if (inb ? target(x, y) : boundsAsTarget) D[(y + 1) * W + x + 1] = 0;
    }
  const s2 = Math.SQRT2;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = D[i];
      if (x > 0) v = Math.min(v, D[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, D[i - W] + 1);
        if (x > 0) v = Math.min(v, D[i - W - 1] + s2);
        if (x < W - 1) v = Math.min(v, D[i - W + 1] + s2);
      }
      D[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let v = D[i];
      if (x < W - 1) v = Math.min(v, D[i + 1] + 1);
      if (y < H - 1) {
        v = Math.min(v, D[i + W] + 1);
        if (x < W - 1) v = Math.min(v, D[i + W + 1] + s2);
        if (x > 0) v = Math.min(v, D[i + W - 1] + s2);
      }
      D[i] = v;
    }
  const out = new Float32Array(t.w * t.h);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) out[y * t.w + x] = D[(y + 1) * W + x + 1];
  return out;
}
var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
var PALETTES = {
  gameboy: { name: "\u30B2\u30FC\u30E0\u30DC\u30FC\u30A4", colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"] },
  pico8: { name: "PICO-8", colors: ["#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8", "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa"] },
  nes: { name: "\u30D5\u30A1\u30DF\u30B3\u30F3\u98A8", colors: ["#000000", "#fcfcfc", "#bcbcbc", "#7c7c7c", "#a80020", "#f83800", "#fca044", "#f8b800", "#00a800", "#58d854", "#0058f8", "#3cbcfc", "#6844fc", "#d800cc", "#f878f8", "#503000"] },
  gold: { name: "\u9EC4\u91D1", colors: ["#3a2200", "#6b4200", "#a56d00", "#d9a400", "#fcd94a", "#fff4b0"] },
  diamond: { name: "\u30C0\u30A4\u30E4", colors: ["#0b2b35", "#146b7a", "#2cb3b8", "#4fe3d6", "#a8fff4", "#e8fffd"] },
  nether: { name: "\u30CD\u30B6\u30FC", colors: ["#1a0505", "#4a0e0e", "#7a1b16", "#b3321f", "#e3642b", "#ffb347"] },
  end: { name: "\u30A8\u30F3\u30C9", colors: ["#0d0717", "#2a1640", "#51306e", "#8a5fb0", "#d7cf8e", "#f5f0c4"] },
  pastel: { name: "\u30D1\u30B9\u30C6\u30EB", colors: ["#5b5774", "#f7a8b8", "#fcd5ce", "#b5ead7", "#c7ceea", "#ffdac1", "#e2f0cb", "#ffffff"] },
  grass: { name: "\u8349\u539F", colors: ["#1f3d12", "#2f5c1a", "#467a27", "#5f9e35", "#86c34a", "#6b4a2b", "#8b633a", "#a88157"] }
};
function nearestColor(r, g, b, pal2) {
  let best = pal2[0], bd = 1e12;
  for (const c of pal2) {
    const dr = r - c[0], dg = g - c[1], db = b - c[2];
    const dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
    if (dd < bd) {
      bd = dd;
      best = c;
    }
  }
  return best;
}
function kmeans(t, k, seed) {
  const px = [];
  for (let i = 0; i < t.d.length; i += 4) if (t.d[i + 3] > 0) px.push([t.d[i], t.d[i + 1], t.d[i + 2]]);
  if (!px.length) return [[0, 0, 0]];
  const R = rng(seed);
  let cent = Array.from({ length: k }, () => [...px[Math.floor(R() * px.length)]]);
  for (let it = 0; it < 8; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let bi = 0, bd = 1e12;
      cent.forEach((c, j) => {
        const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (dd < bd) {
          bd = dd;
          bi = j;
        }
      });
      sum[bi][0] += p[0];
      sum[bi][1] += p[1];
      sum[bi][2] += p[2];
      sum[bi][3]++;
    }
    cent = cent.map((c, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c);
  }
  return cent;
}
var GLYPHS = {
  star: { name: "\u661F", rows: ["...#...", "..###..", "#######", ".#####.", "..###..", ".##.##.", "##...##"] },
  heart: { name: "\u30CF\u30FC\u30C8", rows: [".##.##.", "#######", "#######", "#######", ".#####.", "..###..", "...#..."] },
  diamond: { name: "\u30C0\u30A4\u30E4", rows: ["...#...", "..###..", ".#####.", "#######", ".#####.", "..###..", "...#..."] },
  skull: { name: "\u30C9\u30AF\u30ED", rows: [".#####.", "#######", "#..#..#", "#######", ".##.##.", ".#####.", ".#.#.#."] },
  cross: { name: "\u5341\u5B57", rows: ["..###..", "..###..", "#######", "#######", "#######", "..###..", "..###.."] },
  sword: { name: "\u5263", rows: [".....##", "....###", "...###.", "#.###..", ".###...", ".##....", "#..#..."] },
  creeper: { name: "\u30AF\u30EA\u30FC\u30D1\u30FC", rows: ["##..##", "##..##", "..##..", ".####.", ".####.", ".#..#."] },
  moon: { name: "\u6708", rows: ["..###..", ".##....", "##.....", "##.....", "##.....", ".##....", "..###.."] },
  shield: { name: "\u76FE", rows: ["#######", "#.....#", "#..#..#", "#.###.#", "#..#..#", ".#...#.", "..###.."] },
  crown: { name: "\u738B\u51A0", rows: ["#..#..#", "##.#.##", "#######", "#.#.#.#", "#######"] }
};
function runeGlyph(seed, w = 3, h = 4) {
  const R = rng(seed);
  const g = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(R() < 0.55);
    g.push(row);
  }
  g[0][Math.floor(R() * w)] = true;
  g[h - 1][Math.floor(R() * w)] = true;
  return g;
}
function scale2x(src) {
  const out = createTex(src.w * 2, src.h * 2);
  const W = src.w, H = src.h;
  const get = (x, y) => I(src, clamp(x, 0, W - 1), clamp(y, 0, H - 1));
  const eq = (a, b) => src.d[a] === src.d[b] && src.d[a + 1] === src.d[b + 1] && src.d[a + 2] === src.d[b + 2] && src.d[a + 3] === src.d[b + 3];
  const put = (x, y, s) => {
    const o = I(out, x, y);
    out.d[o] = src.d[s];
    out.d[o + 1] = src.d[s + 1];
    out.d[o + 2] = src.d[s + 2];
    out.d[o + 3] = src.d[s + 3];
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const P = get(x, y), Au = get(x, y - 1), B = get(x + 1, y), C = get(x - 1, y), D = get(x, y + 1);
      let e0 = P, e1 = P, e2 = P, e3 = P;
      if (!eq(C, B) && !eq(Au, D)) {
        if (eq(Au, C)) e0 = Au;
        if (eq(Au, B)) e1 = B;
        if (eq(D, C)) e2 = C;
        if (eq(D, B)) e3 = B;
      }
      put(x * 2, y * 2, e0);
      put(x * 2 + 1, y * 2, e1);
      put(x * 2, y * 2 + 1, e2);
      put(x * 2 + 1, y * 2 + 1, e3);
    }
  return out;
}
function nearestScale(src, k) {
  const out = createTex(src.w * k, src.h * k);
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const s = I(src, Math.floor(x / k), Math.floor(y / k)), o = I(out, x, y);
      out.d[o] = src.d[s];
      out.d[o + 1] = src.d[s + 1];
      out.d[o + 2] = src.d[s + 2];
      out.d[o + 3] = src.d[s + 3];
    }
  return out;
}
var WRAP_OPTS = [["auto", "\u81EA\u52D5"], ["wrap", "\u30BF\u30A4\u30EB(\u30D6\u30ED\u30C3\u30AF)"], ["clip", "\u5207\u308A\u629C\u304D(\u30A2\u30A4\u30C6\u30E0)"]];
var useWrap = (src, v) => v === "auto" ? isOpaqueTex(src) : v === "wrap";
var EFFECTS = [
  /* ---------------- COLOR ---------------- */
  {
    id: "adjust",
    name: "\u8272\u8ABF\u88DC\u6B63",
    category: "color",
    icon: "\u{1F39A}\uFE0F",
    desc: "\u660E\u308B\u3055\u30FB\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u30FB\u5F69\u5EA6\u30FB\u8272\u76F8\u30FB\u30AC\u30F3\u30DE",
    params: [
      { key: "brightness", label: "\u660E\u308B\u3055", type: "range", min: -100, max: 100, default: 0 },
      { key: "contrast", label: "\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8", type: "range", min: -100, max: 100, default: 0 },
      { key: "saturation", label: "\u5F69\u5EA6", type: "range", min: -100, max: 100, default: 0 },
      { key: "hue", label: "\u8272\u76F8", type: "range", min: -180, max: 180, default: 0 },
      { key: "gamma", label: "\u30AC\u30F3\u30DE", type: "range", min: 0.2, max: 3, step: 0.05, default: 1 }
    ],
    apply(src, p) {
      const br = p.brightness * 1.5, c = (p.contrast + 100) / 100, cf = c * c, sat = (p.saturation + 100) / 100;
      return map(src, (r, g, b) => {
        if (p.hue) {
          const [h, s, l] = rgbToHsl(r, g, b);
          [r, g, b] = hslToRgb(h + p.hue, s, l);
        }
        const lu = lum(r, g, b);
        r = lu + (r - lu) * sat;
        g = lu + (g - lu) * sat;
        b = lu + (b - lu) * sat;
        const f = (v) => {
          v = (v - 128) * cf + 128 + br;
          return 255 * Math.pow(clamp(v) / 255, 1 / p.gamma);
        };
        return [f(r), f(g), f(b)];
      });
    }
  },
  {
    id: "tint",
    name: "\u30AB\u30E9\u30FC\u30C6\u30A3\u30F3\u30C8",
    category: "color",
    icon: "\u{1F58C}\uFE0F",
    desc: "\u6307\u5B9A\u8272\u3067\u7740\u8272\uFF08\u4E57\u7B97/\u30B9\u30AF\u30EA\u30FC\u30F3/\u30AA\u30FC\u30D0\u30FC\u30EC\u30A4/\u30AB\u30E9\u30FC\uFF09",
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#ffb347" },
      { key: "mode", label: "\u30E2\u30FC\u30C9", type: "select", options: [["color", "\u30AB\u30E9\u30FC"], ["multiply", "\u4E57\u7B97"], ["screen", "\u30B9\u30AF\u30EA\u30FC\u30F3"], ["overlay", "\u30AA\u30FC\u30D0\u30FC\u30EC\u30A4"], ["add", "\u52A0\u7B97"]], default: "color" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 60 }
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.amount / 100;
      const [ch, cs] = rgbToHsl(...c);
      return map(src, (r, g, b) => {
        let o;
        const px = [r, g, b];
        switch (p.mode) {
          case "multiply":
            o = px.map((v, i) => v * c[i] / 255);
            break;
          case "screen":
            o = px.map((v, i) => 255 - (255 - v) * (255 - c[i]) / 255);
            break;
          case "overlay":
            o = px.map((v, i) => v < 128 ? 2 * v * c[i] / 255 : 255 - 2 * (255 - v) * (255 - c[i]) / 255);
            break;
          case "add":
            o = px.map((v, i) => v + c[i] * 0.6);
            break;
          default: {
            const [, , l] = rgbToHsl(r, g, b);
            o = hslToRgb(ch, cs, l);
          }
        }
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  {
    id: "gradmap",
    name: "\u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3\u30DE\u30C3\u30D7",
    category: "color",
    icon: "\u{1F308}",
    desc: "\u660E\u5EA6\u30923\u8272\u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3\u306B\u7F6E\u304D\u63DB\u3048\uFF08\u7D20\u6750\u5909\u63DB\u306B\u6700\u9069\uFF09",
    params: [
      { key: "c1", label: "\u6697\u90E8", type: "color", default: "#1b1030" },
      { key: "c2", label: "\u4E2D\u9593", type: "color", default: "#7a3fb0" },
      { key: "c3", label: "\u660E\u90E8", type: "color", default: "#f5d0ff" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 100 },
      { key: "normalize", label: "\u660E\u5EA6\u3092\u6B63\u898F\u5316", type: "bool", default: true }
    ],
    apply(src, p) {
      const c1 = hexToRgb(p.c1), c2 = hexToRgb(p.c2), c3 = hexToRgb(p.c3), k = p.amount / 100;
      let lo = 255, hi = 0;
      if (p.normalize) {
        for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3]) {
          const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]);
          lo = Math.min(lo, l);
          hi = Math.max(hi, l);
        }
      }
      if (!p.normalize || hi - lo < 8) {
        lo = 0;
        hi = 255;
      }
      return map(src, (r, g, b) => {
        const t = clamp((lum(r, g, b) - lo) / (hi - lo), 0, 1);
        const o = t < 0.5 ? c1.map((v, i) => mix3(v, c2[i], t * 2)) : c2.map((v, i) => mix3(v, c3[i], (t - 0.5) * 2));
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  {
    id: "gradient",
    name: "\u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3\u91CD\u306D",
    category: "color",
    icon: "\u{1F305}",
    desc: "2\u8272\u306E\u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3\u3092\u91CD\u306D\u3066\u5149\u306E\u65B9\u5411\u611F\u3092\u6F14\u51FA",
    params: [
      { key: "c1", label: "\u958B\u59CB\u8272", type: "color", default: "#fff2c0" },
      { key: "c2", label: "\u7D42\u4E86\u8272", type: "color", default: "#302050" },
      { key: "dir", label: "\u65B9\u5411", type: "select", options: [["v", "\u7E26"], ["h", "\u6A2A"], ["d", "\u659C\u3081"], ["r", "\u653E\u5C04"]], default: "v" },
      { key: "mode", label: "\u5408\u6210", type: "select", options: [["overlay", "\u30AA\u30FC\u30D0\u30FC\u30EC\u30A4"], ["multiply", "\u4E57\u7B97"], ["screen", "\u30B9\u30AF\u30EA\u30FC\u30F3"], ["normal", "\u901A\u5E38"]], default: "overlay" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 50 }
    ],
    apply(src, p) {
      const c1 = hexToRgb(p.c1), c2 = hexToRgb(p.c2), k = p.amount / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const u = (x + 0.5) / src.w, v = (y + 0.5) / src.h;
        const t = p.dir === "h" ? u : p.dir === "d" ? (u + v) / 2 : p.dir === "r" ? Math.min(1, Math.hypot(u - 0.5, v - 0.5) * 1.6) : v;
        const c = c1.map((cc, i) => mix3(cc, c2[i], t));
        const o = [r, g, b].map((pv, i) => {
          const cv = c[i];
          if (p.mode === "multiply") return pv * cv / 255;
          if (p.mode === "screen") return 255 - (255 - pv) * (255 - cv) / 255;
          if (p.mode === "normal") return cv;
          return pv < 128 ? 2 * pv * cv / 255 : 255 - 2 * (255 - pv) * (255 - cv) / 255;
        });
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  {
    id: "posterize",
    name: "\u30DD\u30B9\u30BF\u30E9\u30A4\u30BA",
    category: "color",
    icon: "\u{1F9F1}",
    desc: "\u968E\u8ABF\u3092\u6E1B\u3089\u3057\u3066\u30C9\u30C3\u30C8\u7D75\u3089\u3057\u304F",
    params: [{ key: "levels", label: "\u968E\u8ABF\u6570", type: "range", min: 2, max: 16, default: 5 }],
    apply(src, p) {
      const s = 255 / (p.levels - 1);
      return map(src, (r, g, b) => [Math.round(r / s) * s, Math.round(g / s) * s, Math.round(b / s) * s]);
    }
  },
  {
    id: "palette",
    name: "\u30D1\u30EC\u30C3\u30C8\u5236\u9650",
    category: "color",
    icon: "\u{1F3B4}",
    desc: "\u30D1\u30EC\u30C3\u30C8\u306B\u8272\u3092\u5236\u9650\uFF08\u81EA\u52D5\u62BD\u51FA/\u30EC\u30C8\u30ED/\u7D20\u6750\u7CFB\uFF09",
    params: [
      { key: "palette", label: "\u30D1\u30EC\u30C3\u30C8", type: "select", options: [["auto", "\u81EA\u52D5\u62BD\u51FA"], ...Object.entries(PALETTES).map(([k, v]) => [k, v.name])], default: "auto" },
      { key: "count", label: "\u8272\u6570(\u81EA\u52D5)", type: "range", min: 2, max: 24, default: 8 },
      { key: "dither", label: "\u30C7\u30A3\u30B6", type: "bool", default: false },
      { key: "remap", label: "\u660E\u5EA6\u9806\u3067\u518D\u914D\u7F6E", type: "bool", default: true }
    ],
    apply(src, p, ctx) {
      let pal2;
      if (p.palette === "auto") pal2 = kmeans(src, p.count, ctx.seed);
      else pal2 = PALETTES[p.palette].colors.map(hexToRgb);
      const remap = p.palette !== "auto" && p.remap;
      const sorted = [...pal2].sort((a, b) => lum(a[0], a[1], a[2]) - lum(b[0], b[1], b[2]));
      let lo = 255, hi = 0;
      if (remap) {
        for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3]) {
          const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]);
          lo = Math.min(lo, l);
          hi = Math.max(hi, l);
        }
      }
      return map(src, (r, g, b, _a, x, y) => {
        const dt = p.dither ? BAYER4[y % 4 * 4 + x % 4] - 0.5 : 0;
        if (remap) {
          const t = clamp((lum(r, g, b) - lo) / Math.max(1, hi - lo) + dt / sorted.length, 0, 0.9999);
          const c2 = sorted[Math.floor(t * sorted.length)];
          return [c2[0], c2[1], c2[2]];
        }
        const off = dt * 48;
        const c = nearestColor(r + off, g + off, b + off, pal2);
        return [c[0], c[1], c[2]];
      });
    }
  },
  {
    id: "replace",
    name: "\u8272\u7F6E\u63DB",
    category: "color",
    icon: "\u{1F501}",
    desc: "\u7279\u5B9A\u306E\u8272\u3092\u5225\u306E\u8272\u3078\uFF08\u9670\u5F71\u3092\u4FDD\u6301\uFF09",
    params: [
      { key: "from", label: "\u5BFE\u8C61\u8272", type: "color", default: "#7f7f7f" },
      { key: "to", label: "\u7F6E\u63DB\u8272", type: "color", default: "#3fa7ff" },
      { key: "tol", label: "\u8A31\u5BB9\u7BC4\u56F2", type: "range", min: 0, max: 200, default: 60 },
      { key: "shade", label: "\u9670\u5F71\u4FDD\u6301", type: "bool", default: true }
    ],
    apply(src, p) {
      const f = hexToRgb(p.from), t = hexToRgb(p.to);
      const lf = lum(...f);
      const [th, ts] = rgbToHsl(...t);
      const [, , tl] = rgbToHsl(...t);
      return map(src, (r, g, b) => {
        const dd = Math.sqrt((r - f[0]) ** 2 + (g - f[1]) ** 2 + (b - f[2]) ** 2);
        if (dd > p.tol) return;
        const k = p.tol ? 1 - Math.pow(dd / (p.tol + 1), 3) : 1;
        let o;
        if (p.shade) {
          const dl = (lum(r, g, b) - lf) / 255;
          o = hslToRgb(th, ts, clamp(tl + dl, 0, 1));
        } else o = t;
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  {
    id: "filter",
    name: "\u30D5\u30A3\u30EB\u30BF\u30FC",
    category: "color",
    icon: "\u{1F4F7}",
    desc: "\u30E2\u30CE\u30AF\u30ED\u30FB\u30BB\u30D4\u30A2\u30FB\u53CD\u8EE2\u30FB\u6696\u8272/\u5BD2\u8272\u30FB\u30CA\u30A4\u30C8\u30FB\u30B5\u30FC\u30DE\u30EB",
    params: [
      { key: "mode", label: "\u7A2E\u985E", type: "select", options: [["gray", "\u30E2\u30CE\u30AF\u30ED"], ["sepia", "\u30BB\u30D4\u30A2"], ["invert", "\u53CD\u8EE2"], ["warm", "\u6696\u8272"], ["cool", "\u5BD2\u8272"], ["vintage", "\u30D3\u30F3\u30C6\u30FC\u30B8"], ["night", "\u30CA\u30A4\u30C8\u30D3\u30B8\u30E7\u30F3"], ["thermal", "\u30B5\u30FC\u30DE\u30EB"], ["ghost", "\u5E7D\u970A"]], default: "sepia" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 100 }
    ],
    apply(src, p) {
      const k = p.amount / 100;
      return map(src, (r, g, b, a) => {
        const l = lum(r, g, b);
        let o;
        switch (p.mode) {
          case "gray":
            o = [l, l, l];
            break;
          case "sepia":
            o = [l * 1.07 + 20, l * 0.87 + 10, l * 0.62];
            break;
          case "invert":
            o = [255 - r, 255 - g, 255 - b];
            break;
          case "warm":
            o = [r * 1.12 + 10, g * 1.02, b * 0.82];
            break;
          case "cool":
            o = [r * 0.85, g * 0.98, b * 1.15 + 12];
            break;
          case "vintage":
            o = [l * 0.6 + r * 0.4 + 18, l * 0.6 + g * 0.4 + 8, l * 0.5 + b * 0.3 + 12];
            break;
          case "night":
            o = [l * 0.25, l * 1.1 + 20, l * 0.3];
            break;
          case "thermal": {
            const [tr, tg, tb] = hslToRgb(240 - l / 255 * 260, 1, 0.5);
            o = [tr, tg, tb];
            break;
          }
          case "ghost":
            return [mix3(r, l * 0.8 + 60, k), mix3(g, l * 0.9 + 70, k), mix3(b, l + 80, k), a * (1 - 0.45 * k)];
          default:
            o = [r, g, b];
        }
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  {
    id: "rainbow",
    name: "\u8679\u8272\u30DB\u30ED",
    category: "color",
    icon: "\u{1F984}",
    desc: "\u8679\u8272\u306E\u30DB\u30ED\u30B0\u30E9\u30E0\u7740\u8272\uFF08\u30A2\u30CB\u30E1\u53EF\uFF09",
    params: [
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 60 },
      { key: "dir", label: "\u65B9\u5411", type: "select", options: [["d", "\u659C\u3081"], ["h", "\u6A2A"], ["v", "\u7E26"], ["r", "\u653E\u5C04"], ["l", "\u660E\u5EA6"]], default: "d" },
      { key: "repeat", label: "\u7E70\u308A\u8FD4\u3057", type: "range", min: 0.5, max: 4, step: 0.5, default: 1 },
      { key: "animate", label: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3", type: "bool", default: true }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const k = p.amount / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / src.w, v = y / src.h;
        const pos = p.dir === "h" ? u : p.dir === "v" ? v : p.dir === "r" ? Math.hypot(u - 0.5, v - 0.5) * 2 : p.dir === "l" ? lum(r, g, b) / 255 : (u + v) / 2;
        const hue = (pos * p.repeat + (p.animate ? ctx.t : 0)) * 360;
        const [, s, l] = rgbToHsl(r, g, b);
        const o = hslToRgb(hue, Math.max(s, 0.75), clamp(l, 0.15, 0.85));
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  /* ---------------- TEXTURE ---------------- */
  {
    id: "noise",
    name: "\u30CE\u30A4\u30BA/\u7C92\u5B50",
    category: "texture",
    icon: "\u{1F32B}\uFE0F",
    desc: "\u3056\u3089\u3064\u304D\u3092\u52A0\u3048\u3066\u7D20\u6750\u611F\u3092\u5F37\u8ABF",
    params: [
      { key: "amount", label: "\u91CF", type: "range", min: 0, max: 100, default: 20 },
      { key: "size", label: "\u7C92\u306E\u5927\u304D\u3055", type: "range", min: 1, max: 4, default: 1 },
      { key: "mono", label: "\u30E2\u30CE\u30AF\u30ED", type: "bool", default: true }
    ],
    apply(src, p, ctx) {
      const a = p.amount * 1.1;
      return map(src, (r, g, b, _a, x, y) => {
        const cx = Math.floor(x / p.size), cy = Math.floor(y / p.size);
        const n = (hash2(cx, cy, ctx.seed) - 0.5) * 2 * a;
        if (p.mono) return [r + n, g + n, b + n];
        return [r + n, g + (hash2(cx, cy, ctx.seed + 7) - 0.5) * 2 * a, b + (hash2(cx, cy, ctx.seed + 13) - 0.5) * 2 * a];
      });
    }
  },
  {
    id: "dither",
    name: "\u30C7\u30A3\u30B6\u30EA\u30F3\u30B0",
    category: "texture",
    icon: "\u25A6",
    desc: "\u30D9\u30A4\u30E4\u30FC\u914D\u5217\u306B\u3088\u308B\u30EC\u30C8\u30ED\u306A\u7DB2\u70B9\u8868\u73FE",
    params: [
      { key: "levels", label: "\u968E\u8ABF\u6570", type: "range", min: 2, max: 8, default: 4 },
      { key: "strength", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 70 }
    ],
    apply(src, p) {
      const step = 255 / (p.levels - 1), s = p.strength / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const o = (BAYER4[y % 4 * 4 + x % 4] - 0.5) * step * s;
        const q = (v) => Math.round((v + o) / step) * step;
        return [q(r), q(g), q(b)];
      });
    }
  },
  {
    id: "bevel",
    name: "\u30D9\u30D9\u30EB\u7ACB\u4F53",
    category: "texture",
    icon: "\u{1F537}",
    desc: "\u7E01\u306B\u30CF\u30A4\u30E9\u30A4\u30C8\u3068\u5F71\u3092\u4ED8\u3051\u7ACB\u4F53\u7684\u306B",
    params: [
      { key: "width", label: "\u5E45", type: "range", min: 1, max: 6, default: 1 },
      { key: "strength", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 45 },
      { key: "dir", label: "\u5149\u306E\u65B9\u5411", type: "select", options: [["tl", "\u5DE6\u4E0A"], ["t", "\u4E0A"], ["tr", "\u53F3\u4E0A"], ["l", "\u5DE6"]], default: "tl" },
      { key: "bounds", label: "\u5916\u5468\u3092\u7E01\u3068\u3059\u308B", type: "bool", default: true }
    ],
    apply(src, p) {
      const dirs = { tl: [-1, -1], t: [0, -1], tr: [1, -1], l: [-1, 0] };
      const [dx, dy] = dirs[p.dir];
      const k = p.strength / 100;
      const edge = (x, y) => {
        if (x < 0 || y < 0 || x >= src.w || y >= src.h) return p.bounds;
        return A(src, x, y) < 128;
      };
      const find = (x, y, sx, sy) => {
        for (let d = 1; d <= p.width; d++) {
          if (sx && edge(x + sx * d, y) || sy && edge(x, y + sy * d)) return 1 - (d - 1) / p.width;
        }
        return 0;
      };
      return map(src, (r, g, b, _a, x, y) => {
        const hl = find(x, y, dx, dy) * k, sh = find(x, y, -dx, -dy) * k;
        if (hl >= sh && hl > 0) return [lighten(r, hl), lighten(g, hl), lighten(b, hl)];
        if (sh > 0) return [darken(r, sh), darken(g, sh), darken(b, sh)];
      });
    }
  },
  {
    id: "autoshade",
    name: "\u81EA\u52D5\u9670\u5F71(AO)",
    category: "texture",
    icon: "\u{1F313}",
    desc: "\u660E\u5EA6\u5DEE\u304B\u3089\u9670\u5F71\u3092\u81EA\u52D5\u751F\u6210\u3057\u30C9\u30C3\u30C8\u7D75\u306E\u7ACB\u4F53\u611F\u3092\u5F37\u5316",
    params: [
      { key: "strength", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 50 },
      { key: "ao", label: "\u9699\u9593\u306E\u6697\u3055", type: "range", min: 0, max: 100, default: 40 },
      { key: "wrap", label: "\u7AEF\u306E\u51E6\u7406", type: "select", options: WRAP_OPTS, default: "auto" }
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap);
      const L = (x, y) => {
        if (!wrap && (x < 0 || y < 0 || x >= src.w || y >= src.h)) return null;
        const i = wrap ? IW(src, x, y) : I(src, x, y);
        if (src.d[i + 3] < 128) return null;
        return lum(src.d[i], src.d[i + 1], src.d[i + 2]);
      };
      const k = p.strength / 100, ao = p.ao / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const c = L(x, y);
        const tl = L(x - 1, y - 1), br = L(x + 1, y + 1);
        let shade = 0;
        if (tl !== null && br !== null) shade = (c - tl + (c - br) * -1) / 255;
        else if (tl === null) shade = 0.35;
        else if (br === null) shade = -0.35;
        let sum = 0, n = 0;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const v = L(x + ox, y + oy);
          if (v !== null) {
            sum += v;
            n++;
          }
        }
        const avg = n ? sum / n : c;
        const occ = c < avg - 10 ? (avg - c) / 255 * ao * 2 : 0;
        const s = shade * k - occ;
        const f = (v) => s > 0 ? lighten(v, s) : darken(v, -s);
        return [f(r), f(g), f(b)];
      });
    }
  },
  {
    id: "emboss",
    name: "\u30A8\u30F3\u30DC\u30B9",
    category: "texture",
    icon: "\u{1F5FF}",
    desc: "\u660E\u5EA6\u3092\u9AD8\u3055\u3068\u307F\u306A\u3057\u3066\u6D6E\u304D\u5F6B\u308A\u52A0\u5DE5",
    params: [
      { key: "strength", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 50 },
      { key: "wrap", label: "\u7AEF\u306E\u51E6\u7406", type: "select", options: WRAP_OPTS, default: "auto" }
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap);
      const H = (x, y) => {
        if (!wrap) {
          x = clamp(x, 0, src.w - 1);
          y = clamp(y, 0, src.h - 1);
        }
        const i = IW(src, x, y);
        return src.d[i + 3] < 128 ? 0 : lum(src.d[i], src.d[i + 1], src.d[i + 2]);
      };
      const k = p.strength / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const gx = H(x + 1, y) - H(x - 1, y), gy = H(x, y + 1) - H(x, y - 1);
        const s = (-gx - gy) / 255 * k;
        const f = (v) => s > 0 ? lighten(v, s) : darken(v, -s);
        return [f(r), f(g), f(b)];
      });
    }
  },
  {
    id: "sharpen",
    name: "\u30B7\u30E3\u30FC\u30D7/\u30C7\u30A3\u30C6\u30FC\u30EB",
    category: "texture",
    icon: "\u{1F52A}",
    desc: "\u30C9\u30C3\u30C8\u306E\u30A8\u30C3\u30B8\u3068\u7D30\u90E8\u3092\u5F37\u8ABF",
    params: [
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 200, default: 60 },
      { key: "wrap", label: "\u7AEF\u306E\u51E6\u7406", type: "select", options: WRAP_OPTS, default: "auto" }
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap), k = p.amount / 100;
      const out = cloneTex(src);
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          if (!src.d[i + 3]) continue;
          for (let c = 0; c < 3; c++) {
            let s = 0, n = 0;
            for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              let nx = x + ox, ny = y + oy;
              if (!wrap) {
                if (nx < 0 || ny < 0 || nx >= src.w || ny >= src.h) continue;
              }
              const j = IW(src, nx, ny);
              if (!src.d[j + 3]) continue;
              s += src.d[j + c];
              n++;
            }
            if (n) out.d[i + c] = src.d[i + c] + (src.d[i + c] - s / n) * k;
          }
        }
      return out;
    }
  },
  {
    id: "blur",
    name: "\u307C\u304B\u3057",
    category: "texture",
    icon: "\u{1F4A7}",
    desc: "\u67D4\u3089\u304B\u304F\u307C\u304B\u3059\uFF08HD\u5316\u5F8C\u306E\u4E0B\u5730\u4F5C\u308A\u306B\uFF09",
    params: [
      { key: "radius", label: "\u534A\u5F84", type: "range", min: 1, max: 4, default: 1 },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 100 },
      { key: "wrap", label: "\u7AEF\u306E\u51E6\u7406", type: "select", options: WRAP_OPTS, default: "auto" }
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap), R = p.radius, k = p.amount / 100;
      const out = cloneTex(src);
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          if (!src.d[i + 3]) continue;
          let r = 0, g = 0, b = 0, n = 0;
          for (let oy = -R; oy <= R; oy++)
            for (let ox = -R; ox <= R; ox++) {
              const nx = x + ox, ny = y + oy;
              if (!wrap && (nx < 0 || ny < 0 || nx >= src.w || ny >= src.h)) continue;
              const j = IW(src, nx, ny);
              if (!src.d[j + 3]) continue;
              r += src.d[j];
              g += src.d[j + 1];
              b += src.d[j + 2];
              n++;
            }
          out.d[i] = mix3(src.d[i], r / n, k);
          out.d[i + 1] = mix3(src.d[i + 1], g / n, k);
          out.d[i + 2] = mix3(src.d[i + 2], b / n, k);
        }
      return out;
    }
  },
  {
    id: "weather",
    name: "\u98A8\u5316(\u82D4/\u9306/\u96EA)",
    category: "texture",
    icon: "\u{1F343}",
    desc: "\u82D4\u30FB\u9306\u30FB\u6C5A\u308C\u30FB\u7164\u30FB\u96EA\u30FB\u7802\u3092\u81EA\u7136\u306B\u4ED8\u7740",
    params: [
      { key: "type", label: "\u7A2E\u985E", type: "select", options: [["moss", "\u82D4"], ["rust", "\u9306"], ["dirt", "\u6C5A\u308C"], ["soot", "\u7164"], ["snow", "\u96EA\u7A4D\u3082\u308A"], ["sand", "\u7802"], ["crystal", "\u7D50\u6676\u5316"], ["blood", "\u30CD\u30B6\u30FC\u4FB5\u98DF"]], default: "moss" },
      { key: "coverage", label: "\u7BC4\u56F2", type: "range", min: 0, max: 100, default: 40 },
      { key: "scale", label: "\u6A21\u69D8\u306E\u5927\u304D\u3055", type: "range", min: 1, max: 8, default: 3 },
      { key: "bias", label: "\u504F\u308A", type: "select", options: [["none", "\u306A\u3057"], ["top", "\u4E0A"], ["bottom", "\u4E0B"], ["edge", "\u5916\u5468"]], default: "none" }
    ],
    apply(src, p, ctx) {
      const pal2 = {
        moss: ["#2f5a1c", "#44762a", "#5c9437", "#3a6b22"],
        rust: ["#6b3515", "#8a4a20", "#a55a28", "#c07038"],
        dirt: ["#3f2d1e", "#57402b", "#6b5038", "#4a3524"],
        soot: ["#151515", "#222222", "#2e2a28", "#1a1818"],
        snow: ["#ffffff", "#f0f6ff", "#dce8f5", "#c7d6e8"],
        sand: ["#d9c38a", "#e6d39c", "#c8ae70", "#f0e0b0"],
        crystal: ["#7fe8ff", "#b8f6ff", "#4cc8e8", "#e8fdff"],
        blood: ["#5a0c10", "#7d1418", "#a0201c", "#3d0608"]
      };
      const cols = pal2[p.type].map(hexToRgb);
      const n = fbm(ctx.seed, src.w, src.h, p.scale, 3);
      const cov = p.coverage / 100;
      const out = cloneTex(src);
      const biasF = (x, y) => {
        const v = y / (src.h - 1 || 1);
        if (p.bias === "top" || p.type === "snow") return (0.5 - v) * 0.8;
        if (p.bias === "bottom") return (v - 0.5) * 0.8;
        if (p.bias === "edge") {
          const u = x / (src.w - 1 || 1);
          return (Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) - 0.3) * 1.2;
        }
        return 0;
      };
      const mask = (x, y) => {
        if (A(src, mod(x, src.w), mod(y, src.h)) === 0) return false;
        return n(mod(x, src.w), mod(y, src.h)) + biasF(mod(x, src.w), mod(y, src.h)) > 1 - cov * 0.75 - 0.12;
      };
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          if (!src.d[i + 3] || !mask(x, y)) continue;
          const ci = Math.floor(hash2(x, y, ctx.seed + 3) * cols.length);
          let c = cols[ci];
          const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]) / 255;
          const shadeK = 0.75 + 0.45 * l;
          let top = !mask(x, y - 1), bot = !mask(x, y + 1);
          let f = shadeK;
          if (top) f *= 1.15;
          if (bot) f *= 0.8;
          c = c.map((v) => clamp(v * f));
          const k = p.type === "soot" || p.type === "dirt" ? 0.7 : 0.92;
          out.d[i] = mix3(src.d[i], c[0], k);
          out.d[i + 1] = mix3(src.d[i + 1], c[1], k);
          out.d[i + 2] = mix3(src.d[i + 2], c[2], k);
        }
      return out;
    }
  },
  {
    id: "cracks",
    name: "\u3072\u3073\u5272\u308C",
    category: "texture",
    icon: "\u26A1",
    desc: "\u30E9\u30F3\u30C0\u30E0\u306A\u3072\u3073\u3092\u523B\u3080\uFF08\u7834\u640D\u30FB\u53E4\u4EE3\u907A\u8DE1\u98A8\uFF09",
    params: [
      { key: "count", label: "\u672C\u6570", type: "range", min: 1, max: 16, default: 4 },
      { key: "length", label: "\u9577\u3055", type: "range", min: 2, max: 40, default: 8 },
      { key: "color", label: "\u8272", type: "color", default: "#1a1410" },
      { key: "depth", label: "\u6FC3\u3055", type: "range", min: 0, max: 100, default: 75 },
      { key: "highlight", label: "\u30A8\u30C3\u30B8\u30CF\u30A4\u30E9\u30A4\u30C8", type: "bool", default: true },
      { key: "glow", label: "\u767A\u5149(\u6EB6\u5CA9\u3072\u3073)", type: "bool", default: false }
    ],
    apply(src, p, ctx) {
      const R = rng(ctx.seed);
      const out = cloneTex(src);
      const wrap = isOpaqueTex(src);
      const c = hexToRgb(p.color), k = p.depth / 100;
      const D8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
      const crack = /* @__PURE__ */ new Set();
      const walk = (x, y, dir, len, depth) => {
        for (let s = 0; s < len; s++) {
          const xx = wrap ? mod(x, src.w) : x, yy = wrap ? mod(y, src.h) : y;
          if (xx < 0 || yy < 0 || xx >= src.w || yy >= src.h || A(src, xx, yy) === 0) break;
          crack.add(yy * src.w + xx);
          const rr = R();
          if (rr < 0.3) dir = (dir + 1) % 8;
          else if (rr < 0.6) dir = (dir + 7) % 8;
          if (depth < 2 && R() < 0.12) walk(x, y, (dir + (R() < 0.5 ? 2 : 6)) % 8, Math.floor(len / 2), depth + 1);
          x += D8[dir][0];
          y += D8[dir][1];
        }
      };
      let tries = 0;
      for (let n = 0; n < p.count && tries < 500; tries++) {
        const x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        if (A(src, x, y) === 0) continue;
        walk(x, y, Math.floor(R() * 8), p.length, 0);
        n++;
      }
      const glowC = [255, 140, 30];
      crack.forEach((idx) => {
        const x = idx % src.w, y = Math.floor(idx / src.w), i = idx * 4;
        const cc = p.glow ? hash2(x, y, ctx.seed) > 0.5 ? glowC : [255, 210, 80] : c;
        out.d[i] = mix3(src.d[i], cc[0], k);
        out.d[i + 1] = mix3(src.d[i + 1], cc[1], k);
        out.d[i + 2] = mix3(src.d[i + 2], cc[2], k);
        if (p.highlight) {
          const hx = wrap ? mod(x + 1, src.w) : x + 1, hy = wrap ? mod(y + 1, src.h) : y + 1;
          if (hx < src.w && hy < src.h && !crack.has(hy * src.w + hx) && A(src, hx, hy)) {
            const j = I(src, hx, hy);
            if (p.glow) {
              out.d[j] = mix3(out.d[j], 255, 0.35);
              out.d[j + 1] = mix3(out.d[j + 1], 120, 0.35);
              out.d[j + 2] = mix3(out.d[j + 2], 20, 0.35);
            } else for (let q = 0; q < 3; q++) out.d[j + q] = lighten(out.d[j + q], 0.22 * k);
          }
        }
      });
      return out;
    }
  },
  {
    id: "metal",
    name: "\u30E1\u30BF\u30EA\u30C3\u30AF\u5149\u6CA2",
    category: "texture",
    icon: "\u{1FA99}",
    desc: "\u91D1\u5C5E\u306E\u53CD\u5C04\u3068\u93E1\u9762\u30CF\u30A4\u30E9\u30A4\u30C8\uFF08\u5149\u304C\u8D70\u308B\u30A2\u30CB\u30E1\u53EF\uFF09",
    params: [
      { key: "color", label: "\u91D1\u5C5E\u8272", type: "color", default: "#e8c060" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 75 },
      { key: "bands", label: "\u53CD\u5C04\u306E\u6570", type: "range", min: 1, max: 4, default: 2 },
      { key: "spec", label: "\u93E1\u9762\u5149", type: "range", min: 0, max: 100, default: 60 },
      { key: "animate", label: "\u5149\u3092\u8D70\u3089\u305B\u308B", type: "bool", default: false }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.amount / 100, sp = p.spec / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const l = lum(r, g, b) / 255;
        const diag = (x / src.w + y / src.h) / 2;
        const ph = (p.animate ? ctx.t : 0) * Math.PI * 2;
        const v = 0.5 + 0.5 * Math.sin(l * Math.PI * p.bands * 2 + diag * Math.PI * 2 - ph);
        const base = c.map((cv) => cv * (0.25 + 0.95 * l) * (0.75 + 0.4 * v));
        const s = Math.pow(v, 8) * 255 * sp * (0.5 + l);
        return [mix3(r, base[0] + s, k), mix3(g, base[1] + s, k), mix3(b, base[2] + s, k)];
      });
    }
  },
  {
    id: "frost",
    name: "\u6C37\u7D50",
    category: "texture",
    icon: "\u2744\uFE0F",
    desc: "\u971C\u3068\u6C37\u306E\u7D50\u6676\u3067\u8986\u3046",
    params: [
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 60 },
      { key: "crystals", label: "\u7D50\u6676\u306E\u6570", type: "range", min: 0, max: 60, default: 12 },
      { key: "edge", label: "\u7E01\u306E\u971C", type: "range", min: 0, max: 4, default: 2 }
    ],
    apply(src, p, ctx) {
      const k = p.amount / 100;
      const ice = [200, 232, 255];
      const df = distanceField(src, (x, y) => A(src, x, y) < 128, true);
      const out = map(src, (r, g, b, _a, x, y) => {
        const l = lum(r, g, b);
        let o = [mix3(r, ice[0] * (0.5 + l / 400), 0.6), mix3(g, ice[1] * (0.55 + l / 400), 0.6), mix3(b, ice[2] * (0.65 + l / 500), 0.6)];
        const d = df[y * src.w + x];
        if (p.edge && d <= p.edge) {
          const e = (1 - (d - 1) / p.edge) * 0.7;
          o = o.map((v) => lighten(v, e));
        }
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
      const R = rng(ctx.seed);
      const wrap = isOpaqueTex(src);
      for (let n = 0; n < p.crystals; n++) {
        const x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        if (!A(src, x, y)) continue;
        blendAt(out, x, y, [255, 255, 255], 0.9 * k, wrap);
        if (R() < 0.5) {
          const dx = R() < 0.5 ? 1 : -1;
          blendAt(out, x + dx, y + 1, [220, 245, 255], 0.6 * k, wrap);
          blendAt(out, x - dx, y - 1, [220, 245, 255], 0.6 * k, wrap);
        }
      }
      return out;
    }
  },
  {
    id: "ore",
    name: "\u9271\u77F3\u57CB\u3081\u8FBC\u307F",
    category: "texture",
    icon: "\u{1F48E}",
    desc: "\u30DE\u30A4\u30AF\u30E9\u98A8\u306E\u9271\u77F3\u7C92\u3092\u30E9\u30F3\u30C0\u30E0\u914D\u7F6E",
    params: [
      { key: "color", label: "\u9271\u77F3\u8272", type: "color", default: "#5ce1e6" },
      { key: "count", label: "\u7C92\u306E\u6570", type: "range", min: 1, max: 12, default: 4 },
      { key: "size", label: "\u5927\u304D\u3055", type: "range", min: 1, max: 10, default: 4 },
      { key: "outline", label: "\u6697\u3044\u7E01", type: "bool", default: true }
    ],
    apply(src, p, ctx) {
      const R = rng(ctx.seed);
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const W = src.w, H = src.h;
      const sc = Math.max(1, Math.round(W / 16));
      const blob = /* @__PURE__ */ new Set();
      const key = (x, y) => mod(y, H) * W + mod(x, W);
      for (let n = 0; n < p.count; n++) {
        let x = Math.floor(R() * W), y = Math.floor(R() * H);
        const cells = [[x, y]];
        for (let s = 1; s < p.size; s++) {
          const [bx, by] = cells[Math.floor(R() * cells.length)];
          const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
          cells.push([bx + d[0], by + d[1]]);
        }
        for (const [cx, cy] of cells)
          for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
            const px = cx * sc + xx - (sc > 1 ? x * (sc - 1) : 0), py = cy * sc + yy - (sc > 1 ? y * (sc - 1) : 0);
            if (!wrap && (px < 0 || py < 0 || px >= W || py >= H)) continue;
            if (A(src, mod(px, W), mod(py, H))) blob.add(key(px, py));
          }
      }
      const inB = (x, y) => blob.has(key(x, y));
      blob.forEach((idx) => {
        const x = idx % W, y = Math.floor(idx / W), i = idx * 4;
        let f = 1;
        if (!inB(x - 1, y) || !inB(x, y - 1)) f = 1.3;
        else if (!inB(x + 1, y) || !inB(x, y + 1)) f = 0.7;
        const j = hash2(x, y, ctx.seed) * 0.2 + 0.9;
        out.d[i] = clamp(c[0] * f * j + (f > 1 ? 40 : 0));
        out.d[i + 1] = clamp(c[1] * f * j + (f > 1 ? 40 : 0));
        out.d[i + 2] = clamp(c[2] * f * j + (f > 1 ? 40 : 0));
      });
      if (p.outline)
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (inB(x, y) || !A(src, x, y)) continue;
          if (inB(x + 1, y) || inB(x, y + 1) || inB(x - 1, y) || inB(x, y - 1)) {
            const i = I(out, x, y);
            for (let q = 0; q < 3; q++) out.d[i + q] = darken(out.d[i + q], 0.35);
          }
        }
      return out;
    }
  },
  {
    id: "pattern",
    name: "\u30D1\u30BF\u30FC\u30F3\u523B\u5370",
    category: "texture",
    icon: "\u{1F533}",
    desc: "\u30EC\u30F3\u30AC\u30FB\u683C\u5B50\u30FB\u9C57\u30FB\u30B8\u30B0\u30B6\u30B0\u7B49\u306E\u6A21\u69D8\u3092\u523B\u3080",
    params: [
      { key: "type", label: "\u6A21\u69D8", type: "select", options: [["bricks", "\u30EC\u30F3\u30AC"], ["grid", "\u683C\u5B50"], ["checker", "\u5E02\u677E"], ["stripes", "\u30B9\u30C8\u30E9\u30A4\u30D7"], ["diagonal", "\u659C\u7DDA"], ["dots", "\u30C9\u30C3\u30C8"], ["scales", "\u9C57"], ["zigzag", "\u30B8\u30B0\u30B6\u30B0"], ["planks", "\u677F\u6750"], ["circuit", "\u56DE\u8DEF"]], default: "bricks" },
      { key: "size", label: "\u30B5\u30A4\u30BA", type: "range", min: 2, max: 16, default: 4 },
      { key: "mode", label: "\u5408\u6210", type: "select", options: [["carve", "\u5F6B\u523B(\u5F71+\u5149)"], ["darken", "\u6697\u304F"], ["lighten", "\u660E\u308B\u304F"], ["color", "\u6307\u5B9A\u8272"]], default: "carve" },
      { key: "color", label: "\u8272", type: "color", default: "#000000" },
      { key: "opacity", label: "\u6FC3\u3055", type: "range", min: 0, max: 100, default: 45 }
    ],
    apply(src, p) {
      const s = Math.max(2, Math.round(p.size * src.w / 16));
      const on = (x, y) => {
        x = mod(x, src.w);
        y = mod(y, src.h);
        switch (p.type) {
          case "bricks": {
            const row = Math.floor(y / s);
            const off = row % 2 ? s : 0;
            return y % s === s - 1 || mod(x + off, s * 2) === s * 2 - 1;
          }
          case "grid":
            return x % s === s - 1 || y % s === s - 1;
          case "checker":
            return (Math.floor(x / s) + Math.floor(y / s)) % 2 === 0;
          case "stripes":
            return y % s === 0;
          case "diagonal":
            return mod(x + y, s) === 0;
          case "dots":
            return x % s === Math.floor(s / 2) && y % s === Math.floor(s / 2);
          case "scales": {
            const row = Math.floor(y / s);
            const cx = mod(x + (row % 2 ? s / 2 : 0), s) - s / 2;
            const cy = y % s - s;
            return Math.abs(Math.hypot(cx, cy) - s * 0.9) < 0.6;
          }
          case "zigzag":
            return mod(y, s) === Math.abs(mod(x, s * 2) - s) % s;
          case "planks": {
            const row = Math.floor(y / s);
            return y % s === s - 1 || mod(x + row * 5 * s, s * 4) === 0 && y % s !== s - 1;
          }
          case "circuit": {
            const h = hash2(Math.floor(x / s), Math.floor(y / s), 7);
            return (h < 0.5 ? x % s === 0 : y % s === 0) || x % s === 0 && y % s === 0;
          }
        }
        return false;
      };
      const k = p.opacity / 100, c = hexToRgb(p.color);
      return map(src, (r, g, b, _a, x, y) => {
        const hit = on(x, y);
        if (p.mode === "carve") {
          if (hit) return [darken(r, k), darken(g, k), darken(b, k)];
          if (on(x - 1, y - 1) || on(x, y - 1) || on(x - 1, y)) return [lighten(r, k * 0.35), lighten(g, k * 0.35), lighten(b, k * 0.35)];
          return;
        }
        if (!hit) return;
        if (p.mode === "darken") return [darken(r, k), darken(g, k), darken(b, k)];
        if (p.mode === "lighten") return [lighten(r, k), lighten(g, k), lighten(b, k)];
        return [mix3(r, c[0], k), mix3(g, c[1], k), mix3(b, c[2], k)];
      });
    }
  },
  /* ---------------- DECOR ---------------- */
  {
    id: "outline",
    name: "\u30A2\u30A6\u30C8\u30E9\u30A4\u30F3",
    category: "decor",
    icon: "\u2B55",
    desc: "\u30A2\u30A4\u30C6\u30E0\u306E\u5916\u5074/\u5185\u5074\u306B\u7E01\u53D6\u308A\u7DDA",
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#1a0f2e" },
      { key: "thickness", label: "\u592A\u3055", type: "range", min: 1, max: 4, default: 1 },
      { key: "mode", label: "\u4F4D\u7F6E", type: "select", options: [["outer", "\u5916\u5074"], ["inner", "\u5185\u5074"], ["auto", "\u81EA\u52D5\u30B7\u30A7\u30FC\u30C9"]], default: "outer" },
      { key: "diag", label: "\u89D2\u3082\u5857\u308B", type: "bool", default: false },
      { key: "opacity", label: "\u4E0D\u900F\u660E\u5EA6", type: "range", min: 0, max: 100, default: 100 }
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.opacity / 100;
      const out = cloneTex(src);
      const lim = p.diag ? p.thickness + 0.5 : p.thickness + 0.01;
      if (p.mode === "outer") {
        const df = distanceField(src, (x, y) => A(src, x, y) >= 128);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const d = df[y * src.w + x];
          if (d > 0 && d <= lim && A(src, x, y) < 128) blendAt(out, x, y, c, k);
        }
      } else {
        const df = distanceField(src, (x, y) => A(src, x, y) < 128, true);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const d = df[y * src.w + x];
          if (d > 0 && d <= lim) {
            if (p.mode === "auto") {
              const i = I(out, x, y);
              for (let q = 0; q < 3; q++) out.d[i + q] = darken(src.d[i + q], 0.55 * k);
            } else blendAt(out, x, y, c, k);
          }
        }
      }
      return out;
    }
  },
  {
    id: "glow",
    name: "\u30B0\u30ED\u30FC/\u767A\u5149",
    category: "decor",
    icon: "\u{1F4A1}",
    desc: "\u5916\u5074/\u5185\u5074\u306E\u5149\u5F69\u3001\u660E\u90E8\u306E\u30D6\u30EB\u30FC\u30E0\uFF08\u8108\u52D5\u53EF\uFF09",
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#b060ff" },
      { key: "mode", label: "\u7A2E\u985E", type: "select", options: [["outer", "\u5916\u5074\u30B0\u30ED\u30FC"], ["inner", "\u5185\u5074\u30B0\u30ED\u30FC"], ["bloom", "\u30D6\u30EB\u30FC\u30E0"]], default: "outer" },
      { key: "radius", label: "\u534A\u5F84", type: "range", min: 1, max: 8, default: 3 },
      { key: "intensity", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 70 },
      { key: "pulse", label: "\u8108\u52D5\u30A2\u30CB\u30E1", type: "bool", default: false }
    ],
    animated: (p) => p.pulse,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const k = p.intensity / 100 * (p.pulse ? 0.55 + 0.45 * Math.sin(ctx.t * Math.PI * 2) : 1);
      const out = cloneTex(src);
      const R = p.radius;
      if (p.mode === "outer") {
        const df = distanceField(src, (x, y) => A(src, x, y) >= 128);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const i = I(out, x, y);
          const d = df[y * src.w + x];
          if (src.d[i + 3] >= 128 || d > R + 0.5) continue;
          const a = Math.pow(1 - (d - 1) / (R + 0.5), 1.5) * k;
          const qa = Math.round(a * 4) / 4;
          if (qa <= 0) continue;
          out.d[i] = c[0];
          out.d[i + 1] = c[1];
          out.d[i + 2] = c[2];
          out.d[i + 3] = Math.max(src.d[i + 3], qa * 255);
        }
      } else if (p.mode === "inner") {
        const df = distanceField(src, (x, y) => A(src, x, y) < 128, true);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const d = df[y * src.w + x];
          if (d === 0 || d > R + 0.5) continue;
          const a = (1 - (d - 1) / (R + 0.5)) * k * 0.8;
          const i = I(out, x, y);
          for (let q = 0; q < 3; q++) out.d[i + q] = clamp(src.d[i + q] + c[q] * a);
        }
      } else {
        const wrap = isOpaqueTex(src);
        const bright = new Float32Array(src.w * src.h);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]);
          bright[y * src.w + x] = src.d[i + 3] > 0 ? Math.max(0, (l - 150) / 105) : 0;
        }
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          let s = 0, n = 0;
          for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) {
            let nx = x + ox, ny = y + oy;
            if (wrap) {
              nx = mod(nx, src.w);
              ny = mod(ny, src.h);
            } else if (nx < 0 || ny < 0 || nx >= src.w || ny >= src.h) {
              n++;
              continue;
            }
            const wgt = 1 / (1 + ox * ox + oy * oy);
            s += bright[ny * src.w + nx] * wgt;
            n += wgt;
          }
          const a = s / n * k * 2.2;
          if (a <= 0.02) continue;
          blendAt(out, x, y, c, 0, false);
          const i = I(out, x, y);
          if (src.d[i + 3] < 128) {
            out.d[i] = c[0];
            out.d[i + 1] = c[1];
            out.d[i + 2] = c[2];
            out.d[i + 3] = clamp(a * 255);
          } else for (let q = 0; q < 3; q++) out.d[i + q] = clamp(src.d[i + q] + c[q] * a);
        }
      }
      return out;
    }
  },
  {
    id: "sparkle",
    name: "\u304D\u3089\u3081\u304D",
    category: "decor",
    icon: "\u{1F31F}",
    desc: "\u661F\u306E\u304D\u3089\u3081\u304D\u3092\u6563\u308A\u3070\u3081\u308B\uFF08\u77AC\u304D\u30A2\u30CB\u30E1\u53EF\uFF09",
    params: [
      { key: "count", label: "\u6570", type: "range", min: 1, max: 30, default: 5 },
      { key: "color", label: "\u8272", type: "color", default: "#ffffff" },
      { key: "style", label: "\u5F62", type: "select", options: [["dot", "\u70B9"], ["cross", "\u5341\u5B57"], ["star", "\u661F"], ["big", "\u5927\u304D\u3044\u661F"]], default: "cross" },
      { key: "onOpaque", label: "\u4E0D\u900F\u660E\u90E8\u306E\u307F", type: "bool", default: true },
      { key: "animate", label: "\u77AC\u304D\u30A2\u30CB\u30E1", type: "bool", default: true }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const R = rng(ctx.seed);
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const sc = Math.max(1, Math.round(src.w / 32));
      let placed = 0, tries = 0;
      while (placed < p.count && tries++ < 400) {
        const x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        const phase = R();
        if (p.onOpaque && !A(src, x, y)) continue;
        placed++;
        let v = 1;
        if (p.animate) v = Math.max(0, Math.sin((ctx.t + phase) * Math.PI * 2));
        if (v < 0.05) continue;
        const arm = p.style === "dot" ? 0 : p.style === "cross" ? 1 : p.style === "star" ? 2 : 3;
        const len = Math.round(arm * v * sc);
        const put = (xx, yy, a) => {
          if (p.onOpaque && !A(src, wrap ? mod(xx, src.w) : xx, wrap ? mod(yy, src.h) : yy)) return;
          blendAt(out, xx, yy, c, a, wrap);
        };
        for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) put(x + xx, y + yy, v);
        for (let d = 1; d <= len; d++) {
          const a = v * (1 - (d - 1) / (len + 1)) * 0.85;
          put(x + d, y, a);
          put(x - d, y, a);
          put(x, y + d, a);
          put(x, y - d, a);
        }
        if (arm >= 3 && v > 0.6) {
          put(x + 1, y + 1, 0.4);
          put(x - 1, y - 1, 0.4);
          put(x + 1, y - 1, 0.4);
          put(x - 1, y + 1, 0.4);
        }
      }
      return out;
    }
  },
  {
    id: "frame",
    name: "\u30D6\u30ED\u30C3\u30AF\u67A0",
    category: "decor",
    icon: "\u{1F5BC}\uFE0F",
    desc: "\u5916\u5468\u306B\u88C5\u98FE\u30D5\u30EC\u30FC\u30E0\uFF08\u30D9\u30D9\u30EB/\u4E8C\u91CD/\u92F2/\u8C6A\u83EF\uFF09",
    params: [
      { key: "style", label: "\u30B9\u30BF\u30A4\u30EB", type: "select", options: [["solid", "\u5358\u8272"], ["bevel", "\u30D9\u30D9\u30EB"], ["double", "\u4E8C\u91CD\u7DDA"], ["dashed", "\u7834\u7DDA"], ["rivet", "\u92F2\u6253\u3061"], ["ornate", "\u8C6A\u83EF\u88C5\u98FE"], ["glass", "\u30AC\u30E9\u30B9"]], default: "bevel" },
      { key: "color", label: "\u8272", type: "color", default: "#c8a040" },
      { key: "width", label: "\u5E45", type: "range", min: 1, max: 4, default: 1 },
      { key: "opacity", label: "\u4E0D\u900F\u660E\u5EA6", type: "range", min: 0, max: 100, default: 100 }
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.opacity / 100;
      const sc = Math.max(1, Math.round(src.w / 16));
      const w = p.width * sc;
      const W = src.w, H = src.h;
      const light = c.map((v) => lighten(v, 0.45));
      const dark = c.map((v) => darken(v, 0.45));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = Math.min(x, y, W - 1 - x, H - 1 - y);
        let col = null, a = k;
        const topLeft = Math.min(x, y) === d && (x === d || y === d) && (x <= W - 1 - x || y === d) && (y <= H - 1 - y || x === d);
        switch (p.style) {
          case "solid":
            if (d < w) col = c;
            break;
          case "bevel":
            if (d < w) col = d === 0 ? x === 0 || y === 0 ? light : dark : x - d === 0 || y - d === 0 ? topLeft ? light : c : c;
            if (d < w) {
              const isTL = x === d && y <= H - 1 - d || y === d && x <= W - 1 - d;
              col = isTL && (x < W - 1 - d || y === d) && (y < H - 1 - d || x === d) ? light : dark;
              if (d === w - 1 && w > 1) col = c;
            }
            break;
          case "double":
            if (d < sc || d >= w + sc && d < w + 2 * sc) col = c;
            break;
          case "dashed":
            if (d < w && Math.floor((x + y) / (2 * sc)) % 2 === 0) col = c;
            break;
          case "rivet": {
            if (d < w) {
              const isTL = x === d || y === d;
              col = isTL ? c : dark;
            }
            const rp = w + sc;
            const spots = [[rp, rp], [W - 1 - rp, rp], [rp, H - 1 - rp], [W - 1 - rp, H - 1 - rp]];
            if (W >= 32) spots.push([Math.floor(W / 2), rp], [Math.floor(W / 2), H - 1 - rp], [rp, Math.floor(H / 2)], [W - 1 - rp, Math.floor(H / 2)]);
            for (const [sx, sy] of spots) {
              if (x - sx >= 0 && x - sx < sc * 1 + 1 && y - sy >= 0 && y - sy < sc + 1 && sc > 0) {
                col = x === sx && y === sy ? light : c;
                if (x - sx === sc && y - sy === sc) col = dark;
              }
            }
            break;
          }
          case "ornate": {
            if (d < w) col = d === 0 ? dark : c;
            const cornerSize = w + 2 * sc;
            const cx = Math.min(x, W - 1 - x), cy = Math.min(y, H - 1 - y);
            if (cx < cornerSize && cy < cornerSize && d >= w && (cx === w || cy === w || cx === cornerSize - 1 && cy <= cornerSize - 1 || cy === cornerSize - 1 && cx <= cornerSize - 1))
              col = light;
            if (d === w && (x === Math.floor(W / 2) || y === Math.floor(H / 2) || x === Math.floor(W / 2) - 1 || y === Math.floor(H / 2) - 1)) col = light;
            break;
          }
          case "glass":
            if (d < w) {
              col = x === d || y === d ? light : c;
              a = k * 0.9;
            }
            if (d >= w && x - y === Math.floor(W * 0.25) && x < W * 0.6) {
              col = light;
              a = k * 0.35;
            }
            if (d >= w && x - y === Math.floor(W * 0.25) + 2 * sc && x < W * 0.5) {
              col = light;
              a = k * 0.25;
            }
            break;
        }
        if (col) blendAt(out, x, y, col, a);
      }
      return out;
    }
  },
  {
    id: "emblem",
    name: "\u7D0B\u7AE0\u30B9\u30BF\u30F3\u30D7",
    category: "decor",
    icon: "\u{1F6E1}\uFE0F",
    desc: "\u661F/\u30CF\u30FC\u30C8/\u30C9\u30AF\u30ED/\u30AF\u30EA\u30FC\u30D1\u30FC\u7B49\u306E\u30C9\u30C3\u30C8\u7D0B\u7AE0",
    params: [
      { key: "shape", label: "\u5F62", type: "select", options: [...Object.entries(GLYPHS).map(([k, v]) => [k, v.name]), ["rune", "\u30E9\u30F3\u30C0\u30E0\u30EB\u30FC\u30F3"]], default: "star" },
      { key: "color", label: "\u8272", type: "color", default: "#ffd84a" },
      { key: "pos", label: "\u4F4D\u7F6E", type: "select", options: [["c", "\u4E2D\u592E"], ["tl", "\u5DE6\u4E0A"], ["tr", "\u53F3\u4E0A"], ["bl", "\u5DE6\u4E0B"], ["br", "\u53F3\u4E0B"]], default: "c" },
      { key: "scale", label: "\u62E1\u5927", type: "range", min: 1, max: 4, default: 1 },
      { key: "style", label: "\u8868\u73FE", type: "select", options: [["flat", "\u30D9\u30BF\u5857\u308A"], ["shaded", "\u7ACB\u4F53"], ["carve", "\u5F6B\u523B"], ["glow", "\u767A\u5149"]], default: "shaded" },
      { key: "opacity", label: "\u4E0D\u900F\u660E\u5EA6", type: "range", min: 0, max: 100, default: 100 }
    ],
    apply(src, p, ctx) {
      let rows;
      if (p.shape === "rune") rows = runeGlyph(ctx.seed, 5, 6);
      else rows = GLYPHS[p.shape].rows.map((r) => r.split("").map((ch) => ch === "#"));
      const gh = rows.length, gw = rows[0].length;
      const sc = p.scale * Math.max(1, Math.round(src.w / 16));
      const W = gw * sc, H = gh * sc;
      const m = Math.max(1, Math.round(src.w / 16));
      let ox = Math.floor((src.w - W) / 2), oy = Math.floor((src.h - H) / 2);
      if (p.pos.includes("l")) ox = m;
      if (p.pos.includes("r")) ox = src.w - W - m;
      if (p.pos.includes("t")) oy = m;
      if (p.pos.includes("b")) oy = src.h - H - m;
      const on = (x, y) => {
        const gx = Math.floor((x - ox) / sc), gy = Math.floor((y - oy) / sc);
        return x >= ox && y >= oy && gx < gw && gy < gh && rows[gy][gx];
      };
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.opacity / 100;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const i = I(out, x, y);
        if (on(x, y)) {
          if (p.style === "carve") {
            for (let q = 0; q < 3; q++) out.d[i + q] = darken(src.d[i + q], 0.5 * k);
            continue;
          }
          let col = c;
          if (p.style === "shaded") {
            if (!on(x - 1, y) || !on(x, y - 1)) col = c.map((v) => lighten(v, 0.4));
            else if (!on(x + 1, y) || !on(x, y + 1)) col = c.map((v) => darken(v, 0.35));
          }
          if (p.style === "glow") col = c.map((v) => lighten(v, 0.3));
          blendAt(out, x, y, col, k);
        } else if (p.style === "carve" && on(x - 1, y - 1) && src.d[i + 3]) {
          for (let q = 0; q < 3; q++) out.d[i + q] = lighten(src.d[i + q], 0.3 * k);
        } else if (p.style === "glow" && (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1))) {
          blendAt(out, x, y, c, 0.4 * k);
        } else if (p.style === "shaded" && on(x - 1, y - 1) && !on(x, y)) {
          blendAt(out, x, y, [0, 0, 0], 0.35 * k);
        }
      }
      return out;
    }
  },
  {
    id: "runes",
    name: "\u30EB\u30FC\u30F3\u523B\u5370",
    category: "decor",
    icon: "\u16B1",
    desc: "\u53E4\u4EE3\u6587\u5B57\u3092\u523B\u3080\uFF08\u767A\u5149\u30FB\u660E\u6EC5\u30A2\u30CB\u30E1\u53EF\uFF09",
    params: [
      { key: "count", label: "\u6587\u5B57\u6570", type: "range", min: 1, max: 12, default: 3 },
      { key: "color", label: "\u8272", type: "color", default: "#60f0ff" },
      { key: "style", label: "\u8868\u73FE", type: "select", options: [["glow", "\u767A\u5149"], ["carve", "\u5F6B\u523B"], ["gold", "\u91D1\u8C61\u5D4C"]], default: "glow" },
      { key: "animate", label: "\u660E\u6EC5\u30A2\u30CB\u30E1", type: "bool", default: false }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const sc = Math.max(1, Math.round(src.w / 16));
      const gw = 3, gh = 4;
      const cols = Math.max(1, Math.floor((src.w - 2 * sc) / ((gw + 1) * sc)));
      const rowsN = Math.max(1, Math.floor((src.h - 2 * sc) / ((gh + 1) * sc)));
      const total = Math.min(p.count, cols * rowsN);
      const R = rng(ctx.seed);
      const slots = Array.from({ length: cols * rowsN }, (_, i) => i).sort(() => R() - 0.5).slice(0, total);
      const c = p.style === "gold" ? hexToRgb("#ffd24a") : hexToRgb(p.color);
      slots.forEach((slot, n) => {
        const g = runeGlyph(ctx.seed + slot * 17, gw, gh);
        const bx = sc + slot % cols * (gw + 1) * sc + Math.floor((src.w - 2 * sc - cols * (gw + 1) * sc) / 2) + Math.floor(sc / 2);
        const by = sc + Math.floor(slot / cols) * (gh + 1) * sc + Math.floor((src.h - 2 * sc - rowsN * (gh + 1) * sc) / 2) + Math.floor(sc / 2);
        const v = p.animate ? 0.35 + 0.65 * Math.max(0, Math.sin((ctx.t + n / total) * Math.PI * 2)) : 1;
        for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
          if (!g[gy][gx]) continue;
          for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
            const x = bx + gx * sc + xx, y = by + gy * sc + yy;
            if (x >= src.w || y >= src.h || !A(src, x, y)) continue;
            const i = I(out, x, y);
            if (p.style === "carve") {
              for (let q = 0; q < 3; q++) out.d[i + q] = darken(out.d[i + q], 0.55);
              const j = y + 1 < src.h ? I(out, x, y + 1) : -1;
              if (j >= 0 && !(gy + 1 < gh && g[gy + 1][gx])) for (let q = 0; q < 3; q++) out.d[j + q] = lighten(out.d[j + q], 0.2);
            } else if (p.style === "gold") {
              const f = gy === 0 || !g[gy - 1][gx] ? 1.2 : 0.95;
              for (let q = 0; q < 3; q++) out.d[i + q] = clamp(c[q] * f);
            } else for (let q = 0; q < 3; q++) out.d[i + q] = mix3(out.d[i + q], lighten(c[q], 0.3), v);
          }
        }
      });
      return out;
    }
  },
  {
    id: "shadow",
    name: "\u30C9\u30ED\u30C3\u30D7\u30B7\u30E3\u30C9\u30A6",
    category: "decor",
    icon: "\u{1F311}",
    desc: "\u30A2\u30A4\u30C6\u30E0\u306E\u80CC\u5F8C\u306B\u5F71\u3092\u843D\u3068\u3059",
    params: [
      { key: "dx", label: "X", type: "range", min: -4, max: 4, default: 1 },
      { key: "dy", label: "Y", type: "range", min: -4, max: 4, default: 1 },
      { key: "color", label: "\u8272", type: "color", default: "#000000" },
      { key: "opacity", label: "\u6FC3\u3055", type: "range", min: 0, max: 100, default: 50 }
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.opacity / 100;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        if (A(src, x, y) >= 128) continue;
        if (A(src, x - p.dx, y - p.dy) >= 128) {
          const i = I(out, x, y);
          out.d[i] = c[0];
          out.d[i + 1] = c[1];
          out.d[i + 2] = c[2];
          out.d[i + 3] = k * 255;
        }
      }
      return out;
    }
  },
  {
    id: "extrude",
    name: "\u62BC\u3057\u51FA\u3057\u539A\u307F",
    category: "decor",
    icon: "\u{1F4E6}",
    desc: "\u30A2\u30A4\u30C6\u30E0\u306B\u539A\u307F\u3092\u4ED8\u30513D\u98A8\u306B",
    params: [
      { key: "depth", label: "\u539A\u307F", type: "range", min: 1, max: 4, default: 1 },
      { key: "dir", label: "\u65B9\u5411", type: "select", options: [["br", "\u53F3\u4E0B"], ["b", "\u4E0B"], ["bl", "\u5DE6\u4E0B"]], default: "br" },
      { key: "shade", label: "\u5074\u9762\u306E\u6697\u3055", type: "range", min: 0, max: 100, default: 45 }
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const [dx, dy] = p.dir === "br" ? [1, 1] : p.dir === "b" ? [0, 1] : [-1, 1];
      for (let d = p.depth; d >= 1; d--)
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const sx = x - dx * d, sy = y - dy * d;
          if (A(out, x, y) >= 128 || A(src, sx, sy) < 128) continue;
          const s = I(src, sx, sy), i = I(out, x, y);
          const f = p.shade / 100 * (0.7 + 0.3 * (d / p.depth));
          out.d[i] = darken(src.d[s], f);
          out.d[i + 1] = darken(src.d[s + 1], f);
          out.d[i + 2] = darken(src.d[s + 2], f);
          out.d[i + 3] = 255;
        }
      return out;
    }
  },
  {
    id: "vignette",
    name: "\u30D3\u30CD\u30C3\u30C8",
    category: "decor",
    icon: "\u{1F518}",
    desc: "\u5468\u8FBA\u3092\u6697\u304F\uFF08\u307E\u305F\u306F\u8272\u3067\uFF09\u843D\u3068\u3057\u3066\u96F0\u56F2\u6C17\u3092\u6F14\u51FA",
    params: [
      { key: "strength", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 40 },
      { key: "color", label: "\u8272", type: "color", default: "#000000" },
      { key: "shape", label: "\u5F62", type: "select", options: [["round", "\u5186\u5F62"], ["square", "\u56DB\u89D2"]], default: "square" }
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.strength / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const u = (x + 0.5) / src.w - 0.5, v = (y + 0.5) / src.h - 0.5;
        const d = p.shape === "round" ? Math.hypot(u, v) * 1.414 : Math.max(Math.abs(u), Math.abs(v)) * 2;
        const f = Math.pow(clamp(d, 0, 1), 2.5) * k;
        return [mix3(r, c[0], f), mix3(g, c[1], f), mix3(b, c[2], f)];
      });
    }
  },
  /* ---------------- ANIM ---------------- */
  {
    id: "enchant",
    name: "\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8\u306E\u8F1D\u304D",
    category: "anim",
    icon: "\u{1F52E}",
    desc: "\u30DE\u30A4\u30AF\u30E9\u98A8\u306E\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8\u30B0\u30EA\u30F3\u30C8",
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#a060ff" },
      { key: "intensity", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 65 },
      { key: "width", label: "\u5E2F\u306E\u5E45", type: "range", min: 1, max: 10, default: 4 },
      { key: "speed", label: "\u901F\u3055", type: "range", min: 1, max: 3, default: 1 },
      { key: "dual", label: "\u4E8C\u91CD\u306E\u5E2F", type: "bool", default: true }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const W = src.w;
      const bw = p.width / 16;
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / W, v = y / src.h;
        const band = (pos) => {
          const f = fract(pos);
          const d = Math.min(f, 1 - f);
          return Math.max(0, 1 - d / (bw * 0.5));
        };
        let s = band(u + v * 0.5 - ctx.t * p.speed);
        if (p.dual) s = Math.max(s, band(u * 0.7 - v + ctx.t * p.speed + 0.37) * 0.7);
        const n = 0.6 + 0.4 * hash2(Math.floor(x / Math.max(1, W / 16)), Math.floor(y / Math.max(1, W / 16)), 99);
        const a = (0.25 + s * 0.9) * n * k;
        return [r + c[0] * a, g + c[1] * a, b + c[2] * a];
      });
    }
  },
  {
    id: "shimmer",
    name: "\u5149\u306E\u30B9\u30A4\u30FC\u30D7",
    category: "anim",
    icon: "\u{1F4AB}",
    desc: "\u5149\u306E\u5E2F\u304C\u8868\u9762\u3092\u8D70\u308A\u629C\u3051\u308B",
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#ffffff" },
      { key: "width", label: "\u5E45", type: "range", min: 1, max: 8, default: 3 },
      { key: "intensity", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 70 },
      { key: "angle", label: "\u89D2\u5EA6", type: "select", options: [["d", "\u659C\u3081"], ["h", "\u6A2A"], ["v", "\u7E26"]], default: "d" }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const bw = p.width / 16;
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / src.w, v = y / src.h;
        const pos = p.angle === "h" ? u : p.angle === "v" ? v : (u + v) / 2;
        const center = -bw + ctx.t * (1 + 2 * bw) * 1;
        const d = Math.abs(pos - center);
        const a = d < bw ? (1 - d / bw) * k : 0;
        if (!a) return;
        const q = Math.round(a * 4) / 4;
        return [mix3(r, c[0], q), mix3(g, c[1], q), mix3(b, c[2], q)];
      });
    }
  },
  {
    id: "pulse",
    name: "\u660E\u6EC5\u30D1\u30EB\u30B9",
    category: "anim",
    icon: "\u{1F493}",
    desc: "\u660E\u308B\u3044\u90E8\u5206\u304C\u3086\u3063\u304F\u308A\u8108\u6253\u3064\uFF08\u9271\u77F3\u30FB\u30E9\u30F3\u30D7\u306B\uFF09",
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#ffe080" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 50 },
      { key: "threshold", label: "\u3057\u304D\u3044\u5024", type: "range", min: 0, max: 250, default: 140 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const s = (0.5 - 0.5 * Math.cos(ctx.t * Math.PI * 2)) * (p.amount / 100);
      return map(src, (r, g, b) => {
        const l = lum(r, g, b);
        if (l < p.threshold) return;
        const k = (l - p.threshold) / (256 - p.threshold) * s;
        return [r + c[0] * k, g + c[1] * k, b + c[2] * k];
      });
    }
  },
  {
    id: "wave",
    name: "\u6CE2\u6253\u3061",
    category: "anim",
    icon: "\u{1F30A}",
    desc: "\u6C34\u9762\u3084\u71B1\u6C17\u306E\u3088\u3046\u306B\u63FA\u3089\u3081\u304F",
    params: [
      { key: "amp", label: "\u632F\u5E45", type: "range", min: 0, max: 4, step: 1, default: 1 },
      { key: "wavelength", label: "\u6CE2\u9577", type: "range", min: 2, max: 32, default: 8 },
      { key: "dir", label: "\u65B9\u5411", type: "select", options: [["h", "\u6A2A\u63FA\u308C"], ["v", "\u7E26\u63FA\u308C"]], default: "h" },
      { key: "animate", label: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3", type: "bool", default: true },
      { key: "wrap", label: "\u7AEF\u306E\u51E6\u7406", type: "select", options: WRAP_OPTS, default: "auto" }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const wrap = useWrap(src, p.wrap);
      const amp = p.amp * Math.max(1, Math.round(src.w / 16));
      const wl = p.wavelength * src.w / 16;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const t = p.animate ? ctx.t : 0;
        let sx = x, sy = y;
        if (p.dir === "h") sx = x + Math.round(amp * Math.sin((y / wl + t) * Math.PI * 2));
        else sy = y + Math.round(amp * Math.sin((x / wl + t) * Math.PI * 2));
        if (!wrap && (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h)) continue;
        const s = IW(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[s];
        out.d[o + 1] = src.d[s + 1];
        out.d[o + 2] = src.d[s + 2];
        out.d[o + 3] = src.d[s + 3];
      }
      return out;
    }
  },
  {
    id: "flow",
    name: "\u6D41\u308C\u308B(\u6C34/\u6EB6\u5CA9)",
    category: "anim",
    icon: "\u23EC",
    desc: "\u30C6\u30AF\u30B9\u30C1\u30E3\u5168\u4F53\u3092\u30B9\u30AF\u30ED\u30FC\u30EB\uFF08\u6D41\u6C34\u30FB\u6EB6\u5CA9\u5411\u3051\uFF09",
    params: [
      { key: "dir", label: "\u65B9\u5411", type: "select", options: [["down", "\u4E0B"], ["up", "\u4E0A"], ["left", "\u5DE6"], ["right", "\u53F3"], ["diag", "\u659C\u3081"]], default: "down" },
      { key: "speed", label: "\u5468\u56DE\u6570", type: "range", min: 1, max: 3, default: 1 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const o = ctx.t * p.speed;
      const ox = p.dir === "left" ? o : p.dir === "right" || p.dir === "diag" ? -o : 0;
      const oy = p.dir === "down" || p.dir === "diag" ? -o : p.dir === "up" ? o : 0;
      const dx = Math.round(ox * src.w), dy = Math.round(oy * src.h);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const s = IW(src, x + dx, y + dy), i = I(out, x, y);
        out.d[i] = src.d[s];
        out.d[i + 1] = src.d[s + 1];
        out.d[i + 2] = src.d[s + 2];
        out.d[i + 3] = src.d[s + 3];
      }
      return out;
    }
  },
  {
    id: "embers",
    name: "\u706B\u306E\u7C89/\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB",
    category: "anim",
    icon: "\u{1F525}",
    desc: "\u821E\u3044\u4E0A\u304C\u308B\u706B\u306E\u7C89\u30FB\u6CE1\u30FB\u96EA\u30FB\u9B42\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB",
    params: [
      { key: "type", label: "\u7A2E\u985E", type: "select", options: [["ember", "\u706B\u306E\u7C89"], ["bubble", "\u6CE1"], ["snow", "\u96EA"], ["soul", "\u9B42"], ["spore", "\u80DE\u5B50"]], default: "ember" },
      { key: "count", label: "\u6570", type: "range", min: 1, max: 40, default: 10 },
      { key: "onOpaque", label: "\u4E0D\u900F\u660E\u90E8\u306E\u307F", type: "bool", default: false }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const R = rng(ctx.seed);
      const sets = {
        ember: { c: ["#ffdf60", "#ff9a30", "#ff5a1a"], dir: -1, sway: 1 },
        bubble: { c: ["#dff6ff", "#9fd8ff"], dir: -1, sway: 1 },
        snow: { c: ["#ffffff", "#e4f0ff"], dir: 1, sway: 2 },
        soul: { c: ["#7ff6ff", "#40c8e0", "#b0ffff"], dir: -1, sway: 1 },
        spore: { c: ["#ff7ad0", "#d05cff", "#ffc0f0"], dir: 1, sway: 1 }
      };
      const S = sets[p.type];
      const cols = S.c.map(hexToRgb);
      const sc = Math.max(1, Math.round(src.w / 16));
      for (let n = 0; n < p.count; n++) {
        const x0 = R() * src.w, ph = R(), ci = Math.floor(R() * cols.length), sp = R() < 0.5 ? 1 : 2;
        const t = fract(ctx.t * sp + ph);
        const y = Math.floor(S.dir < 0 ? src.h - 1 - t * src.h : t * src.h);
        const x = Math.floor(x0 + Math.sin((t + ph) * Math.PI * 2) * S.sway * sc);
        const a = p.type === "ember" ? 1 - t * 0.7 : 0.9;
        for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
          const px = mod(x + xx, src.w), py = y + yy;
          if (py < 0 || py >= src.h) continue;
          if (p.onOpaque && !A(src, px, py)) continue;
          if (p.type === "bubble" && (xx + yy) % 2 === 1 && sc > 1) continue;
          blendAt(out, px, py, cols[ci], a);
        }
      }
      return out;
    }
  },
  {
    id: "huecycle",
    name: "\u8272\u76F8\u30B5\u30A4\u30AF\u30EB",
    category: "anim",
    icon: "\u{1F3A1}",
    desc: "\u8272\u76F8\u304C\u4E00\u5468\u3059\u308B\u30B2\u30FC\u30DF\u30F3\u30B0\u767A\u5149",
    params: [
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 100 },
      { key: "spread", label: "\u4F4D\u7F6E\u305A\u3089\u3057", type: "range", min: 0, max: 100, default: 0 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const k = p.amount / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const [h, s, l] = rgbToHsl(r, g, b);
        const o = hslToRgb(h + ctx.t * 360 + (x + y) / (src.w + src.h) * 360 * (p.spread / 100), s, l);
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  {
    id: "flicker",
    name: "\u708E\u306E\u3086\u3089\u304E",
    category: "anim",
    icon: "\u{1F56F}\uFE0F",
    desc: "\u677E\u660E\u306E\u3088\u3046\u306A\u4E0D\u898F\u5247\u306A\u660E\u308B\u3055\u306E\u63FA\u3089\u304E",
    params: [
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 40 },
      { key: "color", label: "\u5149\u306E\u8272", type: "color", default: "#ffb050" }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const f = (Math.sin(ctx.t * Math.PI * 2) * 0.5 + Math.sin(ctx.t * Math.PI * 6 + 1) * 0.3 + Math.sin(ctx.t * Math.PI * 10 + 2) * 0.2) * (p.amount / 100);
      return map(src, (r, g, b, _a, _x, y) => {
        const v = y / src.h;
        const k = f * (0.4 + 0.6 * v);
        return k > 0 ? [r + c[0] * k * 0.5, g + c[1] * k * 0.5, b + c[2] * k * 0.5] : [darken(r, -k * 0.5), darken(g, -k * 0.5), darken(b, -k * 0.5)];
      });
    }
  },
  /* ---------------- TRANSFORM ---------------- */
  {
    id: "upscale",
    name: "\u9AD8\u89E3\u50CF\u5EA6\u5316(HD)",
    category: "transform",
    icon: "\u{1F50D}",
    desc: "Scale2x/EPX\u3067\u6ED1\u3089\u304B\u306BHD\u5316\uFF08\u4EE5\u964D\u306E\u30A8\u30D5\u30A7\u30AF\u30C8\u304C\u9AD8\u7CBE\u7D30\u306B\uFF09",
    params: [
      { key: "method", label: "\u65B9\u5F0F", type: "select", options: [["scale2x", "Scale2x(EPX)"], ["nearest", "\u30CB\u30A2\u30EC\u30B9\u30C8"]], default: "scale2x" },
      { key: "factor", label: "\u500D\u7387", type: "select", options: [["2", "\xD72"], ["4", "\xD74"], ["8", "\xD78"]], default: "2" }
    ],
    apply(src, p) {
      let f = parseInt(p.factor);
      while (Math.max(src.w, src.h) * f > 128 && f > 1) f /= 2;
      if (f < 2) return src;
      if (p.method === "nearest") return nearestScale(src, f);
      let t = src;
      for (let k = 1; k < f; k *= 2) t = scale2x(t);
      return t;
    }
  },
  {
    id: "transform",
    name: "\u53CD\u8EE2/\u56DE\u8EE2",
    category: "transform",
    icon: "\u{1F504}",
    desc: "\u5DE6\u53F3\u30FB\u4E0A\u4E0B\u53CD\u8EE2\u306890\xB0\u56DE\u8EE2",
    params: [
      { key: "flipH", label: "\u5DE6\u53F3\u53CD\u8EE2", type: "bool", default: true },
      { key: "flipV", label: "\u4E0A\u4E0B\u53CD\u8EE2", type: "bool", default: false },
      { key: "rotate", label: "\u56DE\u8EE2", type: "select", options: [["0", "0\xB0"], ["90", "90\xB0"], ["180", "180\xB0"], ["270", "270\xB0"]], default: "0" }
    ],
    apply(src, p) {
      const rot = parseInt(p.rotate);
      const sw = rot % 180 ? src.h : src.w, sh = rot % 180 ? src.w : src.h;
      const out = createTex(sw, sh);
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        let sx = x, sy = y;
        if (rot === 90) {
          sx = y;
          sy = src.h - 1 - x;
        } else if (rot === 180) {
          sx = src.w - 1 - x;
          sy = src.h - 1 - y;
        } else if (rot === 270) {
          sx = src.w - 1 - y;
          sy = x;
        }
        if (p.flipH) sx = src.w - 1 - sx;
        if (p.flipV) sy = src.h - 1 - sy;
        const s = I(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[s];
        out.d[o + 1] = src.d[s + 1];
        out.d[o + 2] = src.d[s + 2];
        out.d[o + 3] = src.d[s + 3];
      }
      return out;
    }
  },
  {
    id: "mirror",
    name: "\u5BFE\u79F0\u5316",
    category: "transform",
    icon: "\u{1FA9E}",
    desc: "\u5DE6\u53F3/\u4E0A\u4E0B/\u56DB\u65B9\u5411\u306B\u5BFE\u79F0\u30B3\u30D4\u30FC",
    params: [{ key: "mode", label: "\u30E2\u30FC\u30C9", type: "select", options: [["lr", "\u5DE6\u2192\u53F3"], ["rl", "\u53F3\u2192\u5DE6"], ["tb", "\u4E0A\u2192\u4E0B"], ["quad", "\u56DB\u65B9\u5BFE\u79F0"]], default: "lr" }],
    apply(src, p) {
      const out = cloneTex(src);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        let sx = x, sy = y;
        if ((p.mode === "lr" || p.mode === "quad") && x >= src.w / 2) sx = src.w - 1 - x;
        if (p.mode === "rl" && x < src.w / 2) sx = src.w - 1 - x;
        if ((p.mode === "tb" || p.mode === "quad") && y >= src.h / 2) sy = src.h - 1 - y;
        const s = I(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[s];
        out.d[o + 1] = src.d[s + 1];
        out.d[o + 2] = src.d[s + 2];
        out.d[o + 3] = src.d[s + 3];
      }
      return out;
    }
  },
  {
    id: "offset",
    name: "\u30AA\u30D5\u30BB\u30C3\u30C8",
    category: "transform",
    icon: "\u2194\uFE0F",
    desc: "\u30EB\u30FC\u30D7\u3055\u305B\u3066\u305A\u3089\u3059\uFF08\u7D99\u304E\u76EE\u30C1\u30A7\u30C3\u30AF\uFF09",
    params: [
      { key: "dx", label: "X(%)", type: "range", min: -100, max: 100, default: 50 },
      { key: "dy", label: "Y(%)", type: "range", min: -100, max: 100, default: 50 }
    ],
    apply(src, p) {
      const out = createTex(src.w, src.h);
      const dx = Math.round(p.dx / 100 * src.w), dy = Math.round(p.dy / 100 * src.h);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const s = IW(src, x - dx, y - dy), o = I(out, x, y);
        out.d[o] = src.d[s];
        out.d[o + 1] = src.d[s + 1];
        out.d[o + 2] = src.d[s + 2];
        out.d[o + 3] = src.d[s + 3];
      }
      return out;
    }
  },
  {
    id: "seamless",
    name: "\u30B7\u30FC\u30E0\u30EC\u30B9\u5316",
    category: "transform",
    icon: "\u267E\uFE0F",
    desc: "\u7AEF\u3092\u99B4\u67D3\u307E\u305B\u3066\u7D99\u304E\u76EE\u306E\u306A\u3044\u30BF\u30A4\u30EB\u306B",
    params: [{ key: "width", label: "\u99B4\u67D3\u307E\u305B\u5E45(%)", type: "range", min: 5, max: 50, default: 20 }],
    apply(src, p) {
      const out = cloneTex(src);
      const bw = Math.max(1, Math.round(p.width / 100 * src.w)), bh = Math.max(1, Math.round(p.width / 100 * src.h));
      const tmp = cloneTex(src);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const dx = Math.min(x, src.w - 1 - x);
        if (dx >= bw) continue;
        const k = 0.5 * (1 - dx / bw);
        const i = I(src, x, y), j = I(src, src.w - 1 - x, y);
        for (let q = 0; q < 4; q++) tmp.d[i + q] = mix3(src.d[i + q], src.d[j + q], k);
      }
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const dy = Math.min(y, src.h - 1 - y);
        const i = I(src, x, y);
        if (dy >= bh) {
          for (let q = 0; q < 4; q++) out.d[i + q] = tmp.d[i + q];
          continue;
        }
        const k = 0.5 * (1 - dy / bh);
        const j = I(src, x, src.h - 1 - y);
        for (let q = 0; q < 4; q++) out.d[i + q] = mix3(tmp.d[i + q], tmp.d[j + q], k);
      }
      return out;
    }
  },
  {
    id: "edgewear",
    name: "\u30A8\u30C3\u30B8\u6469\u8017",
    category: "texture",
    icon: "\u2726",
    desc: "\u8F2A\u90ED\u3084\u7D20\u6750\u306E\u5883\u754C\u3092\u6469\u8017\u3055\u305B\u3001\u30CF\u30A4\u30E9\u30A4\u30C8\u3092\u5165\u308C\u308B",
    isNew: true,
    params: [
      { key: "color", label: "\u9732\u51FA\u3059\u308B\u8272", type: "color", default: "#d5c6a0" },
      { key: "amount", label: "\u6469\u8017\u91CF", type: "range", min: 0, max: 100, default: 55 },
      { key: "width", label: "\u5883\u754C\u5E45", type: "range", min: 1, max: 4, default: 1 },
      { key: "roughness", label: "\u30E0\u30E9", type: "range", min: 0, max: 100, default: 50 }
    ],
    apply(src, p, ctx) {
      const col = hexToRgb(p.color);
      const transparent = !isOpaqueTex(src);
      const df = transparent ? distanceField(src, (x, y) => A(src, x, y) < 128, true) : null;
      const getLum = (x, y) => {
        const i = IW(src, x, y);
        return lum(src.d[i], src.d[i + 1], src.d[i + 2]);
      };
      return map(src, (r, g, b, _a, x, y) => {
        const edge = transparent ? Math.max(0, 1 - (df[y * src.w + x] - 1) / p.width) : Math.min(1, (Math.abs(getLum(x - 1, y) - getLum(x + 1, y)) + Math.abs(getLum(x, y - 1) - getLum(x, y + 1))) / 125);
        const grain = hash2(x, y, ctx.seed);
        const mask = grain < 1 - p.roughness / 100 + edge * p.roughness / 100 ? edge : 0;
        const k = mask * p.amount / 100;
        return [mix3(r, col[0], k), mix3(g, col[1], k), mix3(b, col[2], k)];
      });
    }
  },
  {
    id: "weave",
    name: "\u7E54\u7269\u30FB\u7DE8\u307F\u76EE",
    category: "texture",
    icon: "\u25A4",
    desc: "\u5E03\u3001\u30AB\u30FC\u30DA\u30C3\u30C8\u3001\u9769\u306E\u3088\u3046\u306A\u7E4A\u7DAD\u3068\u4EA4\u5DEE\u3057\u305F\u9670\u5F71",
    isNew: true,
    params: [
      { key: "size", label: "\u7CF8\u306E\u592A\u3055", type: "range", min: 1, max: 5, default: 2 },
      { key: "depth", label: "\u51F9\u51F8", type: "range", min: 0, max: 100, default: 38 },
      { key: "style", label: "\u7E54\u308A\u65B9", type: "select", options: [["plain", "\u5E73\u7E54\u308A"], ["twill", "\u7DBE\u7E54\u308A"], ["leather", "\u9769\u30B7\u30DC"]], default: "plain" }
    ],
    apply(src, p, ctx) {
      const size = Math.max(1, Math.round(p.size * Math.max(1, src.w / 32)));
      const depth = p.depth / 100;
      return map(src, (r, g, b, _a, x, y) => {
        let height;
        if (p.style === "leather") {
          height = (hash2(Math.floor(x / size), Math.floor(y / size), ctx.seed) - 0.5) * 1.4;
        } else {
          const cx = Math.floor(x / size), cy = Math.floor(y / size);
          const crossing = p.style === "twill" ? (cx + cy * 2) % 3 === 0 : (cx + cy) % 2 === 0;
          height = (crossing ? 0.45 : -0.45) + (x % size === 0 || y % size === 0 ? -0.32 : 0.12);
        }
        const v = height * depth;
        return v > 0 ? [lighten(r, v), lighten(g, v), lighten(b, v)] : [darken(r, -v), darken(g, -v), darken(b, -v)];
      });
    }
  },
  {
    id: "veins",
    name: "\u9271\u8108\u30FB\u5927\u7406\u77F3",
    category: "texture",
    icon: "\u3030",
    desc: "\u7D99\u304E\u76EE\u306E\u306A\u3044\u9271\u8108\u3001\u77F3\u76EE\u3001\u9B54\u529B\u306E\u7B4B\u3092\u523B\u3080",
    isNew: true,
    params: [
      { key: "color", label: "\u7B4B\u306E\u8272", type: "color", default: "#e6d2ad" },
      { key: "density", label: "\u5BC6\u5EA6", type: "range", min: 2, max: 12, default: 5 },
      { key: "width", label: "\u5E45", type: "range", min: 1, max: 6, default: 2 },
      { key: "distort", label: "\u3046\u306D\u308A", type: "range", min: 0, max: 100, default: 45 },
      { key: "amount", label: "\u6FC3\u3055", type: "range", min: 0, max: 100, default: 70 }
    ],
    apply(src, p, ctx) {
      const col = hexToRgb(p.color);
      const noise = fbm(ctx.seed, src.w, src.h, 4, 3);
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / src.w, v = y / src.h;
        const field = Math.sin(Math.PI * 2 * (u * p.density + v * Math.max(1, Math.floor(p.density / 2)) + (noise(x, y) - 0.5) * (p.distort / 100) * 2));
        const band = Math.max(0, 1 - Math.abs(field) * (8 / p.width));
        const k = band * p.amount / 100;
        return [mix3(r, col[0], k), mix3(g, col[1], k), mix3(b, col[2], k)];
      });
    }
  },
  {
    id: "iridescent",
    name: "\u7389\u866B\u8272\u30B3\u30FC\u30C6\u30A3\u30F3\u30B0",
    category: "decor",
    icon: "\u25C7",
    desc: "\u5149\u3092\u53D7\u3051\u305F\u9762\u3060\u3051\u8272\u304C\u5909\u308F\u308B\u771F\u73E0\u30FB\u30AA\u30D1\u30FC\u30EB\u98A8\u306E\u8276",
    isNew: true,
    params: [
      { key: "color", label: "\u30D9\u30FC\u30B9\u8272", type: "color", default: "#84e6dc" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 55 },
      { key: "frequency", label: "\u8272\u306E\u5E45", type: "range", min: 1, max: 5, default: 2 },
      { key: "animate", label: "\u5149\u3092\u52D5\u304B\u3059", type: "bool", default: false }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const [h] = rgbToHsl(...hexToRgb(p.color));
      const noise = fbm(ctx.seed, src.w, src.h, 3, 2);
      return map(src, (r, g, b, _a, x, y) => {
        const l = lum(r, g, b) / 255;
        const phase = ((x / src.w + y / src.h) * 0.5 + noise(x, y) * 0.45 + (p.animate ? ctx.t : 0)) * p.frequency;
        const hue = h + Math.sin(phase * Math.PI * 2) * 90;
        const c = hslToRgb(hue, 0.75, Math.min(0.9, 0.25 + l * 0.65));
        const k = p.amount / 100 * (0.25 + 0.75 * l);
        return [mix3(r, c[0], k), mix3(g, c[1], k), mix3(b, c[2], k)];
      });
    }
  },
  /* ---------------- NEW ANIMATIONS ---------------- */
  {
    id: "slash",
    name: "\u65AC\u6483\u8ECC\u8DE1",
    category: "anim",
    icon: "\u2694\uFE0F",
    desc: "\u659C\u3081\u306B\u8D70\u308B\u65AC\u6483\u306E\u6B8B\u50CF\uFF08\u30D2\u30C3\u30C8\u30D5\u30EC\u30FC\u30E0\u5411\u304D\uFF09",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#ffffff" },
      { key: "width", label: "\u5E45", type: "range", min: 1, max: 6, default: 2 },
      { key: "intensity", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 85 },
      { key: "dir", label: "\u65B9\u5411", type: "select", options: [["tlbr", "\uFF3C"], ["trbl", "\uFF0F"], ["h", "\u6A2A"], ["v", "\u7E26"]], default: "tlbr" }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const bw = p.width / 16;
      return map(src, (r, g, b, a, x, y) => {
        const u = x / src.w, v = y / src.h;
        const pos = p.dir === "h" ? u : p.dir === "v" ? v : p.dir === "trbl" ? (1 - u + v) / 2 : (u + v) / 2;
        const center = -bw + ctx.t * (1 + 2 * bw);
        const d = Math.abs(pos - center);
        const hit = d < bw ? (1 - d / bw) * k : 0;
        if (hit < 0.04) return;
        const q = Math.round(hit * 5) / 5;
        if (a < 8) return [c[0], c[1], c[2], q * 200];
        return [mix3(r, c[0], q), mix3(g, c[1], q), mix3(b, c[2], q)];
      }, false);
    }
  },
  {
    id: "shockwave",
    name: "\u885D\u6483\u6CE2",
    category: "anim",
    icon: "\u{1F4A5}",
    desc: "\u4E2D\u5FC3\u304B\u3089\u5E83\u304C\u308B\u5186\u5F62\u306E\u885D\u6483\u6CE2",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#ffe080" },
      { key: "width", label: "\u8F2A\u306E\u592A\u3055", type: "range", min: 1, max: 6, default: 2 },
      { key: "intensity", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 80 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const bw = p.width / 12;
      const radius = ctx.t * 0.85;
      return map(src, (r, g, b, a, x, y) => {
        const d = Math.hypot((x + 0.5) / src.w - 0.5, (y + 0.5) / src.h - 0.5) * 1.5;
        const ring = Math.max(0, 1 - Math.abs(d - radius) / bw);
        if (ring < 0.05) return;
        const q = Math.round(ring * k * 4) / 4;
        if (a < 8) return [c[0], c[1], c[2], q * 220];
        return [mix3(r, c[0], q), mix3(g, c[1], q), mix3(b, c[2], q)];
      }, false);
    }
  },
  {
    id: "lightning",
    name: "\u96F7\u6483",
    category: "anim",
    icon: "\u26A1",
    desc: "\u30E9\u30F3\u30C0\u30E0\u306A\u7A32\u59BB\u304C\u8D70\u308B\uFF08\u547D\u4E2D\u6F14\u51FA\uFF09",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#fff060" },
      { key: "bolts", label: "\u672C\u6570", type: "range", min: 1, max: 6, default: 2 },
      { key: "intensity", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 90 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const wrap = isOpaqueTex(src);
      const flash = Math.sin(ctx.t * Math.PI * 8) > 0.15;
      if (!flash) return out;
      const R = rng(ctx.seed + Math.floor(ctx.t * 12) | 0);
      for (let n = 0; n < p.bolts; n++) {
        let x = Math.floor(R() * src.w), y = 0;
        const len = src.h + src.w;
        for (let s = 0; s < len; s++) {
          blendAt(out, x, y, c, k, wrap);
          if (R() < 0.45) x += R() < 0.5 ? 1 : -1;
          y += 1;
          if (y >= src.h) break;
          if (R() < 0.12) {
            let bx = x, by = y;
            for (let b = 0; b < 4; b++) {
              bx += R() < 0.5 ? 1 : -1;
              by += 1;
              blendAt(out, bx, by, c, k * 0.7, wrap);
            }
          }
        }
      }
      return out;
    }
  },
  {
    id: "orbit",
    name: "\u5468\u56DE\u30AA\u30FC\u30D6",
    category: "anim",
    icon: "\u{1F52E}",
    desc: "\u5468\u56F2\u3092\u56DE\u308B\u9B54\u529B\u30AA\u30FC\u30D6",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#80e0ff" },
      { key: "count", label: "\u6570", type: "range", min: 1, max: 6, default: 3 },
      { key: "radius", label: "\u534A\u5F84(%)", type: "range", min: 20, max: 80, default: 45 },
      { key: "size", label: "\u5927\u304D\u3055", type: "range", min: 1, max: 4, default: 2 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const rad = p.radius / 100 * Math.min(src.w, src.h) * 0.5;
      const cx = src.w / 2, cy = src.h / 2;
      for (let n = 0; n < p.count; n++) {
        const ang = (ctx.t + n / p.count) * Math.PI * 2;
        const px = Math.round(cx + Math.cos(ang) * rad);
        const py = Math.round(cy + Math.sin(ang) * rad);
        const s = p.size;
        for (let yy = -s; yy <= s; yy++) for (let xx = -s; xx <= s; xx++) {
          if (xx * xx + yy * yy > s * s) continue;
          const a = 1 - Math.hypot(xx, yy) / (s + 0.5);
          blendAt(out, px + xx, py + yy, c, a, wrap);
        }
      }
      return out;
    }
  },
  {
    id: "ripple",
    name: "\u9B54\u6CD5\u9663\u30EA\u30C3\u30D7\u30EB",
    category: "anim",
    icon: "\u{1F300}",
    desc: "\u540C\u5FC3\u5186\u304C\u5E83\u304C\u308B\u8A60\u5531\u30A8\u30D5\u30A7\u30AF\u30C8",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#c080ff" },
      { key: "rings", label: "\u8F2A\u306E\u6570", type: "range", min: 1, max: 4, default: 2 },
      { key: "intensity", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 70 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      return map(src, (r, g, b, a, x, y) => {
        const d = Math.hypot((x + 0.5) / src.w - 0.5, (y + 0.5) / src.h - 0.5) * 2;
        let hit = 0;
        for (let n = 0; n < p.rings; n++) {
          const phase = fract(d * 2 - ctx.t + n / p.rings);
          hit = Math.max(hit, Math.max(0, 1 - Math.abs(phase - 0.5) * 10));
        }
        if (hit < 0.08) return;
        const q = hit * k;
        if (a < 8) return [c[0], c[1], c[2], q * 180];
        return [mix3(r, c[0], q), mix3(g, c[1], q), mix3(b, c[2], q)];
      }, false);
    }
  },
  {
    id: "afterimage",
    name: "\u6B8B\u50CF",
    category: "anim",
    icon: "\u{1F47B}",
    desc: "\u534A\u900F\u660E\u306E\u6B8B\u50CF\u304C\u659C\u3081\u306B\u6B8B\u308B\uFF08\u9AD8\u901F\u79FB\u52D5\uFF09",
    isNew: true,
    params: [
      { key: "dir", label: "\u65B9\u5411", type: "select", options: [["nw", "\u5DE6\u4E0A"], ["ne", "\u53F3\u4E0A"], ["sw", "\u5DE6\u4E0B"], ["se", "\u53F3\u4E0B"]], default: "nw" },
      { key: "steps", label: "\u6B8B\u50CF\u6570", type: "range", min: 1, max: 4, default: 2 },
      { key: "amount", label: "\u6FC3\u3055", type: "range", min: 0, max: 100, default: 45 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const dirs = { nw: [-1, -1], ne: [1, -1], sw: [-1, 1], se: [1, 1] };
      const [dx, dy] = dirs[p.dir];
      const sc = Math.max(1, Math.round(src.w / 16));
      const shift = Math.round((0.3 + 0.7 * Math.sin(ctx.t * Math.PI * 2)) * sc);
      for (let s = p.steps; s >= 1; s--) {
        const ox = dx * shift * s, oy = dy * shift * s, a = p.amount / 100 * (1 - (s - 1) / p.steps) * 0.55;
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const sx = x - ox, sy = y - oy;
          if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
          const si = I(src, sx, sy);
          if (src.d[si + 3] < 128) continue;
          const oi = I(out, x, y);
          if (out.d[oi + 3] >= 128) continue;
          out.d[oi] = src.d[si];
          out.d[oi + 1] = src.d[si + 1];
          out.d[oi + 2] = src.d[si + 2];
          out.d[oi + 3] = a * 255;
        }
      }
      return out;
    }
  },
  {
    id: "scanline",
    name: "\u8D70\u67FB\u7DDA",
    category: "anim",
    icon: "\u{1F4FA}",
    desc: "\u30EC\u30C8\u30ED\u306ACRT\u8D70\u67FB\u7DDA\u304C\u6D41\u308C\u308B",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#40ff80" },
      { key: "gap", label: "\u9593\u9694", type: "range", min: 2, max: 8, default: 3 },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 40 },
      { key: "animate", label: "\u30B9\u30AF\u30ED\u30FC\u30EB", type: "bool", default: true }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.amount / 100;
      const off = p.animate ? Math.floor(ctx.t * src.h) : 0;
      return map(src, (r, g, b, _a, _x, y) => {
        if ((y + off) % p.gap !== 0) return;
        return [mix3(r, c[0], k), mix3(g, c[1], k), mix3(b, c[2], k)];
      });
    }
  },
  {
    id: "glitch",
    name: "\u30B0\u30EA\u30C3\u30C1",
    category: "anim",
    icon: "\u{1F4FA}",
    desc: "RGB\u305A\u3089\u3057\u3068\u30B9\u30E9\u30A4\u30B9\u305A\u308C\uFF08\u30B5\u30A4\u30D0\u30FC\uFF09",
    isNew: true,
    params: [
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 50 },
      { key: "slices", label: "\u30B9\u30E9\u30A4\u30B9\u6570", type: "range", min: 2, max: 10, default: 4 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const amp = Math.round(p.amount / 100 * src.w * 0.15);
      const R = rng(ctx.seed + Math.floor(ctx.t * 8));
      const sliceH = Math.max(1, Math.floor(src.h / p.slices));
      for (let y = 0; y < src.h; y++) {
        const slice = Math.floor(y / sliceH);
        const ox = Math.round((hash2(slice, Math.floor(ctx.t * 8), ctx.seed) - 0.5) * 2 * amp);
        const ch = R() < 0.3 ? 1 : 0;
        for (let x = 0; x < src.w; x++) {
          const s = IW(src, x - ox, y), o = I(out, x, y);
          out.d[o] = src.d[s];
          out.d[o + 1] = src.d[s + 1];
          out.d[o + 2] = src.d[s + 2];
          out.d[o + 3] = src.d[s + 3];
          if (ch && src.d[s + 3]) {
            out.d[o] = clamp(src.d[s] * 1.4);
            out.d[o + 2] = clamp(src.d[s + 2] * 0.6);
          }
        }
      }
      return out;
    }
  },
  {
    id: "breathe",
    name: "\u547C\u5438\u30B9\u30B1\u30FC\u30EB",
    category: "anim",
    icon: "\u{1F62E}\u200D\u{1F4A8}",
    desc: "\u8F2A\u90ED\u304C\u308F\u305A\u304B\u306B\u4F38\u7E2E\u3059\u308B\u751F\u547D\u611F",
    isNew: true,
    params: [
      { key: "amount", label: "\u632F\u5E45", type: "range", min: 1, max: 4, default: 1 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const s = 1 + Math.sin(ctx.t * Math.PI * 2) * (p.amount * 0.03);
      const cx = src.w / 2, cy = src.h / 2;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const sx = Math.round(cx + (x - cx) / s);
        const sy = Math.round(cy + (y - cy) / s);
        if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
        const si = I(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[si];
        out.d[o + 1] = src.d[si + 1];
        out.d[o + 2] = src.d[si + 2];
        out.d[o + 3] = src.d[si + 3];
      }
      return out;
    }
  },
  {
    id: "sparks",
    name: "\u885D\u7A81\u30B9\u30D1\u30FC\u30AF",
    category: "anim",
    icon: "\u2728",
    desc: "\u30D2\u30C3\u30C8\u6642\u306B\u98DB\u3073\u6563\u308B\u706B\u82B1",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#ffe060" },
      { key: "count", label: "\u6570", type: "range", min: 4, max: 20, default: 10 }
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const R = rng(ctx.seed);
      const burst = Math.max(0, Math.sin(ctx.t * Math.PI * 2));
      for (let n = 0; n < p.count; n++) {
        const ang = R() * Math.PI * 2;
        const dist = burst * (0.3 + R() * 0.7) * Math.min(src.w, src.h) * 0.5;
        const px = Math.round(src.w / 2 + Math.cos(ang) * dist);
        const py = Math.round(src.h / 2 + Math.sin(ang) * dist);
        blendAt(out, px, py, c, burst, wrap);
        if (burst > 0.5) blendAt(out, px + Math.round(Math.cos(ang)), py + Math.round(Math.sin(ang)), c, burst * 0.6, wrap);
      }
      return out;
    }
  },
  /* ---------------- NEW DECOR / TEXTURE ---------------- */
  {
    id: "bloodstain",
    name: "\u8840\u3057\u3076\u304D",
    category: "decor",
    icon: "\u{1FA78}",
    desc: "\u5203\u3084\u8868\u9762\u306B\u8840\u306E\u98DB\u6CAB\u3092\u4ED8\u3051\u308B",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#7a1018" },
      { key: "count", label: "\u98DB\u6CAB\u306E\u6570", type: "range", min: 2, max: 20, default: 8 },
      { key: "drip", label: "\u5782\u308C", type: "bool", default: true }
    ],
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const R = rng(ctx.seed);
      for (let n = 0; n < p.count; n++) {
        let x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        if (!A(src, x, y) && !wrap) continue;
        blendAt(out, x, y, c, 0.9, wrap);
        if (R() < 0.6) blendAt(out, x + 1, y, c, 0.6, wrap);
        if (p.drip) {
          const len = 1 + Math.floor(R() * 4);
          for (let d = 1; d <= len; d++) blendAt(out, x, y + d, c, 0.8 - d * 0.15, wrap);
        }
      }
      return out;
    }
  },
  {
    id: "scratches",
    name: "\u5200\u50B7",
    category: "texture",
    icon: "\u2694\uFE0F",
    desc: "\u7D30\u3044\u659C\u3081\u306E\u50B7\u3092\u523B\u3080",
    isNew: true,
    params: [
      { key: "count", label: "\u672C\u6570", type: "range", min: 1, max: 12, default: 4 },
      { key: "color", label: "\u8272", type: "color", default: "#d8d0c0" },
      { key: "depth", label: "\u6FC3\u3055", type: "range", min: 0, max: 100, default: 55 }
    ],
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.depth / 100;
      const wrap = isOpaqueTex(src);
      const R = rng(ctx.seed);
      for (let n = 0; n < p.count; n++) {
        let x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        const dx = R() < 0.5 ? 1 : -1, dy = 1;
        const len = 3 + Math.floor(R() * Math.min(src.w, src.h) * 0.5);
        for (let s = 0; s < len; s++) {
          if (A(src, wrap ? mod(x, src.w) : x, wrap ? mod(y, src.h) : y)) blendAt(out, x, y, c, k, wrap);
          x += dx;
          y += dy;
        }
      }
      return out;
    }
  },
  {
    id: "chainmail",
    name: "\u9396\u5E37\u5B50",
    category: "texture",
    icon: "\u26D3\uFE0F",
    desc: "\u9396\u306E\u7DE8\u307F\u76EE\u3092\u91CD\u306D\u308B",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#8a9098" },
      { key: "size", label: "\u8F2A\u306E\u5927\u304D\u3055", type: "range", min: 2, max: 6, default: 3 },
      { key: "amount", label: "\u6FC3\u3055", type: "range", min: 0, max: 100, default: 55 }
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.amount / 100, s = p.size;
      return map(src, (r, g, b, _a, x, y) => {
        const ox = Math.floor(y / s) % 2 * Math.floor(s / 2);
        const cx = mod(x - ox, s * 2) - s, cy = mod(y, s) - s / 2;
        const d = Math.abs(Math.hypot(cx, cy) - s * 0.55);
        if (d > 0.7) return;
        const shade = d < 0.35 ? 1.15 : 0.75;
        return [mix3(r, c[0] * shade, k), mix3(g, c[1] * shade, k), mix3(b, c[2] * shade, k)];
      });
    }
  },
  {
    id: "leather",
    name: "\u9769\u5DFB\u304D",
    category: "texture",
    icon: "\u{1F45C}",
    desc: "\u67C4\u3084\u8868\u9762\u3092\u9769\u306E\u30B7\u30EF\u3067\u8986\u3046",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#6b4226" },
      { key: "amount", label: "\u5F37\u3055", type: "range", min: 0, max: 100, default: 70 },
      { key: "wrinkles", label: "\u30B7\u30EF", type: "range", min: 1, max: 8, default: 3 }
    ],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.amount / 100;
      const n = fbm(ctx.seed, src.w, src.h, p.wrinkles, 3);
      return map(src, (r, g, b, _a, x, y) => {
        const v = n(x, y);
        const shade = 0.7 + 0.5 * v;
        const o = c.map((cv) => cv * shade);
        return [mix3(r, o[0], k), mix3(g, o[1], k), mix3(b, o[2], k)];
      });
    }
  },
  {
    id: "geminset",
    name: "\u5B9D\u77F3\u8C61\u5D4C",
    category: "decor",
    icon: "\u{1F4A0}",
    desc: "\u4E2D\u592E\u3084\u56DB\u9685\u306B\u30AB\u30C3\u30C8\u5B9D\u77F3\u3092\u57CB\u3081\u8FBC\u3080",
    isNew: true,
    params: [
      { key: "color", label: "\u5B9D\u77F3\u8272", type: "color", default: "#d02040" },
      { key: "pos", label: "\u4F4D\u7F6E", type: "select", options: [["c", "\u4E2D\u592E"], ["tl", "\u5DE6\u4E0A"], ["tr", "\u53F3\u4E0A"], ["bl", "\u5DE6\u4E0B"], ["br", "\u53F3\u4E0B"]], default: "c" },
      { key: "size", label: "\u5927\u304D\u3055", type: "range", min: 2, max: 8, default: 3 }
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const light = c.map((v) => lighten(v, 0.5));
      const dark = c.map((v) => darken(v, 0.4));
      const s = p.size;
      let cx = Math.floor(src.w / 2), cy = Math.floor(src.h / 2);
      if (p.pos.includes("l")) cx = s + 1;
      if (p.pos.includes("r")) cx = src.w - s - 2;
      if (p.pos.includes("t")) cy = s + 1;
      if (p.pos.includes("b")) cy = src.h - s - 2;
      for (let y = -s; y <= s; y++) for (let x = -s; x <= s; x++) {
        const md = Math.abs(x) + Math.abs(y);
        if (md > s) continue;
        const col = x + y < 0 ? light : x + y > 1 ? dark : c;
        const px = cx + x, py = cy + y;
        if (px < 0 || py < 0 || px >= src.w || py >= src.h) continue;
        const i = I(out, px, py);
        out.d[i] = col[0];
        out.d[i + 1] = col[1];
        out.d[i + 2] = col[2];
        out.d[i + 3] = 255;
      }
      return out;
    }
  },
  {
    id: "ribbon",
    name: "\u30EA\u30DC\u30F3/\u98FE\u308A\u7D10",
    category: "decor",
    icon: "\u{1F380}",
    desc: "\u67C4\u304B\u3089\u5782\u308C\u308B\u98FE\u308A\u7D10",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#c02040" },
      { key: "side", label: "\u4F4D\u7F6E", type: "select", options: [["l", "\u5DE6"], ["r", "\u53F3"], ["both", "\u4E21\u5074"]], default: "l" }
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const dark = c.map((v) => darken(v, 0.35));
      const sc = Math.max(1, Math.round(src.w / 16));
      const draw = (x0, dir) => {
        let x = x0, y = Math.floor(src.h * 0.55);
        for (let s = 0; s < src.h * 0.4; s++) {
          blendAt(out, x, y, s % 3 === 0 ? dark : c, 0.95);
          for (let w = 1; w < sc; w++) blendAt(out, x + w * dir, y, c, 0.85);
          y += 1;
          if (s % 3 === 2) x += dir;
        }
      };
      if (p.side !== "r") draw(Math.floor(src.w * 0.25), -1);
      if (p.side !== "l") draw(Math.floor(src.w * 0.7), 1);
      return out;
    }
  },
  {
    id: "halo",
    name: "\u5F8C\u5149",
    category: "decor",
    icon: "\u{1F607}",
    desc: "\u80CC\u5F8C\u306B\u8056\u306A\u308B\u5149\u8F2A",
    isNew: true,
    params: [
      { key: "color", label: "\u8272", type: "color", default: "#ffe080" },
      { key: "radius", label: "\u534A\u5F84", type: "range", min: 2, max: 10, default: 5 },
      { key: "pulse", label: "\u8108\u52D5", type: "bool", default: true }
    ],
    animated: (p) => p.pulse,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const k = p.pulse ? 0.55 + 0.45 * Math.sin(ctx.t * Math.PI * 2) : 1;
      const cx = src.w / 2, cy = src.h * 0.35;
      const R = p.radius * Math.max(1, src.w / 16);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const d = Math.hypot(x - cx, y - cy);
        const ring = Math.max(0, 1 - Math.abs(d - R) / 1.4);
        if (ring < 0.1) continue;
        const i = I(out, x, y);
        if (src.d[i + 3] >= 128) continue;
        out.d[i] = c[0];
        out.d[i + 1] = c[1];
        out.d[i + 2] = c[2];
        out.d[i + 3] = ring * k * 200;
      }
      return out;
    }
  },
  /* ---------------- PARTS STAMP ---------------- */
  {
    id: "partstamp",
    name: "\u30D1\u30FC\u30C4\u91CD\u306D",
    category: "parts",
    icon: "\u{1F9E9}",
    desc: "\u5203\u30FB\u9354\u30FB\u5B9D\u77F3\u30FB\u7FFC\u30FB\u30AA\u30FC\u30E9\u7B49\u306E\u30C9\u30C3\u30C8\u30D1\u30FC\u30C4\u3092\u91CD\u306D\u308B",
    isNew: true,
    params: [
      { key: "part", label: "\u30D1\u30FC\u30C4", type: "select", options: PARTS.map((pt) => [pt.id, `${pt.icon} ${pt.name}`]), default: PARTS[0].id },
      { key: "blend", label: "\u5408\u6210", type: "select", options: [["over", "\u4E0A\u306B"], ["under", "\u4E0B\u306B"], ["add", "\u52A0\u7B97"], ["multiply", "\u4E57\u7B97"], ["screen", "\u30B9\u30AF\u30EA\u30FC\u30F3"]], default: "over" },
      { key: "amount", label: "\u4E0D\u900F\u660E\u5EA6", type: "range", min: 0, max: 100, default: 100 },
      { key: "recolor", label: "\u518D\u7740\u8272", type: "color", default: "#ffffff" },
      { key: "useRecolor", label: "\u518D\u7740\u8272\u3059\u308B", type: "bool", default: false },
      { key: "animate", label: "\u30AA\u30FC\u30E9/\u708E\u3092\u52D5\u304B\u3059", type: "bool", default: false }
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const def = PART_MAP[p.part];
      if (!def) return src;
      const rec = p.useRecolor ? p.recolor : void 0;
      let t = stampPart(src, def, p.blend, p.amount, rec);
      if (p.animate && (def.category === "aura" || def.category === "flame" || def.category === "eye")) {
        t = map(t, (r, g, b, a, x, y) => {
          if (a < 8) return;
          const n = hash2(x, y, ctx.seed);
          const pulse = 0.75 + 0.25 * Math.sin((ctx.t + n) * Math.PI * 2);
          return [r * pulse, g * pulse, b * pulse];
        });
      }
      return t;
    }
  }
];
EFFECTS.push(...EXTRA_EFFECTS);
var EFFECT_MAP = Object.fromEntries(EFFECTS.map((e) => [e.id, e]));
var defaultParams = (def) => Object.fromEntries(def.params.map((p) => [p.key, p.default]));
var _id = 0;
var newLayer = (type, params, seed) => {
  const def = EFFECT_MAP[type];
  return {
    id: `L${Date.now().toString(36)}${(_id++).toString(36)}`,
    type,
    params: { ...defaultParams(def), ...params || {} },
    enabled: true,
    opacity: 100,
    seed: seed ?? Math.floor(Math.random() * 99999)
  };
};
function applyStack(base, layers, t, upto = layers.length) {
  let cur = base;
  for (let li = 0; li < upto; li++) {
    const l = layers[li];
    if (!l.enabled || l.opacity === 0) continue;
    const def = EFFECT_MAP[l.type];
    if (!def) continue;
    let next;
    try {
      next = def.apply(cur, l.params, { seed: l.seed, t });
    } catch (e) {
      console.error(e);
      continue;
    }
    if ((l.opacity < 100 || l.blend && l.blend !== "normal") && next.w === cur.w && next.h === cur.h) {
      const k = clamp(l.opacity / 100, 0, 1);
      const o = cloneTex(next);
      for (let i = 0; i < o.d.length; i += 4) {
        const a = cur.d[i + 3] / 255, b = next.d[i + 3] / 255;
        const alpha = a * (1 - k) + b * k;
        for (let q = 0; q < 3; q++) {
          const u = cur.d[i + q], v = next.d[i + q];
          let blended = v;
          if (a > 0) {
            if (l.blend === "multiply") blended = u * v / 255;
            else if (l.blend === "screen") blended = 255 - (255 - u) * (255 - v) / 255;
            else if (l.blend === "overlay") blended = u < 128 ? 2 * u * v / 255 : 255 - 2 * (255 - u) * (255 - v) / 255;
            else if (l.blend === "add") blended = Math.min(255, u + v);
          }
          o.d[i + q] = alpha ? (u * a * (1 - k) + blended * b * k) / alpha : 0;
        }
        o.d[i + 3] = alpha * 255;
      }
      next = o;
    }
    cur = next;
  }
  return cur;
}
export {
  EFFECTS,
  applyStack,
  createTex,
  defaultParams,
  newLayer
};
