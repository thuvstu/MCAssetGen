import type { Builder } from "./forge-builder";
import type { Params } from "./forge-types2";
import { lerp, type Rng } from "./forge-util";
import type { KindDef } from "./forge-kinds-types";

const C = 8;

function pommelAndGrip(b: Builder, p: Params, gripH: number) {
  b.box("頭金", "metal", [C, 1, C], [3, 2, 3]);
  if (p.detail > 0) b.box("頭金の石", "gem", [C, 1, C], [1, 1, 4]);
  b.box("柄", "shade", [C, 2 + gripH / 2, C], [2, gripH, 2]);
  const wraps = Math.floor(gripH / 2);
  for (let i = 0; i < wraps; i++) {
    b.box("柄巻", "base", [C, 2.5 + i * 2 + 0.5, C], [3, 1, 3]);
  }
  return 2 + gripH;
}

function runesOnBlade(b: Builder, p: Params, y0: number, len: number, xAt: (t: number) => number) {
  const n = Math.min(10, p.runes);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.7) / (n + 0.4);
    b.box("ルーン", "glow", [xAt(t), y0 + len * t, C], [1, 1, 3]);
  }
}

export const sword: KindDef = {
  id: "sword",
  no: "01",
  name: "剣",
  en: "BLADE",
  family: "武器",
  note: "頭金・柄巻・鍔・刀身の四段構成。切先のテーパーと樋、刻まれるルーン。",
  styles: [
    { label: "直剣", sub: "LONGSWORD" },
    { label: "刀", sub: "KATANA" },
    { label: "大剣", sub: "GREATSWORD" },
  ],
  length: { label: "刃長", min: 6, max: 18, def: 13 },
  width: { label: "刃幅", min: 2, max: 7, def: 4 },
  palette: "steel",
  build(b: Builder, p: Params) {
    const st = p.style;
    const w = Math.max(2, p.width * (st === 2 ? 1.35 : st === 1 ? 0.7 : 1));
    const len = Math.min(22, p.length * (st === 2 ? 1.1 : 1));
    const gy = pommelAndGrip(b, p, st === 2 ? 6 : st === 1 ? 6 : 4);

    // 鍔
    if (st === 0) {
      const gw = Math.max(8, Math.round(w * 2.4));
      b.box("十字鍔", "metal", [C, gy + 0.5, C], [gw, 1, 3]);
      b.box("鍔先", "metal", [C - gw / 2 + 0.5, gy + 1.5, C], [1, 2, 3]);
      b.box("鍔先", "metal", [C + gw / 2 - 0.5, gy + 1.5, C], [1, 2, 3]);
      b.box("鍔の石", "gem", [C, gy + 0.5, C], [2, 2, 4]);
    } else if (st === 1) {
      b.ring("鐔", "metal", "xz", [C, gy + 0.5, C], 2.2, 1.6, 1);
      b.box("鐔・芯", "shade", [C, gy + 0.5, C], [4, 1, 4]);
      b.box("鎺", "metal", [C, gy + 1.5, C], [3, 1, 3]);
    } else {
      const gw = Math.max(10, Math.round(w * 2.2));
      b.box("翼鍔", "metal", [C, gy + 1, C], [gw, 2, 4]);
      b.box("翼鍔・左", "metal", [C - gw / 2, gy + 2.5, C], [3, 2, 3], { rot: { axis: "z", angle: 22.5 } });
      b.box("翼鍔・右", "metal", [C + gw / 2, gy + 2.5, C], [3, 2, 3], { rot: { axis: "z", angle: -22.5 } });
      b.box("鍔の石", "gem", [C, gy + 1, C], [3, 3, 5]);
    }

    // 刀身
    const y0 = gy + (st === 2 ? 2 : 1.5);
    const seg = st === 1 ? 1.5 : 2;
    const n = Math.max(3, Math.round(len / seg));
    const h = len / n;
    const curve = (t: number) => (st === 1 ? t * t * 2.2 : 0);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const wi = Math.max(st === 1 ? 2 : 2, lerp(w, w * 0.62, Math.pow(t, 1.6)));
      const cx = C + curve(t);
      const cy = y0 + h * (i + 0.5);
      b.box("刀身", "base", [cx, cy, C], [wi, h, st === 2 ? 2 : 1]);
      if (wi >= 3) b.box("樋", "shade", [cx, cy, C], [1, h, st === 2 ? 3 : 2]);
      if (st === 1) b.box("刃文", "metal", [cx + wi / 2 - 0.25, cy, C], [0.5, h, 1.25], { fine: true });
    }
    const tipX = C + curve(1);
    const wt = Math.max(2, w * 0.55);
    b.box("切先", "base", [tipX, y0 + len + 0.5, C], [Math.max(1, wt - 1), 1, 1]);
    b.box("切先", "base", [tipX + (st === 1 ? 0.5 : 0), y0 + len + 1.5, C], [1, 1, 1]);
    if (p.detail > 1) b.box("鎬の光", "metal", [C, y0 + 0.5, C], [Math.min(w + 1, 7), 1, st === 2 ? 3 : 2]);
    runesOnBlade(b, p, y0, len, (t) => C + curve(t));
  },
};

