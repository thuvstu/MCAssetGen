import type { Builder } from "./builder";
import type { KindDef } from "./kinds/types";
import type { AnimSpec, Bounds, Palette, Params, V3 } from "./types";
import { TAU, clamp, darken, lighten, mix, type Rng } from "./util";

const C = 8;

/* ─────────── 段階強化 ─────────── */
export interface Rank {
  no: string;
  name: string;
  en: string;
  note: string;
}
export const RANKS: Rank[] = [
  { no: "0", name: "素体", en: "RAW", note: "鍛えたまま。装飾はなく、素の輪郭だけが立つ。" },
  { no: "I", name: "研磨", en: "HONED", note: "金の輪をひとつ。稜線が磨かれ、光を拾いはじめる。" },
  { no: "II", name: "銘入", en: "INSCRIBED", note: "銘板が刻まれ、文字が淡く灯る。" },
  { no: "III", name: "宝装", en: "JEWELED", note: "宝玉が近くを巡り、台座が据えられる。" },
  { no: "IV", name: "霊装", en: "BLESSED", note: "守護板が浮かび、器の周囲を守る。" },
  { no: "V", name: "神装", en: "DIVINE", note: "光輪と羽片。器はもはや道具の域を出る。" },
];

/* ─────────── 形態 ─────────── */
export const FORM_LABELS: Record<KindDef["family"], { label: string; sub: string; note: string }[]> = {
  武器: [
    { label: "封印", sub: "SEALED", note: "布と鎖で縛られ、力は眠っている。" },
    { label: "解放", sub: "RELEASED", note: "封を解いた標準の姿。" },
    { label: "真", sub: "TRUE", note: "刀身が分かたれ、宙で組み上がる。" },
  ],
  魔導: [
    { label: "静止", sub: "DORMANT", note: "術式は閉じ、灯は最小。" },
    { label: "起動", sub: "ACTIVE", note: "術式が巡る通常の姿。" },
    { label: "顕現", sub: "MANIFEST", note: "構造が分解し、核が露わになる。" },
  ],
  防具: [
    { label: "収納", sub: "STOWED", note: "畳まれ、留め具で固定されている。" },
    { label: "装着", sub: "WORN", note: "そのまま身に着ける姿。" },
    { label: "展開", sub: "DEPLOYED", note: "各層が浮き、間に光が満ちる。" },
  ],
  装飾: [
    { label: "眠り", sub: "ASLEEP", note: "力を秘めて沈黙している。" },
    { label: "覚醒", sub: "AWAKE", note: "常の姿。衛星が巡る。" },
    { label: "昇華", sub: "ASCENDED", note: "全体が解け、光の層になる。" },
  ],
  機巧: [
    { label: "停止", sub: "SHUTDOWN", note: "動力は落ち、機構は固定されている。" },
    { label: "稼働", sub: "RUNNING", note: "通常運転。機構が回り続ける。" },
    { label: "超駆動", sub: "OVERCLOCK", note: "装甲が開き、内部機構が露出する。" },
  ],
  凶刃: [
    { label: "鎮静", sub: "SEDATED", note: "鎖と封で、渇きを抑えこんでいる。" },
    { label: "渇望", sub: "HUNGRY", note: "常の姿。獲物を探している。" },
    { label: "暴走", sub: "FRENZY", note: "器が割れ、本性が溢れ出す。" },
  ],
};

/* ─────────── モード ─────────── */
export interface ModeDef {
  id: string;
  glyph: string;
  name: string;
  en: string;
  note: string;
}
export const MODES: ModeDef[] = [
  { id: "none", glyph: "常", name: "通常", en: "NORMAL", note: "追加の状態なし。" },
  { id: "sheath", glyph: "鞘", name: "鞘・収納", en: "SHEATHED", note: "覆いを被せ、光を潜める。" },
  { id: "charge", glyph: "充", name: "充填", en: "CHARGED", note: "環が脈打ち、発光が増す。" },
  { id: "overload", glyph: "過", name: "過負荷", en: "OVERLOAD", note: "亀裂が走り、蒸気が噴く。" },
  { id: "channel", glyph: "詠", name: "詠唱", en: "CHANNELING", note: "足元に術式、字が昇る。" },
];
export const modeById = (id: string) => MODES.find((m) => m.id === id) ?? MODES[0];

