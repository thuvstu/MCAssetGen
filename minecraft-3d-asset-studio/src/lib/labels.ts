import { AnimationType, MagicCircleStyle, ParticleType } from "@/types/model";

export const PARTICLE_LABELS: Record<ParticleType, string> = {
  flame: "炎の火の粉",
  ice: "氷の結晶",
  void: "虚空の渦",
  holy: "聖なる光塵",
  lightning: "雷スパーク",
  cherry: "桜吹雪",
  sparkle: "魔力のきらめき",
  souls: "怨霊の魂",
  blood: "血の滴り",
  gears: "漂う歯車",
  sparks: "金属火花",
  runes: "浮遊する符",
  smoke: "黒煙",
  stars: "星屑",
  bubbles: "泡",
  glitch: "グリッチ",
  feathers: "舞い散る羽根",
  ash: "灰燼",
  none: "なし",
};

export const CIRCLE_LABELS: Record<MagicCircleStyle, string> = {
  runic_ring: "古代ルーン環",
  pentagram: "五芒星の封印",
  arcane_clock: "時計仕掛けの紋",
  celestial_sun: "天球の日輪",
  void_spiral: "虚空の螺旋",
  gear_ring: "歯車環",
  blood_rune: "血の呪印",
  hexagram: "六芒星",
  elemental: "四大元素陣",
  sigil_eye: "魔眼の印",
  hex_tech: "ヘックス回路",
  grimoire_seal: "魔導書の封印",
};

export const ANIMATION_LABELS: Record<AnimationType, string> = {
  none: "静止",
  idle_float: "浮遊",
  orbital_spin: "回転展示",
  pulse_glow: "脈動",
  blade_swing: "素振り",
  magic_cast: "詠唱ループ",
  wing_flutter: "羽ばたき",
  hover_spin: "浮遊回転",
  heartbeat: "鼓動",
  pendulum: "振り子",
  engine_idle: "エンジン振動",
  levitate_tilt: "傾き浮遊",
};
