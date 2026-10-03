import type { Builder } from "../builder";
import type { Params, V3 } from "../types";
import { lerp, TAU, type Rng } from "../util";
import type { KindDef } from "./types";

const C = 8;

export const staff: KindDef = {
  id: "staff",
  no: "05",
  name: "杖",
  en: "STAFF",
  family: "魔導",
  note: "軸に金属帯、先首に宝飾。宝珠・三日月・晶から杖首を選ぶ。",
  styles: [
    { label: "宝珠", sub: "ORB" },
    { label: "三日月", sub: "CRESCENT" },
    { label: "晶", sub: "CRYSTAL" },
    { label: "骸杖", sub: "SKULL" },
  ],
  length: { label: "軸長", min: 8, max: 18, def: 14 },
  width: { label: "杖首の大きさ", min: 2, max: 6, def: 4 },
  palette: "arcane",
  build(b: Builder, p: Params, r: Rng) {
    const len = p.length;
    b.box("石突", "metal", [C, 0.5, C], [3, 1, 3]);
    for (let y = 1; y < len; y += 2) {
      const twist = p.detail > 1 ? (Math.floor(y / 2) % 2 ? 0.5 : -0.5) : 0;
      b.box("軸", "base", [C + twist, y + 1, C], [2, 2, 2]);
    }
    for (let i = 1; i <= 3; i++) b.box("金属帯", "metal", [C, (len * i) / 4, C], [3, 1, 3]);
    const top = len + 1;
    b.box("首", "metal", [C, top, C], [4, 2, 4]);
    const s = p.width;
    const hy = top + s / 2 + 2;
    if (p.style === 0) {
      b.box("宝珠", "gem", [C, hy, C], [s, s, s]);
      const dirs: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
      dirs.forEach(([dx, , dz]) => b.box("爪", "metal", [C + dx * (s / 2 + 0.5), hy - 0.5, C + dz * (s / 2 + 0.5)], [1, s, 1]));
      b.box("宝珠の芯", "glow", [C, hy, C], [s + 1, 1, 1]);
    } else if (p.style === 1) {
      const R = s + 1.5;
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI * (0.1 + (i / 8) * 0.8) + Math.PI;
        const x = C + Math.cos(a) * R;
        const y = top + 1 + R + Math.sin(a) * -R;
        b.box("月", i % 4 === 0 ? "metal" : "base", [x, y, C], [1.5, 1.5, 1.5], { fine: true });
      }
      b.box("月の光", "gem", [C, top + 1 + R, C], [2, 2, 2]);
    } else if (p.style === 3) {
      // 骸杖：頭骨・顎・角・眼光
      b.box("頭骨", "base", [C, top + 3.5, C], [s + 1, s, s], { color: "#D8CCAE" });
      b.box("顎", "base", [C, top + 1.2, C], [s, 1.2, s - 0.5], { color: "#C3B493", fine: true });
      [-1, 1].forEach((d) => {
        b.box("眼光", "glow", [C + d * (s / 4 + 0.3), top + 3.8, C + s / 2], [0.9, 0.9, 0.5], { fine: true });
        b.box("角", "shade", [C + d * (s / 2 + 0.8), top + 5, C], [1, 2.5, 1], { rot: { axis: "z", angle: d > 0 ? -22.5 : 22.5 } });
      });
      b.ring("脊環", "metal", "xz", [C, top + 0.2, C], s / 2 + 1, 0.8, 1);
      b.box("牙", "base", [C - 1, top + 0.4, C + s / 2], [0.5, 1, 0.5], { color: "#E8DEC2", fine: true });
      b.box("牙", "base", [C + 1, top + 0.4, C + s / 2], [0.5, 1, 0.5], { color: "#E8DEC2", fine: true });
    } else {
      for (let i = 0; i < 5; i++) {
        const w = Math.max(1, lerp(s, 1, i / 4));
        b.box("晶", "gem", [C, top + 2 + i * 1.5, C], [w, 1.5, w], { fine: !p.snap });
      }
      [-1, 1].forEach((d) =>
        b.box("副晶", "gem", [C + d * 2.5, top + 3, C], [1.5, 3, 1.5], { rot: { axis: "z", angle: d > 0 ? -22.5 : 22.5 }, fine: true })
      );
    }
    const n = Math.min(8, p.runes);
    for (let i = 0; i < n; i++) b.box("ルーン", "glow", [C, 2 + (i * (len - 4)) / Math.max(1, n), C + 1], [1, 1, 1]);
    if (p.detail > 2) {
      b.group("杖の衛星", [C, hy, C], [{ kind: "spin", axis: "y", cycles: 1, amp: 0, phase: r() }]);
      b.around(3, s + 3, [C, hy, C], (pt) => b.box("衛星", "gem", pt, [1, 1, 1]));
      b.body();
    }
  },
};