/* ─────────── 配色への作用 ─────────── */
export function dressPalette(base: Palette, p: Params): Palette {
  const t = p.tier / 5;
  let pal: Palette = {
    base: base.base,
    shade: base.shade,
    metal: lighten(base.metal, t * 0.25),
    glow: lighten(base.glow, t * 0.2),
  };
  if (p.form === 0) {
    pal = {
      base: mix(pal.base, pal.shade, 0.42),
      shade: darken(pal.shade, 0.2),
      metal: mix(pal.metal, "#6B6358", 0.45),
      glow: mix(pal.glow, "#4A4740", 0.55),
    };
  } else if (p.form === 2) {
    pal = { ...pal, glow: lighten(pal.glow, 0.28), metal: lighten(pal.metal, 0.15) };
  }
  if (p.mode === "sheath") pal = { ...pal, glow: mix(pal.glow, pal.shade, 0.6) };
  if (p.mode === "charge") pal = { ...pal, glow: lighten(pal.glow, 0.35) };
  if (p.mode === "overload") pal = { ...pal, base: darken(pal.base, 0.22), glow: mix(pal.glow, "#FFF2C2", 0.45) };
  if (p.overdrive) {
    pal = {
      base: darken(pal.base, 0.35),
      shade: darken(pal.shade, 0.4),
      metal: lighten(pal.metal, 0.3),
      glow: lighten(pal.glow, 0.55),
    };
  }
  return pal;
}

/** 効果の密度に効く倍率 */
export function dressAmount(p: Params) {
  let k = 1 + p.tier * 0.1;
  if (p.form === 0) k *= 0.45;
  if (p.form === 2) k *= 1.2;
  if (p.overdrive) k *= 1.35;
  if (p.mode === "sheath") k *= 0.4;
  if (p.mode === "charge") k *= 1.2;
  return k;
}

const burst = (amp: number, window: [number, number] = [0.25, 1]): AnimSpec => ({ kind: "burst", cycles: 1, amp, window });

