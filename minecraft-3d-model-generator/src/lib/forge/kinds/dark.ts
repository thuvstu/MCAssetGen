import { A, type Builder } from "../builder";
import type { Params, V3 } from "../types";
import { TAU, type Rng } from "../util";
import type { KindDef } from "./types";

const C = 8;

/** 滴り：落ちながら消える */
function drips(b: Builder, r: Rng, n: number, cx: number, cy: number, cz: number, spread: number, fall: number, color?: string) {
  for (let i = 0; i < n; i++) {
    const a = r() * TAU;
    const p0: V3 = [cx + Math.cos(a) * spread, cy, cz + Math.sin(a) * spread];
    const g = b.defineGroup(`滴${i + 1}`, p0, {
      idle: [A.rise(1, -fall, r())],
      attack: [A.rise(2, -fall - 2, r())],
      cast: [A.rise(2, -fall, r())],
    });
    b.into(g, () => b.box("滴", "fx", p0, [0.5, 0.75, 0.5], { color, fine: true }));
  }
}

export const cursed: KindDef = {
  id: "cursed",
  no: "15",
  name: "呪刃",
  en: "CURSED BLADE",
  family: "凶刃",
  note: "歪んだ刃に眼が開く。瞳環がゆっくり回り、呪いが滴り落ちる。",
  styles: [
    { label: "魔剣", sub: "FELL" },
    { label: "骨剣", sub: "BONE" },
    { label: "眼剣", sub: "OCULAR" },
  ],
  length: { label: "刃長", min: 8, max: 17, def: 13 },
  width: { label: "刃幅", min: 2, max: 6, def: 3.5 },
  palette: "obsidian",
  build(b: Builder, p: Params, r: Rng) {
    const bone = p.style === 1;
    const boneC = "#D8CCAE";
    b.box("柄", "shade", [C, 2.5, C], [2, 4, 2]);
    b.box("頭骨", bone ? "base" : "metal", [C, 0.6, C], [3, 1.6, 3], bone ? { color: boneC } : {});
    b.box("顎", "shade", [C, 5, C], [5, 1.5, 3]);
    [-1, 1].forEach((d) => b.box("牙", "metal", [C + d * 2.6, 6.2, C], [1, 2, 1], { rot: { axis: "z", angle: d > 0 ? 22.5 : -22.5 } }));
    const y0 = 6;
    const len = p.length;
    const n = Math.max(4, Math.round(len / 1.8));
    const h = len / n;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const zig = (i % 2 ? 0.8 : -0.8) * (1 - t * 0.5);
      const wi = Math.max(1.5, p.width * (1 - t * 0.45));
      b.box("呪身", bone ? "base" : "base", [C + zig, y0 + h * (i + 0.5), C], [wi, h, 1.5], bone ? { color: boneC } : {});
      if (i % 2 === 0) b.box("呪溝", "glow", [C + zig, y0 + h * (i + 0.5), C + 0.9], [Math.max(0.75, wi - 1.2), h * 0.6, 0.5], { fine: true });
      if (i % 2 === 1 && i < n - 1) {
        const d = i % 4 === 1 ? 1 : -1;
        b.box("棘", bone ? "base" : "metal", [C + d * (wi / 2 + 0.8), y0 + h * (i + 0.5), C], [1.6, 1, 1], { fine: true, rot: { axis: "z", angle: d > 0 ? -45 : 45 }, ...(bone ? { color: boneC } : {}) });
      }
    }
    b.box("切先", "shade", [C, y0 + len + 0.6, C], [1, 1.5, 1]);
    // 眼
    const eyes = p.style === 2 ? 3 : 1;
    for (let e = 0; e < eyes; e++) {
      const ey = y0 + len * (0.3 + e * 0.25);
      b.box("眼窩", "shade", [C, ey, C + 0.9], [2.2, 2.2, 0.5], { fine: true });
      b.box("瞳", "gem", [C, ey, C + 1.2], [1, 1, 0.5], { fine: true });
      const g = b.defineGroup(`瞳環${e + 1}`, [C, ey, C], {
        idle: [A.spin("z", e % 2 ? -1 : 1), A.pulse(2, 0.08, e / 3)],
        attack: [A.spin("z", 4), A.burst(0.8, [0.25, 1])],
        cast: [A.spin("z", 3), A.burst(0.5)],
        transform: [A.spin("z", 2), A.burst(1, [0.1, 0.9])],
      });
      b.into(g, () => b.ring("瞳環", "glow", "xy", [C, ey, C], 2 + e * 0.4, 0.8, 1));
    }
    if (bone) [-1, 1].forEach((d) => { for (let i = 0; i < 3; i++) b.box("肋", "base", [C + d * (p.width / 2 + 1), y0 + 2 + i * 3.5, C], [1.8, 0.75, 0.75], { color: boneC, fine: true, rot: { axis: "z", angle: d > 0 ? 22.5 : -22.5 } }); });
    drips(b, r, 3 + p.detail, C, y0 + len * 0.5, C, p.width * 0.7, 7);
  },
};

