import { db } from "@/db";
import { models } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await db.delete(models).where(eq(models.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/models/[id] failed", error);
    return NextResponse.json({ ok: false, error: "failed to delete model" }, { status: 500 });
  }
}
