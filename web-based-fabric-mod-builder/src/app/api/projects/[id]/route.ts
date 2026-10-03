import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import type { ModProject } from "@/lib/mod/types";

export const dynamic = "force-dynamic";

function parseId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id: row.id, name: row.name, data: row.data, updatedAt: row.updatedAt });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = (await req.json().catch(() => null)) as { data?: ModProject } | null;
  if (!body?.data?.meta) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const [row] = await db
    .update(projects)
    .set({ data: body.data, name: body.data.meta.name || "Untitled", updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning({ id: projects.id, updatedAt: projects.updatedAt });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}