/* ─────────── 段階の装飾（全型共通） ─────────── */
export function tierDressing(b: Builder, p: Params, bd: Bounds, r: Rng) {
  const t = p.tier;
  if (t < 1) return;
  const cy = bd.center[1];
  const R = bd.radius;

  if (t >= 1) {
    b.ring("階梯の輪", "metal", "xz", [C, bd.bottom + 0.5, C], R + 0.8, 1, 1);
  }
  if (t >= 2) {
    const n = 4;
    b.around(n, R + 1.2, [C, cy, C], (pt, a, i) => {
      b.box("銘板", "metal", pt, [1.5, 2.5, 1.5], { fine: true, rot: { axis: "y", angle: i % 2 ? 22.5 : -22.5 } });
      b.box("銘", "glow", [pt[0], pt[1], pt[2]], [1, 1.5, 1.75], { fine: true });
    });
  }
  if (t >= 3) {
    const g = b.defineGroup("宝玉環", [C, cy, C], {
      idle: [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }],
      attack: [{ kind: "spin", axis: "y", cycles: 2, amp: 0 }, burst(0.7, [0.3, 1])],
      cast: [{ kind: "spin", axis: "y", cycles: 3, amp: 0 }, burst(0.5)],
      transform: [{ kind: "spin", axis: "y", cycles: 2, amp: 0 }, burst(0.9, [0.1, 0.9])],
    });
    b.into(g, () => {
      b.around(3, R + 2.2, [C, cy + 1, C], (pt) => {
        b.box("宝玉", "gem", pt, [1.5, 1.5, 1.5], { fine: true, rot: { axis: "y", angle: 45 } });
        b.box("玉座", "metal", [pt[0], pt[1] - 1.25, pt[2]], [1, 0.5, 1], { fine: true });
      });
    });
  }
  if (t >= 4) {
    const plates = 4;
    for (let i = 0; i < plates; i++) {
      const a = (i / plates) * TAU + 0.4;
      const px = C + Math.cos(a) * (R + 3);
      const pz = C + Math.sin(a) * (R + 3);
      const py = cy + (i % 2 ? 2 : -2);
      const g = b.defineGroup(`守護板${i + 1}`, [px, py, pz], {
        idle: [{ kind: "bob", cycles: 1, amp: 0.5, phase: i / plates }, { kind: "sway", axis: "z", cycles: 1, amp: 8, phase: r() }],
        attack: [{ kind: "thrust", axis: "z", cycles: 1, amp: 3, window: [0.25, 1] }, burst(0.4, [0.3, 1])],
        cast: [
          { kind: "turn", axis: "y", cycles: 1, amp: 360 },
          { kind: "shift", axis: "y", cycles: 1, amp: 2, window: [0, 0.45] },
          { kind: "shift", axis: "y", cycles: 1, amp: -2, window: [0.55, 1] },
        ],
        transform: [{ kind: "turn", axis: "y", cycles: 1, amp: 360 }, burst(0.8, [0.1, 0.9])],
      });
      b.into(g, () => {
        b.box("守護板", "metal", [px, py, pz], [1.5, 4, 0.75], { fine: true, rot: { axis: "z", angle: i % 2 ? 22.5 : -22.5 } });
        b.box("守護の灯", "glow", [px, py, pz], [0.75, 2, 1.25], { fine: true });
      });
    }
  }
  if (t >= 5) {
    const hy = Math.min(30, bd.top + 2.5);
    const g = b.defineGroup("神装の輪", [C, hy, C], {
      idle: [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }, { kind: "bob", cycles: 2, amp: 0.5 }],
      attack: [{ kind: "spin", axis: "y", cycles: 3, amp: 0 }, burst(0.6, [0.3, 1])],
      cast: [
        { kind: "spin", axis: "y", cycles: 4, amp: 0 },
        { kind: "shift", axis: "y", cycles: 1, amp: 3, window: [0, 0.45] },
        { kind: "shift", axis: "y", cycles: 1, amp: -3, window: [0.55, 1] },
        burst(0.6),
      ],
      transform: [{ kind: "spin", axis: "y", cycles: 2, amp: 0 }, burst(1.1, [0.05, 0.9])],
    });
    b.into(g, () => {
      b.ring("神装の輪", "glow", "xz", [C, hy, C], R + 1.5, 1, 1);
      b.around(6, R + 1.5, [C, hy, C], (pt, a, i) => {
        if (i % 2) return;
        b.box("羽片", "gem", [pt[0], pt[1] + 1, pt[2]], [1, 2, 1], { fine: true, rot: { axis: "x", angle: 22.5 } });
      });
    });
  }
}

/* ─────────── 限界突破 ─────────── */
export function overdriveDressing(b: Builder, p: Params, bd: Bounds, r: Rng) {
  const cy = bd.center[1];
  const R = bd.radius;
  // 亀裂
  for (let i = 0; i < 10; i++) {
    const a = r() * TAU;
    const y = r.range(bd.bottom + 1, bd.max[1] - 1);
    const rr = R * r.range(0.5, 0.95);
    const p0: V3 = [C + Math.cos(a) * rr, y, C + Math.sin(a) * rr];
    const g = b.defineGroup(`亀裂${i}`, p0, {
      idle: [{ kind: "blink", cycles: 2 + (i % 3), amp: 1, phase: r() }],
      attack: [burst(1.6, [0.28, 1])],
      cast: [{ kind: "blink", cycles: 6, amp: 1 }],
      transform: [burst(2, [0.05, 0.85])],
    });
    b.into(g, () => {
      let cur = p0;
      for (let k = 0; k < 3; k++) {
        const nx: V3 = [cur[0] + r.range(-1, 1), cur[1] + r.range(0.75, 1.75), cur[2] + r.range(-1, 1)];
        b.line("亀裂", "fx", cur, nx, 0.5, { color: "#FFFFFF", fine: true });
        cur = nx;
      }
    });
  }
  // 二重の極光環
  const g2 = b.defineGroup("極環", [C, cy, C], {
    idle: [{ kind: "spin", axis: "y", cycles: 2, amp: 0 }, { kind: "pulse", cycles: 2, amp: 0.08 }],
    attack: [{ kind: "spin", axis: "y", cycles: 5, amp: 0 }, burst(1.1, [0.25, 1])],
    cast: [{ kind: "spin", axis: "y", cycles: 6, amp: 0 }, burst(0.8)],
    transform: [{ kind: "spin", axis: "y", cycles: 4, amp: 0 }, burst(1.4, [0.05, 0.9])],
  });
  b.into(g2, () => {
    b.ring("極環", "fx", "xz", [C, cy, C], R + 4, 1, 1, { color: "#FFFFFF" });
    b.ring("極環", "fx", "xy", [C, cy, C], R + 3, 1, 1);
  });
  const g3 = b.defineGroup("逆環", [C, cy, C], {
    idle: [{ kind: "spin", axis: "z", cycles: -1, amp: 0 }],
    attack: [{ kind: "spin", axis: "z", cycles: -3, amp: 0 }, burst(0.9, [0.3, 1])],
  });
  b.into(g3, () => b.ring("逆環", "fx", "zy", [C, cy, C], R + 2.5, 1, 1));
  // 吹き上がる灰
  for (let i = 0; i < 8; i++) {
    const a = r() * TAU;
    const rr = r.range(1, R + 2);
    const p0: V3 = [C + Math.cos(a) * rr, bd.bottom, C + Math.sin(a) * rr];
    const g = b.defineGroup(`昇灰${i}`, p0, {
      idle: [{ kind: "rise", cycles: 1, amp: bd.max[1] - bd.bottom + 5, phase: r() }],
      attack: [{ kind: "rise", cycles: 2, amp: bd.max[1] - bd.bottom + 8, phase: r() }],
    });
    b.into(g, () => b.box("昇灰", "fx", p0, [0.75, 0.75, 0.75], { color: "#FFE9A8", fine: true }));
  }
}

