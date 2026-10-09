import type { FinialPreset } from '../types';

/* A hand-curated jeweller's tray: complete tip + mount + satellite-gem recipes. */
export const FINIAL_PRESETS: FinialPreset[] = [
  {
    id: 'astral-diadem', name: '星冠のダイアデム', nameEn: 'Astral Diadem', icon: 'crown', accent: '#93c5fd',
    desc: '八つの星屑を抱く銀の天球冠。',
    patch: { tipStyle: 'celestial-cage', tipScale: 0.82, gemCut: 'star-cut', gemMount: 'cage', gemCount: 6, gemScale: 0.17, adornmentStyle: 'star-map', adornmentDensity: 0.76, halo: 'triple' },
  },
  {
    id: 'lotus-regalia', name: '蓮華の王冠', nameEn: 'Lotus Regalia', icon: 'flower', accent: '#f0abfc',
    desc: '幾重もの花弁と真珠の中心核。',
    patch: { tipStyle: 'lotus-crown', tipScale: 0.9, gemCut: 'cabochon', gemMount: 'petal', gemCount: 8, gemScale: 0.13, adornmentStyle: 'petal-mantle', adornmentDensity: 0.82, motif2: 'petals', motif2Intensity: 0.55 },
  },
  {
    id: 'reliquary-sun', name: '太陽の聖遺物箱', nameEn: 'Solar Reliquary', icon: 'sun', accent: '#fbbf24',
    desc: '太陽金の箱枠に封じたエメラルド。',
    patch: { tipStyle: 'reliquary', tipScale: 0.95, gemCut: 'emerald', gemMount: 'bezel', gemCount: 4, gemScale: 0.16, adornmentStyle: 'gold-pave', adornmentDensity: 0.88, motif2: 'rays', motif2Intensity: 0.4 },
  },
  {
    id: 'dragon-prince', name: '竜王の牙', nameEn: 'Dragon Sovereign', icon: 'dragon', accent: '#fb7185',
    desc: '竜牙の穂先をルビーの爪で抱く。',
    patch: { tipStyle: 'dragon-fang', tipScale: 0.96, gemCut: 'marquise', gemMount: 'claw', gemCount: 3, gemScale: 0.2, adornmentStyle: 'thorn-vine', adornmentDensity: 0.72, wearStyle: 'chipped', wearAmount: 0.2 },
  },
  {
    id: 'eclipse-crown', name: '蝕の虚冠', nameEn: 'Eclipse Void Crown', icon: 'moon', accent: '#c4b5fd',
    desc: '暗黒の環に紫晶が浮遊する虚空の冠。',
    patch: { tipStyle: 'void-crown', tipScale: 0.85, gemCut: 'rose-cut', gemMount: 'floating', gemCount: 5, gemScale: 0.14, halo: 'shattered', adornmentStyle: 'geodesic', adornmentDensity: 0.7, finish: 'holographic' },
  },
  {
    id: 'prism-cathedral', name: '虹晶の大聖堂', nameEn: 'Prism Cathedral', icon: 'prism', accent: '#67e8f9',
    desc: '螺旋する虹晶と六面体の光檻。',
    patch: { tipStyle: 'prism-vortex', tipScale: 0.9, gemCut: 'prism', gemMount: 'cage', gemCount: 6, gemScale: 0.16, orbiterStyle: 'prism-ring', orbiterCount: 5, adornmentStyle: 'geodesic', adornmentDensity: 0.88 },
  },
  {
    id: 'moon-pearl', name: '月真珠のサークレット', nameEn: 'Moon Pearl Circlet', icon: 'orbit', accent: '#e9d5ff',
    desc: '三つの月長石を据えた銀の輪冠。',
    patch: { tipStyle: 'moon-circlet', tipScale: 0.82, gemCut: 'cabochon', gemMount: 'halo', gemCount: 3, gemScale: 0.22, halo: 'eclipse', adornmentStyle: 'star-map', adornmentDensity: 0.54 },
  },
  {
    id: 'phoenix-crown', name: '不死鳥の翼冠', nameEn: 'Phoenix Plume', icon: 'feather', accent: '#fb923c',
    desc: '熾火の羽根が扇状に舞い上がる。',
    patch: { tipStyle: 'phoenix-plume', tipScale: 0.95, gemCut: 'brilliant', gemMount: 'petal', gemCount: 5, gemScale: 0.14, particleStyle: 'embers', motif2: 'feathers', motif2Intensity: 0.62, halo: 'sunburst' },
  },
  {
    id: 'verdant-heart', name: '翠玉の生命核', nameEn: 'Verdant Heart', icon: 'heart', accent: '#4ade80',
    desc: '生きた蔦が心臓の宝石を抱きしめる。',
    patch: { tipStyle: 'living-bloom', tipScale: 0.88, gemCut: 'opal', gemMount: 'petal', gemCount: 7, gemScale: 0.15, adornmentStyle: 'thorn-vine', adornmentDensity: 0.85, dangleStyle: 'crystal-drop' },
  },
  {
    id: 'three-kings', name: '三王の秘宝', nameEn: 'Three Kings', icon: 'gem', accent: '#facc15',
    desc: '三叉の黄金台座と、三色の王石。',
    patch: { tipStyle: 'triple-prong', tipScale: 0.9, gemCut: 'emerald', gemMount: 'claw', gemCount: 3, gemScale: 0.23, adornmentStyle: 'gold-pave', adornmentDensity: 0.92, collarStyle: 'crown' },
  },
  {
    id: 'oracle-eye', name: '千里眼の護符', nameEn: 'Oracle Eye', icon: 'eye', accent: '#a78bfa',
    desc: '脈打つ宝眼を星座の鎖で吊るす。',
    patch: { tipStyle: 'eye-tip', tipScale: 0.8, gemCut: 'cabochon', gemMount: 'floating', gemCount: 4, gemScale: 0.13, adornmentStyle: 'star-map', adornmentDensity: 0.85, motif2: 'rune', motif2Intensity: 0.45 },
  },
  {
    id: 'royal-sun', name: '戴冠する太陽', nameEn: 'Crowned Sun', icon: 'sun', accent: '#fde68a',
    desc: '光線の花冠を戴く輝石の太陽盤。',
    patch: { tipStyle: 'sun-disc', tipScale: 0.9, gemCut: 'star-cut', gemMount: 'bezel', gemCount: 8, gemScale: 0.12, halo: 'sunburst', adornmentStyle: 'filigree', adornmentDensity: 1 },
  },
  {
    id: 'miniature-garden', name: '小さな魔法庭園', nameEn: 'Miniature Garden', icon: 'leaf', accent: '#86efac',
    desc: '芽吹く花と宝石の蕾が環になって咲く。',
    patch: { tipStyle: 'living-bloom', tipScale: 0.74, gemCut: 'rose-cut', gemMount: 'petal', gemCount: 8, gemScale: 0.13, orbiterStyle: 'petal-orbit', orbiterCount: 5, adornmentStyle: 'petal-mantle', adornmentDensity: 0.76 },
  },
];