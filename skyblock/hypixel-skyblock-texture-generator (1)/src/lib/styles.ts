import { hexToRgb, mixRgb, rgbToHex, type RGB } from "@/lib/colors";

/** Rendering archetype — HOW a pack draws (outline, bevel, bands, ornament). */
export type Signature = {
  id: string;
  name: string;
  nameJa: string;
  tagline: string;
  essence: string;
  inspiredNote: string;
  tags: string[];
  outline: number; // 0..1 how dark/hard the silhouette edge is
  outlineSoft: number; // 0..1 blend outline toward body hue
  doubleEdge: number; // 0..1 second inner shadow ring
  bevel: number; // 0..1 strength of normal-based lighting
  depth: number; // 0..1 interior form shadow
  pseudo3d: number; // 0..1 top-light / bottom-shadow split
  bands: number; // shade quantisation steps (3 = flat, 6 = smooth)
  dither: number; // 0..1 ordered dithering between bands
  spec: number; // 0..1 specular highlights on metal/gem
  ornament: number; // 0..1 procedural filigree / grain / facets
  sat: number; // saturation multiplier
  contrast: number; // 0..1 extra ramp contrast
  grain: number; // 0..1 per pixel noise
  rim: number; // 0..1 outer rarity glow
  clean: number; // 0..1 suppress chaos noise (readability)
  edgeDark: number; // 0..1 how much of the silhouette becomes hard outline
  innerRim: number; // 0..1 bright rim just inside the outline ("clean" look)
  axialGrad: number; // 0..1 tip-to-hilt brightness ramp along the shape
};

/** Colour lineage — WHAT a pack is made of (biome / material theme). */
export type Palette = {
  id: string;
  name: string;
  nameJa: string;
  tagline: string;
  essence: string;
  tags: string[];
  metal: string;
  gold: string;
  gem: string;
  wood: string;
  leather: string;
  cloth: string;
  energy: string;
  accent: string;
  bone: string;
  outline: string;
};

