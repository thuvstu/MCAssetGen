export interface ForgeStyleDef {
  id: string;
  name: string;
  texture: string;
  customTexture?: string;
  /** Blockbench Java Item/Block model JSON。bbmodel本体ではない */
  modelJson?: string;
  parent: "handheld" | "generated";
  costItem: string;
  costCount: number;
  defaultDamage: number;
  defaultSpeed: number;
  defaultDurability: number;
  defaultSkillId: string;
}

export interface WeaponForgeDef {
  enabled: boolean;
  styles: ForgeStyleDef[];
}

/**
 * NBT構造物のワールド生成設定。
 * nbtBase64 が無い場合は同梱の初期村プリセットを生成する。
 */
export interface StructureDef {
  id: string;
  name: string;
  description: string;
  biomes: string;
  nbtBase64?: string;
  spawnNearOrigin: boolean;
  spacing: number;
  separation: number;
  terrainAdaptation: "beard_thin" | "beard_box" | "bury" | "none";
  step: "surface_structures" | "underground_structures";
  includeShopForge: boolean;
}