export const axe: KindDef = {
  id: "axe",
  no: "02",
  name: "斧",
  en: "AXE",
  family: "武器",
  note: "長柄の先に三日月の刃板を重ねる。背の鉤、石突、柄の革巻き。",
  styles: [
    { label: "片刃", sub: "BEARDED" },
    { label: "両刃", sub: "LABRYS" },
    { label: "鉞", sub: "HALBERD" },
  ],
  length: { label: "柄の長さ", min: 8, max: 20, def: 15 },
  width: { label: "刃の張り", min: 2, max: 7, def: 5 },
  palette: "iron",
  build(b: Builder, p: Params) {
    const H = p.length + 4;
    b.box("石突", "metal", [C, 0.5, C], [3, 1, 3]);
    for (let y = 1; y < H; y += 2) {
      b.box("柄", y % 4 === 1 ? "shade" : "base", [C, y + 1, C], [2, 2, 2]);
    }
    for (let i = 0; i < 2 + p.detail; i++) b.box("革巻", "shade", [C, 3 + i * 1.5, C], [3, 1, 3]);
    const hy = H - 2;
    b.box("口金", "metal", [C, hy, C], [3, 5, 3]);
    b.box("天頂", "metal", [C, H + 1, C], [1, 3, 1]);

    const blade = (dir: 1 | -1, big: boolean) => {
      const cols = Math.round(p.width) + (big ? 2 : 0);
      for (let k = 0; k < cols; k++) {
        const t = k / Math.max(1, cols - 1);
        const hh = Math.round(3 + t * t * (big ? 9 : 6));
        const dy = p.style === 2 ? t * 2 : 0;
        const last = k === cols - 1;
        b.box(last ? "刃" : "刃板", last ? "metal" : "base", [C + dir * (2 + k), hy + dy, C], [1, hh, 1]);
      }
      if (p.runes > 0) b.box("刃のルーン", "glow", [C + dir * (2 + Math.floor(cols / 2)), hy, C], [1, 2, 2]);
    };
    if (p.style === 0) {
      blade(1, false);
      for (let k = 0; k < 3; k++) b.box("背鉤", "metal", [C - 2 - k, hy - k * 0.5, C], [1, 3 - k, 1]);
    } else if (p.style === 1) {
      blade(1, false);
      blade(-1, false);
    } else {
      blade(1, true);
      b.box("鉤", "metal", [C - 2.5, hy + 1, C], [2, 1, 1]);
      b.box("鉤", "metal", [C - 3.5, hy + 2, C], [1, 2, 1]);
      b.box("穂先", "metal", [C, H + 3, C], [1, 3, 1]);
    }
    if (p.detail > 1) b.box("口金の石", "gem", [C, hy, C], [1, 1, 4]);
  },
};