export const tome: KindDef = {
  id: "tome",
  no: "06",
  name: "魔導書",
  en: "TOME",
  family: "魔導",
  note: "革の表紙に金具と留め具。開けば頁の上に紋が浮かぶ。",
  styles: [
    { label: "閉じた書", sub: "CLOSED" },
    { label: "開いた書", sub: "OPEN" },
    { label: "禁書", sub: "GRIMOIRE" },
    { label: "鎖縛", sub: "CHAINED" },
  ],
  length: { label: "判型の高さ", min: 6, max: 14, def: 10 },
  width: { label: "厚み", min: 2, max: 6, def: 3 },
  palette: "grimoire",
  build(b: Builder, p: Params, r: Rng) {
    const H = p.length;
    const W = Math.round(H * 0.78);
    const T = p.width;
    const cy = 9;
    const paper = "#E9DFC6";
    if (p.style === 1) {
      [-1, 1].forEach((d) => {
        const rot = { axis: "y" as const, angle: (d < 0 ? -22.5 : 22.5) as -22.5 | 22.5, origin: [C, cy, C] as V3 };
        b.box("表紙", "base", [C + d * (W / 2), cy, C], [W, H + 1, 1], { rot });
        b.box("頁", "base", [C + d * (W / 2 - 0.5), cy, C + 1], [W - 1, H - 0.5, 1], { rot, color: paper, fine: true });
        b.box("頁の文字", "glow", [C + d * (W / 2 - 0.5), cy + 1, C + 1.75], [W - 3, 0.5, 0.25], { rot, fine: true });
        b.box("頁の文字", "glow", [C + d * (W / 2 - 0.5), cy - 1, C + 1.75], [W - 4, 0.5, 0.25], { rot, fine: true });
      });
      b.box("背", "shade", [C, cy, C - 0.5], [2, H + 1, 1]);
      b.group("浮かぶ紋", [C, cy + H / 2 + 3, C + 2], [
        { kind: "spin", axis: "y", cycles: 1, amp: 0 },
        { kind: "bob", cycles: 2, amp: 0.8, phase: r() },
      ]);
      b.ring("紋", "glow", "xy", [C, cy + H / 2 + 3, C + 2], 2.2, 1, 1);
      b.box("紋の芯", "gem", [C, cy + H / 2 + 3, C + 2], [1, 1, 1]);
      b.body();
      return;
    }
    b.box("表紙・表", "base", [C, cy, C + T / 2 + 0.5], [W, H, 1]);
    b.box("表紙・裏", "base", [C, cy, C - T / 2 - 0.5], [W, H, 1]);
    b.box("背", "shade", [C - W / 2 - 0.5, cy, C], [1, H, T + 2]);
    b.box("頁", "base", [C + 0.5, cy, C], [W - 1, H - 1, T], { color: paper });
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sy]) =>
      b.box("隅金具", "metal", [C + sx * (W / 2 - 0.5), cy + sy * (H / 2 - 0.5), C], [1.5, 1.5, T + 2.5], { fine: true })
    );
    b.box("留め具", "metal", [C + W / 2, cy, C], [1.5, 2, T + 2.5], { fine: true });
    b.box("表の宝石", "gem", [C, cy, C + T / 2 + 1.25], [2, 2, 1]);
    b.ring("表の紋", "metal", "xy", [C, cy, C + T / 2 + 1.25], 2.4, 1, 1, { fine: true });
    if (p.style === 3) {
      // 鎖縛：斜め鎖二条＋浮遊する錠前
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        b.box("縛鎖", "metal", [C - W / 2 + t * W, cy - H / 2 + t * H, C + (i % 2 ? T / 2 + 1 : -T / 2 - 1)], i % 2 ? [1.1, 0.5, 0.5] : [0.5, 1.1, 0.5], { fine: true });
        b.box("縛鎖", "metal", [C - W / 2 + t * W, cy + H / 2 - t * H, C + (i % 2 ? -T / 2 - 1 : T / 2 + 1)], i % 2 ? [0.5, 1.1, 0.5] : [1.1, 0.5, 0.5], { fine: true });
      }
      const g = b.defineGroup("浮錠", [C, cy, C + T / 2 + 2], {
        idle: [{ kind: "bob", cycles: 1, amp: 0.6 }, { kind: "sway", axis: "z", cycles: 1, amp: 8 }],
        attack: [{ kind: "burst", cycles: 1, amp: 0.8, window: [0.25, 1] }],
        transform: [{ kind: "turn", axis: "y", cycles: 1, amp: 360 }],
      });
      b.into(g, () => {
        b.box("錠前", "metal", [C, cy - 0.5, C + T / 2 + 2], [2, 2.2, 1]);
        b.ring("錠弦", "metal", "xy", [C, cy + 1.4, C + T / 2 + 2], 1.1, 0.7, 1);
        b.box("鍵穴", "glow", [C, cy - 0.6, C + T / 2 + 2.6], [0.6, 1, 0.3], { fine: true });
      });
    }
    if (p.style === 2) {
      b.box("禁書の眼", "glow", [C, cy, C + T / 2 + 1.75], [3, 1, 1]);
      for (let i = 0; i < 5; i++) {
        b.box("封鎖", "shade", [C + W / 2 - 1 - i * 1.5, cy + (i % 2 ? 0.5 : -0.5), C + T / 2 + 1.25], [1.5, 0.75, 0.75], { fine: true });
        b.box("封鎖", "shade", [C + W / 2 - 1 - i * 1.5, cy + (i % 2 ? 0.5 : -0.5), C - T / 2 - 1.25], [1.5, 0.75, 0.75], { fine: true });
      }
    }
    const n = Math.min(6, p.runes);
    for (let i = 0; i < n; i++) b.box("背のルーン", "glow", [C - W / 2 - 1, cy - H / 2 + 1.5 + i * ((H - 3) / Math.max(1, n - 1)), C], [0.5, 0.75, 1], { fine: true });
    if (p.detail > 1) {
      b.group("舞う頁", [C, cy, C], [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }]);
      b.around(3, W + 1, [C, cy + 2, C], (pt, a, i) =>
        b.box("舞う頁", "base", [pt[0], pt[1] + (i - 1) * 2, pt[2]], [2.5, 3, 0.25], { color: paper, fine: true, rot: { axis: "y", angle: i % 2 ? 22.5 : -22.5 } })
      , "xz", r() * TAU);
      b.body();
    }
  },
};

