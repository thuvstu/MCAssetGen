import { lexKotlin } from "../../analyzer/kotlin";
import { fqnsForSimpleInMode } from "../../analyzer/registry";
import type { ModProject } from "../model";
import { translateBody } from "../codegenMojmap";
import type { Dialect } from "./shared";

export type KotlinBodyBuilder = (pkg: string, body: string, options?: KotlinBuildOptions) => string;

export interface KotlinBuildOptions {
  extraImports?: string[];
  /** Mojang-specific templates are already in target names and must not be translated. */
  raw?: boolean;
}

/** Same-project symbols used by generated Kotlin import resolution and static analysis. */
export function projectSymbols(project: ModProject): Record<string, string> {
  const pkg = project.meta.packageName;
  const skillPackage = `${pkg}.skill`;
  return {
    ModMain: `${pkg}.ModMain`,
    ModInfo: `${pkg}.ModInfo`,
    ModItems: `${pkg}.ModItems`,
    ModBlocks: `${pkg}.ModBlocks`,
    ModItem: `${pkg}.ModItem`,
    ModItemGroup: `${pkg}.ModItemGroup`,
    ModWorldGen: `${pkg}.ModWorldGen`,
    ModMobs: `${pkg}.ModMobs`,
    WeaponForge: `${pkg}.WeaponForge`,
    ModExtras: `${pkg}.ModExtras`,
    ModItemAttributes: `${pkg}.ModItemAttributes`,
    ModEffect: `${pkg}.ModEffect`,
    ModConfig: `${pkg}.ModConfig`,
    ModNetworking: `${pkg}.net.ModNetworking`,
    ManaSyncPayload: `${pkg}.net.ManaSyncPayload`,
    CastSlotPayload: `${pkg}.net.CastSlotPayload`,
    ModClient: `${pkg}.client.ModClient`,
    HudState: `${pkg}.client.HudState`,
    Skill: `${skillPackage}.Skill`,
    SkillContext: `${skillPackage}.SkillContext`,
    SkillManager: `${skillPackage}.SkillManager`,
    SkillActions: `${skillPackage}.SkillActions`,
    Scheduler: `${skillPackage}.Scheduler`,
    TargetMode: `${skillPackage}.TargetMode`,
    Skills: `${skillPackage}.Skills`,
    SkillTriggers: `${skillPackage}.SkillTriggers`,
    Variables: `${skillPackage}.Variables`,
    Missiles: `${skillPackage}.Missiles`,
  };
}

/**
 * Build a complete Kotlin source file from a package and body.
 * Import resolution is deterministic and uses an explicit mapping dialect.
 */
export function buildKotlin(
  project: ModProject,
  dialect: Dialect,
  pkg: string,
  sourceBody: string,
  options: KotlinBuildOptions = {},
): string {
  const body = dialect === "mojmap" && !options.raw ? translateBody(sourceBody) : sourceBody;
  // User-provided Kotlin is excluded from auto-import detection. Its imports are managed explicitly by the editor.
  const masked = body.replace(/\/\/ >>> custom:[\s\S]*?\/\/ <<< custom:\w+/g, "");
  const symbols = projectSymbols(project);
  const tokens = lexKotlin(masked).tokens;
  const used = new Set<string>();
  tokens.forEach((token, index) => {
    if (token.type !== "ident" || tokens[index - 1]?.text === ".") return;
    used.add(token.text);
  });

  const imports = new Set<string>();
  for (const name of used) {
    const projectSymbol = symbols[name];
    if (projectSymbol) {
      const ownerPackage = projectSymbol.slice(0, projectSymbol.lastIndexOf("."));
      if (ownerPackage !== pkg) imports.add(projectSymbol);
      continue;
    }
    const candidates = fqnsForSimpleInMode(name, dialect);
    if (candidates.length === 1) imports.add(candidates[0]);
  }

  const customImportKeys = new Set<string>();
  const customImports: string[] = [];
  for (const line of options.extraImports ?? []) {
    const match = line.trim().match(/^import\s+([\w.*]+)(\s+as\s+\w+)?$/);
    const key = match ? match[1] + (match[2] ?? "") : line.trim();
    if (!key || customImportKeys.has(key) || (match && !match[2] && imports.has(match[1]))) continue;
    customImportKeys.add(key);
    customImports.push(line.trim());
  }

  const lines = [...[...imports].sort().map((fqn) => `import ${fqn}`), ...customImports];
  return `package ${pkg}\n\n${lines.join("\n")}${lines.length ? "\n\n" : ""}${body.trimEnd()}\n`;
}
