import {
  asString,
  fail,
  jsonFile,
  file,
  type Args,
  type RegisteredEngine,
  type StudioResult,
} from "./engine-utils";
import { generateProject as forgeProject } from "../compat/engines/modforge/mod/codegen";
import { emptyProject as forgeEmptyProject } from "../compat/engines/modforge/mod/catalog";
import { generateProject as mythicProject } from "../compat/engines/modic/codegen";
import { emptyProject } from "../compat/engines/modic/defaults";

/**
 * Fabric mod generators.
 *
 * Both mod studios expose their code generator here so the CLI can build a mod
 * from a project JSON through the API instead of importing studio sources.
 */
function projectArg(args: Args): Record<string, unknown> {
  const inline = args.project;
  if (inline && typeof inline === "object") return inline as Record<string, unknown>;
  const base64 = asString(args, "projectBase64");
  if (base64) return JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as Record<string, unknown>;
  const raw = asString(args, "projectJson");
  if (raw) return JSON.parse(raw) as Record<string, unknown>;
  return fail("project (JSON object) が必要です。");
}

function filesResult(engine: string, command: string, files: { path: string; content: string }[], outName: string): StudioResult {
  return {
    ok: true,
    engine,
    command,
    text: `wrote ${files.length} files (${outName})`,
    files: files.map((entry) => file(entry.path, new Uint8Array(Buffer.from(entry.content, "utf8")))),
    data: { count: files.length, paths: files.map((entry) => entry.path) },
  };
}

export const MOD_ENGINES: RegisteredEngine[] = [
  {
    id: "mythic",
    label: "MythicForge Fabric MOD",
    group: "mod",
    description: "最新のFabric MODジェネレータ (Kotlin/Yarn+Mojmap)。プロジェクトJSONからMOD一式を生成",
    commands: [
      { id: "sample", summary: "空のプロジェクトJSON" },
      { id: "build", summary: "MODファイル一式を生成", args: ["project", "projectBase64"] },
    ],
    run(command, args) {
      if (command === "sample")
        return {
          ok: true,
          engine: "mythic",
          command,
          text: "sample project",
          files: [jsonFile("mythic_project.json", forgeEmptyProject())],
        };
      if (command !== "build") fail(`unknown mythic command: ${command} (sample|build)`);
      const project = projectArg(args);
      const files = forgeProject(project as never);
      return filesResult("mythic", command, files, String((project.meta as { modId?: string } | undefined)?.modId ?? "mod"));
    },
  },
  {
    id: "mythiccraft",
    label: "MythicCraft MOD",
    group: "mod",
    description: "MythicMobs連携MODジェネレータ。プロジェクトJSONからMOD一式を生成",
    commands: [
      { id: "sample", summary: "空のプロジェクトJSON", args: ["name"] },
      { id: "build", summary: "MODファイル一式を生成", args: ["project", "projectBase64"] },
    ],
    run(command, args) {
      if (command === "sample") {
        const project = emptyProject(asString(args, "name", "mymod"));
        return {
          ok: true,
          engine: "mythiccraft",
          command,
          text: `sample project (${asString(args, "name", "mymod")})`,
          files: [jsonFile(`${asString(args, "name", "mymod")}.json`, project)],
        };
      }
      if (command !== "build") fail(`unknown mythiccraft command: ${command} (sample|build)`);
      const project = projectArg(args);
      const files = mythicProject(project as never);
      return filesResult("mythiccraft", command, files, String((project.meta as { modId?: string } | undefined)?.modId ?? "mod"));
    },
  },
];
