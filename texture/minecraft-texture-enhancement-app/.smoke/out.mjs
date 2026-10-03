// src/lib/fxutil.ts
var clamp = (v, a = 0, b = 255) => v < a ? a : v > b ? b : v;
var clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
var lerp = (a, b, t) => a + (b - a) * t;
var fract = (v) => v - Math.floor(v);
function clone(img) {
  return new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
}
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 };
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d > 1e-6) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  h = fract(h);
  if (s <= 0) {
    const v = Math.round(clamp(l * 255));
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (tt) => {
    let t = tt;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(clamp(f(h + 1 / 3) * 255)),
    g: Math.round(clamp(f(h) * 255)),
    b: Math.round(clamp(f(h - 1 / 3) * 255))
  };
}
var luminance = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
var smooth = (t) => t * t * (3 - 2 * t);
function valueNoise(x, y, seed = 0, period = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const w = (a, b) => period > 0 ? hash2((a % period + period) % period, (b % period + period) % period, seed) : hash2(a, b, seed);
  const v00 = w(xi, yi), v10 = w(xi + 1, yi), v01 = w(xi, yi + 1), v11 = w(xi + 1, yi + 1);
  const u = smooth(xf), v = smooth(yf);
  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}
function fbm(x, y, seed = 0, oct = 4, period = 0) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i * 131, period ? period * freq : 0);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}
function warpNoise(x, y, seed, amount = 0.6) {
  const wx = fbm(x + 5.2, y + 1.3, seed + 7, 3) - 0.5;
  const wy = fbm(x + 9.1, y + 4.7, seed + 13, 3) - 0.5;
  return fbm(x + wx * amount * 4, y + wy * amount * amount * 4, seed, 4);
}
function setPx(img, x, y, r, g, b, a = 255) {
  const { width: w, height: h, data: d } = img;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = y * w + x << 2;
  d[i] = clamp(r);
  d[i + 1] = clamp(g);
  d[i + 2] = clamp(b);
  d[i + 3] = clamp(a);
}
function overPx(img, x, y, r, g, b, a) {
  if (a <= 0) return;
  const { width: w, height: h, data: d } = img;
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = y * w + x << 2;
  if (a >= 255) {
    d[i] = clamp(r);
    d[i + 1] = clamp(g);
    d[i + 2] = clamp(b);
    d[i + 3] = 255;
    return;
  }
  const sa = a / 255, da = d[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) {
    d[i + 3] = 0;
    return;
  }
  d[i] = clamp((r * sa + d[i] * da * (1 - sa)) / oa);
  d[i + 1] = clamp((g * sa + d[i + 1] * da * (1 - sa)) / oa);
  d[i + 2] = clamp((b * sa + d[i + 2] * da * (1 - sa)) / oa);
  d[i + 3] = clamp(oa * 255);
}
function addPx(img, x, y, r, g, b, a) {
  if (a <= 0) return;
  const { width: w, height: h, data: d } = img;
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = y * w + x << 2;
  const k = a / 255;
  const da = d[i + 3] / 255;
  const na = Math.min(1, da + k);
  d[i] = clamp(d[i] + r * k);
  d[i + 1] = clamp(d[i + 1] + g * k);
  d[i + 2] = clamp(d[i + 2] + b * k);
  d[i + 3] = clamp(na * 255);
}
function screenPx(img, x, y, r, g, b, a) {
  if (a <= 0) return;
  const { width: w, height: h, data: d } = img;
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = y * w + x << 2;
  if (d[i + 3] === 0) return;
  const k = a / 255;
  d[i] = clamp(d[i] + (255 - d[i]) * (r / 255) * k);
  d[i + 1] = clamp(d[i + 1] + (255 - d[i + 1]) * (g / 255) * k);
  d[i + 2] = clamp(d[i + 2] + (255 - d[i + 2]) * (b / 255) * k);
}
function linePx(img, x0, y0, x1, y1, r, g, b, a, thick = 1, add = false) {
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let guard = 0;
  const half = (thick - 1) / 2;
  while (guard++ < 4096) {
    for (let ox = -half; ox <= half; ox++)
      for (let oy = -half; oy <= half; oy++) {
        if (add) addPx(img, Math.round(x0 + ox), Math.round(y0 + oy), r, g, b, a);
        else overPx(img, Math.round(x0 + ox), Math.round(y0 + oy), r, g, b, a);
      }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}
function discPx(img, cx, cy, rad, r, g, b, a, add = false) {
  const R3 = Math.ceil(rad) + 1;
  for (let y = -R3; y <= R3; y++)
    for (let x = -R3; x <= R3; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d > rad + 0.5) continue;
      const aa = clamp01(rad + 0.5 - d);
      const al = a * aa;
      if (add) addPx(img, cx + x, cy + y, r, g, b, al);
      else overPx(img, cx + x, cy + y, r, g, b, al);
    }
}
function ringPx(img, cx, cy, rad, r, g, b, a, add = false) {
  const steps = Math.max(12, Math.ceil(rad * 8));
  for (let i = 0; i < steps; i++) {
    const ang = i / steps * Math.PI * 2;
    const x = Math.round(cx + Math.cos(ang) * rad);
    const y = Math.round(cy + Math.sin(ang) * rad);
    if (add) addPx(img, x, y, r, g, b, a);
    else overPx(img, x, y, r, g, b, a);
  }
}
function boxBlur(src, radius, alphaOnly = false) {
  const w = src.width, h = src.height;
  const out = clone(src);
  if (radius <= 0) return out;
  const r = Math.max(1, Math.round(radius));
  const tmp = new Uint8ClampedArray(src.data);
  const div = r * 2 + 1;
  const chans = alphaOnly ? [3] : [0, 1, 2, 3];
  for (let y = 0; y < h; y++) {
    for (const c of chans) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const x = Math.min(w - 1, Math.max(0, k));
        sum += src.data[(y * w + x) * 4 + c];
      }
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 4 + c] = sum / div;
        const addX = Math.min(w - 1, x + r + 1);
        const subX = Math.max(0, x - r);
        sum += src.data[(y * w + addX) * 4 + c] - src.data[(y * w + subX) * 4 + c];
      }
    }
  }
  for (let x = 0; x < w; x++) {
    for (const c of chans) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const y = Math.min(h - 1, Math.max(0, k));
        sum += tmp[(y * w + x) * 4 + c];
      }
      for (let y = 0; y < h; y++) {
        out.data[(y * w + x) * 4 + c] = sum / div;
        const addY = Math.min(h - 1, y + r + 1);
        const subY = Math.max(0, y - r);
        sum += tmp[(addY * w + x) * 4 + c] - tmp[(subY * w + x) * 4 + c];
      }
    }
  }
  return out;
}
function getAlpha(img, x, y) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return 0;
  return img.data[(y * img.width + x) * 4 + 3];
}
function extractPalette(img, n) {
  const counts = /* @__PURE__ */ new Map();
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 24) continue;
    const key = d[i] >> 3 << 10 | d[i + 1] >> 3 << 5 | d[i + 2] >> 3;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.max(1, n));
  const pal = sorted.map(([k]) => ({
    r: ((k >> 10 & 31) << 3) + 4,
    g: ((k >> 5 & 31) << 3) + 4,
    b: ((k & 31) << 3) + 4
  }));
  if (!pal.length) pal.push({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  return pal;
}
function nearestPalette(pal, r, g, b) {
  let best = pal[0], bd = Infinity;
  for (const c of pal) {
    const dr = c.r - r, dg = c.g - g, db = c.b - b;
    const dist = dr * dr * 2 + dg * dg * 3 + db * db;
    if (dist < bd) {
      bd = dist;
      best = c;
    }
  }
  return best;
}
var BAYER2 = [[0, 2], [3, 1]];
var BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];
var BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];
function bayerAt(x, y, order) {
  if (order <= 2) return BAYER2[y & 1][x & 1] / 4 - 0.375;
  if (order === 4) return BAYER4[y & 3][x & 3] / 16 - 0.46875;
  return BAYER8[y & 7][x & 7] / 64 - 0.4921875;
}

