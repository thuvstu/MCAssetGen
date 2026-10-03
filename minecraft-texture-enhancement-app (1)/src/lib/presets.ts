import { Layer, newLayer, Params } from './effects';

export interface Preset { id: string; name: string; icon: string; desc: string; layers: [string, Params?][] }

export const PRESETS: Preset[] = [
  { id: 'luminous', name: '鉱石の輝き', icon: 'gem', desc: '鉱石の色と立体感を引き出す', layers: [['adjust', { contrast: 12, saturation: 15 }], ['autoshade', { strength: 25, ao: 15 }], ['glow', { mode: 'bloom', color: '#a5f9e6', radius: 2, intensity: 35 }]] },
  { id: 'astral', name: 'アストラル', icon: 'orbit', desc: '星雲と神秘的な魔法陣', layers: [['nebula', { amount: 70 }], ['magicCircle', { color: '#afe8ff', amount: 80, animate: true }]] },
  { id: 'pearlglass', name: 'パールガラス', icon: 'diamond', desc: '淡い虹色とガラスの反射', layers: [['pearl', { amount: 60 }], ['glassSurface', { amount: 65 }]] },
  { id: 'artisan', name: 'クラフトウッド', icon: 'tree', desc: '繊細な木目と陰影', layers: [['woodgrain', { amount: 45 }], ['bevel', { strength: 22, width: 1 }], ['noise', { amount: 5 }]] },
  { id: 'enchant', name: 'エンチャント武器', icon: '🔮', desc: '紫の光彩と輝き', layers: [['autoshade', { strength: 40 }], ['glow', { color: '#9a50ff', radius: 2, intensity: 55, pulse: true }], ['enchant', {}]] },
  { id: 'gold', name: '黄金化', icon: '👑', desc: '純金の輝き', layers: [['gradmap', { c1: '#3a2000', c2: '#d9a000', c3: '#fff6b0' }], ['metal', { color: '#ffd24a', amount: 55, animate: true }], ['sparkle', { count: 4, color: '#fffbe0' }]] },
  { id: 'diamond', name: 'ダイヤ化', icon: '💎', desc: '透き通る宝石', layers: [['gradmap', { c1: '#062a33', c2: '#2ec4c0', c3: '#eafffd' }], ['sharpen', { amount: 50 }], ['sparkle', { count: 6, style: 'star' }], ['shimmer', { intensity: 55 }]] },
  { id: 'netherite', name: 'ネザライト化', icon: '⚫', desc: '重厚な黒金属', layers: [['gradmap', { c1: '#120e10', c2: '#443a3e', c3: '#9a8c8a' }], ['metal', { color: '#6e5e62', amount: 45, bands: 1 }], ['outline', { mode: 'auto' }]] },
  { id: 'ruins', name: '苔むした遺跡', icon: '🏛️', desc: '風化・苔・ひび', layers: [['adjust', { saturation: -25, brightness: -8 }], ['weather', { type: 'moss', coverage: 45, bias: 'top' }], ['cracks', { count: 3, length: 9 }], ['vignette', { strength: 30 }]] },
  { id: 'frozen', name: '氷結', icon: '🧊', desc: '凍りついた質感', layers: [['frost', { amount: 70, crystals: 14 }], ['sparkle', { count: 4, style: 'cross', color: '#e8fbff' }]] },
  { id: 'magma', name: 'マグマ化', icon: '🌋', desc: '溶岩のひびと火の粉', layers: [['gradmap', { c1: '#1a0604', c2: '#4a1a10', c3: '#8a3a20' }], ['cracks', { count: 6, length: 10, glow: true, depth: 100 }], ['glow', { mode: 'bloom', color: '#ff7020', radius: 2, intensity: 60 }], ['pulse', { color: '#ff9030', threshold: 120 }], ['embers', { count: 6 }]] },
  { id: 'hd', name: 'HDリマスター', icon: '🖥️', desc: '×4高解像度+陰影', layers: [['upscale', { factor: '4' }], ['autoshade', { strength: 35, ao: 30 }], ['noise', { amount: 6 }], ['sharpen', { amount: 30 }]] },
  { id: 'gb', name: 'レトロGB', icon: '🎮', desc: 'ゲームボーイ4色', layers: [['palette', { palette: 'gameboy', dither: true }]] },
  { id: 'rusty', name: '錆びた鉄', icon: '🔩', desc: '腐食した金属', layers: [['metal', { color: '#b8b8c0', amount: 50 }], ['weather', { type: 'rust', coverage: 45, scale: 4 }], ['cracks', { count: 2, length: 6, depth: 50 }]] },
  { id: 'snowy', name: '雪化粧', icon: '☃️', desc: '上から雪が積もる', layers: [['filter', { mode: 'cool', amount: 40 }], ['weather', { type: 'snow', coverage: 35, scale: 4 }], ['embers', { type: 'snow', count: 6 }]] },
  { id: 'holo', name: '虹色ホロ', icon: '🌈', desc: 'ホログラムカード風', layers: [['rainbow', { amount: 55 }], ['shimmer', { intensity: 60, width: 4 }], ['sparkle', { count: 5 }]] },
  { id: 'royal', name: '王家の装飾', icon: '🏰', desc: '金枠と紋章', layers: [['bevel', { strength: 35 }], ['frame', { style: 'ornate', color: '#e0b040' }], ['emblem', { shape: 'crown', color: '#ffd84a' }]] },
  { id: 'neon', name: 'ネオン', icon: '🟣', desc: 'サイバーな発光', layers: [['adjust', { brightness: -35, saturation: 40 }], ['outline', { color: '#ff3cf0', mode: 'outer' }], ['glow', { color: '#30e0ff', radius: 3, intensity: 70, pulse: true }], ['huecycle', { amount: 40, spread: 50 }]] },
  { id: 'cursed', name: '呪われた', icon: '💀', desc: '暗黒のルーンと脈動', layers: [['tint', { color: '#3a1050', amount: 55 }], ['runes', { color: '#b040ff', count: 4, animate: true }], ['vignette', { strength: 60, color: '#10001a', shape: 'round' }], ['embers', { type: 'soul', count: 5 }]] },
  { id: 'crystal', name: '結晶侵食', icon: '🔷', desc: 'アメジスト結晶', layers: [['weather', { type: 'crystal', coverage: 35, bias: 'edge' }], ['ore', { color: '#b070ff', count: 3, size: 5 }], ['sparkle', { count: 6, color: '#f0d0ff' }]] },
  { id: 'ocean', name: '深海', icon: '🐚', desc: '水中の揺らぎと泡', layers: [['tint', { color: '#1a6aa0', amount: 45 }], ['wave', { amp: 1, wavelength: 8 }], ['embers', { type: 'bubble', count: 5 }]] },
  { id: 'toon', name: 'トゥーン', icon: '🖍️', desc: 'アニメ調ポスタライズ', layers: [['adjust', { saturation: 40, contrast: 15 }], ['posterize', { levels: 4 }], ['outline', { mode: 'outer', color: '#141018' }]] },
];

export const presetLayers = (p: Preset): Layer[] => p.layers.map(([t, params]) => newLayer(t, params));
