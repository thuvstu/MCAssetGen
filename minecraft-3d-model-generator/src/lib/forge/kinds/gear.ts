import type { Builder } from "../builder";
import type { Params, V3 } from "../types";
import { lerp, type Rng } from "../util";
import type { KindDef } from "./types";

const C = 8;

export const shield: KindDef = {
  id: "shield",
  no: "09",
  name: "盾",
  en: "SHIELD",
  family: "防具",
  note: "行ごとに積んだ盾板と金属の縁、中央の浮き彫りと紋章。",
  styles: [
    { label: "円盾", sub: "ROUND" },
    { label: "凧盾", sub: "KITE" },
    { label: "塔盾", sub: "TOWER" },
  ],
  length: { label: "盾の丈", min: 8, max: 20, def: 14 },
  width: { label: "盾の幅", min: 3, max: 8, def: 6 },
  palette: "royal",
  build(b: Builder, p: Params) {
    const H = p.length;
    const W = p.width;
    const cy = 10;
    const rows = Math.round(H);
    for (let i = 0; i < rows; i++) {
      const v = (i + 0.5) / rows; // 0 bottom .. 1 top
      let hw: number;
      if (p.style === 0) hw = W * Math.sqrt(Math.max(0, 1 - Math.pow(v * 2 - 1, 2)));
      else if (p.style === 1) hw = v > 0.55 ? W * Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.55) / 0.5, 2))) : W * Math.pow(v / 0.55, 0.8);
      else hw = v > 0.88 ? W * Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.88) / 0.14, 2))) * 0.9 + W * 0.1 : W;
      hw = Math.max(0.5, Math.round(hw * 2) / 2);
      const y = cy - H / 2 + i + 0.5;
      const edge = i === 0 || i === rows - 1;
      b.box("盾板", edge ? "metal" : i % 4 < 2 ? "base" : "shade", [C, y, C], [hw * 2, 1, 2]);
      if (!edge && hw >= 1) {
        b.box("縁", "metal", [C - hw + 0.5, y, C], [1, 1, 3]);
        b.box("縁", "metal", [C + hw - 0.5, y, C], [1, 1, 3]);
      }
    }
    b.box("浮き彫り", "metal", [C, cy + (p.style === 1 ? 1 : 0), C + 1.5], [3, 3, 1]);
    b.box("浮き彫りの石", "gem", [C, cy + (p.style === 1 ? 1 : 0), C + 2], [1, 1, 1]);
    if (p.runes > 0) {
      b.box("紋章・縦", "glow", [C, cy, C + 1.25], [1, Math.min(H - 3, 8), 0.5], { fine: true });
      b.box("紋章・横", "glow", [C, cy + 1.5, C + 1.25], [Math.min(W * 2 - 3, 7), 1, 0.5], { fine: true });
    }
    if (p.detail > 0) {
      const rv: [number, number][] = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
      rv.forEach(([sx, sy]) => b.box("鋲", "metal", [C + sx * (W - 2), cy + sy * (H / 2 - 2.5), C + 1.25], [1, 1, 0.5], { fine: true }));
    }
    b.box("握り", "shade", [C, cy, C - 1.5], [1, 4, 1]);
  },
};