/* ─────────── モードの装飾 ─────────── */
export function modeDressing(b: Builder, p: Params, bd: Bounds, r: Rng) {
  const cy = bd.center[1];
  const R = bd.radius;
  switch (p.mode) {
    case "sheath": {
      const h = bd.max[1] - bd.bottom;
      const w = R * 2 + 1.5;
      for (let i = 0; i < 5; i++) {
        const y = bd.bottom + (h * (i + 0.5)) / 5;
        b.box("覆い", i % 2 ? "shade" : "base", [C, y, C], [w, h / 5 - 0.25, w], { fine: true });
      }
      b.box("留め帯", "metal", [C, bd.bottom + h * 0.25, C], [w + 0.5, 1, w + 0.5], { fine: true });
      b.box("留め帯", "metal", [C, bd.bottom + h * 0.75, C], [w + 0.5, 1, w + 0.5], { fine: true });
      b.box("封札", "glow", [C, cy, C + w / 2 + 0.25], [2, 3.5, 0.5], { fine: true });
      break;
    }
    case "charge": {
      for (let i = 0; i < 3; i++) {
        const y = bd.bottom + ((bd.max[1] - bd.bottom) * (i + 1)) / 4;
        const g = b.defineGroup(`充填環${i}`, [C, y, C], {
          idle: [{ kind: "pulse", cycles: 2, amp: 0.18, phase: i / 3 }, { kind: "spin", axis: "y", cycles: 1, amp: 0 }],
          attack: [{ kind: "spin", axis: "y", cycles: 4, amp: 0 }, burst(1.2, [0.2, 1])],
          cast: [
            { kind: "shift", axis: "y", cycles: 1, amp: 4, window: [0.15, 0.55] },
            { kind: "shift", axis: "y", cycles: 1, amp: -4, window: [0.62, 1] },
            burst(0.8),
          ],
          transform: [burst(1.3, [0.1, 0.9])],
        });
        b.into(g, () => b.ring("充填環", "fx", "xz", [C, y, C], R + 1.5, 1, 1));
      }
      for (let i = 0; i < 8; i++) {
        const a = r() * TAU;
        const pt: V3 = [C + Math.cos(a) * (R + 1), r.range(bd.bottom, bd.max[1]), C + Math.sin(a) * (R + 1)];
        const g = b.defineGroup(`火花${i}`, pt, { idle: [{ kind: "blink", cycles: 3 + (i % 4), amp: 1, phase: r() }] });
        b.into(g, () => b.box("火花", "fx", pt, [0.5, 0.5, 0.5], { color: "#FFFFFF", fine: true }));
      }
      break;
    }
    case "overload": {
      for (let i = 0; i < 6; i++) {
        const a = r() * TAU;
        const pt: V3 = [C + Math.cos(a) * R * 0.8, r.range(bd.bottom + 1, bd.max[1] - 1), C + Math.sin(a) * R * 0.8];
        const g = b.defineGroup(`噴気${i}`, pt, {
          idle: [{ kind: "rise", cycles: 1 + (i % 2), amp: 6, phase: r() }],
          attack: [{ kind: "rise", cycles: 3, amp: 9, phase: r() }],
        });
        b.into(g, () => b.box("噴気", "fx", pt, [1.5, 1.5, 1.5], { color: "#FFD9A0", fine: true }));
      }
      b.box("過熱の芯", "fx", [C, cy, C], [R * 1.2, 1, R * 1.2], { color: "#FFF2C2", fine: true });
      break;
    }
    case "channel": {
      const y = bd.bottom - 0.5;
      const g = b.defineGroup("詠唱陣", [C, y, C], {
        idle: [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }],
        attack: [{ kind: "spin", axis: "y", cycles: 3, amp: 0 }, burst(0.8, [0.25, 1])],
        cast: [{ kind: "spin", axis: "y", cycles: 4, amp: 0 }, burst(1.2, [0.1, 1])],
        transform: [{ kind: "spin", axis: "y", cycles: 2, amp: 0 }, burst(1, [0.1, 0.9])],
      });
      b.into(g, () => {
        b.ring("詠唱陣", "fx", "xz", [C, y, C], R + 3, 1, 1);
        b.ring("詠唱陣", "fx", "xz", [C, y, C], R + 1.2, 0.8, 1);
        b.box("陣の十字", "fx", [C, y, C], [(R + 3) * 2, 0.25, 0.5], { fine: true });
        b.box("陣の十字", "fx", [C, y, C], [0.5, 0.25, (R + 3) * 2], { fine: true });
      });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        const pt: V3 = [C + Math.cos(a) * (R + 2), y + 1, C + Math.sin(a) * (R + 2)];
        const gg = b.defineGroup(`昇字${i}`, pt, {
          idle: [{ kind: "rise", cycles: 1, amp: bd.max[1] - bd.bottom, phase: i / 6 }],
          cast: [{ kind: "rise", cycles: 2, amp: bd.max[1] - bd.bottom + 4, phase: i / 6 }],
        });
        b.into(gg, () => b.box("昇字", "fx", pt, [1, 1, 1], { fine: true }));
      }
      break;
    }
  }
}

