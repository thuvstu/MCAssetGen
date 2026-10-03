import {
  clone, clamp, clamp01, hexToRgb, rgbToHsl, hslToRgb, luminance, mulberry32, fract, lerp,
  boxBlur, setPx, overPx, addPx, screenPx, linePx, discPx, ringPx, getAlpha,
  fbm, valueNoise, hash2, warpNoise,
} from "./fxutil";
import type { EffectDef, ParamSpec } from "./effects";

// ---- 定義ヘルパ（effects.ts と同一仕様）----
const R = (key: string, label: string, min: number, max: number, step: number, dv: number, unit?: string): ParamSpec =>
  ({ key, label, type: "range", min, max, step, def: dv, unit });
const C = (key: string, label: string, dv: string): ParamSpec => ({ key, label, type: "color", def: dv });
const S = (key: string, label: string, dv: string, options: [string, string][]): ParamSpec =>
  ({ key, label, type: "select", def: dv, options: options.map(([v, l]) => ({ v, l })) });
const T = (key: string, label: string, dv: boolean): ParamSpec => ({ key, label, type: "toggle", def: dv });
const mk = (
  id: string, name: string, en: string, cat: EffectDef["cat"], desc: string, icon: string,
  params: ParamSpec[], apply: EffectDef["apply"], animated = false,
): EffectDef => ({ id, name, en, cat, desc, icon, params, apply, animated });

/** α マスク (0..1) */
function maskOf(img: ImageData) {
  const m = new Float32Array(img.width * img.height);
  for (let i = 0; i < m.length; i++) m[i] = img.data[i * 4 + 3] / 255;
  return m;
}

// ============================================================
//  ルーン文字グリフ (5x7)
// ============================================================
const GLYPHS = [
  ["01110", "10001", "10000", "11110", "10000", "10001", "01110"],
  ["11111", "00100", "00100", "00100", "00100", "10101", "01010"],
  ["10001", "01010", "00100", "11111", "00100", "01010", "10001"],
  ["01110", "10001", "00100", "00100", "00100", "00100", "00100"],
  ["11111", "01010", "01010", "11111", "00100", "00100", "00100"],
  ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  ["00100", "01110", "10101", "11111", "10101", "01110", "00100"],
  ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  ["00000", "01110", "11011", "11111", "11011", "01110", "00000"],
  ["10101", "01010", "10101", "01010", "10101", "01010", "10101"],
];

