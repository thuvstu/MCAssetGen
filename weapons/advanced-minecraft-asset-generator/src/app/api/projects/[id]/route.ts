import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { validateProjectInput } from "@/lib/editor/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, Number(id)));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const input = validateProjectInput(body);
  if (!input) return NextResponse.json({ error: "invalid project payload" }, { status: 400 });
  const [row] = await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(projects.id, Number(id)))
    .returning();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(projects).where(eq(projects.id, Number(id)));
  return NextResponse.json({ ok: true });
}