export const sigil: KindDef = {
  id: "sigil",
  no: "07",
  name: "魔法陣",
  en: "SIGIL",
  family: "魔導",
  note: "像素で再構成した二重環。十字の基点と発光する字が外周を巡る。",
  styles: [
    { label: "垂直陣", sub: "STANDING" },
    { label: "水平陣", sub: "FLOOR" },
    { label: "三重陣", sub: "TRIPLE" },
    { label: "星辰", sub: "ASTROLABE" },
  ],
  length: { label: "外環の半径", min: 5, max: 12, def: 9 },
  width: { label: "環の太さ", min: 1, max: 3, def: 1 },
  palette: "celestial",
  build(b: Builder, p: Params, r: Rng) {
    const R = Math.min(9, p.length * 0.72);
    const plane = p.style === 1 ? "xz" : "xy";
    const c: V3 = p.style === 1 ? [C, 2, C] : [C, 10, C];
    const t = p.width;
    b.group("外環", c, [{ kind: "spin", axis: plane === "xz" ? "y" : "z", cycles: 1, amp: 0 }]);
    b.ring("外環", "base", plane, c, R, t, 1);
    const glyphs = Math.min(10, p.runes + 2);
    b.around(glyphs, R + 1.6, c, (pt, a, i) => b.box("字", "glow", pt, [1, 1, 1]), plane === "xz" ? "xz" : "xy");
    b.group("内環", c, [{ kind: "spin", axis: plane === "xz" ? "y" : "z", cycles: -2, amp: 0 }]);
    b.ring("内環", "glow", plane, c, R * 0.58, Math.max(1, t - 1), 1);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      const pts = [0.2, 0.4].map((k) => (plane === "xz" ? [c[0] + Math.cos(a) * R * k * 1.4, c[1], c[2] + Math.sin(a) * R * k * 1.4] : [c[0] + Math.cos(a) * R * k * 1.4, c[1] + Math.sin(a) * R * k * 1.4, c[2]]) as V3);
      pts.forEach((pt) => b.box("内の星", "metal", pt, [1, 1, 1]));
    }
    b.body();
    const arms: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    arms.forEach(([dx, dy]) => {
      for (let i = 0; i < 2 + Math.min(2, p.detail); i++) {
        const d = R + 1.4 + i;
        const pt: V3 = plane === "xz" ? [c[0] + dx * d, c[1], c[2] + dy * d] : [c[0] + dx * d, c[1] + dy * d, c[2]];
        b.box("基点", "metal", pt, [1, 1, 1]);
      }
    });
    b.box("中核", "gem", c, [3, 3, 3]);
    b.box("中核の枠", "metal", c, plane === "xz" ? [4, 1, 4] : [4, 4, 1]);
    if (p.style === 2) {
      b.group("第三環", c, [{ kind: "spin", axis: "y", cycles: 1, amp: 0, phase: r() }]);
      b.ring("第三環", "metal", "zy", c, R * 0.8, 1, 1);
      b.body();
    }
    if (p.style === 3) {
      // 星辰儀：互いに異軸で回る三環＋黄道の星
      b.group("赤緯環", c, [{ kind: "spin", axis: "x", cycles: 1, amp: 0 }]);
      b.ring("赤緯環", "metal", "zy", c, R * 0.85, 1, 1);
      b.body();
      b.group("黄道環", c, [{ kind: "spin", axis: "y", cycles: -1, amp: 0, phase: 0.3 }]);
      b.ring("黄道環", "base", "xz", c, R * 0.95, 1, 1);
      b.around(5, R * 0.95, c, (pt, a, i) => b.box("黄道星", i % 2 ? "gem" : "glow", pt, [1, 1, 1]), "xz");
      b.body();
      b.box("天軸", "metal", plane === "xz" ? [c[0], c[1], c[2]] : c, plane === "xz" ? [1, R * 2.2, 1] : [1, R * 2.2, 1]);
    }
  },
};

