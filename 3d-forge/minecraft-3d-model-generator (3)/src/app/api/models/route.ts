import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, pool } from "@/db";
import { voxelModels } from "@/db/schema";
import { buildSeedPresetModels } from "@/lib/seedPresets";

async function ensureTableAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS voxel_models (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      archetype TEXT NOT NULL,
      material_preset TEXT NOT NULL,
      atlas_resolution INTEGER NOT NULL DEFAULT 32,
      params_json JSONB NOT NULL,
      elements_json JSONB NOT NULL,
      display_json JSONB NOT NULL,
      texture_data_url TEXT NOT NULL,
      is_preset BOOLEAN NOT NULL DEFAULT false,
      downloads_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const seeds = buildSeedPresetModels();
  const existingRows = await db.select({ slug: voxelModels.slug }).from(voxelModels);
  const existingSlugs = new Set(existingRows.map((r) => r.slug));

  const missingSeeds = seeds.filter((s) => !existingSlugs.has(s.slug));
  if (missingSeeds.length > 0) {
    await db.insert(voxelModels).values(missingSeeds);
  }
}

export async function GET() {
  try {
    await ensureTableAndSeed();
    const rows = await db
      .select()
      .from(voxelModels)
      .orderBy(desc(voxelModels.isPreset), desc(voxelModels.createdAt));
    return NextResponse.json({ models: rows });
  } catch (error) {
    console.error("GET /api/models error:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureTableAndSeed();
    const body = await request.json();

    const {
      name,
      slug,
      description,
      archetype,
      materialPreset,
      atlasResolution,
      paramsJson,
      elementsJson,
      displayJson,
      textureDataUrl,
    } = body;

    if (!name || !archetype || !elementsJson || !textureDataUrl) {
      return NextResponse.json(
        { error: "Missing required model fields" },
        { status: 400 }
      );
    }

    const cleanSlug =
      (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "") || `custom_${archetype}_${Date.now()}`;

    const [inserted] = await db
      .insert(voxelModels)
      .values({
        name: String(name).trim(),
        slug: cleanSlug,
        description: String(description || "Custom VoxelForge 3D Model"),
        archetype: String(archetype),
        materialPreset: String(materialPreset || "diamond"),
        atlasResolution: Number(atlasResolution) || 32,
        paramsJson,
        elementsJson,
        displayJson,
        textureDataUrl: String(textureDataUrl),
        isPreset: false,
        downloadsCount: 0,
      })
      .returning();

    return NextResponse.json({ model: inserted }, { status: 201 });
  } catch (error) {
    console.error("POST /api/models error:", error);
    return NextResponse.json(
      { error: "Failed to save 3D model" },
      { status: 500 }
    );
  }
}
