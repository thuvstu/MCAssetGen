import { validDesign } from "@/lib/configurator";
import { db } from "@/db";
import { voxelModels } from "@/db/schema";
import { desc } from "drizzle-orm";
import { sanitizeExtras } from "@/lib/decor";
import { FACES, KIND_INFO, PALETTE_KEYS, PromptError, normalizeTags, generateModel, type GenerationSettings, type ModelTexture, type VoxelCube, type VoxelModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Models can embed an imported texture, so the history stays short to keep responses light.
    const models = await db.select().from(voxelModels).orderBy(desc(voxelModels.createdAt)).limit(40);
    return Response.json({ models });
  } catch (error) {
    console.error("Failed to fetch models", error);
    return Response.json({ error: "モデルの一覧を取得できませんでした。もう一度お試しください。" }, { status: 500 });
  }
}

const isHexColor = (value: unknown) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function validSettings(input: unknown): input is GenerationSettings {
  if (!input || typeof input !== "object") return false;
  const value = input as Record<string, unknown>;
  return [16, 32, 64].includes(value.resolution as number)
    && ["low", "balanced", "high"].includes(value.detail as string)
    && PALETTE_KEYS.includes(value.palette as GenerationSettings["palette"])
    && ["minecraft", "blockbench"].includes(value.format as string)
    && sanitizeExtras(value.extras) !== null
    && (value.design === undefined || validDesign(value.design));
}

/** Imported atlases and voxelized sprites travel as embedded PNG data URLs. */
function validTexture(input: unknown): input is ModelTexture {
  if (!input || typeof input !== "object") return false;
  const value = input as Record<string, unknown>;
  if (value.kind !== "atlas" && value.kind !== "sprite") return false;
  if (typeof value.source !== "string" || !value.source.startsWith("data:image/png;base64,") || value.source.length > 4_000_000) return false;
  const width = value.width, height = value.height;
  if (!isFiniteNumber(width) || !Number.isInteger(width) || width < 1 || width > 512) return false;
  if (!isFiniteNumber(height) || !Number.isInteger(height) || height < 1 || height > 512) return false;
  const bytes = Buffer.from((value.source as string).split(",")[1], "base64");
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return false;
  if (bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) return false;
  if (value.name !== undefined && (typeof value.name !== "string" || value.name.length > 60)) return false;
  if (value.cols !== undefined && !isFiniteNumber(value.cols)) return false;
  if (value.rows !== undefined && !isFiniteNumber(value.rows)) return false;
  if (value.kind === "atlas") {
    if (!Array.isArray(value.palette) || value.palette.length !== 8 || !value.palette.every(isHexColor)) return false;
    const cols = value.cols ?? 4, rows = value.rows ?? 2;
    if (typeof cols !== "number" || typeof rows !== "number" || !Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1 || cols > 8 || rows > 8) return false;
    if (value.slots !== undefined && (!Array.isArray(value.slots) || value.slots.length !== 8 || !value.slots.every(slot => Number.isInteger(slot) && slot >= 0 && slot < cols * rows))) return false;
  }
  if (value.extrusion !== undefined) {
    if (!value.extrusion || typeof value.extrusion !== "object") return false;
    const e = value.extrusion as Record<string, unknown>;
    if (!isFiniteNumber(e.depth) || e.depth < .25 || e.depth > 4 || !isFiniteNumber(e.alphaThreshold) || e.alphaThreshold < 0 || e.alphaThreshold > 255 || typeof e.mergeRuns !== "boolean") return false;
    if (e.glowThreshold !== null && (!isFiniteNumber(e.glowThreshold) || e.glowThreshold < 0 || e.glowThreshold > 1)) return false;
    if (e.gridSize !== undefined && !["native", 16, 32, 64].includes(e.gridSize as string | number)) return false;
    if (e.removeBackground !== undefined && typeof e.removeBackground !== "boolean") return false;
  }
  return true;
}

