/**
 * Codegen facade.
 *
 * Implementation lives in ./codegen:
 *   shared.ts       literal formatting + dialect type
 *   kotlin.ts       package/import assembly + project symbol table
 *   runtime.ts      skill runtime Kotlin (SkillContext/SkillManager/SkillActions/…)
 *   skills.ts       condition/action emission + Skills.kt + SkillTriggers.kt
 *   content.ts      items/blocks/creative tab/config/networking/client/worldgen/main Kotlin
 *   mobs.ts         custom mobs + drop tables Kotlin
 *   resources.ts    recipe/loot/advancement JSON
 *   supportFiles.ts README / GitHub Actions / .gitignore
 *   projectFiles.ts generateProject assembly
 */
import { generateProject } from "./codegen/projectFiles";

export { generateProject };
export { projectSymbols } from "./codegen/kotlin";
export { CUSTOM_OPEN, CUSTOM_CLOSE } from "./codegen/skills";
export { customRanges } from "./codegen/projectFiles";
export { q, constName, armorDurability } from "./codegen/shared";
export type { Dialect } from "./codegen/shared";
