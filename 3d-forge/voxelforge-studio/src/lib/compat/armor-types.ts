export type StyleId =
  | "scale"
  | "plate"
  | "chain"
  | "leather"
  | "crystal"
  | "ember"
  | "frost"
  | "obsidian";

export type PartId = "helmet" | "chest" | "leggings" | "boots";
export type HelmetProfile = "drake" | "sentinel" | "crown";
export type VisorMode = "embers" | "open";

export type PartBrightness = Record<PartId, number>;

export interface ArmorParams {
  armorId: string;
  displayName: string;
  namespace: string;
  style: StyleId;
  helmetProfile: HelmetProfile;
  visorMode: VisorMode;
  hornLength: number;
  primary: string;
  secondary: string;
  accent: string;
  seed: number;
  detail: number;
  noise: number;
  edgeShade: boolean;
  brightness: PartBrightness;
  iconSize: 16 | 32 | 64;
  includeGeckolib: boolean;
  includeJava: boolean;
}

export interface StyleInfo {
  id: StyleId;
  label: string;
  desc: string;
}

export const STYLES: StyleInfo[] = [
  { id: "scale", label: "竜鱗", desc: "重なった鱗と金属の縁取り" },
  { id: "plate", label: "板金", desc: "鍛造した板金とリベット" },
  { id: "chain", label: "鎖帷子", desc: "織り込まれた金属の輪" },
  { id: "leather", label: "革", desc: "革の粒子とステッチ" },
  { id: "crystal", label: "結晶", desc: "割れた宝石のファセット" },
  { id: "ember", label: "熔岩", desc: "黒い岩盤に赤熱した亀裂" },
  { id: "frost", label: "氷", desc: "透明感のある霜の層" },
  { id: "obsidian", label: "黒曜石", desc: "鈍い艶のある漆黒" },
];

export const HELMET_PROFILES: { id: HelmetProfile; name: string; description: string }[] = [
  { id: "drake", name: "DRAGON", description: "後方へ流れる角 / 顎当て" },
  { id: "sentinel", name: "SENTINEL", description: "立ち上がる稜線 / 重い額当て" },
  { id: "crown", name: "CROWN", description: "王冠状の尖塔 / 宝石の額飾り" },
];

export interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "ドラゴン赤", primary: "#8b1e1e", secondary: "#3d0b0b", accent: "#f5b942" },
  { name: "氷晶", primary: "#9fd8ef", secondary: "#3a6b8c", accent: "#e8fbff" },
  { name: "溶岩", primary: "#3a1a10", secondary: "#1a0a06", accent: "#ff7a1a" },
  { name: "黒曜石", primary: "#1f1b2e", secondary: "#0b0912", accent: "#b68cff" },
  { name: "ミスリル", primary: "#a8c7e0", secondary: "#5d7d96", accent: "#e6f7ff" },
  { name: "金", primary: "#d4af37", secondary: "#8a6d1d", accent: "#fff3b0" },
  { name: "森竜", primary: "#2e6b3a", secondary: "#123d1f", accent: "#d4e157" },
  { name: "鉄", primary: "#9aa3ad", secondary: "#4b535c", accent: "#d0d7de" },
];

export const PART_LABELS: Record<PartId, string> = {
  helmet: "ヘルメット",
  chest: "チェストプレート",
  leggings: "レギンス",
  boots: "ブーツ",
};

export const DEFAULT_PARAMS: ArmorParams = {
  armorId: "dragon_scale",
  displayName: "ドラゴンスケール",
  namespace: "mymod",
  style: "scale",
  helmetProfile: "drake",
  visorMode: "embers",
  hornLength: 3,
  primary: "#8b1e1e",
  secondary: "#3d0b0b",
  accent: "#f5b942",
  seed: 1234,
  detail: 4,
  noise: 14,
  edgeShade: true,
  brightness: { helmet: 0, chest: 0, leggings: 0, boots: 0 },
  iconSize: 16,
  includeGeckolib: true,
  includeJava: true,
};
