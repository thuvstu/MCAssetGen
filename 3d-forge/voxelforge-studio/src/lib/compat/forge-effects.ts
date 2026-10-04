import type { Builder } from "./forge-builder";
import type { Bounds, EffectState, V3 } from "./forge-types2";
import { TAU, darken, lighten, type Rng } from "./forge-util";

export type EffectCat = "元素" | "天光" | "冥闇" | "自然" | "機構";

export interface EffectCtx {
  b: Builder;
  bounds: Bounds;
  s: EffectState;
  r: Rng;
  id: string;
}

export interface EffectDef {
  id: string;
  glyph: string;
  name: string;
  en: string;
  cat: EffectCat;
  color: string;
  note: string;
  build: (c: EffectCtx) => void;
}

const n = (s: EffectState, base: number) => Math.max(1, Math.round((base * s.amount) / 5));

export const EFFECTS: EffectDef[] = [
  /* ── 元素 ── */
  {
    id: "flame",
    glyph: "焔",
    name: "焔のオーラ",
    en: "FLAME",
    cat: "元素",
    color: "#FF6A1F",
    note: "足元で揺らぐ炎舌と、立ち昇る火の粉。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 1.5) * s.size;
      const core = lighten(s.color, 0.35);
      for (let i = 0; i < n(s, 8); i++) {
        const a = (i / n(s, 8)) * TAU;
        const p: V3 = [8 + Math.cos(a) * R * 0.8, bounds.bottom + 1, 8 + Math.sin(a) * R * 0.8];
        b.group("炎舌", p, [{ kind: "blink", cycles: 3, amp: 1, phase: r() }], id);
        b.box("炎舌", "fx", [p[0], p[1] + 1, p[2]], [1, 2 + (i % 3), 1], { color: s.color });
        b.box("炎芯", "fx", [p[0], p[1] + 0.5, p[2]], [1, 1, 1], { color: core });
      }
      for (let i = 0; i < n(s, 14); i++) {
        const a = r() * TAU;
        const rr = r.range(1, R);
        const p: V3 = [8 + Math.cos(a) * rr, bounds.bottom + r.range(0, 4), 8 + Math.sin(a) * rr];
        b.group("火の粉", p, [{ kind: "rise", cycles: 1 + (i % 2), amp: bounds.max[1] - bounds.bottom + 4, phase: r() }], id);
        b.box("火の粉", "fx", p, [0.5, 0.5, 0.5], { color: i % 3 ? s.color : core, fine: true });
      }
    },
  },
  {
    id: "frost",
    glyph: "霜",
    name: "氷晶の嵐",
    en: "FROST",
    cat: "元素",
    color: "#8FE3FF",
    note: "傾いた氷の結晶が周回し、雪片が静かに降る。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 3) * s.size;
      const c: V3 = [8, bounds.center[1], 8];
      b.group("氷晶の軌道", c, [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }], id);
      const k = n(s, 6);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * TAU;
        const y = c[1] + Math.sin(a * 2) * 3;
        const p: V3 = [8 + Math.cos(a) * R, y, 8 + Math.sin(a) * R];
        const ang = i % 2 ? 22.5 : -45;
        b.box("氷晶", "fx", p, [1, 3, 1], { color: s.color, fine: true, rot: { axis: i % 2 ? "x" : "z", angle: ang as 22.5 | -45 } });
        b.box("氷晶の芯", "fx", [p[0], p[1], p[2]], [0.5, 1.5, 1.5], { color: lighten(s.color, 0.5), fine: true, rot: { axis: "z", angle: 45 } });
      }
      for (let i = 0; i < n(s, 12); i++) {
        const a = r() * TAU;
        const rr = r.range(1, R + 1);
        const p: V3 = [8 + Math.cos(a) * rr, bounds.max[1] + 3, 8 + Math.sin(a) * rr];
        b.group("雪片", p, [{ kind: "rise", cycles: 1, amp: -(bounds.max[1] - bounds.bottom + 3), phase: r() }], id);
        b.box("雪片", "fx", p, [0.5, 0.5, 0.5], { color: "#F4FBFF", fine: true });
      }
    },
  },
  {
    id: "thunder",
    glyph: "雷",
    name: "雷光の弧",
    en: "THUNDER",
    cat: "元素",
    color: "#FFE45C",
    note: "ジグザグの放電が明滅し、本体の周りで弾ける。",
    build({ b, bounds, s, r, id }) {
      const k = n(s, 4);
      const R = (bounds.radius + 2) * s.size;
      for (let i = 0; i < k; i++) {
        const a = (i / k) * TAU + r() * 0.5;
        const o: V3 = [8, bounds.bottom + (bounds.max[1] - bounds.bottom) * r.range(0.3, 0.9), 8];
        b.group("放電", o, [{ kind: "blink", cycles: 4 + (i % 3), amp: 1, phase: r() }], id);
        let p: V3 = [8 + Math.cos(a) * 1.5, o[1], 8 + Math.sin(a) * 1.5];
        const steps = 5;
        for (let j = 1; j <= steps; j++) {
          const t = j / steps;
          const q: V3 = [8 + Math.cos(a) * (1.5 + (R - 1.5) * t) + r.range(-1, 1), o[1] + (j % 2 ? 1.5 : -1.5), 8 + Math.sin(a) * (1.5 + (R - 1.5) * t) + r.range(-1, 1)];
          b.line("雷", "fx", p, q, 0.5, { color: j === steps ? "#FFFFFF" : s.color, fine: true });
          p = q;
        }
      }
      b.group("雷環", [8, bounds.center[1], 8], [{ kind: "spin", axis: "y", cycles: 3, amp: 0 }, { kind: "blink", cycles: 6, amp: 1 }], id);
      b.ring("雷環", "fx", "xz", [8, bounds.center[1], 8], R * 0.9, 0.9, 1, { color: lighten(s.color, 0.3) });
    },
  },
  {
    id: "bubbles",
    glyph: "泡",
    name: "水泡",
    en: "BUBBLES",
    cat: "元素",
    color: "#5CC8FF",
    note: "揺らぎながら浮かぶ気泡。水の加護や毒の沼にも。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 2) * s.size;
      for (let i = 0; i < n(s, 12); i++) {
        const a = r() * TAU;
        const rr = r.range(1, R);
        const p: V3 = [8 + Math.cos(a) * rr, bounds.bottom, 8 + Math.sin(a) * rr];
        const sz = i % 4 === 0 ? 1.5 : i % 2 ? 1 : 0.75;
        b.group("泡", p, [{ kind: "rise", cycles: 1, amp: bounds.max[1] - bounds.bottom + 2, phase: r() }, { kind: "sway", axis: "z", cycles: 3, amp: 20, phase: r() }], id);
        b.box("泡", "fx", p, [sz, sz, sz], { color: i % 3 ? s.color : lighten(s.color, 0.55), fine: true });
      }
    },
  },
  /* ── 天光 ── */
  {
    id: "halo",
    glyph: "輪",
    name: "光輪",
    en: "HALO",
    cat: "天光",
    color: "#FFE9A8",
    note: "頂の上に浮かぶ光の環。ゆっくり回り上下する。",
    build({ b, bounds, s, id }) {
      const c: V3 = [8, Math.min(30, bounds.top + 3), 8];
      b.group("光輪", c, [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }, { kind: "bob", cycles: 2, amp: 0.7 }], id);
      const R = Math.max(2.5, 3.2 * s.size + s.amount * 0.15);
      b.ring("光輪", "fx", "xz", c, R, 1, 1, { color: s.color });
      if (s.amount > 5) b.ring("光輪・内", "fx", "xz", c, R - 1.5, 0.8, 1, { color: lighten(s.color, 0.5) });
    },
  },
  {
    id: "stars",
    glyph: "星",
    name: "星屑",
    en: "STARDUST",
    cat: "天光",
    color: "#FFFFFF",
    note: "十字に瞬く星がまわりに散らばる。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 4) * s.size;
      for (let i = 0; i < n(s, 10); i++) {
        const a = r() * TAU;
        const rr = r.range(2, R);
        const p: V3 = [8 + Math.cos(a) * rr, r.range(bounds.bottom, bounds.max[1] + 3), 8 + Math.sin(a) * rr];
        b.group("星", p, [{ kind: "blink", cycles: 2 + (i % 3), amp: 1, phase: r() }], id);
        const big = i % 3 === 0;
        b.box("星", "fx", p, [big ? 2 : 1.5, 0.5, 0.5], { color: s.color, fine: true });
        b.box("星", "fx", p, [0.5, big ? 2 : 1.5, 0.5], { color: s.color, fine: true });
      }
    },
  },
  {
    id: "wings",
    glyph: "翼",
    name: "光の翼",
    en: "WINGS",
    cat: "天光",
    color: "#FFF4D6",
    note: "背に重なる羽根板。羽ばたきは左右対称に揺れる。",
    build({ b, bounds, s, id }) {
      const y = bounds.center[1] + 1;
      const z = 8 - Math.max(1.5, bounds.radius * 0.35);
      const span = 5 + s.size * 4;
      const rows = Math.max(3, Math.min(7, Math.round(2 + s.amount / 2)));
      ([-1, 1] as const).forEach((d) => {
        const o: V3 = [8 + d * 1.5, y, z];
        b.group(d < 0 ? "左翼" : "右翼", o, [{ kind: "sway", axis: "y", cycles: 2, amp: d * 18 }], id);
        for (let i = 0; i < rows; i++) {
          const t = i / (rows - 1);
          const len = span * (1 - t * 0.55);
          const yy = y + 3 - i * 1.5;
          b.box("羽根", "fx", [o[0] + d * (len / 2 + 0.5), yy, z - i * 0.25], [len, 1, 0.5], {
            color: i % 2 ? darken(s.color, 0.12) : s.color,
            fine: true,
            rot: { axis: "z", angle: (d > 0 ? 22.5 : -22.5) as 22.5 | -22.5, origin: [o[0], yy, z] },
          });
        }
      });
    },
  },
  {
    id: "pillar",
    glyph: "柱",
    name: "聖柱",
    en: "PILLAR",
    cat: "天光",
    color: "#FFD36E",
    note: "中心を貫く光の柱と、昇ってゆく光の帯。",
    build({ b, bounds, s, r, id }) {
      const w = Math.max(1, Math.round(s.size * 2));
      const y0 = bounds.bottom - 1;
      const h = Math.min(31 - y0, bounds.max[1] - y0 + 8);
      b.group("光柱", [8, y0, 8], [{ kind: "pulse", cycles: 2, amp: 0.12 }], id);
      b.box("光柱", "fx", [8, y0 + h / 2, 8], [w, h, w], { color: lighten(s.color, 0.2), fine: true });
      for (let i = 0; i < n(s, 3); i++) {
        const c: V3 = [8, y0 + 1, 8];
        b.group("光の帯", c, [{ kind: "rise", cycles: 1, amp: h - 2, phase: i / n(s, 3) + r() * 0.05 }], id);
        b.ring("光の帯", "fx", "xz", c, 2 + w + s.size, 0.8, 1, { color: s.color });
      }
    },
  },
  {
    id: "slash",
    glyph: "閃",
    name: "斬撃の軌跡",
    en: "SLASH",
    cat: "天光",
    color: "#D9F2FF",
    note: "本体を掠める三日月の残光が弧を描いて回る。",
    build({ b, bounds, s, id }) {
      const c: V3 = [8, bounds.center[1], 8];
      const R = (bounds.radius + 3) * s.size + (bounds.max[1] - bounds.bottom) * 0.15;
      b.group("斬撃", c, [{ kind: "spin", axis: "z", cycles: 2, amp: 0 }], id);
      const k = 10 + s.amount;
      for (let i = 0; i < k; i++) {
        const t = i / (k - 1);
        const a = Math.PI * (0.15 + t * 0.9);
        const th = 0.5 + Math.sin(t * Math.PI) * 1.5;
        b.box("残光", "fx", [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2] + 1], [th, th, 0.5], {
          color: t > 0.75 ? "#FFFFFF" : s.color,
          fine: true,
        });
      }
    },
  },
  /* ── 冥闇 ── */
  {
    id: "void",
    glyph: "虚",
    name: "虚無の裂け目",
    en: "VOID",
    cat: "冥闇",
    color: "#8A3CFF",
    note: "背後に開く暗い環。脈打つ中心へ粒子が吸い込まれる。",
    build({ b, bounds, s, r, id }) {
      const c: V3 = [8, bounds.center[1], 8 - bounds.radius - 2];
      const R = Math.max(3, (bounds.max[1] - bounds.bottom) * 0.3 * s.size);
      b.group("裂け目", c, [{ kind: "spin", axis: "z", cycles: -1, amp: 0 }, { kind: "pulse", cycles: 2, amp: 0.06 }], id);
      b.ring("裂け目・縁", "fx", "xy", c, R, 1.2, 1, { color: s.color });
      b.ring("裂け目・内", "fx", "xy", c, R - 1.5, 1, 1, { color: darken(s.color, 0.55) });
      b.box("深淵", "shade", c, [R * 1.2, R * 1.2, 0.5], { color: "#07040E", fine: true });
      for (let i = 0; i < n(s, 8); i++) {
        const a = (i / n(s, 8)) * TAU;
        const p: V3 = [c[0] + Math.cos(a) * (R + 2), c[1] + Math.sin(a) * (R + 2), c[2] + 0.5];
        b.group("吸引粒子", c, [{ kind: "spin", axis: "z", cycles: -2, amp: 0, phase: r() }, { kind: "pulse", cycles: 2, amp: -0.35, phase: r() }], id);
        b.box("吸引粒子", "fx", p, [0.75, 0.75, 0.75], { color: lighten(s.color, 0.3), fine: true });
      }
    },
  },
  {
    id: "miasma",
    glyph: "瘴",
    name: "瘴気",
    en: "MIASMA",
    cat: "冥闇",
    color: "#7BD33A",
    note: "足元に淀む毒の靄。膨らみ萎みを繰り返す。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 2) * s.size;
      for (let i = 0; i < n(s, 10); i++) {
        const a = r() * TAU;
        const rr = r.range(0.5, R);
        const p: V3 = [8 + Math.cos(a) * rr, bounds.bottom + r.range(0, 2.5), 8 + Math.sin(a) * rr];
        const sz = r.range(1.5, 3);
        b.group("瘴気", p, [{ kind: "pulse", cycles: 1, amp: 0.3, phase: r() }, { kind: "bob", cycles: 1, amp: 0.8, phase: r() }], id);
        b.box("瘴気", "fx", p, [sz, sz * 0.7, sz], { color: i % 3 ? s.color : darken(s.color, 0.4), fine: true });
      }
    },
  },
  {
    id: "chains",
    glyph: "鎖",
    name: "封印の鎖",
    en: "CHAINS",
    cat: "冥闇",
    color: "#9AA3AD",
    note: "螺旋に巻きつく鎖。ゆっくりと締め上げるように回る。",
    build({ b, bounds, s, id }) {
      const c: V3 = [8, bounds.center[1], 8];
      const R = (bounds.radius + 1.5) * s.size;
      const h = bounds.max[1] - bounds.bottom;
      b.group("鎖", c, [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }], id);
      const links = 14 + s.amount * 3;
      for (let i = 0; i < links; i++) {
        const t = i / links;
        const a = t * TAU * 2;
        const p: V3 = [8 + Math.cos(a) * R, bounds.bottom + 1 + t * (h - 1), 8 + Math.sin(a) * R];
        b.box("鎖環", "metal", p, i % 2 ? [1.25, 0.5, 0.5] : [0.5, 0.5, 1.25], { color: i % 2 ? s.color : darken(s.color, 0.3), fine: true });
      }
      b.box("錠", "fx", [8 + R, bounds.bottom + h * 0.5, 8], [1.5, 1.5, 1], { color: "#D9482B", fine: true });
    },
  },
  {
    id: "smoke",
    glyph: "煙",
    name: "黒煙",
    en: "SMOKE",
    cat: "冥闇",
    color: "#3B3833",
    note: "重く立ち昇り、膨らみながら消えてゆく煙。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 1) * s.size;
      for (let i = 0; i < n(s, 9); i++) {
        const a = r() * TAU;
        const rr = r.range(0, R);
        const p: V3 = [8 + Math.cos(a) * rr, bounds.top - 2, 8 + Math.sin(a) * rr];
        const sz = r.range(1.5, 2.5);
        b.group("煙", p, [{ kind: "rise", cycles: 1, amp: 8, phase: r() }], id);
        b.box("煙", "base", p, [sz, sz, sz], { color: i % 2 ? s.color : lighten(s.color, 0.2), fine: true });
      }
    },
  },
  /* ── 自然 ── */
  {
    id: "sakura",
    glyph: "桜",
    name: "桜吹雪",
    en: "SAKURA",
    cat: "自然",
    color: "#FFB7CF",
    note: "舞い落ちる花びら。くるくると回りながら降る。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 4) * s.size;
      for (let i = 0; i < n(s, 14); i++) {
        const a = r() * TAU;
        const rr = r.range(1, R);
        const p: V3 = [8 + Math.cos(a) * rr, Math.min(30, bounds.max[1] + 4), 8 + Math.sin(a) * rr];
        b.group("花びら", p, [
          { kind: "rise", cycles: 1, amp: -(bounds.max[1] - bounds.bottom + 5), phase: r() },
          { kind: "spin", axis: i % 2 ? "x" : "z", cycles: 2, amp: 0, phase: r() },
        ], id);
        b.box("花びら", "fx", p, [1, 0.25, 0.75], { color: i % 4 ? s.color : "#FFFFFF", fine: true });
      }
    },
  },
  {
    id: "leaves",
    glyph: "葉",
    name: "若葉の旋風",
    en: "LEAVES",
    cat: "自然",
    color: "#6FCF4A",
    note: "螺旋を描いて巻き上がる木の葉。森の加護。",
    build({ b, bounds, s, r, id }) {
      const h = bounds.max[1] - bounds.bottom;
      const R = (bounds.radius + 2.5) * s.size;
      b.group("旋風", [8, bounds.bottom, 8], [{ kind: "spin", axis: "y", cycles: 2, amp: 0 }], id);
      const k = n(s, 16);
      for (let i = 0; i < k; i++) {
        const t = i / k;
        const a = t * TAU * 2.5 + r() * 0.3;
        const rr = R * (0.5 + t * 0.6);
        b.box("葉", "fx", [8 + Math.cos(a) * rr, bounds.bottom + t * h, 8 + Math.sin(a) * rr], [1, 0.25, 1.5], {
          color: i % 3 ? s.color : darken(s.color, 0.35),
          fine: true,
          rot: { axis: "y", angle: i % 2 ? 45 : -22.5 },
        });
      }
    },
  },
  {
    id: "aurora",
    glyph: "極",
    name: "極光の帯",
    en: "AURORA",
    cat: "自然",
    color: "#5CFFC8",
    note: "位相をずらして波打つ光の帯。後光のように揺れる。",
    build({ b, bounds, s, id }) {
      const k = 10 + s.amount;
      const R = (bounds.radius + 3) * s.size;
      for (let i = 0; i < k; i++) {
        const a = Math.PI * (0.05 + (i / (k - 1)) * 0.9);
        const p: V3 = [8 + Math.cos(a) * R, bounds.center[1] + 2, 8 - Math.sin(a) * R * 0.6];
        b.group("極光", p, [{ kind: "bob", cycles: 1, amp: 1.5, phase: i / k }], id);
        b.box("極光", "fx", p, [1, 4, 0.5], { color: i % 2 ? s.color : lighten(s.color, 0.3), fine: true });
      }
    },
  },
  /* ── 機構 ── */
  {
    id: "satellites",
    glyph: "衛",
    name: "衛星宝石",
    en: "SATELLITES",
    cat: "機構",
    color: "#FF4D6D",
    note: "高さと速度の違う三つの軌道を宝石が周回する。",
    build({ b, bounds, s, r, id }) {
      const levels = [0.25, 0.55, 0.85];
      levels.forEach((lv, li) => {
        const c: V3 = [8, bounds.bottom + (bounds.max[1] - bounds.bottom) * lv, 8];
        b.group("衛星軌道", c, [{ kind: "spin", axis: "y", cycles: li % 2 ? -1 : 1 + li, amp: 0 }], id);
        const k = Math.max(1, Math.round(s.amount / 3));
        b.around(k, (bounds.radius + 3 + li) * s.size, c, (p, a, i) => {
          b.box("宝石", "gem", p, [1.5, 1.5, 1.5], { color: s.color, fine: true, rot: { axis: "y", angle: 45 } });
          b.box("宝石の座", "metal", [p[0], p[1] - 1, p[2]], [1, 0.5, 1], { fine: true });
        }, "xz", r() * TAU);
      });
    },
  },
  {
    id: "vortex",
    glyph: "渦",
    name: "魔力の渦",
    en: "VORTEX",
    cat: "機構",
    color: "#4DA3FF",
    note: "足元から螺旋状に巻き上がる魔力の奔流。",
    build({ b, bounds, s, id }) {
      const arms = 3;
      for (let arm = 0; arm < arms; arm++) {
        b.group("渦", [8, bounds.bottom, 8], [{ kind: "spin", axis: "y", cycles: 2, amp: 0, phase: arm / arms }], id);
        const k = 6 + s.amount;
        for (let i = 0; i < k; i++) {
          const t = i / k;
          const a = t * Math.PI * 1.5;
          const rr = (1.5 + t * (bounds.radius + 3)) * s.size;
          b.box("渦粒", "fx", [8 + Math.cos(a) * rr, bounds.bottom + 0.5 + t * 3, 8 + Math.sin(a) * rr], [1 - t * 0.5, 0.5, 1 - t * 0.5], {
            color: t < 0.3 ? lighten(s.color, 0.5) : s.color,
            fine: true,
          });
        }
      }
    },
  },
  {
    id: "runering",
    glyph: "環",
    name: "ルーン環",
    en: "RUNE ORBIT",
    cat: "機構",
    color: "#D9482B",
    note: "縦に立つ字板が中腹を巡る。字の形はシードで変わる。",
    build({ b, bounds, s, r, id }) {
      const c: V3 = [8, bounds.center[1], 8];
      b.group("ルーン環", c, [{ kind: "spin", axis: "y", cycles: -1, amp: 0 }], id);
      const k = n(s, 8);
      b.around(k, (bounds.radius + 2.5) * s.size, c, (p, a) => {
        const rot = { axis: "y" as const, angle: 0 as const };
        void rot;
        b.box("字板", "fx", p, [1.5, 2, 0.5], { color: s.color, fine: true });
        if (r() > 0.4) b.box("字画", "fx", [p[0], p[1] + 1.5, p[2]], [0.5, 1, 0.5], { color: lighten(s.color, 0.4), fine: true });
        if (r() > 0.5) b.box("字画", "fx", [p[0], p[1] - 1.5, p[2]], [1, 0.5, 0.5], { color: lighten(s.color, 0.4), fine: true });
      });
    },
  },
  {
    id: "groundsigil",
    glyph: "陣",
    name: "足元の陣",
    en: "GROUND SIGIL",
    cat: "機構",
    color: "#FFB23F",
    note: "床に描かれる回転陣。外環と十字が逆方向に回る。",
    build({ b, bounds, s, id }) {
      const c: V3 = [8, bounds.bottom - 0.5, 8];
      const R = (bounds.radius + 3) * s.size;
      b.group("陣・外", c, [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }], id);
      b.ring("陣・外環", "fx", "xz", c, R, 1, 1, { color: s.color });
      b.around(4 + Math.round(s.amount / 2), R + 1.5, c, (p) => b.box("陣の字", "fx", p, [1, 0.5, 1], { color: lighten(s.color, 0.4), fine: true }));
      b.group("陣・内", c, [{ kind: "spin", axis: "y", cycles: -2, amp: 0 }], id);
      b.ring("陣・内環", "fx", "xz", c, R * 0.55, 0.8, 1, { color: s.color });
      b.box("陣・十字", "fx", c, [R * 1.4, 0.25, 0.5], { color: s.color, fine: true });
      b.box("陣・十字", "fx", c, [0.5, 0.25, R * 1.4], { color: s.color, fine: true });
    },
  },
  {
    id: "gears",
    glyph: "歯",
    name: "歯車機構",
    en: "GEARWORK",
    cat: "機構",
    color: "#C9A24A",
    note: "大小の歯車が噛み合い、互いに逆回転しながら漂う。",
    build({ b, bounds, s, r, id }) {
      const k = Math.max(2, Math.min(6, Math.round(s.amount / 2) + 1));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * TAU + r() * 0.5;
        const rr = (bounds.radius + 2.5 + (i % 3)) * s.size;
        const p: V3 = [8 + Math.cos(a) * rr, bounds.bottom + 2 + ((i * 5) % Math.max(3, bounds.max[1] - bounds.bottom - 2)), 8 + Math.sin(a) * rr];
        const R = 1.4 + (i % 3) * 0.7;
        const g = b.defineGroup(`歯車${i + 1}`, p, {
          idle: [{ kind: "spin", axis: "z", cycles: i % 2 ? -1 : 1, amp: 0, phase: r() }, { kind: "bob", cycles: 1, amp: 0.5, phase: i / k }],
          attack: [{ kind: "spin", axis: "z", cycles: i % 2 ? -4 : 4, amp: 0 }],
          guard: [{ kind: "spin", axis: "z", cycles: i % 2 ? -2 : 2, amp: 0 }],
          cast: [{ kind: "spin", axis: "z", cycles: i % 2 ? -3 : 3, amp: 0 }],
          transform: [{ kind: "spin", axis: "z", cycles: 2, amp: 0 }],
        });
        b.into(g, () => {
          b.ring("歯車", "metal", "xy", p, R, 0.9, 1, { color: s.color });
          b.around(6 + (i % 2) * 2, R + 0.8, p, (pt) => b.box("歯", "metal", pt, [0.6, 0.6, 0.6], { color: s.color, fine: true }), "xy");
          b.box("軸", "shade", p, [0.75, 0.75, 1.2], { fine: true });
        });
      }
    },
  },
  {
    id: "bloodmist",
    glyph: "血",
    name: "血の霧",
    en: "BLOODMIST",
    cat: "冥闇",
    color: "#B3121E",
    note: "重い霧が足元に淀み、血滴が尾を引いて落ちる。",
    build({ b, bounds, s, r, id }) {
      const R = (bounds.radius + 2) * s.size;
      for (let i = 0; i < n(s, 8); i++) {
        const a = r() * TAU;
        const rr = r.range(0.5, R);
        const p: V3 = [8 + Math.cos(a) * rr, bounds.bottom + r.range(0, 1.5), 8 + Math.sin(a) * rr];
        const sz = r.range(1.5, 2.8);
        b.group("血霧", p, [{ kind: "pulse", cycles: 1, amp: 0.25, phase: r() }, { kind: "sway", axis: "y", cycles: 1, amp: 10, phase: r() }], id);
        b.box("血霧", "fx", p, [sz, sz * 0.5, sz], { color: i % 3 ? s.color : darken(s.color, 0.45), fine: true });
      }
      for (let i = 0; i < n(s, 8); i++) {
        const a = r() * TAU;
        const rr = r.range(1, R * 0.8);
        const p: V3 = [8 + Math.cos(a) * rr, r.range(bounds.center[1], bounds.max[1]), 8 + Math.sin(a) * rr];
        b.group("血滴", p, [{ kind: "rise", cycles: 1 + (i % 2), amp: -(p[1] - bounds.bottom + 1), phase: r() }], id);
        b.box("血滴", "fx", p, [0.5, 1, 0.5], { color: lighten(s.color, i % 4 === 0 ? 0.3 : 0), fine: true });
      }
    },
  },
  {
    id: "phantoms",
    glyph: "幻",
    name: "幻影分身",
    en: "PHANTOMS",
    cat: "冥闇",
    color: "#9FC6FF",
    note: "輪郭だけを残した分身が、一瞬遅れて同じ動きをなぞる。",
    build({ b, bounds, s, r, id }) {
      const h = Math.max(3, (bounds.max[1] - bounds.bottom) * 0.72 * s.size);
      const w = Math.max(2, (bounds.radius + 1) * 0.9 * s.size);
      const k = n(s, 4);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * TAU + r() * 0.5;
        const off = bounds.radius + 3 + i * 1.6;
        const px = 8 + Math.cos(a) * off;
        const pz = 8 + Math.sin(a) * off;
        const py = bounds.bottom + h / 2 + (i % 2 ? 1 : -1);
        const g = b.defineGroup(`幻影${i + 1}`, [px, py, pz], {
          idle: [
            { kind: "bob", cycles: 1, amp: 0.7, phase: i / k },
            { kind: "sway", axis: "y", cycles: 1, amp: 12, phase: r() },
            { kind: "blink", cycles: 1, amp: 1, phase: i / k },
          ],
          // 本体の一撃を、遅れてなぞる
          attack: [
            { kind: "swing", axis: "x", cycles: 1, amp: -60, window: [0.3, 1] },
            { kind: "turn", axis: "y", cycles: 1, amp: 360 },
            { kind: "blink", cycles: 2, amp: 1 },
          ],
          cast: [{ kind: "turn", axis: "y", cycles: 1, amp: 720 }, { kind: "blink", cycles: 3, amp: 1 }],
          transform: [{ kind: "turn", axis: "z", cycles: 1, amp: 360 }, { kind: "blink", cycles: 2, amp: 1 }],
        });
        b.into(g, () => {
          const tint = i % 2 ? s.color : lighten(s.color, 0.35);
          b.box("幻影・左", "fx", [px - w / 2, py, pz], [0.5, h, 0.5], { color: tint, fine: true });
          b.box("幻影・右", "fx", [px + w / 2, py, pz], [0.5, h, 0.5], { color: tint, fine: true });
          b.box("幻影・天", "fx", [px, py + h / 2, pz], [w, 0.5, 0.5], { color: tint, fine: true });
          b.box("幻影・地", "fx", [px, py - h / 2, pz], [w, 0.5, 0.5], { color: tint, fine: true });
          b.box("幻影・面", "fx", [px, py + 0.5, pz - 0.4], [w - 0.5, h - 2, 0.25], { color: darken(s.color, 0.62), fine: true });
          b.box("幻影・首", "fx", [px, py + h / 2 - 1.5, pz], [1, 1, 1], { color: "#FFFFFF", fine: true });
        });
      }
    },
  },
  {
    id: "shatter",
    glyph: "砕",
    name: "浮遊する破片",
    en: "SHATTER",
    cat: "機構",
    color: "#C9CED6",
    note: "本体から剥がれた破片が、周囲で漂い傾いている。",
    build({ b, bounds, s, r, id }) {
      for (let i = 0; i < n(s, 8); i++) {
        const a = r() * TAU;
        const rr = (bounds.radius + r.range(1.5, 4)) * s.size;
        const p: V3 = [8 + Math.cos(a) * rr, r.range(bounds.bottom + 2, bounds.max[1]), 8 + Math.sin(a) * rr];
        b.group("破片", p, [{ kind: "bob", cycles: 1, amp: 0.8, phase: r() }, { kind: "sway", axis: "x", cycles: 1, amp: 25, phase: r() }], id);
        b.box("破片", "base", p, [r.range(0.75, 2), r.range(0.5, 1.5), 0.5], {
          color: i % 3 ? s.color : darken(s.color, 0.3),
          fine: true,
          rot: { axis: i % 2 ? "z" : "x", angle: i % 2 ? 22.5 : -45 },
        });
      }
    },
  },
];

export const EFFECT_CATS: EffectCat[] = ["元素", "天光", "冥闇", "自然", "機構"];
export const effectById = (id: string) => EFFECTS.find((e) => e.id === id);