export const bloodscythe: KindDef = {
  id: "bloodscythe",
  no: "16",
  name: "血鎌",
  en: "BLOOD SCYTHE",
  family: "凶刃",
  note: "心核が脈打つたび、刃から血が滴る。攻撃は薙ぎの大弧。",
  styles: [
    { label: "大鎌", sub: "REAPER" },
    { label: "双鎌", sub: "TWIN CRESCENT" },
    { label: "血帝", sub: "CRIMSON LORD" },
  ],
  length: { label: "柄の長さ", min: 10, max: 19, def: 15 },
  width: { label: "刃の張り", min: 3, max: 7, def: 5 },
  palette: "blood",
  build(b: Builder, p: Params, r: Rng) {
    const top = 2 + p.length;
    b.box("石突", "metal", [C, 0.5, C], [2, 1, 2]);
    for (let y = 1; y < top - 1; y += 2.5) b.box("柄", y % 5 < 2.5 ? "shade" : "base", [C, y + 1.25, C], [1.5, 2.5, 1.5]);
    for (let i = 0; i < 4; i++) b.box("血脈", "glow", [C + 0.7, 3 + i * ((top - 5) / 4), C], [0.5, 1.5, 0.5], { fine: true });
    const heart = b.defineGroup("心核", [C, top - 2, C], {
      idle: [A.pulse(2, 0.16)],
      attack: [A.burst(1, [0.25, 1]), A.pulse(4, 0.1)],
      cast: [A.pulse(4, 0.22)],
      transform: [A.burst(1.3, [0.1, 0.9])],
    });
    b.into(heart, () => {
      b.box("心核", "gem", [C, top - 2, C], [2.2, 2.6, 2.2]);
      b.box("大動脈", "glow", [C, top - 0.4, C], [1, 1.2, 1], { fine: true });
    });
    const sides = p.style === 1 ? [-1, 1] : [1];
    sides.forEach((d) => {
      b.box("鎌腕", "metal", [C + d * 3, top, C], [5.5, 1.5, 1.5]);
      const m = p.width;
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const x = C + d * (4.5 + m * 0.35 + t * 0.8 - t * t * 0.4);
        const y = top - 0.8 - t * (m + 2.5);
        b.box("鎌刃", "base", [x, y, C], [1.6 - t * 0.6, 2.2, 0.9], { fine: true, rot: { axis: "z", angle: d > 0 ? (t < 0.5 ? -22.5 : -45) : t < 0.5 ? 22.5 : 45 } });
        if (i % 2 === 0) b.box("刃血", "glow", [x - d * 0.5, y, C + 0.6], [0.75, 1.2, 0.4], { fine: true });
      }
      b.box("刃先", "base", [C + d * (5 + m * 0.5), top - m - 3.6, C], [0.75, 1.2, 0.75], { color: "#F2E9E4", fine: true });
    });
    if (p.style === 2) {
      b.around(5, 2.6, [C, top + 1.4, C], (pt) => b.box("冠棘", "metal", pt, [0.75, 2, 0.75], { fine: true }));
      b.box("血溜", "shade", [C, 0.2, C], [6, 0.4, 6], { color: "#4A0509", fine: true });
    }
    drips(b, r, 4 + p.detail * 2, C + 4, top - 2, C, 2.5, 9, "#C3101F");
  },
};

