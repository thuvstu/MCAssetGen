import { A, type Builder } from "./forge-builder";
import type { ClipMap, Params } from "./forge-types2";
import type { Axis } from "./forge-types2";
import type { KindDef } from "./forge-kinds-types";

const C = 8;

/** 回り続ける機構：攻撃で三倍速 */
const motor = (ax: Axis, c: number): ClipMap => ({
  idle: [A.spin(ax, c)],
  attack: [A.spin(ax, c * 3), A.burst(0.2)],
  guard: [A.spin(ax, c)],
  cast: [A.spin(ax, c * 2)],
  transform: [A.spin(ax, c * 2), A.burst(0.4, [0.1, 0.9])],
});

export const chainsaw: KindDef = {
  id: "chainsaw",
  no: "12",
  name: "鎖鋸",
  en: "CHAINSAW",
  family: "機巧",
  note: "機関部の鼓動と共に刃鎖が回る。攻撃時は回転が三倍に跳ね上がる。",
  styles: [
    { label: "剪定鋸", sub: "RIPPER" },
    { label: "大鋸", sub: "BRUTE" },
    { label: "双刃", sub: "TWIN" },
  ],
  length: { label: "導板の長さ", min: 6, max: 13, def: 10 },
  width: { label: "機関部の幅", min: 3, max: 7, def: 5 },
  palette: "iron",
  build(b: Builder, p: Params) {
    const big = p.style === 1;
    const w = p.width;
    b.box("柄", "shade", [C, 1.5, C], [2.5, 3, 2.5]);
    b.box("柄頭", "metal", [C, 0.5, C], [3, 1, 3]);
    b.box("機関部", "base", [C, 6, C], [w, big ? 6 : 5, 4]);
    for (let i = 0; i < 3; i++) b.box("排気孔", "shade", [C - w / 2 + 0.5, 5 + i * 1.5, C + 2.2], [1, 1, 0.5], { fine: true });
    b.box("燃料槽", "gem", [C + w / 2 - 0.5, 7.5, C], [1.5, 2, 2]);
    b.box("前手把", "metal", [C, 9.2, C - (big ? 3 : 2.6)], [w + 2, 1, 1]);
    if (big) {
      b.box("排気筒", "metal", [C + w / 2 + 0.6, 9, C], [1, 4, 1]);
      b.box("排気口", "shade", [C + w / 2 + 0.6, 11.2, C], [1.5, 1, 1.5]);
    }
    const barY = big ? 9.5 : 9;
    const bars = p.style === 2 ? [C - 2.2, C + 2.2] : [C];
    bars.forEach((bx, bi) => {
      const L = p.style === 2 ? p.length * 0.8 : p.length;
      b.box("導板", "base", [bx, barY + L / 2, C], [2, L, 1]);
      b.box("導板芯", "shade", [bx, barY + L / 2, C], [0.75, Math.max(1, L - 1), 1.5], { fine: true });
      const cy = barY + L / 2;
      const g = b.defineGroup(`刃鎖${bi + 1}`, [bx, cy, C], motor("z", bi % 2 ? -2 : 2));
      b.into(g, () => {
        b.ring("刃鎖", "metal", "xy", [bx, cy, C], L / 2 + 0.6, 1, 1);
        b.around(Math.min(10, Math.round(L * 0.8)), L / 2 + 1.4, [bx, cy, C], (pt, a, i) => {
          if (i % 2 === 0) b.box("鋸歯", "metal", pt, [0.75, 0.75, 0.75], { fine: true });
        }, "xy");
      });
    });
    if (p.detail > 1) {
      b.box("銘板", "metal", [C, 6, C + 2.3], [2.5, 1.5, 0.5], { fine: true });
      b.box("警告灯", "glow", [C - w / 2 + 0.6, 8.5, C + 2.2], [0.75, 0.75, 0.5], { fine: true });
    }
  },
};

