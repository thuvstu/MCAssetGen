import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { modelsTable } from "@/db/schema";
import { generateTemplate } from "@/lib/generators/templates";
import { DEFAULT_PRESETS, deterministicPresetLikes, PRESET_TEXTURE_PLACEHOLDER } from "@/lib/model/presets";
import { isOneOf, parsePersistedModelPayload } from "@/lib/model/modelUtils";
import { MODEL_CATEGORIES } from "@/types/model";

export const dynamic = "force-dynamic";

async function ensurePresetModels(): Promise<void> {
  const savedPresets = await db
    .select({ id: modelsTable.id })
    .from(modelsTable)
    .where(eq(modelsTable.isPreset, true))
    .limit(1);

  if (savedPresets.length > 0) return;

  await Promise.all(
    DEFAULT_PRESETS.map(async (preset, index) => {
      const model = generateTemplate(preset.type, preset.theme, 32);
      await db.insert(modelsTable).values({
        name: model.name,
        description: model.description,
        category: preset.category,
        theme: preset.theme,
        textureResolution: model.textureWidth,
        modelData: model,
        textureDataUrl: PRESET_TEXTURE_PLACEHOLDER,
        isPreset: true,
        likes: deterministicPresetLikes(index),
      });
    }),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error";
}

export async function GET(request: NextRequest) {
  try {
    await ensurePresetModels();
    const categoryParam = new URL(request.url).searchParams.get("category");
    const category = isOneOf(categoryParam, MODEL_CATEGORIES) ? categoryParam : null;

    const models = category
      ? await db
          .select()
          .from(modelsTable)
          .where(eq(modelsTable.category, category))
          .orderBy(desc(modelsTable.createdAt))
      : await db.select().from(modelsTable).orderBy(desc(modelsTable.createdAt));

    return NextResponse.json({ success: true, models });
  } catch (error) {
    console.error("GET /api/models failed", error);
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = parsePersistedModelPayload(body);

    if (!parsed.data) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const [model] = await db
      .insert(modelsTable)
      .values({
        ...parsed.data,
        isPreset: false,
      })
      .returning();

    return NextResponse.json({ success: true, model }, { status: 201 });
  } catch (error) {
    console.error("POST /api/models failed", error);
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}