export const armor: KindDef = {
  id: "armor",
  no: "10",
  name: "防具",
  en: "ARMOR",
  family: "防具",
  note: "兜・胸当て・肩当て。重ね皿と前立て、錣の段差を積む。",
  styles: [
    { label: "兜", sub: "HELM" },
    { label: "胸当て", sub: "CHEST" },
    { label: "肩当て", sub: "PAULDRON" },
  ],
  length: { label: "重ねの高さ", min: 6, max: 14, def: 10 },
  width: { label: "本体の幅", min: 3, max: 7, def: 4 },
  palette: "samurai",
  build(b: Builder, p: Params) {
    const k = Math.max(0.75, p.width / 4);
    if (p.style === 0) {
      let wd = 10 * k;
      [11, 13, 15].forEach((y, i) => {
        b.box("鉢", i % 2 ? "shade" : "base", [C, y + 1, C], [wd, 2, 9 * k - i]);
        wd -= 1.4 * k;
      });
      b.box("天辺", "metal", [C, 17.5, C], [3, 1, 3]);
      b.box("面頬", "shade", [C, 8, C + 3.5 * k], [7 * k, 5, 2]);
      b.box("内", "shade", [C, 8, C], [6 * k, 5, 5]);
      b.box("眼", "glow", [C, 10, C + 4.5 * k], [6 * k, 1, 1]);
      [-1, 1].forEach((d) => {
        b.box("吹返し", "shade", [C + d * 5.5 * k, 8.5, C], [2, 6, 6]);
        b.box("吹返しの縁", "metal", [C + d * 5.5 * k, 5.5, C], [3, 1, 7]);
        if (p.detail > 1) b.box("角", "metal", [C + d * 4, 18.5, C + 2], [1, 4, 1], { rot: { axis: "z", angle: d > 0 ? -22.5 : 22.5 } });
      });
      b.box("前立て", "metal", [C, 16.5, C + 4.5 * k], [1, 6, 1]);
      b.box("前立ての月", "gem", [C, 19.5, C + 4.5 * k], [5, 2, 1]);
      for (let i = 0; i < 3; i++) b.box("錣", i % 2 ? "base" : "metal", [C, 5 - i * 1.5, C - 1], [8 * k + i, 1.5, 7 * k], { fine: true });
    } else if (p.style === 1) {
      const rows = Math.max(4, Math.round(p.length / 2));
      for (let i = 0; i < rows; i++) {
        const y = 4 + i * 2;
        const wd = lerp(11 * k, 7.5 * k, i / rows);
        b.box("胴板", i % 2 ? "base" : "shade", [C, y + 1, C], [wd, 2, 6.5 * k]);
        b.box("胴板の縁", "metal", [C, y + 0.25, C + 3.25 * k], [wd, 0.5, 0.5], { fine: true });
      }
      b.box("胸元", "base", [C, 5 + rows * 2, C], [9 * k, 2, 6.5 * k]);
      b.box("護符", "gem", [C, 11, C + 3.5 * k], [3, 3, 1]);
      [-1, 1].forEach((d) => b.box("肩紐", "metal", [C + d * 4.5 * k, 6 + rows * 2, C], [2, 1, 7 * k]));
      b.box("草摺", "metal", [C, 3, C], [9 * k, 2, 7 * k]);
    } else {
      for (let i = 0; i < 5; i++) {
        const y = 14 - i * 2.4;
        const wd = lerp(7, 13, i / 5) * k;
        b.box("肩皿", i % 2 ? "shade" : "base", [C, y, C], [wd, 2.4, lerp(7, 9, i / 5)], { fine: !p.snap });
        b.box("肩皿の縁", "metal", [C, y - 1.5, C], [wd, 0.5, lerp(7, 9, i / 5) + 0.5], { fine: true });
      }
      b.box("肩の峰", "metal", [C, 16, C], [6 * k, 2, 6]);
      b.box("紋章", "gem", [C, 11, C + 5], [3, 3, 1]);
      if (p.detail > 1) for (let i = 0; i < 3; i++) b.box("棘", "metal", [C - 2 + i * 2, 18 + (i === 1 ? 1 : 0), C], [1, 2 + (i === 1 ? 2 : 0), 1]);
    }
  },
};

export const crown: KindDef = {
  id: "crown",
  no: "11",
  name: "冠",
  en: "CROWN",
  family: "装飾",
  note: "像素の環に立ち上がる尖塔と宝石。宝冠は前が高く、角冠は大きく反る。",
  styles: [
    { label: "王冠", sub: "CROWN" },
    { label: "宝冠", sub: "TIARA" },
    { label: "角冠", sub: "HORNED" },
  ],
  length: { label: "尖塔の高さ", min: 2, max: 10, def: 5 },
  width: { label: "環の径", min: 3, max: 7, def: 5 },
  palette: "gold",
  build(b: Builder, p: Params, r: Rng) {
    const R = p.width;
    const y0 = 4;
    b.ring("冠帯", "metal", "xz", [C, y0, C], R, 1.2, 1);
    b.ring("冠帯", "base", "xz", [C, y0 + 1, C], R, 1.2, 1);
    const n = 8 + (p.detail > 1 ? 4 : 0);
    b.around(n, R, [C, y0, C], (pt, a, i) => {
      let h = p.length * (i % 2 ? 0.6 : 1);
      if (p.style === 1) h = p.length * (0.35 + 0.65 * Math.max(0, Math.sin(a))) * (i % 2 ? 0.7 : 1);
      if (p.style === 2) h = p.length * 0.45;
      h = Math.max(1, Math.round(h));
      b.box("尖塔", "metal", [pt[0], y0 + 1.5 + h / 2, pt[2]], [1, h, 1]);
      if (i % 2 === 0) b.box("尖塔の珠", "gem", [pt[0], y0 + 2 + h, pt[2]], [1, 1, 1]);
    });
    const g = Math.min(8, p.runes + 2);
    b.around(g, R + 0.6, [C, y0 + 0.5, C], (pt, a, i) => b.box("帯の宝石", i % 3 === 0 ? "gem" : "glow", pt, [1, 1, 1]), "xz", r() * 0.3);
    if (p.style === 1) {
      b.box("額の大石", "gem", [C, y0 + 3, C + R], [2, 3, 1]);
    }
    if (p.style === 2) {
      [-1, 1].forEach((d) => {
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          b.box("角", i > 3 ? "gem" : "shade", [C + d * (R + t * 3), y0 + 2 + i * 1.5, C - t * 2], [2 - t, 2, 2 - t], {
            fine: true,
            rot: { axis: "z", angle: d > 0 ? (i > 2 ? -45 : -22.5) : i > 2 ? 45 : 22.5 },
          });
        }
      });
    }
    if (p.detail > 2) {
      const top: V3 = [C, y0 + p.length + 5, C];
      b.group("冠上の星", top, [{ kind: "spin", axis: "y", cycles: 1, amp: 0 }, { kind: "bob", cycles: 2, amp: 0.6 }]);
      b.box("星", "gem", top, [2, 2, 2]);
      b.box("星の光", "glow", top, [4, 1, 1]);
      b.box("星の光", "glow", top, [1, 4, 1]);
      b.body();
    }
  },
};
