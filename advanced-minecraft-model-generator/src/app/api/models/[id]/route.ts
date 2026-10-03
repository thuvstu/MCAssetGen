import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedModels } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [row] = await db
      .select()
      .from(savedModels)
      .where(eq(savedModels.id, Number(id)))
      .limit(1);
    if (!row) return NextResponse.json({ success: false, error: "not found" }, { status: 404 });
    return NextResponse.json({ success: true, model: row });
  } catch {
    return NextResponse.json({ success: false, error: "read failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    const counter =
      action === "like"
        ? { likesCount: sql`${savedModels.likesCount} + 1` }
        : action === "download"
        ? { downloadsCount: sql`${savedModels.downloadsCount} + 1` }
        : null;

    if (!counter) {
      return NextResponse.json({ success: false, error: "unknown action" }, { status: 400 });
    }

    const [row] = await db
      .update(savedModels)
      .set({ ...counter, updatedAt: new Date() })
      .where(eq(savedModels.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, model: row });
  } catch {
    return NextResponse.json({ success: false, error: "update failed" }, { status: 500 });
  }
}
