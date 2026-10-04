// ─────────────────────────────────────────────
// UV ATLAS FORGE — コア型定義
// ─────────────────────────────────────────────
export type V3 = [number, number, number];
export type Axis = "x" | "y" | "z";

/** 表面の質感。テクスチャの描き方と3Dマテリアルを決める */
export type Mat = "base" | "shade" | "metal" | "glow" | "fx" | "gem";
export type PaletteRole = "base" | "shade" | "metal" | "glow";
export type Palette = Record<PaletteRole, string>;

/** Minecraft Java 互換の要素回転（単軸・22.5°刻み） */
export interface ElemRot {
  axis: Axis;
  angle: -45 | -22.5 | 0 | 22.5 | 45;
  origin: V3;
}

/** 循環する動き（ループ内の整数周期）＋ 一度きりの動き（window で区間指定） */
export type AnimKind =
  | "spin"
  | "bob"
  | "pulse"
  | "rise"
  | "sway"
  | "blink"
  | "swing"
  | "thrust"
  | "burst"
  | "shift"
  | "turn";

export interface AnimSpec {
  kind: AnimKind;
  axis?: Axis;
  cycles: number;
  amp: number;
  phase?: number;
  /** クリップ内の作用区間 (0..1)。未指定なら全域 */
  window?: [number, number];
}

/** クリップ id → その動き */
export type ClipMap = Record<string, AnimSpec[]>;

export interface Group {
  id: string;
  name: string;
  origin: V3;
  clips: ClipMap;
  /** 効果由来のグループは effect id を持つ */
  effect?: string;
}

export interface Box {
  id: number;
  name: string;
  from: V3;
  to: V3;
  mat: Mat;
  color: string;
  group: string;
  rot?: ElemRot;
}

export interface Model {
  boxes: Box[];
  groups: Group[];
}

export interface Bounds {
  min: V3;
  max: V3;
  center: V3;
  top: number;
  bottom: number;
  radius: number;
}

export type Layout = "grid" | "strip" | "dense";

export interface EffectState {
  on: boolean;
  amount: number; // 1..10
  size: number; // 0.5..1.6
  color: string;
}

export interface AnimSettings {
  on: boolean;
  loop: number; // 秒
  speed: number; // プレビュー倍率
  spin: number; // 本体の自転 cycles/loop
  bob: number; // 本体の上下動 (1/8)
}

export interface ViewSettings {
  wire: boolean;
  bloom: number; // 0..2
  emissive: number; // 0..3
  grid: boolean;
  /** 幻影（残像ゴースト）の本数 0..5 */
  phantom: number;
  /** 幻影の間隔（フレーム） 2..12 */
  phantomGap: number;
}

/** 階調：アトラスの塗りに世界高さベースのグラデーションをかける */
export type GradMode = "none" | "rise" | "fall" | "heat" | "abyss";
export interface GradSettings {
  mode: GradMode;
  power: number; // 0..1
}

export interface Params {
  version: 3;
  grad: GradSettings;
  name: string;
  kind: string;
  style: number;
  seed: number;
  length: number;
  width: number;
  detail: number; // 0..3
  runes: number;
  /** 段階強化 0..5 */
  tier: number;
  /** 限界突破（tier 5 でのみ有効） */
  overdrive: boolean;
  /** 形態 0=封印 1=解放 2=真 */
  form: number;
  /** 一時的モード */
  mode: string;
  palette: Palette;
  effects: Record<string, EffectState>;
  tex: number; // 0 = auto
  layout: Layout;
  share: boolean;
  snap: boolean;
  anim: AnimSettings;
  view: ViewSettings;
}

export interface Cell {
  key: string;
  rect: [number, number, number, number];
  faces: Record<FaceKey, [number, number, number, number]>;
  sample: Box;
  count: number;
}

export type FaceKey = "north" | "east" | "south" | "west" | "up" | "down";

export interface Atlas {
  size: number;
  layout: Layout;
  cells: Cell[];
  cellOf: Map<number, Cell>;
  fill: number;
}