export const gun: KindDef = {
  id: "gun",
  no: "13",
  name: "銃",
  en: "GUN",
  family: "機巧",
  note: "銃口は天を向く。輪胴は待機でゆっくり、攻撃の瞬間に一気に回る。",
  styles: [
    { label: "拳銃", sub: "REVOLVER" },
    { label: "魔導長銃", sub: "ARCANE RIFLE" },
    { label: "大砲", sub: "HANDCANNON" },
  ],
  length: { label: "銃身長", min: 5, max: 15, def: 9 },
  width: { label: "口径", min: 2, max: 5, def: 2.5 },
  palette: "storm",
  build(b: Builder, p: Params) {
    const cal = p.style === 2 ? p.width + 1.5 : p.width;
    const L = p.style === 0 ? Math.min(p.length, 9) : p.length;
    b.box("握把", "shade", [C + 1.2, 2, C], [2.5, 4.5, 2], { rot: { axis: "z", angle: -22.5 } });
    b.box("床尾", "metal", [C + 2, 0.5, C], [2.5, 1.5, 2.5], { fine: true, rot: { axis: "z", angle: -22.5 } });
    b.box("用心鉄", "metal", [C - 1.2, 3.6, C], [0.5, 2.5, 1.5], { fine: true });
    b.box("引鉄", "metal", [C - 0.4, 3.8, C], [0.5, 1.2, 0.75], { fine: true });
    b.box("機関部", "base", [C, 6.2, C], [3, 3, 3.2]);
    b.box("撃鉄", "metal", [C + 1.9, 7.4, C], [1.2, 1.5, 1], { fine: true, rot: { axis: "z", angle: -22.5 } });
    // 輪胴（攻撃で高速回転）
    const g = b.defineGroup("輪胴", [C, 8.6, C], motor("y", 1));
    b.into(g, () => {
      b.box("輪胴芯", "shade", [C, 8.6, C], [2.6, 2, 2.6]);
      b.around(6, 1.7, [C, 8.6, C], (pt) => b.box("弾室", "gem", [pt[0], 8.6, pt[2]], [1, 2.2, 1], { fine: true }));
    });
    const y0 = 10;
    b.box("銃身", "metal", [C, y0 + L / 2, C], [cal, L, cal]);
    b.box("照星", "shade", [C, y0 + L - 0.5, C - cal / 2 - 0.4], [0.5, 1.2, 0.5], { fine: true });
    b.box("銃口", "shade", [C, y0 + L + 0.5, C], [cal + 1, 1, cal + 1]);
    b.box("口焔抑え", "glow", [C, y0 + L + 1.2, C], [cal, 0.5, cal], { fine: true });
    if (p.style === 1) {
      b.box("照準鏡", "gem", [C, y0 + L * 0.55, C + cal / 2 + 1], [1.2, 3.5, 1.2], { fine: true });
      for (let i = 0; i < 4; i++) b.box("魔導管", "glow", [C - cal / 2 - 0.3, y0 + 1 + (i * (L - 2)) / 3, C], [0.5, 1.5, 0.75], { fine: true });
      b.box("銃床", "base", [C, 4.5, C - 2.4], [2, 5, 1.5], { rot: { axis: "x", angle: 22.5 } });
    }
    if (p.style === 2) {
      for (let i = 1; i <= 3; i++) b.box("砲帯", "shade", [C, y0 + (L * i) / 4, C], [cal + 0.8, 1, cal + 0.8]);
      b.ring("砲口環", "metal", "xz", [C, y0 + L + 1.8, C], cal / 2 + 1.2, 1, 1);
      b.box("導火管", "glow", [C + cal / 2 + 0.4, 7, C], [0.6, 4, 0.6], { fine: true });
    }
    const n = Math.min(5, p.runes);
    for (let i = 0; i < n; i++) b.box("銃刻印", "glow", [C, y0 + 1 + (i * (L - 2)) / Math.max(1, n), C + cal / 2 + 0.3], [1, 0.75, 0.5], { fine: true });
  },
};