// src/lib/effects.ts
function defaults(def2) {
  const v = {};
  for (const p of def2.params) v[p.key] = p.def;
  return v;
}
var R = (key, label, min, max, step, def2, unit) => ({ key, label, type: "range", min, max, step, def: def2, unit });
var C = (key, label, def2) => ({ key, label, type: "color", def: def2 });
var S = (key, label, def2, options) => ({ key, label, type: "select", def: def2, options: options.map(([v, l]) => ({ v, l })) });
var T = (key, label, def2) => ({ key, label, type: "toggle", def: def2 });
var def = (id, name, en, cat, desc, icon, params, apply, animated = false) => ({ id, name, en, cat, desc, icon, params, apply, animated });
var COLOR_FX = [
  def(
    "brightness",
    "\u660E\u5EA6",
    "BRIGHTNESS",
    "color",
    "\u5168\u4F53\u306E\u660E\u308B\u3055\u3092\u52A0\u7B97\u8ABF\u6574",
    "sun",
    [R("amt", "\u5F37\u3055", -100, 100, 1, 0)],
    (img, v) => {
      const d = img.data, k = v.amt * 2.55;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] + k);
        d[i + 1] = clamp(d[i + 1] + k);
        d[i + 2] = clamp(d[i + 2] + k);
      }
    }
  ),
  def(
    "contrast",
    "\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8",
    "CONTRAST",
    "color",
    "\u660E\u6697\u5DEE\u3092\u5F37\u8ABF / \u5E73\u5766\u5316",
    "contrast",
    [R("amt", "\u5F37\u3055", -100, 150, 1, 0)],
    (img, v) => {
      const d = img.data, f = 259 * (v.amt * 2.55 + 255) / (255 * (259 - v.amt * 2.55));
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(f * (d[i] - 128) + 128);
        d[i + 1] = clamp(f * (d[i + 1] - 128) + 128);
        d[i + 2] = clamp(f * (d[i + 2] - 128) + 128);
      }
    }
  ),
  def(
    "saturation",
    "\u5F69\u5EA6",
    "SATURATION",
    "color",
    "\u8272\u306E\u9BAE\u3084\u304B\u3055\u3092\u5236\u5FA1",
    "droplet",
    [R("amt", "\u5F37\u3055", -100, 200, 1, 0)],
    (img, v) => {
      const d = img.data, k = 1 + v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const l = luminance(d[i], d[i + 1], d[i + 2]);
        d[i] = clamp(l + (d[i] - l) * k);
        d[i + 1] = clamp(l + (d[i + 1] - l) * k);
        d[i + 2] = clamp(l + (d[i + 2] - l) * k);
      }
    }
  ),
  def(
    "vibrance",
    "\u81EA\u7136\u306A\u5F69\u5EA6",
    "VIBRANCE",
    "color",
    "\u4F4E\u5F69\u5EA6\u90E8\u5206\u3060\u3051\u3092\u5F37\u8ABF",
    "vibrance",
    [R("amt", "\u5F37\u3055", -100, 150, 1, 30)],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
        const sat = (mx - mn) / 255;
        const amt = k * (1 - sat) * 1.6;
        const l = luminance(d[i], d[i + 1], d[i + 2]);
        d[i] = clamp(l + (d[i] - l) * (1 + amt));
        d[i + 1] = clamp(l + (d[i + 1] - l) * (1 + amt));
        d[i + 2] = clamp(l + (d[i + 2] - l) * (1 + amt));
      }
    }
  ),
  def(
    "hue",
    "\u8272\u76F8\u56DE\u8EE2",
    "HUE ROTATE",
    "color",
    "\u8272\u76F8\u74B0\u3092\u56DE\u8EE2\u3055\u305B\u308B",
    "hue",
    [R("deg", "\u89D2\u5EA6", 0, 360, 1, 0)],
    (img, v) => {
      const d = img.data, s = v.deg / 360;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const h = rgbToHsl(d[i], d[i + 1], d[i + 2]);
        const c = hslToRgb(h.h + s, h.s, h.l);
        d[i] = c.r;
        d[i + 1] = c.g;
        d[i + 2] = c.b;
      }
    }
  ),
  def(
    "exposure",
    "\u9732\u51FA",
    "EXPOSURE",
    "color",
    "\u4E57\u7B97\u3067\u660E\u308B\u3055\u3092\u5236\u5FA1",
    "exposure",
    [R("amt", "EV", -100, 150, 1, 0)],
    (img, v) => {
      const d = img.data, k = Math.pow(2, v.amt / 100);
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] * k);
        d[i + 1] = clamp(d[i + 1] * k);
        d[i + 2] = clamp(d[i + 2] * k);
      }
    }
  ),
  def(
    "gamma",
    "\u30AC\u30F3\u30DE",
    "GAMMA",
    "color",
    "\u4E2D\u9593\u8ABF\u306E\u30AB\u30FC\u30D6\u8ABF\u6574",
    "gamma",
    [R("g", "\u5024", 0.2, 3, 0.01, 1)],
    (img, v) => {
      const d = img.data, g = 1 / Math.max(0.05, v.g);
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) lut[i] = clamp(Math.pow(i / 255, g) * 255);
      for (let i = 0; i < d.length; i += 4) {
        d[i] = lut[d[i]];
        d[i + 1] = lut[d[i + 1]];
        d[i + 2] = lut[d[i + 2]];
      }
    }
  ),
  def(
    "temperature",
    "\u8272\u6E29\u5EA6",
    "TEMPERATURE",
    "color",
    "\u6696\u8272 \u2194 \u5BD2\u8272",
    "thermo",
    [R("amt", "\u5F37\u3055", -100, 100, 1, 0)],
    (img, v) => {
      const d = img.data, k = v.amt / 100 * 26;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] + k);
        d[i + 2] = clamp(d[i + 2] - k);
      }
    }
  ),
  def(
    "tintfx",
    "\u8272\u304B\u3076\u308A",
    "TINT",
    "color",
    "\u7DD1 \u2194 \u30DE\u30BC\u30F3\u30BF",
    "tint",
    [R("amt", "\u5F37\u3055", -100, 100, 1, 0)],
    (img, v) => {
      const d = img.data, k = v.amt / 100 * 24;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] + k);
        d[i + 1] = clamp(d[i + 1] - k);
        d[i + 2] = clamp(d[i + 2] + k);
      }
    }
  ),
  def(
    "levels",
    "\u30EC\u30D9\u30EB\u88DC\u6B63",
    "LEVELS",
    "color",
    "\u9ED2\u70B9 / \u767D\u70B9\u3092\u518D\u5B9A\u7FA9",
    "levels",
    [R("bin", "\u5165\u529B\u9ED2\u70B9", 0, 128, 1, 0), R("win", "\u5165\u529B\u767D\u70B9", 128, 255, 1, 255), R("bout", "\u51FA\u529B\u9ED2\u70B9", 0, 128, 1, 0), R("wout", "\u51FA\u529B\u767D\u70B9", 128, 255, 1, 255)],
    (img, v) => {
      const d = img.data;
      const lo = Math.min(v.bin, v.win - 1), hi = Math.max(v.win, v.bin + 1);
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) {
        const t = clamp01((i - lo) / (hi - lo));
        lut[i] = clamp(v.bout + t * (v.wout - v.bout));
      }
      for (let i = 0; i < d.length; i += 4) {
        d[i] = lut[d[i]];
        d[i + 1] = lut[d[i + 1]];
        d[i + 2] = lut[d[i + 2]];
      }
    }
  ),
  def(
    "grayscale",
    "\u30B0\u30EC\u30FC\u30B9\u30B1\u30FC\u30EB",
    "GRAYSCALE",
    "color",
    "\u30E2\u30CE\u30C8\u30FC\u30F3\u5316",
    "gray",
    [R("amt", "\u5F37\u3055", 0, 100, 1, 100), S("mode", "\u65B9\u5F0F", "luma", [["luma", "\u8F1D\u5EA6"], ["avg", "\u5E73\u5747"], ["max", "\u660E\u5EA6\u512A\u5148"]])],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const g = v.mode === "avg" ? (d[i] + d[i + 1] + d[i + 2]) / 3 : v.mode === "max" ? Math.max(d[i], d[i + 1], d[i + 2]) : luminance(d[i], d[i + 1], d[i + 2]);
        d[i] = clamp(d[i] + (g - d[i]) * k);
        d[i + 1] = clamp(d[i + 1] + (g - d[i + 1]) * k);
        d[i + 2] = clamp(d[i + 2] + (g - d[i + 2]) * k);
      }
    }
  ),
  def(
    "sepia",
    "\u30BB\u30D4\u30A2",
    "SEPIA",
    "color",
    "\u53E4\u5199\u771F\u98A8\u306E\u6696\u8272\u8ABF",
    "sepia",
    [R("amt", "\u5F37\u3055", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const nr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
        const ng = clamp(r * 0.349 + g * 0.686 + b * 0.168);
        const nb = clamp(r * 0.272 + g * 0.534 + b * 0.131);
        d[i] = r + (nr - r) * k;
        d[i + 1] = g + (ng - g) * k;
        d[i + 2] = b + (nb - b) * k;
      }
    }
  ),
  def(
    "invert",
    "\u968E\u8ABF\u53CD\u8EE2",
    "INVERT",
    "color",
    "\u8272\u3092\u30CD\u30AC\u30DD\u30B8\u53CD\u8EE2",
    "invert",
    [R("amt", "\u5F37\u3055", 0, 100, 1, 100), T("alpha", "\u30A2\u30EB\u30D5\u30A1\u3082\u53CD\u8EE2", false)],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] + (255 - d[i] - d[i]) * k);
        d[i + 1] = clamp(d[i + 1] + (255 - 2 * d[i + 1]) * k);
        d[i + 2] = clamp(d[i + 2] + (255 - 2 * d[i + 2]) * k);
        if (v.alpha) d[i + 3] = clamp(d[i + 3] + (255 - 2 * d[i + 3]) * k);
      }
    }
  ),
  def(
    "posterize",
    "\u30DD\u30B9\u30BF\u30EA\u30BC\u30FC\u30B7\u30E7\u30F3",
    "POSTERIZE",
    "color",
    "\u968E\u8ABF\u3092\u6BB5\u968E\u5316",
    "poster",
    [R("levels", "\u968E\u8ABF\u6570", 2, 24, 1, 4), R("amt", "\u5F37\u3055", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, n = Math.max(2, v.levels), k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          const q = Math.round(d[i + c] / 255 * (n - 1)) / (n - 1) * 255;
          d[i + c] = clamp(d[i + c] + (q - d[i + c]) * k);
        }
      }
    }
  ),
  def(
    "threshold",
    "\u4E8C\u5024\u5316",
    "THRESHOLD",
    "color",
    "\u5B8C\u5168\u306A2\u5024\u306B\u5909\u63DB",
    "threshold",
    [R("val", "\u3057\u304D\u3044\u5024", 0, 255, 1, 128), C("fg", "\u524D\u666F\u8272", "#ffffff"), C("bg", "\u80CC\u666F\u8272", "#000000"), T("keepAlpha", "\u900F\u660E\u7DAD\u6301", true)],
    (img, v) => {
      const d = img.data, f = hexToRgb(v.fg), b = hexToRgb(v.bg);
      for (let i = 0; i < d.length; i += 4) {
        if (v.keepAlpha && d[i + 3] === 0) continue;
        const on = luminance(d[i], d[i + 1], d[i + 2]) >= v.val;
        d[i] = on ? f.r : b.r;
        d[i + 1] = on ? f.g : b.g;
        d[i + 2] = on ? f.b : b.b;
        if (!v.keepAlpha) d[i + 3] = 255;
      }
    }
  ),
  def(
    "colorize",
    "\u5358\u8272\u5316",
    "COLORIZE",
    "color",
    "1\u8272\u3067\u5168\u4F53\u3092\u67D3\u3081\u308B",
    "colorize",
    [C("color", "\u8272", "#f5a63c"), R("amt", "\u5F37\u3055", 0, 100, 1, 60), T("keepLuma", "\u660E\u5EA6\u4FDD\u6301", true)],
    (img, v) => {
      const d = img.data, c = hexToRgb(v.color), k = v.amt / 100;
      const h = rgbToHsl(c.r, c.g, c.b);
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const l = luminance(d[i], d[i + 1], d[i + 2]);
        const t = v.keepLuma ? hslToRgb(h.h, h.s, l / 255) : c;
        d[i] = clamp(d[i] + (t.r - d[i]) * k);
        d[i + 1] = clamp(d[i + 1] + (t.g - d[i + 1]) * k);
        d[i + 2] = clamp(d[i + 2] + (t.b - d[i + 2]) * k);
      }
    }
  ),
  def(
    "duotone",
    "\u30C7\u30E5\u30AA\u30C8\u30FC\u30F3",
    "DUOTONE",
    "color",
    "\u6697\u90E8\u3068\u660E\u90E8\u3092\u5225\u8272\u3067\u7F6E\u63DB",
    "duotone",
    [C("dark", "\u6697\u90E8\u8272", "#1b1140"), C("light", "\u660E\u90E8\u8272", "#ffd166"), R("amt", "\u5F37\u3055", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, dk = hexToRgb(v.dark), lt = hexToRgb(v.light), k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const t = luminance(d[i], d[i + 1], d[i + 2]) / 255;
        const r = dk.r + (lt.r - dk.r) * t, g = dk.g + (lt.g - dk.g) * t, b = dk.b + (lt.b - dk.b) * t;
        d[i] = clamp(d[i] + (r - d[i]) * k);
        d[i + 1] = clamp(d[i + 1] + (g - d[i + 1]) * k);
        d[i + 2] = clamp(d[i + 2] + (b - d[i + 2]) * k);
      }
    }
  ),
  def(
    "gradientMap",
    "\u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3\u30DE\u30C3\u30D7",
    "GRADIENT MAP",
    "color",
    "3\u70B9\u30AB\u30E9\u30FC\u3067\u968E\u8ABF\u30DE\u30C3\u30D4\u30F3\u30B0",
    "gradient",
    [C("c1", "\u6697\u90E8", "#0b1e3a"), C("c2", "\u4E2D\u9593", "#37d6c4"), C("c3", "\u660E\u90E8", "#fff3c4"), R("amt", "\u5F37\u3055", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, a = hexToRgb(v.c1), b = hexToRgb(v.c2), c = hexToRgb(v.c3), k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const t = luminance(d[i], d[i + 1], d[i + 2]) / 255;
        const p = t < 0.5 ? { r: a.r + (b.r - a.r) * t * 2, g: a.g + (b.g - a.g) * t * 2, b: a.b + (b.b - a.b) * t * 2 } : { r: b.r + (c.r - b.r) * (t - 0.5) * 2, g: b.g + (c.g - b.g) * (t - 0.5) * 2, b: b.b + (c.b - b.b) * (t - 0.5) * 2 };
        d[i] = clamp(d[i] + (p.r - d[i]) * k);
        d[i + 1] = clamp(d[i + 1] + (p.g - d[i + 1]) * k);
        d[i + 2] = clamp(d[i + 2] + (p.b - d[i + 2]) * k);
      }
    }
  ),
  def(
    "channelSwap",
    "\u30C1\u30E3\u30F3\u30CD\u30EB\u5165\u66FF",
    "CHANNEL SWAP",
    "color",
    "RGB \u306E\u5272\u308A\u5F53\u3066\u3092\u5165\u308C\u66FF\u3048\u308B",
    "swap",
    [S("mode", "\u9806\u5E8F", "rbg", [["rgb", "RGB (\u65E2\u5B9A)"], ["rbg", "RBG"], ["grb", "GRB"], ["gbr", "GBR"], ["brg", "BRG"], ["bgr", "BGR"]])],
    (img, v) => {
      const d = img.data, m = { rgb: [0, 1, 2], rbg: [0, 2, 1], grb: [1, 0, 2], gbr: [1, 2, 0], brg: [2, 0, 1], bgr: [2, 1, 0] };
      const o = m[v.mode] || m.rgb;
      const tmp = clone(img);
      for (let i = 0; i < d.length; i += 4) {
        d[i] = tmp.data[i + o[0]];
        d[i + 1] = tmp.data[i + o[1]];
        d[i + 2] = tmp.data[i + o[2]];
      }
    }
  )
];
var PIXEL_FX = [
  def(
    "pixelate",
    "\u30D4\u30AF\u30BB\u30EB\u5316",
    "PIXELATE",
    "pixel",
    "\u30D6\u30ED\u30C3\u30AF\u5358\u4F4D\u3067\u9593\u5F15\u304F",
    "grid",
    [R("block", "\u30D6\u30ED\u30C3\u30AF", 2, 16, 1, 2)],
    (img, v) => {
      const s = clone(img), b = Math.max(2, Math.round(v.block)), w = img.width, h = img.height, d = img.data;
      for (let by = 0; by < h; by += b)
        for (let bx = 0; bx < w; bx += b) {
          let r = 0, g = 0, bl = 0, a = 0, n = 0;
          for (let y = by; y < Math.min(h, by + b); y++)
            for (let x = bx; x < Math.min(w, bx + b); x++) {
              const i = y * w + x << 2;
              r += s.data[i];
              g += s.data[i + 1];
              bl += s.data[i + 2];
              a += s.data[i + 3];
              n++;
            }
          r /= n;
          g /= n;
          bl /= n;
          a /= n;
          for (let y = by; y < Math.min(h, by + b); y++)
            for (let x = bx; x < Math.min(w, bx + b); x++) {
              const i = y * w + x << 2;
              d[i] = r;
              d[i + 1] = g;
              d[i + 2] = bl;
              d[i + 3] = a;
            }
        }
    }
  ),
  def(
    "ditherBayer",
    "\u9806\u5E8F\u30C7\u30A3\u30B6",
    "ORDERED DITHER",
    "pixel",
    "\u30D0\u30A4\u30A8\u30EB\u884C\u5217\u3067\u30EC\u30C8\u30ED\u8ABF\u306B",
    "dither",
    [S("order", "\u884C\u5217", "4", [["2", "2\xD72"], ["4", "4\xD74"], ["8", "8\xD78"]]), R("colors", "\u8272\u6570", 2, 32, 1, 6), R("spread", "\u62E1\u6563", 0, 100, 1, 45)],
    (img, v) => {
      const pal = extractPalette(img, v.colors), d = img.data, w = img.width, sp = v.spread / 100 * 64, o = parseInt(v.order, 10);
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (d[i + 3] === 0) continue;
          const bias = bayerAt(x, y, o) * sp;
          const c = nearestPalette(pal, clamp(d[i] + bias), clamp(d[i + 1] + bias), clamp(d[i + 2] + bias));
          d[i] = c.r;
          d[i + 1] = c.g;
          d[i + 2] = c.b;
        }
    }
  ),
  def(
    "ditherFS",
    "\u8AA4\u5DEE\u62E1\u6563\u30C7\u30A3\u30B6",
    "FLOYD\u2013STEINBERG",
    "pixel",
    "\u6709\u6A5F\u7684\u306A\u30C7\u30A3\u30B6\u30EA\u30F3\u30B0",
    "wave",
    [R("colors", "\u8272\u6570", 2, 48, 1, 8), R("spread", "\u5F37\u5EA6", 0, 100, 1, 100)],
    (img, v) => {
      const pal = extractPalette(img, v.colors), w = img.width, h = img.height;
      const buf = new Float32Array(w * h * 3);
      for (let i = 0; i < w * h; i++) {
        buf[i * 3] = img.data[i * 4];
        buf[i * 3 + 1] = img.data[i * 4 + 1];
        buf[i * 3 + 2] = img.data[i * 4 + 2];
      }
      const k = v.spread / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const pi = y * w + x, i = pi << 2;
          if (img.data[i + 3] === 0) continue;
          const c = nearestPalette(pal, clamp(buf[pi * 3]), clamp(buf[pi * 3 + 1]), clamp(buf[pi * 3 + 2]));
          const er = (buf[pi * 3] - c.r) * k, eg = (buf[pi * 3 + 1] - c.g) * k, eb = (buf[pi * 3 + 2] - c.b) * k;
          img.data[i] = c.r;
          img.data[i + 1] = c.g;
          img.data[i + 2] = c.b;
          const spreadTo = (dx, dy, f) => {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
            const n = (ny * w + nx) * 3;
            buf[n] += er * f;
            buf[n + 1] += eg * f;
            buf[n + 2] += eb * f;
          };
          spreadTo(1, 0, 7 / 16);
          spreadTo(-1, 1, 3 / 16);
          spreadTo(0, 1, 5 / 16);
          spreadTo(1, 1, 1 / 16);
        }
    }
  ),
  def(
    "quantize",
    "\u6E1B\u8272",
    "QUANTIZE",
    "pixel",
    "\u30D1\u30EC\u30C3\u30C8\u8272\u6570\u3092\u5236\u9650",
    "palette",
    [R("colors", "\u8272\u6570", 2, 64, 1, 12)],
    (img, v) => {
      const pal = extractPalette(img, v.colors), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const c = nearestPalette(pal, d[i], d[i + 1], d[i + 2]);
        d[i] = c.r;
        d[i + 1] = c.g;
        d[i + 2] = c.b;
      }
    }
  ),
  def(
    "outline",
    "\u30A2\u30A6\u30C8\u30E9\u30A4\u30F3",
    "OUTLINE",
    "pixel",
    "\u30B7\u30EB\u30A8\u30C3\u30C8\u3092\u7E01\u53D6\u308B",
    "outline",
    [C("color", "\u8272", "#14100c"), R("thick", "\u592A\u3055", 1, 4, 1, 1), R("alphaTh", "\u5224\u5B9A\u03B1", 1, 255, 1, 32), S("mode", "\u4F4D\u7F6E", "outer", [["outer", "\u5916\u5074"], ["inner", "\u5185\u5074"], ["both", "\u4E21\u5074"]])],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color), th = Math.max(1, v.thick | 0);
      const solid = (x, y) => getAlpha(src, x, y) >= v.alphaTh;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const me = solid(x, y);
          let near = false;
          for (let dy = -th; dy <= th && !near; dy++)
            for (let dx = -th; dx <= th; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (Math.abs(dx) + Math.abs(dy) > th + (th > 1 ? 1 : 0)) continue;
              if (solid(x + dx, y + dy) !== me) {
                near = true;
                break;
              }
            }
          if (!near) continue;
          if (v.mode === "inner" && !me) continue;
          if (v.mode === "outer" && me) continue;
          overPx(img, x, y, c.r, c.g, c.b, me ? 255 : 255);
        }
    }
  ),
  def(
    "bevel",
    "\u30D9\u30D9\u30EB / \u7ACB\u4F53\u5316",
    "BEVEL",
    "pixel",
    "\u30C9\u30C3\u30C8\u7D75\u98A8\u306E\u9762\u53D6\u308A\u9670\u5F71",
    "bevel",
    [R("amt", "\u5F37\u3055", 0, 100, 1, 45), R("angle", "\u5149\u6E90\u89D2\u5EA6", 0, 360, 1, 315), R("soft", "\u5E83\u304C\u308A", 1, 3, 1, 1), T("edge", "\u8F2A\u90ED\u5F37\u8ABF", true)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, d = img.data;
      const a = v.angle * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a), k = v.amt / 100 * 110, soft = v.soft;
      const lumAt = (x, y, fb) => {
        const nx = Math.round(x + dx * soft * fb), ny = Math.round(y + dy * soft * fb);
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return -1;
        const i = ny * w + nx << 2;
        if (src.data[i + 3] < 16) return -1;
        return luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (d[i + 3] === 0) continue;
          const here = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
          const up = lumAt(x, y, 1), down = lumAt(x, y, -1);
          let delta = 0;
          if (up >= 0) delta += (up - here) * 0.6;
          if (down >= 0) delta += (here - down) * 0.6;
          if (v.edge && (up < 0 || down < 0)) delta += (up < 0 ? 0.5 : 0) - (down < 0 ? 0.5 : 0);
          const add = clamp(delta * k, -255, 255);
          d[i] = clamp(d[i] + add);
          d[i + 1] = clamp(d[i + 1] + add);
          d[i + 2] = clamp(d[i + 2] + add);
        }
    }
  ),
  def(
    "dropShadow",
    "\u30C9\u30ED\u30C3\u30D7\u30B7\u30E3\u30C9\u30A6",
    "DROP SHADOW",
    "pixel",
    "\u5F8C\u308D\u306B\u5F71\u3092\u843D\u3068\u3059",
    "shadow",
    [C("color", "\u5F71\u8272", "#000000"), R("dx", "X \u30AA\u30D5\u30BB\u30C3\u30C8", -16, 16, 1, 2), R("dy", "Y \u30AA\u30D5\u30BB\u30C3\u30C8", -16, 16, 1, 3), R("blur", "\u307C\u304B\u3057", 0, 8, 1, 2), R("op", "\u4E0D\u900F\u660E\u5EA6", 0, 100, 1, 60)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color);
      const sh = new ImageData(w, h);
      for (let i = 0; i < src.data.length; i += 4) sh.data[i + 3] = src.data[i + 3];
      const blurred = boxBlur(sh, v.blur, true);
      const out = new ImageData(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const sx = x - v.dx | 0, sy = y - v.dy | 0;
          if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
          const a = blurred.data[sy * w + sx << 2 | 3];
          const i = y * w + x << 2;
          out.data[i] = c.r;
          out.data[i + 1] = c.g;
          out.data[i + 2] = c.b;
          out.data[i + 3] = a * (v.op / 100);
        }
      const d = img.data;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          overPx(out, x, y, src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]);
          d[i] = out.data[i];
          d[i + 1] = out.data[i + 1];
          d[i + 2] = out.data[i + 2];
          d[i + 3] = out.data[i + 3];
        }
    }
  ),
  def(
    "innerShadow",
    "\u5185\u5074\u30B7\u30E3\u30C9\u30A6",
    "INNER SHADOW",
    "pixel",
    "\u7E01\u304B\u3089\u5185\u5074\u306B\u5F71",
    "inset",
    [C("color", "\u8272", "#000000"), R("size", "\u5E83\u304C\u308A", 1, 16, 1, 4), R("op", "\u4E0D\u900F\u660E\u5EA6", 0, 100, 1, 55), R("angle", "\u65B9\u5411", 0, 360, 1, 225)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      const inv = new ImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) inv.data[i + 3] = 255 - img.data[i + 3];
      const a = v.angle * Math.PI / 180;
      const ox = Math.round(Math.cos(a) * v.size * 0.4), oy = Math.round(Math.sin(a) * v.size * 0.4);
      const sh = new ImageData(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const sx = clamp(x - ox, 0, w - 1), sy = clamp(y - oy, 0, h - 1);
          sh.data[y * w + x << 2 | 3] = inv.data[sy * w + sx << 2 | 3];
        }
      const blurred = boxBlur(sh, v.size, true);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const k = blurred.data[i + 3] / 255 * (v.op / 100);
          img.data[i] = clamp(img.data[i] * (1 - k) + c.r * k);
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - k) + c.g * k);
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - k) + c.b * k);
        }
    }
  ),
  def(
    "outerGlow",
    "\u5916\u5074\u30B0\u30ED\u30FC",
    "OUTER GLOW",
    "pixel",
    "\u8F2A\u90ED\u304B\u3089\u5149\u3092\u653E\u3064",
    "glow",
    [C("color", "\u8272", "#ffd166"), R("radius", "\u5E83\u304C\u308A", 1, 16, 1, 5), R("intensity", "\u5F37\u3055", 0, 200, 1, 90), T("over", "\u4E0A\u306B\u91CD\u306D\u308B", false)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color);
      const a = new ImageData(w, h);
      for (let i = 0; i < src.data.length; i += 4) a.data[i + 3] = src.data[i + 3];
      const glow = boxBlur(a, v.radius, true);
      const out = new ImageData(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          const k = clamp01(glow.data[i + 3] / 255 * (v.intensity / 100)) * 255;
          out.data[i] = c.r;
          out.data[i + 1] = c.g;
          out.data[i + 2] = c.b;
          out.data[i + 3] = k;
        }
      const d = img.data;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (!v.over) overPx(out, x, y, src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]);
          else addPx(out, x, y, c.r, c.g, c.b, clamp01(glow.data[i + 3] / 255 * (v.intensity / 100)) * 200), overPx(out, x, y, src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]);
          d[i] = out.data[i];
          d[i + 1] = out.data[i + 1];
          d[i + 2] = out.data[i + 2];
          d[i + 3] = out.data[i + 3];
        }
    }
  ),
  def(
    "innerGlow",
    "\u5185\u5074\u30B0\u30ED\u30FC",
    "INNER GLOW",
    "pixel",
    "\u5185\u5074\u304B\u3089\u767A\u5149\u3055\u305B\u308B",
    "innerglow",
    [C("color", "\u8272", "#fff6c9"), R("size", "\u5E83\u304C\u308A", 1, 16, 1, 4), R("intensity", "\u5F37\u3055", 0, 200, 1, 80)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      const inv = new ImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) inv.data[i + 3] = 255 - img.data[i + 3];
      const blurred = boxBlur(inv, v.size, true);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const k = clamp01(blurred.data[i + 3] / 255) * (v.intensity / 100);
          screenPx(img, x, y, c.r, c.g, c.b, k * 255);
        }
    }
  ),
  def(
    "grain",
    "\u30CE\u30A4\u30BA / \u7C92\u5B50",
    "GRAIN",
    "pixel",
    "\u30E9\u30F3\u30C0\u30E0\u7C92\u72B6\u611F\u3092\u4ED8\u4E0E",
    "noise",
    [R("amt", "\u5F37\u3055", 0, 100, 1, 18), T("mono", "\u30E2\u30CE\u30AF\u30ED", true), R("cell", "\u7C92\u30B5\u30A4\u30BA", 1, 4, 1, 1), T("alphaOnly", "\u03B1\u306E\u307F", false)],
    (img, v, c) => {
      const d = img.data, w = img.width, k = v.amt / 100 * 130, cell = Math.max(1, v.cell | 0), rnd = mulberry32(c.seed * 977 + 13);
      const cache = /* @__PURE__ */ new Map();
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (d[i + 3] === 0) continue;
          const cx = Math.floor(x / cell), cy = Math.floor(y / cell), key = cy * 4096 + cx;
          let n = cache.get(key);
          if (!n) {
            n = [(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2];
            cache.set(key, n);
          }
          if (v.alphaOnly) {
            d[i + 3] = clamp(d[i + 3] + n[0] * k * 0.5);
            continue;
          }
          if (v.mono) {
            const m = n[0] * k;
            d[i] = clamp(d[i] + m);
            d[i + 1] = clamp(d[i + 1] + m);
            d[i + 2] = clamp(d[i + 2] + m);
          } else {
            d[i] = clamp(d[i] + n[0] * k);
            d[i + 1] = clamp(d[i + 1] + n[1] * k);
            d[i + 2] = clamp(d[i + 2] + n[2] * k);
          }
        }
    }
  ),
  def(
    "blur",
    "\u307C\u304B\u3057",
    "BLUR",
    "pixel",
    "\u5168\u4F53\u3092\u6ED1\u3089\u304B\u306B",
    "blur",
    [R("radius", "\u534A\u5F84", 0.2, 8, 0.2, 1)],
    (img, v) => {
      const b = boxBlur(img, v.radius);
      img.data.set(b.data);
    }
  ),
  def(
    "sharpen",
    "\u30B7\u30E3\u30FC\u30D7\u30F3",
    "SHARPEN",
    "pixel",
    "\u8F2A\u90ED\u3092\u5F37\u8ABF\u3057\u3066\u5F15\u304D\u7DE0\u3081",
    "sharp",
    [R("amt", "\u5F37\u3055", 0, 200, 1, 70)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, k = v.amt / 100;
      const kernel = [-k / 4, -k / 4, 0, -k / 4, 1 + k, -k / 4, 0, -k / 4, 0];
      const at = (x, y, c) => src.data[(clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)) * 4 + c];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (src.data[i + 3] === 0) continue;
          for (let c = 0; c < 3; c++) {
            let s = 0;
            for (let ky = -1; ky <= 1; ky++)
              for (let kx = -1; kx <= 1; kx++) s += at(x + kx, y + ky, c) * kernel[(ky + 1) * 3 + (kx + 1)];
            img.data[i + c] = clamp(s);
          }
        }
    }
  ),
  def(
    "edgeDetect",
    "\u30A8\u30C3\u30B8\u691C\u51FA",
    "EDGE DETECT",
    "pixel",
    "\u8F2A\u90ED\u7DDA\u306E\u307F\u3092\u62BD\u51FA",
    "edge",
    [R("th", "\u3057\u304D\u3044\u5024", 0, 120, 1, 26), C("color", "\u7DDA\u8272", "#ffffff"), S("mode", "\u51FA\u529B", "color", [["color", "\u5358\u8272\u7DDA"], ["keep", "\u5143\u8272\u3092\u7DAD\u6301"], ["invertLine", "\u53CD\u8EE2\u7DDA"]])],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color);
      const lum = (x, y) => {
        const i = clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1) << 2;
        return luminance(src.data[i], src.data[i + 1], src.data[i + 2]) * (src.data[i + 3] / 255);
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          const gx = -lum(x - 1, y - 1) - 2 * lum(x - 1, y) - lum(x - 1, y + 1) + lum(x + 1, y - 1) + 2 * lum(x + 1, y) + lum(x + 1, y + 1);
          const gy = -lum(x - 1, y - 1) - 2 * lum(x, y - 1) - lum(x + 1, y - 1) + lum(x - 1, y + 1) + 2 * lum(x, y + 1) + lum(x + 1, y + 1);
          const mag = Math.sqrt(gx * gx + gy * gy);
          const on = mag > v.th;
          if (v.mode === "keep") {
            if (!on) {
              img.data[i] = src.data[i];
              img.data[i + 1] = src.data[i + 1];
              img.data[i + 2] = src.data[i + 2];
            }
          } else if (v.mode === "invertLine") {
            img.data[i] = on ? 0 : 255;
            img.data[i + 1] = on ? 0 : 255;
            img.data[i + 2] = on ? 0 : 255;
          } else {
            img.data[i] = on ? c.r : 0;
            img.data[i + 1] = on ? c.g : 0;
            img.data[i + 2] = on ? c.b : 0;
          }
          img.data[i + 3] = src.data[i + 3];
        }
    }
  ),
  def(
    "scanline",
    "\u30B9\u30AD\u30E3\u30F3\u30E9\u30A4\u30F3",
    "SCANLINE",
    "pixel",
    "\u8D70\u67FB\u7DDA\u30D1\u30BF\u30FC\u30F3",
    "scan",
    [R("gap", "\u9593\u9694", 1, 8, 1, 2), R("op", "\u6FC3\u3055", 0, 100, 1, 35), S("dir", "\u65B9\u5411", "h", [["h", "\u6A2A"], ["v", "\u7E26"]]), T("bright", "\u660E\u7DDA\u306B\u3059\u308B", false)],
    (img, v) => {
      const d = img.data, w = img.width, k = v.op / 100;
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const p = (v.dir === "h" ? y : x) % Math.max(1, v.gap);
          if (p !== 0) continue;
          const i = y * w + x << 2;
          const f = v.bright ? 1 + k * 0.9 : 1 - k * 0.85;
          d[i] = clamp(d[i] * f);
          d[i + 1] = clamp(d[i + 1] * f);
          d[i + 2] = clamp(d[i + 2] * f);
        }
    }
  ),
  def(
    "halftone",
    "\u30CF\u30FC\u30D5\u30C8\u30FC\u30F3",
    "HALFTONE",
    "pixel",
    "\u7F51\u70B9\u6A21\u69D8\u3067\u968E\u8ABF\u8868\u73FE",
    "halftone",
    [R("cell", "\u30BB\u30EB", 2, 8, 1, 3), R("contrast", "\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8", 0, 100, 1, 50), C("color", "\u8272", "#ffffff"), S("mode", "\u5408\u6210", "multiply", [["multiply", "\u4E57\u7B97"], ["screen", "\u52A0\u7B97"]])],
    (img, v) => {
      const w = img.width, h = img.height, cell = Math.max(2, v.cell | 0), c = hexToRgb(v.color), k = v.contrast / 100;
      for (let by = 0; by < h; by += cell)
        for (let bx = 0; bx < w; bx += cell) {
          let sum = 0, n = 0;
          for (let y = by; y < Math.min(h, by + cell); y++)
            for (let x = bx; x < Math.min(w, bx + cell); x++) {
              const i = y * w + x << 2;
              if (img.data[i + 3] > 0) {
                sum += luminance(img.data[i], img.data[i + 1], img.data[i + 2]);
                n++;
              }
            }
          if (!n) continue;
          const luma = sum / n / 255;
          const rad = cell / 2 * (v.mode === "screen" ? luma : 1 - luma) * (0.4 + k);
          const cx = bx + cell / 2 - 0.5, cy = by + cell / 2 - 0.5;
          for (let y = by; y < Math.min(h, by + cell); y++)
            for (let x = bx; x < Math.min(w, bx + cell); x++) {
              const i = y * w + x << 2;
              if (img.data[i + 3] === 0) continue;
              const dd = Math.hypot(x - cx, y - cy);
              const aa = clamp01(rad + 0.4 - dd);
              if (v.mode === "screen") screenPx(img, x, y, c.r, c.g, c.b, aa * 190);
              else {
                img.data[i] = clamp(img.data[i] * (1 - aa * 0.6));
                img.data[i + 1] = clamp(img.data[i + 1] * (1 - aa * 0.6));
                img.data[i + 2] = clamp(img.data[i + 2] * (1 - aa * 0.6));
              }
            }
        }
    }
  ),
  def(
    "crosshatch",
    "\u4EA4\u5DEE\u30CF\u30C3\u30C1",
    "CROSSHATCH",
    "pixel",
    "\u6697\u90E8\u306B\u659C\u7DDA\u9670\u5F71",
    "hatch",
    [R("density", "\u5BC6\u5EA6", 2, 10, 1, 4), R("op", "\u6FC3\u3055", 0, 100, 1, 40), C("color", "\u7DDA\u8272", "#0a0a0a"), T("cross", "\u4EA4\u5DEE\u3055\u305B\u308B", true)],
    (img, v) => {
      const d = img.data, w = img.width, step = Math.max(2, v.density | 0), c = hexToRgb(v.color), k = v.op / 100;
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (d[i + 3] === 0) continue;
          const l = luminance(d[i], d[i + 1], d[i + 2]) / 255;
          const on1 = (x + y) % step === 0;
          const on2 = v.cross && (x - y + step * 8) % step === 0;
          const strength = (1 - l) * k * (on1 ? 1 : on2 ? 0.7 : 0);
          if (strength <= 0) continue;
          d[i] = clamp(d[i] + (c.r - d[i]) * strength);
          d[i + 1] = clamp(d[i + 1] + (c.g - d[i + 1]) * strength);
          d[i + 2] = clamp(d[i + 2] + (c.b - d[i + 2]) * strength);
        }
    }
  ),
  def(
    "symmetry",
    "\u5BFE\u79F0\u5316",
    "SYMMETRY",
    "pixel",
    "\u5DE6\u53F3 / \u4E0A\u4E0B / \u56DB\u5206\u5272\u30DF\u30E9\u30FC",
    "mirror",
    [S("mode", "\u65B9\u5F0F", "x", [["x", "\u5DE6\u53F3"], ["y", "\u4E0A\u4E0B"], ["quad", "\u56DB\u5206\u5272"], ["diag", "\u5BFE\u89D2"]])],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, d = img.data;
      const copy = (sx, sy, tx, ty) => {
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
        const a = sy * w + sx << 2, b = ty * w + tx << 2;
        d[b] = src.data[a];
        d[b + 1] = src.data[a + 1];
        d[b + 2] = src.data[a + 2];
        d[b + 3] = src.data[a + 3];
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (v.mode === "x") {
            if (x >= w / 2) copy(w - 1 - x, y, x, y);
          } else if (v.mode === "y") {
            if (y >= h / 2) copy(x, h - 1 - y, x, y);
          } else if (v.mode === "diag") {
            if (y > x) copy(y, x, x, y);
          } else {
            const sx = x < w / 2 ? x : w - 1 - x, sy = y < h / 2 ? y : h - 1 - y;
            copy(sx, sy, x, y);
          }
        }
    }
  )
];
var CORE_FX = [...COLOR_FX, ...PIXEL_FX];