export const SIGNATURES: Signature[] = [
  {
    id: "reborn_clean",
    name: "Reborn Clarity",
    nameJa: "リボーン・クラリティ",
    tagline: "clean で精密。アイコンとして即読める",
    essence:
      "コミュニティ最大手の“見せる pack”の画法。輪郭は硬く、面は少ないバンドで明快に、宝石はツヤ重視。メニューに並んだ瞬間に何のアイテムか分かる情報設計。",
    inspiredNote: "FurfSky Reborn 系の clean & detailed",
    tags: ["clean", "detailed", "readable"],
    outline: 0.95,
    outlineSoft: 0.25,
    doubleEdge: 0.35,
    bevel: 0.92,
    depth: 0.4,
    pseudo3d: 0.3,
    bands: 4,
    dither: 0.3,
    spec: 0.75,
    ornament: 0.55,
    sat: 1.18,
    contrast: 0.62,
    grain: 0.12,
    rim: 0.5,
    clean: 0.75,
    edgeDark: 0.85,
    innerRim: 0.9,
    axialGrad: 0.38,
  },
  {
    id: "imperial_ornate",
    name: "Imperial Regalia",
    nameJa: "インペリアル・レガリア",
    tagline: "重厚。金細工と深い陰影の王室装飾",
    essence:
      "装飾量で押す画法。暗い地金に金のフィリグリー、厚い陰影、宝石の多面カット。武器というより宝器。",
    inspiredNote: "ImperiaL's 系の ornate / 3D ペット",
    tags: ["ornate", "dark", "regalia"],
    outline: 0.85,
    outlineSoft: 0.45,
    doubleEdge: 0.6,
    bevel: 0.78,
    depth: 0.85,
    pseudo3d: 0.52,
    bands: 5,
    dither: 0.35,
    spec: 0.88,
    ornament: 1.0,
    sat: 0.95,
    contrast: 0.85,
    grain: 0.26,
    rim: 0.35,
    clean: 0.35,
    edgeDark: 0.7,
    innerRim: 0.32,
    axialGrad: 0.2,
  },
  {
    id: "vanilla_plus",
    name: "Vanilla Plus",
    nameJa: "バニラプラス",
    tagline: "バニラの骨格。節度のある作り込み",
    essence:
      "元のアイテム形状と色温度を尊重し、ハイライトと陰影だけを足す画法。inventory が荒れない。1000 超のアイテムを破綻なく並べるための節度。",
    inspiredNote: "Vanilla+ 系の classic & simple",
    tags: ["vanilla", "subtle", "clean"],
    outline: 0.7,
    outlineSoft: 0.5,
    doubleEdge: 0.2,
    bevel: 0.55,
    depth: 0.34,
    pseudo3d: 0.24,
    bands: 3,
    dither: 0.2,
    spec: 0.3,
    ornament: 0.2,
    sat: 0.9,
    contrast: 0.34,
    grain: 0.2,
    rim: 0.12,
    clean: 0.85,
    edgeDark: 0.58,
    innerRim: 0.22,
    axialGrad: 0.14,
  },
  {
    id: "skypixel_crisp",
    name: "SkyPixel Crisp",
    nameJa: "スカイピクセル・クリスプ",
    tagline: "2 トーンの輪郭。ドット絵としての潔さ",
    essence:
      "面を大きく2〜3階調に割り切る画法。ディザでつなぐので遠目にも近くにも強い。",
    inspiredNote: "SkyPixel / crisp pixel art 系",
    tags: ["crisp", "flat", "bold"],
    outline: 1,
    outlineSoft: 0.1,
    doubleEdge: 0.15,
    bevel: 0.82,
    depth: 0.2,
    pseudo3d: 0.14,
    bands: 3,
    dither: 0.88,
    spec: 0.5,
    ornament: 0.3,
    sat: 1.35,
    contrast: 0.95,
    grain: 0.02,
    rim: 0.4,
    clean: 0.9,
    edgeDark: 1.0,
    innerRim: 0.08,
    axialGrad: 0.05,
  },
  {
    id: "faithful_smooth",
    name: "Faithful Smooth",
    nameJa: "フェイスフル・スムース",
    tagline: "多階調のなめらかランプ。32x の品格",
    essence:
      "バンドを増やし、ディザとグレインで滑らかにつなぐ画法。拡大しても破綻しない。",
    inspiredNote: "Faithful 32x 系の smooth ramp",
    tags: ["smooth", "hires", "soft"],
    outline: 0.6,
    outlineSoft: 0.6,
    doubleEdge: 0.25,
    bevel: 0.7,
    depth: 0.52,
    pseudo3d: 0.36,
    bands: 6,
    dither: 0.62,
    spec: 0.45,
    ornament: 0.48,
    sat: 1.02,
    contrast: 0.3,
    grain: 0.32,
    rim: 0.3,
    clean: 0.7,
    edgeDark: 0.48,
    innerRim: 0.42,
    axialGrad: 0.3,
  },
  {
    id: "depth_3d",
    name: "Depth 3D",
    nameJa: "デプス3D",
    tagline: "擬似3D。上面ライトと深い底影",
    essence:
      "上からの光と下面の深い影で立体を作る画法。輪郭を二重にして厚みを出す。",
    inspiredNote: "3D SkyBlock 系の pseudo-3d",
    tags: ["3d", "volume", "shadow"],
    outline: 0.9,
    outlineSoft: 0.3,
    doubleEdge: 0.9,
    bevel: 1.0,
    depth: 0.95,
    pseudo3d: 1.0,
    bands: 4,
    dither: 0.24,
    spec: 0.62,
    ornament: 0.34,
    sat: 1.05,
    contrast: 0.92,
    grain: 0.15,
    rim: 0.25,
    clean: 0.6,
    edgeDark: 0.92,
    innerRim: 0.18,
    axialGrad: 0.1,
  },
  {
    id: "gritty_pvp",
    name: "Gritty PvP",
    nameJa: "グリッティPvP",
    tagline: "彩度を落として視認性だけを上げる",
    essence:
      "装飾を削ぎ落とし、シルエットと明度差だけで読ませる画法。長時間のグラインドでも疲れない。",
    inspiredNote: "simple PvP / low-detail 系",
    tags: ["pvp", "desaturated", "minimal"],
    outline: 1.0,
    outlineSoft: 0.15,
    doubleEdge: 0.1,
    bevel: 0.46,
    depth: 0.42,
    pseudo3d: 0.2,
    bands: 3,
    dither: 0.14,
    spec: 0.18,
    ornament: 0.08,
    sat: 0.62,
    contrast: 0.72,
    grain: 0.08,
    rim: 0.08,
    clean: 0.95,
    edgeDark: 1.0,
    innerRim: 0.04,
    axialGrad: 0.0,
  },
  {
    id: "neon_bloom",
    name: "Neon Bloom",
    nameJa: "ネオンブルーム",
    tagline: "発光体。魔法が輪郭から溢れる",
    essence:
      "エミッシブ核とリムブルームで全体を発光させる画法。ダンジョンやエンド系の派手さ。",
    inspiredNote: "glowy / enchanted overlay 系",
    tags: ["glow", "emissive", "neon"],
    outline: 0.75,
    outlineSoft: 0.55,
    doubleEdge: 0.3,
    bevel: 0.72,
    depth: 0.3,
    pseudo3d: 0.2,
    bands: 5,
    dither: 0.52,
    spec: 0.82,
    ornament: 0.5,
    sat: 1.4,
    contrast: 0.56,
    grain: 0.08,
    rim: 1.0,
    clean: 0.65,
    edgeDark: 0.52,
    innerRim: 0.78,
    axialGrad: 0.48,
  },
  {
    id: "overhaul_intricate",
    name: "Overhaul Intricate",
    nameJa: "オーバーホール・インテリケート",
    tagline: "64pxの面積を使い切る。多層金具・細線・鮮烈な色",
    essence:
      "高解像度を縮小版ではなく別モデルとして扱う画法。刃・芯・フラー・金具・宝石を別面に分割し、1px刻印と多階調ランプを同居させる。32x専用で異なる武器モデルを作ったSkyBlock Overhaulの設計思想を64pxへ発展。",
    inspiredNote: "SkyBlock Overhaul 32x の intricate designs / unique models",
    tags: ["64-native", "intricate", "overhaul", "hires"],
    outline: 0.72,
    outlineSoft: 0.52,
    doubleEdge: 0.7,
    bevel: 0.88,
    depth: 0.82,
    pseudo3d: 0.62,
    bands: 8,
    dither: 0.5,
    spec: 0.86,
    ornament: 1.0,
    sat: 1.16,
    contrast: 0.66,
    grain: 0.2,
    rim: 0.5,
    clean: 0.62,
    edgeDark: 0.68,
    innerRim: 0.64,
    axialGrad: 0.4,
  },
  {
    id: "nameless_heroic",
    name: "Nameless Heroic",
    nameJa: "ネームレス・ヒロイック",
    tagline: "アイテムごとに別の英雄的シルエット",
    essence:
      "同じ刀身の色替えではなく、剣・弓の用途を輪郭そのものにする画法。太い主形状と細い内部記号を対比させ、インベントリでも個体差を即読できる。",
    inspiredNote: "Nameless Skyblock Pack の all-swords / distinct-bows 方針",
    tags: ["64-native", "heroic", "distinct", "weapon"],
    outline: 0.94,
    outlineSoft: 0.28,
    doubleEdge: 0.42,
    bevel: 0.86,
    depth: 0.56,
    pseudo3d: 0.44,
    bands: 6,
    dither: 0.34,
    spec: 0.7,
    ornament: 0.72,
    sat: 1.24,
    contrast: 0.82,
    grain: 0.1,
    rim: 0.52,
    clean: 0.8,
    edgeDark: 0.9,
    innerRim: 0.72,
    axialGrad: 0.34,
  },
  {
    id: "clockwork_steam",
    name: "Clockwork Steam",
    nameJa: "クロックワーク・スチーム",
    tagline: "真鍮歯車、蒸気排気弁、鋼鉄リベットの幾何学工学",
    essence:
      "ドワーフ工房とスチームパンクの機構美。硬質な真鍮エッジ、等間隔のリベット打ち、蒸気圧スリットによる機械的陰影。",
    inspiredNote: "Steampunk / Clockwork / Factory 系メカニカルパック",
    tags: ["mechanical", "steampunk", "brass", "gears"],
    outline: 0.9,
    outlineSoft: 0.32,
    doubleEdge: 0.65,
    bevel: 0.95,
    depth: 0.78,
    pseudo3d: 0.58,
    bands: 5,
    dither: 0.42,
    spec: 0.88,
    ornament: 0.95,
    sat: 1.15,
    contrast: 0.82,
    grain: 0.16,
    rim: 0.45,
    clean: 0.72,
    edgeDark: 0.88,
    innerRim: 0.68,
    axialGrad: 0.36,
  },
  {
    id: "cyber_matrix",
    name: "Cyber Matrix",
    nameJa: "サイバー・マトリクス",
    tagline: "発光サーキット、電磁レール、超硬質チタン",
    essence:
      "ハイテク・サイバーパンクの未来兵器。黒曜チタンの硬質ボディに鮮烈なネオン回路スリットが走り、エミッシブな高エネルギーを放出する。",
    inspiredNote: "Cyberpunk / High-Tech / Sci-Fi 系テクスチャパック",
    tags: ["cyber", "neon", "matrix", "scifi"],
    outline: 0.96,
    outlineSoft: 0.2,
    doubleEdge: 0.35,
    bevel: 0.92,
    depth: 0.45,
    pseudo3d: 0.32,
    bands: 4,
    dither: 0.22,
    spec: 0.95,
    ornament: 0.82,
    sat: 1.45,
    contrast: 0.9,
    grain: 0.04,
    rim: 0.95,
    clean: 0.88,
    edgeDark: 0.95,
    innerRim: 0.85,
    axialGrad: 0.42,
  },
  {
    id: "sig_mechworks",
    name: "Machineworks",
    nameJa: "マシンワークス",
    tagline: "鋲打ち・油膜・硬質な金属。機械が動く音まで聞こえる",
    essence:
      "ドリルや歯車といった機械系のための画法。輪郭を極端に硬くし、鏡面ハイライトと深い接合影を同居させる。装飾は有機的な曲線ではなく、鋲・リブ・冷却フィンという工業記号で構成する。",
    inspiredNote: "Dwarven Mines / Forge の機械工芸",
    tags: ["mechanical", "industrial", "hard", "metal"],
    outline: 0.98,
    outlineSoft: 0.16,
    doubleEdge: 0.55,
    bevel: 0.98,
    depth: 0.8,
    pseudo3d: 0.72,
    bands: 5,
    dither: 0.22,
    spec: 0.95,
    ornament: 0.72,
    sat: 0.82,
    contrast: 0.88,
    grain: 0.12,
    rim: 0.3,
    clean: 0.55,
    edgeDark: 0.98,
    innerRim: 0.32,
    axialGrad: 0.2,
  },
];