// ============================================================
//  3. 装飾デコレーション
// ============================================================
const DECOR_FX: EffectDef[] = [
  mk("frame", "額縁フレーム", "ORNATE FRAME", "decor", "外周を装飾枠で囲む", "frame",
    [S("style", "様式", "gold", [["gold", "黄金"], ["stone", "石造"], ["tech", "機械"], ["ornate", "豪華"], ["bone", "骨白"]]),
    R("thick", "太さ", 1, 8, 1, 2), C("color", "色", "#e0b23c"), R("shade", "陰影", 0, 100, 1, 60), T("inner", "内側ライン", true), T("glow", "発光", false)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), th = Math.max(1, v.thick | 0), sh = v.shade / 100;
      const rnd = mulberry32(4242);
      const tex: number[] = [];
      for (let i = 0; i < w * h; i++) tex.push(v.style === "stone" || v.style === "bone" ? rnd() * 0.5 + 0.5 : v.style === "tech" ? (rnd() > 0.85 ? 1.25 : 1) : 1);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const dTop = y, dBot = h - 1 - y, dL = x, dRt = w - 1 - x;
          const dist = Math.min(dTop, dBot, dL, dRt);
          if (dist >= th) continue;
          const isInner = dist === th - 1 && v.inner;
          // 光源: 左上
          let k = 1;
          const edge = dist / Math.max(1, th - 0.001);
          if (dTop === dist) k += 0.42 * sh;
          if (dL === dist) k += 0.28 * sh;
          if (dBot === dist) k -= 0.45 * sh;
          if (dRt === dist) k -= 0.32 * sh;
          k += (1 - edge) * 0.14 * sh;
          k *= tex[y * w + x];
          if (v.style === "ornate") {
            const corner = Math.min(x, y, w - 1 - x, h - 1 - y);
            if (corner < th + 1 && dist < th - 0.2) k *= 1.28;
            if (((x + y) % 3) === 0 && dist === 0) k *= 0.86;
          }
          if (v.style === "tech" && ((x + y) % 4 < 2) && dist === th - 1) k *= 0.7;
          const r = clamp(c.r * k), g = clamp(c.g * k), b = clamp(c.b * k);
          if (isInner) { overPx(img, x, y, r * 0.55, g * 0.55, b * 0.55, 255); }
          else overPx(img, x, y, r, g, b, 255);
          if (v.glow) screenPx(img, x, y, r, g, b, 60);
        }
    }),

  mk("cornerOrnament", "コーナー装飾", "CORNER ORNAMENT", "decor", "四隅に飾りを打つ", "corner",
    [S("style", "様式", "flourish", [["flourish", "蔦曲線"], ["plate", "金具"], ["gem", "宝石"], ["spike", "棘"]]),
    C("color", "色", "#f3d27a"), R("size", "大きさ", 2, 12, 1, 5), R("op", "不透明度", 0, 100, 1, 100)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), s = v.size | 0, a = v.op / 100 * 255;
      const corners: [number, number, number, number][] = [[1, 1, 1, 1], [w - 2, 1, -1, 1], [1, h - 2, 1, -1], [w - 2, h - 2, -1, -1]];
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
    }),

  mk("borderTrim", "縁トリム", "METAL TRIM", "decor", "1px の縁取りを金属調に", "trim",
    [C("color", "色", "#ffd97a"), R("inset", "内側距離", 0, 6, 1, 0), R("thick", "太さ", 1, 3, 1, 1), S("pattern", "模様", "solid", [["solid", "実線"], ["dash", "破線"], ["dot", "点線"], ["double", "二重"]]), T("shine", "ハイライト", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), ins = v.inset | 0, th = v.thick | 0;
      const m = maskOf(img);
      const on = (x: number, y: number) => m[y * w + x] > 0.2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!on(x, y)) continue;
          // 内側から ins+th の範囲かつ、それ以上内側が埋まっている＝縁
          let d = -1;
          for (let r = 0; r <= ins + th + 2; r++) {
            const empty = !on(x + r, y) || !on(x - r, y) || !on(x, y + r) || !on(x, y - r);
            if (empty) { d = r; break; }
          }
          if (d < ins || d >= ins + th) continue;
          let draw = true;
          if (v.pattern === "dash") draw = ((x + y) >> 1) % 2 === 0;
          if (v.pattern === "dot") draw = (x + y) % 3 === 0;
          if (!draw) continue;
          const k = v.shine ? (y < h / 2 && x < w / 2 ? 1.25 : x > w / 2 && y > h / 2 ? 0.72 : 1) : 1;
          overPx(img, x, y, clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255);
          if (v.pattern === "double" && d === ins + th - 1) overPx(img, x, y, clamp(c.r * 0.6), clamp(c.g * 0.6), clamp(c.b * 0.6), 255);
        }
    }),

  mk("gemInlay", "宝石インレイ", "GEM INLAY", "decor", "ファセット付き宝石を埋め込む", "gem",
    [C("color", "色", "#54e0c8"), R("count", "個数", 1, 14, 1, 4), R("size", "大きさ", 1, 6, 1, 3), T("shine", "きらめき", true), R("seed", "配置乱数", 0, 999, 1, 7)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), rnd = mulberry32(v.seed * 31 + 5);
      const solids: [number, number][] = [];
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (getAlpha(img, x, y) > 200) solids.push([x, y]);
      if (!solids.length) return;
      for (let k = 0; k < v.count; k++) {
        const p = solids[Math.floor(rnd() * solids.length)];
        const r = Math.max(1, v.size | 0);
        for (let y = -r; y <= r; y++)
          for (let x = -r; x <= r; x++) {
            const dd = Math.abs(x) + Math.abs(y);
            if (dd > r + 0.4) continue;
            const light = 1 - (x + y) / (r * 2.2 + 0.001);
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
    }),

  mk("sparkle", "きらめき", "SPARKLE", "decor", "十字の星型ハイライト", "spark",
    [R("count", "数", 1, 40, 1, 10), R("size", "サイズ", 1, 6, 1, 2), C("color", "色", "#ffffff"), R("speed", "点滅速度", 0, 4, 0.1, 1.2), R("seed", "配置", 0, 999, 1, 21)],
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
        if (s >= 2) { addPx(img, x + 1, y + 1, c.r, c.g, c.b, a * 0.35); addPx(img, x - 1, y - 1, c.r, c.g, c.b, a * 0.35); addPx(img, x + 1, y - 1, c.r, c.g, c.b, a * 0.35); addPx(img, x - 1, y + 1, c.r, c.g, c.b, a * 0.35); }
      }
    }, true),

  mk("ember", "炎の粒子", "EMBERS", "decor", "立ち上る火の粉", "fire",
    [R("count", "数", 4, 90, 1, 26), C("color", "色", "#ff9a3c"), C("core", "核色", "#ffe9a8"), R("speed", "上昇速度", 0.2, 4, 0.1, 1.2), R("size", "サイズ", 1, 3, 1, 1), T("glow", "発光", true), R("seed", "配置", 0, 999, 1, 5)],
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
        if (s >= 2) { addPx(img, px + 1, py, c.r, c.g, c.b, a * 0.4); addPx(img, px - 1, py, c.r, c.g, c.b, a * 0.4); addPx(img, px, py + 1, c.r, c.g, c.b, a * 0.35); }
        if (s >= 3 || rnd() > 0.7) addPx(img, px, py, cc.r, cc.g, cc.b, a * 0.7);
      }
    }, true),

  mk("snowfall", "雪", "SNOWFALL", "decor", "降り積もる雪と氷の粒", "snow",
    [R("count", "数", 4, 90, 1, 24), R("size", "サイズ", 1, 3, 1, 1), R("speed", "速度", 0.2, 3, 0.1, 0.9), T("frost", "地表に積雪", true), R("seed", "配置", 0, 999, 1, 9)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, s = Math.max(1, v.size | 0);
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(v.seed * 71 + k * 4409 + 3);
        const x0 = rnd() * w, y0 = rnd() * h, sp = 0.4 + rnd() * 0.9;
        const y = ((y0 + ctx.t * v.speed * 11 * sp) % h + h) % h;
        const x = ((x0 + Math.sin(ctx.t * 1.1 * sp + k) * 2.2) % w + w) % w;
        const px = Math.round(x), py = Math.round(y);
        overPx(img, px, py, 255, 255, 255, 235);
        if (s >= 2) { overPx(img, px + 1, py, 240, 248, 255, 170); overPx(img, px, py + 1, 240, 248, 255, 170); }
        if (s >= 3) { overPx(img, px - 1, py, 230, 240, 255, 120); overPx(img, px, py - 1, 230, 240, 255, 120); }
      }
      if (v.frost) {
        const m = maskOf(img);
        for (let x = 0; x < w; x++) {
          let top = -1;
          for (let y = 0; y < h; y++) if (m[y * w + x] > 0.3) { top = y; break; }
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
    }, true),

  mk("rain", "雨", "RAIN", "decor", "斜めに流れる雨粒", "rain",
    [R("count", "数", 6, 90, 1, 28), R("speed", "速度", 0.5, 6, 0.1, 2.4), R("len", "長さ", 1, 6, 1, 3), C("color", "色", "#bfe4ff"), R("angle", "傾き", -45, 45, 1, 14), R("seed", "配置", 0, 999, 1, 3)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), a = (v.angle * Math.PI) / 180;
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
    }, true),

  mk("starfield", "星屑", "STARFIELD", "decor", "瞬く星の海", "star",
    [R("count", "数", 4, 80, 1, 22), R("speed", "瞬き", 0, 4, 0.1, 1), C("c1", "色1", "#ffffff"), C("c2", "色2", "#8fd0ff"), R("seed", "配置", 0, 999, 1, 44)],
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
    }, true),

  mk("runes", "古代ルーン", "ARCANE RUNES", "decor", "発光する魔法文字を刻む", "rune",
    [C("color", "色", "#63d8ff"), R("count", "数", 1, 10, 1, 3), R("scale", "拡大", 1, 3, 1, 1), R("glow", "発光", 0, 100, 1, 60), R("speed", "明滅", 0, 3, 0.1, 0.8), R("seed", "配置", 0, 999, 1, 12)],
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
    }, true),

  mk("sigil", "魔法陣", "ARCANE SIGIL", "decor", "回転する魔法陣リング", "sigil",
    [C("color", "色", "#c79bff"), R("rings", "輪数", 1, 4, 1, 2), R("speed", "回転", 0, 3, 0.1, 0.6), R("glow", "発光", 0, 100, 1, 45), R("ticks", "目盛り", 0, 24, 1, 8)],
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
          const ang = rot + (k / v.ticks) * Math.PI * 2;
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
    }, true),

  mk("rivets", "鋲 / リベット", "RIVETS", "decor", "金属板の打ち付け鋲", "rivet",
    [C("color", "色", "#c9d3de"), R("spacing", "間隔", 3, 14, 1, 6), R("size", "サイズ", 1, 3, 1, 1), R("inset", "端からの距離", 0, 6, 1, 1), T("shade", "陰影", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), sp = Math.max(3, v.spacing | 0), s = v.size | 0;
      const m = maskOf(img);
      const place = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= w || y >= h || m[y * w + x] < 0.3) return;
        discPx(img, x, y, s + 0.2, clamp(c.r * 0.55), clamp(c.g * 0.55), clamp(c.b * 0.55), 255);
        discPx(img, x, y, s * 0.72, c.r, c.g, c.b, 255);
        if (v.shade) {
          overPx(img, x - (s > 1 ? 1 : 0), y - (s > 1 ? 1 : 0), 255, 255, 255, 150);
          overPx(img, x + (s > 1 ? 1 : 0), y + (s > 1 ? 1 : 0), clamp(c.r * 0.4), clamp(c.g * 0.4), clamp(c.b * 0.4), 140);
        }
      };
      for (let x = v.inset; x < w - v.inset; x += sp) { place(x, v.inset); place(x, h - 1 - v.inset); }
      for (let y = v.inset + sp; y < h - v.inset - sp + 1; y += sp) { place(v.inset, y); place(w - 1 - v.inset, y); }
    }),

  mk("circuit", "回路模様", "CIRCUITRY", "decor", "機械的な配線パターン", "circuit",
    [C("color", "色", "#43f0c0"), R("density", "密度", 2, 16, 1, 7), R("glow", "発光", 0, 100, 1, 55), R("speed", "パルス", 0, 3, 0.1, 1), R("seed", "配置", 0, 999, 1, 8)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), rnd = mulberry32(v.seed * 977 + 31), m = maskOf(img);
      const lines = Math.max(1, Math.round((w * h) / (v.density * v.density * 12)));
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
    }, true),

  mk("hexPattern", "六角グリッド", "HEX GRID", "decor", "ハニカム模様の重ね焼き", "hex",
    [C("color", "色", "#8be9ff"), R("size", "セル", 3, 14, 1, 6), R("op", "濃さ", 0, 100, 1, 30), T("fill", "塗りつぶし", false)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), s = Math.max(3, v.size | 0), a = v.op / 100 * 255;
      const hh = s * Math.sqrt(3) / 2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (img.data[(y * w + x) << 2 | 3] === 0) continue;
          const col = Math.round(x / (s * 1.5));
          const rowOff = (col % 2) * hh;
          const row = Math.round((y - rowOff) / hh);
          const cx = col * s * 1.5, cy = row * hh + rowOff;
          const dx = Math.abs(x - cx) / s, dy = Math.abs(y - cy) / hh;
          const inside = dx <= 1 && (dx + dy * 0.577) <= 1.16;
          const edge = inside && (dx > 0.82 || dx + dy * 0.577 > 1.0);
          if (edge || (v.fill && inside)) {
            const k = edge ? 1 : 0.45;
            screenPx(img, x, y, c.r, c.g, c.b, a * k);
          }
        }
    }),
];