// src/lib/effects2.ts
var R2 = (key, label, min, max, step, dv, unit) => ({ key, label, type: "range", min, max, step, def: dv, unit });
var C2 = (key, label, dv) => ({ key, label, type: "color", def: dv });
var S2 = (key, label, dv, options) => ({ key, label, type: "select", def: dv, options: options.map(([v, l]) => ({ v, l })) });
var T2 = (key, label, dv) => ({ key, label, type: "toggle", def: dv });
var mk = (id, name, en, cat, desc, icon, params, apply, animated = false) => ({ id, name, en, cat, desc, icon, params, apply, animated });
function maskOf(img) {
  const m = new Float32Array(img.width * img.height);
  for (let i = 0; i < m.length; i++) m[i] = img.data[i * 4 + 3] / 255;
  return m;
}
var GLYPHS = [
  ["01110", "10001", "10000", "11110", "10000", "10001", "01110"],
  ["11111", "00100", "00100", "00100", "00100", "10101", "01010"],
  ["10001", "01010", "00100", "11111", "00100", "01010", "10001"],
  ["01110", "10001", "00100", "00100", "00100", "00100", "00100"],
  ["11111", "01010", "01010", "11111", "00100", "00100", "00100"],
  ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  ["00100", "01110", "10101", "11111", "10101", "01110", "00100"],
  ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  ["00000", "01110", "11011", "11111", "11011", "01110", "00000"],
  ["10101", "01010", "10101", "01010", "10101", "01010", "10101"]
];
var DECOR_FX = [
  mk(
    "frame",
    "\u984D\u7E01\u30D5\u30EC\u30FC\u30E0",
    "ORNATE FRAME",
    "decor",
    "\u5916\u5468\u3092\u88C5\u98FE\u67A0\u3067\u56F2\u3080",
    "frame",
    [
      S2("style", "\u69D8\u5F0F", "gold", [["gold", "\u9EC4\u91D1"], ["stone", "\u77F3\u9020"], ["tech", "\u6A5F\u68B0"], ["ornate", "\u8C6A\u83EF"], ["bone", "\u9AA8\u767D"]]),
      R2("thick", "\u592A\u3055", 1, 8, 1, 2),
      C2("color", "\u8272", "#e0b23c"),
      R2("shade", "\u9670\u5F71", 0, 100, 1, 60),
      T2("inner", "\u5185\u5074\u30E9\u30A4\u30F3", true),
      T2("glow", "\u767A\u5149", false)
    ],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), th = Math.max(1, v.thick | 0), sh = v.shade / 100;
      const rnd = mulberry32(4242);
      const tex = [];
      for (let i = 0; i < w * h; i++) tex.push(v.style === "stone" || v.style === "bone" ? rnd() * 0.5 + 0.5 : v.style === "tech" ? rnd() > 0.85 ? 1.25 : 1 : 1);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const dTop = y, dBot = h - 1 - y, dL = x, dRt = w - 1 - x;
          const dist = Math.min(dTop, dBot, dL, dRt);
          if (dist >= th) continue;
          const isInner = dist === th - 1 && v.inner;
          let k = 1;
          const edge = dist / Math.max(1, th - 1e-3);
          if (dTop === dist) k += 0.42 * sh;
          if (dL === dist) k += 0.28 * sh;
          if (dBot === dist) k -= 0.45 * sh;
          if (dRt === dist) k -= 0.32 * sh;
          k += (1 - edge) * 0.14 * sh;
          k *= tex[y * w + x];
          if (v.style === "ornate") {
            const corner = Math.min(x, y, w - 1 - x, h - 1 - y);
            if (corner < th + 1 && dist < th - 0.2) k *= 1.28;
            if ((x + y) % 3 === 0 && dist === 0) k *= 0.86;
          }
          if (v.style === "tech" && (x + y) % 4 < 2 && dist === th - 1) k *= 0.7;
          const r = clamp(c.r * k), g = clamp(c.g * k), b = clamp(c.b * k);
          if (isInner) {
            overPx(img, x, y, r * 0.55, g * 0.55, b * 0.55, 255);
          } else overPx(img, x, y, r, g, b, 255);
          if (v.glow) screenPx(img, x, y, r, g, b, 60);
        }
    }
  ),
  mk(
    "cornerOrnament",
    "\u30B3\u30FC\u30CA\u30FC\u88C5\u98FE",
    "CORNER ORNAMENT",
    "decor",
    "\u56DB\u9685\u306B\u98FE\u308A\u3092\u6253\u3064",
    "corner",
    [
      S2("style", "\u69D8\u5F0F", "flourish", [["flourish", "\u8526\u66F2\u7DDA"], ["plate", "\u91D1\u5177"], ["gem", "\u5B9D\u77F3"], ["spike", "\u68D8"]]),
      C2("color", "\u8272", "#f3d27a"),
      R2("size", "\u5927\u304D\u3055", 2, 12, 1, 5),
      R2("op", "\u4E0D\u900F\u660E\u5EA6", 0, 100, 1, 100)
    ],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), s = v.size | 0, a = v.op / 100 * 255;
      const corners = [[1, 1, 1, 1], [w - 2, 1, -1, 1], [1, h - 2, 1, -1], [w - 2, h - 2, -1, -1]];
      for (const [cx, cy, sx, sy] of corners) {
        if (v.style === "flourish") {
          for (let i = 0; i < s; i++) {
            overPx(img, cx + sx * i, cy, c.r, c.g, c.b, a * (1 - i / (s * 1.6)));
            overPx(img, cx, cy + sy * i, c.r, c.g, c.b, a * (1 - i / (s * 1.6)));
            overPx(img, cx + sx * i, cy + sy * Math.round(i * 0.45), c.r * 0.8, c.g * 0.8, c.b * 0.8, a * 0.7);
          }
          overPx(img, cx + sx, cy + sy, 255, 255, 255, a * 0.85);
        } else if (v.style === "plate") {
          for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
            if (x + y > s) continue;
            const k = 1 - (x + y) / (s * 2.6);
            overPx(img, cx + sx * x, cy + sy * y, clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), a);
          }
        } else if (v.style === "gem") {
          const r = Math.max(1, Math.round(s / 2));
          for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
            if (Math.abs(x) + Math.abs(y) > r) continue;
            const k = 1 - (x + y) / (r * 2.4);
            overPx(img, cx + sx * x, cy + sy * y, clamp(c.r * k * 1.1), clamp(c.g * k * 1.1), clamp(c.b * k * 1.1), a);
          }
          overPx(img, cx - sx, cy - sy, 255, 255, 255, a);
        } else {
          for (let i = 0; i < s; i++) {
            linePx(img, cx, cy, cx + sx * i, cy + sy * (s - i), c.r, c.g, c.b, a * (1 - i / (s * 1.5)));
          }
        }
      }
    }
  ),
  mk(
    "borderTrim",
    "\u7E01\u30C8\u30EA\u30E0",
    "METAL TRIM",
    "decor",
    "1px \u306E\u7E01\u53D6\u308A\u3092\u91D1\u5C5E\u8ABF\u306B",
    "trim",
    [C2("color", "\u8272", "#ffd97a"), R2("inset", "\u5185\u5074\u8DDD\u96E2", 0, 6, 1, 0), R2("thick", "\u592A\u3055", 1, 3, 1, 1), S2("pattern", "\u6A21\u69D8", "solid", [["solid", "\u5B9F\u7DDA"], ["dash", "\u7834\u7DDA"], ["dot", "\u70B9\u7DDA"], ["double", "\u4E8C\u91CD"]]), T2("shine", "\u30CF\u30A4\u30E9\u30A4\u30C8", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), ins = v.inset | 0, th = v.thick | 0;
      const m = maskOf(img);
      const on = (x, y) => m[y * w + x] > 0.2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!on(x, y)) continue;
          let d = -1;
          for (let r = 0; r <= ins + th + 2; r++) {
            const empty = !on(x + r, y) || !on(x - r, y) || !on(x, y + r) || !on(x, y - r);
            if (empty) {
              d = r;
              break;
            }
          }
          if (d < ins || d >= ins + th) continue;
          let draw = true;
          if (v.pattern === "dash") draw = (x + y >> 1) % 2 === 0;
          if (v.pattern === "dot") draw = (x + y) % 3 === 0;
          if (!draw) continue;
          const k = v.shine ? y < h / 2 && x < w / 2 ? 1.25 : x > w / 2 && y > h / 2 ? 0.72 : 1 : 1;
          overPx(img, x, y, clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255);
          if (v.pattern === "double" && d === ins + th - 1) overPx(img, x, y, clamp(c.r * 0.6), clamp(c.g * 0.6), clamp(c.b * 0.6), 255);
        }
    }
  ),
  mk(
    "gemInlay",
    "\u5B9D\u77F3\u30A4\u30F3\u30EC\u30A4",
    "GEM INLAY",
    "decor",
    "\u30D5\u30A1\u30BB\u30C3\u30C8\u4ED8\u304D\u5B9D\u77F3\u3092\u57CB\u3081\u8FBC\u3080",
    "gem",
    [C2("color", "\u8272", "#54e0c8"), R2("count", "\u500B\u6570", 1, 14, 1, 4), R2("size", "\u5927\u304D\u3055", 1, 6, 1, 3), T2("shine", "\u304D\u3089\u3081\u304D", true), R2("seed", "\u914D\u7F6E\u4E71\u6570", 0, 999, 1, 7)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), rnd = mulberry32(v.seed * 31 + 5);
      const solids = [];
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (getAlpha(img, x, y) > 200) solids.push([x, y]);
      if (!solids.length) return;
      for (let k = 0; k < v.count; k++) {
        const p = solids[Math.floor(rnd() * solids.length)];
        const r = Math.max(1, v.size | 0);
        for (let y = -r; y <= r; y++)
          for (let x = -r; x <= r; x++) {
            const dd = Math.abs(x) + Math.abs(y);
            if (dd > r + 0.4) continue;
            const light = 1 - (x + y) / (r * 2.2 + 1e-3);
            overPx(img, p[0] + x, p[1] + y, clamp(c.r * light * 1.15), clamp(c.g * light * 1.15), clamp(c.b * light * 1.15), 255);
          }
        overPx(img, p[0] - Math.round(r / 2), p[1] - Math.round(r / 2), 255, 255, 255, 210);
        if (v.shine) {
          const hl = rgbToHsl(c.r, c.g, c.b);
          const glowc = hslToRgb(hl.h, hl.s, 0.75);
          for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
            const dd = Math.hypot(x, y);
            if (dd > r + 1) continue;
            addPx(img, p[0] + x, p[1] + y, glowc.r, glowc.g, glowc.b, clamp01(1 - dd / (r + 1)) * 90);
          }
        }
      }
    }
  ),
  mk(
    "sparkle",
    "\u304D\u3089\u3081\u304D",
    "SPARKLE",
    "decor",
    "\u5341\u5B57\u306E\u661F\u578B\u30CF\u30A4\u30E9\u30A4\u30C8",
    "spark",
    [R2("count", "\u6570", 1, 40, 1, 10), R2("size", "\u30B5\u30A4\u30BA", 1, 6, 1, 2), C2("color", "\u8272", "#ffffff"), R2("speed", "\u70B9\u6EC5\u901F\u5EA6", 0, 4, 0.1, 1.2), R2("seed", "\u914D\u7F6E", 0, 999, 1, 21)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), s = Math.max(1, v.size | 0);
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(v.seed * 17 + k * 7919 + 3);
        const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
        if (getAlpha(img, x, y) < 40 && rnd() > 0.2) continue;
        const ph = rnd() * Math.PI * 2;
        const tw = 0.5 + 0.5 * Math.sin(ctx.t * v.speed * 2.4 + ph);
        const a = tw * 255;
        const len = Math.round(s * (0.5 + tw));
        for (let i = -len; i <= len; i++) {
          const fall = clamp01(1 - Math.abs(i) / (len + 0.6));
          addPx(img, x + i, y, c.r, c.g, c.b, a * fall * fall);
          addPx(img, x, y + i, c.r, c.g, c.b, a * fall * fall);
        }
        addPx(img, x, y, 255, 255, 255, a * 0.9);
        if (s >= 2) {
          addPx(img, x + 1, y + 1, c.r, c.g, c.b, a * 0.35);
          addPx(img, x - 1, y - 1, c.r, c.g, c.b, a * 0.35);
          addPx(img, x + 1, y - 1, c.r, c.g, c.b, a * 0.35);
          addPx(img, x - 1, y + 1, c.r, c.g, c.b, a * 0.35);
        }
      }
    },
    true
  ),
  mk(
    "ember",
    "\u708E\u306E\u7C92\u5B50",
    "EMBERS",
    "decor",
    "\u7ACB\u3061\u4E0A\u308B\u706B\u306E\u7C89",
    "fire",
    [R2("count", "\u6570", 4, 90, 1, 26), C2("color", "\u8272", "#ff9a3c"), C2("core", "\u6838\u8272", "#ffe9a8"), R2("speed", "\u4E0A\u6607\u901F\u5EA6", 0.2, 4, 0.1, 1.2), R2("size", "\u30B5\u30A4\u30BA", 1, 3, 1, 1), T2("glow", "\u767A\u5149", true), R2("seed", "\u914D\u7F6E", 0, 999, 1, 5)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), cc = hexToRgb(v.core), s = Math.max(1, v.size | 0);
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(v.seed * 33 + k * 6151 + 11);
        const x0 = rnd() * w, y0 = rnd() * h, sp = 0.5 + rnd(), sway = rnd() * Math.PI * 2;
        const y = ((y0 - ctx.t * v.speed * 9 * sp) % h + h) % h;
        const x = ((x0 + Math.sin(ctx.t * 1.6 * sp + sway) * 1.8) % w + w) % w;
        const life = 1 - y / h * 0.25;
        const a = clamp01(life * (0.55 + 0.45 * Math.sin(ctx.t * 6 + k))) * 255;
        const px = Math.round(x), py = Math.round(y);
        if (v.glow) addPx(img, px, py, c.r, c.g, c.b, a * 0.85);
        else overPx(img, px, py, c.r, c.g, c.b, a);
        if (s >= 2) {
          addPx(img, px + 1, py, c.r, c.g, c.b, a * 0.4);
          addPx(img, px - 1, py, c.r, c.g, c.b, a * 0.4);
          addPx(img, px, py + 1, c.r, c.g, c.b, a * 0.35);
        }
        if (s >= 3 || rnd() > 0.7) addPx(img, px, py, cc.r, cc.g, cc.b, a * 0.7);
      }
    },
    true
  ),
  mk(
    "snowfall",
    "\u96EA",
    "SNOWFALL",
    "decor",
    "\u964D\u308A\u7A4D\u3082\u308B\u96EA\u3068\u6C37\u306E\u7C92",
    "snow",
    [R2("count", "\u6570", 4, 90, 1, 24), R2("size", "\u30B5\u30A4\u30BA", 1, 3, 1, 1), R2("speed", "\u901F\u5EA6", 0.2, 3, 0.1, 0.9), T2("frost", "\u5730\u8868\u306B\u7A4D\u96EA", true), R2("seed", "\u914D\u7F6E", 0, 999, 1, 9)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, s = Math.max(1, v.size | 0);
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(v.seed * 71 + k * 4409 + 3);
        const x0 = rnd() * w, y0 = rnd() * h, sp = 0.4 + rnd() * 0.9;
        const y = ((y0 + ctx.t * v.speed * 11 * sp) % h + h) % h;
        const x = ((x0 + Math.sin(ctx.t * 1.1 * sp + k) * 2.2) % w + w) % w;
        const px = Math.round(x), py = Math.round(y);
        overPx(img, px, py, 255, 255, 255, 235);
        if (s >= 2) {
          overPx(img, px + 1, py, 240, 248, 255, 170);
          overPx(img, px, py + 1, 240, 248, 255, 170);
        }
        if (s >= 3) {
          overPx(img, px - 1, py, 230, 240, 255, 120);
          overPx(img, px, py - 1, 230, 240, 255, 120);
        }
      }
      if (v.frost) {
        const m = maskOf(img);
        for (let x = 0; x < w; x++) {
          let top = -1;
          for (let y = 0; y < h; y++) if (m[y * w + x] > 0.3) {
            top = y;
            break;
          }
          if (top < 0) continue;
          const depth = 1 + Math.round(fbm(x * 0.35, v.seed * 0.1, 7, 3) * 2.4);
          for (let d = 0; d < depth; d++) {
            const y = top + d;
            if (y >= h || m[y * w + x] < 0.3) continue;
            const k = 1 - d / (depth + 1);
            overPx(img, x, y, 244, 250, 255, 200 * k);
          }
        }
      }
    },
    true
  ),
  mk(
    "rain",
    "\u96E8",
    "RAIN",
    "decor",
    "\u659C\u3081\u306B\u6D41\u308C\u308B\u96E8\u7C92",
    "rain",
    [R2("count", "\u6570", 6, 90, 1, 28), R2("speed", "\u901F\u5EA6", 0.5, 6, 0.1, 2.4), R2("len", "\u9577\u3055", 1, 6, 1, 3), C2("color", "\u8272", "#bfe4ff"), R2("angle", "\u50BE\u304D", -45, 45, 1, 14), R2("seed", "\u914D\u7F6E", 0, 999, 1, 3)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), a = v.angle * Math.PI / 180;
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(v.seed * 19 + k * 3571 + 7);
        const x0 = rnd() * w, y0 = rnd() * h, sp = 0.6 + rnd() * 0.8;
        const y = ((y0 + ctx.t * v.speed * 22 * sp) % (h + 8) + h + 8) % (h + 8) - 4;
        const x = ((x0 + y * Math.tan(a)) % w + w) % w;
        const L = v.len | 0;
        for (let i = 0; i < L; i++) {
          const fall = 1 - i / L;
          addPx(img, Math.round(x - Math.sin(a) * i), Math.round(y - i), c.r, c.g, c.b, 190 * fall * fall);
        }
      }
    },
    true
  ),
  mk(
    "starfield",
    "\u661F\u5C51",
    "STARFIELD",
    "decor",
    "\u77AC\u304F\u661F\u306E\u6D77",
    "star",
    [R2("count", "\u6570", 4, 80, 1, 22), R2("speed", "\u77AC\u304D", 0, 4, 0.1, 1), C2("c1", "\u82721", "#ffffff"), C2("c2", "\u82722", "#8fd0ff"), R2("seed", "\u914D\u7F6E", 0, 999, 1, 44)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, a = hexToRgb(v.c1), b = hexToRgb(v.c2);
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(v.seed * 13 + k * 8191 + 1);
        const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
        const tw = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(ctx.t * v.speed * 1.7 + rnd() * 6.28)), 1.6);
        const col = rnd() > 0.5 ? a : b;
        addPx(img, x, y, col.r, col.g, col.b, tw * 255);
        if (rnd() > 0.72) {
          addPx(img, x + 1, y, col.r, col.g, col.b, tw * 90);
          addPx(img, x - 1, y, col.r, col.g, col.b, tw * 90);
          addPx(img, x, y + 1, col.r, col.g, col.b, tw * 90);
          addPx(img, x, y - 1, col.r, col.g, col.b, tw * 90);
        }
      }
    },
    true
  ),
  mk(
    "runes",
    "\u53E4\u4EE3\u30EB\u30FC\u30F3",
    "ARCANE RUNES",
    "decor",
    "\u767A\u5149\u3059\u308B\u9B54\u6CD5\u6587\u5B57\u3092\u523B\u3080",
    "rune",
    [C2("color", "\u8272", "#63d8ff"), R2("count", "\u6570", 1, 10, 1, 3), R2("scale", "\u62E1\u5927", 1, 3, 1, 1), R2("glow", "\u767A\u5149", 0, 100, 1, 60), R2("speed", "\u660E\u6EC5", 0, 3, 0.1, 0.8), R2("seed", "\u914D\u7F6E", 0, 999, 1, 12)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), sc = Math.max(1, v.scale | 0);
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(v.seed * 29 + k * 104729 + 3);
        const g = GLYPHS[Math.floor(rnd() * GLYPHS.length)];
        const gx = Math.floor(rnd() * (w - 5 * sc)), gy = Math.floor(rnd() * (h - 7 * sc));
        const pulse = 0.55 + 0.45 * Math.sin(ctx.t * v.speed * 2.6 + rnd() * 6.28);
        for (let y = 0; y < 7; y++)
          for (let x = 0; x < 5; x++) {
            if (g[y][x] !== "1") continue;
            const px = gx + x * sc, py = gy + y * sc;
            for (let sy = 0; sy < sc; sy++) for (let sx = 0; sx < sc; sx++) {
              screenPx(img, px + sx, py + sy, c.r, c.g, c.b, 200 * pulse);
              overPx(img, px + sx, py + sy, clamp(c.r * 0.7 + 80 * pulse), clamp(c.g * 0.7 + 80 * pulse), clamp(c.b * 0.7 + 80 * pulse), 200 * pulse);
            }
            if (v.glow > 0) {
              const gr = Math.round(sc * 1.6 * (v.glow / 100));
              for (let oy = -gr; oy <= gr; oy++) for (let ox = -gr; ox <= gr; ox++) {
                const d = Math.hypot(ox, oy);
                if (d > gr) continue;
                addPx(img, px + ox, py + oy, c.r, c.g, c.b, clamp01(1 - d / (gr + 0.4)) * v.glow * 0.9 * pulse);
              }
            }
          }
      }
    },
    true
  ),
  mk(
    "sigil",
    "\u9B54\u6CD5\u9663",
    "ARCANE SIGIL",
    "decor",
    "\u56DE\u8EE2\u3059\u308B\u9B54\u6CD5\u9663\u30EA\u30F3\u30B0",
    "sigil",
    [C2("color", "\u8272", "#c79bff"), R2("rings", "\u8F2A\u6570", 1, 4, 1, 2), R2("speed", "\u56DE\u8EE2", 0, 3, 0.1, 0.6), R2("glow", "\u767A\u5149", 0, 100, 1, 45), R2("ticks", "\u76EE\u76DB\u308A", 0, 24, 1, 8)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), cx = (w - 1) / 2, cy = (h - 1) / 2;
      const maxR = Math.min(w, h) / 2 - 1;
      for (let r = 0; r < v.rings; r++) {
        const rad = maxR * (0.45 + r * 0.28);
        if (rad < 2) continue;
        const rot = ctx.t * v.speed * (r % 2 === 0 ? 1 : -1) + r;
        ringPx(img, cx, cy, rad, c.r, c.g, c.b, 190, true);
        if (rad > 3) ringPx(img, cx, cy, rad - 1, c.r, c.g, c.b, 70, true);
        for (let k = 0; k < v.ticks; k++) {
          const ang = rot + k / v.ticks * Math.PI * 2;
          const x0 = cx + Math.cos(ang) * (rad - 1.6), y0 = cy + Math.sin(ang) * (rad - 1.6);
          const x1 = cx + Math.cos(ang) * (rad + 1.6), y1 = cy + Math.sin(ang) * (rad + 1.6);
          linePx(img, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), c.r, c.g, c.b, 210, 1, true);
        }
      }
      if (v.glow > 0) {
        const pulse = 0.6 + 0.4 * Math.sin(ctx.t * 2.1);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const d = Math.hypot(x - cx, y - cy);
          const band = Math.max(0, 1 - Math.abs(d - maxR * 0.45) / 3);
          if (band > 0) addPx(img, x, y, c.r, c.g, c.b, band * v.glow * 1.4 * pulse);
        }
      }
    },
    true
  ),
  mk(
    "rivets",
    "\u92F2 / \u30EA\u30D9\u30C3\u30C8",
    "RIVETS",
    "decor",
    "\u91D1\u5C5E\u677F\u306E\u6253\u3061\u4ED8\u3051\u92F2",
    "rivet",
    [C2("color", "\u8272", "#c9d3de"), R2("spacing", "\u9593\u9694", 3, 14, 1, 6), R2("size", "\u30B5\u30A4\u30BA", 1, 3, 1, 1), R2("inset", "\u7AEF\u304B\u3089\u306E\u8DDD\u96E2", 0, 6, 1, 1), T2("shade", "\u9670\u5F71", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), sp = Math.max(3, v.spacing | 0), s = v.size | 0;
      const m = maskOf(img);
      const place = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h || m[y * w + x] < 0.3) return;
        discPx(img, x, y, s + 0.2, clamp(c.r * 0.55), clamp(c.g * 0.55), clamp(c.b * 0.55), 255);
        discPx(img, x, y, s * 0.72, c.r, c.g, c.b, 255);
        if (v.shade) {
          overPx(img, x - (s > 1 ? 1 : 0), y - (s > 1 ? 1 : 0), 255, 255, 255, 150);
          overPx(img, x + (s > 1 ? 1 : 0), y + (s > 1 ? 1 : 0), clamp(c.r * 0.4), clamp(c.g * 0.4), clamp(c.b * 0.4), 140);
        }
      };
      for (let x = v.inset; x < w - v.inset; x += sp) {
        place(x, v.inset);
        place(x, h - 1 - v.inset);
      }
      for (let y = v.inset + sp; y < h - v.inset - sp + 1; y += sp) {
        place(v.inset, y);
        place(w - 1 - v.inset, y);
      }
    }
  ),
  mk(
    "circuit",
    "\u56DE\u8DEF\u6A21\u69D8",
    "CIRCUITRY",
    "decor",
    "\u6A5F\u68B0\u7684\u306A\u914D\u7DDA\u30D1\u30BF\u30FC\u30F3",
    "circuit",
    [C2("color", "\u8272", "#43f0c0"), R2("density", "\u5BC6\u5EA6", 2, 16, 1, 7), R2("glow", "\u767A\u5149", 0, 100, 1, 55), R2("speed", "\u30D1\u30EB\u30B9", 0, 3, 0.1, 1), R2("seed", "\u914D\u7F6E", 0, 999, 1, 8)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), rnd = mulberry32(v.seed * 977 + 31), m = maskOf(img);
      const lines = Math.max(1, Math.round(w * h / (v.density * v.density * 12)));
      for (let k = 0; k < lines; k++) {
        let x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
        const len = 3 + Math.floor(rnd() * Math.max(3, w / 2));
        let dir = Math.floor(rnd() * 4);
        const pulse = 0.5 + 0.5 * Math.sin(ctx.t * v.speed * 2.4 - k * 0.6);
        for (let i = 0; i < len; i++) {
          if (m[y * w + x] > 0.25) {
            screenPx(img, x, y, c.r, c.g, c.b, 150 * (0.4 + pulse * 0.6));
            if (v.glow) addPx(img, x, y, c.r, c.g, c.b, v.glow * 0.5 * pulse);
          }
          if (rnd() > 0.72) dir = (dir + (rnd() > 0.5 ? 1 : 3)) % 4;
          x += dir === 0 ? 1 : dir === 1 ? -1 : 0;
          y += dir === 2 ? 1 : dir === 3 ? -1 : 0;
          if (x < 0 || y < 0 || x >= w || y >= h) break;
        }
        if (x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] > 0.25) {
          discPx(img, x, y, 1.1, c.r, c.g, c.b, 235, true);
          if (v.glow) addPx(img, x, y, 255, 255, 255, 60 * pulse);
        }
      }
    },
    true
  ),
  mk(
    "hexPattern",
    "\u516D\u89D2\u30B0\u30EA\u30C3\u30C9",
    "HEX GRID",
    "decor",
    "\u30CF\u30CB\u30AB\u30E0\u6A21\u69D8\u306E\u91CD\u306D\u713C\u304D",
    "hex",
    [C2("color", "\u8272", "#8be9ff"), R2("size", "\u30BB\u30EB", 3, 14, 1, 6), R2("op", "\u6FC3\u3055", 0, 100, 1, 30), T2("fill", "\u5857\u308A\u3064\u3076\u3057", false)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), s = Math.max(3, v.size | 0), a = v.op / 100 * 255;
      const hh = s * Math.sqrt(3) / 2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (img.data[y * w + x << 2 | 3] === 0) continue;
          const col = Math.round(x / (s * 1.5));
          const rowOff = col % 2 * hh;
          const row = Math.round((y - rowOff) / hh);
          const cx = col * s * 1.5, cy = row * hh + rowOff;
          const dx = Math.abs(x - cx) / s, dy = Math.abs(y - cy) / hh;
          const inside = dx <= 1 && dx + dy * 0.577 <= 1.16;
          const edge = inside && (dx > 0.82 || dx + dy * 0.577 > 1);
          if (edge || v.fill && inside) {
            const k = edge ? 1 : 0.45;
            screenPx(img, x, y, c.r, c.g, c.b, a * k);
          }
        }
    }
  )
];
var MATERIAL_FX = [
  mk(
    "cracks",
    "\u3072\u3073\u5272\u308C",
    "CRACKS",
    "material",
    "\u8868\u9762\u306B\u8D70\u308B\u4E80\u88C2",
    "crack",
    [R2("count", "\u672C\u6570", 1, 14, 1, 4), C2("color", "\u8272", "#1b1410"), R2("width", "\u592A\u3055", 1, 2, 1, 1), R2("depth", "\u9577\u3055", 4, 40, 1, 18), T2("highlight", "\u7E01\u3092\u660E\u308B\u304F", true), R2("seed", "\u914D\u7F6E", 0, 999, 1, 17)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), rnd = mulberry32(v.seed * 613 + 7), m = maskOf(img);
      for (let k = 0; k < v.count; k++) {
        let x = 1 + Math.floor(rnd() * (w - 2)), y = 1 + Math.floor(rnd() * (h - 2));
        let ang = rnd() * Math.PI * 2;
        const steps = Math.round(v.depth * (0.6 + rnd() * 0.8));
        for (let i = 0; i < steps; i++) {
          ang += (rnd() - 0.5) * 1.25;
          x += Math.round(Math.cos(ang));
          y += Math.round(Math.sin(ang));
          if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) break;
          if (m[y * w + x] < 0.25) {
            ang += 1.4;
            continue;
          }
          overPx(img, x, y, c.r, c.g, c.b, 235);
          if (v.width >= 2) overPx(img, x + (rnd() > 0.5 ? 1 : 0), y, c.r, c.g, c.b, 200);
          if (v.highlight) {
            overPx(img, x, y + 1, clamp(c.r + 70), clamp(c.g + 66), clamp(c.b + 60), 90);
            overPx(img, x + 1, y, clamp(c.r + 60), clamp(c.g + 58), clamp(c.b + 52), 70);
          }
          if (rnd() > 0.86) ang += (rnd() > 0.5 ? 1 : -1) * 0.9;
        }
      }
    }
  ),
  mk(
    "moss",
    "\u82D4\u3080\u3059",
    "MOSS OVERGROWTH",
    "material",
    "\u6E7F\u3063\u305F\u82D4\u304C\u5E83\u304C\u308B",
    "moss",
    [R2("coverage", "\u8986\u76D6\u7387", 0, 100, 1, 42), C2("c1", "\u660E\u308B\u3044\u82D4", "#7fbf3f"), C2("c2", "\u6697\u3044\u82D4", "#33521d"), R2("scale", "\u7C92\u5EA6", 2, 16, 1, 7), T2("topOnly", "\u4E0A\u9762\u306E\u307F", true), R2("seed", "\u4E71\u6570", 0, 999, 1, 4)],
    (img, v) => {
      const w = img.width, h = img.height, a = hexToRgb(v.c1), b = hexToRgb(v.c2), m = maskOf(img), sc = v.scale;
      const cov = v.coverage / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (m[y * w + x] < 0.25) continue;
          let n = fbm(x / sc, y / sc, v.seed * 13, 4);
          if (v.topOnly) n *= clamp01(1 - y / (h * 0.85)) * 1.35;
          if (n < 1 - cov) continue;
          const t = clamp01((n - (1 - cov)) / Math.max(1e-3, cov));
          const speck = hash2(x, y, v.seed) > 0.72 ? 1.18 : 0.88;
          overPx(
            img,
            x,
            y,
            clamp(lerp(b.r, a.r, t) * speck),
            clamp(lerp(b.g, a.g, t) * speck),
            clamp(lerp(b.b, a.b, t) * speck),
            clamp(120 + t * 135)
          );
        }
    }
  ),
  mk(
    "grime",
    "\u6C5A\u308C / \u30B0\u30E9\u30A4\u30E0",
    "GRIME",
    "material",
    "\u67D3\u307F\u8FBC\u3093\u3060\u6C5A\u308C\u3068\u7164",
    "grime",
    [R2("amount", "\u91CF", 0, 100, 1, 40), C2("color", "\u8272", "#2a2016"), R2("scale", "\u7C92\u5EA6", 2, 20, 1, 8), T2("edges", "\u7E01\u306B\u6E9C\u3081\u308B", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.amount / 100;
      const m = maskOf(img);
      const edgeDist = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (m[y * w + x] < 0.2) {
          edgeDist[y * w + x] = 0;
          continue;
        }
        let d = 99;
        for (let r = 1; r <= 3; r++) {
          if (m[clamp(y - r, 0, h - 1) * w + x] < 0.2 || m[clamp(y + r, 0, h - 1) * w + x] < 0.2 || m[y * w + clamp(x - r, 0, w - 1)] < 0.2 || m[y * w + clamp(x + r, 0, w - 1)] < 0.2) {
            d = r;
            break;
          }
        }
        edgeDist[y * w + x] = d;
      }
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          let n = warpNoise(x / v.scale, y / v.scale, 91, 0.8);
          if (v.edges) n = clamp01(n * (edgeDist[y * w + x] < 2 ? 1.5 : 0.85));
          const amt = clamp01((n - (1 - k)) / Math.max(1e-3, k)) * 0.85;
          if (amt <= 0) continue;
          img.data[i] = clamp(img.data[i] * (1 - amt) + c.r * amt);
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - amt) + c.g * amt);
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - amt) + c.b * amt);
        }
    }
  ),
  mk(
    "scratches",
    "\u50B7",
    "SCRATCHES",
    "material",
    "\u4F7F\u3044\u8FBC\u307E\u308C\u305F\u64E6\u308A\u50B7",
    "scratch",
    [R2("count", "\u672C\u6570", 1, 40, 1, 12), R2("length", "\u9577\u3055", 2, 20, 1, 7), R2("op", "\u6FC3\u3055", 0, 100, 1, 45), T2("light", "\u660E\u308B\u3044\u50B7", true), R2("seed", "\u4E71\u6570", 0, 999, 1, 23)],
    (img, v) => {
      const w = img.width, h = img.height, rnd = mulberry32(v.seed * 787 + 3), m = maskOf(img), k = v.op / 100;
      for (let n = 0; n < v.count; n++) {
        const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
        const ang = rnd() * Math.PI * 2;
        const len = 2 + rnd() * v.length;
        for (let i = 0; i < len; i++) {
          const px = Math.round(x + Math.cos(ang) * i), py = Math.round(y + Math.sin(ang) * i);
          if (px < 0 || py < 0 || px >= w || py >= h || m[py * w + px] < 0.25) continue;
          const fall = 1 - Math.abs(i - len / 2) / (len / 2 + 0.4);
          const i2 = py * w + px << 2;
          if (v.light) {
            img.data[i2] = clamp(img.data[i2] + 90 * k * fall);
            img.data[i2 + 1] = clamp(img.data[i2 + 1] + 88 * k * fall);
            img.data[i2 + 2] = clamp(img.data[i2 + 2] + 82 * k * fall);
          } else {
            img.data[i2] = clamp(img.data[i2] * (1 - 0.55 * k * fall));
            img.data[i2 + 1] = clamp(img.data[i2 + 1] * (1 - 0.55 * k * fall));
            img.data[i2 + 2] = clamp(img.data[i2 + 2] * (1 - 0.55 * k * fall));
          }
        }
      }
    }
  ),
  mk(
    "rust",
    "\u9306",
    "RUST",
    "material",
    "\u6D6E\u304D\u4E0A\u304C\u3063\u305F\u9178\u5316\u9244",
    "rust",
    [R2("amount", "\u91CF", 0, 100, 1, 45), C2("c1", "\u8D64\u9306", "#8a4a22"), C2("c2", "\u9EC4\u9306", "#c98f3c"), R2("scale", "\u7C92\u5EA6", 2, 14, 1, 6), T2("pits", "\u8150\u98DF\u7A74", true)],
    (img, v) => {
      const w = img.width, h = img.height, a = hexToRgb(v.c1), b = hexToRgb(v.c2), k = v.amount / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const n = fbm(x / v.scale, y / v.scale, 33, 5);
          const n2 = fbm(x / (v.scale * 0.4), y / (v.scale * 0.4), 71, 3);
          const amt = clamp01((n - (1 - k * 1.1)) / 0.55) * clamp01(0.4 + n2);
          if (amt <= 0) continue;
          const t = n2;
          const r = lerp(a.r, b.r, t), g = lerp(a.g, b.g, t), bl = lerp(a.b, b.b, t);
          img.data[i] = clamp(img.data[i] * (1 - amt * 0.85) + r * amt * 0.85);
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - amt * 0.9) + g * amt * 0.9);
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - amt * 0.95) + bl * amt * 0.95);
          if (v.pits && n2 > 0.78 && amt > 0.5) {
            img.data[i] *= 0.5;
            img.data[i + 1] *= 0.5;
            img.data[i + 2] *= 0.5;
          }
        }
    }
  ),
  mk(
    "frost",
    "\u971C / \u6C37\u7D50",
    "FROST",
    "material",
    "\u51CD\u308A\u3064\u3044\u305F\u7D50\u6676\u306E\u819C",
    "frost",
    [R2("amount", "\u91CF", 0, 100, 1, 55), C2("color", "\u8272", "#cfeeff"), R2("crystal", "\u7D50\u6676", 0, 100, 1, 45), R2("edge", "\u7E01\u306E\u5F37\u8ABF", 0, 100, 1, 60), T2("cool", "\u5BD2\u8272\u5316", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.amount / 100, m = maskOf(img);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const n = fbm(x / 3.2, y / 3.2, 5150, 5);
          const n2 = valueNoise(x * 0.9, y * 0.9, 77);
          let amt = clamp01((n - (1 - k)) / Math.max(0.02, k)) * 0.8;
          let near = 9;
          for (let r = 1; r <= 4; r++) {
            if (!m[clamp(y - r, 0, h - 1) * w + x] || !m[clamp(y + r, 0, h - 1) * w + x] || !m[y * w + clamp(x - r, 0, w - 1)] || !m[y * w + clamp(x + r, 0, w - 1)]) {
              near = r;
              break;
            }
          }
          if (near <= 4) amt += v.edge / 100 * (1 - near / 5) * 0.7;
          amt = clamp01(amt);
          if (v.cool) {
            img.data[i] = clamp(img.data[i] * (1 - amt * 0.16));
            img.data[i + 1] = clamp(img.data[i + 1] * (1 - amt * 0.04));
            img.data[i + 2] = clamp(img.data[i + 2] * (1 + amt * 0.2));
          }
          img.data[i] = clamp(img.data[i] + (c.r - img.data[i]) * amt * 0.75);
          img.data[i + 1] = clamp(img.data[i + 1] + (c.g - img.data[i + 1]) * amt * 0.75);
          img.data[i + 2] = clamp(img.data[i + 2] + (c.b - img.data[i + 2]) * amt * 0.75);
          if (v.crystal > 0 && n2 > 0.82 && amt > 0.2) screenPx(img, x, y, 255, 255, 255, v.crystal * 1.7);
        }
    }
  ),
  mk(
    "lavaCracks",
    "\u6EB6\u5CA9\u306E\u4E80\u88C2",
    "MAGMA VEINS",
    "material",
    "\u8108\u52D5\u3059\u308B\u707C\u71B1\u306E\u7B4B",
    "lava",
    [R2("count", "\u672C\u6570", 1, 12, 1, 5), C2("core", "\u6838\u8272", "#ffe27a"), C2("outer", "\u5916\u5074\u8272", "#e2431a"), R2("glow", "\u767A\u5149", 0, 100, 1, 70), R2("speed", "\u8108\u52D5", 0, 3, 0.1, 1), R2("seed", "\u4E71\u6570", 0, 999, 1, 6)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, core = hexToRgb(v.core), out = hexToRgb(v.outer), rnd = mulberry32(v.seed * 149 + 3), m = maskOf(img);
      const pulse = 0.62 + 0.38 * Math.sin(ctx.t * v.speed * 2.2);
      for (let k = 0; k < v.count; k++) {
        let x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
        let ang = rnd() * Math.PI * 2;
        const steps = 8 + Math.floor(rnd() * w);
        for (let i = 0; i < steps; i++) {
          ang += (rnd() - 0.5) * 1.1;
          x += Math.round(Math.cos(ang));
          y += Math.round(Math.sin(ang));
          if (x < 0 || y < 0 || x >= w || y >= h) break;
          if (m[y * w + x] < 0.25) continue;
          overPx(img, x, y, out.r, out.g, out.b, 255 * (0.7 + pulse * 0.3));
          addPx(img, x, y, core.r, core.g, core.b, 190 * pulse);
          for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
            if (!ox && !oy) continue;
            addPx(img, x + ox, y + oy, out.r, out.g, out.b, v.glow * 0.55 * pulse);
          }
          if (v.glow > 40) addPx(img, x, y, core.r, core.g, core.b, (v.glow - 40) * 0.6 * pulse);
        }
      }
    },
    true
  ),
  mk(
    "vines",
    "\u3064\u308B\u690D\u7269",
    "VINES",
    "material",
    "\u7D61\u307F\u3064\u304F\u8526\u3068\u8449",
    "vine",
    [R2("count", "\u672C\u6570", 1, 10, 1, 3), C2("stem", "\u830E", "#4b7a2c"), C2("leaf", "\u8449", "#79c143"), R2("leafSize", "\u8449\u306E\u5927\u304D\u3055", 1, 3, 1, 1), R2("seed", "\u4E71\u6570", 0, 999, 1, 11)],
    (img, v) => {
      const w = img.width, h = img.height, st = hexToRgb(v.stem), lf = hexToRgb(v.leaf), rnd = mulberry32(v.seed * 311 + 5);
      for (let k = 0; k < v.count; k++) {
        let x = Math.floor(rnd() * w), y = 0;
        const sway = 0.6 + rnd();
        for (; y < h; y++) {
          x = clamp(Math.round(x + Math.sin(y * 0.5 * sway + k) * 0.9), 0, w - 1);
          overPx(img, x, y, st.r, st.g, st.b, 240);
          if (rnd() > 0.66) {
            const dir = rnd() > 0.5 ? 1 : -1;
            const ls = v.leafSize | 0;
            for (let a = 1; a <= ls + 1; a++) {
              overPx(img, x + dir * a, y, lf.r, lf.g, lf.b, 235);
              overPx(img, x + dir * a, y - 1, clamp(lf.r * 1.15), clamp(lf.g * 1.15), clamp(lf.b * 1.1), 200);
            }
          }
        }
      }
    }
  ),
  mk(
    "erosion",
    "\u4FB5\u98DF / \u6469\u8017",
    "EROSION",
    "material",
    "\u30CE\u30A4\u30BA\u3067\u7E01\u3092\u524A\u308A\u53D6\u308B",
    "erode",
    [R2("amount", "\u91CF", 0, 100, 1, 35), R2("scale", "\u7C92\u5EA6", 1, 12, 1, 4), S2("mode", "\u65B9\u5F0F", "erode", [["erode", "\u524A\u308B"], ["dilate", "\u81A8\u3089\u307E\u305B\u308B"], ["tatter", "\u307C\u308D\u307C\u308D"]]), R2("seed", "\u4E71\u6570", 0, 999, 1, 8)],
    (img, v) => {
      const w = img.width, h = img.height, src = clone(img), k = v.amount / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          const n = v.mode === "tatter" ? fbm(x / v.scale, y / v.scale, v.seed * 17, 5) : valueNoise(x / v.scale, y / v.scale, v.seed * 17);
          let edge = 0;
          for (let r = 1; r <= 3; r++) {
            if (!getAlpha(src, x + r, y) || !getAlpha(src, x - r, y) || !getAlpha(src, x, y + r) || !getAlpha(src, x, y - r)) {
              edge = 1 - r / 4;
              break;
            }
          }
          const th = v.mode === "dilate" ? 1 - k : k;
          if (v.mode === "dilate") {
            if (src.data[i + 3] === 0 && edge > 0 && n > th) {
              const near = [4, -4, w * 4, -w * 4].map((o) => i + o).filter((j) => j >= 0 && j < src.data.length);
              let r = 0, g = 0, b = 0, c = 0;
              for (const j of near) if (src.data[j + 3] > 0) {
                r += src.data[j];
                g += src.data[j + 1];
                b += src.data[j + 2];
                c++;
              }
              if (c) {
                img.data[i] = r / c;
                img.data[i + 1] = g / c;
                img.data[i + 2] = b / c;
                img.data[i + 3] = 255 * (n - th) * 2;
              }
            }
            continue;
          }
          if (src.data[i + 3] === 0) continue;
          const erodeAmt = v.mode === "tatter" ? clamp01(n * edge * 2 * k) : clamp01(edge * k * (0.35 + n));
          if (erodeAmt > 0.55) {
            img.data[i + 3] = 0;
            continue;
          }
          img.data[i] = clamp(img.data[i] * (1 - erodeAmt * 0.35));
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - erodeAmt * 0.35));
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - erodeAmt * 0.35));
          img.data[i + 3] = clamp(src.data[i + 3] * (1 - erodeAmt * 0.8));
        }
    }
  ),
  mk(
    "brushedMetal",
    "\u30D8\u30A2\u30FC\u30E9\u30A4\u30F3",
    "BRUSHED METAL",
    "material",
    "\u91D1\u5C5E\u306E\u5F15\u304D\u76EE\u8CEA\u611F",
    "metal",
    [R2("amount", "\u91CF", 0, 100, 1, 45), S2("dir", "\u65B9\u5411", "h", [["h", "\u6A2A"], ["v", "\u7E26"]]), R2("freq", "\u7D30\u304B\u3055", 1, 8, 1, 2), T2("specular", "\u5149\u6CA2\u5E2F", true)],
    (img, v) => {
      const w = img.width, h = img.height, k = v.amount / 100, rnd = mulberry32(9182);
      const rows = v.dir === "h" ? h : w;
      const line = [];
      for (let i = 0; i < rows; i++) line.push((rnd() - 0.5) * 2);
      for (let i = 0; i < rows; i++) line[i] = line[i] * 0.6 + (line[Math.max(0, i - 1)] + line[Math.min(rows - 1, i + 1)]) * 0.2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const idx = v.dir === "h" ? y : x;
          let n = line[idx] * 42 * k;
          n += (valueNoise(v.dir === "h" ? x / v.freq : y / v.freq, idx * 3.1, 44) - 0.5) * 30 * k;
          if (v.specular) {
            const pos = (v.dir === "h" ? x : y) / (v.dir === "h" ? w : h);
            n += Math.exp(-Math.pow((pos - 0.34) / 0.16, 2)) * 46 * k;
          }
          img.data[i] = clamp(img.data[i] + n);
          img.data[i + 1] = clamp(img.data[i + 1] + n);
          img.data[i + 2] = clamp(img.data[i + 2] + n * 1.03);
        }
    }
  ),
  mk(
    "wetLook",
    "\u30A6\u30A7\u30C3\u30C8\u4ED5\u4E0A\u3052",
    "WET LOOK",
    "material",
    "\u6FE1\u308C\u305F\u5149\u6CA2\u3068\u6DF1\u3044\u9670\u5F71",
    "wet",
    [R2("amount", "\u91CF", 0, 100, 1, 55), R2("spec", "\u30CF\u30A4\u30E9\u30A4\u30C8", 0, 100, 1, 60), T2("dark", "\u6697\u90E8\u3092\u7DE0\u3081\u308B", true)],
    (img, v) => {
      const w = img.width, h = img.height, k = v.amount / 100;
      const src = clone(img);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (src.data[i + 3] === 0) continue;
          if (v.dark) {
            img.data[i] = clamp(src.data[i] * (1 - k * 0.3));
            img.data[i + 1] = clamp(src.data[i + 1] * (1 - k * 0.3));
            img.data[i + 2] = clamp(src.data[i + 2] * (1 - k * 0.28));
          }
          const n = fbm(x / 4.5, y / 4.5, 1234, 4);
          const sat = 1 + k * 0.4;
          const ll = luminance(img.data[i], img.data[i + 1], img.data[i + 2]);
          img.data[i] = clamp(ll + (img.data[i] - ll) * sat);
          img.data[i + 1] = clamp(ll + (img.data[i + 1] - ll) * sat);
          img.data[i + 2] = clamp(ll + (img.data[i + 2] - ll) * sat);
          if (n > 0.66) screenPx(img, x, y, 255, 255, 255, (n - 0.66) * 3 * v.spec * 2.2 * k);
        }
    }
  ),
  mk(
    "speckle",
    "\u77F3\u76EE / \u6591\u70B9",
    "SPECKLE",
    "material",
    "\u9271\u7269\u7684\u306A\u7D30\u304B\u306A\u6591\u70B9",
    "speckle",
    [R2("amount", "\u91CF", 0, 100, 1, 40), R2("size", "\u7C92", 1, 3, 1, 1), R2("contrast", "\u6FC3\u6DE1", 0, 100, 1, 55), T2("colored", "\u8272\u3092\u4ED8\u3051\u308B", false), R2("seed", "\u4E71\u6570", 0, 999, 1, 2)],
    (img, v) => {
      const w = img.width, h = img.height, k = v.contrast / 100 * 120, cell = Math.max(1, v.size | 0), rnd = mulberry32(v.seed * 577 + 1);
      const cw = Math.ceil(w / cell), chh = Math.ceil(h / cell);
      const n = new Float32Array(cw * chh);
      for (let i = 0; i < n.length; i++) n[i] = rnd() - 0.5;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          if (rnd() > 0.3 + v.amount / 100 * 0.7) continue;
          const val = n[Math.floor(y / cell) * cw + Math.floor(x / cell)] * k * (0.4 + v.amount / 100);
          if (v.colored) {
            const hh = rgbToHsl(img.data[i], img.data[i + 1], img.data[i + 2]);
            const c = hslToRgb(hh.h + (rnd() - 0.5) * 0.06 * (v.amount / 100), clamp01(hh.s + 0.05), clamp01(hh.l + val / 255));
            img.data[i] = c.r;
            img.data[i + 1] = c.g;
            img.data[i + 2] = c.b;
          } else {
            img.data[i] = clamp(img.data[i] + val);
            img.data[i + 1] = clamp(img.data[i + 1] + val);
            img.data[i + 2] = clamp(img.data[i + 2] + val);
          }
        }
    }
  )
];
var RARITIES = {
  common: { l: "\u30B3\u30E2\u30F3 (\u767D)", c: "#d7dde6" },
  uncommon: { l: "\u30A2\u30F3\u30B3\u30E2\u30F3 (\u7DD1)", c: "#5ce35c" },
  rare: { l: "\u30EC\u30A2 (\u9752)", c: "#4a9dff" },
  epic: { l: "\u30A8\u30D4\u30C3\u30AF (\u7D2B)", c: "#b45cff" },
  legendary: { l: "\u30EC\u30B8\u30A7\u30F3\u30C0\u30EA\u30FC (\u6A59)", c: "#ff9f2e" },
  mythic: { l: "\u30DF\u30B7\u30C3\u30AF (\u7D05)", c: "#ff4d6d" },
  divine: { l: "\u30C7\u30A3\u30D0\u30A4\u30F3 (\u91D1)", c: "#ffe066" }
};
var SPECIAL_FX = [
  mk(
    "bloom",
    "\u30D6\u30EB\u30FC\u30E0",
    "BLOOM",
    "special",
    "\u660E\u308B\u3044\u90E8\u5206\u3092\u6EF2\u307E\u305B\u3066\u767A\u5149",
    "bloom",
    [R2("threshold", "\u3057\u304D\u3044\u5024", 0, 255, 1, 170), R2("radius", "\u5E83\u304C\u308A", 1, 8, 1, 3), R2("intensity", "\u5F37\u3055", 0, 200, 1, 80)],
    (img, v) => {
      const w = img.width, h = img.height;
      const bright = new ImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const l = luminance(img.data[i], img.data[i + 1], img.data[i + 2]);
        if (l > v.threshold && img.data[i + 3] > 10) {
          const k = clamp01((l - v.threshold) / Math.max(1, 255 - v.threshold));
          bright.data[i] = img.data[i] * k;
          bright.data[i + 1] = img.data[i + 1] * k;
          bright.data[i + 2] = img.data[i + 2] * k;
          bright.data[i + 3] = 255 * k;
        }
      }
      const bl = boxBlur(bright, v.radius);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          addPx(img, x, y, bl.data[i], bl.data[i + 1], bl.data[i + 2], bl.data[i + 3] / 255 * v.intensity * 1.6);
        }
    }
  ),
  mk(
    "vignette",
    "\u30D3\u30CD\u30C3\u30C8",
    "VIGNETTE",
    "special",
    "\u56DB\u9685\u3092\u843D\u3068\u3057\u3066\u96C6\u4E2D",
    "vignette",
    [R2("amount", "\u5F37\u3055", 0, 100, 1, 45), R2("radius", "\u7BC4\u56F2", 10, 100, 1, 62), C2("color", "\u8272", "#000000"), T2("invert", "\u9006\u306B\u660E\u308B\u304F", false)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.amount / 100, cx = (w - 1) / 2, cy = (h - 1) / 2;
      const maxD = Math.hypot(cx, cy), r0 = v.radius / 100 * maxD;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const d = Math.hypot(x - cx, y - cy);
          let f = clamp01((d - r0) / Math.max(1, maxD - r0)) * k;
          if (v.invert) f = k - f;
          img.data[i] = clamp(img.data[i] * (1 - f) + c.r * f);
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - f) + c.g * f);
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - f) + c.b * f);
        }
    }
  ),
  mk(
    "chromatic",
    "\u8272\u53CE\u5DEE",
    "CHROMATIC ABERRATION",
    "special",
    "RGB \u3092\u305A\u3089\u3057\u3066\u6EF2\u307E\u305B\u308B",
    "chroma",
    [R2("amount", "\u305A\u308C", 0, 6, 0.5, 1.5), R2("angle", "\u65B9\u5411", 0, 360, 1, 0), T2("edgeOnly", "\u7E01\u306E\u307F", false)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, a = v.angle * Math.PI / 180;
      const dx = Math.cos(a) * v.amount, dy = Math.sin(a) * v.amount;
      const m = maskOf(img);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (src.data[i + 3] === 0) continue;
          if (v.edgeOnly) {
            let edge = false;
            for (let r = 1; r <= 2 && !edge; r++)
              if (m[clamp(y - r, 0, h - 1) * w + clamp(x, 0, w - 1)] < 0.2 || m[clamp(y + r, 0, h - 1) * w + clamp(x, 0, w - 1)] < 0.2 || m[y * w + clamp(x - r, 0, w - 1)] < 0.2 || m[y * w + clamp(x + r, 0, w - 1)] < 0.2) edge = true;
            if (!edge) continue;
          }
          const rx = clamp(Math.round(x + dx), 0, w - 1), ry = clamp(Math.round(y + dy), 0, h - 1);
          const bx = clamp(Math.round(x - dx), 0, w - 1), by = clamp(Math.round(y - dy), 0, h - 1);
          img.data[i] = src.data[ry * w + rx << 2];
          img.data[i + 2] = src.data[by * w + bx << 2 | 2];
        }
    }
  ),
  mk(
    "enchantGlint",
    "\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8\u306E\u8F1D\u304D",
    "ENCHANT GLINT",
    "special",
    "MC \u98A8\u306E\u659C\u3081\u30B7\u30DE\u30FC",
    "enchant",
    [R2("speed", "\u901F\u5EA6", 0, 4, 0.1, 1.1), R2("width", "\u5E2F\u5E45", 2, 40, 1, 14), R2("intensity", "\u5F37\u3055", 0, 200, 1, 90), C2("color", "\u8272", "#c9a8ff"), R2("bands", "\u5E2F\u306E\u6570", 1, 3, 1, 2), S2("mode", "\u7BC4\u56F2", "inside", [["inside", "\u5185\u90E8\u306E\u307F"], ["all", "\u5168\u9762"]])],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.intensity / 100;
      const span = w + h;
      for (let b = 0; b < v.bands; b++) {
        const off = fract(ctx.t * v.speed * 0.32 + b / v.bands) * (span + v.width * 3) - v.width * 2;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const i = y * w + x << 2;
            if (img.data[i + 3] === 0) continue;
            if (v.mode === "inside") {
              if (!getAlpha(img, x + 1, y) || !getAlpha(img, x - 1, y) || !getAlpha(img, x, y + 1) || !getAlpha(img, x, y - 1)) continue;
            }
            const p = (x + y) / 2;
            const d = Math.abs(p - off / 2);
            if (d > v.width) continue;
            const f = Math.pow(1 - d / v.width, 2.2);
            screenPx(img, x, y, c.r, c.g, c.b, f * 200 * k);
            screenPx(img, x, y, 255, 255, 255, f * 90 * k);
          }
      }
    },
    true
  ),
  mk(
    "rarityAura",
    "\u30EC\u30A2\u30EA\u30C6\u30A3\u30AA\u30FC\u30E9",
    "RARITY AURA",
    "special",
    "\u30A2\u30A4\u30C6\u30E0\u54C1\u8CEA\u306E\u767A\u5149\u30AA\u30FC\u30E9",
    "rarity",
    [
      S2("rarity", "\u54C1\u8CEA", "legendary", Object.entries(RARITIES).map(([k, o]) => [k, o.l])),
      R2("radius", "\u5E83\u304C\u308A", 1, 14, 1, 5),
      R2("intensity", "\u5F37\u3055", 0, 200, 1, 100),
      R2("speed", "\u8108\u52D5", 0, 4, 0.1, 1.2),
      T2("rim", "\u7E01\u3092\u660E\u308B\u304F", true)
    ],
    (img, v, ctx) => {
      const w = img.width, h = img.height;
      const c = hexToRgb(RARITIES[v.rarity]?.c || "#ff9f2e");
      const src = clone(img);
      const a = new ImageData(w, h);
      for (let i = 0; i < src.data.length; i += 4) a.data[i + 3] = src.data[i + 3];
      const pulse = 0.72 + 0.28 * Math.sin(ctx.t * v.speed * 2.4);
      const glow = boxBlur(a, v.radius, true);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          const g = clamp01(glow.data[i + 3] / 255) * (v.intensity / 100) * pulse;
          if (g > 0) addPx(img, x, y, c.r, c.g, c.b, g * 190);
          if (v.rim && src.data[i + 3] > 0) {
            const edge = !getAlpha(src, x + 1, y) || !getAlpha(src, x - 1, y) || !getAlpha(src, x, y + 1) || !getAlpha(src, x, y - 1);
            if (edge) {
              screenPx(img, x, y, c.r, c.g, c.b, 200 * pulse);
              overPx(img, x, y, clamp(c.r * 0.6 + src.data[i] * 0.4), clamp(c.g * 0.6 + src.data[i + 1] * 0.4), clamp(c.b * 0.6 + src.data[i + 2] * 0.4), 160 * pulse);
            }
          }
        }
    },
    true
  ),
  mk(
    "holographic",
    "\u30DB\u30ED\u30B0\u30E9\u30E0\u7B94",
    "HOLOGRAM FOIL",
    "special",
    "\u8679\u8272\u304C\u6D41\u308C\u308Bfoil\u52A0\u5DE5",
    "holo",
    [R2("speed", "\u901F\u5EA6", 0, 4, 0.1, 0.9), R2("intensity", "\u5F37\u3055", 0, 150, 1, 70), R2("scale", "\u30B9\u30B1\u30FC\u30EB", 2, 40, 1, 12), T2("sparkle", "\u30E9\u30E1", true)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, k = v.intensity / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const n = fbm(x / v.scale + ctx.t * v.speed * 0.35, y / v.scale - ctx.t * v.speed * 0.22, 5, 4);
          const hue = fract(n * 1.6 + ctx.t * v.speed * 0.09 + (x + y) / (w * 6));
          const c = hslToRgb(hue, 0.85, 0.62);
          screenPx(img, x, y, c.r, c.g, c.b, k * 150);
          if (v.sparkle && hash2(x, y, Math.floor(ctx.t * 7)) > 0.965) addPx(img, x, y, 255, 255, 255, 150 * k);
        }
    },
    true
  ),
  mk(
    "iridescent",
    "\u8679\u8272\u30B7\u30D5\u30C8",
    "IRIDESCENCE",
    "special",
    "\u89D2\u5EA6\u3067\u8272\u304C\u5909\u308F\u308B\u8584\u819C",
    "iris",
    [R2("amount", "\u5F37\u3055", 0, 150, 1, 60), R2("scale", "\u5468\u671F", 2, 60, 1, 18), R2("angle", "\u89D2\u5EA6", 0, 360, 1, 35), R2("speed", "\u6D41\u308C", 0, 3, 0.1, 0.4)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, k = v.amount / 100, a = v.angle * Math.PI / 180;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const p = (x * Math.cos(a) + y * Math.sin(a)) / v.scale + ctx.t * v.speed;
          const c = hslToRgb(fract(p), 0.75, 0.58);
          screenPx(img, x, y, c.r, c.g, c.b, k * 130);
        }
    },
    true
  ),
  mk(
    "glitch",
    "\u30B0\u30EA\u30C3\u30C1",
    "GLITCH",
    "special",
    "\u5D29\u58CA\u3059\u308B\u30C7\u30B8\u30BF\u30EB\u30CE\u30A4\u30BA",
    "glitch",
    [R2("amount", "\u5F37\u3055", 0, 100, 1, 35), R2("slices", "\u30B9\u30E9\u30A4\u30B9\u6570", 1, 20, 1, 6), R2("speed", "\u901F\u5EA6", 0.5, 12, 0.5, 4), T2("rgbSplit", "RGB \u5206\u96E2", true), R2("seed", "\u4E71\u6570", 0, 999, 1, 3)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, src = clone(img), k = v.amount / 100;
      const frame = Math.floor(ctx.t * v.speed);
      const rnd = mulberry32(frame * 7919 + v.seed * 31);
      const sliceH = Math.max(1, Math.round(h / v.slices));
      for (let s = 0; s < v.slices; s++) {
        if (rnd() > k * 1.2) continue;
        const y0 = s * sliceH;
        const shift = Math.round((rnd() - 0.5) * 2 * k * w * 0.22);
        for (let y = y0; y < Math.min(h, y0 + sliceH); y++)
          for (let x = 0; x < w; x++) {
            const i = y * w + x << 2;
            const sx = ((x + shift) % w + w) % w;
            const j = y * w + sx << 2;
            img.data[i] = src.data[j];
            img.data[i + 1] = src.data[j + 1];
            img.data[i + 2] = src.data[j + 2];
            img.data[i + 3] = src.data[j + 3];
            if (v.rgbSplit) {
              const rx = clamp(sx + Math.round(k * 3), 0, w - 1), bx = clamp(sx - Math.round(k * 3), 0, w - 1);
              img.data[i] = src.data[y * w + rx << 2];
              img.data[i + 2] = src.data[y * w + bx << 2 | 2];
            }
          }
      }
      if (rnd() < k * 0.6) {
        for (let n = 0; n < 8 * k; n++) {
          const bx = Math.floor(rnd() * w), by = Math.floor(rnd() * h);
          const bw = 1 + Math.floor(rnd() * 5), bh = 1 + Math.floor(rnd() * 3);
          const val = rnd() > 0.5 ? 255 : 0;
          for (let y = by; y < Math.min(h, by + bh); y++) for (let x = bx; x < Math.min(w, bx + bw); x++)
            setPx(img, x, y, val, val, val, img.data[y * w + x << 2 | 3] > 0 ? 255 : 90);
        }
      }
    },
    true
  ),
  mk(
    "crt",
    "CRT \u30E2\u30CB\u30BF\u30FC",
    "CRT",
    "special",
    "\u30D6\u30E9\u30A6\u30F3\u7BA1\u98A8\u306E\u8D70\u67FB\u3068\u30DE\u30B9\u30AF",
    "crt",
    [R2("scan", "\u30B9\u30AD\u30E3\u30F3\u6FC3\u3055", 0, 100, 1, 35), R2("mask", "RGB \u30DE\u30B9\u30AF", 0, 100, 1, 25), R2("bloom", "\u6EF2\u307F", 0, 100, 1, 30), R2("curve", "\u5468\u8FBA\u6E1B\u5149", 0, 100, 1, 40), R2("flicker", "\u3061\u3089\u3064\u304D", 0, 100, 1, 12)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, d = img.data;
      const fl = 1 + (Math.sin(ctx.t * 47) * 0.5 + Math.sin(ctx.t * 13.3) * 0.5) * (v.flicker / 100) * 0.09;
      const cx = (w - 1) / 2, cy = (h - 1) / 2, maxD = Math.hypot(cx, cy);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (d[i + 3] === 0) continue;
          let f = fl;
          if (v.scan > 0 && y % 2 === 0) f *= 1 - v.scan / 100 * 0.55;
          if (v.mask > 0) {
            const m = x % 3;
            const mk2 = 1 - v.mask / 100 * 0.4;
            d[i] = clamp(d[i] * (m === 0 ? 1 : mk2) * f);
            d[i + 1] = clamp(d[i + 1] * (m === 1 ? 1 : mk2) * f);
            d[i + 2] = clamp(d[i + 2] * (m === 2 ? 1 : mk2) * f);
          } else {
            d[i] = clamp(d[i] * f);
            d[i + 1] = clamp(d[i + 1] * f);
            d[i + 2] = clamp(d[i + 2] * f);
          }
          if (v.curve > 0) {
            const dd = Math.hypot(x - cx, y - cy) / maxD;
            const vg = 1 - clamp01((dd - 0.5) / 0.5) * (v.curve / 100);
            d[i] *= vg;
            d[i + 1] *= vg;
            d[i + 2] *= vg;
          }
        }
      if (v.bloom > 0) {
        const bright = new ImageData(w, h);
        for (let i = 0; i < d.length; i += 4) {
          const l = luminance(d[i], d[i + 1], d[i + 2]);
          if (l > 130) {
            const k = (l - 130) / 125;
            bright.data[i] = d[i] * k;
            bright.data[i + 1] = d[i + 1] * k;
            bright.data[i + 2] = d[i + 2] * k;
            bright.data[i + 3] = 255 * k;
          }
        }
        const bl = boxBlur(bright, 2);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          addPx(img, x, y, bl.data[i], bl.data[i + 1], bl.data[i + 2], bl.data[i + 3] / 255 * v.bloom * 1.4);
        }
      }
    },
    true
  ),
  mk(
    "warp",
    "\u6CE2\u6B6A\u307F",
    "WARP",
    "special",
    "\u6C34\u9762\u306E\u3088\u3046\u306A\u3086\u304C\u307F",
    "warp",
    [R2("amount", "\u5F37\u3055", 0, 8, 0.2, 2), R2("freq", "\u5468\u6CE2\u6570", 0.5, 12, 0.5, 3), R2("speed", "\u901F\u5EA6", 0, 4, 0.1, 1), S2("mode", "\u5F62", "wave", [["wave", "\u6CE2"], ["ripple", "\u6CE2\u7D0B"], ["turb", "\u4E71\u6D41"]])],
    (img, v, ctx) => {
      const w = img.width, h = img.height, src = clone(img), cx = w / 2, cy = h / 2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          let ox = 0, oy = 0;
          if (v.mode === "wave") {
            ox = Math.sin(y / v.freq + ctx.t * v.speed * 2) * v.amount;
            oy = Math.cos(x / v.freq + ctx.t * v.speed * 1.6) * v.amount * 0.5;
          } else if (v.mode === "ripple") {
            const d = Math.hypot(x - cx, y - cy);
            const a2 = Math.sin(d / v.freq - ctx.t * v.speed * 3) * v.amount;
            ox = (x - cx) / (d || 1) * a2;
            oy = (y - cy) / (d || 1) * a2;
          } else {
            ox = (fbm(x / (v.freq * 3), y / (v.freq * 3) + ctx.t * v.speed * 0.3, 21, 3) - 0.5) * v.amount * 3;
            oy = (fbm(x / (v.freq * 3) + 9, y / (v.freq * 3) - ctx.t * v.speed * 0.3, 44, 3) - 0.5) * v.amount * 3;
          }
          const sx = clamp(Math.round(x + ox), 0, w - 1), sy = clamp(Math.round(y + oy), 0, h - 1);
          const j = sy * w + sx << 2;
          img.data[i] = src.data[j];
          img.data[i + 1] = src.data[j + 1];
          img.data[i + 2] = src.data[j + 2];
          img.data[i + 3] = src.data[j + 3];
        }
    },
    true
  ),
  mk(
    "swirl",
    "\u6E26",
    "SWIRL",
    "special",
    "\u4E2D\u5FC3\u304B\u3089\u6E26\u5DFB\u304F\u5909\u5F62",
    "swirl",
    [R2("amount", "\u306D\u3058\u308C", -360, 360, 5, 120), R2("radius", "\u7BC4\u56F2", 10, 100, 1, 80), R2("speed", "\u56DE\u8EE2", 0, 3, 0.1, 0)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, src = clone(img), cx = (w - 1) / 2, cy = (h - 1) / 2;
      const maxR = Math.min(w, h) / 2 * (v.radius / 100) || 1;
      const base = v.amount * Math.PI / 180 + ctx.t * v.speed;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
          if (d > maxR) continue;
          const f = Math.pow(1 - d / maxR, 2) * base;
          const sx = clamp(Math.round(cx + dx * Math.cos(f) - dy * Math.sin(f)), 0, w - 1);
          const sy = clamp(Math.round(cy + dx * Math.sin(f) + dy * Math.cos(f)), 0, h - 1);
          const j = sy * w + sx << 2;
          img.data[i] = src.data[j];
          img.data[i + 1] = src.data[j + 1];
          img.data[i + 2] = src.data[j + 2];
          img.data[i + 3] = src.data[j + 3];
        }
    },
    true
  ),
  mk(
    "pixelSort",
    "\u30D4\u30AF\u30BB\u30EB\u30BD\u30FC\u30C8",
    "PIXEL SORT",
    "special",
    "\u660E\u5EA6\u3067\u753B\u7D20\u3092\u5F15\u304D\u4F38\u3070\u3059",
    "sort",
    [R2("threshold", "\u3057\u304D\u3044\u5024", 0, 255, 1, 90), R2("len", "\u6700\u5927\u9577", 1, 32, 1, 10), S2("dir", "\u65B9\u5411", "h", [["h", "\u6A2A"], ["v", "\u7E26"], ["diag", "\u659C\u3081"]]), T2("desc", "\u964D\u9806", false)],
    (img, v) => {
      const w = img.width, h = img.height;
      const lum = (x, y) => {
        const i = y * w + x << 2;
        return img.data[i + 3] > 0 ? luminance(img.data[i], img.data[i + 1], img.data[i + 2]) : -1;
      };
      const total = v.dir === "v" ? w : h;
      for (let s = 0; s < total; s++) {
        const max = v.dir === "v" ? h : w;
        let run = [];
        const flush = () => {
          if (run.length > 1) {
            const sorted = [...run].sort((a, b) => v.desc ? b.l - a.l : a.l - b.l);
            run.forEach((p, idx) => {
              const i = p.y * w + p.x << 2, j = sorted[idx].y * w + sorted[idx].x << 2;
              img.data[i] = img.data[j];
              img.data[i + 1] = img.data[j + 1];
              img.data[i + 2] = img.data[j + 2];
            });
          }
          run = [];
        };
        for (let k = 0; k < max; k++) {
          const x = v.dir === "v" ? s : k, y = v.dir === "v" ? k : s;
          const l = lum(x, y);
          if (l < 0 || l < v.threshold) flush();
          else {
            run.push({ x, y, l });
            if (run.length >= v.len) flush();
          }
        }
        flush();
      }
    }
  ),
  mk(
    "lightSweep",
    "\u30E9\u30A4\u30C8\u30B9\u30A4\u30FC\u30D7",
    "LIGHT SWEEP",
    "special",
    "\u6A2A\u5207\u308B\u4E00\u7B4B\u306E\u5149",
    "sweep",
    [R2("speed", "\u901F\u5EA6", 0, 4, 0.1, 0.9), R2("width", "\u5E45", 2, 40, 1, 12), R2("intensity", "\u5F37\u3055", 0, 200, 1, 100), R2("angle", "\u89D2\u5EA6", -60, 60, 1, 18), C2("color", "\u8272", "#ffffff")],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.intensity / 100;
      const a = v.angle * Math.PI / 180;
      const pos = fract(ctx.t * v.speed * 0.28) * (w + h) - h * 0.5;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (img.data[i + 3] === 0) continue;
          const p = x * Math.cos(a) + y * Math.sin(a);
          const d = Math.abs(p - pos);
          if (d > v.width) continue;
          const f = Math.pow(1 - d / v.width, 2);
          screenPx(img, x, y, c.r, c.g, c.b, f * 230 * k);
        }
    },
    true
  ),
  mk(
    "motionTrail",
    "\u6B8B\u50CF / \u30E2\u30FC\u30B7\u30E7\u30F3\u30D6\u30E9\u30FC",
    "MOTION TRAIL",
    "special",
    "\u52D5\u304D\u306E\u8ECC\u8DE1\u3092\u6B8B\u3059",
    "trail",
    [R2("amount", "\u5F37\u3055", 0, 100, 1, 45), R2("steps", "\u56DE\u6570", 1, 8, 1, 4), R2("angle", "\u65B9\u5411", 0, 360, 1, 45), T2("animated", "\u6D41\u3059", false)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, src = clone(img), a = v.angle * Math.PI / 180, k = v.amount / 100;
      const shift = v.animated ? fract(ctx.t * 0.6) * 3 : 0;
      for (let s = 1; s <= v.steps; s++) {
        const dist = s / v.steps * (2 + shift);
        const dx = Math.round(Math.cos(a) * dist), dy = Math.round(Math.sin(a) * dist);
        const fade = (1 - s / (v.steps + 1)) * k * 0.6;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const sx = x - dx, sy = y - dy;
            if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
            const j = sy * w + sx << 2;
            if (src.data[j + 3] === 0) continue;
            addPx(img, x, y, src.data[j] * 0.7, src.data[j + 1] * 0.7, src.data[j + 2] * 0.7, fade * 255);
          }
      }
    },
    true
  ),
  mk(
    "kaleido",
    "\u4E07\u83EF\u93E1",
    "KALEIDOSCOPE",
    "special",
    "\u5BFE\u79F0\u53CD\u5FA9\u3067\u6A21\u69D8\u5316",
    "kaleido",
    [S2("segments", "\u5206\u5272", "4", [["2", "2"], ["4", "4"], ["6", "6"], ["8", "8"]]), R2("rot", "\u56DE\u8EE2", 0, 360, 1, 0), R2("zoom", "\u62E1\u5927", 50, 200, 1, 100)],
    (img, v) => {
      const w = img.width, h = img.height, src = clone(img), seg = parseInt(v.segments, 10);
      const cx = (w - 1) / 2, cy = (h - 1) / 2, rot = v.rot * Math.PI / 180, z = v.zoom / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          let ang = Math.atan2(y - cy, x - cx) - rot;
          const d = Math.hypot(x - cx, y - cy) * z;
          const sector = Math.PI * 2 / seg;
          ang = (ang % sector + sector) % sector;
          if (ang > sector / 2) ang = sector - ang;
          ang += rot;
          const sx = clamp(Math.round(cx + Math.cos(ang) * d), 0, w - 1);
          const sy = clamp(Math.round(cy + Math.sin(ang) * d), 0, h - 1);
          const j = sy * w + sx << 2;
          img.data[i] = src.data[j];
          img.data[i + 1] = src.data[j + 1];
          img.data[i + 2] = src.data[j + 2];
          img.data[i + 3] = src.data[j + 3];
        }
    }
  ),
  mk(
    "embossGold",
    "\u91D1\u7B94\u30D7\u30EC\u30B9",
    "GOLD FOIL",
    "special",
    "\u7ACB\u4F53\u611F\u306E\u3042\u308B\u91D1\u7B94\u62BC\u3057",
    "foil",
    [R2("amount", "\u5F37\u3055", 0, 100, 1, 60), C2("light", "\u660E\u8272", "#ffe9a8"), C2("dark", "\u6697\u8272", "#8a5a12"), R2("angle", "\u5149\u6E90", 0, 360, 1, 315), T2("onlyBright", "\u660E\u90E8\u306B\u306E\u307F", false)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, lt = hexToRgb(v.light), dk = hexToRgb(v.dark), k = v.amount / 100;
      const a = v.angle * Math.PI / 180, dx = Math.round(Math.cos(a)), dy = Math.round(-Math.sin(a));
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          if (src.data[i + 3] === 0) continue;
          const l = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
          if (v.onlyBright && l < 120) continue;
          const hi = getAlpha(src, x + dx, y + dy) > 0 ? luminance(src.data[(y + dy) * w + (x + dx) << 2], src.data[(y + dy) * w + (x + dx) << 2 | 1], src.data[(y + dy) * w + (x + dx) << 2 | 2]) : l;
          const diff = clamp01((hi - l) / 90 + 0.5);
          const r = lerp(dk.r, lt.r, diff), g = lerp(dk.g, lt.g, diff), b = lerp(dk.b, lt.b, diff);
          img.data[i] = clamp(src.data[i] * (1 - k * 0.55) + r * k * 0.85);
          img.data[i + 1] = clamp(src.data[i + 1] * (1 - k * 0.55) + g * k * 0.85);
          img.data[i + 2] = clamp(src.data[i + 2] * (1 - k * 0.55) + b * k * 0.85);
        }
    }
  ),
  mk(
    "soulFlame",
    "\u9B42\u306E\u708E",
    "SOUL FLAME",
    "special",
    "\u3086\u3089\u3081\u304F\u970A\u706B\u3092\u7E8F\u3046",
    "soul",
    [C2("c1", "\u5185\u5074", "#8ef7ff"), C2("c2", "\u5916\u5074", "#3a5cff"), R2("intensity", "\u5F37\u3055", 0, 200, 1, 90), R2("speed", "\u63FA\u3089\u304E", 0.2, 5, 0.1, 1.6), R2("reach", "\u5E83\u304C\u308A", 1, 10, 1, 4)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, a = hexToRgb(v.c1), b = hexToRgb(v.c2), src = clone(img);
      const am = new ImageData(w, h);
      for (let i = 0; i < src.data.length; i += 4) am.data[i + 3] = src.data[i + 3];
      const glow = boxBlur(am, v.reach, true);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x << 2;
          const g = glow.data[i + 3] / 255;
          if (g <= 0.02) continue;
          const flick = 0.55 + 0.45 * fbm(x / 4 + ctx.t * v.speed * 0.6, y / 4 - ctx.t * v.speed * 1.1, 3, 3);
          const t = clamp01(g * flick);
          const r = lerp(b.r, a.r, t), gg = lerp(b.g, a.g, t), bb = lerp(b.b, a.b, t);
          addPx(img, x, y, r, gg, bb, t * v.intensity * 1.5);
        }
    },
    true
  )
];