/* ─────────── 形態：封印 ─────────── */
export function sealForm(b: Builder, bd: Bounds, r: Rng) {
  const h = bd.max[1] - bd.bottom;
  const R = bd.radius;
  for (let i = 0; i < 4; i++) {
    const y = bd.bottom + (h * (i + 0.6)) / 4.5;
    b.box("封の帯", "shade", [C, y, C], [R * 2 + 1, 1.5, R * 2 + 1], { fine: true });
  }
  const g = b.defineGroup("封鎖", [C, bd.center[1], C], {
    idle: [{ kind: "sway", axis: "y", cycles: 1, amp: 4 }],
    transform: [{ kind: "turn", axis: "y", cycles: 1, amp: 360 }, burst(0.6, [0.1, 0.9])],
  });
  b.into(g, () => {
    const links = 16;
    for (let i = 0; i < links; i++) {
      const t = i / links;
      const a = t * TAU * 2;
      const pt: V3 = [C + Math.cos(a) * (R + 1), bd.bottom + 1 + t * (h - 1), C + Math.sin(a) * (R + 1)];
      b.box("鎖", "metal", pt, i % 2 ? [1.25, 0.5, 0.5] : [0.5, 0.5, 1.25], { fine: true });
    }
  });
  for (let i = 0; i < 3; i++) {
    const a = r() * TAU;
    b.box("封札", "glow", [C + Math.cos(a) * (R + 1.5), bd.bottom + h * (0.3 + i * 0.25), C + Math.sin(a) * (R + 1.5)], [1.5, 2.5, 0.5], {
      fine: true,
      rot: { axis: "y", angle: i % 2 ? 22.5 : -22.5 },
    });
  }
}

