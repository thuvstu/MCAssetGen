import type { RarityDef, RarityTier, StaffConfig } from '../types';

/* ══════════ レアリティ階層 (Hypixel SkyBlock 流) ══════════ */
export const RARITIES: RarityDef[] = [
  {
    id: 'common', name: 'コモン', nameEn: 'COMMON', color: '#d4d4d8',
    glowBoost: 0, particleBoost: 0, ornateLevel: 0,
    desc: '素朴な量産品。装飾なし、鈍い陰影。',
    patch: { outerGlow: 0.04, particles: 2, halo: 'none', wings: 'none', orbiterStyle: 'none', motifIntensity: 0, finish: 'matte', collarStyle: 'ring', tipStyle: 'none', shaftDetail: 0.15, contrast: 0.95, gemGlow: 0.15, gemCount: 0, adornmentStyle: 'none', adornmentDensity: 0.08 },
  },
  {
    id: 'uncommon', name: 'アンコモン', nameEn: 'UNCOMMON', color: '#4ade80',
    glowBoost: 0.12, particleBoost: 3, ornateLevel: 1,
    desc: 'わずかな魔力の兆し。控えめな輝き。',
    patch: { outerGlow: 0.1, particles: 5, halo: 'none', wings: 'none', orbiterStyle: 'none', motifIntensity: 0.2, finish: 'matte', collarStyle: 'ring', tipStyle: 'gem', shaftDetail: 0.3, contrast: 1, gemGlow: 0.35, gemCount: 1, gemMount: 'bezel', adornmentStyle: 'gold-pave', adornmentDensity: 0.2 },
  },
  {
    id: 'rare', name: 'レア', nameEn: 'RARE', color: '#3b82f6',
    glowBoost: 0.25, particleBoost: 6, ornateLevel: 2,
    desc: '安定した魔力循環。金具と粒子が現れる。',
    patch: { outerGlow: 0.18, particles: 9, halo: 'none', orbiterStyle: 'none', motifIntensity: 0.4, finish: 'glossy', collarStyle: 'guard', tipStyle: 'gem-cluster', shaftDetail: 0.45, contrast: 1.05, gemGlow: 0.55, gemCount: 2, gemMount: 'claw', adornmentStyle: 'filigree', adornmentDensity: 0.35 },
  },
  {
    id: 'epic', name: 'エピック', nameEn: 'EPIC', color: '#a855f7',
    glowBoost: 0.4, particleBoost: 10, ornateLevel: 3,
    desc: '強大な魔力。光輪と装飾金具が宿る。',
    patch: { outerGlow: 0.28, particles: 12, halo: 'ring', orbiterStyle: 'gem-set', orbiterCount: 3, motifIntensity: 0.6, finish: 'enchanted', collarStyle: 'filigree', tipStyle: 'reliquary', shaftDetail: 0.6, contrast: 1.1, gemGlow: 0.7, prongs: 2, gemCount: 4, adornmentStyle: 'star-map', adornmentDensity: 0.52 },
  },
  {
    id: 'legendary', name: 'レジェンダリー', nameEn: 'LEGENDARY', color: '#fbbf24',
    glowBoost: 0.55, particleBoost: 14, ornateLevel: 4,
    desc: '伝説の遺物。浮遊物と二重光輪を従える。',
    patch: { outerGlow: 0.38, particles: 15, halo: 'double', orbiterStyle: 'prism-ring', orbiterCount: 4, motifIntensity: 0.78, finish: 'metallic', collarStyle: 'crown', tipStyle: 'celestial-cage', shaftDetail: 0.75, contrast: 1.16, gemGlow: 0.85, prongs: 3, dangleStyle: 'chain-charm', gemCount: 5, adornmentStyle: 'filigree', adornmentDensity: 0.68 },
  },
  {
    id: 'mythic', name: 'ミシック', nameEn: 'MYTHIC', color: '#f472b6',
    glowBoost: 0.7, particleBoost: 18, ornateLevel: 5,
    desc: '神話級。翼が生え、虹色の粒子が渦巻く。',
    patch: { outerGlow: 0.5, particles: 19, halo: 'triple', wings: 'seraph', orbiterStyle: 'twin-gem', orbiterCount: 5, motifIntensity: 0.9, finish: 'holographic', collarStyle: 'wing-guard', tipStyle: 'lotus-crown', shaftDetail: 0.88, contrast: 1.22, gemGlow: 0.95, prongs: 4, dangleStyle: 'crystal-drop', gemCount: 7, adornmentStyle: 'geodesic', adornmentDensity: 0.84 },
  },
  {
    id: 'divine', name: 'ディヴァイン', nameEn: 'DIVINE', color: '#67e8f9',
    glowBoost: 0.85, particleBoost: 24, ornateLevel: 6,
    desc: '神域。あらゆる装飾が最大限に開花する。',
    patch: { outerGlow: 0.62, particles: 24, halo: 'shattered', wings: 'seraph', orbiterStyle: 'constellation', orbiterCount: 6, motifIntensity: 1, finish: 'holographic', collarStyle: 'orb-cage', tipStyle: 'prism-vortex', shaftDetail: 1, contrast: 1.28, gemGlow: 1, prongs: 4, dangleStyle: 'crystal-drop', horns: false, gemCount: 8, adornmentStyle: 'geodesic', adornmentDensity: 1 },
  },
];

export const getRarity = (id: RarityTier): RarityDef => RARITIES.find((r) => r.id === id) || RARITIES[0];
export const applyRarity = (id: RarityTier): Partial<StaffConfig> => ({ rarity: id, ...getRarity(id).patch });