export const PALETTES: Palette[] = [
  {
    id: "reborn_flare",
    name: "Reborn Flare",
    nameJa: "リボーンフレア",
    tagline: "高彩度の祭典色",
    essence: "オレンジの刃、シアンのアクセント、桃の宝石。明るい黄金の金具。",
    tags: ["saturated", "heroic"],
    metal: "#b9c4d4",
    gold: "#f0c33c",
    gem: "#ff3d7f",
    wood: "#8a4a22",
    leather: "#6b3a22",
    cloth: "#c8452f",
    energy: "#3ec6ff",
    accent: "#7cff6b",
    bone: "#e8d9b8",
    outline: "#171019",
  },
  {
    id: "catacomb_ink",
    name: "Catacomb Ink",
    nameJa: "カタコンブインク",
    tagline: "地下墓地の骨と苔",
    essence: "錆びた鉄、腐食緑、骨白。光は届かない。",
    tags: ["dungeon", "undead"],
    metal: "#6b7280",
    gold: "#b08d2a",
    gem: "#22c55e",
    wood: "#44403c",
    leather: "#57534e",
    cloth: "#3f4a3a",
    energy: "#84cc16",
    accent: "#a3e635",
    bone: "#efe6c9",
    outline: "#0d120d",
  },
  {
    id: "voidthorn",
    name: "Voidthorn",
    nameJa: "ヴォイドソーン",
    tagline: "虚空の紫と黒い棘",
    essence: "黒紫の silhouette にシアンの核。エンドの静けさ。",
    tags: ["end", "void"],
    metal: "#4b4460",
    gold: "#8b7bb8",
    gem: "#22d3ee",
    wood: "#2a1f36",
    leather: "#2a2030",
    cloth: "#3b2a5a",
    energy: "#a855f7",
    accent: "#e879f9",
    bone: "#b7a8c9",
    outline: "#05040a",
  },
  {
    id: "gemnest",
    name: "Gemnest",
    nameJa: "ジェムネスト",
    tagline: "虹色の結晶洞",
    essence: "石とガラスの体にプリズムの核。鉱脈の冷たい光。",
    tags: ["crystal", "mining"],
    metal: "#9aa7b4",
    gold: "#cfd8e3",
    gem: "#34d399",
    wood: "#4a5560",
    leather: "#3a4650",
    cloth: "#4b6b7a",
    energy: "#67e8f9",
    accent: "#f472b6",
    bone: "#dbe7ef",
    outline: "#101620",
  },
  {
    id: "crimson_wake",
    name: "Crimson Wake",
    nameJa: "クリムゾンウェイク",
    tagline: "溶岩と煤の真紅",
    essence: "赤黒のグラデに硫黄のハイライト。島の熱。",
    tags: ["nether", "fire"],
    metal: "#6b2a22",
    gold: "#fb923c",
    gem: "#facc15",
    wood: "#3a1610",
    leather: "#4a1c14",
    cloth: "#8a1c1c",
    energy: "#fb7185",
    accent: "#f97366",
    bone: "#e8b4a8",
    outline: "#120606",
  },
  {
    id: "glacite_veil",
    name: "Glacite Veil",
    nameJa: "グレイサイトヴェール",
    tagline: "氷晶と蒼銀",
    essence: "白銀のメタルに薄いシアンの核。輪郭は夜の湖。",
    tags: ["ice", "cold"],
    metal: "#94a3b8",
    gold: "#cbd5e1",
    gem: "#22d3ee",
    wood: "#64748b",
    leather: "#475569",
    cloth: "#7dd3fc",
    energy: "#a5f3fc",
    accent: "#38bdf8",
    bone: "#e2e8f0",
    outline: "#0b1520",
  },
  {
    id: "fairy_atelier",
    name: "Fairy Atelier",
    nameJa: "フェアリーアトリエ",
    tagline: "パステルと金箔",
    essence: "桜色、ミント、薄い金。優しいのに輪郭は残る。",
    tags: ["pastel", "fairy"],
    metal: "#e6d3e0",
    gold: "#f0d38a",
    gem: "#fbbf24",
    wood: "#e8b4b8",
    leather: "#f5c2c7",
    cloth: "#f9a8d4",
    energy: "#c4b5fd",
    accent: "#86efac",
    bone: "#fde68a",
    outline: "#3b2a36",
  },
  {
    id: "dragonwake",
    name: "Dragonwake",
    nameJa: "ドラゴンウェイク",
    tagline: "竜鱗と金紫の覇気",
    essence: "鱗の反復、金の爪、紫の息。ボスの余熱。",
    tags: ["dragon", "boss"],
    metal: "#7a6a8a",
    gold: "#d4af37",
    gem: "#f43f5e",
    wood: "#5b3418",
    leather: "#7c2d12",
    cloth: "#6b21a8",
    energy: "#c084fc",
    accent: "#f5c542",
    bone: "#fde68a",
    outline: "#140c14",
  },
  {
    id: "midas_gild",
    name: "Midas Gild",
    nameJa: "ミダスギルド",
    tagline: "全てを金に変える呪い",
    essence: "琥珀、古金、黒い亀裂。ハイライトは太陽。",
    tags: ["gold", "luxury"],
    metal: "#c9a227",
    gold: "#f5d76e",
    gem: "#ef4444",
    wood: "#8b5a2b",
    leather: "#a16207",
    cloth: "#b45309",
    energy: "#facc15",
    accent: "#fb923c",
    bone: "#fde68a",
    outline: "#2a1a08",
  },
  {
    id: "mithril_vein",
    name: "Mithril Vein",
    nameJa: "ミスリルヴェイン",
    tagline: "蒼銀の鉱脈",
    essence: "ティールの鉱石と冷たい鉄、粉っぽいハイライト。",
    tags: ["mithril", "dwarf"],
    metal: "#7c9aa5",
    gold: "#9fb3bd",
    gem: "#2dd4bf",
    wood: "#3f4a52",
    leather: "#334155",
    cloth: "#115e59",
    energy: "#5eead4",
    accent: "#38bdf8",
    bone: "#d1fae5",
    outline: "#0c1418",
  },
  {
    id: "wither_sovereign",
    name: "Wither Sovereign",
    nameJa: "ウィザーソヴリン",
    tagline: "王の黒と紫電",
    essence: "マットな黒金に紫の放電。ネザーの王。",
    tags: ["wither", "royal"],
    metal: "#3f3a4a",
    gold: "#8a6a18",
    gem: "#a855f7",
    wood: "#241c28",
    leather: "#2a2030",
    cloth: "#2a1848",
    energy: "#c084fc",
    accent: "#22d3ee",
    bone: "#cbbca0",
    outline: "#05040a",
  },
  {
    id: "harvest_sun",
    name: "Harvest Sun",
    nameJa: "ハーベストサン",
    tagline: "麦と土と日差し",
    essence: "藁色、土褐、熟れた赤。農場の温かさ。",
    tags: ["farming", "warm"],
    metal: "#a8a29e",
    gold: "#eab308",
    gem: "#f97316",
    wood: "#8b5a2b",
    leather: "#7c4a28",
    cloth: "#a3b565",
    energy: "#fde047",
    accent: "#84cc16",
    bone: "#f5e6c8",
    outline: "#1b140f",
  },
  {
    id: "brass_clockwork",
    name: "Brass Clockwork",
    nameJa: "クロックワーク・ブラス",
    tagline: "真鍮金と古鋼鉄、蒸気と計器アンバー",
    essence: "歯車仕掛けと蒸気機関。ポリッシュされた真鍮、重厚な鋳鉄、圧力計の琥珀色発光。",
    tags: ["mechanical", "steampunk", "brass", "gear"],
    metal: "#787a82",
    gold: "#d49a37",
    gem: "#f59e0b",
    wood: "#4a3525",
    leather: "#663e28",
    cloth: "#8a5832",
    energy: "#fbbf24",
    accent: "#38bdf8",
    bone: "#e2d6b5",
    outline: "#181410",
  },
  {
    id: "cyber_neon",
    name: "Cyber Neon",
    nameJa: "サイバーネオン",
    tagline: "黒曜チタンと高輝度ネオンシアン",
    essence: "電磁レールと回路基板。漆黒のチタンフレームに鋭利なネオンシアンとマゼンタの放電。",
    tags: ["cyber", "neon", "scifi", "plasma"],
    metal: "#333842",
    gold: "#00f0ff",
    gem: "#ff007f",
    wood: "#1a1c23",
    leather: "#252830",
    cloth: "#0f172a",
    energy: "#00f0ff",
    accent: "#39ff14",
    bone: "#94a3b8",
    outline: "#07090e",
  },
  {
    id: "dwarven_steam",
    name: "Dwarven Steamforge",
    nameJa: "ドワーフ・スチームフォージ",
    tagline: "ドワーフ強化鋼とルビー機関炉心",
    essence: "鉱山深層の重機関。耐熱重合金、赤熱する炉心熱気、リベットで補強された剛体。",
    tags: ["dwarf", "steam", "forge", "heavy"],
    metal: "#636978",
    gold: "#e5a93b",
    gem: "#ef4444",
    wood: "#382c22",
    leather: "#4d3222",
    cloth: "#78350f",
    energy: "#f97316",
    accent: "#fbbf24",
    bone: "#d1c7a5",
    outline: "#121114",
  },
  {
    id: "lin_mechworks",
    name: "Machineworks Lineage",
    nameJa: "マシンワークス系譜",
    tagline: "鋼・真鍮・グリス・ティールの動力",
    essence: "鉱山機械の温度。冷たい鋼に真鋼に真鍮の継ぎ手、グリスの暗部、動力を示すティールの発光。",
    tags: ["mechanical", "dwarven", "forge"],
    metal: "#8b939e",
    gold: "#d8a24a",
    gem: "#4fd6c8",
    wood: "#4a4038",
    leather: "#3a322c",
    cloth: "#5c6670",
    energy: "#37d6e6",
    accent: "#e0724a",
    bone: "#c8c2b4",
    outline: "#0a0d12",
  },
];