/* ─────────── 形態：真（本体を層に分かつ） ─────────── */
export function trueForm(b: Builder, bd: Bounds) {
  const body = b.boxes.filter((x) => x.group === "body");
  if (body.length < 6) return;
  const bands = 4;
  const y0 = bd.min[1];
  const span = Math.max(1, bd.max[1] - y0);
  for (let i = 0; i < bands; i++) {
    const lo = y0 + (span * i) / bands;
    const hi = y0 + (span * (i + 1)) / bands;
    const members = body.filter((x) => {
      const cy = (x.from[1] + x.to[1]) / 2;
      return cy >= lo && (i === bands - 1 ? cy <= hi + 0.01 : cy < hi);
    });
    if (!members.length) continue;
    const off = (i - (bands - 1) / 2) * 1.6;
    members.forEach((m) => {
      m.from[1] += off;
      m.to[1] += off;
    });
    const mid = (lo + hi) / 2 + off;
    const gid = b.defineGroup(`真・第${i + 1}片`, [C, mid, C], {
      idle: [
        { kind: "bob", cycles: 1, amp: 0.35 + i * 0.1, phase: i * 0.22 },
        { kind: "sway", axis: "y", cycles: 1, amp: 5 + i * 2, phase: i * 0.15 },
      ],
      attack: [
        { kind: "thrust", axis: "z", cycles: 1, amp: 2 + i * 0.6, window: [0.28, 1] },
        { kind: "swing", axis: "x", cycles: 1, amp: 10 * (i + 1) },
      ],
      cast: [
        { kind: "shift", axis: "y", cycles: 1, amp: (i - 1.5) * 1.6, window: [0.1, 0.5] },
        { kind: "shift", axis: "y", cycles: 1, amp: -(i - 1.5) * 1.6, window: [0.6, 1] },
        { kind: "turn", axis: "y", cycles: 1, amp: 360 * (i % 2 ? 1 : -1) },
      ],
      transform: [
        { kind: "turn", axis: "y", cycles: 1, amp: 360 * (i % 2 ? 1 : -1) },
        { kind: "burst", cycles: 1, amp: 0.5, window: [0.05, 0.9] },
      ],
    });
    members.forEach((m) => (m.group = gid));
  }
  // 露出した核
  const g = b.defineGroup("真核", [C, bd.center[1], C], {
    idle: [{ kind: "pulse", cycles: 2, amp: 0.14 }, { kind: "spin", axis: "y", cycles: 1, amp: 0 }],
    attack: [{ kind: "spin", axis: "y", cycles: 3, amp: 0 }, burst(1.3, [0.25, 1])],
    cast: [{ kind: "spin", axis: "y", cycles: 4, amp: 0 }, burst(1, [0.1, 1])],
    transform: [burst(1.6, [0.05, 0.9])],
  });
  b.into(g, () => {
    b.box("真核", "gem", [C, bd.center[1], C], [2.5, 2.5, 2.5]);
    b.box("真核の光", "fx", [C, bd.center[1], C], [5, 1, 1], { fine: true });
    b.box("真核の光", "fx", [C, bd.center[1], C], [1, 5, 1], { fine: true });
    b.box("真核の光", "fx", [C, bd.center[1], C], [1, 1, 5], { fine: true });
  });
}