export const spear: KindDef = {
  id: "spear",
  no: "03",
  name: "槍",
  en: "SPEAR",
  family: "武器",
  note: "長柄に葉形の穂先。首元の房飾りは風を受けて揺れる。",
  styles: [
    { label: "素槍", sub: "LANCE" },
    { label: "三叉", sub: "TRIDENT" },
    { label: "薙刀", sub: "GLAIVE" },
  ],
  length: { label: "柄の長さ", min: 10, max: 22, def: 18 },
  width: { label: "穂の幅", min: 2, max: 6, def: 3 },
  palette: "bronze",
  build(b: Builder, p: Params, r: Rng) {
    const H = p.length;
    b.box("石突", "metal", [C, 0.5, C], [2, 1, 2]);
    for (let y = 1; y < H; y += 3) b.box("柄", "base", [C, y + 1.5, C], [1, 3, 1]);
    for (let i = 0; i < 3; i++) b.box("柄の帯", "metal", [C, 4 + i * ((H - 6) / 3), C], [2, 1, 2]);
    b.box("口金", "metal", [C, H + 0.5, C], [2, 2, 2]);
    const y0 = H + 1.5;
    const w = p.width;
    if (p.style === 0) {
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const wi = Math.max(1, Math.round(w * Math.sin(Math.PI * (0.25 + t * 0.7))));
        b.box("穂", "base", [C, y0 + i + 0.5, C], [wi, 1, 1]);
      }
      b.box("穂・鎬", "shade", [C, y0 + 2.5, C], [1, 5, 2]);
      b.box("穂先", "base", [C, y0 + 5.5, C], [1, 1, 1]);
    } else if (p.style === 1) {
      b.box("叉の横木", "metal", [C, y0, C], [w * 2 + 1, 1, 1]);
      [-1, 0, 1].forEach((d) => {
        const x = C + d * w;
        const hh = d === 0 ? 6 : 4;
        b.box("叉", "base", [x, y0 + hh / 2 + 0.5, C], [1, hh, 1]);
        b.box("返し", "metal", [x - (d === 0 ? 0 : d) * 0.5, y0 + hh - 0.5, C], [d === 0 ? 1 : 2, 1, 1]);
      });
    } else {
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const wi = Math.max(1, Math.round(lerp(w, 1, t)));
        b.box("薙刀の刃", "base", [C + wi / 2 + t * 2 - 0.5, y0 + i + 0.5, C], [wi, 1, 1]);
      }
      b.box("刃の背", "metal", [C, y0 + 3, C], [1, 6, 1]);
    }
    if (p.runes > 0) b.box("穂のルーン", "glow", [C, y0 + 2, C], [1, 1, 2]);
    // 房飾り（揺れるグループ）
    b.group("房飾り", [C, y0 - 1, C], [{ kind: "sway", axis: "z", cycles: 2, amp: 14, phase: r() }]);
    for (let i = 0; i < 3 + p.detail; i++) {
      b.box("房", "glow", [C + (i % 2 ? 0.5 : -0.5), y0 - 2 - i, C + 1.25], [1, 1, 0.5], { fine: true });
    }
    b.body();
  },
};