export const relic: KindDef = {
  id: "relic",
  no: "08",
  name: "聖遺物",
  en: "RELIC",
  family: "装飾",
  note: "炉心を爪金の枠が囲み、衛星がゆっくりと周回する浮遊装飾。",
  styles: [
    { label: "枠の炉心", sub: "CAGE" },
    { label: "八面晶", sub: "OCTA" },
    { label: "天球儀", sub: "ARMILLARY" },
    { label: "心核", sub: "LIVING HEART" },
  ],
  length: { label: "衛星の軌道", min: 5, max: 12, def: 8 },
  width: { label: "炉心の大きさ", min: 2, max: 6, def: 3 },
  palette: "void",
  build(b: Builder, p: Params, r: Rng) {
    const cy = 10;
    const c: V3 = [C, cy, C];
    const core = p.width;
    b.group("炉心", c, [{ kind: "pulse", cycles: 2, amp: 0.08 }]);
    b.box("炉心", "gem", c, [core, core, core]);
    b.box("炉心の殻", "glow", c, [core + 1, 1, core + 1]);
    b.body();
    const s = core / 2 + 2;
    if (p.style === 0) {
      [[0, s, 0, s * 2 + 1, 1, 1], [0, -s, 0, s * 2 + 1, 1, 1], [0, s, 0, 1, 1, s * 2 + 1], [0, -s, 0, 1, 1, s * 2 + 1]].forEach(([dx, dy, dz, w, h, d]) =>
        b.box("爪金", "metal", [C + dx, cy + dy, C + dz], [w, h, d])
      );
      [[s, s], [-s, s], [s, -s], [-s, -s]].forEach(([a, z]) => b.box("柱", "metal", [C + a, cy, C + z], [1, s * 2 + 1, 1]));
    } else if (p.style === 1) {
      for (let i = 0; i < 4; i++) {
        const w = Math.max(1, s * 2 - i * 2);
        b.box("晶の上", "base", [C, cy + core / 2 + i + 0.5, C], [w, 1, w]);
        b.box("晶の下", "shade", [C, cy - core / 2 - i - 0.5, C], [w, 1, w]);
      }
    } else {
      b.group("天球・赤道", c, [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }]);
      b.ring("赤道環", "metal", "xz", c, s + 1, 1, 1);
      b.group("天球・子午", c, [{ kind: "spin", axis: "y", cycles: -1, amp: 0 }]);
      b.ring("子午環", "metal", "xy", c, s + 1.5, 1, 1);
      b.body();
      b.box("台座", "shade", [C, 1, C], [6, 2, 6]);
      b.box("支柱", "metal", [C, 3, C], [1, 3, 1]);
    }
    if (p.style === 3) {
      // 生ける心核：二室の鼓動＋大動脈＋血脈
      const g = b.defineGroup("鼓動", c, {
        idle: [{ kind: "pulse", cycles: 2, amp: 0.18 }],
        attack: [{ kind: "pulse", cycles: 6, amp: 0.12 }, { kind: "burst", cycles: 1, amp: 0.9, window: [0.25, 1] }],
        cast: [{ kind: "pulse", cycles: 4, amp: 0.24 }],
        transform: [{ kind: "burst", cycles: 1, amp: 1.2, window: [0.1, 0.9] }],
      });
      b.into(g, () => {
        b.box("右室", "gem", [C - core / 2 + 0.4, cy - 0.5, C], [core, core + 1, core], { fine: true });
        b.box("左室", "gem", [C + core / 2 + 0.3, cy + 0.6, C], [core - 0.5, core, core - 0.5], { fine: true });
        b.box("大動脈", "glow", [C, cy + core + 0.8, C], [1.2, 2.5, 1.2], { fine: true });
        b.box("肺動脈", "glow", [C + 1.5, cy + core, C], [0.9, 2, 0.9], { fine: true, rot: { axis: "z", angle: -22.5 } });
      });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * 6.283 + 0.5;
        b.line("血脈", "glow", [C + Math.cos(a) * 1.5, cy, C + Math.sin(a) * 1.5], [C + Math.cos(a) * (core + 3), cy - 4, C + Math.sin(a) * (core + 3)], 0.5, { fine: true });
      }
    }
    const orbit = p.length;
    b.group("衛星", c, [{ kind: "spin", axis: "y", cycles: 1, amp: 0, phase: r() }]);
    b.around(3 + p.detail, orbit, c, (pt, a, i) => b.box("衛星", i % 2 ? "metal" : "gem", [pt[0], pt[1] + (i % 3 - 1) * 2, pt[2]], [i % 2 ? 1 : 2, i % 2 ? 1 : 2, i % 2 ? 1 : 2]));
    b.body();
    const n = Math.min(8, p.runes);
    if (n > 0) {
      b.group("刻印環", c, [{ kind: "spin", axis: "y", cycles: -1, amp: 0 }]);
      b.around(n, s + 2.5, c, (pt) => b.box("刻印", "glow", pt, [1, 2, 1]));
      b.body();
    }
  },
};
