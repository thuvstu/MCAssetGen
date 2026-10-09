import { generateProject, projectSymbols } from "../mod/codegen";
import { resolveEnv } from "../mod/targets";
import { checkWeaponForge } from "../mod/weaponForge";
import type { Diagnostic, GeneratedFile, ModProject } from "../mod/model";
import { analyzeKotlin } from "./kotlin";
import { analyzeProject } from "./projectValidator";

export { analyzeProject } from "./projectValidator";

// ================= pipeline =================
export interface Stage {
  key: string;
  name: string;
  description: string;
  status: "ok" | "warn" | "error" | "skipped";
  diagnostics: Diagnostic[];
  note?: string;
}

export interface PipelineResult {
  files: GeneratedFile[];
  stages: Stage[];
  diagnostics: Diagnostic[];
  errors: number;
  warnings: number;
  ok: boolean;
}

const groups: Record<string, (code: string) => boolean> = {
  syntax: (c) => ["KT-SYNTAX", "KT-BRACKET", "KT-PACKAGE"].includes(c),
  symbols: (c) => ["KT-IMPORT", "KT-IMPORT-UNVERIFIED", "KT-IMPORT-EXTERNAL", "KT-UNRESOLVED", "KT-UNUSED-IMPORT", "KT-DUP-IMPORT", "MC-PACKAGE"].includes(c),
};

function statusOf(d: Diagnostic[]): Stage["status"] {
  return d.some((x) => x.severity === "error") ? "error" : d.some((x) => x.severity === "warning") ? "warn" : "ok";
}

export function checkJsonFiles(files: GeneratedFile[], project: ModProject): Diagnostic[] {
  const out: Diagnostic[] = [];
  const lang = files.find((f) => f.path.endsWith("/lang/en_us.json"));
  let langObj: Record<string, string> = {};
  for (const f of files.filter((x) => x.kind === "json")) {
    try {
      const obj = JSON.parse(f.content);
      if (f === lang) langObj = obj;
    } catch (e) {
      out.push({ file: f.path, line: 1, col: 1, severity: "error", code: "JSON-SYNTAX", message: `JSON構文エラー: ${(e as Error).message}` });
    }
  }
  const need = [
    ...project.items.map((x) => `item.${project.meta.modId}.${x.id}`),
    ...project.blocks.map((x) => `block.${project.meta.modId}.${x.id}`),
  ];
  need.forEach((k) => {
    if (!langObj[k]?.trim()) out.push({ file: lang?.path ?? "lang", line: 1, col: 1, severity: "warning", code: "JSON-LANG", message: `翻訳キー '${k}' の表示名が空です` });
  });

  return out;
}

export function runPipeline(project: ModProject): PipelineResult {
  const stages: Stage[] = [];
  const all: Diagnostic[] = [];
  const projectDiag = [...analyzeProject(project), ...checkWeaponForge(project)];
  stages.push({ key: "project", name: "プロジェクト検証", description: "ID・参照整合性・バランス・スキル循環参照", status: statusOf(projectDiag), diagnostics: projectDiag });
  all.push(...projectDiag);

  let files: GeneratedFile[] = [];
  try {
    files = generateProject(project);
    stages.push({ key: "codegen", name: "Kotlinコード生成", description: `${files.length} ファイルを生成`, status: "ok", diagnostics: [] });
  } catch (e) {
    const d: Diagnostic = { file: "codegen", line: 0, col: 0, severity: "error", code: "GEN-FAIL", message: `コード生成に失敗: ${(e as Error).message}` };
    stages.push({ key: "codegen", name: "Kotlinコード生成", description: "", status: "error", diagnostics: [d] });
    all.push(d);
  }

  const syms = projectSymbols(project);
  const ktDiag: Diagnostic[] = [];
  for (const f of files.filter((x) => x.kind === "kotlin")) {
    const rel = f.path.replace(`src/main/kotlin/${project.meta.packageName.replace(/\./g, "/")}/`, "");
    const dir = rel.includes("/") ? "." + rel.slice(0, rel.lastIndexOf("/")).replace(/\//g, ".") : "";
    ktDiag.push(...analyzeKotlin(f.path, f.content, {
      expectedPackage: project.meta.packageName + dir,
      projectPackage: project.meta.packageName,
      symbols: syms,
      mapping: resolveEnv(project.meta).mappings,
      clientFile: /\/client\//.test(f.path),
    }));
  }
  const syntax = ktDiag.filter((d) => groups.syntax(d.code));
  const symbols = ktDiag.filter((d) => groups.symbols(d.code));
  const api = ktDiag.filter((d) => !groups.syntax(d.code) && !groups.symbols(d.code));
  stages.push({ key: "syntax", name: "構文解析", description: "字句解析・括弧の対応・文字列/コメントの閉じ忘れ・package", status: statusOf(syntax), diagnostics: syntax });
  stages.push({ key: "symbols", name: "import・シンボル解決", description: "import先の実在確認・未importクラス・未使用import", status: statusOf(symbols), diagnostics: symbols });
  stages.push({ key: "api", name: `API互換性 (MC ${resolveEnv(project.meta).minecraft} / ${resolveEnv(project.meta).mappings === "mojmap" ? "Mojang" : "Yarn"})`, description: "旧API・クライアント専用クラス・引数数・override漏れ・Java記法", status: statusOf(api), diagnostics: api });
  all.push(...ktDiag);

  const jsonDiag = checkJsonFiles(files, project);
  stages.push({ key: "resources", name: "リソースJSON検証", description: "fabric.mod.json / モデル / レシピ / lang のJSON構文と翻訳キー", status: statusOf(jsonDiag), diagnostics: jsonDiag });
  all.push(...jsonDiag);

  const errors = all.filter((d) => d.severity === "error").length;
  const warnings = all.filter((d) => d.severity === "warning").length;
  stages.push({
    key: "compile", name: "Gradleコンパイル (kotlinc + Loom)", description: "実際の型検査・リマップ・jar生成",
    status: "skipped", diagnostics: [],
    note: "ビルドタブの「🚀 今すぐコンパイル」で、サーバーに JDK 21 + Gradle があれば kotlinc と Fabric Loom による実コンパイルをその場で実行し、Mod jar を生成します。実行できない環境では、ZIPを出力して GitHub Actions (.github/workflows/build.yml) または `gradle build` で実行してください。",
  });
  return { files, stages, diagnostics: all, errors, warnings, ok: errors === 0 };
}

// Focused subsystems are re-exported for backward-compatible imports.
export { checkCompleteness } from "./completeness";
export type { ChecklistItem, Completeness } from "./completeness";
export { simulateSkill } from "./simulator";
export type { SimEvent, SimResult } from "./simulator";
export { ACTION_SCHEMAS } from "../mod/catalog";