export const railgun: KindDef = {
  id: "railgun",
  no: "14",
  name: "磁道砲",
  en: "RAILGUN",
  family: "機巧",
  note: "双軌の間で磁核が脈打ち、加速環が位相順に点火して収束環へ抜ける。",
  styles: [
    { label: "双軌", sub: "TWIN RAIL" },
    { label: "環加速", sub: "COIL" },
    { label: "収束粒子", sub: "PARTICLE" },
  ],
  length: { label: "砲身長", min: 10, max: 19, def: 14 },
  width: { label: "軌間", min: 2, max: 5, def: 3 },
  palette: "celestial",
  build(b: Builder, p: Params) {
    const L = p.length;
    const gap = p.width;
    const y0 = 4;
    b.box("台座", "shade", [C, 1.5, C], [5, 3, 4]);
    b.box("蓄電器", "gem", [C, 2.2, C - 2.6], [2.5, 2, 1.2], { fine: true });
    b.box("握把", "shade", [C, 3.4, C + 2.4], [1.5, 2.5, 1.5], { fine: true, rot: { axis: "x", angle: 22.5 } });
    b.line("導線", "metal", [C - 2, 1.5, C - 2], [C - gap / 2 - 0.8, y0 + 2, C], 0.5, { fine: true });
    b.line("導線", "metal", [C + 2, 1.5, C - 2], [C + gap / 2 + 0.8, y0 + 2, C], 0.5, { fine: true });
    const core = b.defineGroup("磁核", [C, y0 + L / 2, C], {
      idle: [A.pulse(2, 0.1)],
      attack: [A.burst(1.2, [0.2, 1])],
      guard: [A.pulse(4, 0.06)],
      cast: [A.pulse(4, 0.2)],
      transform: [A.burst(1.4, [0.1, 0.9])],
    });
    b.into(core, () => b.box("磁核", "fx", [C, y0 + L / 2, C], [1, Math.max(2, L - 2), 1], { color: "#9FD8FF", fine: true }));
    if (p.style !== 1) {
      [-1, 1].forEach((d) => {
        b.box("軌条", "metal", [C + d * (gap / 2 + 0.8), y0 + L / 2, C], [1, L, 2]);
        b.box("軌条枕", "shade", [C + d * (gap / 2 + 0.8), y0 + L / 2, C], [0.5, Math.max(1, L - 1), 2.6], { fine: true });
      });
    }
    const rings = p.style === 1 ? 6 : 4;
    for (let i = 0; i < rings; i++) {
      const y = y0 + 2 + ((L - 4) * i) / (rings - 1);
      const g = b.defineGroup(`加速環${i + 1}`, [C, y, C], {
        idle: [A.blink(2, i / rings), A.spin("y", 1)],
        attack: [A.blink(6, i / rings), A.spin("y", 3)],
        guard: [A.blink(3, i / rings)],
        cast: [A.blink(4, i / rings)],
        transform: [A.burst(0.8, [0.1, 0.9])],
      });
      b.into(g, () => b.ring("加速環", "fx", "xz", [C, y, C], gap / 2 + 2.2, 1, 1));
    }
    const mz = b.defineGroup("収束環", [C, y0 + L + 1, C], {
      idle: [A.spin("y", -1)],
      attack: [A.spin("y", -4), A.burst(0.8, [0.25, 1])],
      cast: [A.spin("y", -2)],
      transform: [A.spin("y", -2), A.burst(1, [0.1, 0.9])],
    });
    b.into(mz, () => {
      b.ring("収束環", "metal", "xz", [C, y0 + L + 1, C], gap / 2 + 1.4, 1, 1);
      b.around(4, gap / 2 + 2.6, [C, y0 + L + 1, C], (pt) => b.box("収束爪", "metal", pt, [1, 2, 1]));
    });
    if (p.style === 2) b.box("粒子球", "gem", [C, y0 + L + 2.5, C], [2.5, 2.5, 2.5]);
    [-1, 1].forEach((d) => b.box("側翼", "metal", [C + d * (gap / 2 + 2.2), y0 + 3, C], [1, 5, 2], { rot: { axis: "z", angle: d > 0 ? -22.5 : 22.5 } }));
    const n = Math.min(6, p.runes);
    for (let i = 0; i < n; i++) b.box("磁刻印", "glow", [C, y0 + 2 + (i * (L - 3)) / Math.max(1, n), C + 1.6], [1, 1, 0.5], { fine: true });
  },
};
