import { db } from "@/db";
import { models } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(models).orderBy(desc(models.createdAt)).limit(60);
    return NextResponse.json({ ok: true, models: rows });
  } catch (error) {
    console.error("GET /api/models failed", error);
    return NextResponse.json({ ok: false, error: "failed to list models" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : "無名の武具";
    const modelType = typeof body.modelType === "string" ? body.modelType : "sword";
    const seed = typeof body.seed === "number" ? body.seed : 0;
    const spec = body.spec && typeof body.spec === "object" ? body.spec : null;
    if (!spec) {
      return NextResponse.json({ ok: false, error: "spec is required" }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await db.insert(models).values({ id, name, modelType, seed: String(seed), spec });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("POST /api/models failed", error);
    return NextResponse.json({ ok: false, error: "failed to save model" }, { status: 500 });
  }
}