// src/lib/pipeline.ts
var ALL_FX = [...CORE_FX, ...DECOR_FX, ...MATERIAL_FX, ...SPECIAL_FX];
var FX_BY_ID = new Map(ALL_FX.map((d) => [d.id, d]));
var _uid = 0;
var uid = () => `${Date.now().toString(36)}-${(++_uid).toString(36)}`;
function makeInst(id, overrides = {}) {
  const d = FX_BY_ID.get(id);
  return { uid: uid(), id, on: true, amount: 100, values: { ...defaults(d), ...overrides } };
}
var seedOf = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1e5;
};
function renderPipeline(base, insts, t, seed = 1) {
  let img = clone(base);
  const size = base.width;
  for (const it of insts) {
    if (!it.on) continue;
    const d = FX_BY_ID.get(it.id);
    if (!d) continue;
    const ctx = { size, t, seed: seed * 31 + seedOf(it.uid) };
    const amt = clamp01(it.amount / 100);
    if (amt >= 0.999) {
      d.apply(img, it.values, ctx);
    } else {
      const src = clone(img);
      d.apply(img, it.values, ctx);
      const a = src.data, b = img.data;
      for (let i = 0; i < b.length; i++) b[i] = a[i] + (b[i] - a[i]) * amt;
    }
  }
  return img;
}

