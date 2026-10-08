import type { ItemDef, ModProject } from "../model";

export type Dialect = "yarn" | "mojmap";

export const ARMOR_FACTOR: Record<string, number> = {
  LEATHER: 5,
  CHAINMAIL: 15,
  IRON: 15,
  GOLD: 7,
  DIAMOND: 33,
  TURTLE: 25,
  TURTLE_SCUTE: 25,
  ARMADILLO_SCUTE: 20,
  COPPER: 12,
  NETHERITE: 37,
};

export const ARMOR_BASE: Record<string, number> = {
  HELMET: 11,
  CHESTPLATE: 16,
  LEGGINGS: 15,
  BOOTS: 13,
};

export const armorDurability = (it: ItemDef): number =>
  it.durability > 0
    ? it.durability
    : (ARMOR_FACTOR[it.armorMaterial] ?? 15) * (ARMOR_BASE[it.armorSlot] ?? 15);

export const q = (s: string): string =>
  `"${s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$")
    .replace(/\r?\n/g, "\\n")}"`;

export const d = (value: unknown): string => {
  const n = number(value);
  return Number.isInteger(n) ? `${n}.0` : `${n}`;
};

export const f = (value: unknown): string => `${d(value)}f`;

export const i = (value: unknown): string => `${Math.round(number(value))}`;

export const number = (value: unknown, fallback = 0): number =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

export const string = (value: unknown): string => String(value ?? "");

export const constName = (id: string): string => {
  const normalized = id.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  return /^[0-9]/.test(normalized) ? `_${normalized}` : normalized;
};

export const indent = (lines: string[], spaces: number): string[] =>
  lines.map((line) => (line.length ? `${" ".repeat(spaces)}${line}` : line));

export const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const namespaced = (project: ModProject, id: string): string =>
  id.includes(":") ? id : `${project.meta.modId}:${id}`;

export const targetMode = (value: unknown): string => {
  const mode = string(value);
  return `TargetMode.${["SELF", "TARGET", "AREA", "POINT"].includes(mode) ? mode : "TARGET"}`;
};

export const variableScope = (value: unknown): string => {
  const scope = string(value);
  return q(["SELF", "TARGET", "GLOBAL"].includes(scope) ? scope : "SELF");
};

export const variableName = (value: unknown): string =>
  q(string(value).replace(/[^A-Za-z0-9_]/g, "_") || "var");

export const toolClass = (it: ItemDef): string => {
  const map: Partial<Record<ItemDef["kind"], string>> = {
    sword: "SwordItem",
    pickaxe: "PickaxeItem",
    axe: "AxeItem",
    shovel: "ShovelItem",
  };
  return map[it.kind] ?? "SwordItem";
};

import type { MojHelpers } from "../codegenMojmap";

export const mojHelpers = (): MojHelpers => ({ q, d, f, i, ind: indent, constName, armorDurability });
