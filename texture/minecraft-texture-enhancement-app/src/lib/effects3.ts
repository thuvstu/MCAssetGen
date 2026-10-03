import { clamp, clamp01, mulberry32, fbm, setPx, overPx, addPx, screenPx, linePx, discPx, ringPx, hexToRgb, rgbToHsl, hslToRgb, luminance } from "./fxutil";
import type { EffectDef, ParamSpec } from "./effects";

const R = (key: string, label: string, min: number, max: number, step: number, def: number, unit?: string): ParamSpec =>
  ({ key, label, type: "range", min, max, step, def, unit });
const C = (key: string, label: string, def: string): ParamSpec => ({ key, label, type: "color", def });
const T = (key: string, label: string, def: boolean): ParamSpec => ({ key, label, type: "toggle", def });

const mk = (
  id: string, name: string, en: string, cat: EffectDef["cat"], desc: string, icon: string,
  params: ParamSpec[], apply: EffectDef["apply"], animated = false,
): EffectDef => ({ id, name, en, cat, desc, icon, params, apply, animated });

export const EXTRA_FX: EffectDef[] = [
  // ==========================================
  // 特殊装飾: 黄金/装飾フィリグリー (Filigree)
  // ==========================================
  mk("filigree", "金細工フィリグリー", "GOLD FILIGREE", "decor", "緻密な金細工の唐草模様を表面に施す", "spark",
    [C("color", "細工色", "#ffd257"), R("density", "密度", 2, 10, 1, 5), R("thick", "太さ", 1, 2, 1, 1), R("glow", "きらめき", 0, 100, 1, 50)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), d = v.density;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          // 唐草風の数学的曲線模様
          const s1 = Math.sin(x / d + Math.cos(y / d));
          const s2 = Math.cos(y / d + Math.sin(x / d));
          const on = Math.abs(s1 + s2) < (0.15 * v.thick);
          if (on) {
            overPx(img, x, y, c.r, c.g, c.b, 240);
            if (v.glow > 0 && (x + y) % 3 === 0) {
              screenPx(img, x, y, 255, 255, 255, v.glow * 1.5);
            }
          }
        }
      }
    }
  ),

  // ==========================================
  // 特殊装飾: 魔法の障壁シールド (Hex Shield)
  // ==========================================
  mk("hexShield", "六角フォースシールド", "FORCE SHIELD", "special", "脈動する六角形の防護障壁とエナジー", "hex",
    [C("color", "シールド色", "#38e0ff"), R("speed", "脈動速度", 0.2, 4, 0.1, 1.2), R("opacity", "シールド強度", 10, 100, 1, 60), R("gridSize", "六角サイズ", 4, 16, 1, 7)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), s = v.gridSize, a = (v.opacity / 100) * 255;
      const pulse = 0.65 + 0.35 * Math.sin(ctx.t * v.speed * 2.5);
      const hh = s * Math.sqrt(3) / 2;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const col = Math.round(x / (s * 1.5));
          const rowOff = (col % 2) * hh;
          const row = Math.round((y - rowOff) / hh);
          const cx = col * s * 1.5, cy = row * hh + rowOff;
          const dx = Math.abs(x - cx) / s, dy = Math.abs(y - cy) / hh;
          const inside = dx <= 1 && (dx + dy * 0.577) <= 1.16;
          const edge = inside && (dx > 0.85 || dx + dy * 0.577 > 1.05);
          if (edge) {
            addPx(img, x, y, c.r, c.g, c.b, a * pulse);
          } else if (inside && ((x + y + Math.floor(ctx.t * 6)) % 7 === 0)) {
            addPx(img, x, y, c.r * 0.7, c.g * 0.7, c.b * 0.7, a * 0.35 * pulse);
          }
        }
      }
    }, true
  ),

  // ==========================================
  // 装飾・特殊: 稲妻 / 放電 (Lightning Arc)
  // ==========================================
  mk("lightningArc", "稲妻の放電", "LIGHTNING ARC", "special", "表面を激しく駆け抜けるプラズマ電撃", "spark",
    [C("color", "放電色", "#7cf3ff"), R("branches", "枝分かれ", 1, 4, 1, 2), R("speed", "明滅周期", 1, 10, 1, 5), R("glow", "発光量", 10, 100, 1, 80)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      const frame = Math.floor(ctx.t * v.speed);
      const rnd = mulberry32(frame * 6829 + ctx.seed * 19);
      for (let b = 0; b < v.branches; b++) {
        let x = Math.floor(rnd() * w), y = 0;
        let targetX = Math.floor(rnd() * w);
        while (y < h) {
          const nextY = y + 1 + Math.floor(rnd() * 3);
          const nextX = clamp(Math.round(x + (rnd() - 0.5) * 6 + (targetX - x) * 0.15), 0, w - 1);
          linePx(img, x, y, nextX, nextY, c.r, c.g, c.b, 255, 1, true);
          if (v.glow > 20) {
            addPx(img, x + 1, y, c.r * 0.6, c.g * 0.6, c.b * 0.6, v.glow);
            addPx(img, x - 1, y, c.r * 0.6, c.g * 0.6, c.b * 0.6, v.glow);
          }
          x = nextX;
          y = nextY;
        }
      }
    }, true
  ),

  // ==========================================
  // マテリアル: 鉱脈インクルージョン (Crystal Inclusions)
  // ==========================================
  mk("crystalInclusion", "結晶インクルージョン", "CRYSTAL VEINS", "material", "半透明な鉱物の中に輝く結晶群を内包", "gem",
    [C("color", "結晶色", "#ff4fbe"), R("amount", "密度", 1, 20, 1, 6), R("size", "結晶サイズ", 1, 5, 1, 2), T("prism", "プリズム光沢", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), rnd = mulberry32(9921);
      for (let k = 0; k < v.amount; k++) {
        const cx = Math.floor(rnd() * w), cy = Math.floor(rnd() * h);
        const rad = v.size;
        for (let y = -rad; y <= rad; y++) {
          for (let x = -rad; x <= rad; x++) {
            const px = cx + x, py = cy + y;
            if (px < 0 || py < 0 || px >= w || py >= h) continue;
            const dist = Math.abs(x) + Math.abs(y);
            if (dist <= rad) {
              const shade = 1 - dist / (rad + 1);
              let col = { ...c };
              if (v.prism) {
                const hl = rgbToHsl(c.r, c.g, c.b);
                col = hslToRgb(hl.h + (x - y) * 0.08, hl.s, hl.l);
              }
              addPx(img, px, py, col.r * shade, col.g * shade, col.b * shade, 220);
            }
          }
        }
      }
    }
  ),

  // ==========================================
  // 特殊装飾: 封印の鎖 (Chains of Binding)
  // ==========================================
  mk("chains", "封印の鎖", "BINDING CHAINS", "decor", "アイテムやブロックを斜めに縛り付ける鉄鎖", "trim",
    [C("color", "鎖の色", "#9caab8"), R("thick", "太さ", 1, 3, 1, 2), R("count", "本数", 1, 3, 1, 1), T("rust", "錆び", true)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      for (let chain = 0; chain < v.count; chain++) {
        const offset = (chain - (v.count - 1) / 2) * (w * 0.35);
        for (let p = 0; p < w + h; p += 2) {
          const x = Math.round(p - h / 2 + offset);
          const y = Math.round(p * (h / w) * 0.5);
          if (x >= 0 && x < w && y >= 0 && y < h && img.data[(y * w + x) * 4 + 3] > 0) {
            const link = Math.floor(p / 4) % 2 === 0;
            const shade = link ? 1.2 : 0.75;
            let cr = c.r * shade, cg = c.g * shade, cb = c.b * shade;
            if (v.rust && (x + y) % 5 === 0) {
              cr = 160; cg = 70; cb = 30; // 錆色
            }
            discPx(img, x, y, v.thick, cr, cg, cb, 255);
            setPx(img, x, y, 255, 255, 255, 180); // ハイライト
          }
        }
      }
    }
  ),

  // ==========================================
  // 特殊装飾: 星雲・コズミック (Nebula Void)
  // ==========================================
  mk("nebula", "星雲の深淵", "COSMIC NEBULA", "special", "宇宙のガス星雲がテクスチャ内部で揺らめく", "star",
    [C("c1", "星雲色1", "#ff2a8d"), C("c2", "星雲色2", "#2ae3ff"), R("speed", "流動速度", 0.1, 3, 0.1, 0.8), R("intensity", "強さ", 10, 100, 1, 75)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c1 = hexToRgb(v.c1), c2 = hexToRgb(v.c2), k = v.intensity / 100;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const n1 = fbm(x / 8 + ctx.t * v.speed * 0.2, y / 8 - ctx.t * v.speed * 0.15, 301, 3);
          const n2 = fbm(x / 12 - ctx.t * v.speed * 0.1, y / 12 + ctx.t * v.speed * 0.2, 512, 3);
          const blend = clamp01(n1 * 1.2);
          const r = c1.r * blend + c2.r * (1 - blend);
          const g = c1.g * blend + c2.g * (1 - blend);
          const b = c1.b * blend + c2.b * (1 - blend);
          screenPx(img, x, y, r, g, b, n2 * 255 * k);
        }
      }
    }, true
  ),

  // ==========================================
  // マテリアル: 毒・アシッド侵食 (Acid Corrode)
  // ==========================================
  mk("acidCorrode", "毒液・アシッド侵食", "ACID DRIP", "material", "蛍光グリーンの毒液が滴り表面を融解させる", "droplet",
    [C("color", "毒色", "#39ff14"), R("drips", "滴の数", 1, 8, 1, 3), R("speed", "垂れる速度", 0.5, 4, 0.1, 1.4), R("glow", "発光", 10, 100, 1, 85)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      for (let d = 0; d < v.drips; d++) {
        const rnd = mulberry32(d * 1447 + 7);
        const startX = Math.floor(rnd() * w);
        const yHead = Math.floor(((ctx.t * v.speed * 12 + rnd() * h) % (h + 8)) - 4);
        const len = 4 + Math.floor(rnd() * 6);
        for (let y = yHead - len; y <= yHead; y++) {
          if (y >= 0 && y < h && img.data[(y * w + startX) * 4 + 3] > 0) {
            const tail = clamp01((y - (yHead - len)) / len);
            addPx(img, startX, y, c.r, c.g, c.b, tail * 255);
            if (v.glow > 0) {
              addPx(img, startX + 1, y, c.r * 0.5, c.g * 0.5, c.b * 0.5, tail * v.glow);
              addPx(img, startX - 1, y, c.r * 0.5, c.g * 0.5, c.b * 0.5, tail * v.glow);
            }
          }
        }
      }
    }, true
  ),

  // ==========================================
  // ピクセル表現: パレットリマップ・カラーシフト (Palette Remap)
  // ==========================================
  mk("paletteRemap", "サイバーパンク調色", "NEON PALETTE", "color", "明度階調を鮮烈なネオン・サイバー調に変換", "palette",
    [C("shadow", "陰影色", "#070024"), C("mid", "中間色", "#ff007f"), C("high", "明部色", "#00f0ff"), R("mix", "適用度", 0, 100, 1, 85)],
    (img, v) => {
      const d = img.data, s = hexToRgb(v.shadow), m = hexToRgb(v.mid), hi = hexToRgb(v.high), k = v.mix / 100;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const l = luminance(d[i], d[i + 1], d[i + 2]) / 255;
        let r, g, b;
        if (l < 0.5) {
          const t = l * 2;
          r = s.r + (m.r - s.r) * t;
          g = s.g + (m.g - s.g) * t;
          b = s.b + (m.b - s.b) * t;
        } else {
          const t = (l - 0.5) * 2;
          r = m.r + (hi.r - m.r) * t;
          g = m.g + (hi.g - m.g) * t;
          b = m.b + (hi.b - m.b) * t;
        }
        d[i] = clamp(d[i] * (1 - k) + r * k);
        d[i + 1] = clamp(d[i + 1] * (1 - k) + g * k);
        d[i + 2] = clamp(d[i + 2] * (1 - k) + b * k);
      }
    }
  ),

  // ==========================================
  // 特殊装飾: 聖なる光環 (Holy Halo)
  // ==========================================
  mk("holyHalo", "天上の光輪", "CELESTIAL HALO", "decor", "背後に浮かぶ黄金の円環と放射光輪", "sigil",
    [C("color", "光環色", "#ffea78"), R("radius", "半径比率", 20, 90, 1, 65), R("rays", "放射光条", 0, 16, 1, 8), R("speed", "回転速度", 0, 4, 0.1, 0.8)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color), cx = w / 2, cy = h / 2;
      const r = (v.radius / 100) * (Math.min(w, h) / 2);
      ringPx(img, cx, cy, r, c.r, c.g, c.b, 200, true);
      ringPx(img, cx, cy, r - 1, c.r * 0.8, c.g * 0.8, c.b * 0.8, 120, true);
      if (v.rays > 0) {
        const rot = ctx.t * v.speed;
        for (let ray = 0; ray < v.rays; ray++) {
          const ang = rot + (ray / v.rays) * Math.PI * 2;
          const x0 = cx + Math.cos(ang) * (r * 0.8);
          const y0 = cy + Math.sin(ang) * (r * 0.8);
          const x1 = cx + Math.cos(ang) * (r * 1.35);
          const y1 = cy + Math.sin(ang) * (r * 1.35);
          linePx(img, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), c.r, c.g, c.b, 160, 1, true);
        }
      }
    }, true
  ),

  // ==========================================
  // 特殊装飾: 桜の花びら舞 (Sakura Petals)
  // ==========================================
  mk("sakuraPetals", "桜の花びら舞", "SAKURA DRIFT", "decor", "はらはらと舞い落ちる優雅な桜の花弁", "flower",
    [C("color", "花弁色", "#ffb8d9"), R("count", "花弁数", 4, 50, 1, 16), R("speed", "舞い落ち速度", 0.2, 3, 0.1, 1.0)],
    (img, v, ctx) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      for (let k = 0; k < v.count; k++) {
        const rnd = mulberry32(k * 7331 + 42);
        const x0 = rnd() * w;
        const y0 = rnd() * h;
        const sp = 0.6 + rnd() * 0.8;
        const y = ((y0 + ctx.t * v.speed * 10 * sp) % h);
        const x = ((x0 + Math.sin(ctx.t * 2 * sp + k) * 4) % w + w) % w;
        const px = Math.round(x), py = Math.round(y);
        overPx(img, px, py, c.r, c.g, c.b, 240);
        overPx(img, px + 1, py, c.r * 1.1, c.g * 0.9, c.b * 0.95, 200);
        overPx(img, px, py + 1, c.r * 0.9, c.g * 0.8, c.b * 0.85, 180);
      }
    }, true
  ),
];
