import type { AnimSettings, AnimSpec, ClipMap, V3 } from "./forge-types2";
import { TAU, clamp } from "./forge-util";

export interface Pose {
  pos: V3;
  rot: V3; // degrees
  scale: number;
}

export interface ClipDef {
  id: string;
  name: string;
  en: string;
  glyph: string;
  length: number;
  loop: boolean;
  note: string;
}

/** 待機以外は一度だけ再生して待機へ戻る */
export const CLIPS: ClipDef[] = [
  { id: "idle", name: "待機", en: "IDLE", glyph: "待", length: 4, loop: true, note: "常時循環。自転と効果の周回。" },
  { id: "attack", name: "攻撃", en: "ATTACK", glyph: "攻", length: 1.15, loop: false, note: "溜め→斬撃→戻り。効果が弾ける。" },
  { id: "guard", name: "防御", en: "GUARD", glyph: "防", length: 0.9, loop: false, note: "身を引いて構え、衝撃を受け流す。" },
  { id: "cast", name: "詠唱", en: "CAST", glyph: "詠", length: 2.2, loop: false, note: "浮上し回転、術式が展開する。" },
  { id: "transform", name: "変身", en: "TRANSFORM", glyph: "変", length: 1.6, loop: false, note: "組み替えの閃光。段階・形態の切替時に自動再生。" },
];
export const clipById = (id: string) => CLIPS.find((c) => c.id === id) ?? CLIPS[0];

const AX = { x: 0, y: 1, z: 2 } as const;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => x * x * (3 - 2 * x);

/** 溜め → 打ち下ろし → 戻り */
function swingCurve(x: number) {
  if (x < 0.32) return -0.34 * smooth(x / 0.32);
  if (x < 0.52) return -0.34 + 1.34 * Math.pow((x - 0.32) / 0.2, 0.6);
  return 1 - smooth(clamp01((x - 0.52) / 0.48));
}
/** 立ち上がり鋭く、尾を引いて減衰 */
function impulse(x: number) {
  if (x < 0.12) return smooth(x / 0.12);
  return Math.pow(1 - (x - 0.12) / 0.88, 2.2);
}

/** t01: クリップ内の位置 (0..1)。プレビュー・.bbmodel・GLB が全てこの関数を共有する */
export function evaluate(anims: AnimSpec[], t01: number): Pose {
  const pose: Pose = { pos: [0, 0, 0], rot: [0, 0, 0], scale: 1 };
  for (const a of anims) {
    let local = t01;
    if (a.window) {
      const [w0, w1] = a.window;
      const hold = a.kind === "shift" || a.kind === "turn";
      if (t01 < w0) continue;
      if (t01 > w1) {
        if (!hold) continue;
        local = 1;
      } else local = (t01 - w0) / Math.max(1e-6, w1 - w0);
    }
    const ph = a.phase ?? 0;
    const u = a.cycles * local + ph;
    switch (a.kind) {
      case "spin":
        pose.rot[AX[a.axis ?? "y"]] += 360 * u;
        break;
      case "bob":
        pose.pos[1] += a.amp * Math.sin(TAU * u);
        break;
      case "pulse":
        pose.scale *= 1 + a.amp * Math.sin(TAU * u);
        break;
      case "sway":
        pose.rot[AX[a.axis ?? "z"]] += a.amp * Math.sin(TAU * u);
        break;
      case "rise": {
        const f = ((u % 1) + 1) % 1;
        pose.pos[1] += a.amp * f;
        pose.scale *= Math.sin(Math.PI * f);
        break;
      }
      case "blink": {
        const s = Math.abs(Math.sin(Math.PI * u));
        pose.scale *= 0.12 + 0.88 * s * s * s;
        break;
      }
      case "swing":
        pose.rot[AX[a.axis ?? "x"]] += a.amp * swingCurve(local);
        break;
      case "thrust":
        pose.pos[AX[a.axis ?? "z"]] += a.amp * impulse(local);
        break;
      case "burst":
        pose.scale *= 1 + a.amp * impulse(local);
        break;
      case "shift":
        pose.pos[AX[a.axis ?? "y"]] += a.amp * smooth(clamp01(local));
        break;
      case "turn":
        pose.rot[AX[a.axis ?? "y"]] += a.amp * smooth(clamp01(local));
        break;
    }
  }
  pose.scale = clamp(pose.scale, 0.0001, 8);
  return pose;
}

/** 本体（ルート）の待機： 自転と上下動 */
export function rootIdle(a: AnimSettings): AnimSpec[] {
  const out: AnimSpec[] = [];
  if (a.spin !== 0) out.push({ kind: "spin", axis: "y", cycles: Math.round(a.spin), amp: 0 });
  if (a.bob > 0) out.push({ kind: "bob", cycles: 1, amp: a.bob / 8 });
  return out;
}

/** クリップのキーフレーム数 */
export function sampleCount(anims: AnimSpec[], loop: boolean) {
  if (!loop) return 48;
  let max = 1;
  for (const a of anims) {
    const c = Math.abs(a.cycles);
    const per = a.kind === "spin" ? 4 : a.kind === "rise" ? 24 : 16;
    max = Math.max(max, Math.ceil(c * per));
  }
  return Math.min(96, Math.max(4, max));
}

export const clipAnims = (clips: ClipMap, clip: string): AnimSpec[] => clips[clip] ?? clips.idle ?? [];