export const bow: KindDef = {
  id: "bow",
  no: "04",
  name: "弓",
  en: "BOW",
  family: "武器",
  note: "弧を描く弓幹と握り、細く張られた弦。反曲や翼羽の意匠を選べる。",
  styles: [
    { label: "長弓", sub: "LONGBOW" },
    { label: "反曲弓", sub: "RECURVE" },
    { label: "翼弓", sub: "WINGED" },
    { label: "弩", sub: "CROSSBOW" },
  ],
  length: { label: "弓丈", min: 10, max: 22, def: 18 },
  width: { label: "反りの深さ", min: 1, max: 6, def: 3 },
  palette: "wood",
  build(b: Builder, p: Params) {
    if (p.style === 3) {
      // 弩：縦の銃床＋横の弓幹＋巻上機
      const H = Math.min(16, p.length * 0.8);
      b.box("台尻", "shade", [C, 1.5, C], [2.5, 3, 2]);
      b.box("銃床", "base", [C, 2 + H / 2, C], [2, H, 2]);
      b.box("矢道", "shade", [C, 2 + H / 2, C + 1.1], [1, H - 1, 0.5], { fine: true });
      b.box("引鉄", "metal", [C, 3.5, C - 1.4], [0.75, 1.5, 0.75], { fine: true });
      const ay = 2 + H - 1;
      const arm = p.length * 0.55 + p.width;
      [-1, 1].forEach((d) => {
        b.box("弓幹", "base", [C + d * arm * 0.3, ay, C], [arm * 0.6, 1.5, 1.5]);
        b.box("弓先", "metal", [C + d * arm * 0.62, ay + 0.8, C], [1.5, 1.5, 1], { rot: { axis: "z", angle: d > 0 ? -22.5 : 22.5 } });
      });
      b.box("弦", "metal", [C, ay - 1.2, C], [arm * 1.15, 0.25, 0.25], { fine: true });
      b.box("矢", "shade", [C, ay + 1, C + 0.8], [0.5, 4, 0.5], { fine: true });
      b.box("鏃", "metal", [C, ay + 3.2, C + 0.8], [1, 1, 1], { fine: true });
      const g = b.defineGroup("巻上機", [C, 5, C - 1.5], {
        idle: [{ kind: "spin", axis: "z", cycles: 1, amp: 0 }],
        attack: [{ kind: "spin", axis: "z", cycles: -3, amp: 0 }],
        cast: [{ kind: "spin", axis: "z", cycles: 2, amp: 0 }],
      });
      b.into(g, () => {
        b.ring("巻上輪", "metal", "xy", [C, 5, C - 1.5], 1.4, 0.8, 1);
        b.box("把手", "metal", [C + 1.8, 5, C - 1.5], [1, 0.6, 0.6], { fine: true });
      });
      if (p.detail > 1) b.box("照準", "gem", [C, ay + 2, C - 1.2], [0.75, 1.5, 0.75], { fine: true });
      return;
    }
    const cy = 12;
    const half = p.length / 2;
    const depth = p.width;
    const n = Math.round(half);
    let tipTop: [number, number] = [C, cy + half];
    let tipBot: [number, number] = [C, cy - half];
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        let dx = -depth * Math.sin(t * Math.PI * 0.5);
        if (p.style === 1 && t > 0.75) dx += (t - 0.75) * 4 * depth * 0.9;
        const x = C + dx;
        const y = cy + s * t * half;
        const thick = t > 0.85 ? 1 : 1.5;
        b.box("弓幹", i % 3 === 0 ? "shade" : "base", [x, y, C], [thick, 1.25, thick], { fine: true });
        if (i === n) {
          if (s > 0) tipTop = [x, y];
          else tipBot = [x, y];
          b.box("弭", "metal", [x, y + s * 0.75, C], [1, 1, 1], { fine: true });
        }
        if (p.style === 2 && i > 2 && i % 2 === 0) {
          b.box("翼羽", "glow", [x - 1.5 - t, y, C], [2 + t * 2, 0.75, 0.5], {
            fine: true,
            rot: { axis: "z", angle: s > 0 ? -22.5 : 22.5 },
          });
        }
      }
    }
    b.box("握り", "shade", [C, cy, C], [2.5, 4, 2.5], { fine: true });
    b.box("握りの帯", "metal", [C, cy + 2, C], [3, 0.5, 3], { fine: true });
    b.box("握りの帯", "metal", [C, cy - 2, C], [3, 0.5, 3], { fine: true });
    if (p.detail > 0) b.box("矢摺りの石", "gem", [C - 1, cy, C], [1, 1.5, 1], { fine: true });
    const sx = Math.max(tipTop[0], tipBot[0]) + 0.5;
    b.box("弦", "metal", [sx, cy, C], [0.25, tipTop[1] - tipBot[1], 0.25], { fine: true });
    if (p.runes > 0) {
      for (let i = 0; i < Math.min(6, p.runes); i++) {
        const t = (i + 1) / (Math.min(6, p.runes) + 1);
        const s = i % 2 ? 1 : -1;
        b.box("弓のルーン", "glow", [C - depth * Math.sin(t * Math.PI * 0.5), cy + s * t * half, C + 0.75], [1, 1, 0.5], { fine: true });
      }
    }
  },
};