export const SIGNATURE_MAP: Record<string, Signature> = Object.fromEntries(
  SIGNATURES.map((s) => [s.id, s]),
);
export const PALETTE_MAP: Record<string, Palette> = Object.fromEntries(
  PALETTES.map((p) => [p.id, p]),
);

export function getSignature(id: string): Signature {
  return SIGNATURE_MAP[id] ?? SIGNATURES[0]!;
}

export function getPalette(id: string): Palette {
  return PALETTE_MAP[id] ?? PALETTES[0]!;
}

export type MixEntry = { id: string; weight: number };

function normalise(mix: MixEntry[]): { id: string; weight: number }[] {
  const cleaned = mix
    .map((m) => ({ id: m.id, weight: Math.max(0, Number(m.weight) || 0) }))
    .filter((m) => m.weight > 0);
  return cleaned;
}

export type SignatureMix = Omit<Signature, "id" | "name" | "nameJa" | "tags"> & {
  ids: string[];
};

export function mixSignatures(mix: MixEntry[]): SignatureMix {
  const entries = normalise(mix)
    .map((m) => ({ sig: getSignature(m.id), weight: m.weight }))
    .filter((e) => e.sig);
  const used = entries.length ? entries : [{ sig: SIGNATURES[0]!, weight: 1 }];
  const total = used.reduce((s, e) => s + e.weight, 0);
  const keys: (keyof Omit<Signature, "id" | "name" | "nameJa" | "tags">)[] = [
    "tagline",
    "essence",
    "inspiredNote",
    "outline",
    "outlineSoft",
    "doubleEdge",
    "bevel",
    "depth",
    "pseudo3d",
    "bands",
    "dither",
    "spec",
    "ornament",
    "sat",
    "contrast",
    "grain",
    "rim",
    "clean",
    "edgeDark",
    "innerRim",
    "axialGrad",
  ];
  const out = { ids: used.map((e) => e.sig.id) } as SignatureMix;
  for (const key of keys) {
    if (key === "tagline" || key === "essence" || key === "inspiredNote") {
      (out as Record<string, unknown>)[key] = used[0]!.sig[key];
      continue;
    }
    let acc = 0;
    for (const e of used) acc += (e.sig[key] as number) * (e.weight / total);
    (out as Record<string, unknown>)[key] = key === "bands" ? Math.max(3, Math.round(acc)) : acc;
  }
  return out;
}

