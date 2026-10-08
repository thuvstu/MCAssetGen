#!/usr/bin/env node
/**
 * mcasset — MCAssetGen unified CLI.
 *
 * Fully API driven: every studio command is executed by the VoxelForge studio
 * server (`POST /api/studio/run`), which hosts all ported engines
 * (see MERGE_PLAN.md). The CLI only parses flags, uploads inputs and writes the
 * returned files, so it never imports studio sources.
 *
 *   npm run mcasset -- <studio>:<command> [--flag value] --out file
 *   npm run mcasset -- engines [--json]
 *   npm run mcasset -- tex:render --save grass_tex     # アセットバスへ
 *   npm run mcasset -- tex:convert --asset grass_tex   # 別スタジオの出力を入力に
 *
 * Flags default to the command's sample (the same values the /engines console
 * pre-fills), so every command runs with no arguments at all.
 *
 * Environment:
 *   MCASSET_STUDIO_URL  studio base URL (default http://127.0.0.1:5131)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const STUDIO_URL = (process.env.MCASSET_STUDIO_URL ?? "http://127.0.0.1:5131").replace(/\/$/, "");

/** studio name → engine id in the unified registry. */
const STUDIOS = {
  vox: "voxel",
  armor: "armor",
  mob: "mob",
  structure: "structure",
  material: "material",
  sky: "skyforge",
  sky2: "sky2",
  forge: "forge",
  spell: "spell",
  arcane: "arcane",
  sword: "sword",
  adv: "adv",
  tex: "tex",
  mythic: "mythic",
  mythiccraft: "mythiccraft",
};

/** Flags that name a file the CLI should upload instead of passing through. */
const FILE_ARGS = new Set(["in"]);
const JSON_ARGS = new Set(["project", "config", "params"]);
/** Flags consumed by the client itself. */
const CLIENT_FLAGS = new Set(["out", "out-dir", "url", "json", "sample", "dry-run", "save", "asset"]);
/** 繰り返し指定できるフラグ (例: --asset project --asset texture)。配列でまとめる。 */
const REPEATABLE_FLAGS = new Set(["asset"]);
/** バス連携フラグ: 送信payloadには入れず、リクエスト直下の save / asset として渡す */

const USAGE = `mcasset — MCAssetGen unified CLI (API mode)

usage: npm run mcasset -- <studio>:<command> [options] [--out file|dir]
       npm run mcasset -- engines [--json]
options:
  --out <file>       1ファイルの出力先
  --out-dir <dir>    複数ファイルの出力先ディレクトリ
  --save <名前>      出力をアセットバスへ保存 (別スタジオの入力に使える)
  --asset <名前>     アセットバスから入力を取り込む (複数指定可: MOD へプロジェクト+テクスチャ等)
  --no-sample        コマンド既定のサンプル引数を使わない
  --dry-run          送信するリクエストだけ表示

studios:
  vox        VoxelForge 3Dモデル (kind/seed/format: bbmodel|json|resourcepack|geckolib)
  armor      アーマー生成 (GeckoLib 5 対応)
  mob        モブ生成 (Java/Bedrock/Fabric/GeckoLib)
  structure  NBT構造物 + データパック
  material   マテリアルテクスチャ + リソースパック
  tex        TexCraft テクスチャスタジオ
  sky        SkyForge アイテムテクスチャ
  sky2       クラシックSkyBlock描画
  forge      SkyBlock Texture Forge (描画 + パック)
  adv        武器アセット (ピクセル/3D/アニメ)
  arcane     Arcane Forge 杖
  spell      Spellforge 杖
  sword      AegisBlade 剣
  mythic     MythicForge Fabric MOD
  mythiccraft MythicCraft MOD

  assets     アセットバスの一覧 (スタジオ間の受け渡し)

examples:
  npm run mcasset -- tex:render --sample stone --save grass_tex --out mm/grass.png
  npm run mcasset -- tex:convert --asset grass_tex --palette PICO-8 --out mm/dot.png
  npm run mcasset -- sky:items
  npm run mcasset -- sky:render --item hyperion --seed 7 --res 32 --out mm/tex.png
  npm run mcasset -- forge:pack --style furfsky --res 32 --out mm/pack.zip
  npm run mcasset -- tex:effect --id edgewear --sample sword --out mm/edge.png
  npm run mcasset -- vox:export --kind sword --format geckolib --out mm/sword.zip
  npm run mcasset -- mythic:build --project proj.json --out moddev/mymod
  npm run mcasset -- tex:render --sample stone --save mod_tex
  npm run mcasset -- mythic:sample --save mymod
  npm run mcasset -- mythic:build --asset mymod --asset mod_tex --out-dir moddev/mymod
`;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else if (REPEATABLE_FLAGS.has(key)) {
      args[key] = args[key] === undefined ? next : [].concat(args[key], next);
      i++;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function loadInputs(args) {
  const payload = {};
  for (const [key, value] of Object.entries(args)) {
    if (value === true) {
      payload[key] = true;
      continue;
    }
    if (FILE_ARGS.has(key)) {
      try {
        payload[key] = readFileSync(String(value)).toString("base64");
      } catch (error) {
        fail(`--${key} のファイルを読み込めません: ${value} (${error.message})`);
      }
      continue;
    }
    if (JSON_ARGS.has(key)) {
      try {
        payload[key] = JSON.parse(readFileSync(String(value), "utf8"));
      } catch (error) {
        fail(`--${key} のJSONを読み込めません: ${value} (${error.message})`);
      }
      continue;
    }
    payload[key] = value;
  }
  return payload;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function api(path, init) {
  let response;
  try {
    response = await fetch(`${STUDIO_URL}${path}`, init);
  } catch (error) {
    fail(
      `スタジオAPI (${STUDIO_URL}) に接続できません: ${error.message}\n` +
        `  VoxelForgeスタジオを起動してください: cd 3d-forge/voxelforge-studio && npm run dev`,
    );
  }
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    fail(`API応答を解析できません (HTTP ${response.status}):\n${text.slice(0, 400)}`);
  }
  return { status: response.status, body };
}

function writeOutputs(files, out, outDir) {
  if (!files?.length) return [];
  const target = outDir ?? out;
  const asDirectory = files.length > 1 || outDir !== undefined;
  const written = [];
  if (files.length === 1 && !asDirectory) {
    const path = resolve(String(out ?? files[0].path));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(files[0].base64, "base64"));
    written.push(path);
    return written;
  }
  for (const entry of files) {
    const path = target
      ? join(resolve(String(target)), entry.path)
      : resolve(entry.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(entry.base64, "base64"));
    written.push(path);
  }
  return written;
}