export const mace: KindDef = {
  id: "mace",
  no: "17",
  name: "鎚矛",
  en: "MACE",
  family: "武器",
  note: "重い頭部が全てを語る。星球は鎖で吊られ、振るたびに揺れる。",
  styles: [
    { label: "戦棍", sub: "FLANGED" },
    { label: "星球", sub: "MORNING STAR" },
    { label: "大槌", sub: "WARHAMMER" },
  ],
  length: { label: "柄の長さ", min: 7, max: 15, def: 11 },
  width: { label: "頭部の大きさ", min: 3, max: 7, def: 4.5 },
  palette: "bronze",
  build(b: Builder, p: Params) {
    const top = 2 + p.length;
    b.box("石突", "metal", [C, 0.5, C], [2.5, 1, 2.5]);
    for (let y = 1; y < top - 1; y += 2) b.box("柄", y % 4 < 2 ? "shade" : "base", [C, y + 1, C], [1.5, 2, 1.5]);
    b.box("柄首", "metal", [C, top - 0.5, C], [2.5, 1.5, 2.5]);
    const s = p.width;
    if (p.style === 1) {
      // 鎖で吊る星球（グループごと揺れる）
      const hx = C + 2.5;
      const hy = top - 2;
      const g = b.defineGroup("星球", [C, top, C], {
        idle: [A.sway("z", 1, 14), A.sway("x", 1, 6, 0.3)],
        attack: [{ kind: "swing", axis: "z", cycles: 1, amp: -120 }, A.burst(0.25, [0.3, 1])],
        guard: [A.sway("z", 2, 20)],
        cast: [{ kind: "turn", axis: "y", cycles: 1, amp: 360 }],
        transform: [{ kind: "turn", axis: "z", cycles: 1, amp: 360 }, A.burst(0.5, [0.1, 0.9])],
      });
      b.into(g, () => {
        b.line("鎖", "metal", [C, top, C], [hx, hy, C], 0.6, { fine: true });
        b.box("球核", "base", [hx + 1, hy - 1.5, C], [s, s, s]);
        const dirs: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        dirs.forEach(([dx, dy, dz]) => b.box("星棘", "metal", [hx + 1 + dx * (s / 2 + 0.8), hy - 1.5 + dy * (s / 2 + 0.8), C + dz * (s / 2 + 0.8)], [1, 1, 1], { fine: true }));
      });
      return;
    }
    const hy = top + s / 2 + 0.5;
    if (p.style === 0) {
      b.box("頭核", "base", [C, hy, C], [s * 0.7, s + 1, s * 0.7]);
      b.around(6, s * 0.55 + 0.6, [C, hy, C], (pt, a, i) => {
        b.box("刃板", i % 2 ? "metal" : "base", pt, [1, s + 0.5, 2.2], { rot: { axis: "y", angle: i % 2 ? 22.5 : -22.5 } });
      });
      b.box("天棘", "metal", [C, hy + s / 2 + 1.4, C], [1, 2.5, 1]);
      if (p.detail > 1) b.around(4, s * 0.8, [C, hy - s / 2, C], (pt) => b.box("鋲", "gem", pt, [0.75, 0.75, 0.75], { fine: true }));
    } else {
      b.box("槌頭", "base", [C, hy, C], [s + 3, s, s - 0.5]);
      [-1, 1].forEach((d) => b.box("打面", "metal", [C + d * (s / 2 + 2), hy, C], [1, s + 0.8, s + 0.3]));
      b.box("頭帯", "metal", [C, hy, C], [s + 3.5, 1, s + 0.3]);
      b.box("天穂", "metal", [C, hy + s / 2 + 1.2, C], [1, 2, 1]);
      if (p.runes > 0) b.box("鎚紋", "glow", [C, hy, C + (s - 0.5) / 2 + 0.3], [2, 2, 0.5], { fine: true });
    }
  },
};