export type PaletteMix = {
  ids: string[];
  metal: RGB;
  gold: RGB;
  gem: RGB;
  wood: RGB;
  leather: RGB;
  cloth: RGB;
  energy: RGB;
  accent: RGB;
  bone: RGB;
  outline: RGB;
  fur: RGB;
};

const PALETTE_KEYS = [
  "metal",
  "gold",
  "gem",
  "wood",
  "leather",
  "cloth",
  "energy",
  "accent",
  "bone",
  "outline",
] as const;

export function mixPalettes(mix: MixEntry[]): PaletteMix {
  const entries = normalise(mix)
    .map((m) => ({ pal: getPalette(m.id), weight: m.weight }))
    .filter((e) => e.pal);
  const used = entries.length ? entries : [{ pal: PALETTES[0]!, weight: 1 }];
  const total = used.reduce((s, e) => s + e.weight, 0);
  const out = { ids: used.map((e) => e.pal.id) } as PaletteMix;
  for (const key of PALETTE_KEYS) {
    let acc: RGB = [0, 0, 0];
    for (const e of used) {
      const rgb = hexToRgb(e.pal[key]);
      const w = e.weight / total;
      acc = [acc[0] + rgb[0] * w, acc[1] + rgb[1] * w, acc[2] + rgb[2] * w];
    }
    out[key] = acc;
  }
  out.fur = mixRgb(out.leather, out.accent, 0.45);
  return out;
}

export function paletteSwatches(pal: Palette): string[] {
  return [pal.metal, pal.gold, pal.gem, pal.energy, pal.accent, pal.outline];
}

export function paletteSwatchesFromMix(mix: MixEntry[]): string[] {
  const p = mixPalettes(mix);
  return [p.metal, p.gold, p.gem, p.energy, p.accent, p.outline].map((c) =>
    rgbToHex(c as RGB),
  );
}