// ============================================================
//  4. マテリアル / 質感
// ============================================================
const MATERIAL_FX: EffectDef[] = [
  mk("cracks", "ひび割れ", "CRACKS", "material", "表面に走る亀裂", "crack",
    [R("count", "本数", 1, 14, 1, 4), C("color", "色", "#1b1410"), R("width", "太さ", 1, 2, 1, 1), R("depth", "長さ", 4, 40, 1, 18), T("highlight", "縁を明るく", true), R("seed", "配置", 0, 999, 1, 17)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), rnd = mulberry32(v.seed * 613 + 7), m = maskOf(img);
      for (let k = 0; k < v.count; k++) {
        let x = 1 + Math.floor(rnd() * (w - 2)), y = 1 + Math.floor(rnd() * (h - 2));
        let ang = rnd() * Math.PI * 2;
        const steps = Math.round(v.depth * (0.6 + rnd() * 0.8));
        for (let i = 0; i < steps; i++) {
          ang += (rnd() - 0.5) * 1.25;
          x += Math.round(Math.cos(ang)); y += Math.round(Math.sin(ang));
          if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) break;
          if (m[y * w + x] < 0.25) { ang += 1.4; continue; }
          overPx(img, x, y, c.r, c.g, c.b, 235);
          if (v.width >= 2) overPx(img, x + (rnd() > 0.5 ? 1 : 0), y, c.r, c.g, c.b, 200);
          if (v.highlight) {
            overPx(img, x, y + 1, clamp(c.r + 70), clamp(c.g + 66), clamp(c.b + 60), 90);
            overPx(img, x + 1, y, clamp(c.r + 60), clamp(c.g + 58), clamp(c.b + 52), 70);
          }
          if (rnd() > 0.86) ang += (rnd() > 0.5 ? 1 : -1) * 0.9;
        }
      }
    }),

  mk("moss", "苔むす", "MOSS OVERGROWTH", "material", "湿った苔が広がる", "moss",
    [R("coverage", "覆盖率", 0, 100, 1, 42), C("c1", "明るい苔", "#7fbf3f"), C("c2", "暗い苔", "#33521d"), R("scale", "粒度", 2, 16, 1, 7), T("topOnly", "上面のみ", true), R("seed", "乱数", 0, 999, 1, 4)],
    (img, v) => {
      const w = img.width, h = img.height, a = hexToRgb(v.c1), b = hexToRgb(v.c2), m = maskOf(img), sc = v.scale;
      const cov = v.coverage / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (m[y * w + x] < 0.25) continue;
          let n = fbm(x / sc, y / sc, v.seed * 13, 4);
          if (v.topOnly) n *= clamp01(1 - y / (h * 0.85)) * 1.35;
          if (n < 1 - cov) continue;
          const t = clamp01((n - (1 - cov)) / Math.max(0.001, cov));
          const speck = hash2(x, y, v.seed) > 0.72 ? 1.18 : 0.88;
          overPx(img, x, y,
            clamp(lerp(b.r, a.r, t) * speck), clamp(lerp(b.g, a.g, t) * speck), clamp(lerp(b.b, a.b, t) * speck),
            clamp(120 + t * 135));
        }
    }),

  mk("grime", "汚れ / グライム", "GRIME", "material", "染み込んだ汚れと煤", "grime",
    [R("amount", "量", 0, 100, 1, 40), C("color", "色", "#2a2016"), R("scale", "粒度", 2, 20, 1, 8), T("edges", "縁に溜める", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.amount / 100;
      const m = maskOf(img);
      const edgeDist = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (m[y * w + x] < 0.2) { edgeDist[y * w + x] = 0; continue; }
        let d = 99;
        for (let r = 1; r <= 3; r++) {
          if (m[clamp(y - r, 0, h - 1) * w + x] < 0.2 || m[clamp(y + r, 0, h - 1) * w + x] < 0.2 ||
            m[y * w + clamp(x - r, 0, w - 1)] < 0.2 || m[y * w + clamp(x + r, 0, w - 1)] < 0.2) { d = r; break; }
        }
        edgeDist[y * w + x] = d;
      }
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          let n = warpNoise(x / v.scale, y / v.scale, 91, 0.8);
          if (v.edges) n = clamp01(n * (edgeDist[y * w + x] < 2 ? 1.5 : 0.85));
          const amt = clamp01((n - (1 - k)) / Math.max(0.001, k)) * 0.85;
          if (amt <= 0) continue;
          img.data[i] = clamp(img.data[i] * (1 - amt) + c.r * amt);
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - amt) + c.g * amt);
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - amt) + c.b * amt);
        }
    }),

  mk("scratches", "傷", "SCRATCHES", "material", "使い込まれた擦り傷", "scratch",
    [R("count", "本数", 1, 40, 1, 12), R("length", "長さ", 2, 20, 1, 7), R("op", "濃さ", 0, 100, 1, 45), T("light", "明るい傷", true), R("seed", "乱数", 0, 999, 1, 23)],
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
          const i2 = (py * w + px) << 2;
          if (v.light) {
            img.data[i2] = clamp(img.data[i2] + 90 * k * fall); img.data[i2 + 1] = clamp(img.data[i2 + 1] + 88 * k * fall); img.data[i2 + 2] = clamp(img.data[i2 + 2] + 82 * k * fall);
          } else {
            img.data[i2] = clamp(img.data[i2] * (1 - 0.55 * k * fall)); img.data[i2 + 1] = clamp(img.data[i2 + 1] * (1 - 0.55 * k * fall)); img.data[i2 + 2] = clamp(img.data[i2 + 2] * (1 - 0.55 * k * fall));
          }
        }
      }
    }),

  mk("rust", "錆", "RUST", "material", "浮き上がった酸化鉄", "rust",
    [R("amount", "量", 0, 100, 1, 45), C("c1", "赤錆", "#8a4a22"), C("c2", "黄錆", "#c98f3c"), R("scale", "粒度", 2, 14, 1, 6), T("pits", "腐食穴", true)],
    (img, v) => {
      const w = img.width, h = img.height, a = hexToRgb(v.c1), b = hexToRgb(v.c2), k = v.amount / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
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
            img.data[i] *= 0.5; img.data[i + 1] *= 0.5; img.data[i + 2] *= 0.5;
          }
        }
    }),

  mk("frost", "霜 / 氷結", "FROST", "material", "凍りついた結晶の膜", "frost",
    [R("amount", "量", 0, 100, 1, 55), C("color", "色", "#cfeeff"), R("crystal", "結晶", 0, 100, 1, 45), R("edge", "縁の強調", 0, 100, 1, 60), T("cool", "寒色化", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.amount / 100, m = maskOf(img);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const n = fbm(x / 3.2, y / 3.2, 5150, 5);
          const n2 = valueNoise(x * 0.9, y * 0.9, 77);
          let amt = clamp01((n - (1 - k)) / Math.max(0.02, k)) * 0.8;
          // 縁に近いほど凍る
          let near = 9;
          for (let r = 1; r <= 4; r++) {
            if (!m[clamp(y - r, 0, h - 1) * w + x] || !m[clamp(y + r, 0, h - 1) * w + x] || !m[y * w + clamp(x - r, 0, w - 1)] || !m[y * w + clamp(x + r, 0, w - 1)]) { near = r; break; }
          }
          if (near <= 4) amt += (v.edge / 100) * (1 - near / 5) * 0.7;
          amt = clamp01(amt);
          if (v.cool) { img.data[i] = clamp(img.data[i] * (1 - amt * 0.16)); img.data[i + 1] = clamp(img.data[i + 1] * (1 - amt * 0.04)); img.data[i + 2] = clamp(img.data[i + 2] * (1 + amt * 0.2)); }
          img.data[i] = clamp(img.data[i] + (c.r - img.data[i]) * amt * 0.75);
          img.data[i + 1] = clamp(img.data[i + 1] + (c.g - img.data[i + 1]) * amt * 0.75);
          img.data[i + 2] = clamp(img.data[i + 2] + (c.b - img.data[i + 2]) * amt * 0.75);
          if (v.crystal > 0 && n2 > 0.82 && amt > 0.2) screenPx(img, x, y, 255, 255, 255, v.crystal * 1.7);
        }
    }),

  mk("lavaCracks", "溶岩の亀裂", "MAGMA VEINS", "material", "脈動する灼熱の筋", "lava",
    [R("count", "本数", 1, 12, 1, 5), C("core", "核色", "#ffe27a"), C("outer", "外側色", "#e2431a"), R("glow", "発光", 0, 100, 1, 70), R("speed", "脈動", 0, 3, 0.1, 1), R("seed", "乱数", 0, 999, 1, 6)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, core = hexToRgb(v.core), out = hexToRgb(v.outer), rnd = mulberry32(v.seed * 149 + 3), m = maskOf(img);
      const pulse = 0.62 + 0.38 * Math.sin(ctx.t * v.speed * 2.2);
      for (let k = 0; k < v.count; k++) {
        let x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
        let ang = rnd() * Math.PI * 2;
        const steps = 8 + Math.floor(rnd() * w);
        for (let i = 0; i < steps; i++) {
          ang += (rnd() - 0.5) * 1.1;
          x += Math.round(Math.cos(ang)); y += Math.round(Math.sin(ang));
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
    }, true),

  mk("vines", "つる植物", "VINES", "material", "絡みつく蔦と葉", "vine",
    [R("count", "本数", 1, 10, 1, 3), C("stem", "茎", "#4b7a2c"), C("leaf", "葉", "#79c143"), R("leafSize", "葉の大きさ", 1, 3, 1, 1), R("seed", "乱数", 0, 999, 1, 11)],
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
    }),

  mk("erosion", "侵食 / 摩耗", "EROSION", "material", "ノイズで縁を削り取る", "erode",
    [R("amount", "量", 0, 100, 1, 35), R("scale", "粒度", 1, 12, 1, 4), S("mode", "方式", "erode", [["erode", "削る"], ["dilate", "膨らませる"], ["tatter", "ぼろぼろ"]]), R("seed", "乱数", 0, 999, 1, 8)],
    (img, v) => {
      const w = img.width, h = img.height, src = clone(img), k = v.amount / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          const n = v.mode === "tatter" ? fbm(x / v.scale, y / v.scale, v.seed * 17, 5) : valueNoise(x / v.scale, y / v.scale, v.seed * 17);
          let edge = 0;
          for (let r = 1; r <= 3; r++) {
            if (!getAlpha(src, x + r, y) || !getAlpha(src, x - r, y) || !getAlpha(src, x, y + r) || !getAlpha(src, x, y - r)) { edge = 1 - r / 4; break; }
          }
          const th = v.mode === "dilate" ? 1 - k : k;
          if (v.mode === "dilate") {
            if (src.data[i + 3] === 0 && edge > 0 && n > th) {
              const near = [4, -4, w * 4, -w * 4].map(o => i + o).filter(j => j >= 0 && j < src.data.length);
              let r = 0, g = 0, b = 0, c = 0;
              for (const j of near) if (src.data[j + 3] > 0) { r += src.data[j]; g += src.data[j + 1]; b += src.data[j + 2]; c++; }
              if (c) { img.data[i] = r / c; img.data[i + 1] = g / c; img.data[i + 2] = b / c; img.data[i + 3] = 255 * (n - th) * 2; }
            }
            continue;
          }
          if (src.data[i + 3] === 0) continue;
          const erodeAmt = v.mode === "tatter" ? clamp01(n * edge * 2 * k) : clamp01(edge * k * (0.35 + n));
          if (erodeAmt > 0.55) { img.data[i + 3] = 0; continue; }
          img.data[i] = clamp(img.data[i] * (1 - erodeAmt * 0.35));
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - erodeAmt * 0.35));
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - erodeAmt * 0.35));
          img.data[i + 3] = clamp(src.data[i + 3] * (1 - erodeAmt * 0.8));
        }
    }),

  mk("brushedMetal", "ヘアーライン", "BRUSHED METAL", "material", "金属の引き目質感", "metal",
    [R("amount", "量", 0, 100, 1, 45), S("dir", "方向", "h", [["h", "横"], ["v", "縦"]]), R("freq", "細かさ", 1, 8, 1, 2), T("specular", "光沢帯", true)],
    (img, v) => {
      const w = img.width, h = img.height, k = v.amount / 100, rnd = mulberry32(9182);
      const rows = v.dir === "h" ? h : w;
      const line: number[] = [];
      for (let i = 0; i < rows; i++) line.push((rnd() - 0.5) * 2);
      for (let i = 0; i < rows; i++) line[i] = line[i] * 0.6 + (line[Math.max(0, i - 1)] + line[Math.min(rows - 1, i + 1)]) * 0.2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const idx = v.dir === "h" ? y : x;
          let n = line[idx] * 42 * k;
          n += (valueNoise(v.dir === "h" ? x / v.freq : y / v.freq, idx * 3.1, 44) - 0.5) * 30 * k;
          if (v.specular) {
            const pos = (v.dir === "h" ? x : y) / (v.dir === "h" ? w : h);
            n += Math.exp(-Math.pow((pos - 0.34) / 0.16, 2)) * 46 * k;
          }
          img.data[i] = clamp(img.data[i] + n); img.data[i + 1] = clamp(img.data[i + 1] + n); img.data[i + 2] = clamp(img.data[i + 2] + n * 1.03);
        }
    }),

  mk("wetLook", "ウェット仕上げ", "WET LOOK", "material", "濡れた光沢と深い陰影", "wet",
    [R("amount", "量", 0, 100, 1, 55), R("spec", "ハイライト", 0, 100, 1, 60), T("dark", "暗部を締める", true)],
    (img, v) => {
      const w = img.width, h = img.height, k = v.amount / 100;
      const src = clone(img);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (src.data[i + 3] === 0) continue;
          if (v.dark) { img.data[i] = clamp(src.data[i] * (1 - k * 0.3)); img.data[i + 1] = clamp(src.data[i + 1] * (1 - k * 0.3)); img.data[i + 2] = clamp(src.data[i + 2] * (1 - k * 0.28)); }
          const n = fbm(x / 4.5, y / 4.5, 1234, 4);
          const sat = 1 + k * 0.4;
          const ll = luminance(img.data[i], img.data[i + 1], img.data[i + 2]);
          img.data[i] = clamp(ll + (img.data[i] - ll) * sat); img.data[i + 1] = clamp(ll + (img.data[i + 1] - ll) * sat); img.data[i + 2] = clamp(ll + (img.data[i + 2] - ll) * sat);
          if (n > 0.66) screenPx(img, x, y, 255, 255, 255, (n - 0.66) * 3 * v.spec * 2.2 * k);
        }
    }),

  mk("speckle", "石目 / 斑点", "SPECKLE", "material", "鉱物的な細かな斑点", "speckle",
    [R("amount", "量", 0, 100, 1, 40), R("size", "粒", 1, 3, 1, 1), R("contrast", "濃淡", 0, 100, 1, 55), T("colored", "色を付ける", false), R("seed", "乱数", 0, 999, 1, 2)],
    (img, v) => {
      const w = img.width, h = img.height, k = v.contrast / 100 * 120, cell = Math.max(1, v.size | 0), rnd = mulberry32(v.seed * 577 + 1);
      const cw = Math.ceil(w / cell), chh = Math.ceil(h / cell);
      const n = new Float32Array(cw * chh);
      for (let i = 0; i < n.length; i++) n[i] = rnd() - 0.5;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          if (rnd() > 0.3 + (v.amount / 100) * 0.7) continue;
          const val = n[Math.floor(y / cell) * cw + Math.floor(x / cell)] * k * (0.4 + v.amount / 100);
          if (v.colored) {
            const hh = rgbToHsl(img.data[i], img.data[i + 1], img.data[i + 2]);
            const c = hslToRgb(hh.h + (rnd() - 0.5) * 0.06 * (v.amount / 100), clamp01(hh.s + 0.05), clamp01(hh.l + val / 255));
            img.data[i] = c.r; img.data[i + 1] = c.g; img.data[i + 2] = c.b;
          } else {
            img.data[i] = clamp(img.data[i] + val); img.data[i + 1] = clamp(img.data[i + 1] + val); img.data[i + 2] = clamp(img.data[i + 2] + val);
          }
        }
    }),
];

