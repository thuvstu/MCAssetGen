import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { voxelModels } from "@/db/schema";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const modelId = Number(id);
    if (!modelId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    if (body.incrementDownload) {
      const [updated] = await db
        .update(voxelModels)
        .set({
          downloadsCount: sql`${voxelModels.downloadsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(voxelModels.id, modelId))
        .returning();
      return NextResponse.json({ model: updated });
    }

    const [updated] = await db
      .update(voxelModels)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.paramsJson ? { paramsJson: body.paramsJson } : {}),
        ...(body.elementsJson ? { elementsJson: body.elementsJson } : {}),
        ...(body.displayJson ? { displayJson: body.displayJson } : {}),
        ...(body.textureDataUrl ? { textureDataUrl: body.textureDataUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(voxelModels.id, modelId))
      .returning();

    return NextResponse.json({ model: updated });
  } catch (error) {
    console.error("PATCH /api/models/[id] error:", error);
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const modelId = Number(id);
    if (!modelId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await db.delete(voxelModels).where(eq(voxelModels.id, modelId));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/models/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