function validCube(input: unknown): input is VoxelCube {
  if (!input || typeof input !== "object") return false;
  const cube = input as Record<string, unknown>;
  if (typeof cube.name !== "string" || cube.name.length > 40) return false;
  if (!Number.isInteger(cube.color) || (cube.color as number) < 0 || (cube.color as number) > 7) return false;
  if (cube.glow !== undefined && typeof cube.glow !== "boolean") return false;
  for (const key of ["from", "to"] as const) {
    const vector = cube[key];
    if (!Array.isArray(vector) || vector.length !== 3 || !vector.every(isFiniteNumber)) return false;
    if (vector.some(value => value < -32 || value > 64)) return false;
  }
  if ((cube.to as number[]).some((value, axis) => value <= (cube.from as number[])[axis])) return false;
  if (cube.uv !== undefined) {
    if (!cube.uv || typeof cube.uv !== "object") return false;
    const faces = cube.uv as Record<string, unknown>;
    for (const face of Object.keys(faces)) {
      if (!(FACES as readonly string[]).includes(face)) return false;
      const rect = faces[face];
      if (!Array.isArray(rect) || rect.length !== 4 || !rect.every(isFiniteNumber)) return false;
      if (rect.some(value => value < 0 || value > 16)) return false;
      if (rect[2] === rect[0] || rect[3] === rect[1]) return false;
    }
  }
  return true;
}

/** Voxelized sprites are built in the browser from the uploaded pixels, then stored as-is. */
function validSpriteModel(input: unknown): input is VoxelModel {
  if (!input || typeof input !== "object") return false;
  const model = input as Record<string, unknown>;
  if (typeof model.name !== "string" || !model.name.trim() || model.name.length > 60) return false;
  if (typeof model.slug !== "string" || !/^[a-z0-9_]{3,40}$/.test(model.slug)) return false;
  if (typeof model.kind !== "string" || !(model.kind in KIND_INFO)) return false;
  if (model.pose !== "sprite") return false;
  if (!Array.isArray(model.palette) || model.palette.length !== 8 || !model.palette.every(isHexColor)) return false;
  if (!Array.isArray(model.cubes) || model.cubes.length === 0 || model.cubes.length > 4096 || !model.cubes.every(validCube)) return false;
  const resolution = model.resolution;
  if (!isFiniteNumber(resolution) || resolution < 1 || resolution > 512) return false;
  if (!isFiniteNumber(model.seed)) return false;
  if (typeof model.baseItem !== "string" || !/^(?:paper|stick|bow|trident|crossbow|flint_and_steel|enchanted_book|(?:wooden|stone|iron|diamond|netherite|golden)_(?:sword|pickaxe|axe|shovel|hoe))$/.test(model.baseItem)) return false;
  if (model.variants !== undefined) return false;
  return validTexture(model.texture) && model.texture.kind === "sprite";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "タグと生成設定を指定してください。" }, { status: 400 });
    }
    if (!Array.isArray(body.tags) || body.tags.some((tag: unknown) => typeof tag !== "string")) {
      return Response.json({ error: "タグの配列を指定してください。" }, { status: 400 });
    }
    const tags = normalizeTags(body.tags);
    if (!tags.length || tags.length > 24 || tags.some(tag => tag.length > 64)) {
      return Response.json({ error: "タグは1〜24個、各64文字以内で入力してください。" }, { status: 400 });
    }
    if (!validSettings(body.settings)) return Response.json({ error: "生成設定を確認してください。" }, { status: 400 });
    const { format, resolution, detail, palette, design } = body.settings as GenerationSettings;
    const normalized = sanitizeExtras(body.settings.extras);
    const settings: GenerationSettings = { format, resolution, detail, palette, ...(design ? { design } : {}), ...(normalized ? { extras: normalized } : {}) };

    if (body.mode === "sprite") {
      if (!validSpriteModel(body.model)) return Response.json({ error: "立体化したモデルの形式が正しくありません。もう一度お試しください。" }, { status: 400 });
      const model = body.model;
      const [saved] = await db.insert(voxelModels).values({ name: model.name, tags, settings, model }).returning();
      return Response.json({ model: saved }, { status: 201 });
    }

    const texture = body.texture === undefined || body.texture === null ? null : validTexture(body.texture) ? body.texture : undefined;
    if (texture === undefined) return Response.json({ error: "テクスチャの形式が正しくありません。PNG画像で、512px以内・4MB以内のものを指定してください。" }, { status: 400 });
    const model = generateModel(tags, settings, 0, texture);
    const [saved] = await db.insert(voxelModels).values({ name: model.name, tags, settings, model }).returning();
    return Response.json({ model: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof PromptError) return Response.json({ error: error.message }, { status: 422 });
    if (error instanceof SyntaxError) return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
    console.error("Failed to generate model", error);
    return Response.json({ error: "モデルを保存できませんでした。しばらくしてからもう一度お試しください。" }, { status: 500 });
  }
}