/* ─────────── 本体（ルート）の動作クリップ ─────────── */
export function rootActions(kind: KindDef, p: Params): Record<string, AnimSpec[]> {
  const heavy = kind.id === "axe" || (kind.id === "sword" && p.style === 2);
  let attack: AnimSpec[];
  switch (kind.id) {
    case "gun":
    case "railgun":
      // 反動：銃口が跳ね上がり戻る
      attack = [
        { kind: "thrust", axis: "y", cycles: 1, amp: -2.4, window: [0.12, 1] },
        { kind: "swing", axis: "x", cycles: 1, amp: -24 },
      ];
      break;
    case "chainsaw":
      attack = [
        { kind: "swing", axis: "x", cycles: 1, amp: 110 },
        { kind: "thrust", axis: "z", cycles: 1, amp: 4, window: [0.25, 1] },
        { kind: "sway", axis: "z", cycles: 6, amp: 2 },
      ];
      break;
    case "bloodscythe":
      attack = [
        { kind: "swing", axis: "x", cycles: 1, amp: 140 },
        { kind: "turn", axis: "y", cycles: 1, amp: 360 },
      ];
      break;
    case "mace":
      attack = [
        { kind: "swing", axis: "x", cycles: 1, amp: 152 },
        { kind: "thrust", axis: "z", cycles: 1, amp: 2, window: [0.25, 1] },
      ];
      break;
    case "cursed":
      attack = [
        { kind: "swing", axis: "x", cycles: 1, amp: 134 },
        { kind: "sway", axis: "y", cycles: 2, amp: 10 },
      ];
      break;
    case "ornspear":
    case "spear":
      attack = [
        { kind: "thrust", axis: "z", cycles: 1, amp: 9, window: [0.18, 1] },
        { kind: "swing", axis: "x", cycles: 1, amp: 26 },
      ];
      break;
    case "bow":
      attack = [
        { kind: "turn", axis: "y", cycles: 1, amp: -32, window: [0, 0.45] },
        { kind: "turn", axis: "y", cycles: 1, amp: 32, window: [0.45, 0.75] },
        { kind: "thrust", axis: "z", cycles: 1, amp: -2.5, window: [0.1, 1] },
      ];
      break;
    case "shield":
    case "armor":
      attack = [
        { kind: "thrust", axis: "z", cycles: 1, amp: 5, window: [0.15, 1] },
        { kind: "swing", axis: "x", cycles: 1, amp: -26 },
      ];
      break;
    case "staff":
    case "tome":
    case "sigil":
      attack = [
        { kind: "swing", axis: "z", cycles: 1, amp: -38 },
        { kind: "thrust", axis: "y", cycles: 1, amp: 2.5, window: [0.2, 1] },
      ];
      break;
    case "relic":
    case "crown":
      attack = [
        { kind: "turn", axis: "y", cycles: 1, amp: 360 },
        { kind: "thrust", axis: "y", cycles: 1, amp: 3, window: [0.15, 1] },
      ];
      break;
    default:
      attack = [
        { kind: "swing", axis: "x", cycles: 1, amp: heavy ? 150 : 128 },
        { kind: "thrust", axis: "z", cycles: 1, amp: heavy ? 2 : 3.5, window: [0.2, 1] },
        { kind: "sway", axis: "y", cycles: 1, amp: 8 },
      ];
  }
  const guardAmp = kind.id === "shield" || kind.id === "armor" ? -5 : -3;
  return {
    attack,
    guard: [
      { kind: "thrust", axis: "z", cycles: 1, amp: guardAmp, window: [0.05, 1] },
      { kind: "swing", axis: "x", cycles: 1, amp: kind.id === "shield" ? -30 : -18 },
      { kind: "sway", axis: "z", cycles: 3, amp: 3 },
    ],
    cast: [
      { kind: "shift", axis: "y", cycles: 1, amp: 3.5, window: [0, 0.42] },
      { kind: "shift", axis: "y", cycles: 1, amp: -3.5, window: [0.78, 1] },
      { kind: "turn", axis: "y", cycles: 1, amp: 720 },
      { kind: "sway", axis: "x", cycles: 2, amp: 6 },
    ],
    transform: [
      { kind: "turn", axis: "y", cycles: 1, amp: 360 },
      { kind: "burst", cycles: 1, amp: 0.45, window: [0.05, 0.95] },
      { kind: "shift", axis: "y", cycles: 1, amp: 1.5, window: [0.1, 0.5] },
      { kind: "shift", axis: "y", cycles: 1, amp: -1.5, window: [0.5, 0.95] },
    ],
  };
}

/** 効果グループの動作クリップ（待機の動き＋弾け） */
export function effectActions(idle: AnimSpec[], intensity = 1): Record<string, AnimSpec[]> {
  const boost = (mul: number) => idle.map((a) => (a.kind === "spin" || a.kind === "rise" ? { ...a, cycles: a.cycles * mul } : a));
  return {
    attack: [...boost(2), burst(clamp(1.1 * intensity, 0.2, 2.5), [0.28, 1])],
    guard: [...boost(1.2), burst(clamp(0.45 * intensity, 0.15, 1.2), [0.05, 0.9])],
    cast: [...boost(1.6), burst(clamp(0.8 * intensity, 0.2, 2), [0.2, 1])],
    transform: [...boost(1.4), burst(clamp(1.3 * intensity, 0.2, 2.5), [0.08, 0.92])],
  };
}