export const ornspear: KindDef = {
  id: "ornspear",
  no: "18",
  name: "宝槍",
  en: "ORNATE SPEAR",
  family: "武器",
  note: "二重の飾環・垂飾・幡・鈴。過剰な装飾こそが威儀である。",
  styles: [
    { label: "聖飾", sub: "SANCTIFIED" },
    { label: "竜飾", sub: "DRACONIC" },
    { label: "祭礼", sub: "CEREMONIAL" },
  ],
  length: { label: "柄の長さ", min: 12, max: 21, def: 17 },
  width: { label: "穂の張り", min: 2, max: 6, def: 4 },
  palette: "gold",
  build(b: Builder, p: Params, r: Rng) {
    const top = 2 + p.length;
    b.box("石突", "metal", [C, 0.6, C], [2.5, 1.2, 2.5]);
    b.box("石突珠", "gem", [C, 1.6, C], [1.2, 1, 1.2], { fine: true });
    for (let y = 2; y < top - 1; y += 2) b.box("柄", y % 4 < 2 ? "base" : "shade", [C, y + 1, C], [1.5, 2, 1.5]);
    for (let i = 1; i <= 4; i++) b.box("飾帯", "metal", [C, 2 + ((top - 4) * i) / 5, C], [2.2, 0.75, 2.2], { fine: true });
    b.box("穂首", "metal", [C, top, C], [3, 2, 3]);
    // 穂（葉形＋側翼二重）
    const w = p.width;
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const wi = Math.max(1, Math.round(w * Math.sin(Math.PI * (0.2 + t * 0.75)) * 2) / 2);
      b.box("穂", "base", [C, top + 1.5 + i, C], [wi, 1, 1.2]);
      if (i % 2 === 0 && wi >= 2) b.box("穂飾", "gem", [C, top + 1.5 + i, C + 0.9], [0.75, 0.75, 0.5], { fine: true });
    }
    b.box("穂先", "metal", [C, top + 8, C], [0.75, 1.5, 0.75]);
    const dragon = p.style === 1;
    [[-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(([d, lv]) => {
      b.box(dragon ? "竜翼" : "側翼", dragon && lv ? "glow" : "metal", [C + d * (w / 2 + 1 + lv * 0.8), top + 2.5 + lv * 1.5, C], [2 - lv * 0.5, 2.5 - lv * 0.5, 0.9], { fine: true, rot: { axis: "z", angle: d > 0 ? (lv ? -45 : -22.5) : lv ? 45 : 22.5 } });
    });
    // 飾環 ×2（逆回転）＋垂飾＋幡
    [0.32, 0.78].forEach((k, ri) => {
      const y = 2 + (top - 2) * k;
      const g = b.defineGroup(`飾環${ri + 1}`, [C, y, C], {
        idle: [A.spin("y", ri % 2 ? -1 : 1)],
        attack: [A.spin("y", ri % 2 ? -3 : 3), A.burst(0.4, [0.25, 1])],
        cast: [A.spin("y", ri % 2 ? -2 : 2)],
        transform: [A.spin("y", 2), A.burst(0.7, [0.1, 0.9])],
      });
      b.into(g, () => {
        b.ring("飾環", "metal", "xz", [C, y, C], 2.8, 0.9, 1);
        b.around(4, 2.8, [C, y, C], (pt, a, i2) => b.box("環珠", i2 % 2 ? "gem" : "glow", pt, [0.75, 0.75, 0.75], { fine: true }), "xz", ri);
      });
    });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      const px = C + Math.cos(a) * 2.4;
      const pz = C + Math.sin(a) * 2.4;
      const py = top - 1;
      const g = b.defineGroup(`垂飾${i + 1}`, [px, py, pz], {
        idle: [A.sway("z", 1, 16, r()), A.sway("x", 1, 10, r())],
        attack: [A.sway("z", 3, 30, i / 4)],
        cast: [A.sway("z", 2, 24, i / 4)],
      });
      b.into(g, () => {
        b.line("飾紐", "metal", [px, py, pz], [px, py - 2.5, pz], 0.4, { fine: true });
        b.box("垂珠", "gem", [px, py - 3.2, pz], [1, 1.2, 1], { fine: true });
      });
    }
    const banners = p.style === 2 ? 2 : 1;
    for (let i = 0; i < banners; i++) {
      const d = i % 2 ? -1 : 1;
      const g = b.defineGroup(`幡${i + 1}`, [C + d * 1.2, top - 2.5, C], {
        idle: [A.sway("y", 1, 14, i / 2), A.sway("z", 2, 7, r())],
        attack: [A.sway("y", 2, 32, i / 2)],
        cast: [A.sway("y", 2, 22)],
      });
      b.into(g, () => {
        b.box("幡竿", "metal", [C + d * 2.2, top - 2.5, C], [2.2, 0.5, 0.5], { fine: true });
        b.box("幡", "glow", [C + d * 3.6, top - 4.3, C], [2.2, 4, 0.4], { fine: true });
        b.box("幡紋", "shade", [C + d * 3.6, top - 4, C + 0.3], [1.2, 1.2, 0.25], { fine: true });
      });
    }
    if (p.style === 2) b.around(3, 1.9, [C, 4, C], (pt) => b.box("鈴", "metal", pt, [0.9, 1.1, 0.9], { fine: true }));
    const n = Math.min(8, p.runes);
    for (let i = 0; i < n; i++) b.box("槍刻印", "glow", [C, 3 + (i * (top - 6)) / Math.max(1, n), C + 1.1], [0.9, 0.9, 0.4], { fine: true });
  },
};
