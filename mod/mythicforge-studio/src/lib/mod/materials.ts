import type { ItemDef, MaterialDef, ModProject } from "./types";

/** バニラ道具素材の基準耐久 (1.21.x) */
export const TOOL_BASE_DURABILITY: Record<string, number> = { WOOD: 59, STONE: 131, COPPER: 190, IRON: 250, GOLD: 32, DIAMOND: 1561, NETHERITE: 2031 };

export const TOOL_KINDS = ["sword", "pickaxe", "axe", "shovel"];

/** アイテムが参照する素材 (道具・防具のみ有効) */
export function materialOf(project: ModProject, it: ItemDef): MaterialDef | undefined {
  if (!it.materialId) return undefined;
  if (!TOOL_KINDS.includes(it.kind) && it.kind !== "armor") return undefined;
  return (project.materials ?? []).find((m) => m.id === it.materialId);
}

/** 素材の耐久倍率を適用した耐久値 (armorBase は防具の既定耐久) */
export function scaledDurability(it: ItemDef, mat: MaterialDef, armorBase: number): number {
  const base = it.kind === "armor" ? (it.durability > 0 ? it.durability : armorBase) : it.durability > 0 ? it.durability : (TOOL_BASE_DURABILITY[it.material] ?? 250);
  return Math.max(1, Math.round(base * mat.durabilityMultiplier));
}