// ============================================================
//  5. 特殊エフェクト
// ============================================================
export const RARITIES: Record<string, { l: string; c: string }> = {
  common: { l: "コモン (白)", c: "#d7dde6" },
  uncommon: { l: "アンコモン (緑)", c: "#5ce35c" },
  rare: { l: "レア (青)", c: "#4a9dff" },
  epic: { l: "エピック (紫)", c: "#b45cff" },
  legendary: { l: "レジェンダリー (橙)", c: "#ff9f2e" },
  mythic: { l: "ミシック (紅)", c: "#ff4d6d" },
  divine: { l: "ディバイン (金)", c: "#ffe066" },
};

const SPECIAL_FX: EffectDef[] = [
  mk("bloom", "ブルーム", "BLOOM", "special", "明るい部分を滲ませて発光", "bloom",
    [R("threshold", "しきい値", 0, 255, 1, 170), R("radius", "広がり", 1, 8, 1, 3), R("intensity", "強さ", 0, 200, 1, 80)],
    (img, v) => {
      const w = img.width, h = img.height;
      const bright = new ImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const l = luminance(img.data[i], img.data[i + 1], img.data[i + 2]);
        if (l > v.threshold && img.data[i + 3] > 10) {
          const k = clamp01((l - v.threshold) / Math.max(1, 255 - v.threshold));
          bright.data[i] = img.data[i] * k; bright.data[i + 1] = img.data[i + 1] * k; bright.data[i + 2] = img.data[i + 2] * k; bright.data[i + 3] = 255 * k;
        }
      }
      const bl = boxBlur(bright, v.radius);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          addPx(img, x, y, bl.data[i], bl.data[i + 1], bl.data[i + 2], (bl.data[i + 3] / 255) * v.intensity * 1.6);
        }
    }),

  mk("vignette", "ビネット", "VIGNETTE", "special", "四隅を落として集中", "vignette",
    [R("amount", "強さ", 0, 100, 1, 45), R("radius", "範囲", 10, 100, 1, 62), C("color", "色", "#000000"), T("invert", "逆に明るく", false)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.amount / 100, cx = (w - 1) / 2, cy = (h - 1) / 2;
      const maxD = Math.hypot(cx, cy), r0 = (v.radius / 100) * maxD;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const d = Math.hypot(x - cx, y - cy);
          let f = clamp01((d - r0) / Math.max(1, maxD - r0)) * k;
          if (v.invert) f = k - f;
          img.data[i] = clamp(img.data[i] * (1 - f) + c.r * f);
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - f) + c.g * f);
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - f) + c.b * f);
        }
    }),

  mk("chromatic", "色収差", "CHROMATIC ABERRATION", "special", "RGB をずらして滲ませる", "chroma",
    [R("amount", "ずれ", 0, 6, 0.5, 1.5), R("angle", "方向", 0, 360, 1, 0), T("edgeOnly", "縁のみ", false)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, a = (v.angle * Math.PI) / 180;
      const dx = Math.cos(a) * v.amount, dy = Math.sin(a) * v.amount;
      const m = maskOf(img);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (src.data[i + 3] === 0) continue;
          if (v.edgeOnly) {
            let edge = false;
            for (let r = 1; r <= 2 && !edge; r++)
              if (m[clamp(y - r, 0, h - 1) * w + clamp(x, 0, w - 1)] < 0.2 || m[clamp(y + r, 0, h - 1) * w + clamp(x, 0, w - 1)] < 0.2 ||
                m[y * w + clamp(x - r, 0, w - 1)] < 0.2 || m[y * w + clamp(x + r, 0, w - 1)] < 0.2) edge = true;
            if (!edge) continue;
          }
          const rx = clamp(Math.round(x + dx), 0, w - 1), ry = clamp(Math.round(y + dy), 0, h - 1);
          const bx = clamp(Math.round(x - dx), 0, w - 1), by = clamp(Math.round(y - dy), 0, h - 1);
          img.data[i] = src.data[(ry * w + rx) << 2];
          img.data[i + 2] = src.data[(by * w + bx) << 2 | 2];
        }
    }),

  mk("enchantGlint", "エンチャントの輝き", "ENCHANT GLINT", "special", "MC 風の斜めシマー", "enchant",
    [R("speed", "速度", 0, 4, 0.1, 1.1), R("width", "帯幅", 2, 40, 1, 14), R("intensity", "強さ", 0, 200, 1, 90), C("color", "色", "#c9a8ff"), R("bands", "帯の数", 1, 3, 1, 2), S("mode", "範囲", "inside", [["inside", "内部のみ"], ["all", "全面"]])],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.intensity / 100;
      const span = (w + h);
      for (let b = 0; b < v.bands; b++) {
        const off = fract(ctx.t * v.speed * 0.32 + b / v.bands) * (span + v.width * 3) - v.width * 2;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) << 2;
            if (img.data[i + 3] === 0) continue;
            if (v.mode === "inside") {
              // 内側限定: 縁から1px以上内側
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
    }, true),

  mk("rarityAura", "レアリティオーラ", "RARITY AURA", "special", "アイテム品質の発光オーラ", "rarity",
    [S("rarity", "品質", "legendary", Object.entries(RARITIES).map(([k, o]) => [k, o.l] as [string, string])),
    R("radius", "広がり", 1, 14, 1, 5), R("intensity", "強さ", 0, 200, 1, 100), R("speed", "脈動", 0, 4, 0.1, 1.2), T("rim", "縁を明るく", true)],
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
          const i = (y * w + x) << 2;
          const g = clamp01(glow.data[i + 3] / 255) * (v.intensity / 100) * pulse;
          if (g > 0) addPx(img, x, y, c.r, c.g, c.b, g * 190);
          if (v.rim && src.data[i + 3] > 0) {
            const edge = !getAlpha(src, x + 1, y) || !getAlpha(src, x - 1, y) || !getAlpha(src, x, y + 1) || !getAlpha(src, x, y - 1);
            if (edge) { screenPx(img, x, y, c.r, c.g, c.b, 200 * pulse); overPx(img, x, y, clamp(c.r * 0.6 + src.data[i] * 0.4), clamp(c.g * 0.6 + src.data[i + 1] * 0.4), clamp(c.b * 0.6 + src.data[i + 2] * 0.4), 160 * pulse); }
          }
        }
    }, true),

  mk("holographic", "ホログラム箔", "HOLOGRAM FOIL", "special", "虹色が流れるfoil加工", "holo",
    [R("speed", "速度", 0, 4, 0.1, 0.9), R("intensity", "強さ", 0, 150, 1, 70), R("scale", "スケール", 2, 40, 1, 12), T("sparkle", "ラメ", true)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, k = v.intensity / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const n = fbm(x / v.scale + ctx.t * v.speed * 0.35, y / v.scale - ctx.t * v.speed * 0.22, 5, 4);
          const hue = fract(n * 1.6 + ctx.t * v.speed * 0.09 + (x + y) / (w * 6));
          const c = hslToRgb(hue, 0.85, 0.62);
          screenPx(img, x, y, c.r, c.g, c.b, k * 150);
          if (v.sparkle && hash2(x, y, Math.floor(ctx.t * 7)) > 0.965) addPx(img, x, y, 255, 255, 255, 150 * k);
        }
    }, true),

  mk("iridescent", "虹色シフト", "IRIDESCENCE", "special", "角度で色が変わる薄膜", "iris",
    [R("amount", "強さ", 0, 150, 1, 60), R("scale", "周期", 2, 60, 1, 18), R("angle", "角度", 0, 360, 1, 35), R("speed", "流れ", 0, 3, 0.1, 0.4)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, k = v.amount / 100, a = (v.angle * Math.PI) / 180;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const p = (x * Math.cos(a) + y * Math.sin(a)) / v.scale + ctx.t * v.speed;
          const c = hslToRgb(fract(p), 0.75, 0.58);
          screenPx(img, x, y, c.r, c.g, c.b, k * 130);
        }
    }, true),

  mk("glitch", "グリッチ", "GLITCH", "special", "崩壊するデジタルノイズ", "glitch",
    [R("amount", "強さ", 0, 100, 1, 35), R("slices", "スライス数", 1, 20, 1, 6), R("speed", "速度", 0.5, 12, 0.5, 4), T("rgbSplit", "RGB 分離", true), R("seed", "乱数", 0, 999, 1, 3)],
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
            const i = (y * w + x) << 2;
            const sx = ((x + shift) % w + w) % w;
            const j = (y * w + sx) << 2;
            img.data[i] = src.data[j]; img.data[i + 1] = src.data[j + 1]; img.data[i + 2] = src.data[j + 2]; img.data[i + 3] = src.data[j + 3];
            if (v.rgbSplit) {
              const rx = clamp(sx + Math.round(k * 3), 0, w - 1), bx = clamp(sx - Math.round(k * 3), 0, w - 1);
              img.data[i] = src.data[(y * w + rx) << 2];
              img.data[i + 2] = src.data[(y * w + bx) << 2 | 2];
            }
          }
      }
      // 静的ノイズブロック
      if (rnd() < k * 0.6) {
        for (let n = 0; n < 8 * k; n++) {
          const bx = Math.floor(rnd() * w), by = Math.floor(rnd() * h);
          const bw = 1 + Math.floor(rnd() * 5), bh = 1 + Math.floor(rnd() * 3);
          const val = rnd() > 0.5 ? 255 : 0;
          for (let y = by; y < Math.min(h, by + bh); y++) for (let x = bx; x < Math.min(w, bx + bw); x++)
            setPx(img, x, y, val, val, val, img.data[(y * w + x) << 2 | 3] > 0 ? 255 : 90);
        }
      }
    }, true),

  mk("crt", "CRT モニター", "CRT", "special", "ブラウン管風の走査とマスク", "crt",
    [R("scan", "スキャン濃さ", 0, 100, 1, 35), R("mask", "RGB マスク", 0, 100, 1, 25), R("bloom", "滲み", 0, 100, 1, 30), R("curve", "周辺減光", 0, 100, 1, 40), R("flicker", "ちらつき", 0, 100, 1, 12)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, d = img.data;
      const fl = 1 + (Math.sin(ctx.t * 47) * 0.5 + Math.sin(ctx.t * 13.3) * 0.5) * (v.flicker / 100) * 0.09;
      const cx = (w - 1) / 2, cy = (h - 1) / 2, maxD = Math.hypot(cx, cy);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
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
            d[i] = clamp(d[i] * f); d[i + 1] = clamp(d[i + 1] * f); d[i + 2] = clamp(d[i + 2] * f);
          }
          if (v.curve > 0) {
            const dd = Math.hypot(x - cx, y - cy) / maxD;
            const vg = 1 - clamp01((dd - 0.5) / 0.5) * (v.curve / 100);
            d[i] *= vg; d[i + 1] *= vg; d[i + 2] *= vg;
          }
        }
      if (v.bloom > 0) {
        const bright = new ImageData(w, h);
        for (let i = 0; i < d.length; i += 4) {
          const l = luminance(d[i], d[i + 1], d[i + 2]);
          if (l > 130) { const k = (l - 130) / 125; bright.data[i] = d[i] * k; bright.data[i + 1] = d[i + 1] * k; bright.data[i + 2] = d[i + 2] * k; bright.data[i + 3] = 255 * k; }
        }
        const bl = boxBlur(bright, 2);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          addPx(img, x, y, bl.data[i], bl.data[i + 1], bl.data[i + 2], (bl.data[i + 3] / 255) * v.bloom * 1.4);
        }
      }
    }, true),

  mk("warp", "波歪み", "WARP", "special", "水面のようなゆがみ", "warp",
    [R("amount", "強さ", 0, 8, 0.2, 2), R("freq", "周波数", 0.5, 12, 0.5, 3), R("speed", "速度", 0, 4, 0.1, 1), S("mode", "形", "wave", [["wave", "波"], ["ripple", "波紋"], ["turb", "乱流"]])],
    (img, v, ctx) => {
      const w = img.width, h = img.height, src = clone(img), cx = w / 2, cy = h / 2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          let ox = 0, oy = 0;
          if (v.mode === "wave") { ox = Math.sin(y / v.freq + ctx.t * v.speed * 2) * v.amount; oy = Math.cos(x / v.freq + ctx.t * v.speed * 1.6) * v.amount * 0.5; }
          else if (v.mode === "ripple") {
            const d = Math.hypot(x - cx, y - cy);
            const a2 = Math.sin(d / v.freq - ctx.t * v.speed * 3) * v.amount;
            ox = ((x - cx) / (d || 1)) * a2; oy = ((y - cy) / (d || 1)) * a2;
          } else {
            ox = (fbm(x / (v.freq * 3), y / (v.freq * 3) + ctx.t * v.speed * 0.3, 21, 3) - 0.5) * v.amount * 3;
            oy = (fbm(x / (v.freq * 3) + 9, y / (v.freq * 3) - ctx.t * v.speed * 0.3, 44, 3) - 0.5) * v.amount * 3;
          }
          const sx = clamp(Math.round(x + ox), 0, w - 1), sy = clamp(Math.round(y + oy), 0, h - 1);
          const j = (sy * w + sx) << 2;
          img.data[i] = src.data[j]; img.data[i + 1] = src.data[j + 1]; img.data[i + 2] = src.data[j + 2]; img.data[i + 3] = src.data[j + 3];
        }
    }, true),

  mk("swirl", "渦", "SWIRL", "special",
    "中心から渦巻く変形", "swirl",
    [R("amount", "ねじれ", -360, 360, 5, 120), R("radius", "範囲", 10, 100, 1, 80), R("speed", "回転", 0, 3, 0.1, 0)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, src = clone(img), cx = (w - 1) / 2, cy = (h - 1) / 2;
      const maxR = (Math.min(w, h) / 2) * (v.radius / 100) || 1;
      const base = (v.amount * Math.PI) / 180 + ctx.t * v.speed;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
          if (d > maxR) continue;
          const f = Math.pow(1 - d / maxR, 2) * base;
          const sx = clamp(Math.round(cx + dx * Math.cos(f) - dy * Math.sin(f)), 0, w - 1);
          const sy = clamp(Math.round(cy + dx * Math.sin(f) + dy * Math.cos(f)), 0, h - 1);
          const j = (sy * w + sx) << 2;
          img.data[i] = src.data[j]; img.data[i + 1] = src.data[j + 1]; img.data[i + 2] = src.data[j + 2]; img.data[i + 3] = src.data[j + 3];
        }
    }, true),

  mk("pixelSort", "ピクセルソート", "PIXEL SORT", "special", "明度で画素を引き伸ばす", "sort",
    [R("threshold", "しきい値", 0, 255, 1, 90), R("len", "最大長", 1, 32, 1, 10), S("dir", "方向", "h", [["h", "横"], ["v", "縦"], ["diag", "斜め"]]), T("desc", "降順", false)],
    (img, v) => {
      const w = img.width, h = img.height;
      const lum = (x: number, y: number) => { const i = (y * w + x) << 2; return img.data[i + 3] > 0 ? luminance(img.data[i], img.data[i + 1], img.data[i + 2]) : -1; };
      const total = v.dir === "v" ? w : h;
      for (let s = 0; s < total; s++) {
        const max = v.dir === "v" ? h : w;
        let run: { x: number; y: number; l: number }[] = [];
        const flush = () => {
          if (run.length > 1) {
            const sorted = [...run].sort((a, b) => (v.desc ? b.l - a.l : a.l - b.l));
            run.forEach((p, idx) => {
              const i = (p.y * w + p.x) << 2, j = (sorted[idx].y * w + sorted[idx].x) << 2;
              img.data[i] = img.data[j]; img.data[i + 1] = img.data[j + 1]; img.data[i + 2] = img.data[j + 2];
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
    }),

  mk("lightSweep", "ライトスイープ", "LIGHT SWEEP", "special", "横切る一筋の光", "sweep",
    [R("speed", "速度", 0, 4, 0.1, 0.9), R("width", "幅", 2, 40, 1, 12), R("intensity", "強さ", 0, 200, 1, 100), R("angle", "角度", -60, 60, 1, 18), C("color", "色", "#ffffff")],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), k = v.intensity / 100;
      const a = (v.angle * Math.PI) / 180;
      const pos = fract(ctx.t * v.speed * 0.28) * (w + h) - h * 0.5;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const p = x * Math.cos(a) + y * Math.sin(a);
          const d = Math.abs(p - pos);
          if (d > v.width) continue;
          const f = Math.pow(1 - d / v.width, 2);
          screenPx(img, x, y, c.r, c.g, c.b, f * 230 * k);
        }
    }, true),

  mk("motionTrail", "残像 / モーションブラー", "MOTION TRAIL", "special", "動きの軌跡を残す", "trail",
    [R("amount", "強さ", 0, 100, 1, 45), R("steps", "回数", 1, 8, 1, 4), R("angle", "方向", 0, 360, 1, 45), T("animated", "流す", false)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, src = clone(img), a = (v.angle * Math.PI) / 180, k = v.amount / 100;
      const shift = v.animated ? fract(ctx.t * 0.6) * 3 : 0;
      for (let s = 1; s <= v.steps; s++) {
        const dist = (s / v.steps) * (2 + shift);
        const dx = Math.round(Math.cos(a) * dist), dy = Math.round(Math.sin(a) * dist);
        const fade = (1 - s / (v.steps + 1)) * k * 0.6;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const sx = x - dx, sy = y - dy;
            if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
            const j = (sy * w + sx) << 2;
            if (src.data[j + 3] === 0) continue;
            addPx(img, x, y, src.data[j] * 0.7, src.data[j + 1] * 0.7, src.data[j + 2] * 0.7, fade * 255);
          }
      }
    }, true),

  mk("kaleido", "万華鏡", "KALEIDOSCOPE", "special", "対称反復で模様化", "kaleido",
    [S("segments", "分割", "4", [["2", "2"], ["4", "4"], ["6", "6"], ["8", "8"]]), R("rot", "回転", 0, 360, 1, 0), R("zoom", "拡大", 50, 200, 1, 100)],
    (img, v) => {
      const w = img.width, h = img.height, src = clone(img), seg = parseInt(v.segments, 10);
      const cx = (w - 1) / 2, cy = (h - 1) / 2, rot = (v.rot * Math.PI) / 180, z = v.zoom / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          let ang = Math.atan2(y - cy, x - cx) - rot;
          const d = Math.hypot(x - cx, y - cy) * z;
          const sector = (Math.PI * 2) / seg;
          ang = ((ang % sector) + sector) % sector;
          if (ang > sector / 2) ang = sector - ang;
          ang += rot;
          const sx = clamp(Math.round(cx + Math.cos(ang) * d), 0, w - 1);
          const sy = clamp(Math.round(cy + Math.sin(ang) * d), 0, h - 1);
          const j = (sy * w + sx) << 2;
          img.data[i] = src.data[j]; img.data[i + 1] = src.data[j + 1]; img.data[i + 2] = src.data[j + 2]; img.data[i + 3] = src.data[j + 3];
        }
    }),

  mk("embossGold", "金箔プレス", "GOLD FOIL", "special", "立体感のある金箔押し", "foil",
    [R("amount", "強さ", 0, 100, 1, 60), C("light", "明色", "#ffe9a8"), C("dark", "暗色", "#8a5a12"), R("angle", "光源", 0, 360, 1, 315), T("onlyBright", "明部にのみ", false)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, lt = hexToRgb(v.light), dk = hexToRgb(v.dark), k = v.amount / 100;
      const a = (v.angle * Math.PI) / 180, dx = Math.round(Math.cos(a)), dy = Math.round(-Math.sin(a));
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (src.data[i + 3] === 0) continue;
          const l = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
          if (v.onlyBright && l < 120) continue;
          const hi = getAlpha(src, x + dx, y + dy) > 0 ? luminance(src.data[((y + dy) * w + (x + dx)) << 2], src.data[((y + dy) * w + (x + dx)) << 2 | 1], src.data[((y + dy) * w + (x + dx)) << 2 | 2]) : l;
          const diff = clamp01((hi - l) / 90 + 0.5);
          const r = lerp(dk.r, lt.r, diff), g = lerp(dk.g, lt.g, diff), b = lerp(dk.b, lt.b, diff);
          img.data[i] = clamp(src.data[i] * (1 - k * 0.55) + r * k * 0.85);
          img.data[i + 1] = clamp(src.data[i + 1] * (1 - k * 0.55) + g * k * 0.85);
          img.data[i + 2] = clamp(src.data[i + 2] * (1 - k * 0.55) + b * k * 0.85);
        }
    }),

  mk("soulFlame", "魂の炎", "SOUL FLAME", "special", "ゆらめく霊火を纏う", "soul",
    [C("c1", "内側", "#8ef7ff"), C("c2", "外側", "#3a5cff"), R("intensity", "強さ", 0, 200, 1, 90), R("speed", "揺らぎ", 0.2, 5, 0.1, 1.6), R("reach", "広がり", 1, 10, 1, 4)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, a = hexToRgb(v.c1), b = hexToRgb(v.c2), src = clone(img);
      const am = new ImageData(w, h);
      for (let i = 0; i < src.data.length; i += 4) am.data[i + 3] = src.data[i + 3];
      const glow = boxBlur(am, v.reach, true);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          const g = glow.data[i + 3] / 255;
          if (g <= 0.02) continue;
          const flick = 0.55 + 0.45 * fbm(x / 4 + ctx.t * v.speed * 0.6, y / 4 - ctx.t * v.speed * 1.1, 3, 3);
          const t = clamp01(g * flick);
          const r = lerp(b.r, a.r, t), gg = lerp(b.g, a.g, t), bb = lerp(b.b, a.b, t);
          addPx(img, x, y, r, gg, bb, t * v.intensity * 1.5);
        }
    }, true),
];

export { DECOR_FX, MATERIAL_FX, SPECIAL_FX };
