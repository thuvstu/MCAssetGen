import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";

export const dynamic = "force-dynamic";

const MAX_THUMB = 200_000;

export async function GET() {
  try {
    const rows = await db.select().from(models).orderBy(desc(models.createdAt)).limit(60);
    return NextResponse.json({ models: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e), models: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = String(body?.name ?? "無銘の器").trim().slice(0, 40) || "無銘の器";
    const kind = String(body?.kind ?? "sword").slice(0, 16);
    const params = body?.params && typeof body.params === "object" ? (body.params as Record<string, unknown>) : {};
    const t = typeof body?.thumbnail === "string" ? body.thumbnail : null;
    const thumbnail = t && t.startsWith("data:image/") && t.length <= MAX_THUMB ? t : null;
    const inserted = await db.insert(models).values({ name, kind, params, thumbnail }).returning();
    return NextResponse.json({ model: inserted[0] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });
    await db.delete(models).where(eq(models.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