const [target, ...rest] = process.argv.slice(2);

if (!target || target === "--help" || target === "-h") {
  console.log(USAGE);
  process.exit(0);
}

if (target === "assets") {
  const { body } = await api("/api/assets", { method: "GET" });
  if (!body?.ok) fail(`アセット一覧の取得に失敗しました: ${JSON.stringify(body)}`);
  if (rest.includes("--json")) {
    console.log(JSON.stringify(body.assets, null, 2));
    process.exit(0);
  }
  for (const asset of body.assets)
    console.log(`${asset.name}\t${asset.studio}:${asset.kind}\t${asset.files.length}件\t${asset.files.join(",")}`);
  process.exit(0);
}

if (target === "engines" || target === "--engines") {
  const { body } = await api("/api/studio/engines", { method: "GET" });
  if (!body?.ok) fail(`engine一覧の取得に失敗しました: ${JSON.stringify(body)}`);
  if (rest.includes("--json")) {
    console.log(JSON.stringify(body, null, 2));
    process.exit(0);
  }
  for (const engine of body.engines)
    console.log(`${engine.id}\t${engine.group}\t${engine.label}\t${engine.commands.map((c) => c.id).join("|")}`);
  process.exit(0);
}

const [studio, command] = target.split(":");
const engine = STUDIOS[studio];
if (!command || !engine) {
  console.log(USAGE);
  process.exit(command ? 1 : 0);
}

const args = parseArgs(rest);
const out = args.out;
const outDir = args["out-dir"];
// CLIENT_FLAGS を消す前に読む (save/asset はバス連携用)
const saveName = typeof args.save === "string" ? args.save : "";
const assetName = Array.isArray(args.asset) ? args.asset : typeof args.asset === "string" ? args.asset : "";
const hasAssets = Array.isArray(assetName) ? assetName.length > 0 : assetName.length > 0;
if (args.url) {
  // per-call override, mainly for tests
  process.env.MCASSET_STUDIO_URL = String(args.url);
}
for (const key of CLIENT_FLAGS) delete args[key];

// コマンド定義を取得して、既定サンプル + 実引数をマージする。
const catalog = (await api("/api/studio/engines", { method: "GET" })).body;
const definition = catalog?.engines?.find((entry) => entry.id === engine);
const known = definition?.commands?.find((entry) => entry.id === command);
if (definition && !known) {
  fail(
    `unknown command: ${studio}:${command}\n` +
      `  利用可能: ${definition.commands.map((entry) => entry.id).join(" | ")}`,
  );
}
const useSample = args.sample !== false;
delete args.sample;
const payload = { ...(useSample && known?.sample ? known.sample : {}), ...loadInputs(args) };
if (args["dry-run"]) {
  delete args["dry-run"];
  console.log(JSON.stringify({ engine, command, args: payload, ...(hasAssets ? { asset: assetName } : {}), ...(saveName ? { save: saveName } : {}) }, null, 2));
  process.exit(0);
}
delete args["dry-run"];

const { body } = await api("/api/studio/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    engine,
    command,
    args: payload,
    ...(hasAssets ? { asset: assetName } : {}),
    ...(saveName ? { save: saveName } : {}),
  }),
});

if (!body?.ok) {
  console.error(body?.error ?? "コマンドの実行に失敗しました。");
  process.exit(1);
}

if (body.text) console.log(body.text);
if (body.asset?.name) console.log(`saved asset: ${body.asset.name} (${body.asset.files.length} files) — 取り出しは --asset ${body.asset.name}`);
const written = writeOutputs(body.files, out, outDir);
for (const path of written) console.log(`wrote ${path}`);

// Keep the old CLI's habit of reporting the shape of the output.
if (body.data && written.length === 0 && typeof body.data === "object" && body.data !== null && "count" in body.data)
  console.log(`files: ${body.data.count}`);
