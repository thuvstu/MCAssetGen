export interface FaceUV {
  uv: [number, number, number, number]; // [u1, v1, u2, v2] in 0..16 Minecraft UV space (or scaled to resolution)
  texture: string;
  rotation?: 0 | 90 | 180 | 270;
}

export type MotionRig =
  | "core"
  | "orbit_a"
  | "orbit_b"
  | "orbit_c"
  | "halo"
  | "mote"
  | "transform_slide"
  | "transform_vent"
  | "transform_barrel"
  | "transform_fin"
  | "magic_circle";

export interface TransformOffset {
  translation?: [number, number, number]; // Offset in voxels when transformed
  rotation?: [number, number, number];    // Rotation in degrees when transformed
  scale?: [number, number, number];       // Scale multipliers
}

/**
 * Export-accurate motion. Orbit is a Y rotation around `origin` (shared by a rig),
 * so Blockbench keyframes and the viewport describe the same loop.
 * Vanilla Java item JSON cannot play this — it keeps the rest pose.
 */
export interface ElementMotion {
  rig: MotionRig;
  /** Whole turns per loop. +1, -1, +2… Negative reverses direction. */
  orbitTurns: number;
  /** Vertical bob amplitude in voxels. */
  bob: number;
  /** 0..1 bob phase. */
  phase: number;
  pulse: boolean;
  /** Loop length in seconds. Shared by every cube in the model. */
  loopSeconds: number;
  /** Transformation delta when transformed / overdrive mode is active */
  transformDelta?: TransformOffset;
  /** Local spin around the element's own origin (drill, sprocket, page, wheel). */
  spin?: { axis: "x" | "y" | "z"; turns: number };
  /** Heartbeat-style scale pulse amplitude (0.05..0.3). */
  scalePulse?: number;
}

export type CrownStyle = "cage" | "halo" | "eclipse" | "comet" | "barrel";
export type CoreStyle = "octahedron" | "twin" | "eclipse" | "orb" | "cube";

export type StaffCrownStyle = CrownStyle;
export type StaffCoreStyle = CoreStyle;

export interface FloatingRigConfig {
  crownStyle: StaffCrownStyle;
  coreStyle: StaffCoreStyle;
  orbitLayers: number;
  satellites: number;
  haloRings: number;
  motes: number;
  loopSeconds: number;
  bob: number;
  pulse: boolean;
  previewFx: boolean;
}

export interface CuboidElement {
  id: string;
  name: string;
  group: "blade" | "guard" | "grip" | "pommel" | "detail" | "head" | "shaft" | "float";
  from: [number, number, number]; // Minecraft 3D coords (-16 to 32, standard block is 0..16)
  to: [number, number, number];
  origin: [number, number, number];
  rotation: {
    axis: "x" | "y" | "z";
    angle: number; // Blockbench free angle or Minecraft 22.5 increments (-45, -22.5, 0, 22.5, 45)
  };
  motion?: ElementMotion;
  faces: {
    north: FaceUV;
    south: FaceUV;
    east: FaceUV;
    west: FaceUV;
    up: FaceUV;
    down: FaceUV;
  };
  visible: boolean;
  shade: boolean;
  materialRole: "primary" | "edge" | "trim" | "handle" | "gem" | "core";
  uvBox: {
    x: number;
    y: number;
    w: number;
    h: number;
    d: number;
  };
}

export type ShadingStyleId =
  | "hand_painted"
  | "crisp_pixel"
  | "metallic_gradient"
  | "runic_glow"
  | "gradient_vertical"
  | "gradient_radial"
  | "gradient_diagonal"
  | "two_tone"
  | "blood_veins"
  | "cursed_noise"
  | "carbon_tech"
  | "holy_sheen";

export type EffectPresetId =
  | "none"
  | "mana"
  | "embers"
  | "blood_mist"
  | "cursed_smoke"
  | "sparks"
  | "holy_light"
  | "frost"
  | "electric";

export interface DisplayTransform {
  rotation: [number, number, number];
  translation: [number, number, number];
  scale: [number, number, number];
}

export interface ModelDisplaySettings {
  thirdperson_righthand: DisplayTransform;
  thirdperson_lefthand: DisplayTransform;
  firstperson_righthand: DisplayTransform;
  firstperson_lefthand: DisplayTransform;
  gui: DisplayTransform;
  ground: DisplayTransform;
  fixed: DisplayTransform;
}

export interface ArchetypeParams {
  bladeLength: number;      // 6 .. 22
  bladeWidth: number;       // 1.5 .. 6
  guardWidth: number;       // 3 .. 12
  guardStyle: "cruciform" | "winged" | "katana_tsuba" | "spiked" | "royal" | "minimal";
  pommelStyle: "gem" | "ring" | "skull_claw" | "counterweight" | "tassel";
  voxelDepth: number;       // 0.5 .. 3.0
  taperSteps: number;       // 2 .. 6
  fullerGroove: boolean;    // Blood groove / energy core channel
  edgeBevel: boolean;       // Sharp bright edge steps
  gemAccent: boolean;       // Center guard crystal/gem
  strictMinecraftRotation: boolean; // Snap angles to -45, -22.5, 0, 22.5, 45
  uvPadding: number;        // 0, 1, 2 px
  shadingStyle: ShadingStyleId;
  /** Viewport particle effect preset (also drives the exported datapack aura). */
  effectPreset?: EffectPresetId;
  /** Floating/orbiting rig metadata. Used by staff and related toy archetypes. */
  floatingRig?: FloatingRigConfig;
  /** Visual stage: base → upgrade → ascended / cosmic. Stored so presets can reload. */
  visualStyle?: "base" | "plus" | "awakened" | "ascendant" | "eclipse" | "divine" | "arcane" | "void";
  /** Mechanical & enhanced sword/staff romantic features */
  serration?: boolean;         // 鋸刃・セレーションブレード
  laserEdge?: boolean;         // レーザー/フォトン発光エッジ
  knuckleGuard?: boolean;      // 重装ナックルガード
  heatSinkVents?: boolean;     // 刀身排熱スリット・ヒートシンク
  mechPiston?: boolean;        // メカピストン・リボルバーシリンダー
  magicCircleRings?: boolean;  // 二重魔法陣・ルーンサークル
  elementalOrbs?: boolean;     // 四元素オーブ浮遊展開
  transformed?: boolean;       // トランスフォーム展開形態（射撃/加速/全開）
  transformAnimation?: boolean;// トランスフォーム連続変形ループ再生
}


export interface NewVoxelModelRow { name: string; slug: string; description: string; archetype: string; materialPreset: string; atlasResolution: number; paramsJson: ArchetypeParams; elementsJson: CuboidElement[]; displayJson: ModelDisplaySettings; textureDataUrl?: string; isPreset?: boolean; downloadsCount?: number }
