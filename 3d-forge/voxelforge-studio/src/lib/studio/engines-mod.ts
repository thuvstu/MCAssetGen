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
import { emptyProject as forgeEmptyProject, newItem as forgeNewItem } from "../compat/engines/modforge/mod/catalog";
import { generateProject as mythicProject, texturePaths } from "../compat/engines/modic/codegen";
import { emptyProject, newItem as modicNewItem } from "../compat/engines/modic/defaults";

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

/**
 * 生成ファイルを API/CLI の出力形式へ詰め替える。
 *
 * codegen は `encoding: "base64"` のファイル (PNG / gradle-wrapper.jar など) を
 * バイナリとして返すので、テキストと同じ扱いで UTF-8 エンコードすると壊れる。
 * ここでデコードして「生のバイト列」を base64 に載せ替える。
 */
function filesResult(
  engine: string,
  command: string,
  files: { path: string; content: string; encoding?: "base64" }[],
  outName: string,
): StudioResult {
  return {
    ok: true,
    engine,
    command,
    text: `wrote ${files.length} files (${outName})`,
    files: files.map((entry) =>
      entry.encoding === "base64"
        ? file(entry.path, new Uint8Array(Buffer.from(entry.content, "base64")))
        : file(entry.path, new Uint8Array(Buffer.from(entry.content, "utf8"))),
    ),
    data: { count: files.length, paths: files.map((entry) => entry.path) },
  };
}

/**
 * アセットバスから渡された PNG (`--asset <テクスチャ>`) を data URL に正規化する。
 * base64 直 / dataURL どちらも受け付け、PNG でなければ null (= 未指定扱い)。
 */
function textureDataUrl(raw: unknown): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  const base = value.startsWith("data:") ? value.slice(value.indexOf(",") + 1) : value;
  const b64 = base.replace(/\s+/g, "");
  if (b64.length < 12 || !/^[A-Za-z0-9+/=]+$/.test(b64)) return null;
  const bytes = Buffer.from(b64, "base64");
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes.subarray(1, 4).toString("latin1") !== "PNG") return null;
  return `data:image/png;base64,${b64}`;
}

const registryId = (value: string, fallback: string) =>
  value.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || fallback;

/**
 * MythicForge (Fabric MOD) のプロジェクトへアイテムテクスチャを差し込む。
 *
 * `--asset <テクスチャ>` で受け取った PNG を、`textureTarget` のアイテム
 * (未指定なら customTexture 未設定の先頭アイテム) に割り当てる。アイテムが
 * 1つも無いプロジェクトでは汎用アイテムを1つ作って割り当てる。
 * 未指定なら何もしない = 従来の `mythic:build` の挙動は完全に同じ。
 */
function injectForgeTexture(
  project: Record<string, unknown>,
  args: Args,
): { item: string; created: boolean } | null {
  const dataUrl = textureDataUrl(args.texture);
  if (!dataUrl) return null;
  const items = Array.isArray(project.items)
    ? (project.items as Record<string, unknown>[])
    : ((project.items = []) as Record<string, unknown>[]);
  const target = asString(args, "textureTarget").trim();
  let item = target
    ? items.find((entry) => entry.id === target)
    : (items.find((entry) => !entry.customTexture) ?? items[0]);
  if (target && !item) fail(`textureTarget に一致するアイテムがありません: ${target}`);
  if (item) {
    item.customTexture = dataUrl;
    return { item: String(item.id), created: false };
  }
  const modId = String((project.meta as { modId?: string } | undefined)?.modId ?? "mymod");
  const id = registryId(target || "custom_item", "custom_item");
  item = { ...forgeNewItem(modId), id, name: target || "Custom Item", customTexture: dataUrl };
  items.push(item);
  return { item: id, created: true };
}

/**
 * MythicCraft (MythicMobs) のプロジェクトへテクスチャ PNG を出力ファイル
 * として追加する。modic の生成物はテクスチャを手置きする前提なので、
 * バスから来た画像をそのまま所定パスへ入れて受け渡しを1本につなぐ。
 */