// src/lib/textures.ts
var Pt = class {
  img;
  size;
  constructor(size) {
    this.size = size;
    this.img = new ImageData(size, size);
  }
  set(x, y, r, g, b, a = 255) {
    setPx(this.img, x | 0, y | 0, r, g, b, a);
  }
  at(x, y) {
    const i = clamp(y | 0, 0, this.size - 1) * this.size + clamp(x | 0, 0, this.size - 1) << 2;
    return [this.img.data[i], this.img.data[i + 1], this.img.data[i + 2], this.img.data[i + 3]];
  }
  fill(fn) {
    const s = this.size;
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const c = fn(x, y);
        if (c) this.set(x, y, c[0], c[1], c[2], c[3]);
      }
    return this;
  }
};
var jit = (x, y, seed, amt) => (hash2(x, y, seed) - 0.5) * 2 * amt;
function noisy(size, seed, base, variation, scale = 4, speck = 0.06, darkSpeck = -30) {
  const p = new Pt(size);
  return p.fill((x, y) => {
    const n = fbm(x / scale, y / scale, seed, 4);
    const h = hash2(x, y, seed + 7);
    let k = 0.72 + n * 0.56 + jit(x, y, seed, variation * 0.16);
    if (h > 1 - speck) k += darkSpeck / 100;
    else if (h < speck * 0.6) k -= darkSpeck / 160;
    return [clamp(base[0] * k), clamp(base[1] * k), clamp(base[2] * k), base[3]];
  }).img;
}
function voronoi(size, seed, cells, colFn, jitterAmt = 1) {
  const p = new Pt(size);
  const rnd = mulberry32(seed * 7717 + 3);
  const pts = [];
  for (let i = 0; i < cells; i++) pts.push([rnd() * size, rnd() * size]);
  return p.fill((x, y) => {
    let d1 = 1e9, d2 = 1e9, idx = 0;
    for (let i = 0; i < pts.length; i++) {
      for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++) {
          const dx = x + 0.5 - (pts[i][0] + ox * size), dy = y + 0.5 - (pts[i][1] + oy * size);
          const d = dx * dx + dy * dy;
          if (d < d1) {
            d2 = d1;
            d1 = d;
            idx = i;
          } else if (d < d2) d2 = d;
        }
    }
    const edge = clamp01((Math.sqrt(d2) - Math.sqrt(d1)) / (size * 0.09 * jitterAmt));
    const t = hash2(idx, 0, seed);
    return colFn(t, edge, idx);
  }).img;
}
function ore(size, seed, color, glow = false, blobs = 3) {
  const base = new Pt(size);
  base.img.data.set(noisy(size, seed * 13 + 1, [126, 126, 129, 255], 1, size / 22, 0.05).data);
  const c = hexToRgb(color);
  const rnd = mulberry32(seed * 991 + 5);
  const pts = [];
  for (let i = 0; i < blobs; i++) pts.push([0.18 + rnd() * 0.64, 0.18 + rnd() * 0.64, (0.09 + rnd() * 0.09) * size]);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let m = 0;
      for (const [px, py, r] of pts) {
        const dx = x - px * size, dy = y - py * size;
        const wob = 1 + (fbm(x / (size / 9), y / (size / 9), seed + Math.round(px * 50), 3) - 0.5) * 0.85;
        const d = Math.hypot(dx, dy) / (r * wob);
        m = Math.max(m, 1 - d);
      }
      if (m <= 0.08) continue;
      m = clamp01(m);
      const k = 0.72 + m * 0.55 + hash2(x, y, seed + 3) * 0.16;
      base.set(x, y, clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255);
      if (glow && m > 0.55) base.set(x, y, clamp(c.r * k + 60), clamp(c.g * k + 50), clamp(c.b * k + 40), 255);
    }
  return base.img;
}
function metalBlock(size, seed, color, pattern = "plate") {
  const c = hexToRgb(color);
  const p = new Pt(size);
  const s = size;
  p.fill((x, y) => {
    const n = fbm(x / (s / 5), y / (s / 5), seed, 3);
    let k = 0.82 + n * 0.26 + jit(x, y, seed, 5) / 100;
    const d = Math.min(x, y, s - 1 - x, s - 1 - y);
    if (d === 0) k *= 0.55;
    else if (d === 1) k *= 1.28;
    else if (d === 2) k *= 0.92;
    if (pattern === "brick") {
      const rows = 4, bh = s / rows;
      const row = Math.floor(y / bh);
      const off = row % 2 * (s / 4);
      const bx = (x + off) % (s / 2);
      if (Math.abs(y % bh) < 1 || bx < 1) k *= 0.62;
    }
    if (pattern === "gem") {
      const cx = (s - 1) / 2, cy = (s - 1) / 2;
      const dd = Math.abs(x - cx) + Math.abs(y - cy);
      if (Math.abs(dd - s * 0.3) < 1.2) k *= 1.4;
      if (Math.abs(dd - s * 0.16) < 1) k *= 0.7;
      if (x === y || x === s - 1 - y) k *= 1.12;
    }
    if (pattern === "plate") {
      const cx = (s - 1) / 2, cy = (s - 1) / 2;
      if (Math.abs(x - cx) < 1 && Math.abs(y - cy) < s * 0.18) k *= 1.18;
      if (Math.abs(y - cy) < 1 && Math.abs(x - cx) < s * 0.18) k *= 0.9;
    }
    return [clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255];
  });
  return p.img;
}
function segDist(x, y, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const L2 = dx * dx + dy * dy || 1e-6;
  let t = ((x - x0) * dx + (y - y0) * dy) / L2;
  t = clamp01(t);
  const px = x0 + dx * t, py = y0 + dy * t;
  const d = Math.hypot(x - px, y - py);
  const cross = (x - x0) * dy - (y - y0) * dx;
  return { d, t, sign: cross > 0 ? 1 : -1 };
}
function itemSword(size, seed, blade, guard) {
  const p = new Pt(size), s = size;
  const bc = hexToRgb(blade), gc = hexToRgb(guard);
  const N = (u) => u * s;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const b = segDist(px, py, N(0.14), N(0.86), N(0.86), N(0.14));
    const wB = N(0.075) * (1 - b.t * 0.72);
    if (b.d < wB) {
      const shade = 1 + b.sign * 0.24 * (1 - b.t * 0.4);
      const edge = b.d > wB * 0.72 ? 1.32 : 1;
      const n = 0.94 + hash2(x, y, seed) * 0.12;
      return [clamp(bc.r * shade * edge * n), clamp(bc.g * shade * edge * n), clamp(bc.b * shade * edge * n), 255];
    }
    const g = segDist(px, py, N(0.06), N(0.78), N(0.24), N(0.96));
    if (g.d < N(0.055)) {
      const k = 1 + g.sign * 0.2;
      return [clamp(gc.r * k), clamp(gc.g * k), clamp(gc.b * k), 255];
    }
    const h = segDist(px, py, N(0.13), N(0.87), N(0.03), N(0.97));
    if (h.d < N(0.05)) {
      const k = 0.85 + h.sign * 0.2 + Math.sin(h.t * 18) * 0.08;
      return [clamp(96 * k), clamp(64 * k), clamp(38 * k), 255];
    }
    return null;
  });
  return p.img;
}
function itemPickaxe(size, seed, head) {
  const p = new Pt(size), s = size;
  const hc = hexToRgb(head);
  const N = (u) => u * s;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const h = segDist(px, py, N(0.1), N(0.92), N(0.66), N(0.36));
    if (h.d < N(0.052)) {
      const k = 0.9 + h.sign * 0.22 + Math.sin(h.t * 22) * 0.06;
      return [clamp(122 * k), clamp(84 * k), clamp(50 * k), 255];
    }
    const t = clamp01((px - N(0.16)) / (N(0.78) - N(0.16)));
    if (px > N(0.16) && px < N(0.8)) {
      const cy = N(0.46) - Math.sin(t * Math.PI) * N(0.3);
      const width = N(0.085) * (1 - Math.abs(t - 0.5) * 0.85);
      const d = py - cy;
      if (Math.abs(d) < width) {
        const k = 1 - d / (width * 3.2);
        const n = 0.93 + hash2(x, y, seed) * 0.14;
        return [clamp(hc.r * k * n), clamp(hc.g * k * n), clamp(hc.b * k * n), 255];
      }
    }
    return null;
  });
  return p.img;
}
function itemApple(size, seed) {
  const p = new Pt(size), s = size;
  const cx = s * 0.5, cy = s * 0.6, r = s * 0.33;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const dx = (px - cx) / r, dy = (py - cy) / (r * 1.02);
    let d = Math.hypot(dx, dy);
    d *= 1 + Math.abs(dx) * 0.14 - Math.max(0, -dy) * 0.1;
    if (d < 1) {
      const light = clamp01(1 - Math.hypot(dx + 0.45, dy + 0.5) * 0.9);
      const n = 0.9 + hash2(x, y, seed) * 0.18 + fbm(x / (s / 6), y / (s / 6), seed, 3) * 0.16;
      const k = (0.62 + light * 0.62) * n;
      const rim = d > 0.9 ? 0.7 : 1;
      return [clamp(206 * k * rim), clamp(48 * k * rim * 1.05), clamp(48 * k * rim), 255];
    }
    const st = segDist(px, py, cx, cy - r * 0.92, cx + s * 0.05, cy - r * 1.5);
    if (st.d < s * 0.035) return [clamp(96 * (1 + st.sign * 0.2)), clamp(66), clamp(38), 255];
    const lx = (px - (cx + s * 0.13)) / (s * 0.13), ly = (py - (cy - r * 1.24)) / (s * 0.06);
    if (lx * lx + ly * ly < 1 && lx > -0.2) return [clamp(88 + lx * 40), clamp(168 - ly * 30), clamp(58), 255];
    return null;
  });
  return p.img;
}
function itemPotion(size, seed, liquid) {
  const p = new Pt(size), s = size;
  const lc = hexToRgb(liquid);
  const cx = s * 0.5, cy = s * 0.62, r = s * 0.3;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const inNeck = px > s * 0.42 && px < s * 0.58 && py > s * 0.18 && py < s * 0.4;
    const d = Math.hypot((px - cx) / r, (py - cy) / r);
    const inBody = d < 1;
    if (inNeck || inBody) {
      const fillLine = cy + r * 0.15;
      if (py > fillLine && inBody) {
        const light = clamp01(1 - Math.hypot(px - (cx - r * 0.4), py - (cy - r * 0.4)) / (r * 1.5));
        const n = 0.9 + hash2(x, y, seed) * 0.2;
        const k = (0.7 + light * 0.6) * n;
        return [clamp(lc.r * k), clamp(lc.g * k), clamp(lc.b * k), 235];
      }
      const edge = d > 0.88 || inNeck && (px < s * 0.45 || px > s * 0.55);
      return edge ? [214, 232, 240, 200] : [236, 248, 255, 120];
    }
    if (px > s * 0.4 && px < s * 0.6 && py > s * 0.1 && py < s * 0.22) {
      const k = 0.85 + hash2(x, y, seed) * 0.3;
      return [clamp(150 * k), clamp(108 * k), clamp(66 * k), 255];
    }
    if (inBody) return [255, 255, 255, 90];
    return null;
  });
  return p.img;
}
function itemIngot(size, seed, color) {
  const p = new Pt(size), s = size;
  const c = hexToRgb(color);
  const N = (u) => u * s;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    if (py < N(0.34) || py > N(0.78)) return null;
    const t = (py - N(0.34)) / (N(0.78) - N(0.34));
    const halfTop = N(0.22), halfBot = N(0.38);
    const half = lerp(halfTop, halfBot, t);
    const dx = Math.abs(px - s / 2);
    if (dx > half) return null;
    const n = 0.94 + hash2(x, y, seed) * 0.12;
    let k = 1.14 - t * 0.44 + dx / half * 0.06;
    if (t < 0.18) k *= 1.16;
    if (dx > half * 0.9) k *= 0.66;
    return [clamp(c.r * k * n), clamp(c.g * k * n), clamp(c.b * k * n), 255];
  });
  return p.img;
}
function itemGem(size, seed, color) {
  const p = new Pt(size), s = size;
  const c = hexToRgb(color);
  const cx = s / 2;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const topY = s * 0.2, midY = s * 0.42, botY = s * 0.88;
    let inside = false, facet = 0;
    if (py >= topY && py <= midY) {
      const t = (py - topY) / (midY - topY);
      const half = lerp(s * 0.2, s * 0.36, t);
      inside = Math.abs(px - cx) < half;
      facet = 0.95 + t * 0.2 - Math.abs(px - cx) / (half * 2.2);
    } else if (py > midY && py <= botY) {
      const t = (py - midY) / (botY - midY);
      const half = lerp(s * 0.36, 0, t);
      inside = Math.abs(px - cx) < half;
      facet = 0.8 - t * 0.35 + Math.abs(px - cx) / (s * 0.5) * 0.5;
    }
    if (!inside) return null;
    const band = Math.abs(Math.abs(px - cx) - s * 0.12) < s * 0.02 ? 1.25 : 1;
    const n = 0.95 + hash2(x, y, seed) * 0.1;
    const k = clamp(facet * band * n, 0.25, 1.7);
    if (py < midY && Math.abs(px - cx) < s * 0.06) return [clamp(c.r * 1.5 + 70), clamp(c.g * 1.5 + 70), clamp(c.b * 1.5 + 70), 255];
    return [clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255];
  });
  return p.img;
}
function itemBow(size, seed) {
  const p = new Pt(size), s = size;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const cx = s * 0.72, cy = s * 0.5, r = s * 0.42;
    const d = Math.hypot(px - cx, py - cy);
    if (Math.abs(d - r) < s * 0.05 && px < cx) {
      const k = 0.8 + (1 - d / r) * 0.5 + hash2(x, y, seed) * 0.12;
      return [clamp(128 * k), clamp(88 * k), clamp(52 * k), 255];
    }
    if (Math.abs(px - (cx - r)) < s * 0.02 && py > cy - r + s * 0.02 && py < cy + r - s * 0.02)
      return [236, 236, 224, 235];
    return null;
  });
  return p.img;
}
var T3 = (id, name, en, group, gen) => ({ id, name, en, group, gen });
var TEXTURES = [
  T3("grass_top", "\u8349\u30D6\u30ED\u30C3\u30AF\u4E0A\u9762", "GRASS TOP", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => new Pt(s).fill((x, y) => {
    const n = fbm(x / (s / 5), y / (s / 5), sd, 4);
    const b = fbm(x / (s / 14), y / (s / 14), sd + 40, 3);
    const k = (0.72 + n * 0.5 + b * 0.16) * (0.94 + hash2(x, y, sd) * 0.12);
    return [clamp(96 * k * 0.92), clamp(172 * k), clamp(66 * k * 0.9), 255];
  }).img),
  T3("dirt", "\u571F", "DIRT", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => noisy(s, sd, [134, 96, 67, 255], 1.2, s / 16, 0.09, -34)),
  T3("stone", "\u77F3", "STONE", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => noisy(s, sd + 3, [126, 126, 129, 255], 1, s / 18, 0.05, -26)),
  T3("deepslate", "\u6DF1\u5C64\u5CA9", "DEEPSLATE", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 26), sd, 4);
      const k = 0.66 + n * 0.6 + jit(x, y, sd, 6) / 100;
      return [clamp(72 * k), clamp(72 * k), clamp(78 * k), 255];
    }).img;
  }),
  T3("cobblestone", "\u4E38\u77F3", "COBBLESTONE", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => voronoi(s, sd, Math.max(10, Math.round(s * s / 90)), (t, edge) => {
    const base = 104 + t * 56;
    const k = base / 128 * (0.55 + edge * 0.62);
    return [clamp(128 * k), clamp(128 * k), clamp(131 * k), 255];
  })),
  T3("mossy_cobble", "\u82D4\u3080\u3057\u305F\u4E38\u77F3", "MOSSY COBBLE", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const img = voronoi(s, sd + 5, Math.max(10, Math.round(s * s / 90)), (t, edge) => {
      const k = (104 + t * 56) / 128 * (0.55 + edge * 0.62);
      return [clamp(128 * k), clamp(128 * k), clamp(131 * k), 255];
    });
    const p = new Pt(s);
    p.img = img;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const n = fbm(x / (s / 8), y / (s / 8), sd + 17, 4);
      if (n > 0.6) {
        const c = p.at(x, y);
        const m = clamp01((n - 0.6) * 2.6);
        p.set(x, y, lerp(c[0], 92, m), lerp(c[1], 148, m), lerp(c[2], 62, m), 255);
      }
    }
    return p.img;
  }),
  T3("oak_planks", "\u30AA\u30FC\u30AF\u306E\u677F\u6750", "OAK PLANKS", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    const rows = 4;
    return p.fill((x, y) => {
      const row = Math.floor(y / s * rows);
      const tone = 0.86 + hash2(row, 0, sd) * 0.28;
      const grain = fbm(x / (s / 3), y / (s / 40) + row * 11, sd + row, 4);
      const seam = y / s * rows - row < 0.09 ? 0.6 : 1;
      const knot = Math.hypot(x - hash2(row, 3, sd) * s, y - (row + 0.5) * (s / rows)) < s * 0.05 ? 0.72 : 1;
      const k = tone * (0.78 + grain * 0.44) * seam * knot + jit(x, y, sd, 3) / 100;
      return [clamp(178 * k), clamp(142 * k), clamp(92 * k), 255];
    }).img;
  }),
  T3("sand", "\u7802", "SAND", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => noisy(s, sd + 11, [219, 207, 163, 255], 0.8, s / 12, 0.05, -18)),
  T3("sandstone", "\u7802\u5CA9", "SANDSTONE", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const band = Math.sin(y / s * Math.PI * 6 + fbm(x / (s / 8), y / (s / 30), sd, 3) * 2.4);
      const k = 0.88 + band * 0.09 + fbm(x / (s / 5), y / (s / 5), sd + 9, 3) * 0.12 + jit(x, y, sd, 3) / 100;
      return [clamp(222 * k), clamp(208 * k), clamp(160 * k), 255];
    }).img;
  }),
  T3("gravel", "\u7802\u5229", "GRAVEL", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => voronoi(s, sd + 21, Math.max(14, Math.round(s * s / 55)), (t, edge) => {
    const hue = t;
    const base = 0.5 + edge * 0.6;
    const r = clamp((128 + hue * 60) * base), g = clamp((122 + hue * 52) * base), b = clamp((118 + hue * 46) * base);
    return [r, g, b, 255];
  })),
  T3("clay", "\u7C98\u571F", "CLAY", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => noisy(s, sd + 33, [164, 166, 178, 255], 0.5, s / 9, 0.02, -10)),
  T3("terracotta", "\u30C6\u30E9\u30B3\u30C3\u30BF", "TERRACOTTA", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => noisy(s, sd + 44, [168, 94, 60, 255], 1, s / 14, 0.06, -26)),
  T3("bricks", "\u30EC\u30F3\u30AC", "BRICKS", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    const rows = 4, cols = 2;
    return p.fill((x, y) => {
      const bh = s / rows, bw = s / cols;
      const row = Math.floor(y / bh);
      const off = row % 2 * (bw / 2);
      const lx = (x + off) % bw, ly = y % bh;
      const mortar = ly < Math.max(1, s / 24) || lx < Math.max(1, s / 24);
      if (mortar) {
        const k2 = 0.9 + hash2(x, y, sd) * 0.18;
        return [clamp(176 * k2), clamp(168 * k2), clamp(160 * k2), 255];
      }
      const brickTone = 0.86 + hash2(row, Math.floor((x + off) / bw), sd + 3) * 0.3;
      const k = brickTone * (0.86 + fbm(x / (s / 6), y / (s / 6), sd + row, 3) * 0.3) + jit(x, y, sd, 4) / 100;
      return [clamp(156 * k), clamp(76 * k), clamp(62 * k), 255];
    }).img;
  }),
  T3("glass", "\u30AC\u30E9\u30B9", "GLASS", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const d = Math.min(x, y, s - 1 - x, s - 1 - y);
      if (d === 0) return [206, 226, 236, 255];
      if (d === 1) return [170, 200, 214, 150];
      const diag = Math.abs(x / s * 0.7 + y / s * 0.7 - 0.42) < 0.035;
      if (diag) return [255, 255, 255, 120];
      const n = hash2(x, y, sd);
      return [214, 236, 246, n > 0.94 ? 90 : 34];
    }).img;
  }),
  T3("water", "\u6C34", "WATER", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const wave = Math.sin(y / s * Math.PI * 5 + fbm(x / (s / 8), y / (s / 20), sd, 3) * 4);
      const k = 0.84 + wave * 0.14 + jit(x, y, sd, 4) / 100;
      return [clamp(48 * k), clamp(112 * k), clamp(214 * k), 196];
    }).img;
  }),
  T3("lava", "\u6EB6\u5CA9", "LAVA", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 7), y / (s / 7), sd, 5);
      const crust = clamp01((n - 0.44) * 3.4);
      const r = lerp(255, 122, crust), g = lerp(214, 40, crust), b = lerp(86, 26, crust);
      const k = 0.9 + hash2(x, y, sd) * 0.2;
      return [clamp(r * k), clamp(g * k), clamp(b * k), 255];
    }).img;
  }),
  T3("leaves", "\u6728\u306E\u8449", "LEAVES", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 4);
      if (n > 0.72 && hash2(x, y, sd + 1) > 0.55) return null;
      const k = 0.6 + n * 0.7 + jit(x, y, sd, 8) / 100;
      return [clamp(52 * k), clamp(126 * k), clamp(38 * k), 255];
    }).img;
  }),
  T3("snow_block", "\u96EA\u30D6\u30ED\u30C3\u30AF", "SNOW BLOCK", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => noisy(s, sd + 55, [238, 244, 250, 255], 0.35, s / 10, 0.04, -12)),
  T3("wool", "\u7F8A\u6BDB (\u767D)", "WHITE WOOL", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 4), y / (s / 4), sd, 3);
      const fiber = Math.sin((x + y) * 1.4 + n * 8) * 0.5 + 0.5;
      const k = 0.84 + n * 0.2 + fiber * 0.1 + jit(x, y, sd, 3) / 100;
      return [clamp(234 * k), clamp(234 * k), clamp(238 * k), 255];
    }).img;
  }),
  T3("bedrock", "\u5CA9\u76E4", "BEDROCK", "\u57FA\u672C\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 7), y / (s / 7), sd, 5);
      const blk = Math.floor(n * 5) / 5;
      const k = 0.4 + blk * 1.35 + jit(x, y, sd, 5) / 100;
      return [clamp(84 * k), clamp(84 * k), clamp(90 * k), 255];
    }).img;
  }),
  // ---- 鉱石 ----
  T3("coal_ore", "\u77F3\u70AD\u9271\u77F3", "COAL ORE", "\u9271\u77F3", (s, sd) => ore(s, sd, "#2c2c30")),
  T3("iron_ore", "\u9244\u9271\u77F3", "IRON ORE", "\u9271\u77F3", (s, sd) => ore(s, sd + 1, "#d9a58a")),
  T3("copper_ore", "\u9285\u9271\u77F3", "COPPER ORE", "\u9271\u77F3", (s, sd) => ore(s, sd + 2, "#c9743f")),
  T3("gold_ore", "\u91D1\u9271\u77F3", "GOLD ORE", "\u9271\u77F3", (s, sd) => ore(s, sd + 3, "#fcd647")),
  T3("redstone_ore", "\u30EC\u30C3\u30C9\u30B9\u30C8\u30FC\u30F3\u9271\u77F3", "REDSTONE ORE", "\u9271\u77F3", (s, sd) => ore(s, sd + 4, "#e0312c", true, 4)),
  T3("lapis_ore", "\u30E9\u30D4\u30B9\u30E9\u30BA\u30EA\u9271\u77F3", "LAPIS ORE", "\u9271\u77F3", (s, sd) => ore(s, sd + 5, "#2f4fc4", false, 4)),
  T3("diamond_ore", "\u30C0\u30A4\u30E4\u30E2\u30F3\u30C9\u9271\u77F3", "DIAMOND ORE", "\u9271\u77F3", (s, sd) => ore(s, sd + 6, "#57e6ef", true)),
  T3("emerald_ore", "\u30A8\u30E1\u30E9\u30EB\u30C9\u9271\u77F3", "EMERALD ORE", "\u9271\u77F3", (s, sd) => ore(s, sd + 7, "#1fd95b", true, 2)),
  // ---- 金属ブロック ----
  T3("iron_block", "\u9244\u30D6\u30ED\u30C3\u30AF", "IRON BLOCK", "\u91D1\u5C5E\u30D6\u30ED\u30C3\u30AF", (s, sd) => metalBlock(s, sd, "#dcdcdc", "plate")),
  T3("gold_block", "\u91D1\u30D6\u30ED\u30C3\u30AF", "GOLD BLOCK", "\u91D1\u5C5E\u30D6\u30ED\u30C3\u30AF", (s, sd) => metalBlock(s, sd + 1, "#f7d63b", "plate")),
  T3("diamond_block", "\u30C0\u30A4\u30E4\u30E2\u30F3\u30C9\u30D6\u30ED\u30C3\u30AF", "DIAMOND BLOCK", "\u91D1\u5C5E\u30D6\u30ED\u30C3\u30AF", (s, sd) => metalBlock(s, sd + 2, "#62e5e0", "gem")),
  T3("emerald_block", "\u30A8\u30E1\u30E9\u30EB\u30C9\u30D6\u30ED\u30C3\u30AF", "EMERALD BLOCK", "\u91D1\u5C5E\u30D6\u30ED\u30C3\u30AF", (s, sd) => metalBlock(s, sd + 3, "#2ac25c", "gem")),
  T3("netherite_block", "\u30CD\u30B6\u30E9\u30A4\u30C8\u30D6\u30ED\u30C3\u30AF", "NETHERITE BLOCK", "\u91D1\u5C5E\u30D6\u30ED\u30C3\u30AF", (s, sd) => metalBlock(s, sd + 4, "#4a4148", "brick")),
  T3("copper_block", "\u9285\u30D6\u30ED\u30C3\u30AF", "COPPER BLOCK", "\u91D1\u5C5E\u30D6\u30ED\u30C3\u30AF", (s, sd) => metalBlock(s, sd + 5, "#c96f3c", "brick")),
  T3("oxidized_copper", "\u9306\u3073\u305F\u9285", "OXIDIZED COPPER", "\u91D1\u5C5E\u30D6\u30ED\u30C3\u30AF", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 5);
      const t = clamp01((n - 0.3) * 1.8);
      const k = 0.8 + n * 0.4 + jit(x, y, sd, 5) / 100;
      return [clamp(lerp(190, 78, t) * k), clamp(lerp(112, 168, t) * k), clamp(lerp(70, 140, t) * k), 255];
    }).img;
  }),
  // ---- 特殊次元 ----
  T3("obsidian", "\u9ED2\u66DC\u77F3", "OBSIDIAN", "\u7279\u6B8A\u6B21\u5143", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 9), y / (s / 9), sd, 5);
      const k = 0.5 + n * 0.9 + (hash2(x, y, sd) > 0.965 ? 0.6 : 0);
      return [clamp(28 * k), clamp(20 * k), clamp(44 * k), 255];
    }).img;
  }),
  T3("netherrack", "\u30CD\u30B6\u30FC\u30E9\u30C3\u30AF", "NETHERRACK", "\u7279\u6B8A\u6B21\u5143", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 5), y / (s / 5), sd, 5);
      const pit = n > 0.72 ? 0.5 : 1;
      const k = (0.6 + n * 0.8) * pit + jit(x, y, sd, 8) / 100;
      return [clamp(132 * k), clamp(52 * k), clamp(52 * k), 255];
    }).img;
  }),
  T3("soul_sand", "\u30BD\u30A6\u30EB\u30B5\u30F3\u30C9", "SOUL SAND", "\u7279\u6B8A\u6B21\u5143", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 4);
      let k = 0.76 + n * 0.44 + jit(x, y, sd, 5) / 100;
      const holes = [[0.3, 0.36, 0.11], [0.7, 0.36, 0.11], [0.5, 0.68, 0.14]];
      for (const [hx, hy, hr] of holes) {
        const d = Math.hypot((x / s - hx) / hr, (y / s - hy) / (hr * 1.2));
        if (d < 1) k *= 0.34 + d * 0.4;
      }
      return [clamp(98 * k), clamp(72 * k), clamp(62 * k), 255];
    }).img;
  }),
  T3("end_stone", "\u30A8\u30F3\u30C9\u30B9\u30C8\u30FC\u30F3", "END STONE", "\u7279\u6B8A\u6B21\u5143", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 8), y / (s / 8), sd, 4);
      const speck = hash2(x, y, sd + 2) > 0.93 ? 0.55 : 1;
      const k = (0.84 + n * 0.3) * speck;
      return [clamp(222 * k), clamp(214 * k), clamp(158 * k), 255];
    }).img;
  }),
  T3("glowstone", "\u30B0\u30ED\u30A6\u30B9\u30C8\u30FC\u30F3", "GLOWSTONE", "\u7279\u6B8A\u6B21\u5143", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 5);
      const hot = clamp01((n - 0.45) * 2.6);
      const r = lerp(146, 255, hot), g = lerp(104, 214, hot), b = lerp(58, 118, hot);
      const k = 0.92 + hash2(x, y, sd) * 0.16;
      return [clamp(r * k), clamp(g * k), clamp(b * k), 255];
    }).img;
  }),
  T3("ice", "\u6C37", "ICE", "\u7279\u6B8A\u6B21\u5143", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 7), y / (s / 7), sd, 4);
      const crack = Math.abs(valueNoise(x / (s / 3), y / (s / 22), sd + 4) - 0.5) < 0.035;
      let k = 0.84 + n * 0.3;
      if (crack) k *= 1.3;
      return [clamp(148 * k), clamp(196 * k), clamp(246 * k), crack ? 255 : 205];
    }).img;
  }),
  // ---- 装飾・意匠 ----
  T3("bookshelf", "\u672C\u68DA", "BOOKSHELF", "\u88C5\u98FE\u30FB\u610F\u5320", (s, sd) => {
    const p = new Pt(s);
    const cols = 6;
    return p.fill((x, y) => {
      const inShelf = y > s * 0.14 && y < s * 0.86;
      if (!inShelf) {
        const grain = fbm(x / (s / 3), y / (s / 40), sd, 4);
        const k2 = 0.82 + grain * 0.36 + jit(x, y, sd, 3) / 100;
        return [clamp(178 * k2), clamp(142 * k2), clamp(92 * k2), 255];
      }
      const col = Math.floor(x / s * cols);
      const lx = x / s * cols - col;
      if (lx < 0.08) return [56, 40, 26, 255];
      const tone = hash2(col, 7, sd);
      const hue = [
        [152, 62, 54],
        [58, 92, 152],
        [146, 122, 52],
        [72, 122, 72],
        [112, 72, 132],
        [178, 142, 84]
      ][Math.floor(tone * 6) % 6];
      const top = y < s * 0.22 || y > s * 0.78 ? 1.18 : 1;
      const k = (0.78 + hash2(x, y, sd + col) * 0.24) * top;
      return [clamp(hue[0] * k), clamp(hue[1] * k), clamp(hue[2] * k), 255];
    }).img;
  }),
  T3("pumpkin_face", "\u30B8\u30E3\u30C3\u30AF\u30FB\u30AA\u30FB\u30E9\u30F3\u30BF\u30F3", "JACK O'LANTERN", "\u88C5\u98FE\u30FB\u610F\u5320", (s, sd) => {
    const p = new Pt(s);
    const face = (x, y) => {
      const u = x / s, v = y / s;
      const eyeL = Math.abs(u - 0.3) < 0.09 && Math.abs(v - 0.38) < 0.08;
      const eyeR = Math.abs(u - 0.7) < 0.09 && Math.abs(v - 0.38) < 0.08;
      const nose = Math.abs(u - 0.5) < 0.06 && Math.abs(v - 0.55) < 0.06;
      const mouth = v > 0.68 && v < 0.82 && u > 0.22 && u < 0.78 && Math.floor(u * 12) % 2 === (v > 0.75 ? 1 : 0);
      return eyeL || eyeR || nose || mouth;
    };
    return p.fill((x, y) => {
      const ridge = Math.abs(Math.sin(x / s * Math.PI * 6)) * 0.16;
      const k = 0.86 + fbm(x / (s / 8), y / (s / 8), sd, 3) * 0.26 - ridge + jit(x, y, sd, 3) / 100;
      if (face(x, y)) return [clamp(255 * 0.92), clamp(168 * 0.9), clamp(42 * 0.8), 255];
      return [clamp(214 * k), clamp(118 * k), clamp(28 * k), 255];
    }).img;
  }),
  T3("creeper_face", "\u30AF\u30EA\u30FC\u30D1\u30FC\u306E\u9854", "CREEPER FACE", "\u88C5\u98FE\u30FB\u610F\u5320", (s, sd) => {
    const p = new Pt(s);
    const face = (x, y) => {
      const u = Math.floor(x / s * 8), v = Math.floor(y / s * 8);
      const eyes = (u === 1 || u === 2 || u === 5 || u === 6) && (v === 2 || v === 3);
      const mouth = (u === 3 || u === 4) && v >= 4 && v <= 7 || (u === 2 || u === 5) && (v === 5 || v === 6);
      return eyes || mouth;
    };
    return p.fill((x, y) => {
      if (face(x, y)) return [18, 22, 18, 255];
      const n = fbm(x / (s / 4), y / (s / 4), sd, 4);
      const k = 0.7 + n * 0.6 + jit(x, y, sd, 6) / 100;
      return [clamp(68 * k), clamp(168 * k), clamp(56 * k), 255];
    }).img;
  }),
  T3("tnt", "TNT", "TNT", "\u88C5\u98FE\u30FB\u610F\u5320", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const v = y / s;
      const band = v > 0.3 && v < 0.7;
      const k = 0.86 + fbm(x / (s / 6), y / (s / 6), sd, 3) * 0.28 + jit(x, y, sd, 4) / 100;
      if (band) {
        const u = x / s;
        const letter = u > 0.1 && u < 0.9 && (v > 0.4 && v < 0.6);
        if (letter && Math.floor(u * 4) % 2 === 0) return [236, 232, 224, 255];
        return [clamp(226 * k), clamp(222 * k), clamp(214 * k), 255];
      }
      return [clamp(198 * k), clamp(56 * k), clamp(48 * k), 255];
    }).img;
  }),
  T3("crafting_table", "\u4F5C\u696D\u53F0", "CRAFTING TABLE", "\u88C5\u98FE\u30FB\u610F\u5320", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const u = x / s, v = y / s;
      if (v < 0.28) {
        const grid = (Math.floor(u * 3) + Math.floor(v * 9)) % 2 === 0;
        const k2 = grid ? 1.05 : 0.82;
        const n = 0.86 + fbm(x / (s / 4), y / (s / 12), sd, 3) * 0.28;
        return [clamp(160 * k2 * n), clamp(120 * k2 * n), clamp(74 * k2 * n), 255];
      }
      const grain = fbm(x / (s / 3), y / (s / 30), sd + 1, 4);
      const k = 0.8 + grain * 0.4 + jit(x, y, sd, 3) / 100;
      const tool = Math.abs(u - 0.5) < 0.06 && v > 0.4 && v < 0.8;
      if (tool) return [clamp(120 * k), clamp(90 * k), clamp(60 * k), 255];
      return [clamp(150 * k), clamp(112 * k), clamp(70 * k), 255];
    }).img;
  }),
  // ---- アイテム ----
  T3("diamond_sword", "\u30C0\u30A4\u30E4\u30E2\u30F3\u30C9\u306E\u5263", "DIAMOND SWORD", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemSword(s, sd, "#5ee7e0", "#c9a227")),
  T3("netherite_sword", "\u30CD\u30B6\u30E9\u30A4\u30C8\u306E\u5263", "NETHERITE SWORD", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemSword(s, sd + 2, "#574b52", "#8c6b3f")),
  T3("iron_pickaxe", "\u9244\u306E\u30C4\u30EB\u30CF\u30B7", "IRON PICKAXE", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemPickaxe(s, sd, "#dfe3e8")),
  T3("golden_pickaxe", "\u91D1\u306E\u30C4\u30EB\u30CF\u30B7", "GOLDEN PICKAXE", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemPickaxe(s, sd + 4, "#f8dc55")),
  T3("apple", "\u30EA\u30F3\u30B4", "APPLE", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemApple(s, sd)),
  T3("potion", "\u30DD\u30FC\u30B7\u30E7\u30F3\u74F6", "POTION", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemPotion(s, sd, "#e0436a")),
  T3("potion_mana", "\u9B54\u529B\u306E\u30DD\u30FC\u30B7\u30E7\u30F3", "MANA POTION", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemPotion(s, sd + 8, "#4aa8ff")),
  T3("gold_ingot", "\u91D1\u306E\u5EF6\u3079\u68D2", "GOLD INGOT", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemIngot(s, sd, "#f7d63b")),
  T3("iron_ingot", "\u9244\u306E\u5EF6\u3079\u68D2", "IRON INGOT", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemIngot(s, sd + 6, "#dfe3e8")),
  T3("emerald_gem", "\u30A8\u30E1\u30E9\u30EB\u30C9", "EMERALD", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemGem(s, sd, "#2ee86a")),
  T3("amethyst", "\u30A2\u30E1\u30B8\u30B9\u30C8", "AMETHYST", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemGem(s, sd + 3, "#a765e8")),
  T3("bow", "\u5F13", "BOW", "\u30A2\u30A4\u30C6\u30E0", (s, sd) => itemBow(s, sd)),
  T3("blank", "\u7A7A\u767D (\u900F\u660E)", "BLANK", "\u30A2\u30A4\u30C6\u30E0", (s) => new Pt(s).img)
];
var TEX_BY_ID = new Map(TEXTURES.map((t) => [t.id, t]));
function generateTexture(id, size, seed) {
  const t = TEX_BY_ID.get(id);
  if (!t) return new ImageData(size, size);
  return t.gen(Math.max(8, Math.min(256, size)), seed);
}

