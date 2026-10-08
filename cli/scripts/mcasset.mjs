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
 *   npm run mcasset -- engines
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
const CLIENT_FLAGS = new Set(["out", "out-dir", "url"]);

const USAGE = `mcasset — MCAssetGen unified CLI (API mode)

usage: npm run mcasset -- <studio>:<command> [options] [--out file|dir]
       npm run mcasset -- engines

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

examples:
  npm run mcasset -- sky:items
  npm run mcasset -- sky:render --item hyperion --seed 7 --res 32 --out mm/tex.png
  npm run mcasset -- forge:pack --style furfsky --res 32 --out mm/pack.zip
  npm run mcasset -- tex:effect --id edgewear --sample sword --out mm/edge.png
  npm run mcasset -- vox:export --kind sword --format geckolib --out mm/sword.zip
  npm run mcasset -- mythic:build --project proj.json --out moddev/mymod
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

if (target === "engines" || target === "--engines") {
  const { body } = await api("/api/studio/engines", { method: "GET" });
  if (!body?.ok) fail(`engine一覧の取得に失敗しました: ${JSON.stringify(body)}`);
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
if (args.url) {
  // per-call override, mainly for tests
  process.env.MCASSET_STUDIO_URL = String(args.url);
}
for (const key of CLIENT_FLAGS) delete args[key];

const payload = loadInputs(args);
const { body } = await api("/api/studio/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ engine, command, args: payload }),
});

if (!body?.ok) {
  console.error(body?.error ?? "コマンドの実行に失敗しました。");
  process.exit(1);
}

if (body.text) console.log(body.text);
const written = writeOutputs(body.files, out, outDir);
for (const path of written) console.log(`wrote ${path}`);

// Keep the old CLI's habit of reporting the shape of the output.
if (body.data && written.length === 0 && typeof body.data === "object" && body.data !== null && "count" in body.data)
  console.log(`files: ${body.data.count}`);
