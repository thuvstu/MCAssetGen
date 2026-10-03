import type { AnimSpec, Axis, Box, ClipMap, ElemRot, Group, Mat, Model, Palette, V3 } from "./types";
import { TAU, lighten } from "./util";

export interface BoxOpts {
  color?: string;
  rot?: { axis: Axis; angle: ElemRot["angle"]; origin?: V3 };
  fine?: boolean; // 0.25単位で量子化（効果パーティクル用）
}

const LIMIT_LO = -16;
const LIMIT_HI = 32;

/** AnimSpec の短記法（型定義ファイル群で共用） */
export const A = {
  spin: (axis: Axis, cycles: number, phase = 0): AnimSpec => ({ kind: "spin", axis, cycles, amp: 0, phase }),
  pulse: (cycles: number, amp: number, phase = 0): AnimSpec => ({ kind: "pulse", cycles, amp, phase }),
  blink: (cycles: number, phase = 0): AnimSpec => ({ kind: "blink", cycles, amp: 1, phase }),
  sway: (axis: Axis, cycles: number, amp: number, phase = 0): AnimSpec => ({ kind: "sway", axis, cycles, amp, phase }),
  bob: (cycles: number, amp: number, phase = 0): AnimSpec => ({ kind: "bob", cycles, amp, phase }),
  rise: (cycles: number, amp: number, phase = 0): AnimSpec => ({ kind: "rise", cycles, amp, phase }),
  swing: (axis: Axis, amp: number): AnimSpec => ({ kind: "swing", axis, cycles: 1, amp }),
  thrust: (axis: Axis, amp: number, window: [number, number] = [0.2, 1]): AnimSpec => ({ kind: "thrust", axis, cycles: 1, amp, window }),
  burst: (amp: number, window: [number, number] = [0.2, 1]): AnimSpec => ({ kind: "burst", cycles: 1, amp, window }),
};

export class Builder {
  boxes: Box[] = [];
  groups: Group[] = [];
  private cur = "body";
  private nid = 0;

  constructor(
    public palette: Palette,
    public snap: boolean
  ) {
    this.groups.push({ id: "body", name: "body", origin: [8, 8, 8], clips: { idle: [] } });
  }

  colorOf(mat: Mat) {
    switch (mat) {
      case "base":
        return this.palette.base;
      case "shade":
        return this.palette.shade;
      case "metal":
        return this.palette.metal;
      case "glow":
        return this.palette.glow;
      case "gem":
        return lighten(this.palette.glow, 0.18);
      default:
        return this.palette.glow;
    }
  }

  /** グループを定義するだけ（現在位置は変えない） */
  defineGroup(name: string, origin: V3, clips: ClipMap = {}, effect?: string) {
    const id = `${effect ?? "g"}_${this.groups.length}`;
    this.groups.push({ id, name, origin, clips: { idle: [], ...clips }, effect });
    return id;
  }

  /** 新しいグループを開始して以降の要素をそこに入れる */
  group(name: string, origin: V3, anims: AnimSpec[] = [], effect?: string) {
    const id = this.defineGroup(name, origin, { idle: anims }, effect);
    this.cur = id;
    return id;
  }

  /** 既存グループにクリップを足す */
  setClip(groupId: string, clip: string, specs: AnimSpec[]) {
    const g = this.groups.find((x) => x.id === groupId);
    if (g) g.clips[clip] = specs;
  }

  /** 指定グループに入って要素を足し、元の位置へ戻る */
  into(groupId: string, fn: () => void) {
    const prev = this.cur;
    this.cur = groupId;
    fn();
    this.cur = prev;
  }
  body() {
    this.cur = "body";
  }

  private q(v: number, fine: boolean) {
    if (fine || !this.snap) return Math.round(v * 4) / 4;
    // 0.5 刻み：奇数幅の要素も中心線に対して左右対称になる
    return Math.round(v * 2) / 2;
  }
  private qs(v: number, fine: boolean) {
    if (fine || !this.snap) return Math.max(0.25, Math.round(v * 4) / 4);
    return Math.max(1, Math.round(v));
  }

  box(name: string, mat: Mat, c: V3, s: V3, o: BoxOpts = {}) {
    const fine = !!o.fine;
    const W = this.qs(s[0], fine);
    const H = this.qs(s[1], fine);
    const D = this.qs(s[2], fine);
    const x0 = this.q(c[0] - W / 2, fine);
    const y0 = this.q(c[1] - H / 2, fine);
    const z0 = this.q(c[2] - D / 2, fine);
    const from: V3 = [x0, y0, z0];
    const to: V3 = [x0 + W, y0 + H, z0 + D];
    if (from.some((v) => v < LIMIT_LO) || to.some((v) => v > LIMIT_HI)) return null;
    const b: Box = {
      id: this.nid++,
      name,
      from,
      to,
      mat,
      color: o.color ?? this.colorOf(mat),
      group: this.cur,
    };
    if (o.rot && o.rot.angle !== 0) {
      b.rot = {
        axis: o.rot.axis,
        angle: o.rot.angle,
        origin: o.rot.origin ?? [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2],
      };
    }
    this.boxes.push(b);
    return b;
  }

  /** 像素リング（平面上に画素タイルを並べる） */
  ring(
    name: string,
    mat: Mat,
    plane: "xy" | "xz" | "zy",
    center: V3,
    radius: number,
    thick = 1,
    cell = 1,
    o: BoxOpts = {}
  ) {
    const R = Math.ceil(radius + thick / 2 + cell);
    for (let a = -R; a <= R; a += cell) {
      for (let b = -R; b <= R; b += cell) {
        const d = Math.hypot(a + cell / 2, b + cell / 2);
        if (Math.abs(d - radius) > thick / 2) continue;
        const u = a + cell / 2;
        const v = b + cell / 2;
        const c: V3 =
          plane === "xy"
            ? [center[0] + u, center[1] + v, center[2]]
            : plane === "xz"
              ? [center[0] + u, center[1], center[2] + v]
              : [center[0], center[1] + v, center[2] + u];
        this.box(name, mat, c, [cell, cell, cell], o);
      }
    }
  }

  /** 円周上に n 個の要素を置く */
  around(n: number, radius: number, center: V3, fn: (p: V3, ang: number, i: number) => void, plane: "xz" | "xy" = "xz", offset = 0) {
    for (let i = 0; i < n; i++) {
      const ang = offset + (i / n) * TAU;
      const p: V3 =
        plane === "xz"
          ? [center[0] + Math.cos(ang) * radius, center[1], center[2] + Math.sin(ang) * radius]
          : [center[0] + Math.cos(ang) * radius, center[1] + Math.sin(ang) * radius, center[2]];
      fn(p, ang, i);
    }
  }

  /** 始点→終点を立方体で繋ぐ（稲妻・鎖など） */
  line(name: string, mat: Mat, a: V3, b: V3, size = 1, o: BoxOpts = {}) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const steps = Math.max(1, Math.round(len / size));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.box(name, mat, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], [size, size, size], o);
    }
  }

  build(): Model {
    const used = new Set(this.boxes.map((b) => b.group));
    return { boxes: this.boxes, groups: this.groups.filter((g) => used.has(g.id)) };
  }
}
