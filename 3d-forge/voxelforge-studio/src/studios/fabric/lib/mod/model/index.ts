import type { AdvancementDef, CustomEffectDef, DropRule, MaterialDef, MobDef, ShopDef, SkillPointDef } from "./extras";
import type { StructureDef, WeaponForgeDef } from "./forge";
import type { BlockDef, ItemDef, ModMeta, RecipeDef, SkillDef } from "./project";

export * from "./environment";
export * from "./project";
export * from "./extras";
export * from "./forge";

export interface ModProject {
  meta: ModMeta;
  mana: { max: number; regenPerSecond: number };
  items: ItemDef[];
  blocks: BlockDef[];
  skills: SkillDef[];
  recipes: RecipeDef[];
  mobs: MobDef[];
  drops: DropRule[];
  materials: MaterialDef[];
  effects: CustomEffectDef[];
  advancements: AdvancementDef[];
  shops: ShopDef[];
  skillPoints: SkillPointDef[];
  forge: WeaponForgeDef;
  structures: StructureDef[];
  customImports: string;
  config: {
    maxMana: number;
    regenPerSecond: number;
    hud: boolean;
    slots: string[];
    slotKeys: number[];
  };
}

export type Severity = "error" | "warning" | "info";

export interface Diagnostic {
  file: string;
  line: number;
  col: number;
  severity: Severity;
  code: string;
  message: string;
  fix?: { kind: "addImport"; fqn: string };
}

export interface GeneratedFile {
  path: string;
  content: string;
  kind: "kotlin" | "json" | "gradle" | "text" | "binary";
  encoding?: "base64";
  executable?: boolean;
}