function injectModicTexture(
  project: Record<string, unknown>,
  args: Args,
): { path: string; name: string; bytes: Uint8Array } | null {
  const dataUrl = textureDataUrl(args.texture);
  if (!dataUrl) return null;
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bytes = new Uint8Array(Buffer.from(b64, "base64"));
  const items = Array.isArray(project.items)
    ? (project.items as Record<string, unknown>[])
    : ((project.items = []) as Record<string, unknown>[]);
  const meta = (project.meta ?? (project.meta = {})) as { modId?: string };
  const modId = String(meta.modId ?? "mymod");
  const target = asString(args, "textureTarget").trim();
  let item = target
    ? items.find((entry) => entry.registryName === target || entry.id === target)
    : (items[0] as Record<string, unknown> | undefined);
  if (target && !item && items.length) fail(`textureTarget に一致するアイテムがありません: ${target}`);
  if (!item) {
    item = modicNewItem(registryId(target || "custom_item", "custom_item")) as unknown as Record<string, unknown>;
    items.push(item);
  }
  const name = String(item.registryName ?? "custom_item");
  const path =
    texturePaths(project as never).find((entry) => entry.name === name)?.path ??
    `src/main/resources/assets/${modId}/textures/item/${name}.png`;
  return { path, name, bytes };
}

export const MOD_ENGINES: RegisteredEngine[] = [
  {
    id: "mythic",
    label: "MythicForge Fabric MOD",
    group: "mod",
    description: "最新のFabric MODジェネレータ (Kotlin/Yarn+Mojmap)。プロジェクトJSONからMOD一式を生成",
    commands: [
      { id: "sample", summary: "空のプロジェクトJSON" },
      {
        id: "build",
        summary: "MODファイル一式を生成 (--asset <PNG> でアイテムテクスチャを差し込める)",
        args: ["project", "projectBase64", "texture", "textureTarget"],
      },
    ],
    run(command, args) {
      if (command === "sample")
        return {
          ok: true,
          engine: "mythic",
          command,
          text: "sample project",
          // CLI 連鎖 (sample → build) のため data にも同じJSONを入れる
          data: forgeEmptyProject(),
          files: [jsonFile("mythic_project.json", forgeEmptyProject())],
        };
      if (command !== "build") fail(`unknown mythic command: ${command} (sample|build)`);
      const project = projectArg(args);
      const injected = injectForgeTexture(project, args);
      const files = forgeProject(project as never);
      const result = filesResult("mythic", command, files, String((project.meta as { modId?: string } | undefined)?.modId ?? "mod"));
      if (injected) {
        result.text += ` + texture:${injected.item}${injected.created ? " (new item)" : ""}`;
        result.data = { ...(result.data as object), texture: injected.item };
      }
      return result;
    },
  },
  {
    id: "mythiccraft",
    label: "MythicCraft MOD",
    group: "mod",
    description: "MythicMobs連携MODジェネレータ。プロジェクトJSONからMOD一式を生成",
    commands: [
      { id: "sample", summary: "空のプロジェクトJSON", args: ["name"] },
      {
        id: "build",
        summary: "MODファイル一式を生成 (--asset <PNG> でアイテムテクスチャを同梱)",
        args: ["project", "projectBase64", "texture", "textureTarget"],
      },
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
      const injected = injectModicTexture(project, args);
      const files = mythicProject(project as never);
      if (!injected) return filesResult("mythiccraft", command, files, String((project.meta as { modId?: string } | undefined)?.modId ?? "mod"));
      return {
        ok: true,
        engine: "mythiccraft",
        command,
        text: `wrote ${files.length + 1} files (${String((project.meta as { modId?: string } | undefined)?.modId ?? "mod")}) + texture:${injected.name}`,
        files: [
          ...files.map((entry) => file(entry.path, new Uint8Array(Buffer.from(entry.content, "utf8")))),
          file(injected.path, injected.bytes),
        ],
        data: { count: files.length + 1, paths: [...files.map((entry) => entry.path), injected.path], texture: injected.path },
      };
    },
  },
];