// src/lib/presets.ts
var PRESETS = [
  {
    id: "legendary",
    name: "\u4F1D\u8AAC\u306E\u5263",
    en: "LEGENDARY BLADE",
    accent: "#ff9f2e",
    desc: "\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8\u306E\u8F1D\u304D\u3068\u30EC\u30A2\u30EA\u30C6\u30A3\u30AA\u30FC\u30E9\u3092\u7E8F\u3063\u305F\u82F1\u96C4\u306E\u6B66\u5668",
    tex: "diamond_sword",
    size: 32,
    fx: [
      { id: "sharpen", values: { amt: 90 } },
      { id: "outline", values: { color: "#0e1a22", thick: 1, mode: "outer" } },
      { id: "bevel", values: { amt: 55, angle: 315 } },
      { id: "rarityAura", values: { rarity: "legendary", radius: 4, intensity: 105, speed: 1.4 } },
      { id: "enchantGlint", values: { speed: 1.2, width: 10, intensity: 95, bands: 2 } },
      { id: "bloom", values: { threshold: 150, radius: 3, intensity: 95 } }
    ]
  },
  {
    id: "relic",
    name: "\u53E4\u4EE3\u306E\u907A\u7269",
    en: "ARCANE RELIC",
    accent: "#63d8ff",
    desc: "\u30EB\u30FC\u30F3\u6587\u5B57\u304C\u660E\u6EC5\u3059\u308B\u3001\u907A\u8DE1\u304B\u3089\u51FA\u571F\u3057\u305F\u77F3\u677F",
    tex: "end_stone",
    size: 32,
    fx: [
      { id: "cracks", values: { count: 5, depth: 20 } },
      { id: "grime", values: { amount: 45, edges: true } },
      { id: "sepia", values: { amt: 35 } },
      { id: "runes", values: { color: "#63d8ff", count: 3, glow: 70, speed: 0.9 } },
      { id: "innerShadow", values: { size: 5, op: 60 } },
      { id: "vignette", values: { amount: 55, radius: 55 } }
    ]
  },
  {
    id: "ruin",
    name: "\u82D4\u3080\u3059\u5EC3\u589F",
    en: "MOSSY RUIN",
    accent: "#b6e14f",
    desc: "\u98A8\u306B\u524A\u3089\u308C\u82D4\u306B\u8986\u308F\u308C\u305F\u53E4\u3044\u77F3\u7573",
    tex: "cobblestone",
    size: 32,
    fx: [
      { id: "moss", values: { coverage: 52, topOnly: false, scale: 8 } },
      { id: "grime", values: { amount: 55, color: "#241c12" } },
      { id: "erosion", values: { amount: 34, mode: "tatter", scale: 5 } },
      { id: "bevel", values: { amt: 62, angle: 300 } },
      { id: "vibrance", values: { amt: 30 } },
      { id: "vignette", values: { amount: 34, radius: 66 } }
    ]
  },
  {
    id: "nether",
    name: "\u30CD\u30B6\u30FC\u306E\u707C\u71B1",
    en: "NETHER HEAT",
    accent: "#ff5a2b",
    desc: "\u6EB6\u5CA9\u306E\u8108\u304C\u8108\u52D5\u3057\u706B\u306E\u7C89\u304C\u821E\u3046\u707C\u71B1\u306E\u5CA9",
    tex: "netherrack",
    size: 32,
    fx: [
      { id: "lavaCracks", values: { count: 6, glow: 85, speed: 1.4 } },
      { id: "temperature", values: { amt: 45 } },
      { id: "cracks", values: { count: 4, color: "#180a06", depth: 22 } },
      { id: "ember", values: { count: 34, speed: 1.4, glow: true } },
      { id: "bloom", values: { threshold: 120, radius: 4, intensity: 130 } },
      { id: "vignette", values: { amount: 40, color: "#2a0600" } }
    ]
  },
  {
    id: "frosted",
    name: "\u51CD\u3066\u3064\u304F\u6C37\u971C",
    en: "FROSTBOUND",
    accent: "#8fd8ff",
    desc: "\u971C\u306E\u7D50\u6676\u304C\u7E01\u3092\u8986\u3044\u3001\u96EA\u304C\u964D\u308A\u7A4D\u3082\u308B",
    tex: "iron_block",
    size: 32,
    fx: [
      { id: "frost", values: { amount: 62, crystal: 60, edge: 70 } },
      { id: "temperature", values: { amt: -40 } },
      { id: "snowfall", values: { count: 20, size: 1, frost: true, speed: 0.7 } },
      { id: "innerGlow", values: { color: "#dff4ff", size: 4, intensity: 60 } },
      { id: "chromatic", values: { amount: 1, edgeOnly: true } },
      { id: "sharpen", values: { amt: 80 } }
    ]
  },
  {
    id: "retrogb",
    name: "\u30EC\u30C8\u30ED\u643A\u5E2F\u6A5F",
    en: "RETRO HANDHELD",
    accent: "#9bbc0f",
    desc: "4\u968E\u8ABF\u30B0\u30EA\u30FC\u30F3\uFF0B\u30C7\u30A3\u30B6\u306E\u61D0\u304B\u3057\u30B2\u30FC\u30E0\u6A5F\u98A8",
    tex: "grass_top",
    size: 16,
    fx: [
      { id: "grayscale", values: { amt: 100 } },
      { id: "levels", values: { bin: 12, win: 236 } },
      { id: "gradientMap", values: { c1: "#0f380f", c2: "#306230", c3: "#9bbc0f", amt: 100 } },
      { id: "ditherBayer", values: { order: "2", colors: 4, spread: 60 } },
      { id: "scanline", values: { gap: 2, op: 22 } }
    ]
  },
  {
    id: "cyberholo",
    name: "\u30B5\u30A4\u30D0\u30FC\u30FB\u30DB\u30ED",
    en: "CYBER HOLO",
    accent: "#37d6c4",
    desc: "\u30DB\u30ED\u30B0\u30E9\u30E0\u7B94\u3068\u30B0\u30EA\u30C3\u30C1\u304C\u8D70\u308B\u8FD1\u672A\u6765\u30C1\u30C3\u30D7",
    tex: "diamond_block",
    size: 32,
    fx: [
      { id: "circuit", values: { density: 6, glow: 70, speed: 1.2 } },
      { id: "holographic", values: { intensity: 85, speed: 1, scale: 14 } },
      { id: "chromatic", values: { amount: 1.5, edgeOnly: true } },
      { id: "glitch", values: { amount: 22, slices: 5, speed: 5 } },
      { id: "bloom", values: { threshold: 160, radius: 3, intensity: 110 } },
      { id: "hexPattern", values: { size: 6, op: 22 } }
    ]
  },
  {
    id: "royal",
    name: "\u738B\u5BB6\u306E\u9EC4\u91D1",
    en: "ROYAL GOLD",
    accent: "#ffe066",
    desc: "\u91D1\u7B94\u62BC\u3057\u3068\u8C6A\u83EF\u306A\u984D\u7E01\u3001\u5B9D\u77F3\u3092\u5D4C\u3081\u305F\u81F3\u5B9D",
    tex: "gold_block",
    size: 32,
    fx: [
      { id: "frame", values: { style: "ornate", thick: 3, color: "#8c5a12", shade: 75 } },
      { id: "embossGold", values: { amount: 70, angle: 315 } },
      { id: "gemInlay", values: { color: "#e0405a", count: 4, size: 2, shine: true } },
      { id: "lightSweep", values: { speed: 0.7, width: 10, intensity: 90 } },
      { id: "bloom", values: { threshold: 190, radius: 3, intensity: 90 } },
      { id: "rivets", values: { spacing: 7, size: 1, inset: 4 } }
    ]
  },
  {
    id: "dream",
    name: "\u30C9\u30EA\u30FC\u30E0\u30DD\u30C3\u30D7",
    en: "DREAM POP",
    accent: "#ef5f8c",
    desc: "\u8679\u8272\u306E\u8584\u819C\u3068\u304D\u3089\u3081\u304D\u306B\u5305\u307E\u308C\u305F\u5922\u898B\u5FC3\u5730",
    tex: "wool",
    size: 32,
    fx: [
      { id: "iridescent", values: { amount: 85, scale: 14, angle: 40, speed: 0.6 } },
      { id: "vibrance", values: { amt: 60 } },
      { id: "sparkle", values: { count: 16, size: 2, speed: 1.4 } },
      { id: "bloom", values: { threshold: 130, radius: 4, intensity: 120 } },
      { id: "wetLook", values: { amount: 40, spec: 45 } }
    ]
  },
  {
    id: "cursed",
    name: "\u546A\u308F\u308C\u3057\u9271\u77F3",
    en: "CURSED ORE",
    accent: "#b45cff",
    desc: "\u7D2B\u306E\u4E8C\u8272\u8ABF\u3068\u30B0\u30EA\u30C3\u30C1\u304C\u6EF2\u3080\u7981\u5FCC\u306E\u9271\u77F3",
    tex: "diamond_ore",
    size: 32,
    fx: [
      { id: "duotone", values: { dark: "#160a2c", light: "#b45cff", amt: 70 } },
      { id: "outerGlow", values: { color: "#8a2be2", radius: 5, intensity: 110 } },
      { id: "runes", values: { color: "#e0a8ff", count: 2, scale: 1, glow: 55, speed: 1.4 } },
      { id: "glitch", values: { amount: 18, slices: 4, speed: 3, rgbSplit: true } },
      { id: "soulFlame", values: { c1: "#e6c8ff", c2: "#6a2bd0", intensity: 70, reach: 4 } }
    ]
  },
  {
    id: "antique",
    name: "\u30A2\u30F3\u30C6\u30A3\u30FC\u30AF\u7D75\u753B",
    en: "ANTIQUE",
    accent: "#c9a227",
    desc: "\u30BB\u30D4\u30A2\u306E\u30B7\u30DF\u3068\u50B7\u3001\u984D\u7E01\u5165\u308A\u306E\u53E4\u7F8E\u8853\u54C1",
    tex: "oak_planks",
    size: 32,
    fx: [
      { id: "sepia", values: { amt: 70 } },
      { id: "scratches", values: { count: 22, op: 40 } },
      { id: "grain", values: { amt: 22, cell: 1 } },
      { id: "grime", values: { amount: 38, edges: true } },
      { id: "frame", values: { style: "gold", thick: 2, color: "#8a6a2c", shade: 70 } },
      { id: "vignette", values: { amount: 52, radius: 58 } }
    ]
  },
  {
    id: "forge",
    name: "\u6EB6\u5CA9\u306E\u935B\u9020",
    en: "MAGMA FORGE",
    accent: "#ff7a2b",
    desc: "\u9306\u3073\u305F\u9244\u306B\u6EB6\u5CA9\u306E\u4E80\u88C2\u304C\u8D70\u308B\u935B\u51B6\u306E\u540D\u6B8B",
    tex: "iron_block",
    size: 32,
    fx: [
      { id: "brushedMetal", values: { amount: 55, specular: true } },
      { id: "rust", values: { amount: 55, pits: true } },
      { id: "lavaCracks", values: { count: 4, glow: 60, speed: 0.8 } },
      { id: "bevel", values: { amt: 45, angle: 300 } },
      { id: "ember", values: { count: 18, speed: 0.8 } },
      { id: "temperature", values: { amt: 28 } }
    ]
  },
  {
    id: "divine",
    name: "\u795E\u6027\u306E\u8F1D\u304D",
    en: "DIVINE",
    accent: "#ffe066",
    desc: "\u9B54\u6CD5\u9663\u3068\u30AA\u30FC\u30E9\u3001\u5149\u306E\u5E2F\u304C\u5DE1\u308B\u8056\u907A\u7269",
    tex: "emerald_gem",
    size: 48,
    fx: [
      { id: "rarityAura", values: { rarity: "divine", radius: 6, intensity: 130, speed: 1 } },
      { id: "sigil", values: { color: "#ffe066", rings: 2, ticks: 12, speed: 0.5, glow: 40 } },
      { id: "lightSweep", values: { speed: 0.5, width: 14, intensity: 110, color: "#fff6d0" } },
      { id: "sparkle", values: { count: 14, size: 2, speed: 1.6 } },
      { id: "bloom", values: { threshold: 140, radius: 4, intensity: 140 } },
      { id: "innerGlow", values: { color: "#fffbe6", size: 5, intensity: 90 } }
    ]
  },
  {
    id: "arcade",
    name: "\u30A2\u30FC\u30B1\u30FC\u30C9\u7B50\u4F53",
    en: "ARCADE CRT",
    accent: "#59a7ff",
    desc: "\u8D70\u67FB\u7DDA\u3068RGB\u30DE\u30B9\u30AF\u3001\u6EF2\u307F\u306E\u3042\u308B\u30D6\u30E9\u30A6\u30F3\u7BA1\u8868\u793A",
    tex: "tnt",
    size: 32,
    fx: [
      { id: "saturation", values: { amt: 35 } },
      { id: "crt", values: { scan: 42, mask: 30, bloom: 45, curve: 40, flicker: 18 } },
      { id: "chromatic", values: { amount: 1.2 } },
      { id: "scanline", values: { gap: 3, op: 18, bright: true } },
      { id: "bloom", values: { threshold: 150, radius: 2, intensity: 60 } }
    ]
  }
];
export {
  ALL_FX,
  PRESETS,
  TEXTURES,
  defaults,
  generateTexture,
  makeInst,
  renderPipeline
};
